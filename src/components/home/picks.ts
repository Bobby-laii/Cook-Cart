import { cuisineLabel } from "@/lib/recipes/cuisines";
import type { MenuDish } from "@/lib/recipes/mealdb";

/** Small, fast, seedable PRNG (mulberry32). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The local calendar day, e.g. "2026-11-04". */
export function localDayKey(date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * Three picks for tonight. The same day (and the same reshuffle count) always gives
 * the same three, so the page does not change under you on reload. Dishes that need
 * an oven are left out when the kitchen has none. Picks come from different
 * cuisines where the menu allows it, so the three feel like a real choice.
 *
 * The menu list carries no step counts, so the pick is by seed alone.
 */
export function pickTonight(
  dishes: MenuDish[],
  { day, round = 0, noOven = false, count = 3 }: { day: string; round?: number; noOven?: boolean; count?: number }
): MenuDish[] {
  const pool = dishes.filter((d) => !noOven || !d.needsOven);
  if (pool.length === 0) return [];

  const rand = mulberry32(hash(`${day}#${round}`));
  // Fisher-Yates over a copy, seeded.
  const order = pool.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const picks: MenuDish[] = [];
  const cuisines = new Set<string>();
  for (const dish of order) {
    if (picks.length === count) break;
    if (cuisines.has(dish.cuisine)) continue;
    picks.push(dish);
    cuisines.add(dish.cuisine);
  }
  // Fewer cuisines than picks: fill up with whatever comes next.
  for (const dish of order) {
    if (picks.length === count) break;
    if (!picks.includes(dish)) picks.push(dish);
  }
  return picks;
}

/** A short, honest line about a dish from what the menu knows: its cuisine and the oven. */
export function dishLine(dish: MenuDish): string {
  const cuisine = cuisineLabel(dish.cuisine);
  const article = /^[aeiou]/i.test(cuisine) ? "An" : "A";
  return dish.needsOven
    ? `${article} ${cuisine} dish, made in the oven`
    : `${article} ${cuisine} dish, no oven needed`;
}
