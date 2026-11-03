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
import {
  Sparkles,
  Camera,
  Plus,
  X,
  Users,
  Clock,
  Flame,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Upload,
} from "lucide-react";

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
}

export function QuickStartForm({ onSubmit, isLoading, initialCuisine }: QuickStartFormProps) {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);

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

  // Photo upload states
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setIsAnalyzingPhoto(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);

      try {
        const res = await fetch("/api/ai/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();
        setIsAnalyzingPhoto(false);

        if (res.ok && data.detectedIngredients) {
          setDetectedItems(data.detectedIngredients);
        } else {
          setPhotoError(data.error || "Failed to analyze photo");
        }
      } catch (err: any) {
        setIsAnalyzingPhoto(false);
        setPhotoError(err.message || "Failed to upload photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmDetected = (item: string) => {
    if (!ingredients.includes(item)) {
      setIngredients([...ingredients, item]);
    }
    setDetectedItems(detectedItems.filter((i) => i !== item));
  };

  const handleConfirmAllDetected = () => {
    const combined = Array.from(new Set([...ingredients, ...detectedItems]));
    setIngredients(combined);
    setDetectedItems([]);
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

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden transition-all">
      {/* Header bar with toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50/80 transition select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              {t("quickStartTitle")}
            </h2>
            <p className="text-xs text-stone-500 hidden sm:block">
              {t("quickStartSubtitle")}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-2 text-stone-400 hover:text-stone-700 rounded-lg"
          aria-label="Toggle Form"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 border-t border-stone-100 space-y-6">
          {/* 1. Cuisine Selection & Servings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                {t("cuisineLabel")}
              </label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {/* One language only, driven by the user's choice — never both.
                    The region is intentionally not rendered: "(Asia)" or
                    "(Middle East / Europe)" beside a dish style is just noise. */}
                {/*
                  Split into two groups so the country-agnostic styles ("Asian
                  Food", "Western Food") read as a distinct, deliberate choice
                  rather than being buried among specific cuisines.
                */}
                <optgroup label={language === "zh-HK" ? "不拘國家" : "No Specific Country"}>
                  {APP_CONFIG.cuisines
                    .filter((c) => c.broadStyle)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === "zh-HK" ? c.labelZh : c.label}
                      </option>
                    ))}
                </optgroup>
                <optgroup label={language === "zh-HK" ? "特定菜系" : "Specific Cuisine"}>
                  {APP_CONFIG.cuisines
                    .filter((c) => !c.broadStyle)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === "zh-HK" ? c.labelZh : c.label}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-stone-500" />
                {t("peopleCountLabel")}
              </label>
              <div className="flex items-center rounded-xl border border-stone-300 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 font-bold"
                >
                  -
                </button>
                <span className="flex-1 text-center text-sm font-bold text-stone-900">
                  {servings} {t("people")}
                </span>
                <button
                  type="button"
                  onClick={() => setServings(Math.min(10, servings + 1))}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 2. Core Feature: Ingredients list with "Use All Ingredients" Guarantee */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider">
                {t("ingredientsLabel")}
              </label>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ {language === "zh-HK" ? "核心保證：全數入饌" : "AI uses ALL entered items"}
              </span>
            </div>

            {/* Input bar with instant local autocomplete */}
            <div ref={inputContainerRef} className="relative">
              <div className="flex gap-2">
                <input
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
                        handleAddIngredient(language === "zh-HK" ? top.zh : top.en);
                      } else {
                        handleAddIngredient();
                      }
                    } else if (e.key === "Escape") {
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder={t("ingredientsPlaceholder")}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleAddIngredient()}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-4 h-4" />
                  {t("addIngredientBtn")}
                </button>
              </div>

              {/* Autocomplete Dropdown List */}
              {showSuggestions && matchingSuggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-16 top-full mt-1.5 bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden animate-fadeIn">
                  <div className="p-1.5 max-h-56 overflow-y-auto divide-y divide-stone-100">
                    {matchingSuggestions.map((item, idx) => {
                      const displayMain = language === "zh-HK" ? item.zh : item.en;
                      const displaySub = language === "zh-HK" ? item.en : item.zh;
                      return (
                        <button
                          key={item.en}
                          type="button"
                          onClick={() => handleAddIngredient(displayMain)}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-lg transition hover:bg-amber-50 group ${
                            idx === 0 ? "bg-stone-50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900 group-hover:text-amber-800">
                              {displayMain}
                            </span>
                            <span className="text-xs text-stone-400">
                              ({displaySub})
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition">
                            + {language === "zh-HK" ? "加入" : "Add"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Ingredient Chips */}
            <div className="flex flex-wrap gap-2 pt-1 min-h-[38px] items-center">
              {ingredients.length === 0 ? (
                <p className="text-xs text-stone-400 italic">
                  {language === "zh-HK"
                    ? "未選擇食材。請在上方搜尋或點選下方熱門食材。"
                    : "No ingredients selected yet. Search above or tap popular ingredients below."}
                </p>
              ) : (
                ingredients.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-800 border border-brand-200 text-xs sm:text-sm font-bold shadow-sm"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(item)}
                      className="hover:text-red-600 rounded-full p-0.5"
                      title="Remove item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Tap Suggestions */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-stone-600 font-semibold flex items-center gap-1">
                  <span>{isEuropean ? "🇪🇺" : "💡"}</span>
                  <span>
                    {isEuropean
                      ? language === "zh-HK"
                        ? `歐洲常用食材（${cuisineDisplayName}）：`
                        : `Top European distinctive ingredients (${cuisineDisplayName}):`
                      : language === "zh-HK"
                        ? `常用食材（${cuisineDisplayName}）：`
                        : `Quick tap (${cuisineDisplayName}):`}
                  </span>
                </span>
              </div>

              {/* Main Quick Tap Chips */}
              <div className="flex flex-wrap gap-1.5">
                {popularChips.map((chip) => {
                  const label = language === "zh-HK" ? chip.zh : chip.en;
                  const isSelected = ingredients.includes(label) || ingredients.includes(chip.en);
                  if (isSelected) return null;
                  return (
                    <button
                      key={chip.en}
                      type="button"
                      onClick={() => handleAddIngredient(language === "zh-HK" ? chip.zh : chip.en)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-2xs ${
                        isEuropean
                          ? "bg-amber-50/90 hover:bg-amber-100 text-amber-900 border border-amber-200/80"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                      }`}
                    >
                      <span className={isEuropean ? "text-amber-600 font-bold" : "text-stone-400"}>+</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Photo Upload for Fridge / Ingredients (Requirement 4.1 & Stage 9) */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-brand-600" />
                {t("photoUploadTitle")}
              </span>
              <label className="cursor-pointer px-3 py-1 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5 text-brand-500" />
                <span>{language === "zh-HK" ? "上載相片" : "Choose Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {isAnalyzingPhoto && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                <span>{t("analyzingPhoto")}</span>
              </div>
            )}

            {photoError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {photoError}
              </p>
            )}

            {detectedItems.length > 0 && (
              <div className="p-3 bg-white rounded-lg border border-emerald-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    {t("photoDetectedTitle")} ({detectedItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmAllDetected}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    {language === "zh-HK" ? "全部確認加入 +" : "Add All +"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detectedItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleConfirmDetected(item)}
                      className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold hover:bg-emerald-200 transition"
                      title="Tap to confirm and add"
                    >
                      ✓ {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Time limit, Skill Level & Kitchen Equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                {t("cookingTimeLabel")}
              </label>
              <select
                value={cookingTimeLimit}
                onChange={(e) => setCookingTimeLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white"
              >
                <option value="any">{t("anyTime")}</option>
                <option value="30 mins">{t("quickUnder30")}</option>
                <option value="45 mins">{t("quickUnder45")}</option>
                <option value="60 mins">{t("quickUnder60")}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                {t("skillLevelLabel")}
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white"
              >
                {APP_CONFIG.skillLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {language === "zh-HK" ? lvl.labelZh : lvl.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                {t("equipmentLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {APP_CONFIG.equipmentList.map((eq) => {
                  const isChecked = equipment.includes(eq.id);
                  return (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => handleToggleEquipment(eq.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${isChecked
                          ? "bg-stone-900 text-white font-bold"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                    >
                      {language === "zh-HK" ? eq.labelZh : eq.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || ingredients.length === 0}
              className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-sm sm:text-base shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {isLoading ? t("aiThinking") : t("generateRecipesBtn")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
