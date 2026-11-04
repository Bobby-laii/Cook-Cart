"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MENU_CUISINES, type MenuDish } from "@/lib/recipes/mealdb";
import { Search } from "lucide-react";

const PAGE_SIZE = 24;
const NO_OVEN_KEY = "bontaste_no_oven";

export function MenuBrowser({ dishes }: { dishes: MenuDish[] }) {
  const router = useRouter();
  const { language } = useLanguage();
  const zh = language === "zh-HK";

  const [cuisine, setCuisine] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState(false);
  // "My kitchen has no oven": hides baked and roasted dishes. Remembered in this
  // browser; storage can be blocked, so every access is guarded.
  const [noOven, setNoOven] = useState(false);

  useEffect(() => {
    try {
      setNoOven(localStorage.getItem(NO_OVEN_KEY) === "1");
    } catch {
      // Storage unavailable: start with every dish shown.
    }
  }, []);

  const toggleNoOven = () => {
    const next = !noOven;
    setNoOven(next);
    setShown(PAGE_SIZE);
    try {
      localStorage.setItem(NO_OVEN_KEY, next ? "1" : "0");
    } catch {
      // Not remembered this time; the filter still applies now.
    }
  };

  // Only offer chips for cuisines that actually came back with dishes.
  const cuisines = useMemo(
    () => MENU_CUISINES.filter((c) => dishes.some((d) => d.cuisine === c.area)),
    [dishes]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter(
      (d) =>
        (cuisine === "all" || d.cuisine === cuisine) &&
        (!noOven || !d.needsOven) &&
        (!q || d.title.toLowerCase().includes(q) || d.titleZh.includes(query.trim()))
    );
  }, [dishes, cuisine, query, noOven]);

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

  const chips = [
    { area: "all", label: zh ? "全部" : "All" },
    ...cuisines.map((c) => ({ area: c.area, label: cuisineLabel(c.area) })),
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 pt-6 md:pt-10 pb-tabbar">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <div>
          <h1 className="text-[32px] md:text-[40px] leading-[1.1] font-bold text-stone-900">
            {zh ? "今晚想食乜？" : "What do you feel like eating?"}
          </h1>
          <p className="mt-2 text-stone-500 max-w-xl">
            {zh
              ? "揀一道菜，大廚會一步步陪你煮。"
              : "Pick a dish, and your chef will walk you through it step by step."}
          </p>
        </div>
        <Link
          href="/chat"
          className="text-sm text-stone-500 underline underline-offset-4 decoration-stone-300 hover:text-brand-600 shrink-0 self-start md:self-auto py-2"
        >
          {zh ? "已經有食材？用食材搵食譜" : "Already have ingredients? Search by ingredients"}
        </Link>
      </header>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <nav
          className="flex gap-2 overflow-x-auto -mx-5 px-5 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 lg:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={zh ? "菜系" : "Cuisines"}
        >
          {chips.map(({ area, label }) => (
            <button
              key={area}
              onClick={() => pickCuisine(area)}
              aria-pressed={cuisine === area}
              className={`shrink-0 h-11 px-4 rounded-full border text-[15px] transition-colors ${
                cuisine === area
                  ? "bg-brand-500 border-brand-500 text-white font-bold"
                  : "bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <label className="relative block lg:w-72 shrink-0">
          <span className="sr-only">{zh ? "搜尋菜式" : "Search dishes"}</span>
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE_SIZE);
            }}
            placeholder={zh ? "搜尋菜式" : "Search dishes"}
            className="w-full h-12 pl-11 pr-4 rounded-md border border-stone-200 bg-stone-50 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-brand-500"
          />
        </label>
      </div>

      <label className="mt-4 inline-flex items-center gap-3 min-h-12 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={noOven}
          onChange={toggleNoOven}
          className="w-5 h-5 rounded accent-brand-500"
        />
        <span className="text-stone-700">
          {zh ? "我嘅廚房冇焗爐" : "My kitchen has no oven"}
        </span>
      </label>

      {openError && (
        <p className="mt-5 text-sm text-danger" role="alert">
          {zh ? "暫時打唔開呢道菜，請再試一次。" : "Couldn't open that dish just now. Please try again."}
        </p>
      )}

      {dishes.length === 0 ? (
        <div className="mt-12 max-w-md">
          <p className="text-[22px] leading-tight font-bold text-stone-900">
            {zh ? "餐牌暫時載入唔到。" : "The menu couldn't load right now."}
          </p>
          <p className="mt-2 text-stone-500">
            {zh ? "你仍然可以由雪櫃現有食材開始。" : "You can still start from what's in your fridge."}
          </p>
          <Link
            href="/chat"
            className="mt-5 inline-flex items-center justify-center h-[52px] px-6 rounded-md bg-brand-500 hover:bg-brand-600 text-white font-bold"
          >
            {zh ? "由食材開始" : "Start with your ingredients"}
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-12 text-stone-500">
          {zh ? `搵唔到「${query}」。試下其他字眼。` : `Nothing matches "${query}". Try another word.`}
        </p>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-8 lg:grid-cols-4">
            {filtered.slice(0, shown).map((dish) => (
              <li key={dish.id}>
                <button
                  onClick={() => openDish(dish)}
                  disabled={opening !== null}
                  className="group block w-full text-left rounded-lg disabled:cursor-wait"
                >
                  <div className="overflow-hidden rounded-lg bg-stone-200">
                    <img
                      src={`${dish.imageUrl}/medium`}
                      alt=""
                      loading="lazy"
                      width={350}
                      height={350}
                      className={`aspect-square w-full object-cover transition-opacity ${
                        opening === dish.id ? "opacity-60" : ""
                      }`}
                    />
                  </div>
                  <p className="mt-2.5 text-[17px] leading-snug font-bold text-stone-900 group-hover:text-brand-600">
                    {zh ? dish.titleZh : dish.title}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {opening === dish.id ? (zh ? "打開緊…" : "Opening…") : cuisineLabel(dish.cuisine)}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {filtered.length > shown && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setShown(shown + PAGE_SIZE)}
                className="h-12 px-6 rounded-md border border-stone-200 bg-stone-50 text-stone-900 font-bold hover:border-stone-400"
              >
                {zh ? `顯示更多（尚有 ${filtered.length - shown} 道）` : `Show more (${filtered.length - shown} left)`}
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-12 pb-8 text-sm text-stone-500">
        {zh ? "菜式及相片來自 TheMealDB。" : "Dishes and photos from TheMealDB."}
      </p>
    </div>
  );
}
