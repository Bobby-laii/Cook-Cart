/**
 * Cuisines shown on the menu, in display order: the original Asia-first set, then
 * every other TheMealDB area with dishes, largest first (checked 2026-11-04).
 *
 * `area` must be the exact string filter.php accepts. TheMealDB's list.php names
 * every area as a demonym ("Indian", "French", "American", "Dutch"), but some
 * dishes are filed under the country name instead, and only that spelling returns
 * them: "India", "France", "United States", "Netherlands", "Norway", "Argentina",
 * "Venezuela", "Slovakia". The 190 dishes filed under "Unknown" are left out.
 */
export const MENU_CUISINES = [
    { area: "Chinese" },
    { area: "Thai" },
    { area: "Vietnamese" },
    { area: "Japanese" },
    { area: "Malaysian" },
    { area: "Filipino" },
    { area: "India" },
    { area: "Italian" },
    { area: "Spanish" },
    { area: "France" },
    { area: "Greek" },
    { area: "British" },
    { area: "Mexican" },
    { area: "United States" },
    { area: "Turkish" },
    { area: "Jamaican" },
    { area: "Polish" },
    { area: "Canadian" },
    { area: "Netherlands" },
    { area: "Norway" },
    { area: "Australian" },
    { area: "Algerian" },
    { area: "Saudi Arabian" },
    { area: "Argentina" },
    { area: "Venezuela" },
    { area: "Uruguayan" },
    { area: "Croatian" },
    { area: "Egyptian" },
    { area: "Irish" },
    { area: "Portuguese" },
    { area: "Tunisian" },
    { area: "Russian" },
    { area: "Ukrainian" },
    { area: "Moroccan" },
    { area: "Syrian" },
    { area: "Kenyan" },
    { area: "Slovakia" },
] as const;

/**
 * The name people expect on a chip or card. TheMealDB files some dishes under a
 * country ("India") rather than the cuisine ("Indian").
 */
const CUISINE_LABELS: Record<string, string> = {
    India: "Indian",
    France: "French",
    "United States": "American",
    Netherlands: "Dutch",
    Norway: "Norwegian",
    Argentina: "Argentinian",
    Venezuela: "Venezuelan",
    Slovakia: "Slovak",
    Unknown: "World",
};

export function cuisineLabel(area: string): string {
    return CUISINE_LABELS[area] ?? area;
}
