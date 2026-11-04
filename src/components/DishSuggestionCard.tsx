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
  const { t } = useLanguage();
  const { user } = useAuth();

  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [saveNote, setSaveNote] = useState("");

  const displayTitle = suggestion.title;
  const displayDesc = suggestion.description;

  const handleSaveRecipe = async () => {
    if (!user) {
      setSaveNote("Sign in to save recipes.");
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
              title: "Prepare the ingredients",
              text: `Wash and slice all ingredients (${suggestion.usedUserIngredients.join(", ")}).`,
            },
            {
              step: 2,
              title: "Cook and season",
              text: "Sear over high heat with garlic, add seasonings and simmer.",
              timerSeconds: 600,
            },
            {
              step: 3,
              title: "Plate and serve",
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
          cuisine: suggestion.cuisine,
          cookTimeMinutes: suggestion.cookTimeMinutes,
          difficulty: suggestion.difficulty,
          servings: suggestion.servings,
          description: suggestion.description,
          ingredients: suggestion.usedUserIngredients.map((u) => ({
            name: u,
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
        setSaveNote("");
      } else {
        setSaveNote("Couldn't save it just now.");
      }
    } catch (e) {
      console.error("Save error", e);
      setSaveNote("Couldn't save it just now.");
    } finally {
      setSaving(false);
    }
  };

  const stepCount = suggestion.steps?.length ?? 0;
  // One short phrase instead of a "Thai · 25 min · Easy" string.
  const metaLine = [
    /^any( style)?$/i.test(suggestion.cuisine?.trim() ?? "") ? "" : suggestion.cuisine,
    suggestion.cookTimeMinutes ? `about ${suggestion.cookTimeMinutes} minutes` : "",
    suggestion.difficulty ? suggestion.difficulty.toLowerCase() : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="py-5 first:pt-0 border-b border-stone-200 last:border-b-0">
      <div className="overflow-hidden rounded-lg bg-stone-100 aspect-[16/10]">
        {suggestion.imageUrl && !imgFailed ? (
          <img
            src={suggestion.imageUrl}
            alt=""
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

      <h3 className="mt-4 font-display font-medium text-[24px] leading-[1.2] text-stone-900">{displayTitle}</h3>
      {metaLine && (
        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-stone-500">
          <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
          {metaLine}
        </p>
      )}

      {displayDesc && <p className="mt-2 text-stone-700 line-clamp-3">{displayDesc}</p>}

      <div className="mt-3 space-y-1.5 text-[15px]">
        {suggestion.usedUserIngredients.length > 0 && (
          <p className="text-stone-700">
            <span className="inline-flex items-center gap-1 font-bold text-fresh-700 mr-1.5">
              <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
              You have
            </span>
            {suggestion.usedUserIngredients.join(", ")}
          </p>
        )}
        {suggestion.extraIngredientsNeeded.length > 0 && (
          <p className="text-stone-700">
            <span className="font-bold text-stone-900 mr-1.5">{"You'll also need"}</span>
            {suggestion.extraIngredientsNeeded.map((extra) => extra.name).join(", ")}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onSelectDish && onSelectDish(suggestion)}
          className="h-[52px] px-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 font-bold transition-colors"
        >
          See the recipe
        </button>
        {onStartCooking && (
          <button
            type="button"
            onClick={() => onStartCooking(suggestion)}
            className="h-[52px] px-5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold transition-colors"
          >
            {stepCount > 0 ? `Start cooking, ${stepCount} steps` : "Start cooking"}
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1 -ml-2">
        <button
          type="button"
          onClick={() => setRating(rating === "up" ? null : "up")}
          aria-pressed={rating === "up"}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
            rating === "up" ? "text-fresh-700" : "text-stone-500 hover:text-stone-900"
          }`}
          title={t("thumbsUp")}
          aria-label={t("thumbsUp")}
        >
          <ThumbsUp className={`w-5 h-5 ${rating === "up" ? "fill-fresh-100" : ""}`} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setRating(rating === "down" ? null : "down")}
          aria-pressed={rating === "down"}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
            rating === "down" ? "text-stone-900" : "text-stone-500 hover:text-stone-900"
          }`}
          title={t("thumbsDown")}
          aria-label={t("thumbsDown")}
        >
          <ThumbsDown className={`w-5 h-5 ${rating === "down" ? "fill-stone-200" : ""}`} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleSaveRecipe}
          disabled={saving || saved}
          className={`h-12 px-3 rounded-lg flex items-center gap-1.5 text-[15px] font-bold transition-colors ${
            saved ? "text-stone-900" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <Bookmark className={`w-5 h-5 ${saved ? "fill-stone-900" : ""}`} aria-hidden="true" />
          {saved ? "Saved" : "Save"}
        </button>
        {saveNote && (
          <p className="ml-2 text-sm text-stone-500" role="status">
            {saveNote}
          </p>
        )}
      </div>
    </article>
  );
}
