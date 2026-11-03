"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MENU_CUISINES, type MenuDish } from "@/lib/recipes/mealdb";
import { ArrowRight, Search } from "lucide-react";

const PAGE_SIZE = 24;

export function MenuBrowser({ dishes }: { dishes: MenuDish[] }) {
  const router = useRouter();
  const { language } = useLanguage();
  const zh = language === "zh-HK";

  const [cuisine, setCuisine] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState(false);

  // Only offer tabs for cuisines that actually came back with dishes.
  const cuisines = useMemo(
    () => MENU_CUISINES.filter((c) => dishes.some((d) => d.cuisine === c.area)),
    [dishes]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter(
      (d) => (cuisine === "all" || d.cuisine === cuisine) && (!q || d.title.toLowerCase().includes(q))
    );
  }, [dishes, cuisine, query]);

  const pickCuisine = (area: string) => {
    setCuisine(area);
    setShown(PAGE_SIZE);
  };

  // Same hand-off the chat uses: the recipe and cook pages read the active dish
  // from sessionStorage, so a menu dish gets the full recipe, cart and cook mode.
  const openDish = async (dish: MenuDish) => {
    setOpening(dish.id);
    setOpenError(false);
    try {
      const res = await fetch(`/api/menu/${dish.id}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      sessionStorage.setItem("cookcart_active_dish", JSON.stringify(data.dish));
      router.push(`/recipe/${dish.id}`);
    } catch {
      setOpening(null);
      setOpenError(true);
    }
  };

  const cuisineLabel = (area: string) =>
    zh ? MENU_CUISINES.find((c) => c.area === area)?.nameZh ?? area : area;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-24">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1
            className="font-serif text-4xl sm:text-5xl text-stone-900 tracking-tight"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
          >
            {zh ? "今晚想食乜？" : "What do you feel like eating?"}
          </h1>
          <p className="mt-3 text-stone-600 max-w-xl">
            {zh
              ? "揀一道菜，大廚會一步步陪你煮。"
              : "Pick a dish, and your chef will walk you through it step by step."}
          </p>
        </div>
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 text-stone-700 hover:text-brand-600 shrink-0"
        >
          {zh ? "已經有食材？用食材搵食譜" : "Already have ingredients? Search by ingredients"}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      <div className="mt-8 flex flex-col gap-4 border-y border-stone-300 py-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex gap-x-5 gap-y-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap" aria-label={zh ? "菜系" : "Cuisines"}>
          {[{ area: "all", label: zh ? "全部" : "All" }, ...cuisines.map((c) => ({ area: c.area, label: cuisineLabel(c.area) }))].map(
            ({ area, label }) => (
              <button
                key={area}
                onClick={() => pickCuisine(area)}
                aria-pressed={cuisine === area}
                className={`shrink-0 py-1 border-b-2 transition ${
                  cuisine === area
                    ? "border-brand-500 text-stone-900"
                    : "border-transparent text-stone-600 hover:text-stone-900"
                }`}
              >
                {label}
              </button>
            )
          )}
        </nav>
        <label className="relative block lg:w-64 shrink-0">
          <span className="sr-only">{zh ? "搜尋菜式" : "Search dishes"}</span>
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE_SIZE);
            }}
            placeholder={zh ? "搜尋菜式（英文）" : "Search dishes"}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-stone-300 bg-stone-50 text-sm placeholder:text-stone-400 focus:outline-none focus:border-stone-500"
          />
        </label>
      </div>

      {openError && (
        <p className="mt-6 text-sm text-brand-700" role="alert">
          {zh ? "暫時打唔開呢道菜，請再試一次。" : "Couldn't open that dish just now. Please try again."}
        </p>
      )}

      {dishes.length === 0 ? (
        <div className="mt-16 max-w-md">
          <p className="font-serif text-2xl text-stone-900">
            {zh ? "餐牌暫時載入唔到。" : "The menu couldn't load right now."}
          </p>
          <p className="mt-2 text-stone-600">
            {zh ? "你仍然可以由雪櫃現有食材開始。" : "You can still start from what's in your fridge."}
          </p>
          <Link href="/chat" className="mt-4 inline-flex items-center gap-1.5 text-brand-600 font-medium">
            {zh ? "由食材開始" : "Start with your ingredients"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-16 text-stone-600">
          {zh ? `搵唔到「${query}」。試下其他字眼。` : `Nothing matches "${query}". Try another word.`}
        </p>
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.slice(0, shown).map((dish) => (
              <li key={dish.id}>
                <button
                  onClick={() => openDish(dish)}
                  disabled={opening !== null}
                  className="group block w-full text-left disabled:cursor-wait"
                >
                  <div className="relative overflow-hidden rounded-md bg-stone-200">
                    <img
                      src={`${dish.imageUrl}/medium`}
                      alt=""
                      loading="lazy"
                      width={350}
                      height={350}
                      className={`aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03] ${
                        opening === dish.id ? "opacity-60" : ""
                      }`}
                    />
                  </div>
                  <p className="mt-3 font-serif text-lg leading-snug text-stone-900 group-hover:text-brand-600">
                    {dish.title}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {opening === dish.id ? (zh ? "打開緊…" : "Opening…") : cuisineLabel(dish.cuisine)}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {filtered.length > shown && (
            <div className="mt-12 text-center">
              <button
                onClick={() => setShown(shown + PAGE_SIZE)}
                className="px-5 py-2.5 rounded-md border border-stone-400 text-stone-800 hover:border-stone-900 hover:bg-stone-50"
              >
                {zh ? `顯示更多（尚有 ${filtered.length - shown} 道）` : `Show more (${filtered.length - shown} left)`}
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-16 text-xs text-stone-500">
        {zh ? "菜式及相片來自 TheMealDB。" : "Dishes and photos from TheMealDB."}
      </p>
    </div>
  );
}
