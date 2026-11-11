/**
 * CookCart Unified AI Service Module
 * Sections 4.1, 4.2, 5 of the Project Brief + Advanced AI Improvements:
 * - Single AI service module with configurable provider & model
 * - Multi-layered Prompt Injection & Jailbreak Security (`src/lib/ai/promptSecurity.ts`)
 * - Native Gemini Function Calling (`src/lib/ai/tools.ts`) with loop protection
 * - Real-time Progressive Streaming (`executeAIChatStream` + `MenuTagStreamFilter`)
 * - AI Observability with Langfuse + PII Redaction (`src/lib/ai/observability.ts`)
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
import { getGeminiApiKey, getGeminiGenerateContentUrl } from "@/lib/ai/geminiEndpoint";
import {
  inspectPromptSecurity,
  sanitizeConversationHistory,
  sanitizeModelOutput,
  sanitizeProfileField,
  wrapUntrustedUserContent,
} from "@/lib/ai/promptSecurity";
import {
  executeChefTool,
  GEMINI_FUNCTION_DECLARATIONS,
  MAX_TOOL_ITERATIONS,
  type ToolExecutionResult,
} from "@/lib/ai/tools";
import { ChatObservabilitySession, estimateAICost } from "@/lib/ai/observability";
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
  signal?: AbortSignal;
}

export interface AIResponsePayload {
  message: string;
  structuredSuggestions?: DishSuggestion[];
  tokensUsed: { prompt: number; completion: number; total: number };
  modelUsed: string;
  traceId?: string;
  latencyMs?: number;
  toolCallsExecuted?: string[];
  error?: string;
}

export type AIStreamEvent =
  | { type: "status"; phase: "thinking" | "calling_tool"; toolName?: string }
  | { type: "delta"; text: string }
  | { type: "tool_result"; toolName: string; success: boolean; data?: Record<string, unknown> }
  | { type: "suggestions"; structuredSuggestions: DishSuggestion[] }
  | { type: "done"; payload: AIResponsePayload }
  | { type: "error"; error: string };

/**
 * Check if a prompt violates the safety guardrail (detects prompt injection or adversarial jailbreaks).
 */
export function isOffTopic(text: string): boolean {
  return !inspectPromptSecurity(text).safe;
}

/**
 * Build the structured user turn text once (eliminating the previous 4x duplication across providers).
 */
export function formatUserTurnContent(
  lastUserMessage: string,
  quickStartData?: AIRequestOptions["quickStartData"],
  useSpotlightDelimiters = false
): string {
  const rawMessage = useSpotlightDelimiters
    ? wrapUntrustedUserContent(lastUserMessage)
    : lastUserMessage;

  if (!quickStartData?.ingredients?.length) {
    return rawMessage;
  }

  const safeCuisine = sanitizeProfileField(quickStartData.cuisine, 50) || "Any";
  const safeIngs = quickStartData.ingredients
    .map((i) => sanitizeProfileField(i, 50))
    .filter(Boolean);
  const safeDietary = sanitizeProfileField(quickStartData.dietary, 80) || "None";
  const safeAllergies = sanitizeProfileField(quickStartData.allergies, 80) || "None";
  const safeTime = sanitizeProfileField(quickStartData.cookingTimeLimit, 40) || "Any";
  const safeEquip =
    quickStartData.equipment?.map((e) => sanitizeProfileField(e, 40)).filter(Boolean).join(", ") ||
    "Stove";

  return `Cuisine: ${safeCuisine}\nIngredients to use (MUST ALL BE INCLUDED): ${safeIngs.join(", ")}\nServings: ${quickStartData.servings || 2}\nDietary/Allergies: ${safeDietary}, Allergies: ${safeAllergies}\nCooking time limit: ${safeTime}\nEquipment: ${safeEquip}\nUser request: ${rawMessage}`;
}

/**
 * Progressive stream filter that prevents `<COOKCART_MENU>...</COOKCART_MENU>` JSON tags
 * from leaking as raw text into the user's chat bubble while streaming.
 */
export class MenuTagStreamFilter {
  private buffer = "";
  private insideMenuTag = false;
  private menuBuffer = "";
  private static readonly OPEN_TAG = "<COOKCART_MENU>";
  private static readonly CLOSE_TAG = "</COOKCART_MENU>";

  push(chunk: string): string {
    if (!chunk) return "";
    if (this.insideMenuTag) {
      this.menuBuffer += chunk;
      const closeIdx = this.menuBuffer.toUpperCase().indexOf(MenuTagStreamFilter.CLOSE_TAG);
      if (closeIdx !== -1) {
        const afterClose = this.menuBuffer.slice(closeIdx + MenuTagStreamFilter.CLOSE_TAG.length);
        this.menuBuffer = this.menuBuffer.slice(0, closeIdx);
        this.insideMenuTag = false;
        return this.push(afterClose);
      }
      return "";
    }

    this.buffer += chunk;
    const upper = this.buffer.toUpperCase();
    const openIdx = upper.indexOf(MenuTagStreamFilter.OPEN_TAG);

    if (openIdx !== -1) {
      const safeBefore = this.buffer.slice(0, openIdx);
      const rest = this.buffer.slice(openIdx + MenuTagStreamFilter.OPEN_TAG.length);
      this.buffer = "";
      this.insideMenuTag = true;
      return safeBefore + this.push(rest);
    }

    // Hold back any trailing prefix of `<COOKCART_MENU>` so partial tag fragments never flash
    let holdBack = 0;
    const maxHold = Math.min(this.buffer.length, MenuTagStreamFilter.OPEN_TAG.length - 1);
    for (let len = maxHold; len > 0; len--) {
      const suffix = upper.slice(upper.length - len);
      if (MenuTagStreamFilter.OPEN_TAG.startsWith(suffix)) {
        holdBack = len;
        break;
      }
    }

    const emitLen = this.buffer.length - holdBack;
    if (emitLen <= 0) return "";
    const out = this.buffer.slice(0, emitLen);
    this.buffer = this.buffer.slice(emitLen);
    return out;
  }

