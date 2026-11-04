import { DishSuggestion, RecipeIngredient, RecipeStep } from "@/types";

/**
 * Live recipe lookup via Spoonacular.
 *
 * Server-only by design. The key must never be prefixed NEXT_PUBLIC_ or read
 * from a client component: anything in a `"use client"` bundle is shipped to
 * the browser, which is how the previous hardcoded key in the sibling
 * cookmate-global project leaked.
 *
 * Endpoint choice: `complexSearch` with addRecipeInformation=true returns the
 * full recipe — steps, ingredients, servings, time and photo — in a single
 * response. `findByIngredients` ignores addRecipeInformation and would need one
 * extra `/information` call per dish (verified: the field is absent from its
 * payload), costing 4 quota points per search instead of 1. The free tier is
 * 150 points/day, so that difference is the gap between ~37 and ~150 searches.
 */

const BASE_URL = "https://api.spoonacular.com";
const REQUEST_TIMEOUT_MS = 8000;

/**
 * The app's cuisine labels do not match the values complexSearch accepts, and the
 * API silently ignores a value it does not recognise rather than erroring.
 * Verified: `cuisine=cantonese` returned Western salmon dishes with no filtering
 * applied at all, while `cuisine=chinese` narrowed correctly. Anything absent from
 * this map is therefore omitted rather than passed through, because passing an
 * unknown value looks like filtering while doing nothing.
 *
 * Spoonacular's accepted set: African, Asian, American, British, Cajun, Caribbean,
 * Chinese, Eastern European, European, French, German, Greek, Indian, Irish,
 * Italian, Japanese, Jewish, Korean, Latin American, Mediterranean, Mexican,
 * Middle Eastern, Nordic, Southern, Spanish, Thai, Vietnamese.
 */
const CUISINE_TO_API: Record<string, string> = {
    cantonese: "Chinese",
    sichuan: "Chinese",
    "sichuan / spicy": "Chinese",
    japanese: "Japanese",
    korean: "Korean",
    thai: "Thai",
    vietnamese: "Vietnamese",
    indian: "Indian",
    "indian / curry": "Indian",
    italian: "Italian",
    french: "French",
    "spanish / tapas": "Spanish",
    mediterranean: "Mediterranean",
    mexican: "Mexican",
    "american / comfort": "American",
    "african / tagine": "African",
    // Broad styles have no single API equivalent. Omitting the filter is honest;
    // mapping "Asian Food" to one country would silently narrow it to that country.
    asian: "",
    "asian food": "",
    western: "",
    "western food": "",
    "surprise me": "",
};

function apiCuisineFor(cuisine: string): string {
    const key = cuisine.trim().toLowerCase();
    return CUISINE_TO_API[key] ?? "";
}

/** Free tier is 150 points/day; one complexSearch call is 1 point. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

interface CachedResult {
    suggestions: DishSuggestion[];
    storedAt: number;
}

const searchCache = new Map<string, CachedResult>();

export function hasSpoonacularKey(): boolean {
    return (process.env.SPOONACULAR_API_KEY || "").trim().length > 0;
}

/* ------------------------------------------------------------------ *
 * Spoonacular response shapes (only the fields we consume)
 * ------------------------------------------------------------------ */

interface SpoonacularIngredient {
    name?: string;
    amount?: number;
    unit?: string;
    original?: string;
}

interface SpoonacularStep {
    number?: number;
    step?: string;
}

interface SpoonacularRecipe {
    id: number;
    title?: string;
    image?: string;
    readyInMinutes?: number;
    servings?: number;
    pricePerServing?: number;
    sourceUrl?: string;
    sourceName?: string;
    analyzedInstructions?: { steps?: SpoonacularStep[] }[];
    extendedIngredients?: SpoonacularIngredient[];
}

interface SpoonacularSearchResponse {
    results?: SpoonacularRecipe[];
}

/* ------------------------------------------------------------------ *
 * Mapping
 * ------------------------------------------------------------------ */

/** USD per serving -> HKD. Approximate; only used for the displayed estimate. */
const USD_TO_HKD = 7.8;

/**
 * Spoonacular returns instructions as plain sentences with no title and no timer.
 * RecipeStep requires a title, so this emits a neutral "Step N" label rather than
 * deriving one from the step's opening words. The detail page renders the title as
 * a heading directly above the text, so an opening-words title produced a heading
 * that was just the first half of the sentence repeated underneath it
 * ("In a frying pan, melt" over "In a frying pan, melt the butter..."). A plain
 * label says nothing false and does not duplicate the instruction.
 *
 * No timerSeconds is set: the source supplies no durations, and guessing one would
 * start a countdown the recipe never specified.
 */
