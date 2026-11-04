/**
 * The menu: real dishes from TheMealDB (https://www.themealdb.com), keyless and free.
 *
 * The app used to start from "what is in your fridge". The menu starts from the
 * other end: browse many real dishes, pick one, then see what to buy. Every dish
 * here has a real photo, real ingredients and real steps, so nothing on the menu
 * is invented by the local template engine.
 *
 * TheMealDB has no cook times or difficulty. Those fields are left
 * empty (cookTimeMinutes = 0) rather than guessed; the UI hides them when unknown.
 */

import type { DishSuggestion, RecipeIngredient, RecipeStep } from "@/types";
import { MENU_NEEDS_OVEN } from "@/lib/recipes/mealdbMeta";
import { MENU_DESCRIPTIONS } from "@/lib/recipes/mealdbDescriptions";
import { shortUnit } from "@/lib/units";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";
export const MEALDB_ID_PREFIX = "mealdb-";

/** Cuisines shown on the menu, in display order. Asia first. */
export const MENU_CUISINES = [
    { area: "Chinese" },
    { area: "Thai" },
    { area: "Vietnamese" },
    { area: "Japanese" },
    { area: "Malaysian" },
    { area: "Filipino" },
    { area: "Indian" },
    { area: "Italian" },
    { area: "Spanish" },
    { area: "French" },
    { area: "Greek" },
    { area: "British" },
    { area: "Mexican" },
] as const;

export interface MenuDish {
    id: string;
    title: string;
    needsOven: boolean;
    cuisine: string;
    imageUrl: string;
    /** One sentence shown under the dish name; "" for dishes added to TheMealDB later. */
    description: string;
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

/**
 * TheMealDB is third-party data. Its source links end up in an <a href> and its
 * photos in an <img src>, so only plain web links are kept: a "javascript:" or
 * "data:" value would otherwise run in the page when clicked.
 */
export function safeHttpUrl(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
    } catch {
        return undefined;
    }
}

/** Photos must come from TheMealDB's own image host. */
export function safeMealDbImage(value: string | null | undefined): string | undefined {
    const url = safeHttpUrl(value);
    return url && new URL(url).hostname === "www.themealdb.com" && url.startsWith("https://") ? url : undefined;
}

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
            return (data?.meals ?? []).flatMap((m) => {
                const imageUrl = safeMealDbImage(m.strMealThumb);
                // A dish without a usable photo is left off the menu rather than shown broken.
                return imageUrl
                    ? [
                          {
                              id: `${MEALDB_ID_PREFIX}${m.idMeal}`,
                              title: m.strMeal.trim(),
                              needsOven: MENU_NEEDS_OVEN[m.idMeal] ?? false,
                              cuisine: area,
                              imageUrl,
                              description: MENU_DESCRIPTIONS[m.idMeal] ?? "",
                          },
                      ]
                    : [];
            });
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

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

/** "1.", "2)", "Step 3:", "STEP 4 -" at the start of a line. */
const LEADING_NUMBER = /^\s*(?:step\s*\d+\s*[:.)\-–—]?|\d+\s*[.):\-–—](?!\d))\s*/i;
const BULLET = /^\s*[*•·\-–—]+\s*/;

function cleanLine(line: string): string {
    return line.replace(BULLET, "").replace(LEADING_NUMBER, "").replace(BULLET, "").trim();
}

/**
 * A short line that names the next part of the method rather than being a step:
 * "Marinate the beef:", "For the sauce:", "FOR THE GRAVY".
 */
function sectionHeader(line: string): string | null {
    const words = line.split(/\s+/).length;
    if (line.endsWith(":") && line.length <= 60 && words <= 8 && !/[.!?]\s/.test(line)) {
        return line.slice(0, -1).trim();
    }
    if (words <= 6 && /[A-Z]{3}/.test(line) && line === line.toUpperCase() && !/[.!?]$/.test(line)) {
        const lower = line.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }
    return null;
}

/**
 * Turn TheMealDB's single instructions blob into numbered steps.
 * - "1." / "Step 1:" numbering is stripped; a line that is only a number is dropped.
 * - A section header ("Marinate the beef:") becomes the title of the step after it.
 * - Steps without a header keep the generic title "Step n" (the UI hides it).
 * - Each step gets a timer when its text names a duration (see parseTimerSeconds).
 */
