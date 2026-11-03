"use client";

import React, { useState } from "react";
import { DishSuggestion } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { Check, Clock, ThumbsUp, ThumbsDown, Bookmark, Utensils } from "lucide-react";

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
      alert(
        language === "zh-HK"
          ? "請先登入，或者用示範角色切換，先可以收藏食譜。"
          : "Please sign in or use the demo role switcher to save recipes."
      );
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

  const zh = language === "zh-HK";
  const stepCount = suggestion.steps?.length || 4;

  return (
    <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 sm:p-5">
      <div className="flex flex-col-reverse sm:flex-row items-stretch gap-4 sm:gap-5">
        <div className="flex-1 min-w-0">
          <h3 className="text-[19px] leading-snug font-bold text-stone-900">{displayTitle}</h3>

          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
            <span>{suggestion.cuisine}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {zh ? `${suggestion.cookTimeMinutes} 分鐘` : `${suggestion.cookTimeMinutes} min`}
            </span>
            <span>{suggestion.difficulty}</span>
          </p>

          {displayDesc && (
            <p className="mt-2 text-[15px] text-stone-600 line-clamp-2">{displayDesc}</p>
          )}

          <div className="mt-3 space-y-2 text-sm">
            <p className="text-stone-700">
              <span className="inline-flex items-center gap-1 font-bold text-fresh-700 mr-1.5">
                <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
                {zh ? "用到你有嘅：" : "Uses what you have:"}
              </span>
              {suggestion.usedUserIngredients.join(zh ? "、" : ", ")}
            </p>

            {suggestion.extraIngredientsNeeded.length > 0 && (
              <p className="text-stone-700">
                <span className="font-bold text-stone-900 mr-1.5">{zh ? "仲要買：" : "You'll also need:"}</span>
                {suggestion.extraIngredientsNeeded
                  .map((extra) => (zh ? extra.nameZh || extra.name : extra.name))
                  .join(zh ? "、" : ", ")}
              </p>
            )}
          </div>
        </div>

        <div className="w-full sm:w-36 md:w-44 h-44 sm:h-auto sm:min-h-[148px] shrink-0 rounded-lg overflow-hidden bg-stone-200">
          {suggestion.imageUrl && !imgFailed ? (
            <img
              src={suggestion.imageUrl}
              alt={displayTitle}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <Utensils className="w-8 h-8" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRating(rating === "up" ? null : "up")}
            aria-pressed={rating === "up"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              rating === "up" ? "bg-fresh-50 text-fresh-700" : "text-stone-500 hover:bg-stone-100"
            }`}
            title={t("thumbsUp")}
            aria-label={t("thumbsUp")}
          >
            <ThumbsUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setRating(rating === "down" ? null : "down")}
            aria-pressed={rating === "down"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              rating === "down" ? "bg-stone-200 text-stone-900" : "text-stone-500 hover:bg-stone-100"
            }`}
            title={t("thumbsDown")}
            aria-label={t("thumbsDown")}
          >
            <ThumbsDown className="w-5 h-5" />
          </button>
          <button
            onClick={handleSaveRecipe}
            disabled={saving || saved}
            className={`h-11 px-3 rounded-full flex items-center gap-1.5 text-sm font-bold transition-colors ${
              saved ? "text-brand-600" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Bookmark className={`w-5 h-5 ${saved ? "fill-brand-500 text-brand-500" : ""}`} aria-hidden="true" />
            {saved ? (zh ? "已收藏" : "Saved") : zh ? "收藏" : "Save"}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onSelectDish && onSelectDish(suggestion)}
            className="flex-1 sm:flex-none h-12 px-4 rounded-md border border-stone-300 bg-stone-50 hover:border-stone-500 text-stone-900 font-bold text-[15px] transition-colors"
          >
            {zh ? "睇食譜" : "See recipe"}
          </button>
          <button
            onClick={() =>
              onStartCooking ? onStartCooking(suggestion) : onSelectDish && onSelectDish(suggestion)
            }
            className="flex-1 sm:flex-none h-12 px-5 rounded-md bg-brand-500 hover:bg-brand-600 text-white font-bold text-[15px] transition-colors"
          >
            {zh ? `開始煮（${stepCount} 步）` : `Start cooking (${stepCount} steps)`}
          </button>
        </div>
      </div>
    </div>
  );
}
