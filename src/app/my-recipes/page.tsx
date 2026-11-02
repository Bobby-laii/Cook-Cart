"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Bookmark,
  Clock,
  ChefHat,
  ArrowRight,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

interface SavedRecipeItem {
  id: string;
  rating: string;
  recipe: {
    id: string;
    title: string;
    titleZh: string;
    cuisine: string;
    cookTimeMinutes: number;
    difficulty: string;
    servings: number;
    description: string;
    descriptionZh: string;
    // Nullable: recipes saved before photos existed have no stored image.
    imageUrl?: string | null;
  };
}

export default function MyRecipesPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<SavedRecipeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedRecipes();
  }, [user]);

  const fetchSavedRecipes = async () => {
    try {
      const res = await fetch("/api/recipes/saved");
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.recipes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (savedRecipeId: string) => {
    try {
      await fetch(`/api/recipes/saved?id=${savedRecipeId}`, { method: "DELETE" });
      setRecipes(recipes.filter((r) => r.id !== savedRecipeId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            {t("navMyRecipes")}
          </h1>
        </div>
        <p className="text-sm text-stone-500">
          {language === "zh-HK"
            ? "您所收藏的 AI 美食食譜與家常料理"
            : "Your personal library of bookmarked AI recipes"}
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-stone-500">{t("loading")}</div>
      ) : recipes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            {language === "zh-HK" ? "暫無收藏食譜" : "No saved recipes yet"}
          </h3>
          <p className="text-xs text-stone-500">
            {language === "zh-HK"
              ? "前往 AI 煮食對話，將喜愛的菜式點選「收藏到我的食譜」即可在此查看！"
              : "Chat with Chef Cart and tap bookmark on any dish suggestion to save it here!"}
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === "zh-HK" ? "開始對話選菜" : "Discover Recipes"}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((item) => {
            const r = item.recipe;
            const displayTitle = language === "zh-HK" ? r.titleZh || r.title : r.title;
            const displayDesc = language === "zh-HK" ? r.descriptionZh || r.description : r.description;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                {r.imageUrl && (
                  <div className="aspect-[4/3] bg-stone-100">
                    <img
                      src={r.imageUrl}
                      alt={displayTitle}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2 p-5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold uppercase">
                      {r.cuisine}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.cookTimeMinutes}m
                      </span>
                      <span>•</span>
                      <span>{r.difficulty}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 leading-snug">
                    {displayTitle}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2">
                    {displayDesc}
                  </p>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition"
                    title={t("delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/recipe/${r.id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition"
                  >
                    <span>{language === "zh-HK" ? "煮食及買餸" : "Cook & Shop"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
