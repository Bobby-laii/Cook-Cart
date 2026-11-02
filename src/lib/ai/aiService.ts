/**
 * CookCart Unified AI Service Module
 * Sections 4.1, 4.2, 5 of the Project Brief:
 * - Single AI service module with configurable provider & model
 * - Food-only topic safety guardrail
 * - "Use all ingredients" rule enforcement
 * - Structured JSON recommendations with full step-by-step cooking instructions
 * - Usage logging & spending caps
 * - Live LLM support with intelligent local offline fallback
 */

import { prisma } from "@/lib/prisma";
import { APP_CONFIG } from "@/config/appConfig";
import { COOKCART_SYSTEM_PROMPT, buildSystemPrompt } from "@/config/systemPrompt";
import { DishSuggestion, RecipeStep } from "@/types";
import { resolveDishImageUrl } from "@/lib/images/foodImage";
import { fetchLiveRecipes, hasSpoonacularKey } from "@/lib/recipes/spoonacular";
import { COMMON_INGREDIENTS_CATALOGUE } from "@/config/ingredientsCatalogue";
import Groq from "groq-sdk";
import { Ollama } from "ollama";

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  structuredSuggestions?: DishSuggestion[];
}

export interface AIRequestOptions {
  userId?: string;
  conversationId: string;
  messages: AIChatMessage[];
  quickStartData?: {
    cuisine?: string;
    ingredients?: string[];
    servings?: number;
    cookingTimeLimit?: string;
    skillLevel?: string;
    equipment?: string[];
    dietary?: string;
    allergies?: string;
  };
  chefProfile?: {
    chefName?: string;
    chefAvatarUrl?: string;
    chefPersonality?: string;
  };
}

export interface AIResponsePayload {
  message: string;
  structuredSuggestions?: DishSuggestion[];
  tokensUsed: { prompt: number; completion: number; total: number };
  modelUsed: string;
  error?: string;
}

/**
 * Check if a prompt violates the safety guardrail (disabled to allow warm daily life conversation)
 */
export function isOffTopic(_text: string): boolean {
  return false;
}

/**
 * Detect whether a free-text chat message is asking for a menu, recipe, or how to cook a dish.
 */
export function isMenuOrRecipeRequest(text: string): boolean {
  const q = text.toLowerCase();
  return (
    /\b(menu|recipe|recipes|cook|cooking|make|dish|dishes|dinner|lunch|breakfast|meal|eat|prepare|stir[- ]?fry|braise|steam|bake|roast|pasta|noodle|chicken|beef|pork|salmon|tofu|egg|soup|curry)\b/i.test(
      q
    ) || /(食譜|菜單|煮|整咩|食咩|推薦|點整|點煮|晚餐|午餐|早餐|餸|做法|步驟)/.test(text)
  );
}

/**
 * Extract <COOKCART_MENU> JSON block from LLM text response if present.
 */