export function splitInstructions(instructions: string): RecipeStep[] {
    const steps: RecipeStep[] = [];
    let pendingTitle: string | null = null;

    for (const raw of instructions.split(/\r?\n+/)) {
        const line = cleanLine(raw);
        // Empty lines, bare "STEP 1" lines and stray punctuation.
        if (!/[a-z]{2}/i.test(line)) continue;

        const header = sectionHeader(line);
        if (header) {
            pendingTitle = header;
            continue;
        }

        const n = steps.length + 1;
        const timerSeconds = parseTimerSeconds(line);
        steps.push({
            step: n,
            title: pendingTitle ?? `Step ${n}`,
            text: line,
            ...(timerSeconds ? { timerSeconds } : {}),
        });
        pendingTitle = null;
    }
    return steps;
}

const WORD_NUMBERS: Record<string, number> = {
    a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, "forty-five": 45,
    fifty: 50, sixty: 60, "half an": 0.5, "half a": 0.5,
};

const NUM = String.raw`(?:\d+\s+\d+\/\d+|\d+\s*[½¼¾]|\d+\/\d+|\d+(?:\.\d+)?|[½¼¾]|half an?|forty-five|${Object.keys(WORD_NUMBERS)
    .filter((w) => !w.startsWith("half") && w !== "forty-five")
    .join("|")})`;
const DURATION = new RegExp(
    String.raw`\b(${NUM})(?:\s*(?:-|–|to|or)\s*(${NUM}))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b`,
    "gi"
);

function readNumber(text: string): number {
    const t = text.trim().toLowerCase();
    if (t in WORD_NUMBERS) return WORD_NUMBERS[t];
    if (t.startsWith("half")) return 0.5;
    const { amount } = parseMeasure(t);
    return amount;
}

function unitSeconds(unit: string): number {
    const u = unit.toLowerCase();
    if (u.startsWith("h")) return 3600;
    if (u.startsWith("m")) return 60;
    return 1;
}

/**
 * The first duration named in a step, in seconds: "Let stand for 10 minutes" → 600,
 * "1 1/2 hours" → 5400, "1 hour 30 minutes" → 5400.
 *
 * A range ("30-40 mins", "30 seconds to 1 minute") uses its LOWER bound: the timer is
 * a prompt to go and check, and checking early is harmless while checking late burns
 * the food. "Overnight", "a few minutes" and anything over a day get no timer.
 */
export function parseTimerSeconds(text: string): number | undefined {
    const matches = Array.from(text.matchAll(DURATION));
    const first = matches[0];
    if (!first) return undefined;

    const lower = (m: RegExpMatchArray) => {
        const a = readNumber(m[1]);
        const b = m[2] ? readNumber(m[2]) : a;
        return Math.min(a, b) * unitSeconds(m[3]);
    };

    let seconds = lower(first);
    // "1 hour 30 minutes" / "1 hour and 30 minutes" is one duration, not two.
    const next = matches[1];
    if (next && unitSeconds(first[3]) > unitSeconds(next[3])) {
        const between = text.slice((first.index ?? 0) + first[0].length, next.index);
        if (/^\s*(?:and\s*)?$/i.test(between)) seconds += lower(next);
    }

    seconds = Math.round(seconds);
    return seconds > 0 && seconds <= 24 * 3600 ? seconds : undefined;
}

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------

/**
 * A measure as the app stores it: "4 Tablespoons" → 4 tbsp, "2 cloves minced" →
 * 2 clove + note "minced", "To taste" → amount 0 (no quantity) + note "to taste".
 * An unknown word after the number stays as the unit ("2 large", "1 (12 oz.)").
 */
export function normaliseMeasure(measure: string): { amount: number; unit: string; note?: string } {
    const text = measure.trim().replace(/\s+/g, " ");
    if (!text) return { amount: 0, unit: "" };
    const hasNumber = /^(\d|[¼½¾⅓⅔])/.test(text);

    if (!hasNumber) {
        // "Pinch", "Handful", "Dash of" are quantities of one.
        const [word, ...rest] = text.split(" ");
        const unit = shortUnit(word);
        if (unit) return withNote(1, unit, rest.join(" "));
        return { amount: 0, unit: "", note: text.toLowerCase() };
    }

    const { amount, unit: rest } = parseMeasure(text);
    const m = rest.match(/^([a-zA-Z]+\.?)(.*)$/);
    const unit = m ? shortUnit(m[1]) : undefined;
    if (unit && m) return withNote(amount, unit, m[2]);
    return { amount, unit: rest };
}

function withNote(amount: number, unit: string, note: string) {
    const clean = note.replace(/^[\s,;:-]+|^of\s+/gi, "").trim();
    return clean ? { amount, unit, note: clean } : { amount, unit };
}

