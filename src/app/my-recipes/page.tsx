"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trash2, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

interface SavedRecipeItem {
  id: string;
  rating: string;
  recipe: {
    id: string;
    title: string;
    cuisine: string;
    cookTimeMinutes: number;
    difficulty: string;
    servings: number;
    description: string;
    // Nullable: recipes saved before photos existed have no stored image.
    imageUrl?: string | null;
  };
}

interface PendingRemoval {
  item: SavedRecipeItem;
  index: number;
  timer: ReturnType<typeof setTimeout>;
}

/** How long "Undo" stays on screen before the recipe is really removed. */
const UNDO_MS = 6000;

function removeSaved(savedRecipeId: string) {
  // keepalive lets the request finish if the user leaves the page during the undo window.
  return fetch(`/api/recipes/saved?id=${encodeURIComponent(savedRecipeId)}`, {
    method: "DELETE",
    keepalive: true,
  }).catch(() => undefined);
}

function describe(r: SavedRecipeItem["recipe"]): string {
  const parts: string[] = [];
  if (r.cuisine) parts.push(r.cuisine);
  if (r.cookTimeMinutes > 0) parts.push(`${r.cookTimeMinutes} minutes`);
  return parts.join(", ");
}

export default function MyRecipesPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<SavedRecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [pending, setPending] = useState<PendingRemoval | null>(null);
  const pendingRef = useRef<PendingRemoval | null>(null);
  pendingRef.current = pending;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/recipes/saved");
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!cancelled) setRecipes(data.recipes || []);
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Leaving the page commits a removal that is still waiting for "Undo".
  useEffect(() => {
    return () => {
      const p = pendingRef.current;
      if (p) {
        clearTimeout(p.timer);
        removeSaved(p.item.id);
      }
    };
  }, []);

  const handleRemove = useCallback(
    (item: SavedRecipeItem) => {
      // Only one undo at a time: an earlier removal is committed now.
      if (pending) {
        clearTimeout(pending.timer);
        removeSaved(pending.item.id);
      }
      const index = recipes.findIndex((r) => r.id === item.id);
      const timer = setTimeout(() => {
        removeSaved(item.id);
        setPending((p) => (p?.item.id === item.id ? null : p));
      }, UNDO_MS);
      setRecipes((list) => list.filter((r) => r.id !== item.id));
      setPending({ item, index, timer });
    },
    [pending, recipes]
  );

  const handleUndo = () => {
    if (!pending) return;
    clearTimeout(pending.timer);
    setRecipes((list) => {
      const next = [...list];
      next.splice(Math.min(pending.index, next.length), 0, pending.item);
      return next;
    });
    setPending(null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-6 sm:px-6 lg:px-8">
      <h1 className="font-display text-[34px] font-medium leading-[1.1] text-stone-900 sm:text-[40px]">
        My recipes
      </h1>

      {loading ? (
        <p className="mt-8 text-[17px] text-stone-500">Loading your recipes...</p>
      ) : loadFailed ? (
        <p role="alert" className="mt-8 text-[17px] text-danger">
          {"We couldn't load your recipes. Check your connection and try again."}
        </p>
      ) : recipes.length === 0 && !pending ? (
        <div className="mt-10 max-w-md">
          <UtensilsCrossed className="h-8 w-8 text-stone-500" aria-hidden />
          <h2 className="mt-4 font-display text-[24px] font-medium leading-tight text-stone-900">
            Nothing saved yet
          </h2>
          <p className="mt-2 text-[17px] text-stone-500">
            Find a dish you like on the menu and tap Save. It will wait for you here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-[52px] items-center justify-center rounded-lg bg-brand-500 px-6 text-[17px] font-bold text-white transition-colors hover:bg-brand-600"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-[17px] text-stone-500">
            {recipes.length === 1 ? "1 saved recipe" : `${recipes.length} saved recipes`}
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {recipes.map((item) => {
              const r = item.recipe;
              const meta = describe(r);
              return (
                <li key={item.id} className="min-w-0">
                  <Link href={`/recipe/${r.id}`} className="group block">
                    <div className="aspect-[4/5] overflow-hidden rounded-lg bg-stone-100">
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.02]"
                          onError={(e) => {
                            e.currentTarget.style.visibility = "hidden";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-500">
                          <UtensilsCrossed className="h-8 w-8" aria-hidden />
                        </div>
                      )}
                    </div>
                    <h2 className="mt-3 font-display text-[18px] font-medium leading-[1.25] text-stone-900 group-hover:underline group-hover:underline-offset-4">
                      {r.title}
                    </h2>
                  </Link>
                  <div className="mt-1 flex items-start justify-between gap-2">
                    {meta ? <p className="min-w-0 text-[14px] text-stone-500">{meta}</p> : <span />}
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      aria-label={`Remove ${r.title}`}
                      className="-mr-3 -mt-3 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Undo bar: sits above the tab bar on phones, bottom of the screen from md up. */}
      <div aria-live="polite" className="above-tabbar pointer-events-none fixed inset-x-0 z-40 px-5 pb-4">
        {pending && (
          <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg bg-stone-900 py-2 pl-4 pr-2 text-stone-50 cc-fade-in">
            <span className="min-w-0 truncate text-[15px]">{`Removed ${pending.item.recipe.title}`}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex h-12 shrink-0 items-center rounded-lg px-4 text-[15px] font-bold underline underline-offset-4"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
