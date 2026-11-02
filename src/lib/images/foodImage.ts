/**
 * Free food photography for dish suggestions — no signup, no API key, no billing.
 *
 * Provider order:
 *   1. TheMealDB  (https://www.themealdb.com)  — real dish photos, keyless, fast.
 *      The public docs use the literal test key "1", which is why no signup is needed.
 *   2. Pollinations (https://pollinations.ai)  — keyless AI image generation, but
 *      slow (seconds per image) and best-effort. Only used when
 *      ENABLE_AI_IMAGES="true", because a slow provider in the critical path is
 *      worse than a good stock photo.
 *   3. Curated Unsplash stock — always available, keeps the UI from showing holes.
 *
 * Every function here returns a usable URL and never throws. A missing photo must
 * degrade to a stock image, never to a broken card or a 500.
 */

const MEALDB_SEARCH = "https://www.themealdb.com/api/json/v1/1/search.php?s=";

/** Real food photos, used when no provider has a match. */
const STATIC_FOOD_PHOTOS = [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
];

/**
 * Process-wide cache. Module scope survives across requests in a long-lived Node
 * server, so a repeated dish title costs zero provider calls. Bounded to keep a
 * hostile client from growing it without limit by sending unique titles.
 */
const imageCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 500;

/**
 * Style, cuisine and cooking-method words. These appear at the front of every
 * generated title and would otherwise dominate the search query — searching
 * "cantonese wok" finds nothing, while "chicken thighs" finds a dish.
 */
const TITLE_NOISE = new Set([
    "with", "and", "the", "of", "using", "style", "homestyle", "home", "quick",
    "easy", "bowl", "dish", "fresh", "savory", "savoury", "nourishing",
    "comforting", "classic", "simple", "hong", "kong", "hk", "cafe", "wok",
    "saute", "stir", "fry", "fried", "braised", "braise", "claypot", "pot",
    "steamed", "steam", "roasted", "roast", "grilled", "grill", "noodle",
    "noodles", "broth", "soup", "rice", "cantonese", "sichuan", "shanghainese",
    "taiwanese", "japanese", "korean", "thai", "vietnamese", "indian", "western",
    "italian", "french", "mexican", "mediterranean",
]);

/** Words that separate a title's descriptive half from its actual ingredients. */
const INGREDIENT_DELIMITERS = new Set(["of", "with", "using"]);

function meaningfulWords(text: string): string[] {
    return text
        // Strip accents so "sauté" becomes "saute" instead of being cut to "saut".
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !TITLE_NOISE.has(w));
}

/**
 * Convert a generated title into ranked search queries.
 *
 * Generated titles follow "<style> <cuisine> <method> of/with <ingredients>",
 * e.g. "Homestyle Cantonese Wok Sauté of Chicken Thighs & Bok Choy". The useful
 * part is what follows the delimiter, so that is tried first; the trailing pair
 * before the delimiter is the next best guess (usually the protein).
 *
 * A naive "first two words" approach was tried and it searched for the cuisine
 * instead of the food, which silently degraded every dish to a stock photo.
 */
export function toSearchTerms(title: string): string[] {
    const raw = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .split(/\s+/);

    const delimiterAt = raw.findIndex((w) => INGREDIENT_DELIMITERS.has(w));

    // No delimiter means the title is just a dish name ("Chicken Teriyaki
    // Donburi"), so the leading words are the most specific thing available.
    if (delimiterAt < 0) {
        const words = meaningfulWords(raw.join(" "));
        const candidates: string[] = [];
        if (words.length >= 2) candidates.push(words.slice(0, 2).join(" "));
        if (words.length >= 1) candidates.push(words[0]);
        return Array.from(new Set(candidates)).slice(0, 3);
    }

    const afterWords = meaningfulWords(raw.slice(delimiterAt + 1).join(" "));
    const beforeWords = meaningfulWords(raw.slice(0, delimiterAt).join(" "));

    // Priority is deliberate:
    //   1. A two-word pair after the delimiter    -> "chicken thighs"
    //   2. The last two words before it           -> the protein, e.g. "salmon fillet"
    //   3. Single words, which are weak searches  -> "asparagus"
    // Promoting a one-word vegetable like "asparagus" above the protein returns a
    // photo of asparagus rather than of the dish, so pairs always outrank singles.
    const candidates: string[] = [];
    if (afterWords.length >= 2) candidates.push(afterWords.slice(0, 2).join(" "));
    if (beforeWords.length >= 2) candidates.push(beforeWords.slice(-2).join(" "));
    if (afterWords.length >= 1) candidates.push(afterWords[0]);
    if (beforeWords.length >= 1) candidates.push(beforeWords[beforeWords.length - 1]);

    // Dedupe while preserving priority, and cap provider calls per dish.
    return Array.from(new Set(candidates)).slice(0, 3);
}

/** Stable hash so the same dish always gets the same generated image. */
function hashSeed(input: string): number {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
        h = (h << 5) - h + input.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

/** Build (do not fetch) a Pollinations URL — the browser loads it directly. */
export function pollinationsImageUrl(title: string): string {
    const prompt = `${title}, professional food photography, natural window light, shallow depth of field, appetising, overhead angle`;
    const seed = hashSeed(title) % 100000;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${seed}`;
}

async function lookupMealDb(term: string): Promise<string | null> {
    try {
        const res = await fetch(`${MEALDB_SEARCH}${encodeURIComponent(term)}`, {
            // Cache the upstream response for a day; dish photos do not change.
            next: { revalidate: 86400 },
            signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) return null;

        const data = (await res.json()) as { meals?: Array<{ strMealThumb?: string }> };
        const thumb = data.meals?.[0]?.strMealThumb;
        // TheMealDB serves "/images/..." paths on some entries; normalise to absolute.
        if (!thumb) return null;
        return thumb.startsWith("http") ? thumb : `https://www.themealdb.com/${thumb.replace(/^\//, "")}`;
    } catch {
        // Timeout, DNS failure, provider outage — all mean "no photo from here".
        return null;
    }
}

/**
 * Resolve one dish photo. Tries each ranked term in turn, then falls back.
 *
 * `avoid` lets a caller suppress photos already used by its siblings: three
 * dishes built around salmon would otherwise all resolve to the same stock
 * photo of salmon, which looks like a rendering bug. `index` only affects which
 * stock photo is chosen, so a list with no provider matches still looks varied.
 */
export async function resolveDishImageUrl(
    title: string,
    index = 0,
    avoid: ReadonlySet<string> = new Set()
): Promise<string> {
    const cacheKey = title.toLowerCase().trim();
    const cached = imageCache.get(cacheKey);
    if (cached && !avoid.has(cached)) return cached;

    for (const term of toSearchTerms(title)) {
        const hit = await lookupMealDb(term);
        if (hit && !avoid.has(hit)) {
            setCache(cacheKey, hit);
            return hit;
        }
    }

    const fallback =
        process.env.ENABLE_AI_IMAGES === "true"
            ? pollinationsImageUrl(title)
            : STATIC_FOOD_PHOTOS[index % STATIC_FOOD_PHOTOS.length];

    setCache(cacheKey, fallback);
    return fallback;
}

function setCache(key: string, url: string): void {
    if (imageCache.size >= MAX_CACHE_ENTRIES) {
        // Drop the oldest entry; insertion order is preserved by Map.
        const oldest = imageCache.keys().next().value;
        if (oldest !== undefined) imageCache.delete(oldest);
    }
    imageCache.set(key, url);
}