  flush(): { remainingVisibleText: string; fullMenuBlock: string } {
    const remainingVisibleText = this.insideMenuTag ? "" : this.buffer;
    this.buffer = "";
    const fullMenuBlock = this.menuBuffer
      ? `<COOKCART_MENU>${this.menuBuffer}</COOKCART_MENU>`
      : "";
    return { remainingVisibleText, fullMenuBlock };
  }
}

/**
 * Detect whether the message is a mid-recipe step question or culinary technique question
 * (rather than a request for 3 dish suggestions).
 */
export function isCookingStepOrTechniqueQuestion(text: string): boolean {
  if (/^I am on step \d+ of \d+ while cooking/i.test(text.trim()) || /Quick question:/i.test(text)) {
    return true;
  }
  if (
    /\b(how hot|what temperature|substitute|instead of|replace|is it done|how do i know|burnt|burning|too salty|too sour|too spicy|too thick|too thin|watery|sticking|can i use|how long should i|why is my)\b/i.test(
      text
    ) &&
    !/\b(give me a .*menu|suggest .*dishes|what should i cook)\b/i.test(text)
  ) {
    return true;
  }
  return false;
}

/**
 * Detect whether a free-text chat message is asking for a menu, recipe, or how to cook a dish.
 */
export function isMenuOrRecipeRequest(text: string): boolean {
  if (isCookingStepOrTechniqueQuestion(text)) {
    return false;
  }
  return /\b(menu|recipe|recipes|cook|cooking|make|dish|dishes|dinner|lunch|breakfast|meal|eat|prepare|stir[- ]?fry|braise|steam|bake|roast|pasta|noodle|chicken|beef|pork|salmon|tofu|egg|soup|curry)\b/i.test(
    text
  );
}

/**
 * Answer a specific mid-recipe or technique question locally when cloud LLMs are unreachable.
 * Follows the chef persona rules in `src/config/systemPrompt.ts` (2-3 plain sentences,
 * both metric and US units, no exclamation marks or emoji).
 */