function buildSteps(recipe: SpoonacularRecipe): RecipeStep[] {
    return (recipe.analyzedInstructions?.[0]?.steps || [])
        .filter((s) => Boolean(s.step && s.step.trim()))
        .map((s, idx) => {
            const stepNumber = typeof s.number === "number" ? s.number : idx + 1;
            return {
                step: stepNumber,
                title: `Step ${stepNumber}`,
                text: (s.step as string).trim(),
            };
        });
}

function buildIngredients(recipe: SpoonacularRecipe): RecipeIngredient[] {
    return (recipe.extendedIngredients || [])
        .filter((ing) => Boolean(ing.name))
        .map((ing) => ({
            name: ing.name as string,
            amount: typeof ing.amount === "number" ? Math.round(ing.amount * 100) / 100 : 1,
            unit: ing.unit || "",
        }));
}

/** Lowercase words with a trailing plural "s" removed, for tolerant comparison. */
function words(text: string): string[] {
    return text
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter(Boolean)
        .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));
}

/**
 * Decides whether a recipe ingredient is one the user already has.
 *
 * A plain substring test fails on plurals — the catalogue stores "salmon
 * fillets", so searching for "salmon fillet" missed it and the card told the user
 * to buy salmon they had already entered. Comparing whole words after stripping a
 * plural "s" fixes that, while still refusing to match "pea" to "peanut", which a
 * substring test would have wrongly accepted.
 *
 * Every word of the user's ingredient must appear in the recipe ingredient, so
 * "lemon" matches "fresh lemon juice" but "chicken thigh" does not match plain
 * "chicken".
 */
function ingredientMatches(recipeIngredient: string, userIngredient: string): boolean {
    const need = words(userIngredient);
    if (need.length === 0) return false;
    const have = new Set(words(recipeIngredient));
    return need.every((word) => have.has(word));
}

function difficultyFor(readyInMinutes: number, stepCount: number): DishSuggestion["difficulty"] {
    if (readyInMinutes <= 25 && stepCount <= 5) return "Easy";
    if (readyInMinutes <= 60 && stepCount <= 10) return "Medium";
    return "Hard";
}

function mapRecipeToSuggestion(
    recipe: SpoonacularRecipe,
    index: number,
    userIngredients: string[],
    cuisine: string,
    requestedServings: number
): DishSuggestion | null {
    const title = (recipe.title || "").trim();
    const steps = recipe.analyzedInstructions?.[0]?.steps || [];

    // A recipe with no instructions cannot be cooked from, and the card's whole
    // purpose is to be cooked from. Drop it and let another candidate fill the slot.
    if (!title || steps.length === 0) return null;

    const readyInMinutes = recipe.readyInMinutes || 30;
    const servings = recipe.servings || requestedServings;
    const ingredients = buildIngredients(recipe);

    const usedUserIngredients = userIngredients.filter((userIng) =>
        ingredients.some((ing) => ingredientMatches(ing.name, userIng))
    );

    // Everything the recipe needs that the user did not already list.
    const extraIngredientsNeeded = ingredients.filter(
        (ing) => !userIngredients.some((userIng) => ingredientMatches(ing.name, userIng))
    );

    // Keep the user's own cuisine label on the card rather than the API's, so a
    // Cantonese request is not relabelled "Chinese" in the UI just because that is
    // the value the API understands.

    const perServingHkd = typeof recipe.pricePerServing === "number"
        ? (recipe.pricePerServing / 100) * USD_TO_HKD
        : 0;
    const estimatedCostHkd = perServingHkd > 0
        ? Math.round(perServingHkd * servings * 100) / 100
        : // No price from the API: show an estimate derived from ingredient count
        // rather than a hardcoded zero that would look broken.
        45 + ingredients.length * 4;

    return {
        id: `spoon_${recipe.id}_${index}`,
        title,
        cuisine,
        cookTimeMinutes: readyInMinutes,
        difficulty: difficultyFor(readyInMinutes, steps.length),
        servings,
        description: `A ${cuisine} dish from the live recipe catalogue: ${ingredients
            .slice(0, 5)
            .map((i) => i.name)
            .join(", ")}. ${steps.length} cooking steps.`,
        usedUserIngredients,
        extraIngredientsNeeded,
        // Spoonacular has no Hong Kong stock data. Claiming "in stock at all 4
        // supermarket partners" (as the local engine does) would be fabricated, so
        // this states the real limitation instead.
        availabilityNote:
            "",
        estimatedCostHkd,
        imageUrl: recipe.image || undefined,
        steps: buildSteps(recipe),
        sourceUrl: recipe.sourceUrl,
        sourceName: recipe.sourceName,
    };
}

