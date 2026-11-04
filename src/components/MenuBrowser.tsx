"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { rememberPhoto } from "@/lib/motion/photoFlip";
import { useRouter } from "next/navigation";
import { MENU_CUISINES, type MenuDish } from "@/lib/recipes/mealdb";
import { Search } from "lucide-react";
import { TonightPicks } from "@/components/home/TonightPicks";
import { localDayKey, pickTonight } from "@/components/home/picks";

const PAGE_SIZE = 24;
const NO_OVEN_KEY = "bontaste_no_oven";

/**
 * Home: "Tonight" (three calm picks for this evening) and the full menu below it.
 */
export function MenuBrowser({ dishes }: { dishes: MenuDish[] }) {
  const router = useRouter();

  const [cuisine, setCuisine] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState(false);
  // "My kitchen has no oven": hides baked and roasted dishes. Remembered in this
  // browser; storage can be blocked, so every access is guarded.
  const [noOven, setNoOven] = useState(false);
  // Tonight's picks are seeded by the local date, which only the browser knows, so
  // they are worked out after mount (the server render shows placeholders).
  const [day, setDay] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    try {
      setNoOven(localStorage.getItem(NO_OVEN_KEY) === "1");
    } catch {
      // Storage unavailable: start with every dish shown.
    }
    setDay(localDayKey());
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

  const picks = useMemo(
    () => (day === null ? null : pickTonight(dishes, { day, round, noOven })),
    [dishes, day, round, noOven]
  );

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
        (!q || d.title.toLowerCase().includes(q))
    );
  }, [dishes, cuisine, query, noOven]);

  const pickCuisine = (area: string) => {
    setCuisine(area);
    setShown(PAGE_SIZE);
  };

  // Same hand-off the chat uses: the recipe and cook pages read the active dish
  // from sessionStorage, so a menu dish gets the full recipe and cook mode.
  const openDish = async (dish: MenuDish) => {
    setOpening(dish.id);
    setOpenError(false);
    try {
      const res = await fetch(`/api/menu/${dish.id}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      sessionStorage.setItem("cookcart_active_dish", JSON.stringify(data.dish));
      // Measured now, after the fetch, so a scroll while waiting doesn't throw it off.
      rememberPhoto(dish.id, document.querySelector(`[data-dish-photo="${dish.id}"]`));
      router.push(`/recipe/${dish.id}`);
    } catch {
      setOpening(null);
      setOpenError(true);
    }
  };

  const chips = [
    { area: "all", label: "All" },
    ...cuisines.map((c) => ({ area: c.area, label: c.area })),
  ];

  if (dishes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 pt-4 md:pt-10 pb-12">
        <h1 className="font-display font-medium text-[34px] md:text-[40px] leading-[1.1] text-stone-900">
          Tonight
        </h1>
        <p className="mt-4 text-[19px] text-stone-900">{"The menu couldn't load right now."}</p>
        <p className="mt-1 text-stone-500">{"You can still start from what's in your fridge."}</p>
        <Link
          href="/chat"
          className="mt-5 inline-flex items-center justify-center h-[52px] px-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 font-bold"
        >
          Start with your ingredients
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 pt-2 md:pt-10">
      <TonightPicks
        picks={picks}
        onOpen={openDish}
        opening={opening}
        onShuffle={() => setRound((r) => r + 1)}
      />

      {openError && (
        <p className="mt-5 text-sm text-danger" role="alert">
          {"Couldn't open that dish just now. Please try again."}
        </p>
      )}

      <section aria-labelledby="menu-title" className="mt-14 md:mt-20 pt-8 md:pt-10 border-t border-stone-200">
        <div className="md:flex md:items-end md:justify-between md:gap-8">
          <h2 id="menu-title" className="font-display font-medium text-[28px] md:text-[32px] leading-[1.15] text-stone-900">
            The menu
          </h2>
          <div className="mt-4 md:mt-0 md:w-96 shrink-0">
            <label className="relative block">
              <span className="sr-only">Search dishes</span>
              <Search
                className="w-5 h-5 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShown(PAGE_SIZE);
                }}
                placeholder="Search dishes"
                className="w-full h-12 pl-11 pr-4 rounded-lg border border-transparent bg-stone-100 text-base text-stone-900 focus:outline-none focus:bg-stone-50 focus:border-stone-900"
              />
            </label>
          </div>
        </div>

        <p className="mt-3 text-[15px] text-stone-500 md:text-right">
          Already have ingredients?{" "}
          <Link
            href="/chat"
            className="text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
          >
            Search by ingredients
          </Link>
        </p>

        <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div
            role="group"
            aria-label="Cuisines"
            className="flex flex-nowrap gap-2 overflow-x-auto -mx-5 px-5 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 lg:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {chips.map(({ area, label }) => (
              <button
                key={area}
                type="button"
                onClick={() => pickCuisine(area)}
                aria-pressed={cuisine === area}
                className={`shrink-0 h-11 px-4 rounded-full text-[15px] transition-colors ${
                  cuisine === area
                    ? "bg-stone-900 text-stone-50 font-bold"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-3 min-h-12 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={noOven}
              onChange={toggleNoOven}
              className="w-5 h-5 rounded accent-stone-900"
            />
            <span className="text-stone-900">My kitchen has no oven</span>
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-stone-500">
            {query.trim() ? `Nothing matches "${query.trim()}". Try another word.` : "No dishes here yet."}
          </p>
        ) : (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
              {filtered.slice(0, shown).map((dish) => (
                <li key={dish.id}>
                  <button
                    type="button"
                    onClick={() => openDish(dish)}
                    disabled={opening !== null}
                    aria-label={dish.title}
                    className="group block w-full text-left rounded-lg disabled:cursor-wait"
                  >
                    <div className="overflow-hidden rounded-lg bg-stone-100">
                      <img
                        data-dish-photo={dish.id}
                        src={`${dish.imageUrl}/medium`}
                        alt=""
                        loading="lazy"
                        width={350}
                        height={350}
                        className={`aspect-[4/3] w-full object-cover transition-opacity ${
                          opening === dish.id ? "opacity-60" : ""
                        }`}
                      />
                    </div>
                    <span className="mt-2.5 block font-display font-medium text-[18px] leading-[1.25] text-stone-900 group-hover:underline underline-offset-4 decoration-stone-300">
                      {dish.title}
                    </span>
                    {dish.description && (
                      <span className="mt-1 text-[15px] leading-snug text-stone-600 line-clamp-2">
                        {dish.description}
                      </span>
                    )}
                    <span className="mt-1 block text-sm text-stone-500">
                      {opening === dish.id ? "Opening the recipe" : dish.cuisine}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {filtered.length > shown && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShown(shown + PAGE_SIZE)}
                  className="h-12 px-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold"
                >
                  {`Show more (${filtered.length - shown} left)`}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <p className="mt-12 pb-8 text-sm text-stone-500">Dishes and photos from TheMealDB.</p>
    </div>
  );
}
