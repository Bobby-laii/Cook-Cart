"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Check, Clock, ListChecks, Minus, Plus } from "lucide-react";
import type { DishSuggestion, RecipeIngredient } from "@/types";
import { loadDish } from "@/lib/recipes/loadDish";
import { safeHttpUrl } from "@/lib/recipes/mealdb";
import { convertAmount, convertTemperatures, formatQuantity, type UnitSystem } from "@/lib/units";
import { useUnitSystem } from "@/lib/useUnitSystem";
import { usePhotoArrival } from "@/lib/motion/photoFlip";

type LoadState = { status: "loading" } | { status: "missing" } | { status: "ready"; dish: DishSuggestion };

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;

export default function RecipeDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    loadDish(id).then((dish) => {
      if (!cancelled) setState(dish ? { status: "ready", dish } : { status: "missing" });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === "loading") return <RecipeSkeleton />;
  if (state.status === "missing") return <RecipeMissing />;
  return <Recipe dish={state.dish} />;
}

function Recipe({ dish }: { dish: DishSuggestion }) {
  const photoRef = useRef<HTMLImageElement>(null);
  usePhotoArrival(photoRef, dish.id);
  const router = useRouter();
  const baseServings = dish.servings > 0 ? dish.servings : 2;
  const [servings, setServings] = useState(baseServings);
  const [units, setUnits] = useUnitSystem();
  // Names of ingredients the cook already has; they stay off the shopping list.
  const [have, setHave] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [listState, setListState] = useState<"idle" | "copied" | "error">("idle");

  usePageTitle(`${dish.title} – Bon Taste`);

  const ingredients: RecipeIngredient[] = useMemo(
    () => [
      // Dishes from the chat list the cook's own ingredients by name only.
      ...dish.usedUserIngredients.map((name) => ({ name, amount: 0, unit: "" })),
      ...dish.extraIngredientsNeeded,
    ],
    [dish]
  );
  const steps = dish.steps ?? [];
  const scale = servings / baseServings;
  const toBuy = ingredients.filter((i) => !have.has(i.name));
  const sourceUrl = safeHttpUrl(dish.sourceUrl);
  const safety = safetyLine(ingredients);

  const toggleHave = (name: string) =>
    setHave((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const summary = [
    dish.cuisine,
    dish.cookTimeMinutes > 0 ? `${dish.cookTimeMinutes} min` : null,
    `${ingredients.length} ingredients`,
    steps.length > 0 ? `${steps.length} steps` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const save = async () => {
    if (saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/recipes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: dish.title,
          cuisine: dish.cuisine,
          cookTimeMinutes: dish.cookTimeMinutes,
          difficulty: dish.difficulty,
          servings: dish.servings,
          description: dish.description,
          ingredients,
          extraIngredients: dish.extraIngredientsNeeded,
          imageUrl: dish.imageUrl,
          instructions: steps,
          sourceUrl,
          sourceName: dish.sourceName,
        }),
      });
      if (res.status === 401) {
        // The login page sends the cook back here afterwards.
        router.push(`/login?callbackUrl=${encodeURIComponent(`/recipe/${dish.id}`)}`);
        setSaveState("idle");
        return;
      }
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  };

  // A plain list to take shopping. On phones the share sheet sends it to a chat or
  // notes app; elsewhere it is copied to the clipboard.
  const shareList = async () => {
    const lines = toBuy.map((i) => {
      const amount = amountText(i, scale, units);
      return amount ? `- ${i.name}, ${amount}` : `- ${i.name}`;
    });
    const text = `Shopping list for ${dish.title}\n${lines.join("\n")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Shopping list for ${dish.title}`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setListState("copied");
    } catch (err) {
      // Closing the share sheet is not an error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setListState("error");
    }
    setTimeout(() => setListState("idle"), 2500);
  };

  return (
    <article className="pb-[calc(var(--tabbar-space)+7rem)] md:pb-24">
      <header className="max-w-6xl mx-auto md:px-6 lg:px-8 md:pt-10 grid gap-6 md:gap-10 md:grid-cols-[1.1fr_1fr] lg:gap-14 md:items-center">
        {dish.imageUrl ? (
          <img
            ref={photoRef}
            src={dish.imageUrl}
            alt={dish.title}
            width={700}
            height={525}
            className="w-full aspect-[4/3] object-cover bg-stone-100 md:rounded-lg md:order-2"
          />
        ) : null}

        <div className={`px-5 md:px-0 ${dish.imageUrl ? "" : "pt-8 md:pt-0"}`}>
          <h1 className="font-display font-medium text-[32px] md:text-[40px] leading-[1.1] text-stone-900">
            {dish.title}
          </h1>
          <p className="mt-3 text-stone-500">{summary}</p>
          {dish.needsOven && <p className="mt-1 text-stone-900">Needs an oven</p>}
          {dish.description && dish.description !== dish.cuisine && (
            <p className="mt-4 text-stone-700 max-w-xl">{dish.description}</p>
          )}

          <div className="mt-6 flex gap-3">
            {/* On a phone the main action sits in a bar above the tab bar; from md up it is inline. */}
            <div className="fixed inset-x-0 above-tabbar z-30 bg-stone-50 border-t border-stone-200 px-5 py-3 md:static md:z-auto md:p-0 md:border-0 md:bg-transparent">
              <Link
                href={`/recipe/${encodeURIComponent(dish.id)}/cook?servings=${servings}`}
                className="flex w-full md:w-auto items-center justify-center h-[52px] px-6 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors"
              >
                Start cooking
              </Link>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saveState === "saving"}
              aria-live="polite"
              className="inline-flex items-center justify-center gap-2 h-12 md:h-[52px] px-4 rounded-lg border border-stone-200 text-stone-900 font-bold hover:border-stone-500 transition-colors disabled:opacity-60"
            >
              {saveState === "saved" ? (
                <BookmarkCheck className="w-5 h-5 text-fresh-500 cc-pop" aria-hidden="true" />
              ) : (
                <Bookmark className="w-5 h-5" aria-hidden="true" />
              )}
              {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving" : "Save"}
            </button>
          </div>
          {saveState === "error" && (
            <p className="mt-2 text-sm text-danger">That didn&apos;t save. Try again in a moment.</p>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 mt-10 md:mt-14 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <section aria-labelledby="ingredients-heading" className="lg:sticky lg:top-28 lg:self-start max-w-[40rem]">
          <h2 id="ingredients-heading" className="font-display font-medium text-[26px] leading-tight text-stone-900">
            Ingredients
          </h2>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1" role="group" aria-label="Servings">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(MIN_SERVINGS, s - 1))}
                disabled={servings <= MIN_SERVINGS}
                className="w-12 h-12 rounded-full bg-stone-100 text-stone-900 flex items-center justify-center hover:bg-stone-200 disabled:opacity-40"
                aria-label="Fewer servings"
              >
                <Minus className="w-5 h-5" aria-hidden="true" />
              </button>
              <span className="w-24 text-center text-stone-900" aria-live="polite">
                {`Serves ${servings}`}
              </span>
              <button
                type="button"
                onClick={() => setServings((s) => Math.min(MAX_SERVINGS, s + 1))}
                disabled={servings >= MAX_SERVINGS}
                className="w-12 h-12 rounded-full bg-stone-100 text-stone-900 flex items-center justify-center hover:bg-stone-200 disabled:opacity-40"
                aria-label="More servings"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="inline-flex p-1 rounded-full bg-stone-100" role="group" aria-label="Units">
              {(["metric", "us"] as const).map((system) => (
                <button
                  key={system}
                  type="button"
                  onClick={() => setUnits(system)}
                  aria-pressed={units === system}
                  className={`h-10 px-4 rounded-full text-[15px] transition-colors ${
                    units === system
                      ? "bg-stone-50 text-stone-900 font-bold border border-stone-200"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  {system === "metric" ? "Metric" : "US cups"}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-sm text-stone-500">Tick what you already have. The rest goes on your shopping list.</p>

          <ul className="mt-2 divide-y divide-stone-200 border-y border-stone-200">
            {ingredients.map((item) => {
              const ticked = have.has(item.name);
              const amount = amountText(item, scale, units);
              return (
                <li key={item.name}>
                  <label className="flex items-center gap-3 min-h-[56px] py-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ticked}
                      onChange={() => toggleHave(item.name)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 ${
                        ticked ? "bg-fresh-500 border-fresh-500 text-white" : "border-stone-300"
                      }`}
                    >
                      {ticked && <Check className="w-4 h-4 cc-tick" strokeWidth={3} aria-hidden />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={ticked ? "text-stone-500 line-through" : "text-stone-900"}>{item.name}</span>
                      {item.note && <span className="block text-sm text-stone-500">{item.note}</span>}
                    </span>
                    {amount && (
                      <span className={`text-right shrink-0 max-w-[45%] ${ticked ? "text-stone-500" : "text-stone-900"}`}>
                        {amount}
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-stone-500" aria-live="polite">
              {listState === "copied"
                ? "Copied"
                : listState === "error"
                  ? "Couldn't share the list"
                  : toBuy.length === 0
                    ? "You have everything"
                    : `${toBuy.length} of ${ingredients.length} to get`}
            </p>
            <button
              type="button"
              onClick={shareList}
              disabled={toBuy.length === 0}
              className="inline-flex items-center gap-2 h-12 px-4 rounded-lg border border-stone-200 text-stone-900 font-bold hover:border-stone-500 transition-colors disabled:opacity-40"
            >
              <ListChecks className="w-5 h-5" aria-hidden="true" />
              Shopping list
            </button>
          </div>
        </section>

        {steps.length > 0 && (
          <section aria-labelledby="method-heading" className="max-w-[40rem]">
            <h2 id="method-heading" className="font-display font-medium text-[26px] leading-tight text-stone-900">
              Method
            </h2>
            <ol className="mt-5 space-y-7">
              {steps.map((st, idx) => (
                <li key={`${idx}-${st.step}`} className="grid grid-cols-[2rem_1fr] gap-3">
                  <span className="text-[20px] leading-[1.3] font-bold text-stone-900" aria-hidden="true">
                    {idx + 1}
                  </span>
                  <div>
                    {/* Generic "Step n" titles add nothing next to the numeral; only real ones show. */}
                    {st.title && !/^step \d+$/i.test(st.title) && (
                      <h3 className="font-bold text-stone-900 mb-1">{st.title}</h3>
                    )}
                    <p className="text-stone-700">{convertTemperatures(st.text, units)}</p>
                    {st.timerSeconds ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-stone-500">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        {`Timer ${formatDuration(st.timerSeconds)}`}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
            {safety && <p className="mt-10 text-sm text-stone-500">{safety}</p>}
          </section>
        )}
      </div>

      {sourceUrl && (
        <p className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 mt-12 text-sm text-stone-500">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-stone-300 hover:text-stone-900"
          >
            {`Recipe from ${dish.sourceName || "the original site"}`}
          </a>
        </p>
      )}
    </article>
  );
}

/** "1⅓ tbsp", "2 cloves", "2 tbsp + 1 piece", scaled to servings and put in the cook's units. */
function amountText(item: RecipeIngredient, scale: number, units: UnitSystem): string {
  return [{ amount: item.amount, unit: item.unit }, ...(item.also ?? [])]
    .filter((a) => a.amount > 0 || a.unit)
    .map((a) => {
      if (!(a.amount > 0)) return a.unit;
      const shown = convertAmount(a.amount * scale, a.unit, units);
      return formatQuantity(shown.amount, shown.unit);
    })
    .join(" + ");
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** Only for dishes with poultry or pork, where undercooking is the real risk. Stock doesn't count. */
function safetyLine(ingredients: RecipeIngredient[]): string | null {
  const names = ingredients.map((i) => i.name.toLowerCase()).filter((n) => !/\b(stock|broth|bouillon|cube)\b/.test(n));
  const meats = [
    names.some((n) => /\b(chicken|turkey|duck)\b/.test(n)) ? "chicken" : null,
    names.some((n) => /\b(pork|bacon|sausages?|ham)\b/.test(n)) ? "pork" : null,
  ].filter(Boolean);
  if (meats.length === 0) return null;
  return `Cook ${meats.join(" and ")} until it reaches 75°C (165°F) in the thickest part.`;
}

/**
 * The layout's metadata sets a site-wide <title>, and Next can write it back after
 * this page has set its own (seen when the dish comes from the session cache on a
 * reload). Keep the page's title while it is mounted.
 */
function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
    const observer = new MutationObserver(() => {
      if (document.title !== title) document.title = title;
    });
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [title]);
}

function RecipeSkeleton() {
  return (
    <div className="max-w-6xl mx-auto md:px-6 lg:px-8 md:pt-10 motion-safe:animate-pulse" aria-busy="true" aria-label="Loading recipe">
      <div className="w-full aspect-[4/3] bg-stone-100 md:rounded-lg md:max-w-xl" />
      <div className="px-5 md:px-0 mt-6 space-y-3">
        <div className="h-8 w-3/4 rounded bg-stone-100" />
        <div className="h-5 w-1/2 rounded bg-stone-100" />
      </div>
    </div>
  );
}

function RecipeMissing() {
  usePageTitle("Recipe not found – Bon Taste");
  return (
    <div className="max-w-[40rem] mx-auto px-5 py-20 text-center">
      <h1 className="font-display font-medium text-[32px] leading-[1.1] text-stone-900">We couldn&apos;t find this recipe</h1>
      <p className="mt-3 text-stone-500">It may have been removed, or the link is incomplete.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center h-[52px] px-6 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors"
      >
        Back to the menu
      </Link>
    </div>
  );
}