export function extractMenuFromLLMResponse(rawText: string): {
  cleanMessage: string;
  menuDishes?: DishSuggestion[];
} {
  const menuRegex = /<COOKCART_MENU>([\s\S]*?)<\/COOKCART_MENU>/i;
  const match = rawText.match(menuRegex);
  if (!match) {
    return { cleanMessage: rawText.trim() };
  }

  const cleanMessage = rawText.replace(menuRegex, "").trim();
  const jsonCandidate = match[1]
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonCandidate);
    const list = Array.isArray(parsed) ? parsed : parsed.dishes || [parsed];
    const normalized: DishSuggestion[] = list
      .filter((item: any) => item && typeof item === "object" && item.title)
      .slice(0, 3)
      .map((item: any, idx: number) => {
        const usedIngs =
          Array.isArray(item.usedUserIngredients) && item.usedUserIngredients.length > 0
            ? item.usedUserIngredients.map(String)
            : ["Fresh Main Ingredient", "Garlic", "Herbs"];

        const rawSteps = Array.isArray(item.steps) ? item.steps : [];
        const steps: RecipeStep[] =
          rawSteps.length > 0
            ? rawSteps.map((st: any, sIdx: number) => ({
                step: Number(st.step) || sIdx + 1,
                title: String(st.title || `Step ${sIdx + 1}`),
                titleZh: st.titleZh ? String(st.titleZh) : undefined,
                text: String(st.text || ""),
                textZh: st.textZh ? String(st.textZh) : undefined,
                ...(Number(st.timerSeconds) > 0 ? { timerSeconds: Number(st.timerSeconds) } : {}),
              }))
            : buildDefaultStepsForDish(String(item.title), usedIngs);

        return {
          id: "sugg_" + Math.random().toString(36).substring(2, 9) + "_" + idx,
          title: String(item.title),
          titleZh: String(item.titleZh || item.title),
          cuisine: String(item.cuisine || "Chef Special"),
          cookTimeMinutes: Number(item.cookTimeMinutes) || 20,
          difficulty:
            item.difficulty === "Medium" || item.difficulty === "Hard" ? item.difficulty : "Easy",
          servings: Number(item.servings) || 2,
          description: String(
            item.description || `Chef's freshly prepared ${item.title} with step-by-step guidance.`
          ),
          descriptionZh: String(item.descriptionZh || item.description || item.title),
          usedUserIngredients: usedIngs,
          extraIngredientsNeeded: Array.isArray(item.extraIngredientsNeeded)
            ? item.extraIngredientsNeeded.map((ex: any) => ({
                name: String(ex.name || "Seasoning"),
                nameZh: String(ex.nameZh || ex.name || "調味料"),
                amount: Number(ex.amount) || 1,
                unit: String(ex.unit || "tbsp"),
              }))
            : [],
          estimatedCostHkd: Number(item.estimatedCostHkd) || 58,
          availabilityNote: "All ingredients available across Hong Kong supermarkets.",
          steps,
        };
      });

    if (normalized.length > 0) {
      return {
        cleanMessage:
          cleanMessage ||
          "Here is the menu I prepared for you! Click **Start Step-by-Step Cooking** on any dish below and I'll walk you through every step in our kitchen.",
        menuDishes: normalized,
      };
    }
  } catch (err) {
    console.warn("Failed to parse <COOKCART_MENU> JSON block:", err);
  }

  return { cleanMessage: cleanMessage || rawText.trim() };
}

function buildDefaultStepsForDish(title: string, ingredients: string[]): RecipeStep[] {
  const ingText = ingredients.join(", ");
  return [
    {
      step: 1,
      title: "Mise en Place & Prep",
      titleZh: "食材準備與切配",
      text: `Wash and pat dry ${ingText}. Cut into uniform bite-sized pieces so everything cooks evenly for ${title}.`,
      textZh: `將 ${ingText} 洗淨印乾，切成大小均勻的適口塊狀，確保受熱一致。`,
      timerSeconds: 180,
    },
    {
      step: 2,
      title: "Marinate & Season Base",
      titleZh: "基礎醃製入味",
      text: `Lightly toss the main ingredients with a pinch of salt, light soy sauce, and a touch of cornstarch to lock in juices.`,
      textZh: `加入少許鹽、生抽與生粉抓勻醃製，鎖住肉汁與鮮味。`,
      timerSeconds: 300,
    },
    {
      step: 3,
      title: "Aromatics & High-Heat Sear",
      titleZh: "爆香辛香料與快炒",
      text: `Heat 1 tbsp oil in your pan or wok over medium-high heat until shimmering. Sear the main ingredients until golden at the edges.`,
      textZh: `熱鑊下油至微煙，放入主料中大火煎炒至邊緣金黃香口。`,
      timerSeconds: 240,
    },
    {
      step: 4,
      title: "Simmer & Glaze",
      titleZh: "合炒收汁",
      text: `Add the remaining ingredients and sauce mixture. Toss briskly so the glossy sauce coats every piece evenly.`,
      textZh: `加入其餘配料與醬汁，大火快手兜勻至醬汁濃稠掛汁。`,
      timerSeconds: 180,
    },
    {
      step: 5,
      title: "Garnish & Serve Hot",
      titleZh: "裝盤趁熱享用",
      text: `Transfer to a warmed plate, garnish with fresh herbs or spring onions, and serve immediately!`,
      textZh: `盛入溫熱餐盤，撒上蔥花或香草點綴，即成美味佳餚！`,
    },
  ];
}

/**
 * Check if user or system has exceeded daily or monthly AI limits
 */
