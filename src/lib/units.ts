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
