"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { CookingModeModal } from "@/components/CookingModeModal";
import { RecipeIngredient, RecipeStep, DishSuggestion } from "@/types";
import {
  Clock,
  ChefHat,
  Users,
  CheckCircle2,
  CheckSquare,
  Square,
  ShoppingBag,
  Flame,
  ArrowRight,
  Bookmark,
  Share2,
  AlertCircle,
  TrendingDown,
  Sparkles,
} from "lucide-react";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [dish, setDish] = useState<DishSuggestion | null>(null);
  const [servings, setServings] = useState(2);
  const baseServings = 2; // benchmark scaling ratio

  // "I already have this" pantry state (set of ingredient names)
  const [pantryItems, setPantryItems] = useState<Set<string>>(new Set());

  // Cooking mode modal state
  const [isCookingModeOpen, setIsCookingModeOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 1. Try to load from session storage (passed from chat card)
    const cached = sessionStorage.getItem("cookcart_active_dish");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.id === params.id || !dish) {
          setDish(parsed);
          setServings(parsed.servings || 2);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Fallback to default demo recipe
    const fallbackDish: DishSuggestion = {
      id: String(params.id),
      title: "Cantonese Steamed Chicken with Shiitake & Shaoxing Wine",
      titleZh: "粵式古法香菇蒸滑雞",
      cuisine: "Cantonese",
      cookTimeMinutes: 25,
      difficulty: "Easy",
      servings: 2,
      description:
        "A beloved Cantonese comfort food classic featuring velvety tender chicken infused with dried shiitake mushrooms, ginger, and Shaoxing wine.",
      descriptionZh:
        "香港經典家常名菜，雞肉嫩滑多汁，香菇鮮香四溢，薑絲酒香撲鼻。",
      usedUserIngredients: ["Chicken Thigh Fillets", "Fresh Shiitake Mushrooms", "Ginger", "Spring Onions"],
      extraIngredientsNeeded: [
        { name: "Shaoxing Cooking Rice Wine", nameZh: "紹興花雕廚酒", amount: 1, unit: "tbsp" },
        { name: "Lee Kum Kee Premium Light Soy Sauce", nameZh: "生抽", amount: 1.5, unit: "tbsp" },
        { name: "Pure Toasted Sesame Oil", nameZh: "黑芝麻油", amount: 1, unit: "tsp" },
        { name: "Pure Cornstarch", nameZh: "生粉", amount: 1, unit: "tbsp" },
      ],
      estimatedCostHkd: 52.0,
      availabilityNote: "All ingredients available in stock at HK supermarkets.",
    };
    setDish(fallbackDish);
  }, [params.id]);

  if (!dish) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-500">{t("loading")}</p>
      </div>
    );
  }

  // Combined ingredient list
  const allIngredients: RecipeIngredient[] = [
    ...dish.usedUserIngredients.map((u) => ({
      name: u,
      nameZh: u,
      amount: 1,
      unit: "portion",
    })),
    ...dish.extraIngredientsNeeded,
  ];

  // Scale multiplier
  const scaleMultiplier = servings / baseServings;

  const togglePantry = (name: string) => {
    const next = new Set(pantryItems);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setPantryItems(next);
  };

  // Live recipes (lib/recipes/spoonacular.ts) carry the source's own instructions.
  // Prefer those: the hardcoded demo steps below describe steamed chicken, so
  // rendering them for a salmon recipe would be plainly wrong.
  const hasRealSteps = Boolean(dish.steps && dish.steps.length > 0);

  const demoSteps: RecipeStep[] = [
    {
      step: 1,
      title: "Preparation & Marinade",
      titleZh: "切塊與醃製",
      text: `Cut chicken thighs into bite-sized pieces. In a bowl, toss with ginger slivers, light soy sauce, Shaoxing wine, and cornstarch. Let marinate for 10 minutes.`,
      textZh: `雞腿肉切適口塊狀，與薑絲、生抽、花雕酒及生粉抓勻醃製10分鐘。`,
      timerSeconds: 600,
    },
    {
      step: 2,
      title: "Arrange & Steam",
      titleZh: "擺盤大火隔水清蒸",
      text: "Spread the marinated chicken and mushrooms on a heatproof dish. Steam over high heat for 12 to 14 minutes until cooked through.",
      textZh: "將雞肉與香菇平鋪在耐熱蒸碟上，大火隔水清蒸12至14分鐘至熟透。",
      timerSeconds: 780,
    },
    {
      step: 3,
      title: "Garnish & Serve",
      titleZh: "撒蔥出鍋熱吃",
      text: "Scatter spring onions over the steaming hot chicken and serve immediately with jasmine rice.",
      textZh: "撒上翠綠蔥花，趁熱伴白飯享用！",
    },
  ];

  const steps: RecipeStep[] = hasRealSteps ? (dish.steps as RecipeStep[]) : demoSteps;

  // Shopping list items (excluding pantry items user already has)
  const itemsToBuy = allIngredients.filter((i) => !pantryItems.has(i.name));

  const handleProceedToStoreComparison = () => {
    // Save items to buy to session storage for Stage 7 store comparison
    sessionStorage.setItem("cookcart_shopping_list", JSON.stringify(itemsToBuy));
    sessionStorage.setItem("cookcart_recipe_title", dish.title);
    router.push("/stores/compare");
  };

  const displayTitle = language === "zh-HK" ? dish.titleZh || dish.title : dish.title;
  const displayDesc = language === "zh-HK" ? dish.descriptionZh || dish.description : dish.description;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-700 text-xs font-bold uppercase tracking-wider">
            {dish.cuisine}
          </span>
          {/* A live recipe is real but does not necessarily use everything the user
              picked, so the "uses all ingredients" badge would be a false claim.
              Substitute an attribution badge, which the source's terms also expect. */}
          {hasRealSteps ? (
            dish.sourceUrl ? (
              <a
                href={dish.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold hover:bg-sky-100 transition"
              >
                Recipe source: {dish.sourceName || "external site"} ↗
              </a>
            ) : (
              <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold">
                Live recipe
              </span>
            )
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              ✓ Uses All Selected Ingredients
            </span>
          )}
          <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            {dish.cookTimeMinutes} {t("mins")}
          </span>
          <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
            <ChefHat className="w-3.5 h-3.5 text-stone-400" />
            {dish.difficulty}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 leading-tight">
          {displayTitle}
        </h1>

        <p className="text-base text-stone-600 leading-relaxed max-w-3xl">
          {displayDesc}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => router.push(`/recipe/${dish.id}/cook`)}
            className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
          >
            <Flame className="w-4 h-4" />
            <span>{t("startCookingModeBtn")}</span>
          </button>

          <button
            onClick={handleProceedToStoreComparison}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {language === "zh-HK" ? "比較超市格價並買餸" : "Compare Supermarkets & Buy"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Ingredients & Pantry Check (Left) + Step-by-Step Instructions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ingredients & Pantry Check column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-stone-900">
                  {language === "zh-HK" ? "食材清單" : "Ingredients List"}
                </h2>
                <p className="text-xs text-stone-500">
                  {language === "zh-HK" ? "可依人數自由調整份量" : "Scale portions as needed"}
                </p>
              </div>

              {/* Portion Scaling Controller */}
              <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 font-bold"
                >
                  -
                </button>
                <span className="px-2 text-xs font-bold text-stone-900">
                  {servings} {t("servings")}
                </span>
                <button
                  onClick={() => setServings(Math.min(10, servings + 1))}
                  className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Pantry Check Instruction */}
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                {t("pantryCheckTitle")}
              </span>
              <p className="text-[11px] text-stone-600">
                {t("pantryCheckSubtitle")}
              </p>
            </div>

            {/* List of Ingredients */}
            <ul className="space-y-2">
              {allIngredients.map((item) => {
                const isChecked = pantryItems.has(item.name);
                const scaledAmount = Math.round(item.amount * scaleMultiplier * 10) / 10;
                const displayName = language === "zh-HK" ? item.nameZh || item.name : item.name;

                return (
                  <li
                    key={item.name}
                    onClick={() => togglePantry(item.name)}
                    className={`p-3 rounded-xl border cursor-pointer select-none flex items-center justify-between transition ${isChecked
                      ? "bg-stone-100 border-stone-200 text-stone-400 line-through"
                      : "bg-white border-stone-200 hover:border-brand-300 text-stone-800"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300 flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold">{displayName}</span>
                    </div>

                    <span className="text-xs font-bold text-stone-500">
                      {scaledAmount} {item.unit}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Summary of items to buy */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
              <span>{language === "zh-HK" ? "需採購食材：" : "Items to buy:"}</span>
              <strong className="text-emerald-700 font-bold">
                {itemsToBuy.length} / {allIngredients.length}
              </strong>
            </div>

            <button
              onClick={handleProceedToStoreComparison}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{language === "zh-HK" ? "帶清單去超市格價 →" : "Compare Stores with List →"}</span>
            </button>
          </div>
        </div>

        {/* Steps Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-lg font-black text-stone-900">
                {language === "zh-HK" ? "詳細烹飪步驟" : "Step-by-Step Instructions"}
              </h2>
              <button
                onClick={() => router.push(`/recipe/${dish.id}/cook`)}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Flame className="w-3.5 h-3.5" />
                {t("startCookingModeBtn")}
              </button>
            </div>

            <div className="space-y-6">
              {steps.map((st) => (
                <div key={st.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-500 text-white font-black flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                    {st.step}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-base font-bold text-stone-900">
                      {language === "zh-HK" && st.titleZh ? st.titleZh : st.title}
                    </h3>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      {language === "zh-HK" && st.textZh ? st.textZh : st.text}
                    </p>
                    {st.timerSeconds && (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-700 font-semibold bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200 mt-1">
                        <Clock className="w-3 h-3" />
                        {language === "zh-HK"
                          ? `建議計時：${Math.floor(st.timerSeconds / 60)} 分鐘`
                          : `Suggested Timer: ${Math.floor(st.timerSeconds / 60)} mins`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Food Safety Reminder per Requirement 4.2 */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1 text-xs text-stone-600">
              <span className="font-bold text-stone-900 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-brand-600" />
                Food Safety Reminder
              </span>
              <p>
                Always cook poultry and pork to an internal temperature of at least 75°C (165°F). Keep raw and cooked food separated during preparation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Cooking Mode Modal */}
      {isCookingModeOpen && (
        <CookingModeModal
          recipeTitle={displayTitle}
          steps={steps}
          onClose={() => setIsCookingModeOpen(false)}
        />
      )}
    </div>
  );
}
