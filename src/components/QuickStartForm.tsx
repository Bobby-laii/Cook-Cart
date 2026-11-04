"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { APP_CONFIG } from "@/config/appConfig";
import { COMMON_INGREDIENTS_CATALOGUE } from "@/config/ingredientsCatalogue";
import {
  getPopularIngredientsForCuisine,
  isEuropeanCuisine,
  TOP_50_EUROPEAN_INGREDIENTS,
} from "@/config/regionalIngredients";
import { X, Check, ChevronDown, Loader2, Plus, Minus } from "lucide-react";
import { button, chip, field, iconButton } from "@/components/ui/styles";

export interface QuickStartData {
  cuisine: string;
  ingredients: string[];
  servings: number;
  cookingTimeLimit: string;
  skillLevel: string;
  equipment: string[];
  dietary: string;
  allergies: string;
}

interface QuickStartFormProps {
  onSubmit: (formData: QuickStartData) => void;
  isLoading: boolean;
  initialCuisine?: string;
  /** Fold down to a one-line summary (e.g. once the conversation has messages). */
  collapsed?: boolean;
}

/** Split typed text like "eggs, rice, tomato" into separate ingredients. */
function splitTyped(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * "What's in the fridge?": one ingredient field and Find dishes. Servings, style,
 * time, skill and equipment live behind More options, already set to sensible
 * defaults, so the common case is type and go.
 */
export function QuickStartForm({ onSubmit, isLoading, initialCuisine, collapsed = false }: QuickStartFormProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [showOptions, setShowOptions] = useState(false);

  // Follow the parent: fold away once a conversation starts, open again for a new chat.
  useEffect(() => {
    setIsExpanded(!collapsed);
  }, [collapsed]);

  const [cuisine, setCuisine] = useState("any");

  useEffect(() => {
    if (!initialCuisine) return;
    const normalized = initialCuisine.trim().toLowerCase();
    const matched = APP_CONFIG.cuisines.find(
      (c) =>
        c.id.toLowerCase() === normalized ||
        c.label.toLowerCase().includes(normalized) ||
        normalized.includes(c.id.toLowerCase()) ||
        (normalized === "chinese" && c.id === "cantonese") ||
        (normalized === "latin american" && c.id === "mexican") ||
        (normalized === "australian" && c.id === "western")
    );
    if (matched) {
      setCuisine(matched.id);
      setIsExpanded(true);
    }
  }, [initialCuisine]);

  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [servings, setServings] = useState(2);
  const [cookingTimeLimit, setCookingTimeLimit] = useState("30 mins");
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [equipment, setEquipment] = useState<string[]>(["stove"]);
  const [dietary] = useState("None");
  const [allergies] = useState("");

  const isEuropean = useMemo(() => isEuropeanCuisine(cuisine), [cuisine]);

  // Quick-add chips: everyday staples by default, the chosen cuisine's staples otherwise.
  const popularChips = useMemo(() => getPopularIngredientsForCuisine(cuisine, 10), [cuisine]);

  // Searchable list: the general catalogue and the European benchmark ingredients.
  // When a European cuisine is chosen, the European items are ranked first.
  const searchCatalogue = useMemo(() => {
    const european = TOP_50_EUROPEAN_INGREDIENTS.map((i) => ({ en: i.en }));
    const europeanEn = new Set(european.map((i) => i.en.toLowerCase()));
    const general = COMMON_INGREDIENTS_CATALOGUE.filter((i) => !europeanEn.has(i.en.toLowerCase()));
    return isEuropean ? [...european, ...general] : [...general, ...european];
  }, [isEuropean]);

  // Local autocomplete, from 2 letters.
  const matchingSuggestions = useMemo(() => {
    const query = ingredientInput.trim().toLowerCase();
    if (query.length < 2) return [];
    return searchCatalogue
      .filter((item) => item.en.toLowerCase().includes(query) && !ingredients.includes(item.en))
      .slice(0, 8);
  }, [ingredientInput, ingredients, searchCatalogue]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addIngredients = (items: string[]) => {
    const next = [...ingredients];
    for (const item of items) {
      if (!next.some((i) => i.toLowerCase() === item.toLowerCase())) next.push(item);
    }
    setIngredients(next);
    return next;
  };

  const handleAddIngredient = (itemToAdd?: string) => {
    const items = itemToAdd ? [itemToAdd] : splitTyped(ingredientInput);
    if (items.length === 0) return;
    addIngredients(items);
    setIngredientInput("");
    setShowSuggestions(false);
  };

  const handleRemoveIngredient = (itemToRemove: string) => {
    setIngredients(ingredients.filter((i) => i !== itemToRemove));
  };

  const handleToggleEquipment = (eqId: string) => {
    setEquipment(equipment.includes(eqId) ? equipment.filter((e) => e !== eqId) : [...equipment, eqId]);
  };

  const selectedCuisineObj = useMemo(() => APP_CONFIG.cuisines.find((c) => c.id === cuisine), [cuisine]);
  const cuisineDisplayName = selectedCuisineObj ? selectedCuisineObj.label : cuisine;

  const peopleWord = servings === 1 ? "person" : t("people");
  const typed = splitTyped(ingredientInput);
  const canSubmit = !isLoading && (ingredients.length > 0 || typed.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Whatever is still in the field counts too, so "eggs, rice" + Find dishes just works.
    const all = typed.length > 0 ? addIngredients(typed) : ingredients;
    if (all.length === 0) return;
    setIngredientInput("");
    setShowSuggestions(false);

    onSubmit({
      cuisine: cuisineDisplayName,
      ingredients: all,
      servings,
      cookingTimeLimit,
      skillLevel,
      equipment,
      dietary,
      allergies,
    });
  };

  const timeLabel =
    cookingTimeLimit === "any"
      ? t("anyTime")
      : cookingTimeLimit === "30 mins"
        ? t("quickUnder30")
        : cookingTimeLimit === "45 mins"
          ? t("quickUnder45")
          : t("quickUnder60");

  // Folded once a conversation is under way so the messages get the screen; the
  // summary keeps what was asked for visible.
  if (!isExpanded) {
    return (
      <div className="flex items-center justify-between gap-3 py-3 border-y border-stone-200">
        <div className="min-w-0">
          <p className="font-bold text-stone-900">{"What's in the fridge?"}</p>
          <p className="text-sm text-stone-500 truncate">
            {ingredients.length > 0
              ? `${ingredients.join(", ")} for ${servings} ${peopleWord}`
              : "Add what you have and I'll suggest three dishes."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          aria-expanded={false}
          className={button("secondary", "sm", "shrink-0")}
        >
          {ingredients.length > 0 ? "Change" : "Open"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-medium text-[26px] leading-[1.15] text-stone-900">
            {"What's in the fridge?"}
          </h2>
          <p className="mt-1 text-stone-500">{"Add what you have. I'll suggest three dishes that use all of it."}</p>
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            aria-expanded={true}
            className={button("ghost", "sm", "shrink-0 -mt-2 -mr-2 px-3 font-normal text-stone-500 hover:text-stone-900")}
          >
            Hide
          </button>
        )}
      </header>

      {/* The one required input */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div ref={inputContainerRef} className="relative flex-1 min-w-0">
          <label htmlFor="ingredient-input" className="sr-only">
            Ingredients you have
          </label>
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
                // Enter adds what was typed; Find dishes sends.
                e.preventDefault();
                if (matchingSuggestions.length > 0 && showSuggestions) {
                  handleAddIngredient(matchingSuggestions[0].en);
                } else {
                  handleAddIngredient();
                }
              } else if (e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            placeholder="Eggs, rice, tomatoes"
            className={field()}
            autoComplete="off"
            enterKeyHint="done"
          />

          {showSuggestions && matchingSuggestions.length > 0 && (
            <ul className="absolute z-30 left-0 right-0 top-full mt-1 bg-stone-50 rounded-lg border border-stone-200 max-h-64 overflow-y-auto py-1">
              {matchingSuggestions.map((item, idx) => (
                <li key={item.en}>
                  <button
                    type="button"
                    onClick={() => handleAddIngredient(item.en)}
                    className={`w-full min-h-12 px-4 py-3 text-left text-stone-900 hover:bg-stone-100 ${
                      idx === 0 ? "bg-stone-100" : ""
                    }`}
                  >
                    {item.en}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={button("primary", "md", "shrink-0")}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {isLoading ? "Finding dishes" : "Find dishes"}
        </button>
      </div>

      {/* What has been added so far */}
      {ingredients.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Added ingredients">
          {ingredients.map((item) => (
            <li
              key={item}
              className={chip(true, "gap-0 pr-0")}
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveIngredient(item)}
                className={iconButton("ghost", "sm", "rounded-full text-white hover:bg-white/15")}
                aria-label={`Remove ${item}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Quick add, one tap each */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quick add">
        {popularChips
          .filter((item) => !ingredients.some((i) => i.toLowerCase() === item.en.toLowerCase()))
          .map((item) => (
            <button
              key={item.en}
              type="button"
              onClick={() => handleAddIngredient(item.en)}
              aria-label={`Add ${item.en}`}
              className={chip(false)}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {item.en}
            </button>
          ))}
      </div>

      {/* Everything else, already set to sensible defaults */}
      <div className="border-t border-stone-200">
        <button
          type="button"
          onClick={() => setShowOptions((o) => !o)}
          aria-expanded={showOptions}
          aria-controls="quickstart-options"
          className="w-full flex items-center justify-between gap-3 min-h-12 py-3 text-left"
        >
          <span className="min-w-0">
            <span className="block font-bold text-stone-900">More options</span>
            <span className="block text-sm text-stone-500 truncate">
              {`For ${servings} ${peopleWord}, ${cuisineDisplayName.toLowerCase()}, ${timeLabel.toLowerCase()}`}
            </span>
          </span>
          <ChevronDown
            className={`w-5 h-5 shrink-0 text-stone-500 transition-transform motion-reduce:transition-none ${
              showOptions ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {showOptions && (
          <div id="quickstart-options" className="grid gap-5 pb-5 sm:grid-cols-2">
            <div className="space-y-2">
              <span id="servings-label" className="block text-small font-bold text-stone-900">
                Cooking for
              </span>
              <div className={field("inline-flex h-auto w-auto items-center px-0")} role="group" aria-labelledby="servings-label">
                <button
                  type="button"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className={iconButton("ghost", "sm", "hover:bg-stone-200")}
                  aria-label="Fewer people"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="min-w-[5.5rem] px-1 text-center font-mono whitespace-nowrap" aria-live="polite">
                  {servings} {peopleWord}
                </span>
                <button
                  type="button"
                  onClick={() => setServings(Math.min(10, servings + 1))}
                  className={iconButton("ghost", "sm", "hover:bg-stone-200")}
                  aria-label="More people"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <label className="space-y-2">
              <span className="block text-small font-bold text-stone-900">Style</span>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className={field("pr-8")}
              >
                <optgroup label="No particular country">
                  {APP_CONFIG.cuisines
                    .filter((c) => c.broadStyle)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="A specific cuisine">
                  {APP_CONFIG.cuisines
                    .filter((c) => !c.broadStyle)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                </optgroup>
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-small font-bold text-stone-900">{t("cookingTimeLabel")}</span>
              <select
                value={cookingTimeLimit}
                onChange={(e) => setCookingTimeLimit(e.target.value)}
                className={field()}
              >
                <option value="any">{t("anyTime")}</option>
                <option value="30 mins">{t("quickUnder30")}</option>
                <option value="45 mins">{t("quickUnder45")}</option>
                <option value="60 mins">{t("quickUnder60")}</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-small font-bold text-stone-900">{t("skillLevelLabel")}</span>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className={field()}
              >
                {APP_CONFIG.skillLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="text-small font-bold text-stone-900 mb-2">What your kitchen has</legend>
              <div className="flex flex-wrap gap-2">
                {APP_CONFIG.equipmentList.map((eq) => {
                  const on = equipment.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => handleToggleEquipment(eq.id)}
                      aria-pressed={on}
                      className={chip(on)}
                    >
                      {on && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      {eq.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}
      </div>
    </form>
  );
}
