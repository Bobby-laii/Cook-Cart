/**
 * The menu: real dishes from TheMealDB (https://www.themealdb.com), keyless and free.
 *
 * The app used to start from "what is in your fridge". The menu starts from the
 * other end: browse many real dishes, pick one, then see what to buy. Every dish
 * here has a real photo, real ingredients and real steps, so nothing on the menu
 * is invented by the local template engine.
 *
 * TheMealDB has no cook times, difficulty or Chinese names. Those fields are left
 * empty (cookTimeMinutes = 0) rather than guessed; the UI hides them when unknown.
 */

import type { DishSuggestion, RecipeIngredient, RecipeStep } from "@/types";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";
export const MEALDB_ID_PREFIX = "mealdb-";

/** Cuisines shown on the menu, in display order. Asia first for a Hong Kong audience. */
export const MENU_CUISINES = [
    { area: "Chinese", nameZh: "中菜" },
    { area: "Thai", nameZh: "泰國菜" },
    { area: "Vietnamese", nameZh: "越南菜" },
    { area: "Japanese", nameZh: "日本菜" },
    { area: "Malaysian", nameZh: "馬來西亞菜" },
    { area: "Filipino", nameZh: "菲律賓菜" },
    { area: "Indian", nameZh: "印度菜" },
    { area: "Italian", nameZh: "意大利菜" },
    { area: "Spanish", nameZh: "西班牙菜" },
    { area: "French", nameZh: "法國菜" },
    { area: "Greek", nameZh: "希臘菜" },
    { area: "British", nameZh: "英國菜" },
    { area: "Mexican", nameZh: "墨西哥菜" },
] as const;

export interface MenuDish {
    id: string;
    title: string;
    cuisine: string;
    imageUrl: string;
}

interface MealDbSummary {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
}

export type MealDbMeal = MealDbSummary & {
    strArea?: string | null;
    strCategory?: string | null;
    strInstructions?: string | null;
    strSource?: string | null;
    [key: string]: string | null | undefined;
};

async function getJson<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${MEALDB}/${path}`, {
            // The catalogue changes rarely; one fetch per cuisine per 6 hours is plenty.
            next: { revalidate: 21600 },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

/**
 * Every menu dish, grouped by cuisine order. A cuisine the provider returns
 * nothing for is skipped, so an outage shrinks the menu instead of breaking it.
 */
export async function fetchMenu(): Promise<MenuDish[]> {
    const lists = await Promise.all(
        MENU_CUISINES.map(async ({ area }) => {
            const data = await getJson<{ meals: MealDbSummary[] | null }>(
                `filter.php?a=${encodeURIComponent(area)}`
            );
            return (data?.meals ?? []).map((m) => ({
                id: `${MEALDB_ID_PREFIX}${m.idMeal}`,
                title: m.strMeal,
                cuisine: area,
                imageUrl: m.strMealThumb,
            }));
        })
    );
    return lists.flat();
}

export async function fetchMenuDish(id: string): Promise<DishSuggestion | null> {
    const mealId = id.startsWith(MEALDB_ID_PREFIX) ? id.slice(MEALDB_ID_PREFIX.length) : "";
    if (!/^\d+$/.test(mealId)) return null;
    const data = await getJson<{ meals: MealDbMeal[] | null }>(`lookup.php?i=${mealId}`);
    const meal = data?.meals?.[0];
    return meal ? mealToDish(meal) : null;
}

const UNICODE_FRACTIONS: Record<string, number> = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };

/**
 * Split a free-text measure like "3/4 cup", "1 ½ tsp" or "pinch" into a number
 * and a unit, so the recipe page can scale it by servings. Anything without a
 * leading quantity becomes amount 1 with the whole text as the unit.
 */
export function parseMeasure(measure: string): { amount: number; unit: string } {
    let rest = measure.trim();
    let amount = 0;

    let m: RegExpMatchArray | null;
    // Mixed numbers appear as "1 1/2" and also as "2-1/2" / "2 -1/2".
    if ((m = rest.match(/^(\d+)\s*-?\s*(\d+)\/(\d+)/))) {
        amount = +m[1] + +m[2] / +m[3];
    } else if ((m = rest.match(/^(\d+)\/(\d+)/))) {
        amount = +m[1] / +m[2];
    } else if ((m = rest.match(/^\d+(?:\.\d+)?/))) {
        amount = +m[0];
    }
    if (m) rest = rest.slice(m[0].length);

    const unicode = rest.match(/^\s*([¼½¾⅓⅔])/);
    if (unicode) {
        amount += UNICODE_FRACTIONS[unicode[1]];
        rest = rest.slice(unicode[0].length);
    }

    if (amount === 0) return { amount: 1, unit: measure.trim() };
    return { amount: Math.round(amount * 100) / 100, unit: rest.trim() };
}

/** Turn TheMealDB's single instructions blob into numbered steps. */
export function splitInstructions(instructions: string): RecipeStep[] {
    return instructions
        .split(/\r?\n+/)
        .map((line) => line.replace(/^\s*(step\s*\d+[:.)]?|\d+[.)])\s*/i, "").trim())
        // Drop empty lines and bare "STEP 1" headings left over from the split.
        .filter((line) => line.length > 3)
        .map((text, i) => ({ step: i + 1, title: `Step ${i + 1}`, titleZh: `第 ${i + 1} 步`, text }));
}

export function mealToDish(meal: MealDbMeal): DishSuggestion {
    const ingredients: RecipeIngredient[] = [];
    for (let i = 1; i <= 20; i++) {
        const name = meal[`strIngredient${i}`]?.trim();
        if (!name) continue;
        const { amount, unit } = parseMeasure(meal[`strMeasure${i}`] ?? "");
        ingredients.push({ name, nameZh: name, amount, unit });
    }

    const cuisine = meal.strArea || "World";
    return {
        id: `${MEALDB_ID_PREFIX}${meal.idMeal}`,
        title: meal.strMeal,
        titleZh: meal.strMeal,
        cuisine,
        cookTimeMinutes: 0,
        difficulty: "Medium",
        servings: 2,
        description: [cuisine, meal.strCategory].filter(Boolean).join(" · "),
        descriptionZh: "",
        usedUserIngredients: [],
        extraIngredientsNeeded: ingredients,
        estimatedCostHkd: 0,
        availabilityNote: "",
        imageUrl: meal.strMealThumb,
        steps: splitInstructions(meal.strInstructions ?? ""),
        sourceUrl: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
        sourceName: "TheMealDB",
    };
}