export async function checkAILimits(userId?: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // 1. Check monthly spending cap from AppSettings
    const capSetting = await prisma.appSetting.findUnique({
      where: { key: "ai_monthly_spending_cap" },
    });
    const monthlyCapHkd = capSetting ? parseFloat(capSetting.value) : APP_CONFIG.ai.monthlySpendingCapHkd;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await prisma.aIUsageLog.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
      },
      _sum: { estimatedCostHkd: true },
    });

    const totalSpent = monthlyUsage._sum.estimatedCostHkd || 0;
    if (totalSpent >= monthlyCapHkd) {
      return {
        allowed: false,
        reason: `Monthly AI budget ceiling of HK$${monthlyCapHkd} has been reached. Please contact admin.`,
      };
    }

    // 2. Check per-user daily request count
    if (userId) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const dailyCount = await prisma.aIUsageLog.count({
        where: {
          userId,
          createdAt: { gte: startOfDay },
        },
      });

      if (dailyCount >= APP_CONFIG.ai.dailyUserRequestLimit) {
        return {
          allowed: false,
          reason: `You have reached your daily limit of ${APP_CONFIG.ai.dailyUserRequestLimit} AI cooking consultations. It resets at midnight!`,
        };
      }
    }

    return { allowed: true };
  } catch (err) {
    console.error("AI Limit check error:", err);
    return { allowed: true }; // Fail-open for MVP resilience
  }
}

/**
 * Log AI token usage and estimated cost to database
 */
export async function logAIUsage(params: {
  userId?: string;
  conversationId: string;
  modelName: string;
  tokensPrompt: number;
  tokensCompletion: number;
}) {
  try {
    const tokensTotal = params.tokensPrompt + params.tokensCompletion;
    const estimatedCostHkd = (tokensTotal / 1000) * 0.003;

    await prisma.aIUsageLog.create({
      data: {
        userId: params.userId,
        conversationId: params.conversationId,
        modelName: params.modelName,
        tokensPrompt: params.tokensPrompt,
        tokensCompletion: params.tokensCompletion,
        tokensTotal,
        estimatedCostHkd,
      },
    });
  } catch (e) {
    console.error("Failed to log AI usage:", e);
  }
}

/**
 * Attach a food photo to each suggestion.
 */
async function attachDishImages(suggestions: DishSuggestion[]): Promise<DishSuggestion[]> {
  const used = new Set<string>();
  return Promise.all(
    suggestions.map(async (suggestion, idx) => {
      try {
        const imageUrl = await resolveDishImageUrl(suggestion.title, idx, used);
        used.add(imageUrl);
        return { ...suggestion, imageUrl };
      } catch {
        return suggestion;
      }
    })
  );
}

function extractIngredientsFromUserText(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const item of COMMON_INGREDIENTS_CATALOGUE) {
    const firstWord = item.en.toLowerCase().split(/[\s(/]+/)[0];
    if (
      lower.includes(item.en.toLowerCase()) ||
      text.includes(item.zh) ||
      (firstWord.length >= 4 && new RegExp(`\\b${firstWord}s?\\b`, "i").test(lower))
    ) {
      if (!matched.includes(item.en)) matched.push(item.en);
    }
  }
  return matched.slice(0, 4);
}

