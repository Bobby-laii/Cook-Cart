"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { rememberPhoto } from "@/lib/motion/photoFlip";
import { useRouter } from "next/navigation";
import { MENU_CUISINES, cuisineLabel } from "@/lib/recipes/cuisines";
import { CUISINE_GUIDE } from "@/lib/recipes/cuisineGuide";
import type { MenuDish } from "@/lib/recipes/mealdb";
import { Search, X } from "lucide-react";
import { TonightPicks } from "@/components/home/TonightPicks";
import { DishShelf } from "@/components/home/DishShelf";
import { CravingQuizModal } from "@/components/home/CravingQuizModal";
import {
  buildHomeShelves,
  localDayKey,
  pickTonight,
  scoreDishForQuiz,
  shuffleDishes,
  type CravingQuizAnswers,
} from "@/components/home/picks";
import { button, chip, errorText, field } from "@/components/ui/styles";

const PAGE_SIZE = 24;
const NO_OVEN_KEY = "bontaste_no_oven";
const QUIZ_POPUP_THRESHOLD = 3;

/**
 * Home: prominent Search bar at the top, "Tonight" (three calm picks for this evening),
 * and the full menu below it. When typing in the search bar, matching dishes appear
 * immediately below the search bar.
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
  // Tonight's picks are seeded by the local date + a random visit seed on mount, so
  // every visit shows a fresh variety of dishes while keeping server render hydrated cleanly.
  const [day, setDay] = useState<string | null>(null);
  const [visitSeed, setVisitSeed] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [quiz, setQuiz] = useState<CravingQuizAnswers | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizPrompted, setQuizPrompted] = useState(false);

  useEffect(() => {
    try {
      setNoOven(localStorage.getItem(NO_OVEN_KEY) === "1");
    } catch {
      // Storage unavailable: start with every dish shown.
    }
    const randomSeed = String(Math.floor(Math.random() * 1_000_000));
    setVisitSeed(randomSeed);
    setDay(`${localDayKey()}-${randomSeed}`);
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

  const handleShuffle = () => {
    setRound((r) => r + 1);
    const nextShuffles = shuffleCount + 1;
    setShuffleCount(nextShuffles);
    if (nextShuffles >= QUIZ_POPUP_THRESHOLD && !quiz && !quizPrompted) {
      setQuizPrompted(true);
      setQuizOpen(true);
    }
  };

  const handleQuizComplete = (answers: CravingQuizAnswers) => {
    setQuiz(answers);
    setRound(0);
    setQuizOpen(false);
  };

  const handleClearQuiz = () => {
    setQuiz(null);
    setRound((r) => r + 1);
  };

  const picks = useMemo(
    () => (day === null ? null : pickTonight(dishes, { day, round, noOven, quiz })),
    [dishes, day, round, noOven, quiz]
  );

  // Swipeable shelves below Tonight: different cuisines and card shapes on every visit,
  // never repeating a dish already shown in Tonight.
  const shelves = useMemo(
    () =>
      visitSeed === null
        ? []
        : buildHomeShelves(dishes, {
            seed: visitSeed,
            noOven,
            exclude: (picks ?? []).map((d) => d.id),
          }),
    // Shelves stay put while "Show me others" reshuffles Tonight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dishes, visitSeed, noOven]
  );

  // Randomize the menu dish order on each visit, and rank by quiz score if quiz is active.
  const orderedDishes = useMemo(() => {
    const base = visitSeed ? shuffleDishes(dishes, visitSeed) : dishes;
    if (!quiz) return base;
    return base
      .map((d, idx) => ({ dish: d, score: scoreDishForQuiz(d, quiz), idx }))
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.idx - b.idx))
      .map((item) => item.dish);
  }, [dishes, visitSeed, quiz]);

  // Only offer chips for cuisines that actually came back with dishes.
  const cuisines = useMemo(
    () => MENU_CUISINES.filter((c) => dishes.some((d) => d.cuisine === c.area)),
    [dishes]
  );

  const isSearching = query.trim().length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orderedDishes.filter((d) => {
      if (cuisine !== "all" && d.cuisine !== cuisine) return false;
      if (noOven && d.needsOven) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        cuisineLabel(d.cuisine).toLowerCase().includes(q)
      );
    });
  }, [orderedDishes, cuisine, query, noOven]);

  // The selected cuisine's intro and first dishes (picks that fit a no-oven kitchen).
  const guide = cuisine !== "all" ? CUISINE_GUIDE[cuisine] : undefined;
  const guidePicks = useMemo(() => {
    if (!guide) return [];
    return guide.picks
      .map((id) => dishes.find((d) => d.id === `mealdb-${id}`))
      .filter((d): d is MenuDish => Boolean(d) && (!noOven || !d!.needsOven));
  }, [guide, dishes, noOven]);

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
    ...cuisines.map((c) => ({ area: c.area, label: cuisineLabel(c.area) })),
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
          className={button("primary", "md", "mt-5")}
        >
          Start with your ingredients
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 pt-2 md:pt-6">
      {/* Top search bar right under the header so users can search immediately */}
      <div className="mb-7 md:mb-9">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="relative block flex-1 max-w-xl">
            <span className="sr-only">Search dishes</span>
            <Search
              className="w-5 h-5 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShown(PAGE_SIZE);
              }}
              placeholder="Search dishes, ingredients, or cuisines..."
              className={field("pl-11 pr-10")}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setShown(PAGE_SIZE);
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-stone-500 hover:text-stone-900 rounded-md"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </label>

          <p className="text-small text-stone-500 shrink-0">
            Have ingredients?{" "}
            <Link
              href="/chat"
              className="text-stone-900 font-medium underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
            >
              Ask the chef
            </Link>
          </p>
        </div>
      </div>

      {!isSearching && (
        <TonightPicks
          picks={picks}
          onOpen={openDish}
          opening={opening}
          onShuffle={handleShuffle}
          quiz={quiz}
          onOpenQuiz={() => setQuizOpen(true)}
          onClearQuiz={handleClearQuiz}
        />
      )}

      <CravingQuizModal
        open={quizOpen}
        initialAnswers={quiz}
        onClose={() => setQuizOpen(false)}
        onComplete={handleQuizComplete}
      />

      {openError && (
        <p className={`mt-5 ${errorText}`} role="alert">
          {"Couldn't open that dish just now. Please try again."}
        </p>
      )}

      {!isSearching &&
        shelves.map((shelf) => (
          <DishShelf
            key={shelf.id}
            id={shelf.id}
            title={shelf.title}
            subtitle={shelf.subtitle}
            variant={shelf.variant}
            dishes={shelf.dishes}
            onOpen={openDish}
            opening={opening}
          />
        ))}

      <section
        aria-labelledby="menu-title"
        className={isSearching ? "pt-2" : "mt-14 md:mt-20 pt-8 md:pt-10 border-t border-stone-200"}
      >
        <div className="flex items-end justify-between gap-4">
          <h2 id="menu-title" className="font-display font-medium text-[28px] md:text-[32px] leading-[1.15] text-stone-900">
            {isSearching ? `Results for "${query.trim()}"` : "Everything on the menu"}
          </h2>
          {isSearching && (
            <span className="text-small text-stone-500">
              {filtered.length} {filtered.length === 1 ? "dish" : "dishes"}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {/* 37 cuisines: one scrolling row at every width, not four wrapped rows. */}
          <div
            role="group"
            aria-label="Cuisines"
            className="flex flex-nowrap gap-2 overflow-x-auto -mx-5 px-5 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {chips.map(({ area, label }) => (
              <button
                key={area}
                type="button"
                onClick={() => pickCuisine(area)}
                aria-pressed={cuisine === area}
                className={chip(cuisine === area, "shrink-0")}
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

        {guide && !isSearching && (
          <section aria-labelledby="cuisine-guide" className="mt-6 border-b border-stone-200 pb-8 cc-fade-in" key={cuisine}>
            <h3 id="cuisine-guide" className="font-display font-medium text-[26px] leading-tight text-stone-900">
              {cuisineLabel(cuisine)} cooking
            </h3>
            <p className="mt-2 max-w-2xl text-stone-700">{guide.intro}</p>
            {guidePicks.length > 0 && (
              <>
                <h4 className="mt-5 text-small font-bold text-stone-900">Good first dishes</h4>
                <ul className="mt-3 grid grid-cols-3 gap-3 md:gap-6 max-w-3xl">
                  {guidePicks.map((dish) => (
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
                            width={350}
                            height={262}
                            className={`aspect-[4/3] w-full object-cover transition-opacity ${opening === dish.id ? "opacity-60" : ""}`}
                          />
                        </div>
                        <span className="mt-2 block font-display font-medium text-[16px] md:text-[18px] leading-snug text-stone-900 group-hover:underline underline-offset-4 decoration-stone-300">
                          {dish.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        {filtered.length === 0 ? (
          <p className="mt-10 text-stone-500">
            {query.trim() ? `Nothing matches "${query.trim()}". Try another word.` : "No dishes here yet."}
          </p>
        ) : (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
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
                        className={`aspect-square w-full object-cover transition-opacity ${
                          opening === dish.id ? "opacity-60" : ""
                        }`}
                      />
                    </div>
                    <span className="mt-2.5 block font-display font-medium text-[18px] leading-[1.25] text-stone-900 group-hover:underline underline-offset-4 decoration-stone-300">
                      {dish.title}
                    </span>
                    {dish.description && (
                      <span className="mt-1 text-small leading-snug text-stone-600 line-clamp-2">
                        {dish.description}
                      </span>
                    )}
                    <span className="mt-1 block text-sm text-stone-500">
                      {opening === dish.id ? "Opening the recipe" : cuisineLabel(dish.cuisine)}
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
                  className={button("secondary", "sm", "px-6")}
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
