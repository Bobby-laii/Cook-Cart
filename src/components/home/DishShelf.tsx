"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { MenuDish } from "@/lib/recipes/mealdb";
import { cuisineLabel } from "@/lib/recipes/cuisines";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx, iconButton } from "@/components/ui/styles";

/**
 * A horizontal, swipeable row of dishes. Phones swipe left with native momentum and
 * snap; desktop gets quiet previous/next buttons. Three card templates keep the home
 * page from reading as one long identical grid:
 *
 * - `portrait`: tall 3:4 photos, about two and a half per phone screen
 * - `landscape`: wide 16:10 photos with a one-line description, one and a bit per screen
 * - `compact`: small square photos, a quick scan of many dishes
 *
 * Follows DESIGN.md: photo first, no shadows, no gradients, 8px photo corners.
 */
export type ShelfVariant = "portrait" | "landscape" | "compact";

const CARD_WIDTH: Record<ShelfVariant, string> = {
  portrait: "w-[42vw] max-w-[220px] sm:w-[200px]",
  landscape: "w-[78vw] max-w-[360px] sm:w-[340px]",
  compact: "w-[30vw] max-w-[150px] sm:w-[140px]",
};

const PHOTO_ASPECT: Record<ShelfVariant, string> = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-[16/10]",
  compact: "aspect-square",
};

export function DishShelf({
  id,
  title,
  subtitle,
  dishes,
  variant,
  onOpen,
  opening,
}: {
  id: string;
  title: string;
  subtitle?: string;
  dishes: MenuDish[];
  variant: ShelfVariant;
  onOpen: (dish: MenuDish) => void;
  opening: string | null;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges, dishes]);

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  if (dishes.length === 0) return null;
  const headingId = `shelf-${id}`;

  return (
    <section aria-labelledby={headingId} className="mt-12 md:mt-16">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="font-display font-medium text-[24px] md:text-[28px] leading-[1.15] text-stone-900"
          >
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-small text-stone-600">{subtitle}</p>}
        </div>
        <div className="hidden md:flex items-center gap-1 shrink-0 -mr-2">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={!canPrev}
            aria-label={`Previous dishes in ${title}`}
            className={iconButton("ghost", "sm")}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={!canNext}
            aria-label={`More dishes in ${title}`}
            className={iconButton("ghost", "sm")}
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        className={cx(
          "mt-4 flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory overscroll-x-contain",
          "-mx-5 px-5 scroll-px-5 md:-mx-6 md:px-6 md:scroll-px-6 lg:-mx-8 lg:px-8 lg:scroll-px-8",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {dishes.map((dish) => (
          <li key={dish.id} className={cx("shrink-0 snap-start", CARD_WIDTH[variant])}>
            <button
              type="button"
              onClick={() => onOpen(dish)}
              disabled={opening !== null}
              aria-label={dish.title}
              className="group block w-full text-left rounded-lg disabled:cursor-wait"
            >
              <div className="overflow-hidden rounded-lg bg-stone-100">
                <img
                  data-dish-photo={dish.id}
                  src={variant === "landscape" ? dish.imageUrl : `${dish.imageUrl}/medium`}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  width={variant === "landscape" ? 680 : 350}
                  height={variant === "landscape" ? 425 : variant === "portrait" ? 466 : 350}
                  className={cx(
                    "w-full object-cover transition-[opacity,transform] duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
                    PHOTO_ASPECT[variant],
                    opening === dish.id && "opacity-60"
                  )}
                />
              </div>
              <span
                className={cx(
                  "mt-2.5 block font-display font-medium leading-[1.25] text-stone-900 group-hover:underline underline-offset-4 decoration-stone-300",
                  variant === "compact" ? "text-[15px] line-clamp-2" : "text-[17px] md:text-[18px] line-clamp-2"
                )}
              >
                {dish.title}
              </span>
              {variant === "landscape" && dish.description && (
                <span className="mt-1 block text-small leading-snug text-stone-700 line-clamp-1">
                  {dish.description}
                </span>
              )}
              {variant !== "compact" && (
                <span className="mt-0.5 block text-sm text-stone-600">
                  {opening === dish.id ? "Opening the recipe" : cuisineLabel(dish.cuisine)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

