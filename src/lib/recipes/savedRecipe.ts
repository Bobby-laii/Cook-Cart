import type { DishSuggestion, RecipeIngredient, RecipeStep } from "@/types";

/**
 * Saved recipes keep their source in `tips` (the schema has no provenance column),
 * written as "Recipe source: <name> — <url>". These helpers write and read that line.
 */
const SOURCE_PREFIX = "Recipe source: ";
const SOURCE_SEPARATOR = " — ";

export function formatSourceTip(sourceName: string | undefined, sourceUrl: string): string {
  return `${SOURCE_PREFIX}${sourceName || sourceUrl}${SOURCE_SEPARATOR}${sourceUrl}`;
}

export function parseSourceTip(
  tips: string | null | undefined
): { sourceName?: string; sourceUrl?: string } {
  if (!tips || !tips.startsWith(SOURCE_PREFIX)) return {};
  const rest = tips.slice(SOURCE_PREFIX.length);
  const cut = rest.lastIndexOf(SOURCE_SEPARATOR);
  if (cut === -1) return {};
  const sourceName = rest.slice(0, cut).trim();
  const sourceUrl = rest.slice(cut + SOURCE_SEPARATOR.length).trim();
  if (!/^https?:\/\//i.test(sourceUrl)) return {};
  return { sourceName: sourceName || undefined, sourceUrl };
}

function parseJsonArray(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toIngredient(value: unknown): RecipeIngredient | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.name !== "string" || !v.name.trim()) return null;
  return {
    name: v.name,
    amount: typeof v.amount === "number" && Number.isFinite(v.amount) ? v.amount : 0,
    unit: typeof v.unit === "string" ? v.unit : "",
    ...(v.optional === true ? { optional: true } : {}),
  };
}

function toStep(value: unknown, index: number): RecipeStep | null {
  if (typeof value === "string") {
    return value.trim() ? { step: index + 1, title: `Step ${index + 1}`, text: value } : null;
  }
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.text !== "string" || !v.text.trim()) return null;
  return {
    step: index + 1,
    title: typeof v.title === "string" && v.title.trim() ? v.title : `Step ${index + 1}`,
    text: v.text,
    ...(typeof v.timerSeconds === "number" && v.timerSeconds > 0
      ? { timerSeconds: v.timerSeconds }
      : {}),
  };
}

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

export interface RecipeRow {
  id: string;
  title: string;
  cuisine: string;
  cookTimeMinutes: number;
  difficulty: string;
  servings: number;
  description: string;
  ingredients: string;
  extraIngredients: string;
  instructions: string;
  tips: string | null;
  imageUrl: string | null;
}

/**
 * Turns a stored Recipe row back into the dish the recipe and cooking pages render.
 *
 * Saves send `extraIngredients` as the amounts list and `ingredients` either as the
 * user's own ingredients (from a chat suggestion) or as the full list (from cooking
 * mode, which already includes the extras). Names that appear in both are counted once.
 */
export function recipeRowToDish(row: RecipeRow): DishSuggestion {
  const all = parseJsonArray(row.ingredients).map(toIngredient).filter(Boolean) as RecipeIngredient[];
  const extras = parseJsonArray(row.extraIngredients).map(toIngredient).filter(Boolean) as RecipeIngredient[];

  let extraIngredientsNeeded: RecipeIngredient[];
  let usedUserIngredients: string[];
  if (extras.length > 0) {
    const extraNames = new Set(extras.map((i) => i.name.toLowerCase()));
    extraIngredientsNeeded = extras;
    usedUserIngredients = all.filter((i) => !extraNames.has(i.name.toLowerCase())).map((i) => i.name);
  } else {
    // No separate extras list: keep the amounts by treating everything as the list.
    extraIngredientsNeeded = all;
    usedUserIngredients = [];
  }

  const steps = parseJsonArray(row.instructions)
    .map((s, i) => toStep(s, i))
    .filter(Boolean) as RecipeStep[];

  const difficulty = (DIFFICULTIES as readonly string[]).includes(row.difficulty)
    ? (row.difficulty as DishSuggestion["difficulty"])
    : "Easy";

  return {
    id: row.id,
    title: row.title,
    cuisine: row.cuisine,
    cookTimeMinutes: row.cookTimeMinutes,
    difficulty,
    servings: row.servings,
    description: row.description,
    usedUserIngredients,
    extraIngredientsNeeded,
    estimatedCostHkd: 0,
    availabilityNote: "",
    ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
    ...(steps.length > 0 ? { steps } : {}),
    ...parseSourceTip(row.tips),
  };
}
