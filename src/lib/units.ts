/**
 * Metric / US unit conversion for recipes from anywhere in the world.
 *
 * Recipe sources mix systems freely ("3/4 cup soy sauce", "200g flour", "350° F"),
 * so the cook picks one system and amounts are converted to it. Spoons (tbsp, tsp)
 * are the same in both systems and are left alone, as are counts ("2 eggs") and
 * anything this file does not recognise ("1 (12 oz.) bag"), which is shown as written
 * rather than guessed at.
 */

export type UnitSystem = "metric" | "us";

const CUP_ML = 240;
const OZ_G = 28.35;
const LB_G = 453.6;
const FL_OZ_ML = 29.57;

/** Canonical unit for each spelling seen in recipe data. */
const ALIASES: Record<string, string> = {
    cup: "cup", cups: "cup", c: "cup",
    oz: "oz", ounce: "oz", ounces: "oz",
    lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
    "fl oz": "floz", "fluid ounce": "floz", "fluid ounces": "floz",
    pint: "pint", pints: "pint",
    quart: "quart", quarts: "quart",
    g: "g", gr: "g", gm: "g", gram: "g", grams: "g",
    kg: "kg", kilo: "kg", kilos: "kg", kilogram: "kg", kilograms: "kg",
    ml: "ml", millilitre: "ml", millilitres: "ml", milliliter: "ml", milliliters: "ml",
    l: "l", litre: "l", litres: "l", liter: "l", liters: "l",
};

function canonical(unit: string): string | undefined {
    return ALIASES[unit.trim().toLowerCase().replace(/\.$/, "")];
}

export function convertAmount(
    amount: number,
    unit: string,
    system: UnitSystem
): { amount: number; unit: string } {
    const u = canonical(unit);
    if (!u) return { amount, unit };

    if (system === "metric") {
        if (u === "cup") return volumeMl(amount * CUP_ML);
        if (u === "floz") return volumeMl(amount * FL_OZ_ML);
        if (u === "pint") return volumeMl(amount * 473);
        if (u === "quart") return volumeMl(amount * 946);
        if (u === "oz") return massG(amount * OZ_G);
        if (u === "lb") return massG(amount * LB_G);
        return { amount, unit };
    }

    if (u === "g") return massOz(amount / OZ_G);
    if (u === "kg") return massOz((amount * 1000) / OZ_G);
    if (u === "ml") return volumeUs(amount);
    if (u === "l") return volumeUs(amount * 1000);
    return { amount, unit };
}

function volumeMl(ml: number) {
    return ml >= 1000 ? { amount: round(ml / 1000, 2), unit: "l" } : { amount: roundTo(ml, 5), unit: "ml" };
}

function massG(g: number) {
    return g >= 1000 ? { amount: round(g / 1000, 2), unit: "kg" } : { amount: roundTo(g, 5), unit: "g" };
}

function massOz(oz: number) {
    return oz >= 16 ? { amount: round(oz / 16, 2), unit: "lb" } : { amount: round(oz, 1), unit: "oz" };
}

/** Small volumes read better in spoons than as a sliver of a cup. */
function volumeUs(ml: number) {
    if (ml < 15) return { amount: round(ml / 5, 1), unit: "tsp" };
    if (ml < 60) return { amount: round(ml / 15, 1), unit: "tbsp" };
    return { amount: round(ml / CUP_ML, 2), unit: "cup" };
}

function round(value: number, places: number): number {
    const f = 10 ** places;
    return Math.round(value * f) / f;
}

function roundTo(value: number, step: number): number {
    return Math.max(step, Math.round(value / step) * step);
}

/**
 * Rewrite oven and oil temperatures inside step text, e.g. "Preheat oven to 350° F"
 * becomes "Preheat oven to 175°C" for a metric cook. Rounded to 5 degrees, the way
 * oven dials are marked.
 */
export function convertTemperatures(text: string, system: UnitSystem): string {
    return text.replace(
        /(\d{2,3})\s*(?:°|º|degrees?)\s*([FC])\b/gi,
        (match, value: string, scale: string) => {
            const from = scale.toUpperCase();
            const target = system === "metric" ? "C" : "F";
            if (from === target) return match;
            const n = parseInt(value, 10);
            const converted = from === "F" ? ((n - 32) * 5) / 9 : (n * 9) / 5 + 32;
            return `${Math.round(converted / 5) * 5}°${target}`;
        }
    );
}

/** A first guess before the cook chooses: US-style locales get cups and °F. */
export function defaultUnitSystem(locale: string | undefined): UnitSystem {
    return locale && /^en-US$/i.test(locale) ? "us" : "metric";
}