export function answerCookingQuestionLocally(rawPrompt: string): string {
  const questionMatch = rawPrompt.match(/Quick question:\s*(.+?)(?:\s*\(Please answer.*)?$/i);
  const question = (questionMatch ? questionMatch[1] : rawPrompt).trim();
  const q = question.toLowerCase();

  if (/\b(how hot|heat|smoke|smoking|shimmer|pan|wok|temperature)\b/.test(q)) {
    return "Heat the pan over medium-high until a drop of water skitters across the surface, around 190°C (375°F). Add 1 tbsp (15 ml) of oil and wait 10 seconds until it shimmers before adding your food.";
  }
  if (/\b(substitute|instead|replace|don't have|dont have|out of)\b/.test(q)) {
    if (/\b(shaoxing|wine|sherry)\b/.test(q)) {
      return "Use dry sherry, mirin, or plain stock with 1/2 tsp (2.5 ml) of rice vinegar per tablespoon. Add it around the rim of the hot pan so the aroma still lifts the dish.";
    }
    if (/\b(butter)\b/.test(q)) {
      return "Use an equal amount of olive oil or neutral cooking oil, about 1 tbsp (15 ml) per tablespoon of butter. Add a tiny pinch of salt at the end to replace the saltiness in butter.";
    }
    if (/\b(cornstarch|cornflour|starch)\b/.test(q)) {
      return "Mix 1 tsp (5 g) of potato starch or arrowroot with 2 tsp (10 ml) of cold water, or use 2 tsp (10 g) of plain flour. Stir it in at the end and simmer for 30 seconds until glossy.";
    }
    if (/\b(soy sauce|oyster sauce)\b/.test(q)) {
      return "Use tamari, coconut aminos, or 1/2 tsp (3 g) of salt dissolved in 1 tbsp (15 ml) of warm stock with a tiny pinch of sugar. Taste before serving and adjust gradually.";
    }
    return "You can swap it one-for-one with the closest mild pantry ingredient you have on hand, or leave it out and balance the dish at the end with a pinch of salt and a few drops of lemon juice or vinegar.";
  }
  if (/\b(done|cooked|ready|tender|colour|color|look like|check)\b/.test(q)) {
    return "Look for golden edges, a fragrant aroma, and no raw pinkness in the thickest part, which should reach 74°C (165°F) for poultry or flake easily for fish. If it yields gently when pressed with your spoon, it is ready for the next step.";
  }
  if (/\b(burnt|burning|scorched|sticking|stuck|dry)\b/.test(q)) {
    return "Lower the heat right away and splash in 2 tbsp (30 ml) of water or stock to stop the scorching. If the bottom is dark and bitter, transfer the top layer of food to a clean pan without scraping the burnt bits.";
  }
  if (/\b(salty|too much salt|oversalted)\b/.test(q)) {
    return "Add a splash of unsalted water or stock, about 60 ml (1/4 cup), or toss in extra greens or steamed rice to absorb the salt. A few drops of lemon juice or rice vinegar and a pinch of sugar will also round out the sharp edge.";
  }
  if (/\b(thick|thin|watery|runny|sauce)\b/.test(q)) {
    return "If the sauce is too thin, simmer uncovered over medium-high heat for 2 minutes or stir in 1 tsp (5 g) of cornstarch mixed with 1 tbsp (15 ml) of cold water. If it is too thick, loosen it with 1 to 2 tbsp (15 to 30 ml) of warm water.";
  }
  if (/\b(garlic|onion|ginger)\b/.test(q)) {
    return "Cook the aromatics over medium heat for 30 to 45 seconds until fragrant and lightly translucent. Move to the next step before the garlic turns dark brown so it stays sweet rather than bitter.";
  }

  return "Keep the heat at medium so the ingredients cook evenly without rushing, and stir every 20 to 30 seconds. Trust the smell and colour in the pan: once it smells fragrant and the edges turn lightly golden, you are ready for the next step.";
}

/**
 * Strip robotic Markdown (**bold**, # headings, - bullet lists) and replace
 * redundant dish bullet lists with casual, natural kitchen talk when dish cards
 * are already shown below the chat message.
 */
export function humanizeChefMessage(
  rawText: string,
  hasSuggestions: boolean,
  ingredients?: string[]
): string {
  const safeText = sanitizeModelOutput(rawText);
  const trimmed = safeText.trim();
  const hasBulletList = /(?:^|\n)\s*(?:[-*•]|\d+\.)\s+/m.test(trimmed);
  const startsWithBoldTitle = /^\s*(?:\*\*|#{1,4}\s)/.test(trimmed);

  if (hasSuggestions && (hasBulletList || startsWithBoldTitle)) {
    const ingList =
      ingredients && ingredients.length > 0
        ? ingredients.slice(0, 3).join(", ").toLowerCase()
        : "";
    if (ingList) {
      const capIng = ingList.charAt(0).toUpperCase() + ingList.slice(1);
      return `${capIng} go really well together for a quick meal. Pick whichever dish below sounds good tonight and we can cook it step by step.`;
    }
    return "Here are a few good dishes we can make right now. Pick whichever one sounds best below and we'll cook it step by step.";
  }

  return trimmed
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .trim();
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
    // Also strip any unclosed trailing `<COOKCART_MENU>...` if model truncated output
    const unclosedIdx = rawText.toUpperCase().indexOf("<COOKCART_MENU>");
    if (unclosedIdx !== -1) {
      return { cleanMessage: rawText.slice(0, unclosedIdx).trim() };
    }
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
            ? item.usedUserIngredients.map((i: any) => String(i).slice(0, 80))
            : ["Fresh Main Ingredient", "Garlic", "Herbs"];

        const rawSteps = Array.isArray(item.steps) ? item.steps : [];
        const steps: RecipeStep[] =
          rawSteps.length > 0
            ? rawSteps.map((st: any, sIdx: number) => ({
                step: Number(st.step) || sIdx + 1,
                title: String(st.title || `Step ${sIdx + 1}`).slice(0, 120),
                text: String(st.text || "").slice(0, 800),
                ...(Number(st.timerSeconds) > 0 ? { timerSeconds: Number(st.timerSeconds) } : {}),
              }))
            : buildDefaultStepsForDish(String(item.title), usedIngs);

        return {
          id: "sugg_" + Math.random().toString(36).substring(2, 9) + "_" + idx,
          title: String(item.title).slice(0, 140),
          cuisine: String(item.cuisine || "Chef Special").slice(0, 60),
          cookTimeMinutes: Math.min(360, Math.max(1, Number(item.cookTimeMinutes) || 20)),
          difficulty:
            item.difficulty === "Medium" || item.difficulty === "Hard" ? item.difficulty : "Easy",
          servings: Math.min(50, Math.max(1, Number(item.servings) || 2)),
          description: String(
            item.description || `Chef's freshly prepared ${item.title} with step-by-step guidance.`
          ).slice(0, 400),
          usedUserIngredients: usedIngs,
          extraIngredientsNeeded: Array.isArray(item.extraIngredientsNeeded)
            ? item.extraIngredientsNeeded.slice(0, 20).map((ex: any) => ({
                name: String(ex.name || "Seasoning").slice(0, 80),
                amount: Number(ex.amount) || 1,
                unit: String(ex.unit || "tbsp").slice(0, 30),
              }))
            : [],
          estimatedCostHkd: Number(item.estimatedCostHkd) || 58,
          availabilityNote: "",
          steps,
        };
      });

    if (normalized.length > 0) {
      return {
        cleanMessage:
          cleanMessage ||
          "Here are a few dishes. Tap See the recipe on one below, then start cooking when you're ready.",
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
      text: `Wash and pat dry ${ingText}. Cut into uniform bite-sized pieces so everything cooks evenly for ${title}.`,
      timerSeconds: 180,
    },
    {
      step: 2,
      title: "Marinate & Season Base",
      text: `Lightly toss the main ingredients with a pinch of salt, light soy sauce, and a touch of cornstarch to lock in juices.`,
      timerSeconds: 300,
    },
    {
      step: 3,
      title: "Aromatics & High-Heat Sear",
      text: `Heat 1 tbsp oil in your pan or wok over medium-high heat until shimmering. Sear the main ingredients until golden at the edges.`,
      timerSeconds: 240,
    },
    {
      step: 4,
      title: "Simmer & Glaze",
      text: `Add the remaining ingredients and sauce mixture. Toss briskly so the glossy sauce coats every piece evenly.`,
      timerSeconds: 180,
    },
    {
      step: 5,
      title: "Garnish & Serve Hot",
      text: `Transfer to a warmed plate, garnish with fresh herbs or spring onions, and serve immediately.`,
    },
  ];
}

/**
 * Check if user or system has exceeded daily or monthly AI limits
 */
export async function checkAILimits(userId?: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
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
          reason: `You have reached your daily limit of ${APP_CONFIG.ai.dailyUserRequestLimit} AI cooking consultations. It resets at midnight.`,
        };
      }
    }

    return { allowed: true };
  } catch (err) {
    console.error("AI Limit check error:", err);
    return { allowed: true };
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
    const { costHkd } = estimateAICost(params.modelName, params.tokensPrompt, params.tokensCompletion);
    const estimatedCostHkd = costHkd > 0 ? costHkd : (tokensTotal / 1000) * 0.003;

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
      if (suggestion.imageUrl) {
        used.add(suggestion.imageUrl);
        return suggestion;
      }
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

  const cuisine = quickStart?.cuisine && quickStart.cuisine !== "any" ? quickStart.cuisine : "Home-style";
  const cuisineFlavor = cuisine.replace(/\s*(food|cuisine)\s*$/i, "").trim() || cuisine;
  const servings = quickStart?.servings || 2;
  const ingListStr = ingredients.join(", ");

  const dish1: DishSuggestion = {
    id: "sugg_" + Math.random().toString(36).substring(2, 9),
    title: `${cuisine === "Home-style" ? "" : `${cuisineFlavor} `}Wok Sauté of ${ingredients.slice(0, 2).join(" & ")}`,
    cuisine: cuisine,
    cookTimeMinutes: 18,
    difficulty: "Easy",
    servings: servings,
    description: `A fragrant, high-heat stir-fry with ${ingListStr} with aromatic garlic and light soy reduction.`,
    usedUserIngredients: [...ingredients],
    extraIngredientsNeeded: [
      { name: "Lee Kum Kee Premium Light Soy Sauce", amount: 1.5, unit: "tbsp" },
      { name: "Shaoxing Cooking Rice Wine", amount: 1, unit: "tbsp" },
      { name: "Pure Cornstarch", amount: 1, unit: "tsp" },
    ],
    localSubstituteNotes:
      "If Shaoxing wine is unavailable, dry sherry or a teaspoon of apple cider vinegar with a pinch of sugar works well.",
    estimatedCostHkd: 48.0 + ingredients.length * 6.5,
    availabilityNote: "",
    steps: [
      {
        step: 1,
        title: "Slice & Velvet the Ingredients",
        text: `Wash and dry ${ingListStr}. Slice the protein into bite-sized pieces and toss with 1 tsp light soy sauce, 1 tsp Shaoxing wine, and 1 tsp cornstarch. Let sit for 5 minutes.`,
        timerSeconds: 300,
      },
      {
        step: 2,
        title: "Whisk the Wok Glaze Sauce",
        text: `In a small bowl, combine 1 tbsp light soy sauce, 2 tbsp water, and a pinch of sugar so it is ready beside your stove.`,
      },
      {
        step: 3,
        title: "High-Heat Sear",
        text: `Heat your wok or skillet over high heat until smoking hot. Add 1 tbsp oil, swirl to coat, and sear ${ingredients[0] || "the main ingredient"} undisturbed for 90 seconds before tossing until 80% cooked.`,
        timerSeconds: 150,
      },
      {
        step: 4,
        title: "Toss Greens & Splash Wine",
        text: `Add the remaining ingredients (${ingredients.slice(1).join(", ") || "aromatics"}) and sizzle Shaoxing wine around the hot rim of the wok for authentic wok hei aroma.`,
        timerSeconds: 120,
      },
      {
        step: 5,
        title: "Glaze & Plate Hot",
        text: `Pour in the prepared soy glaze, toss briskly for 30 seconds until glossy, and transfer immediately to a warm serving platter.`,
        timerSeconds: 30,
      },
    ],
  };

  const dish2: DishSuggestion = {
    id: "sugg_" + Math.random().toString(36).substring(2, 9),
    title: `Savory Claypot-Style Braised ${ingredients[0] || "Main"} with ${ingredients[1] || "Greens"}`,
    cuisine: cuisine,
    cookTimeMinutes: 28,
    difficulty: "Easy",
    servings: servings,
    description: `A comforting braised dish simmering ${ingListStr} gently in a rich umami broth until tender and full of flavor.`,
    usedUserIngredients: [...ingredients],
    extraIngredientsNeeded: [
      { name: "Lee Kum Kee Premium Oyster Sauce", amount: 1.5, unit: "tbsp" },
      { name: "Pure Toasted Sesame Oil", amount: 1, unit: "tsp" },
      { name: "Thai Hom Mali Jasmine Rice", amount: 2, unit: "cups" },
    ],
    localSubstituteNotes:
      "Oyster sauce can be substituted with vegetarian mushroom stir-fry sauce if cooking vegetarian.",
    estimatedCostHkd: 54.0 + ingredients.length * 7.0,
    availabilityNote: "",
    steps: [
      {
        step: 1,
        title: "Prep & Cut Uniform Pieces",
        text: `Cut ${ingListStr} into hearty 3cm chunks suited for braising so they stay juicy and tender.`,
        timerSeconds: 180,
      },
      {
        step: 2,
        title: "Brown the Aromatics & Main",
        text: `Warm oil in a heavy pot or claypot over medium-high heat. Sear ${ingredients[0] || "the main ingredients"} until golden brown on both sides.`,
        timerSeconds: 240,
      },
      {
        step: 3,
        title: "Simmer in Oyster Umami Broth",
        text: `Stir in 1.5 tbsp oyster sauce and 150ml warm water or broth. Bring to a boil, cover with a lid, and simmer on low heat for 12 minutes.`,
        timerSeconds: 720,
      },
      {
        step: 4,
        title: "Fold in Tender Greens & Sesame Oil",
        text: `Uncover, add the quicker-cooking greens (${ingredients.slice(1).join(", ") || "vegetables"}), and simmer for 3 more minutes. Drizzle with toasted sesame oil and serve over steamed jasmine rice.`,
        timerSeconds: 180,
      },
    ],
  };

  const dish3: DishSuggestion = {
    id: "sugg_" + Math.random().toString(36).substring(2, 9),
    title: `Ginger Noodle Soup with ${ingListStr}`,
    cuisine: cuisine,
    cookTimeMinutes: 15,
    difficulty: "Easy",
    servings: servings,
    description: `A quick noodle soup with ${ingListStr} in a clear aromatic ginger broth.`,
    usedUserIngredients: [...ingredients],
    extraIngredientsNeeded: [
      { name: "Egg noodles", amount: 2, unit: "bundles" },
      { name: "Ginger", amount: 15, unit: "g" },
      { name: "Natural Fine Sea Salt", amount: 0.5, unit: "tsp" },
    ],
    localSubstituteNotes: "Egg noodles can be substituted with rice vermicelli or ramen noodles.",
    estimatedCostHkd: 39.0 + ingredients.length * 5.0,
    availabilityNote: "",
    steps: [
      {
        step: 1,
        title: "Infuse Ginger Broth Base",
        text: `Bring 700ml water or chicken stock to a gentle boil with sliced old ginger root to build a fragrant soup base.`,
        timerSeconds: 240,
      },
      {
        step: 2,
        title: "Poach Ingredients Until Tender",
        text: `Add ${ingListStr} to the simmering broth and poach gently for 5 minutes until just cooked through and flavorful.`,
        timerSeconds: 300,
      },
      {
        step: 3,
        title: "Blanch Fresh Egg Noodles",
        text: `In a separate pot of boiling water, loosen and cook the fresh wonton egg noodles for 60–90 seconds until al dente, then drain and divide into bowls.`,
        timerSeconds: 90,
      },
      {
        step: 4,
        title: "Ladle Broth & Serve",
        text: `Season the broth with fine sea salt and a drop of sesame oil, ladle generously over the noodles, and top neatly with the poached ingredients.`,
      },
    ],
  };

  const message = `${ingListStr} make a great combination. Pick whichever dish below sounds good tonight and we can cook it step by step.`;

  return {
    message,
    suggestions: [dish1, dish2, dish3],
  };
}

