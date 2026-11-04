"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { CookingModeModal } from "@/components/CookingModeModal";
import { RecipeIngredient, RecipeStep, DishSuggestion } from "@/types";
import { MEALDB_ID_PREFIX } from "@/lib/recipes/mealdb";
import { Check, Clock, ListChecks, AlertCircle } from "lucide-react";
import { convertAmount, convertTemperatures } from "@/lib/units";
import { useUnitSystem } from "@/lib/useUnitSystem";

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
  const [listCopied, setListCopied] = useState(false);
  const [units, setUnits] = useUnitSystem();

  useEffect(() => {
    // 1. Try to load from session storage (passed from chat card)
    const cached = sessionStorage.getItem("cookcart_active_dish");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Only trust the cache for this exact dish; a leftover dish from an earlier
        // visit would otherwise show up under any recipe URL.
        if (parsed.id === params.id) {
          setDish(parsed);
          setServings(parsed.servings || 2);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 1b. Menu dishes can be loaded by id, so a shared or reloaded link still works.
    const id = String(params.id);
    if (id.startsWith(MEALDB_ID_PREFIX)) {
      fetch(`/api/menu/${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.dish) return;
          sessionStorage.setItem("cookcart_active_dish", JSON.stringify(data.dish));
          setDish(data.dish);
          setServings(data.dish.servings || 2);
        })
        .catch((e) => console.error(e));
      return;
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
      <div className="max-w-4xl mx-auto px-5 py-16 text-center">
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

  // Amounts as the cook will read them: scaled to servings, then put in their unit system.
  const shownAmount = (item: RecipeIngredient) => {
    const { amount, unit } = convertAmount(item.amount * scaleMultiplier, item.unit, units);
    return `${formatAmount(amount)} ${unit}`.trim();
  };

  // A plain list to take shopping: no prices, no stores. On phones the share sheet
  // sends it straight to a chat or notes app; elsewhere it is copied.
  const shareShoppingList = async () => {
    const lines = itemsToBuy.map((i) => `- ${language === "zh-HK" ? i.nameZh || i.name : i.name} (${shownAmount(i)})`);
    const text = `${language === "zh-HK" ? "購物清單" : "Shopping list"}: ${dish.title}\n${lines.join("\n")}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setListCopied(true);
      setTimeout(() => setListCopied(false), 2500);
    } catch {
      // The cook closed the share sheet, or the clipboard was refused; nothing to undo.
    }
  };

  const displayTitle = language === "zh-HK" ? dish.titleZh || dish.title : dish.title;
  const displayDesc = language === "zh-HK" ? dish.descriptionZh || dish.description : dish.description;

  const zh = language === "zh-HK";

  return (
    <article className="pb-[calc(var(--tabbar-space)+6.5rem)] md:pb-24">
      {/* Opening: on a phone the photo runs edge to edge; from md up it sits beside the title. */}
      <header className="max-w-6xl mx-auto md:px-6 lg:px-8 md:pt-10 grid gap-5 md:gap-10 md:grid-cols-[1.1fr_1fr] lg:gap-14 md:items-center">
        {dish.imageUrl && (
          <img
            src={dish.imageUrl}
            alt={displayTitle}
            width={700}
            height={700}
            className="w-full aspect-[4/3] object-cover bg-stone-200 md:rounded-lg md:order-2"
          />
        )}

        <div className={`px-5 md:px-0 ${dish.imageUrl ? "" : "pt-6 md:pt-0"}`}>
          <h1 className="text-[32px] md:text-[40px] leading-[1.1] font-bold text-stone-900">{displayTitle}</h1>

          {displayDesc && displayDesc !== dish.cuisine && (
            <p className="mt-3 text-stone-600 max-w-xl">{displayDesc}</p>
          )}

          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-stone-600">
            <li>{dish.cuisine}</li>
            {/* 0 means the source gave no time or difficulty (menu dishes); hide rather than guess. */}
            {dish.cookTimeMinutes > 0 && (
              <>
                <li>{zh ? `${dish.cookTimeMinutes} 分鐘` : `${dish.cookTimeMinutes} min`}</li>
                <li>{dish.difficulty}</li>
              </>
            )}
            <li>{zh ? `${allIngredients.length} 樣材料` : `${allIngredients.length} ingredients`}</li>
            <li>{zh ? `${steps.length} 個步驟` : `${steps.length} steps`}</li>
            {dish.needsOven && <li className="text-stone-900 font-bold">{zh ? "需要焗爐" : "Needs an oven"}</li>}
          </ul>

          {/* A live recipe is real but does not necessarily use everything the user
              picked, so "uses all your ingredients" would be a false claim there.
              Show the source instead, which the source's terms also expect. */}
          {hasRealSteps ? (
            dish.sourceUrl ? (
              <p className="mt-2 text-[15px] text-stone-500">
                <a
                  href={dish.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 decoration-stone-300 hover:text-stone-900"
                >
                  {zh ? "來源：" : "Recipe from "}
                  {dish.sourceName || (zh ? "外部網站" : "an external site")}
                </a>
              </p>
            ) : null
          ) : (
            <p className="mt-2 text-[15px] text-fresh-700">
              {zh ? "用晒你所有食材" : "Uses all your ingredients"}
            </p>
          )}

          {/* Actions: a sticky bar above the tab bar on a phone, inline from md up. */}
          <div className="fixed inset-x-0 above-tabbar z-30 bg-stone-50 border-t border-stone-200 px-5 py-3 flex gap-3 md:static md:z-auto md:mt-8 md:p-0 md:bg-transparent md:border-0">
            <button
              onClick={() => router.push(`/recipe/${dish.id}/cook`)}
              className="flex-1 md:flex-none inline-flex items-center justify-center h-[52px] px-5 whitespace-nowrap rounded-md bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors"
            >
              {zh ? "開始煮" : "Start cooking"}
            </button>
            <button
              onClick={shareShoppingList}
              disabled={itemsToBuy.length === 0}
              className="inline-flex items-center justify-center gap-2 h-[52px] px-4 whitespace-nowrap rounded-md border border-stone-300 bg-stone-50 text-stone-900 font-bold hover:border-stone-500 transition-colors disabled:opacity-40"
            >
              <ListChecks className="w-5 h-5" aria-hidden="true" />
              {listCopied ? (zh ? "已複製清單" : "List copied") : zh ? "購物清單" : "Shopping list"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 mt-10 md:mt-14 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        {/* Ingredients, with "already have it" ticks that shape the shopping list */}
        <section className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[22px] leading-tight font-bold text-stone-900">{zh ? "材料" : "Ingredients"}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="w-11 h-11 rounded-full border border-stone-200 bg-stone-50 text-xl text-stone-900 hover:border-stone-400"
                aria-label={zh ? "減少份量" : "Fewer servings"}
              >
                −
              </button>
              <span className="w-24 text-center font-mono text-[15px] text-stone-900 whitespace-nowrap" aria-live="polite">
                {zh ? `${servings} ${t("servings")}` : `Serves ${servings}`}
              </span>
              <button
                onClick={() => setServings(Math.min(10, servings + 1))}
                className="w-11 h-11 rounded-full border border-stone-200 bg-stone-50 text-xl text-stone-900 hover:border-stone-400"
                aria-label={zh ? "增加份量" : "More servings"}
              >
                +
              </button>
            </div>
          </div>

          <div
            className="mt-4 inline-flex p-1 rounded-full bg-stone-200"
            role="group"
            aria-label={zh ? "單位" : "Units"}
          >
            {(["metric", "us"] as const).map((system) => (
              <button
                key={system}
                onClick={() => setUnits(system)}
                aria-pressed={units === system}
                className={`h-10 px-5 rounded-full text-[15px] transition-colors ${
                  units === system ? "bg-stone-50 text-stone-900 font-bold" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {system === "metric" ? (zh ? "公制（克、毫升）" : "Metric") : zh ? "美制（杯、安士）" : "US cups"}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-stone-500">
            {zh ? "剔走屋企已經有嘅，佢就唔會加入購物清單。" : "Tick what you already have at home, so it stays off the shopping list."}
          </p>

          <ul className="mt-3 rounded-2xl bg-stone-50 divide-y divide-stone-200 overflow-hidden">
            {allIngredients.map((item) => {
              const have = pantryItems.has(item.name);
              const displayName = zh ? item.nameZh || item.name : item.name;
              return (
                <li key={item.name}>
                  <label className="flex items-center gap-3 min-h-[52px] px-4 py-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={have}
                      onChange={() => togglePantry(item.name)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 ${
                        have ? "bg-fresh-600 border-fresh-600 text-white" : "border-stone-300 bg-stone-50"
                      }`}
                    >
                      {have && <Check className="w-4 h-4" strokeWidth={3} />}
                    </span>
                    <span className={`flex-1 ${have ? "text-stone-500 line-through" : "text-stone-900"}`}>
                      {displayName}
                    </span>
                    <span className={`font-mono text-[15px] text-right ${have ? "text-stone-400" : "text-stone-600"}`}>
                      {shownAmount(item)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-sm text-stone-500">
              {zh
                ? `要買 ${itemsToBuy.length} 樣（共 ${allIngredients.length} 樣）`
                : `${itemsToBuy.length} of ${allIngredients.length} to buy`}
            </p>
            <button
              onClick={shareShoppingList}
              disabled={itemsToBuy.length === 0}
              className="h-12 px-1 text-brand-600 font-bold hover:text-brand-700 disabled:text-stone-400"
            >
              {listCopied ? (zh ? "已複製" : "Copied") : zh ? "分享清單" : "Share list"}
            </button>
          </div>
        </section>

        {/* Method */}
        <section>
          <h2 className="text-[22px] leading-tight font-bold text-stone-900">{zh ? "做法" : "Method"}</h2>
          <ol className="mt-5 space-y-7">
            {steps.map((st, idx) => (
              <li key={`${idx}-${st.step}`} className="grid grid-cols-[2.25rem_1fr] gap-3">
                <span className="font-mono text-[22px] leading-[1.2] font-bold text-brand-500" aria-hidden="true">
                  {idx + 1}
                </span>
                <div>
                  {/* Generic "Step n" titles add nothing next to the numeral, so only real titles show. */}
                  {!/^step \d+$/i.test(st.title) && (
                    <h3 className="font-bold text-stone-900 mb-1">{zh && st.titleZh ? st.titleZh : st.title}</h3>
                  )}
                  <p className="text-stone-700">{convertTemperatures(zh && st.textZh ? st.textZh : st.text, units)}</p>
                  {st.timerSeconds && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-stone-600">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      {zh
                        ? `計時 ${Math.floor(st.timerSeconds / 60)} 分鐘`
                        : `Set a timer for ${Math.floor(st.timerSeconds / 60)} min`}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {/* Food safety reminder (Requirement 4.2) */}
          <p className="mt-10 text-sm text-stone-500 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {zh
              ? "雞肉同豬肉要煮到中心溫度至少 75°C。生熟食物要分開處理。"
              : "Cook chicken and pork to at least 75°C (165°F) inside. Keep raw and cooked food apart while you prep."}
          </p>
        </section>
      </div>

      {isCookingModeOpen && (
        <CookingModeModal
          recipeTitle={displayTitle}
          steps={steps}
          onClose={() => setIsCookingModeOpen(false)}
        />
      )}
    </article>
  );
}

const FRACTIONS: [number, string][] = [
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.5, "½"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
];

/** 0.75 → "¾", 2.5 → "2½", 1.2 → "1.2": kitchen-style amounts instead of raw decimals. */
function formatAmount(value: number): string {
  const whole = Math.floor(value);
  const rest = value - whole;
  if (rest < 0.05) return String(whole || value.toFixed(1));
  const fraction = FRACTIONS.find(([f]) => Math.abs(rest - f) < 0.04);
  if (fraction) return `${whole || ""}${fraction[1]}`;
  return String(Math.round(value * 10) / 10);
}
