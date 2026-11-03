"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { APP_CONFIG } from "@/config/appConfig";
import { COMMON_INGREDIENTS_CATALOGUE, IngredientItem } from "@/config/ingredientsCatalogue";
import {
  getPopularIngredientsForCuisine,
  isEuropeanCuisine,
  TOP_50_EUROPEAN_INGREDIENTS,
} from "@/config/regionalIngredients";
import { X, Check, ChevronDown, Loader2, Plus } from "lucide-react";

interface QuickStartFormProps {
  onSubmit: (formData: {
    cuisine: string;
    ingredients: string[];
    servings: number;
    cookingTimeLimit: string;
    skillLevel: string;
    equipment: string[];
    dietary: string;
    allergies: string;
  }) => void;
  isLoading: boolean;
  initialCuisine?: string;
  /** Collapse to the summary bar (e.g. once the conversation has messages). */
  collapsed?: boolean;
}

export function QuickStartForm({ onSubmit, isLoading, initialCuisine, collapsed = false }: QuickStartFormProps) {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  // Follow the parent: fold away once a conversation starts, open again for a new chat.
  useEffect(() => {
    setIsExpanded(!collapsed);
  }, [collapsed]);

  // Form states
  const [cuisine, setCuisine] = useState("cantonese");

  React.useEffect(() => {
    if (!initialCuisine) return;
    const normalized = initialCuisine.trim().toLowerCase();
    const matched = APP_CONFIG.cuisines.find(
      (c) =>
        c.id.toLowerCase() === normalized ||
        c.label.toLowerCase().includes(normalized) ||
        normalized.includes(c.id.toLowerCase()) ||
        (normalized === "chinese" && c.id === "cantonese") ||
        (normalized === "british" && c.id === "western") ||
        (normalized === "latin american" && c.id === "mexican") ||
        (normalized === "australian" && c.id === "western")
    );
    if (matched) {
      setCuisine(matched.id);
      setIsExpanded(true);
    }
  }, [initialCuisine]);
  const [ingredientInput, setIngredientInput] = useState("");
  // Start with clean empty array so user selects their own ingredients
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [servings, setServings] = useState(2);
  const [cookingTimeLimit, setCookingTimeLimit] = useState("30 mins");
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [equipment, setEquipment] = useState<string[]>(["stove", "rice_cooker"]);
  const [dietary, setDietary] = useState("None");
  const [allergies, setAllergies] = useState("");

  // Check if current cuisine selection is European
  const isEuropean = useMemo(() => isEuropeanCuisine(cuisine), [cuisine]);

  // Quick tap: Top 10 for European cuisines, regional staples otherwise
  const popularChips = useMemo(() => {
    return getPopularIngredientsForCuisine(cuisine, 12);
  }, [cuisine]);

  // Searchable list: all 50 European benchmark ingredients + general catalogue.
  // When a European cuisine is selected, the European items are ranked first.
  const searchCatalogue = useMemo(() => {
    const european = TOP_50_EUROPEAN_INGREDIENTS.map((i) => ({ en: i.en, zh: i.zh }));
    const europeanEn = new Set(european.map((i) => i.en.toLowerCase()));
    const general = COMMON_INGREDIENTS_CATALOGUE.filter((i) => !europeanEn.has(i.en.toLowerCase()));
    return isEuropean ? [...european, ...general] : [...general, ...european];
  }, [isEuropean]);

  // Real-time local autocomplete: starts after 2 letters (or 1 Chinese character)
  const matchingSuggestions = useMemo(() => {
    const query = ingredientInput.trim().toLowerCase();
    const hasCjk = /[\u3400-\u9FFF]/.test(query);
    if (!query || (!hasCjk && query.length < 2)) return [];
    return searchCatalogue.filter((item) => {
      const matchEn = item.en.toLowerCase().includes(query);
      const matchZh = item.zh.includes(query);
      const alreadySelected =
        ingredients.includes(item.en) ||
        ingredients.includes(item.zh) ||
        ingredients.includes(language === "zh-HK" ? item.zh : item.en);
      return (matchEn || matchZh) && !alreadySelected;
    }).slice(0, 8);
  }, [ingredientInput, ingredients, language, searchCatalogue]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddIngredient = (itemToAdd?: string) => {
    const val = (itemToAdd || ingredientInput).trim();
    if (val && !ingredients.includes(val)) {
      setIngredients([...ingredients, val]);
      setIngredientInput("");
      setShowSuggestions(false);
    }
  };

  const handleRemoveIngredient = (itemToRemove: string) => {
    setIngredients(ingredients.filter((i) => i !== itemToRemove));
  };

  const handleToggleEquipment = (eqId: string) => {
    if (equipment.includes(eqId)) {
      setEquipment(equipment.filter((e) => e !== eqId));
    } else {
      setEquipment([...equipment, eqId]);
    }
  };

  // Resolved display name for selected cuisine
  const selectedCuisineObj = useMemo(
    () => APP_CONFIG.cuisines.find((c) => c.id === cuisine),
    [cuisine]
  );
  const cuisineDisplayName = selectedCuisineObj
    ? language === "zh-HK"
      ? selectedCuisineObj.labelZh
      : selectedCuisineObj.label
    : cuisine;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.length === 0) {
      alert(t("noIngredientsError"));
      return;
    }

    // Send the label in the user's own language, so the AI reply matches the UI
    // instead of quoting an English cuisine name back at a Chinese-speaking user.
    const cuisineLabel = cuisineDisplayName;

    onSubmit({
      cuisine: cuisineLabel,
      ingredients,
      servings,
      cookingTimeLimit,
      skillLevel,
      equipment,
      dietary,
      allergies,
    });
  };

  const zh = language === "zh-HK";
  const timeLabel =
    cookingTimeLimit === "any"
      ? t("anyTime")
      : cookingTimeLimit === "30 mins"
        ? t("quickUnder30")
        : cookingTimeLimit === "45 mins"
          ? t("quickUnder45")
          : t("quickUnder60");
  const skillLabel = (() => {
    const lvl = APP_CONFIG.skillLevels.find((l) => l.id === skillLevel);
    return lvl ? (zh ? lvl.labelZh : lvl.label) : skillLevel;
  })();

  const fieldClass =
    "rounded-md border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:border-brand-500";

  // Collapsed once a conversation is under way so the messages get the screen; the
  // summary keeps what was asked for visible.
  if (!isExpanded) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
        <div className="min-w-0">
          <p className="font-bold text-stone-900">{zh ? "用食材搵菜式" : "Search by ingredients"}</p>
          <p className="text-sm text-stone-500 truncate">
            {ingredients.length > 0
              ? zh
                ? `${ingredients.join("、")}，${servings} ${t("people")}，${cuisineDisplayName}`
                : `${ingredients.join(", ")} for ${servings} ${t("people")}, ${cuisineDisplayName}`
              : zh
                ? "話我知你有咩食材，我建議三道菜。"
                : "Tell me what you have and I'll suggest three dishes."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          aria-expanded={false}
          className="shrink-0 h-12 px-4 rounded-md border border-stone-200 bg-stone-50 text-stone-900 font-bold hover:border-brand-500 hover:text-brand-600 transition"
        >
          {ingredients.length > 0 ? (zh ? "修改" : "Edit") : zh ? "打開" : "Open"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] leading-tight font-bold text-stone-900">
            {zh ? "雪櫃有乜？" : "What's in the fridge?"}
          </h2>
          <p className="mt-1 text-sm text-stone-500 max-w-xl">
            {zh
              ? "加入你手上有嘅食材。我哋會建議三道菜，每道都用晒佢哋。"
              : "Add what you have. We'll suggest three dishes, each using all of it."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          aria-expanded={true}
          className="shrink-0 h-12 -mt-2 -mr-2 px-3 rounded-md text-sm text-stone-500 hover:text-stone-900"
        >
          {zh ? "收起" : "Hide"}
        </button>
      </header>

      {/* Ingredients: the one required input, so it comes first and gets the space. */}
      <section className="space-y-3">
        <div ref={inputContainerRef} className="relative">
          <label htmlFor="ingredient-input" className="sr-only">
            {t("ingredientsLabel")}
          </label>
          <div className="flex gap-2">
            <input
              id="ingredient-input"
              type="text"
              value={ingredientInput}
              onChange={(e) => {
                setIngredientInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (ingredientInput.trim()) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (matchingSuggestions.length > 0 && showSuggestions) {
                    const top = matchingSuggestions[0];
                    handleAddIngredient(zh ? top.zh : top.en);
                  } else {
                    handleAddIngredient();
                  }
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              placeholder={zh ? "輸入食材，例如：雞蛋、白菜仔、豆腐" : "Type an ingredient, e.g. eggs, bok choy, tofu"}
              className={`${fieldClass} flex-1 min-w-0 h-12 px-4 text-base placeholder:text-stone-400`}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => handleAddIngredient()}
              className="h-12 px-5 rounded-md border border-brand-500 text-brand-600 font-bold hover:bg-brand-50 transition"
            >
              {t("addIngredientBtn")}
            </button>
          </div>

          {showSuggestions && matchingSuggestions.length > 0 && (
            <ul className="absolute z-30 left-0 right-0 sm:right-24 top-full mt-1 bg-stone-50 rounded-md border border-stone-200 max-h-64 overflow-y-auto py-1">
              {matchingSuggestions.map((item, idx) => {
                const main = zh ? item.zh : item.en;
                const sub = zh ? item.en : item.zh;
                return (
                  <li key={item.en}>
                    <button
                      type="button"
                      onClick={() => handleAddIngredient(main)}
                      className={`w-full min-h-12 px-4 py-3 text-left flex items-baseline gap-2 hover:bg-stone-100 ${
                        idx === 0 ? "bg-stone-100" : ""
                      }`}
                    >
                      <span className="text-stone-900">{main}</span>
                      <span className="text-sm text-stone-500">{sub}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* What has been added so far */}
        {ingredients.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={zh ? "已加入食材" : "Added ingredients"}>
            {ingredients.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-brand-500 text-white text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(item)}
                  className="p-1.5 rounded-full hover:bg-brand-600"
                  aria-label={zh ? `移除${item}` : `Remove ${item}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Common ingredients for the chosen cuisine, one tap each */}
        <div>
          <p className="text-sm text-stone-500 mb-2">
            {zh ? `${cuisineDisplayName}常用：` : `Common in ${cuisineDisplayName.toLowerCase()} cooking:`}
          </p>
          <div className="flex flex-wrap gap-2">
            {popularChips.map((chip) => {
              const label = zh ? chip.zh : chip.en;
              if (ingredients.includes(label) || ingredients.includes(chip.en)) return null;
              return (
                <button
                  key={chip.en}
                  type="button"
                  onClick={() => handleAddIngredient(label)}
                  className="inline-flex items-center gap-1 min-h-10 px-3.5 rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-700 hover:border-brand-500 hover:text-brand-600 transition"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

      </section>

      {/* Who and what style, as one readable line */}
      <section className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-stone-200 pt-4">
        <div className="flex items-center gap-3">
          <span className="text-stone-700">{zh ? "煮俾" : "Cooking for"}</span>
          <div className={`${fieldClass} flex items-center`}>
            <button
              type="button"
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-11 h-12 text-lg text-stone-600 hover:text-stone-900"
              aria-label={zh ? "減少人數" : "Fewer people"}
            >
              −
            </button>
            <span className="min-w-[5.5rem] px-1 text-center font-medium font-mono whitespace-nowrap" aria-live="polite">
              {servings} {t("people")}
            </span>
            <button
              type="button"
              onClick={() => setServings(Math.min(10, servings + 1))}
              className="w-11 h-12 text-lg text-stone-600 hover:text-stone-900"
              aria-label={zh ? "增加人數" : "More people"}
            >
              +
            </button>
          </div>
        </div>

        <label className="flex items-center gap-3">
          <span className="text-stone-700">{zh ? "菜系" : "Style"}</span>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className={`${fieldClass} h-12 pl-3 pr-8`}
          >
            {/* One language only, driven by the user's choice. Country-agnostic styles
                ("Asian Food", "Western Food") are grouped apart as a deliberate choice. */}
            <optgroup label={zh ? "不拘國家" : "No specific country"}>
              {APP_CONFIG.cuisines
                .filter((c) => c.broadStyle)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {zh ? c.labelZh : c.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label={zh ? "特定菜系" : "Specific cuisine"}>
              {APP_CONFIG.cuisines
                .filter((c) => !c.broadStyle)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {zh ? c.labelZh : c.label}
                  </option>
                ))}
            </optgroup>
          </select>
        </label>
      </section>

      {/* Less-used settings, folded away with their current values in the summary */}
      <details className="group border-y border-stone-200">
        <summary className="flex items-center justify-between gap-3 min-h-12 py-3 cursor-pointer list-none text-stone-700 hover:text-stone-900">
          <span>
            <span className="font-bold text-stone-900">{zh ? "廚房同時間" : "Kitchen and time"}</span>
            <span className="block text-sm text-stone-500">
              {[
                timeLabel,
                skillLabel,
                ...APP_CONFIG.equipmentList
                  .filter((eq) => equipment.includes(eq.id))
                  .map((eq) => (zh ? eq.labelZh : eq.label)),
              ].join(zh ? "、" : ", ")}
            </span>
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 transition group-open:rotate-180" />
        </summary>

        <div className="grid gap-5 pb-5 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-stone-900">{t("cookingTimeLabel")}</span>
            <select
              value={cookingTimeLimit}
              onChange={(e) => setCookingTimeLimit(e.target.value)}
              className={`${fieldClass} w-full h-12 px-3`}
            >
              <option value="any">{t("anyTime")}</option>
              <option value="30 mins">{t("quickUnder30")}</option>
              <option value="45 mins">{t("quickUnder45")}</option>
              <option value="60 mins">{t("quickUnder60")}</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-sm font-medium text-stone-900">{t("skillLevelLabel")}</span>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className={`${fieldClass} w-full h-12 px-3`}
            >
              {APP_CONFIG.skillLevels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {zh ? lvl.labelZh : lvl.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-stone-900 mb-2">
              {zh ? "廚房有乜用" : "What your kitchen has"}
            </legend>
            <div className="flex flex-wrap gap-2">
              {APP_CONFIG.equipmentList.map((eq) => {
                const on = equipment.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => handleToggleEquipment(eq.id)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1 min-h-10 px-3.5 rounded-full text-sm border transition ${
                      on
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-700 hover:border-brand-500"
                    }`}
                  >
                    {on && <Check className="w-3.5 h-3.5" />}
                    {zh ? eq.labelZh : eq.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isLoading || ingredients.length === 0}
          className="inline-flex items-center justify-center gap-2 h-[52px] px-6 w-full sm:w-auto rounded-md bg-brand-500 hover:bg-brand-600 text-white font-bold transition disabled:bg-stone-200 disabled:text-stone-500 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />}
          {isLoading ? t("aiThinking") : zh ? "建議三道菜" : "Suggest 3 dishes"}
        </button>
        {ingredients.length === 0 && !isLoading && (
          <span className="text-sm text-stone-500">
            {zh ? "先加至少一樣食材。" : "Add at least one ingredient first."}
          </span>
        )}
      </div>
    </form>
  );
}