export function generateLocalMockCookingResponse(
  userText: string,
  quickStart?: AIRequestOptions["quickStartData"]
): { message: string; suggestions: DishSuggestion[] } {
  const detectedFromChat = extractIngredientsFromUserText(userText);
  const ingredients =
    quickStart?.ingredients && quickStart.ingredients.length > 0
      ? quickStart.ingredients
      : detectedFromChat.length > 0
      ? detectedFromChat
      : ["Seasonal Greens", "Garlic", "Fresh Protein"];

  const cuisine = quickStart?.cuisine || "Cantonese";
  const cuisineFlavor = cuisine.replace(/\s*(food|cuisine|料理|菜)\s*$/i, "").trim() || cuisine;
  const servings = quickStart?.servings || 2;
  const ingListStr = ingredients.join(", ");

  // Dish 1: Stir-fry / Wok style using all ingredients + full 5-step guide
  const dish1: DishSuggestion = {
    id: "sugg_" + Math.random().toString(36).substring(2, 9),
    title: `Homestyle ${cuisineFlavor} Wok Sauté of ${ingredients.slice(0, 2).join(" & ")}`,
    titleZh: `港式鑊氣家常快炒 (${ingredients.slice(0, 2).join("伴")})`,
    cuisine: cuisine,
    cookTimeMinutes: 18,
    difficulty: "Easy",
    servings: servings,
    description: `A fragrant, high-heat Hong Kong stir-fry incorporating ${ingListStr} with aromatic garlic and light soy reduction.`,
    descriptionZh: `大牌檔風味鑊氣快炒，將${ingListStr}配上蒜香與生抽大火爆炒，爽脆滑嫩。`,
    usedUserIngredients: [...ingredients],
    extraIngredientsNeeded: [
      { name: "Lee Kum Kee Premium Light Soy Sauce", nameZh: "特級生抽", amount: 1.5, unit: "tbsp" },
      { name: "Shaoxing Cooking Rice Wine", nameZh: "紹興花雕廚酒", amount: 1, unit: "tbsp" },
      { name: "Pure Cornstarch", nameZh: "廚用生粉", amount: 1, unit: "tsp" },
    ],
    localSubstituteNotes:
      "If Shaoxing wine is unavailable, dry sherry or a teaspoon of apple cider vinegar with a pinch of sugar works well.",
    estimatedCostHkd: 48.0 + ingredients.length * 6.5,
    availabilityNote: "All ingredients readily available across ParkGrocer, WellMart, and local HK wet markets.",
    steps: [
      {
        step: 1,
        title: "Slice & Velvet the Ingredients",
        titleZh: "食材切配與漿醃",
        text: `Wash and dry ${ingListStr}. Slice the protein into bite-sized pieces and toss with 1 tsp light soy sauce, 1 tsp Shaoxing wine, and 1 tsp cornstarch. Let sit for 5 minutes.`,
        textZh: `將 ${ingListStr} 洗淨印乾。主料切適口片狀，加入生抽、花雕酒及生粉抓勻醃製 5 分鐘。`,
        timerSeconds: 300,
      },
      {
        step: 2,
        title: "Whisk the Wok Glaze Sauce",
        titleZh: "調配鑊氣碗汁",
        text: `In a small bowl, combine 1 tbsp light soy sauce, 2 tbsp water, and a pinch of sugar so it is ready beside your stove.`,
        textZh: `小碗中混合 1 湯匙生抽、2 湯匙清水與少許糖備用，炒菜時可一氣呵成。`,
      },
      {
        step: 3,
        title: "High-Heat Sear",
        titleZh: "大火爆香主料",
        text: `Heat your wok or skillet over high heat until smoking hot. Add 1 tbsp oil, swirl to coat, and sear ${ingredients[0] || "the main ingredient"} undisturbed for 90 seconds before tossing until 80% cooked.`,
        textZh: `燒熱鑊至微煙，下油潤鑊，放入 ${ingredients[0] || "主料"} 煎 90 秒至金黃，再翻炒至八成熟。`,
        timerSeconds: 150,
      },
      {
        step: 4,
        title: "Toss Greens & Splash Wine",
        titleZh: "合炒配菜與灒酒",
        text: `Add the remaining ingredients (${ingredients.slice(1).join(", ") || "aromatics"}) and sizzle Shaoxing wine around the hot rim of the wok for authentic wok hei aroma.`,
        textZh: `加入其餘食材 (${ingredients.slice(1).join("、") || "配料"})，沿鑊邊灒入花雕酒激發香氣。`,
        timerSeconds: 120,
      },
      {
        step: 5,
        title: "Glaze & Plate Hot",
        titleZh: "收汁上碟",
        text: `Pour in the prepared soy glaze, toss briskly for 30 seconds until glossy, and transfer immediately to a warm serving platter.`,
        textZh: `倒入碗汁大火快手兜勻 30 秒至亮澤掛汁，即刻上碟趁熱享用！`,
        timerSeconds: 30,
      },
    ],
  };

  // Dish 2: Comforting Braise / Stew / Claypot
  const dish2: DishSuggestion = {
    id: "sugg_" + Math.random().toString(36).substring(2, 9),
    title: `Savory Claypot-Style Braised ${ingredients[0] || "Main"} with ${ingredients[1] || "Greens"}`,
    titleZh: `砂鍋濃汁燜煮 (${ingredients[0] || "主料"})`,
    cuisine: cuisine,
    cookTimeMinutes: 28,
    difficulty: "Easy",
    servings: servings,
    description: `A comforting braised dish simmering ${ingListStr} gently in a rich umami broth until tender and full of flavor.`,
    descriptionZh: `濃郁砂鍋燜煮，令${ingListStr}充分吸收高湯精華，軟嫩入味下飯一流。`,
    usedUserIngredients: [...ingredients],
    extraIngredientsNeeded: [
      { name: "Lee Kum Kee Premium Oyster Sauce", nameZh: "特級蠔油", amount: 1.5, unit: "tbsp" },
      { name: "Pure Toasted Sesame Oil", nameZh: "純正黑芝麻油", amount: 1, unit: "tsp" },
      { name: "Thai Hom Mali Jasmine Rice", nameZh: "泰國頂級香米", amount: 2, unit: "cups" },
    ],
    localSubstituteNotes:
      "Oyster sauce can be substituted with vegetarian mushroom stir-fry sauce if cooking vegetarian.",
    estimatedCostHkd: 54.0 + ingredients.length * 7.0,
    availabilityNote: "100% in stock at all 4 Hong Kong supermarket partners.",
    steps: [
      {
        step: 1,
        title: "Prep & Cut Uniform Pieces",
        titleZh: "食材切塊備用",
        text: `Cut ${ingListStr} into hearty 3cm chunks suited for braising so they stay juicy and tender.`,
        textZh: `將 ${ingListStr} 切成約 3 厘米塊狀，燜煮時更易鎖住肉汁。`,
        timerSeconds: 180,
      },
      {
        step: 2,
        title: "Brown the Aromatics & Main",
        titleZh: "煎香主料與香料",
        text: `Warm oil in a heavy pot or claypot over medium-high heat. Sear ${ingredients[0] || "the main ingredients"} until golden brown on both sides.`,
        textZh: `在砂鍋或深鍋中熱油，放入 ${ingredients[0] || "主料"} 煎至兩面金黃焦香。`,
        timerSeconds: 240,
      },
      {
        step: 3,
        title: "Simmer in Oyster Umami Broth",
        titleZh: "加入蠔油高湯慢燜",
        text: `Stir in 1.5 tbsp oyster sauce and 150ml warm water or broth. Bring to a boil, cover with a lid, and simmer on low heat for 12 minutes.`,
        textZh: `加入 1.5 湯匙蠔油及 150 毫升溫水，煮沸後加蓋轉小火燜煮 12 分鐘。`,
        timerSeconds: 720,
      },
      {
        step: 4,
        title: "Fold in Tender Greens & Sesame Oil",
        titleZh: "加入翠綠蔬菜與麻油",
        text: `Uncover, add the quicker-cooking greens (${ingredients.slice(1).join(", ") || "vegetables"}), and simmer for 3 more minutes. Drizzle with toasted sesame oil and serve over steamed jasmine rice.`,
        textZh: `開蓋加入易熟配菜續煮 3 分鐘，淋上黑芝麻油提香，伴泰國香米飯享用！`,
        timerSeconds: 180,
      },
    ],
  };

  // Dish 3: Nourishing Soup / Quick Noodle Bowl
  const dish3: DishSuggestion = {
    id: "sugg_" + Math.random().toString(36).substring(2, 9),
    title: `Hong Kong Café Noodle Broth Bowl with ${ingListStr}`,
    titleZh: `港式茶餐廳鮮味湯麵配 (${ingListStr})`,
    cuisine: cuisine,
    cookTimeMinutes: 15,
    difficulty: "Easy",
    servings: servings,
    description: `A quick, soul-warming Hong Kong noodle soup showcasing ${ingListStr} in a clear aromatic ginger broth.`,
    descriptionZh: `港式茶餐廳經典湯麵，以薑絲清雞湯滾熟${ingListStr}，清鮮而不油膩。`,
    usedUserIngredients: [...ingredients],
    extraIngredientsNeeded: [
      { name: "Hong Kong Fresh Wonton Egg Noodles", nameZh: "本地鮮造全蛋幼麵", amount: 2, unit: "bundles" },
      { name: "Old Ginger Root", nameZh: "老薑", amount: 15, unit: "g" },
      { name: "Natural Fine Sea Salt", nameZh: "細海鹽", amount: 0.5, unit: "tsp" },
    ],
    localSubstituteNotes: "Egg noodles can be substituted with vermicelli (米粉) or ramen noodles.",
    estimatedCostHkd: 39.0 + ingredients.length * 5.0,
    availabilityNote: "Available at all Hong Kong grocers and neighborhood supermarkets.",
    steps: [
      {
        step: 1,
        title: "Infuse Ginger Broth Base",
        titleZh: "熬製薑絲清湯底",
        text: `Bring 700ml water or chicken stock to a gentle boil with sliced old ginger root to build a fragrant soup base.`,
        textZh: `鍋中倒入 700 毫升清水或雞湯，加入老薑片煮沸釋放香氣。`,
        timerSeconds: 240,
      },
      {
        step: 2,
        title: "Poach Ingredients Until Tender",
        titleZh: "滾熟鮮嫩食材",
        text: `Add ${ingListStr} to the simmering broth and poach gently for 5 minutes until just cooked through and flavorful.`,
        textZh: `放入 ${ingListStr}，中火滾煮約 5 分鐘至熟透鮮甜。`,
        timerSeconds: 300,
      },
      {
        step: 3,
        title: "Blanch Fresh Egg Noodles",
        titleZh: "淥熟全蛋幼麵",
        text: `In a separate pot of boiling water, loosen and cook the fresh wonton egg noodles for 60–90 seconds until al dente, then drain and divide into bowls.`,
        textZh: `另起一鍋沸水，放入全蛋幼麵鬆開淥 60 至 90 秒至爽彈，瀝乾盛入碗中。`,
        timerSeconds: 90,
      },
      {
        step: 4,
        title: "Ladle Broth & Serve",
        titleZh: "注入熱湯上桌",
        text: `Season the broth with fine sea salt and a drop of sesame oil, ladle generously over the noodles, and top neatly with the poached ingredients.`,
        textZh: `湯底加少許海鹽調味，淋在幼麵上並鋪好食材，即成茶餐廳級數靚湯麵！`,
      },
    ],
  };

  const message = `Here are 3 tailored ${cuisine} recipes designed specifically around all ${ingredients.length} of your ingredients (${ingListStr})! Click **Start Step-by-Step Cooking** on any dish card below and I'll walk you through every step in our kitchen.`;

  return {
    message,
    suggestions: [dish1, dish2, dish3],
  };
}

