"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { CookingModeModal } from "@/components/CookingModeModal";
import { RecipeIngredient, RecipeStep, DishSuggestion } from "@/types";
import { MEALDB_ID_PREFIX } from "@/lib/recipes/mealdb";
import { Clock, ListChecks, Flame, AlertCircle } from "lucide-react";
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
    <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-24">
      {/* Opening: photo and title side by side, like the first page of a recipe */}
      <header className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14 items-center">
        {dish.imageUrl && (
          <img
            src={dish.imageUrl}
            alt={displayTitle}
            width={700}
            height={700}
            className="w-full aspect-[4/3] object-cover rounded-md lg:order-2"
          />
        )}

        <div>
          <p className="text-sm text-stone-500">
            {dish.cuisine}
            {/* A live recipe is real but does not necessarily use everything the user
                picked, so "uses all your ingredients" would be a false claim there.
                Show the source instead, which the source's terms also expect. */}
            {hasRealSteps ? (
              dish.sourceUrl ? (
                <>
                  {" · "}
                  <a
                    href={dish.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 decoration-stone-300 hover:text-stone-900"
                  >
                    {zh ? "來源" : "from"} {dish.sourceName || (zh ? "外部網站" : "external site")}
                  </a>
                </>
              ) : null
            ) : (
              <span className="text-fresh-700">{zh ? " · 用晒你所有食材" : " · uses all your ingredients"}</span>
            )}
          </p>

          <h1
            className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-stone-900"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
          >
            {displayTitle}
          </h1>

          {displayDesc && displayDesc !== dish.cuisine && (
            <p className="mt-4 text-lg text-stone-600 leading-relaxed max-w-xl">{displayDesc}</p>
          )}

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {/* 0 means the source gave no time or difficulty (menu dishes); hide rather than guess. */}
            {dish.cookTimeMinutes > 0 && (
              <>
                <div>
                  <dt className="text-stone-500">{zh ? "時間" : "Time"}</dt>
                  <dd className="font-medium text-stone-900">{dish.cookTimeMinutes} {t("mins")}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">{zh ? "難度" : "Difficulty"}</dt>
                  <dd className="font-medium text-stone-900">{dish.difficulty}</dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-stone-500">{zh ? "材料" : "Ingredients"}</dt>
              <dd className="font-medium text-stone-900">{allIngredients.length}</dd>
            </div>
            <div>
              <dt className="text-stone-500">{zh ? "步驟" : "Steps"}</dt>
              <dd className="font-medium text-stone-900">{steps.length}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => router.push(`/recipe/${dish.id}/cook`)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-brand-500 hover:bg-brand-600 text-white font-medium transition"
            >
              <Flame className="w-4 h-4" />
              {zh ? "開始煮" : "Start cooking"}
            </button>
            <button
              onClick={shareShoppingList}
              disabled={itemsToBuy.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50 font-medium transition disabled:opacity-40"
            >
              <ListChecks className="w-4 h-4" />
              {listCopied ? (zh ? "已複製清單" : "List copied") : zh ? "購物清單" : "Shopping list"}
            </button>
          </div>
        </div>
      </header>

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        {/* Ingredients, with "already have it" ticks that shape the shopping list */}
        <section className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-end justify-between gap-4 border-b border-stone-300 pb-3">
            <h2 className="font-serif text-3xl text-stone-900">{zh ? "材料" : "Ingredients"}</h2>
            <div className="flex items-center gap-1 text-sm">
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="w-8 h-8 rounded-full border border-stone-300 text-stone-700 hover:border-stone-900"
                aria-label={zh ? "減少份量" : "Fewer servings"}
              >
                −
              </button>
              <span className="w-20 text-center font-mono text-stone-900 whitespace-nowrap" aria-live="polite">
                {zh ? `${servings} ${t("servings")}` : `Serves ${servings}`}
              </span>
              <button
                onClick={() => setServings(Math.min(10, servings + 1))}
                className="w-8 h-8 rounded-full border border-stone-300 text-stone-700 hover:border-stone-900"
                aria-label={zh ? "增加份量" : "More servings"}
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-sm" role="group" aria-label={zh ? "單位" : "Units"}>
            {(["metric", "us"] as const).map((system) => (
              <button
                key={system}
                onClick={() => setUnits(system)}
                aria-pressed={units === system}
                className={`px-3 py-1 rounded-full border transition ${
                  units === system
                    ? "bg-stone-900 border-stone-900 text-stone-50"
                    : "border-stone-300 text-stone-600 hover:border-stone-900"
                }`}
              >
                {system === "metric" ? (zh ? "公制 g · ml · °C" : "Metric g · ml · °C") : zh ? "美制 cup · oz · °F" : "US cup · oz · °F"}
              </button>
            ))}
          </div>

          <p className="mt-3 text-sm text-stone-500">
            {zh ? "剔走屋企已經有嘅，佢就唔會加入購物清單。" : "Tick what you already have at home, so it stays off the shopping list."}
          </p>

          <ul className="mt-2">
            {allIngredients.map((item) => {
              const have = pantryItems.has(item.name);
              const displayName = zh ? item.nameZh || item.name : item.name;
              return (
                <li key={item.name} className="border-b border-stone-200">
                  <label className="flex items-center gap-3 py-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={have}
                      onChange={() => togglePantry(item.name)}
                      className="w-4 h-4 rounded border-stone-400 accent-fresh-600 shrink-0"
                    />
                    <span className={`flex-1 ${have ? "text-stone-400 line-through" : "text-stone-900"}`}>
                      {displayName}
                    </span>
                    <span className={`font-mono text-sm ${have ? "text-stone-400" : "text-stone-600"}`}>
                      {shownAmount(item)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm text-stone-600">
              {zh
                ? `要買 ${itemsToBuy.length} 樣（共 ${allIngredients.length} 樣）`
                : `${itemsToBuy.length} of ${allIngredients.length} to buy`}
            </p>
            <button
              onClick={shareShoppingList}
              disabled={itemsToBuy.length === 0}
              className="inline-flex items-center gap-1.5 text-brand-600 font-medium hover:text-brand-700 disabled:text-stone-400"
            >
              <ListChecks className="w-4 h-4" />
              {listCopied ? (zh ? "已複製" : "Copied") : zh ? "分享清單" : "Share the list"}
            </button>
          </div>
        </section>

        {/* Method */}
        <section>
          <h2 className="font-serif text-3xl text-stone-900 border-b border-stone-300 pb-3">
            {zh ? "做法" : "Method"}
          </h2>
          <ol className="mt-2">
            {steps.map((st) => (
              <li key={st.step} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6 border-b border-stone-200">
                <span className="font-serif text-3xl leading-none text-brand-500" aria-hidden="true">
                  {st.step}
                </span>
                <div>
                  {/* Generic "Step n" titles add nothing next to the numeral, so only real titles show. */}
                  {!/^step \d+$/i.test(st.title) && (
                    <h3 className="font-semibold text-stone-900 mb-1.5">
                      {zh && st.titleZh ? st.titleZh : st.title}
                    </h3>
                  )}
                  <p className="text-stone-700 leading-relaxed">{convertTemperatures(zh && st.textZh ? st.textZh : st.text, units)}</p>
                  {st.timerSeconds && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-700">
                      <Clock className="w-3.5 h-3.5" />
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
          <p className="mt-8 text-sm text-stone-500 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
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