/* ------------------------------------------------------------------ *
 * Cache
 * ------------------------------------------------------------------ */

function readCache(key: string): DishSuggestion[] | null {
    const hit = searchCache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.storedAt > CACHE_TTL_MS) {
        searchCache.delete(key);
        return null;
    }
    return hit.suggestions;
}

function writeCache(key: string, suggestions: DishSuggestion[]): void {
    // Bound the map so a client sending unique ingredient sets cannot grow it
    // without limit. Map preserves insertion order, so the first key is the oldest.
    if (searchCache.size >= MAX_CACHE_ENTRIES) {
        const oldest = searchCache.keys().next().value;
        if (oldest !== undefined) searchCache.delete(oldest);
    }
    searchCache.set(key, { suggestions, storedAt: Date.now() });
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

/**
 * Fetch live recipes for a set of ingredients.
 *
 * Returns [] on any failure — missing key, timeout, non-2xx, empty result — so
 * the caller can fall back to the local engine. Never throws: a recipe service
 * outage must not take down the chat endpoint.
 */
export async function fetchLiveRecipes(
    userIngredients: string[],
    cuisine: string,
    count = 3,
    requestedServings = 2
): Promise<DishSuggestion[]> {
    const apiKey = (process.env.SPOONACULAR_API_KEY || "").trim();
    if (!apiKey) return [];

    const cleaned = userIngredients.map((i) => i.trim()).filter(Boolean);
    if (cleaned.length === 0) return [];

    const cacheKey = `${cleaned.join(",").toLowerCase()}|${cuisine}|${count}|${requestedServings}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    try {
        // includeIngredients, not query. `query` is a strict full-text match:
        // "Western Food Salmon Fillet Asparagus Lemon" returned 0 results, while
        // the same ingredients passed to includeIngredients returned 6. Asking for
        // more than needed costs nothing extra (complexSearch is 1 point per call
        // regardless of `number`) and gives room to drop unusable or duplicate hits.
        const params = new URLSearchParams({
            includeIngredients: cleaned.join(","),
            number: String(count * 3),
            // One call returns everything the card needs.
            addRecipeInformation: "true",
            fillIngredients: "true",
            // Skip recipes with no written method — they are unusable here.
            instructionsRequired: "true",
            // Prefer recipes that use more of what the user actually has.
            sort: "max-used-ingredients",
            apiKey,
        });

        const apiCuisine = apiCuisineFor(cuisine);
        if (apiCuisine) params.set("cuisine", apiCuisine);

        const response = await fetch(`${BASE_URL}/recipes/complexSearch?${params}`, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            // Recipes do not change minute to minute; avoid spending quota twice on
            // the same query within the Next.js fetch cache window.
            next: { revalidate: 21600 },
        });

        if (!response.ok) {
            // 402 = daily quota exhausted, 401 = bad key. Both are worth surfacing in
            // the server log because they are configuration problems, not outages.
            console.warn(
                `[spoonacular] ${response.status} ${response.statusText} — falling back to local engine`
            );
            return [];
        }

        const data = (await response.json()) as SpoonacularSearchResponse;
        const results = data.results || [];

        const suggestions: DishSuggestion[] = [];
        const seenTitles = new Set<string>();

        for (const result of results) {
            if (suggestions.length >= count) break;

            // The catalogue contains near-duplicates that differ only in a word or
            // two ("Sockeye Salmon on Kiwi & Lemon Puree" and "Salmon on Kiwi &
            // Lemon Puree"). Comparing the sorted significant words catches these
            // without treating two genuinely different dishes as the same.
            const signature = (result.title || "")
                .toLowerCase()
                .split(/[^a-z]+/)
                .filter((w) => w.length > 2)
                .sort()
                .join(" ");
            if (seenTitles.has(signature)) continue;

            const suggestion = mapRecipeToSuggestion(
                result,
                suggestions.length,
                cleaned,
                cuisine,
                requestedServings
            );
            if (!suggestion) continue;

            seenTitles.add(signature);
            suggestions.push(suggestion);
        }

        if (suggestions.length > 0) writeCache(cacheKey, suggestions);
        return suggestions;
    } catch (error) {
        // Timeout, DNS failure, malformed JSON. Log and degrade.
        console.warn("[spoonacular] live recipe lookup failed:", error);
        return [];
    }
}
