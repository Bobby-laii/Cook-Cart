import type { DishSuggestion } from "@/types";
import { MEALDB_ID_PREFIX } from "@/lib/recipes/mealdb";

/** The dish the user last opened, so recipe → cook mode needs no second fetch. */
export const ACTIVE_DISH_KEY = "cookcart_active_dish";

function readCached(id: string): DishSuggestion | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_DISH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DishSuggestion;
    return parsed?.id === id ? parsed : null;
  } catch {
    return null;
  }
}

export function rememberDish(dish: DishSuggestion) {
  try {
    sessionStorage.setItem(ACTIVE_DISH_KEY, JSON.stringify(dish));
  } catch {
    // Storage blocked: the next page fetches the dish again.
  }
}

/**
 * Loads a dish by the id in the URL, from the menu (`mealdb-…`) or the user's saved
 * recipes (any other id, served by /api/recipes/saved/:id). Returns null when the dish
 * doesn't exist or can't be loaded; callers show a "couldn't find this recipe" state,
 * never a stand-in dish.
 */
export async function loadDish(id: string): Promise<DishSuggestion | null> {
  const cached = readCached(id);
  if (cached) return cached;

  const url = id.startsWith(MEALDB_ID_PREFIX)
    ? `/api/menu/${encodeURIComponent(id)}`
    : `/api/recipes/saved/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; dish?: DishSuggestion };
    if (!data.success || !data.dish) return null;
    rememberDish(data.dish);
    return data.dish;
  } catch {
    return null;
  }
}
