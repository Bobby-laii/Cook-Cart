/** Small TheMealDB helpers that browser code needs; kept apart from the big data files. */

export const MEALDB_ID_PREFIX = "mealdb-";

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