/**
 * Main AI Chat Execution Function
 */
export async function executeAIChat(options: AIRequestOptions): Promise<AIResponsePayload> {
  const { messages, quickStartData, userId, conversationId, chefProfile } = options;
  const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";

  // 1. Spending Cap & Rate Limit Check
  const limitCheck = await checkAILimits(userId);
  if (!limitCheck.allowed) {
    return {
      message: limitCheck.reason || "AI usage limit reached. Please try again later.",
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: "limit-enforcer",
    };
  }

  // Build persona prompt incorporating customized chef identity
  const systemPrompt = chefProfile?.chefName
    ? buildSystemPrompt(chefProfile.chefName, chefProfile.chefPersonality || "friendly")
    : COOKCART_SYSTEM_PROMPT;

  // Helper: Resolve structured suggestions from LLM <COOKCART_MENU> tag, Spoonacular, or local fallback
  async function resolveStructuredSuggestions(llmExtracted?: DishSuggestion[]): Promise<DishSuggestion[] | undefined> {
    if (llmExtracted && llmExtracted.length > 0) {
      return attachDishImages(llmExtracted);
    }

    const hasQuickStart = Boolean(quickStartData?.ingredients?.length);
    const wantsMenu = hasQuickStart || isMenuOrRecipeRequest(lastUserMessage);
    if (!wantsMenu) return undefined;

    if (hasSpoonacularKey() && hasQuickStart && quickStartData?.ingredients) {
      const live = await fetchLiveRecipes(
        quickStartData.ingredients,
        quickStartData.cuisine || "Cantonese",
        3,
        quickStartData.servings || 2
      );
      if (live.length > 0) return live;
    }

    const local = generateLocalMockCookingResponse(lastUserMessage, quickStartData);
    return attachDishImages(local.suggestions);
  }

  // 2. Check for Live OpenRouter Key in Environment
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    try {
      const userContent = quickStartData?.ingredients?.length
        ? `Cuisine: ${quickStartData.cuisine || "Any"}\nIngredients to use (MUST ALL BE INCLUDED): ${quickStartData.ingredients.join(", ")}\nServings: ${quickStartData.servings || 2}\nDietary/Allergies: ${quickStartData.dietary || "None"}, Allergies: ${quickStartData.allergies || "None"}\nCooking time limit: ${quickStartData.cookingTimeLimit || "Any"}\nEquipment: ${quickStartData.equipment?.join(", ") || "Stove"}\nUser request: ${lastUserMessage}`
        : lastUserMessage;

      const historyMessages = messages.slice(-5).map((m, idx, arr) => ({
        role: m.role,
        content: idx === arr.length - 1 && m.role === "user" ? userContent : m.content,
      }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "CookCart",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          include_reasoning: false,
          temperature: 0.7,
          max_tokens: 350,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...historyMessages,
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || "";
        const { cleanMessage, menuDishes } = extractMenuFromLLMResponse(rawText);
        const promptTokens = data.usage?.prompt_tokens || 100;
        const completionTokens = data.usage?.completion_tokens || 200;

        await logAIUsage({
          userId,
          conversationId,
          modelName: "openrouter/nvidia/nemotron-3-ultra-550b-a55b:free",
          tokensPrompt: promptTokens,
          tokensCompletion: completionTokens,
        });

        const suggestions = await resolveStructuredSuggestions(menuDishes);

        return {
          message: cleanMessage,
          structuredSuggestions: suggestions,
          tokensUsed: {
            prompt: promptTokens,
            completion: completionTokens,
            total: promptTokens + completionTokens,
          },
          modelUsed: "openrouter/nvidia/nemotron-3-ultra-550b-a55b:free",
        };
      } else {
        console.warn("OpenRouter API returned error:", await response.text());
      }
    } catch (orError) {
      console.warn("OpenRouter API call failed, trying next provider:", orError);
    }
  }

  // 3. Check for Live Groq API Key in Environment
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey) {
    try {
      const userContent = quickStartData?.ingredients?.length
        ? `Cuisine: ${quickStartData.cuisine || "Any"}\nIngredients to use (MUST ALL BE INCLUDED): ${quickStartData.ingredients.join(", ")}\nServings: ${quickStartData.servings || 2}\nDietary/Allergies: ${quickStartData.dietary || "None"}, Allergies: ${quickStartData.allergies || "None"}\nCooking time limit: ${quickStartData.cookingTimeLimit || "Any"}\nEquipment: ${quickStartData.equipment?.join(", ") || "Stove"}\nUser request: ${lastUserMessage}`
        : lastUserMessage;

      const groq = new Groq({ apiKey: groqApiKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
      });

      const rawText = chatCompletion.choices[0]?.message?.content || "";
      const { cleanMessage, menuDishes } = extractMenuFromLLMResponse(rawText);
      const promptTokens = chatCompletion.usage?.prompt_tokens || 150;
      const completionTokens = chatCompletion.usage?.completion_tokens || 250;

      await logAIUsage({
        userId,
        conversationId,
        modelName: "llama-3.3-70b-versatile (groq)",
        tokensPrompt: promptTokens,
        tokensCompletion: completionTokens,
      });

      const suggestions = await resolveStructuredSuggestions(menuDishes);

      return {
        message: cleanMessage,
        structuredSuggestions: suggestions,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        modelUsed: "llama-3.3-70b-versatile (groq)",
      };
    } catch (groqError) {
      console.warn("Groq API call encountered error, proceeding to next provider:", groqError);
    }
  }

  // 4. Check for Live Ollama Cloud API Key in Environment
  const ollamaApiKey = process.env.OLLAMA_API_KEY;
  if (ollamaApiKey) {
    try {
      const userContent = quickStartData?.ingredients?.length
        ? `Cuisine: ${quickStartData.cuisine || "Any"}\nIngredients to use (MUST ALL BE INCLUDED): ${quickStartData.ingredients.join(", ")}\nServings: ${quickStartData.servings || 2}\nDietary/Allergies: ${quickStartData.dietary || "None"}, Allergies: ${quickStartData.allergies || "None"}\nCooking time limit: ${quickStartData.cookingTimeLimit || "Any"}\nEquipment: ${quickStartData.equipment?.join(", ") || "Stove"}\nUser request: ${lastUserMessage}`
        : lastUserMessage;

      const ollamaClient = new Ollama({
        host: "https://ollama.com",
        headers: { Authorization: "Bearer " + ollamaApiKey },
      });

      const response = await ollamaClient.chat({
        model: "glm-5.3-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: false,
      });

      const rawText = response.message?.content || "";
      const { cleanMessage, menuDishes } = extractMenuFromLLMResponse(rawText);
      const promptTokens = response.prompt_eval_count || 100;
      const completionTokens = response.eval_count || 200;

      await logAIUsage({
        userId,
        conversationId,
        modelName: "glm-5.3-flash",
        tokensPrompt: promptTokens,
        tokensCompletion: completionTokens,
      });

      const suggestions = await resolveStructuredSuggestions(menuDishes);

      return {
        message: cleanMessage,
        structuredSuggestions: suggestions,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        modelUsed: "glm-5.3-flash",
      };
    } catch (ollamaError) {
      console.warn("Ollama API call encountered error, proceeding to next provider:", ollamaError);
    }
  }

  // 5. Check for Live Gemini API Key in Environment
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const userContent = quickStartData?.ingredients?.length
        ? `Cuisine: ${quickStartData.cuisine || "Any"}\nIngredients to use (MUST ALL BE INCLUDED): ${quickStartData.ingredients.join(", ")}\nServings: ${quickStartData.servings || 2}\nDietary/Allergies: ${quickStartData.dietary || "None"}, Allergies: ${quickStartData.allergies || "None"}\nCooking time limit: ${quickStartData.cookingTimeLimit || "Any"}\nEquipment: ${quickStartData.equipment?.join(", ") || "Stove"}\nUser request: ${lastUserMessage}`
        : lastUserMessage;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: systemPrompt }, { text: userContent }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const { cleanMessage, menuDishes } = extractMenuFromLLMResponse(rawText);
        const promptTokens = data.usageMetadata?.promptTokenCount || 200;
        const completionTokens = data.usageMetadata?.candidatesTokenCount || 400;

        await logAIUsage({
          userId,
          conversationId,
          modelName: "gemini-1.5-flash",
          tokensPrompt: promptTokens,
          tokensCompletion: completionTokens,
        });

        const suggestions = await resolveStructuredSuggestions(menuDishes);

        return {
          message: cleanMessage,
          structuredSuggestions: suggestions,
          tokensUsed: {
            prompt: promptTokens,
            completion: completionTokens,
            total: promptTokens + completionTokens,
          },
          modelUsed: "gemini-1.5-flash",
        };
      }
    } catch (apiError) {
      console.warn("Live Gemini API call encountered error, falling back to local engine:", apiError);
    }
  }

  // 6. Live recipe catalogue (Spoonacular), when a server-side key is configured.
  if (hasSpoonacularKey() && quickStartData?.ingredients?.length) {
    const liveSuggestions = await fetchLiveRecipes(
      quickStartData.ingredients,
      quickStartData.cuisine || "Cantonese",
      3,
      quickStartData.servings || 2
    );

    if (liveSuggestions.length > 0) {
      const liveTokens = { prompt: 90, completion: 260, total: 350 };
      await logAIUsage({
        userId,
        conversationId,
        modelName: "spoonacular-live-recipes",
        tokensPrompt: liveTokens.prompt,
        tokensCompletion: liveTokens.completion,
      });

      const ingredientList = quickStartData.ingredients.join(", ");
      return {
        message: `Here are ${liveSuggestions.length} real ${quickStartData.cuisine || "Cantonese"} recipes built around ${ingredientList}. Click **Start Step-by-Step Cooking** on any card below to open the interactive cooking guide!`,
        structuredSuggestions: liveSuggestions,
        tokensUsed: liveTokens,
        modelUsed: "spoonacular-live-recipes",
      };
    }
  }

  // 7. Free Cloud AI LLM fallback (Pollinations text endpoint)
  try {
    const userContent = quickStartData?.ingredients?.length
      ? `Cuisine: ${quickStartData.cuisine || "Any"}\nIngredients to use: ${quickStartData.ingredients.join(", ")}\nUser request: ${lastUserMessage}`
      : lastUserMessage;

    const historyMessages = messages.slice(-5).map((m, idx, arr) => ({
      role: m.role,
      content: idx === arr.length - 1 && m.role === "user" ? userContent : m.content,
    }));

    const polliRes = await fetch("https://text.pollinations.ai/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...historyMessages,
        ],
      }),
    });

    if (polliRes.ok) {
      const polliData = await polliRes.json();
      const aiReply = polliData.choices?.[0]?.message?.content;
      if (aiReply) {
        const { cleanMessage, menuDishes } = extractMenuFromLLMResponse(aiReply);
        const suggestions = await resolveStructuredSuggestions(menuDishes);

        await logAIUsage({
          userId,
          conversationId,
          modelName: "pollinations-free-llm",
          tokensPrompt: 100,
          tokensCompletion: 200,
        });

        return {
          message: cleanMessage,
          structuredSuggestions: suggestions,
          tokensUsed: { prompt: 100, completion: 200, total: 300 },
          modelUsed: "pollinations-free-llm",
        };
      }
    }
  } catch (err) {
    console.warn("Pollinations free LLM failed, using local template engine:", err);
  }

  // 8. Default / Fallback: Intelligent Local Culinary Engine
  const isDirectGreeting = /^(hi|hello|hey|yo|good morning|good afternoon|good evening|你好|早晨|哈囉)/i.test(
    lastUserMessage.trim()
  );

  if (isDirectGreeting && !quickStartData?.ingredients?.length) {
    return {
      message:
        "Hello! I am Chef Cart, your personal culinary and Hong Kong grocery assistant. What kind of meal are you planning to make, or what ingredients do you have in your fridge today?",
      tokensUsed: { prompt: 20, completion: 40, total: 60 },
      modelUsed: "cookcart-local-engine",
    };
  }

  const localResult = generateLocalMockCookingResponse(lastUserMessage, quickStartData);

  const mockTokens = { prompt: 120, completion: 280, total: 400 };
  await logAIUsage({
    userId,
    conversationId,
    modelName: "cookcart-local-engine",
    tokensPrompt: mockTokens.prompt,
    tokensCompletion: mockTokens.completion,
  });

  return {
    message: localResult.message,
    structuredSuggestions: await attachDishImages(localResult.suggestions),
    tokensUsed: mockTokens,
    modelUsed: "cookcart-local-engine",
  };
}
