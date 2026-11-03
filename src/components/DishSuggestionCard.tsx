"use client";

import React, { useState } from "react";
import { DishSuggestion } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  ArrowRight,
  ShoppingBag,
  Flame,
  Utensils,
} from "lucide-react";

interface DishSuggestionCardProps {
  suggestion: DishSuggestion;
  onSelectDish?: (dish: DishSuggestion) => void;
  onStartCooking?: (dish: DishSuggestion) => void;
}

export function DishSuggestionCard({
  suggestion,
  onSelectDish,
  onStartCooking,
}: DishSuggestionCardProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const displayTitle =
    language === "zh-HK" ? suggestion.titleZh || suggestion.title : suggestion.title;
  const displayDesc =
    language === "zh-HK" ? suggestion.descriptionZh || suggestion.description : suggestion.description;

  const handleSaveRecipe = async () => {
    if (!user) {
      alert("Please sign in or use the demo role switcher to save recipes.");
      return;
    }

    const hasRealSteps = Boolean(suggestion.steps && suggestion.steps.length > 0);
    const instructions =
      hasRealSteps && suggestion.steps
        ? suggestion.steps.map((st, idx) => ({
            step: st.step || idx + 1,
            title: st.title || `Step ${idx + 1}`,
            text: st.text,
            ...(st.timerSeconds ? { timerSeconds: st.timerSeconds } : {}),
          }))
        : [
            {
              step: 1,
              title: "Prepare Ingredients",
              text: `Wash and slice all ingredients (${suggestion.usedUserIngredients.join(", ")}).`,
            },
            {
              step: 2,
              title: "Cook & Season",
              text: "Sear over high heat with garlic, add seasonings and simmer.",
              timerSeconds: 600,
            },
            {
              step: 3,
              title: "Plate & Serve",
              text: "Plate hot with steamed rice and enjoy.",
            },
          ];

    const attribution =
      hasRealSteps && suggestion.sourceUrl
        ? `Recipe source: ${suggestion.sourceName || suggestion.sourceUrl} — ${suggestion.sourceUrl}`
        : undefined;

    setSaving(true);
    try {
      const res = await fetch("/api/recipes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: suggestion.title,
          titleZh: suggestion.titleZh,
          cuisine: suggestion.cuisine,
          cookTimeMinutes: suggestion.cookTimeMinutes,
          difficulty: suggestion.difficulty,
          servings: suggestion.servings,
          description: suggestion.description,
          descriptionZh: suggestion.descriptionZh,
          ingredients: suggestion.usedUserIngredients.map((u) => ({
            name: u,
            nameZh: u,
            amount: 1,
            unit: "portion",
          })),
          extraIngredients: suggestion.extraIngredientsNeeded,
          imageUrl: suggestion.imageUrl,
          instructions,
          tips: attribution,
        }),
      });

      if (res.ok) {
        setSaved(true);
      }
    } catch (e) {
      console.error("Save error", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 space-y-4">
      {/* Main Horizontal Split: Left (Title + Details + Ingredients) | Right (Framed Dish Picture) */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch justify-between gap-4 sm:gap-5">
        {/* LEFT SIDE: Title at top, details & ingredients stacked neatly */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
          {/* Line 1: Dish Title + Meta Badges */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-700 text-[11px] font-bold uppercase tracking-wider">
                {suggestion.cuisine}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-stone-500">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {suggestion.cookTimeMinutes} {t("mins")}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-stone-500">
                <ChefHat className="w-3.5 h-3.5 text-stone-400" />
                {suggestion.difficulty}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
              {displayTitle}
            </h3>
          </div>

          {/* Line 2: Dish Description */}
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-2">
            {displayDesc}
          </p>

          {/* Line 3: Compact Ingredients & Extra Needed Pills */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                {t("usedIngredients")}:
              </span>
              {suggestion.usedUserIngredients.map((ing) => (
                <span
                  key={ing}
                  className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 font-semibold text-emerald-900"
                >
                  {ing}
                </span>
              ))}
            </div>

            {suggestion.extraIngredientsNeeded.length > 0 && (
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 font-bold text-amber-800">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  {t("extraNeeded")}:
                </span>
                {suggestion.extraIngredientsNeeded.map((extra) => (
                  <span
                    key={extra.name}
                    className="px-2 py-0.5 rounded-md bg-amber-50/90 border border-amber-200/70 text-stone-700 font-medium"
                  >
                    {language === "zh-HK" ? extra.nameZh || extra.name : extra.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Framed Dish Picture Box */}
        <div className="w-full sm:w-36 md:w-44 h-40 sm:h-auto sm:min-h-[148px] flex-shrink-0 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative shadow-xs">
          {suggestion.imageUrl && !imgFailed ? (
            <img
              src={suggestion.imageUrl}
              alt={displayTitle}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-1 p-3 text-center">
              <Utensils className="w-7 h-7 text-amber-500/70" />
              <span className="text-[11px] font-semibold text-stone-500 line-clamp-2">
                {displayTitle}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
        {/* Rating & Bookmark buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRating(rating === "up" ? null : "up")}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
              rating === "up"
                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                : "border-stone-200 text-stone-500 hover:bg-stone-50"
            }`}
            title={t("thumbsUp")}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setRating(rating === "down" ? null : "down")}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
              rating === "down"
                ? "bg-red-100 border-red-300 text-red-800"
                : "border-stone-200 text-stone-500 hover:bg-stone-50"
            }`}
            title={t("thumbsDown")}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSaveRecipe}
            disabled={saving || saved}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
              saved
                ? "bg-amber-100 border-amber-300 text-amber-800"
                : "border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
            title={t("saveToMyRecipes")}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-amber-600 text-amber-600" : ""}`} />
            <span className="hidden sm:inline">
              {saved ? t("savedSuccess") : t("saveToMyRecipes")}
            </span>
          </button>
        </div>

        {/* Step-by-Step Cooking CTA & full recipe CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectDish && onSelectDish(suggestion)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs transition"
          >
            <span>{language === "zh-HK" ? "睇完整食譜" : "See full recipe"}</span>
          </button>

          <button
            onClick={() =>
              onStartCooking
                ? onStartCooking(suggestion)
                : onSelectDish && onSelectDish(suggestion)
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md transition group"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>
              {language === "zh-HK"
                ? `開始逐步教學 (${suggestion.steps?.length || 4} 步)`
                : `Start Step-by-Step Cooking (${suggestion.steps?.length || 4} Steps)`}
            </span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