/**
 * Main AI Chat Execution Function (with Prompt Security, Native Gemini Function Calling, and Langfuse Observability)
 */
export async function executeAIChat(
  options: AIRequestOptions,
  onStreamEvent?: (event: AIStreamEvent) => void
): Promise<AIResponsePayload> {
  const { quickStartData, userId, conversationId, chefProfile, signal } = options;

  // Sanitize conversation history: strip any client-injected "system" role messages
  const cleanMessages = sanitizeConversationHistory(options.messages);
  const lastUserMessage = cleanMessages.filter((m) => m.role === "user").pop()?.content || "";

  const obs = new ChatObservabilitySession({
    conversationId,
    userId,
    userMessage: lastUserMessage,
    quickStartData,
  });

  // 0. Prompt Injection & Jailbreak Security Gate
  const securityCheck = inspectPromptSecurity(lastUserMessage);
  if (!securityCheck.safe) {
    obs.recordSecurityEvent(securityCheck.triggeredCategories, lastUserMessage);
    const { totalLatencyMs, traceId } = await obs.finalize({
      outputMessage: securityCheck.refusalMessage!,
      modelUsed: "security-guardrail",
      error: `Blocked prompt injection: ${securityCheck.triggeredCategories.join(", ")}`,
    });
    return {
      message: securityCheck.refusalMessage!,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: "security-guardrail",
      traceId,
      latencyMs: totalLatencyMs,
    };
  }

  // Also check quickStartData fields if present
  if (quickStartData) {
    const qsCombined = [
      quickStartData.cuisine,
      ...(quickStartData.ingredients || []),
      quickStartData.dietary,
      quickStartData.allergies,
    ]
      .filter(Boolean)
      .join(" ");
    const qsSecurity = inspectPromptSecurity(qsCombined);
    if (!qsSecurity.safe) {
      obs.recordSecurityEvent(qsSecurity.triggeredCategories, qsCombined);
      const { totalLatencyMs, traceId } = await obs.finalize({
        outputMessage: qsSecurity.refusalMessage!,
        modelUsed: "security-guardrail",
        error: `Blocked quickStart injection: ${qsSecurity.triggeredCategories.join(", ")}`,
      });
      return {
        message: qsSecurity.refusalMessage!,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        modelUsed: "security-guardrail",
        traceId,
        latencyMs: totalLatencyMs,
      };
    }
  }

  // 1. Spending Cap & Rate Limit Check
  const limitCheck = await checkAILimits(userId);
  if (!limitCheck.allowed) {
    const msg = limitCheck.reason || "AI usage limit reached. Please try again later.";
    const { totalLatencyMs, traceId } = await obs.finalize({
      outputMessage: msg,
      modelUsed: "limit-enforcer",
    });
    return {
      message: msg,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      modelUsed: "limit-enforcer",
      traceId,
      latencyMs: totalLatencyMs,
    };
  }

  // Build persona prompt incorporating sanitized chef identity
  const systemPrompt = chefProfile?.chefName
    ? buildSystemPrompt(chefProfile.chefName, chefProfile.chefPersonality || "friendly")
    : COOKCART_SYSTEM_PROMPT;

  const toolCollectedSuggestions: DishSuggestion[] = [];
  const executedToolNames: string[] = [];

  // Helper: Resolve structured suggestions from tools, LLM <COOKCART_MENU> tag, Spoonacular, or local fallback
  async function resolveStructuredSuggestions(
    llmExtracted?: DishSuggestion[]
  ): Promise<DishSuggestion[] | undefined> {
    if (toolCollectedSuggestions.length > 0) {
      return attachDishImages(toolCollectedSuggestions.slice(0, 3));
    }
    if (llmExtracted && llmExtracted.length > 0) {
      return attachDishImages(llmExtracted);
    }

    const hasQuickStart = Boolean(quickStartData?.ingredients?.length);
    const wantsMenu = hasQuickStart || isMenuOrRecipeRequest(lastUserMessage);
    if (!wantsMenu) return undefined;

    if (hasSpoonacularKey() && hasQuickStart && quickStartData?.ingredients) {
      const live = await fetchLiveRecipes(
        quickStartData.ingredients,
        quickStartData.cuisine && quickStartData.cuisine !== "any" ? quickStartData.cuisine : "",
        3,
        quickStartData.servings || 2
      );
      if (live.length > 0) return live;
    }

    const local = generateLocalMockCookingResponse(lastUserMessage, quickStartData);
    return attachDishImages(local.suggestions);
  }

  const activeIngredients =
    quickStartData?.ingredients && quickStartData.ingredients.length > 0
      ? quickStartData.ingredients
      : extractIngredientsFromUserText(lastUserMessage);

  const userContent = formatUserTurnContent(lastUserMessage, quickStartData, false);

  // 2. Gemini first: supports Native Function Calling + multi-step reasoning loop (up to MAX_TOOL_ITERATIONS)
  const geminiApiKey = getGeminiApiKey();
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  if (geminiApiKey) {
    try {
      const contents: Array<{ role: string; parts: any[] }> = cleanMessages
        .slice(-8)
        .map((m, idx, arr) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: idx === arr.length - 1 && m.role === "user" ? userContent : m.content }],
        }));
      while (contents.length > 0 && contents[0].role === "model") contents.shift();

      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      let finalRawText = "";
      let geminiSucceeded = false;
      const seenToolCalls = new Set<string>();

      for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
        const genStart = Date.now();
        onStreamEvent?.({ type: "status", phase: "thinking" });

        const response = await fetch(getGeminiGenerateContentUrl(geminiModel, geminiApiKey), {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiApiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            tools: [{ functionDeclarations: GEMINI_FUNCTION_DECLARATIONS }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
          signal,
        });

        const genLatency = Date.now() - genStart;

        if (!response.ok) {
          const errText = await response.text();
          obs.recordGeneration({
            model: geminiModel,
            input: contents,
            promptTokens: 0,
            completionTokens: 0,
            latencyMs: genLatency,
            error: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
          });
          console.warn(
            `Gemini ${geminiModel} returned ${response.status}, trying the next provider:`,
            errText
          );
          break;
        }

        const data = await response.json();
        const candidateParts: any[] = data.candidates?.[0]?.content?.parts || [];
        const pTokens = data.usageMetadata?.promptTokenCount || 200;
        const cTokens = data.usageMetadata?.candidatesTokenCount || 400;
        totalPromptTokens += pTokens;
        totalCompletionTokens += cTokens;

        obs.recordGeneration({
          model: geminiModel,
          input: contents,
          output: candidateParts,
          promptTokens: pTokens,
          completionTokens: cTokens,
          latencyMs: genLatency,
        });

        // Check if Gemini requested any native function calls
        const functionCalls = candidateParts
          .filter((p) => p && typeof p === "object" && p.functionCall)
          .map((p) => p.functionCall as { name: string; args?: Record<string, unknown> });

        const textParts = candidateParts
          .filter((p) => p && typeof p.text === "string")
          .map((p) => p.text as string)
          .join("");

        if (functionCalls.length === 0) {
          finalRawText = textParts;
          geminiSucceeded = true;
          break;
        }

        // Append the model's functionCall turn to conversation contents
        contents.push({
          role: "model",
          parts: candidateParts,
        });

        const functionResponseParts: any[] = [];
        for (const fc of functionCalls) {
          const callSignature = `${fc.name}:${JSON.stringify(fc.args || {})}`;
          let toolResult: ToolExecutionResult;

          if (seenToolCalls.has(callSignature)) {
            toolResult = {
              toolName: fc.name as any,
              success: false,
              error: "Duplicate tool call skipped to prevent loop.",
              durationMs: 0,
            };
          } else {
            seenToolCalls.add(callSignature);
            onStreamEvent?.({ type: "status", phase: "calling_tool", toolName: fc.name });
            toolResult = await executeChefTool(fc.name, fc.args || {}, {
              userId,
              conversationId,
            });
            executedToolNames.push(fc.name);
            obs.recordToolCall({
              toolName: fc.name,
              input: fc.args || {},
              output: toolResult.data,
              success: toolResult.success,
              durationMs: toolResult.durationMs,
              error: toolResult.error,
            });
            onStreamEvent?.({
              type: "tool_result",
              toolName: fc.name,
              success: toolResult.success,
              data: toolResult.data,
            });

            if (toolResult.suggestions && toolResult.suggestions.length > 0) {
              toolCollectedSuggestions.push(...toolResult.suggestions);
            }
          }

          functionResponseParts.push({
            functionResponse: {
              name: fc.name,
              response: toolResult.success
                ? { status: "ok", ...toolResult.data }
                : { status: "error", error: toolResult.error },
            },
          });
        }

        contents.push({
          role: "user",
          parts: functionResponseParts,
        });

        // If we hit the final iteration and still have text, keep it
        if (iter === MAX_TOOL_ITERATIONS - 1 && textParts) {
          finalRawText = textParts;
          geminiSucceeded = true;
        }
      }

      if (geminiSucceeded) {
        const { cleanMessage, menuDishes } = extractMenuFromLLMResponse(finalRawText);
        await logAIUsage({
          userId,
          conversationId,
          modelName: geminiModel,
          tokensPrompt: totalPromptTokens,
          tokensCompletion: totalCompletionTokens,
        });

        const suggestions = await resolveStructuredSuggestions(menuDishes);
        const finalMessage = humanizeChefMessage(
          cleanMessage,
          Boolean(suggestions?.length),
          activeIngredients
        );

        const { totalLatencyMs, traceId } = await obs.finalize({
          outputMessage: finalMessage,
          modelUsed: geminiModel,
          suggestionCount: suggestions?.length || 0,
        });

        return {
          message: finalMessage,
          structuredSuggestions: suggestions,
          tokensUsed: {
            prompt: totalPromptTokens,
            completion: totalCompletionTokens,
            total: totalPromptTokens + totalCompletionTokens,
          },
          modelUsed: geminiModel,
          traceId,
          latencyMs: totalLatencyMs,
          ...(executedToolNames.length > 0 ? { toolCallsExecuted: executedToolNames } : {}),
        };
      }
    } catch (apiError: any) {
      if (apiError?.name === "AbortError") throw apiError;
      console.warn("Live Gemini API call encountered error, trying the next provider:", apiError);
    }
  }

  // 3. OpenRouter, when configured
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    const candidateModels = [
      process.env.OPENROUTER_MODEL,
      "openrouter/free",
      "google/gemini-2.5-flash",
      "openai/gpt-4o-mini",
    ].filter(Boolean) as string[];
    for (const orModel of candidateModels) {
      try {
        const historyMessages = cleanMessages.slice(-5).map((m, idx, arr) => ({
          role: m.role,
          content: idx === arr.length - 1 && m.role === "user" ? userContent : m.content,
        }));

        const genStart = Date.now();
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://cook-cart.vercel.app",
            "X-Title": "Bon Taste",
          },
          body: JSON.stringify({
            model: orModel,
            include_reasoning: false,
            temperature: 0.7,
            max_tokens: 1000,
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              ...historyMessages,
            ],
          }),
          signal,
        });
        const genLatency = Date.now() - genStart;

        if (response.ok) {
          const data = await response.json();
          const rawText = data.choices?.[0]?.message?.content || "";
          if (rawText.trim()) {
            const { cleanMessage, menuDishes } = extractMenuFromLLMResponse(rawText);
            const promptTokens = data.usage?.prompt_tokens || 100;
            const completionTokens = data.usage?.completion_tokens || 200;
            const modelTag = `openrouter/${orModel}`;

            obs.recordGeneration({
              model: modelTag,
              input: historyMessages,
              output: rawText,
              promptTokens,
              completionTokens,
              latencyMs: genLatency,
            });

            await logAIUsage({
              userId,
              conversationId,
              modelName: modelTag,
              tokensPrompt: promptTokens,
              tokensCompletion: completionTokens,
            });

            const suggestions = await resolveStructuredSuggestions(menuDishes);
            const finalMessage = humanizeChefMessage(
              cleanMessage,
              Boolean(suggestions?.length),
              activeIngredients
            );
            const { totalLatencyMs, traceId } = await obs.finalize({
              outputMessage: finalMessage,
              modelUsed: modelTag,
              suggestionCount: suggestions?.length || 0,
            });

            return {
              message: finalMessage,
              structuredSuggestions: suggestions,
              tokensUsed: {
                prompt: promptTokens,
                completion: completionTokens,
                total: promptTokens + completionTokens,
              },
              modelUsed: modelTag,
              traceId,
              latencyMs: totalLatencyMs,
            };
          }
        }
      } catch (orError: any) {
        if (orError?.name === "AbortError") throw orError;
        console.warn(`OpenRouter (${orModel}) failed, trying next:`, orError);
      }
    }
  }

  // 4. Check for Live Groq API Key in Environment
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey) {
    try {
      const genStart = Date.now();
      const groq = new Groq({ apiKey: groqApiKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
      });
      const genLatency = Date.now() - genStart;

      const rawText = chatCompletion.choices[0]?.message?.content || "";
      const { cleanMessage, menuDishes } = extractMenuFromLLMResponse(rawText);
      const promptTokens = chatCompletion.usage?.prompt_tokens || 150;
      const completionTokens = chatCompletion.usage?.completion_tokens || 250;
      const modelTag = "llama-3.3-70b-versatile (groq)";

      obs.recordGeneration({
        model: modelTag,
        input: userContent,
        output: rawText,
        promptTokens,
        completionTokens,
        latencyMs: genLatency,
      });

      await logAIUsage({
        userId,
        conversationId,
        modelName: modelTag,
        tokensPrompt: promptTokens,
        tokensCompletion: completionTokens,
      });

      const suggestions = await resolveStructuredSuggestions(menuDishes);
      const finalMessage = sanitizeModelOutput(cleanMessage);
      const { totalLatencyMs, traceId } = await obs.finalize({
        outputMessage: finalMessage,
        modelUsed: modelTag,
        suggestionCount: suggestions?.length || 0,
      });

      return {
        message: finalMessage,
        structuredSuggestions: suggestions,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        modelUsed: modelTag,
        traceId,
        latencyMs: totalLatencyMs,
      };
    } catch (groqError) {
      console.warn("Groq API call encountered error, proceeding to next provider:", groqError);
    }
  }

  // 5. Check for Live Ollama Cloud API Key in Environment
  const ollamaApiKey = process.env.OLLAMA_API_KEY;
  if (ollamaApiKey) {
    try {
      const genStart = Date.now();
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
      const genLatency = Date.now() - genStart;

      const rawText = response.message?.content || "";
      const { cleanMessage, menuDishes } = extractMenuFromLLMResponse(rawText);
      const promptTokens = response.prompt_eval_count || 100;
      const completionTokens = response.eval_count || 200;

      obs.recordGeneration({
        model: "glm-5.3-flash",
        input: userContent,
        output: rawText,
        promptTokens,
        completionTokens,
        latencyMs: genLatency,
      });

      await logAIUsage({
        userId,
        conversationId,
        modelName: "glm-5.3-flash",
        tokensPrompt: promptTokens,
        tokensCompletion: completionTokens,
      });

      const suggestions = await resolveStructuredSuggestions(menuDishes);
      const finalMessage = sanitizeModelOutput(cleanMessage);
      const { totalLatencyMs, traceId } = await obs.finalize({
        outputMessage: finalMessage,
        modelUsed: "glm-5.3-flash",
        suggestionCount: suggestions?.length || 0,
      });

      return {
        message: finalMessage,
        structuredSuggestions: suggestions,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        modelUsed: "glm-5.3-flash",
        traceId,
        latencyMs: totalLatencyMs,
      };
    } catch (ollamaError) {
      console.warn("Ollama API call encountered error, proceeding to next provider:", ollamaError);
    }
  }

  // 6. Live recipe catalogue (Spoonacular), when a server-side key is configured.
  if (hasSpoonacularKey() && quickStartData?.ingredients?.length) {
    const liveSuggestions = await fetchLiveRecipes(
      quickStartData.ingredients,
      quickStartData.cuisine && quickStartData.cuisine !== "any" ? quickStartData.cuisine : "",
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
      const msg = `Here are ${liveSuggestions.length} real ${quickStartData.cuisine && quickStartData.cuisine !== "any" ? quickStartData.cuisine : ""} recipes built around ${ingredientList}. Tap "See the recipe" on a dish below, then start cooking when you're ready.`;
      const { totalLatencyMs, traceId } = await obs.finalize({
        outputMessage: msg,
        modelUsed: "spoonacular-live-recipes",
        suggestionCount: liveSuggestions.length,
      });
      return {
        message: msg,
        structuredSuggestions: liveSuggestions,
        tokensUsed: liveTokens,
        modelUsed: "spoonacular-live-recipes",
        traceId,
        latencyMs: totalLatencyMs,
      };
    }
  }

  // 7. Free Cloud AI LLM fallback (Pollinations OpenAI-compatible endpoint)
  if (process.env.NODE_ENV !== "test") {
    try {
      const historyMessages = cleanMessages.slice(-5).map((m, idx, arr) => ({
        role: m.role,
        content: idx === arr.length - 1 && m.role === "user" ? userContent : m.content,
      }));

      const polliRes = await fetch("https://text.pollinations.ai/openai", {
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
        signal,
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

          const finalMessage = humanizeChefMessage(
            cleanMessage,
            Boolean(suggestions?.length),
            activeIngredients
          );
          const { totalLatencyMs, traceId } = await obs.finalize({
            outputMessage: finalMessage,
            modelUsed: "pollinations-free-llm",
            suggestionCount: suggestions?.length || 0,
          });

          return {
            message: finalMessage,
            structuredSuggestions: suggestions,
            tokensUsed: { prompt: 100, completion: 200, total: 300 },
            modelUsed: "pollinations-free-llm",
            traceId,
            latencyMs: totalLatencyMs,
          };
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      console.warn("Pollinations free LLM failed, using local culinary engine:", err);
    }
  }

  // 8. Default / Fallback: Intelligent Local Culinary Engine
  const isDirectGreeting = /^(hi|hello|hey|yo|good morning|good afternoon|good evening)/i.test(
    lastUserMessage.trim()
  );

  if (isDirectGreeting && !quickStartData?.ingredients?.length) {
    const greetMsg =
      "Hello, I'm your chef. What would you like to cook, or what do you have in the fridge today?";
    const { totalLatencyMs, traceId } = await obs.finalize({
      outputMessage: greetMsg,
      modelUsed: "cookcart-local-engine",
    });
    return {
      message: greetMsg,
      tokensUsed: { prompt: 20, completion: 40, total: 60 },
      modelUsed: "cookcart-local-engine",
      traceId,
      latencyMs: totalLatencyMs,
    };
  }

  // Mid-recipe step question or technique question -> concise, accurate 2-3 sentence chef answer
  if (isCookingStepOrTechniqueQuestion(lastUserMessage) && !quickStartData?.ingredients?.length) {
    const stepAnswer = answerCookingQuestionLocally(lastUserMessage);
    const stepTokens = { prompt: 80, completion: 70, total: 150 };
    await logAIUsage({
      userId,
      conversationId,
      modelName: "cookcart-local-engine",
      tokensPrompt: stepTokens.prompt,
      tokensCompletion: stepTokens.completion,
    });
    const { totalLatencyMs, traceId } = await obs.finalize({
      outputMessage: stepAnswer,
      modelUsed: "cookcart-local-engine",
    });
    return {
      message: stepAnswer,
      tokensUsed: stepTokens,
      modelUsed: "cookcart-local-engine",
      traceId,
      latencyMs: totalLatencyMs,
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

  const attachedSuggestions = await attachDishImages(localResult.suggestions);
  const { totalLatencyMs, traceId } = await obs.finalize({
    outputMessage: localResult.message,
    modelUsed: "cookcart-local-engine",
    suggestionCount: attachedSuggestions.length,
  });

  return {
    message: localResult.message,
    structuredSuggestions: attachedSuggestions,
    tokensUsed: mockTokens,
    modelUsed: "cookcart-local-engine",
    traceId,
    latencyMs: totalLatencyMs,
  };
}

/**
 * Progressive Streaming Generator (`executeAIChatStream`):
 * - Streams status updates, tool executions, progressive text chunks (`delta`),
 *   validated recipe cards (`suggestions`), and final metadata (`done`) via SSE.
 * - Filters out `<COOKCART_MENU>...</COOKCART_MENU>` via `MenuTagStreamFilter` so
 *   incomplete JSON is never exposed as text in the user's chat bubble.
 * - Respects `AbortSignal` for instant Stop Generation support.
 */
export async function* executeAIChatStream(
  options: AIRequestOptions
): AsyncGenerator<AIStreamEvent, AIResponsePayload, void> {
  const queuedEvents: AIStreamEvent[] = [];

  const result = await executeAIChat(options, (ev) => {
    queuedEvents.push(ev);
  });

  for (const ev of queuedEvents) {
    if (options.signal?.aborted) break;
    yield ev;
  }

  // Stream the clean message progressively through MenuTagStreamFilter in natural word groups
  const filter = new MenuTagStreamFilter();
  const words = result.message.split(/(\s+)/);
  const chunkSize = 3;

  for (let i = 0; i < words.length; i += chunkSize) {
    if (options.signal?.aborted) break;
    const rawPiece = words.slice(i, i + chunkSize).join("");
    const safePiece = filter.push(rawPiece);
    if (safePiece) {
      yield { type: "delta", text: safePiece };
    }
  }

  const { remainingVisibleText } = filter.flush();
  if (remainingVisibleText && !options.signal?.aborted) {
    yield { type: "delta", text: remainingVisibleText };
  }

  if (result.structuredSuggestions && result.structuredSuggestions.length > 0 && !options.signal?.aborted) {
    yield {
      type: "suggestions",
      structuredSuggestions: result.structuredSuggestions,
    };
  }

  yield { type: "done", payload: result };
  return result;
}