/** Units that can be added together, measured in a shared base unit. */
const UNIT_FAMILIES: Record<string, { family: string; base: number }> = {
    tsp: { family: "spoon", base: 1 },
    tbsp: { family: "spoon", base: 3 },
    cup: { family: "spoon", base: 48 },
    ml: { family: "ml", base: 1 },
    l: { family: "ml", base: 1000 },
    g: { family: "g", base: 1 },
    kg: { family: "g", base: 1000 },
    oz: { family: "oz", base: 1 },
    lb: { family: "oz", base: 16 },
};

/** Add b to a when their units allow it; null when they can't be added. */
function addAmounts(
    a: { amount: number; unit: string },
    b: { amount: number; unit: string }
): { amount: number; unit: string } | null {
    if (a.unit === b.unit) return { amount: a.amount + b.amount, unit: a.unit };
    const fa = UNIT_FAMILIES[a.unit];
    const fb = UNIT_FAMILIES[b.unit];
    if (!fa || !fb || fa.family !== fb.family) return null;
    const total = a.amount * fa.base + b.amount * fb.base;
    // Say it in the bigger of the two units when that is at least 1 of it.
    const [big, small] = fa.base >= fb.base ? [a.unit, b.unit] : [b.unit, a.unit];
    const inBig = total / UNIT_FAMILIES[big].base;
    return inBig >= 1 ? { amount: inBig, unit: big } : { amount: total / UNIT_FAMILIES[small].base, unit: small };
}

const nameKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * TheMealDB lists an ingredient once per use ("Soy Sauce" for the marinade and again
 * for the sauce). The cook needs one row per ingredient, so rows with the same name
 * (ignoring case and spacing) are merged: amounts in compatible units are added
 * (1 tsp + 1 tbsp → 1⅓ tbsp); otherwise the extra amount is kept in `also`
 * ("2 tbsp + 1 clove"). An amount of 0 (no quantity given) adds nothing.
 */
export function mergeIngredients(items: RecipeIngredient[]): RecipeIngredient[] {
    const merged: RecipeIngredient[] = [];
    const byKey = new Map<string, RecipeIngredient>();

    for (const item of items) {
        const key = nameKey(item.name);
        const existing = byKey.get(key);
        if (!existing) {
            const copy = { ...item };
            byKey.set(key, copy);
            merged.push(copy);
            continue;
        }
        if (item.note && item.note !== existing.note) {
            existing.note = existing.note ? `${existing.note}, ${item.note}` : item.note;
        }
        if (!(item.amount > 0)) continue;
        if (!(existing.amount > 0)) {
            existing.amount = item.amount;
            existing.unit = item.unit;
            continue;
        }
        const sum = addAmounts(existing, item);
        if (sum) {
            existing.amount = Math.round(sum.amount * 1000) / 1000;
            existing.unit = sum.unit;
            continue;
        }
        const others = existing.also ?? [];
        const index = others.findIndex((o) => addAmounts(o, item));
        if (index >= 0) {
            const s = addAmounts(others[index], item)!;
            others[index] = { amount: Math.round(s.amount * 1000) / 1000, unit: s.unit };
        } else {
            others.push({ amount: item.amount, unit: item.unit });
        }
        existing.also = others;
    }
    return merged;
}

export function mealToDish(meal: MealDbMeal): DishSuggestion {
    const raw: RecipeIngredient[] = [];
    for (let i = 1; i <= 20; i++) {
        const name = meal[`strIngredient${i}`]?.trim().replace(/\s+/g, " ");
        if (!name) continue;
        raw.push({ name, ...normaliseMeasure(meal[`strMeasure${i}`] ?? "") });
    }
    const ingredients = mergeIngredients(raw);

    const cuisine = meal.strArea || "World";
    return {
        id: `${MEALDB_ID_PREFIX}${meal.idMeal}`,
        title: meal.strMeal.trim(),
        needsOven: MENU_NEEDS_OVEN[meal.idMeal] ?? /\boven\b|\bbak(e|ed|ing)\b/i.test(meal.strInstructions ?? ""),
        cuisine,
        cookTimeMinutes: 0,
        difficulty: "Medium",
        servings: 2,
        // TheMealDB has no descriptions; menu dishes have a hand-written one.
        description: MENU_DESCRIPTIONS[meal.idMeal] ?? "",
        usedUserIngredients: [],
        extraIngredientsNeeded: ingredients,
        estimatedCostHkd: 0,
        availabilityNote: "",
        imageUrl: safeMealDbImage(meal.strMealThumb),
        steps: splitInstructions(meal.strInstructions ?? ""),
        sourceUrl: safeHttpUrl(meal.strSource) ?? `https://www.themealdb.com/meal/${meal.idMeal}`,
        sourceName: "TheMealDB",
    };
}