/**
 * One short spelling for each unit a recipe source might write ("Tablespoons",
 * "tbs", "teaspoon", "grams" ...). Count words ("cloves", "slices") come back in
 * the singular; formatQuantity puts the plural back for display.
 */
const SHORT_UNITS: Record<string, string> = {
    teaspoon: "tsp", teaspoons: "tsp", tsp: "tsp", tsps: "tsp", tspn: "tsp",
    tablespoon: "tbsp", tablespoons: "tbsp", tbsp: "tbsp", tbsps: "tbsp", tbs: "tbsp", tbls: "tbsp", tblsp: "tbsp",
    cup: "cup", cups: "cup",
    g: "g", gr: "g", gm: "g", gms: "g", gram: "g", grams: "g", gramme: "g", grammes: "g",
    kg: "kg", kgs: "kg", kilo: "kg", kilos: "kg", kilogram: "kg", kilograms: "kg",
    ml: "ml", mls: "ml", millilitre: "ml", millilitres: "ml", milliliter: "ml", milliliters: "ml",
    l: "l", litre: "l", litres: "l", liter: "l", liters: "l", ltr: "l",
    lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
    oz: "oz", ounce: "oz", ounces: "oz",
    clove: "clove", cloves: "clove",
    slice: "slice", slices: "slice",
    can: "can", cans: "can", tin: "tin", tins: "tin",
    piece: "piece", pieces: "piece",
    sprig: "sprig", sprigs: "sprig",
    stalk: "stalk", stalks: "stalk",
    stick: "stick", sticks: "stick",
    bunch: "bunch", bunches: "bunch",
    handful: "handful", handfuls: "handful",
    pinch: "pinch", pinches: "pinch",
    dash: "dash", dashes: "dash",
    leaf: "leaf", leaves: "leaf",
};

const PLURALS: Record<string, string> = {
    cup: "cups", clove: "cloves", slice: "slices", can: "cans", tin: "tins", piece: "pieces",
    sprig: "sprigs", stalk: "stalks", stick: "sticks", bunch: "bunches", handful: "handfuls",
    pinch: "pinches", dash: "dashes", leaf: "leaves",
};

/** The short form of a known unit word, or undefined for anything else ("large", "(12 oz.)"). */
export function shortUnit(word: string): string | undefined {
    return SHORT_UNITS[word.trim().toLowerCase().replace(/\.$/, "")];
}

const METRIC = new Set(["g", "kg", "ml", "l"]);

/** Kitchen fractions an amount is rounded to; nobody measures 0.13 of a teaspoon. */
const FRACTIONS: [number, string][] = [
    [0, ""],
    [1 / 8, "⅛"],
    [1 / 4, "¼"],
    [1 / 3, "⅓"],
    [1 / 2, "½"],
    [2 / 3, "⅔"],
    [3 / 4, "¾"],
    [1, ""],
];

/**
 * An amount as a cook reads it: 0.125 → "⅛", 2.5 → "2½", 0.13 → "⅛".
 * Metric weights and volumes stay decimal (1.4 kg, 250 g) since scales and jugs
 * read that way; everything else snaps to the nearest kitchen fraction. A positive
 * amount never shows as 0, and nothing ever shows more than one decimal.
 */
export function formatAmount(value: number, unit = ""): string {
    if (!Number.isFinite(value) || value <= 0) return "";
    if (METRIC.has(unit)) {
        if (value >= 10) return String(Math.round(value));
        return String(Math.max(0.1, Math.round(value * 10) / 10));
    }
    let whole = Math.floor(value);
    const rest = value - whole;
    // Past 10 of something, a third of a spoon no longer matters; keep halves only.
    const options = whole >= 10 ? FRACTIONS.filter(([f]) => f === 0 || f === 0.5 || f === 1) : FRACTIONS;
    let [f, glyph] = options.reduce((best, cur) => (Math.abs(cur[0] - rest) < Math.abs(best[0] - rest) ? cur : best));
    if (f === 1) whole += 1;
    if (whole === 0 && f === 0) [f, glyph] = FRACTIONS[1];
    return `${whole || ""}${glyph}` || "0";
}

/**
 * "2 cloves", "1½ tbsp", "250 g". An amount of 0 means the source gave no quantity
 * ("to taste"), so only the unit text (if any) is shown.
 */
export function formatQuantity(amount: number, unit: string): string {
    if (!(amount > 0)) return unit.trim();
    const text = formatAmount(amount, unit);
    // "½ cup" and "1 cup" read singular; "1½ cups" and "2 cups" plural.
    const single = text === "1" || !/^\d/.test(text);
    const plural = !single && PLURALS[unit] ? PLURALS[unit] : unit;
    // A lone lowercase "l" reads as a 1 ("1.9 l"); litres are shown as "L".
    return `${text} ${plural === "l" ? "L" : plural}`.trim();
}
