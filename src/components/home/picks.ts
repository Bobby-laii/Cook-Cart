import { cuisineLabel } from "@/lib/recipes/cuisines";
import type { MenuDish } from "@/lib/recipes/mealdb";

export interface CravingQuizAnswers {
  pace: "quick" | "unhurried" | "hearty";
  style: "soupy" | "crispy" | "fresh";
  flavour: "umami" | "mediterranean" | "spiced" | "classic";
}

/** Small, fast, seedable PRNG (mulberry32). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The local calendar day, e.g. "2026-11-04". */
export function localDayKey(date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

const FLAVOUR_CUISINES: Record<CravingQuizAnswers["flavour"], string[]> = {
  umami: ["Chinese", "Japanese", "Thai", "Vietnamese", "Malaysian", "Filipino"],
  mediterranean: ["Italian", "French", "Greek", "Spanish", "Portuguese", "Croatian"],
  spiced: ["Indian", "Mexican", "Moroccan", "Turkish", "Jamaican", "Egyptian", "Tunisian", "Kenyan"],
  classic: ["British", "American", "Irish", "Canadian", "Polish", "Dutch", "Russian", "Ukrainian"],
};

const STYLE_PATTERNS: Record<CravingQuizAnswers["style"], RegExp> = {
  soupy: /\b(soup|stew|curry|brais|broth|noodle|ramen|laksa|tagine|chili|congee|chowder|sauce|simmer|pot|goulash|casserole)\b/i,
  crispy: /\b(fry|fried|sear|crisp|roast|grill|stir[- ]?fry|wok|pan|cutlet|tempura|katsu|schnitzel|taco|fajita|satay|cake)\b/i,
  fresh: /\b(salad|fish|salmon|prawn|shrimp|seafood|herb|lemon|lime|vegetable|vegan|vegetarian|Summer|roll|ceviche|pasta|light)\b/i,
};

const PACE_PATTERNS: Record<CravingQuizAnswers["pace"], RegExp> = {
  quick: /\b(quick|stir[- ]?fry|noodle|omelette|egg|pasta|prawn|shrimp|taco|wrap|pan|15|20|minute)\b/i,
  unhurried: /\b(brais|simmer|risotto|stew|curry|tagine|roast|bake|slow|broth|ragu)\b/i,
  hearty: /\b(beef|pork|lamb|chicken|pie|stew|potato|rice|pasta|curry|burger|steak|casserole|lasagne)\b/i,
};

export function scoreDishForQuiz(dish: MenuDish, quiz: CravingQuizAnswers): number {
  let score = 0;
  const text = `${dish.title} ${dish.description || ""} ${dish.cuisine}`;

  if (FLAVOUR_CUISINES[quiz.flavour]?.includes(dish.cuisine)) {
    score += 4;
  }
  if (STYLE_PATTERNS[quiz.style]?.test(text)) {
    score += 3;
  }
  if (PACE_PATTERNS[quiz.pace]?.test(text)) {
    score += 2;
  }
  if (quiz.pace === "quick" && !dish.needsOven) {
    score += 1;
  }
  return score;
}

export function formatQuizSummary(quiz: CravingQuizAnswers): string {
  const paceLabel: Record<CravingQuizAnswers["pace"], string> = {
    quick: "Quick & easy",
    unhurried: "Relaxed evening cook",
    hearty: "Hearty & filling",
  };
  const styleLabel: Record<CravingQuizAnswers["style"], string> = {
    soupy: "Warm & saucy",
    crispy: "Golden & seared",
    fresh: "Fresh & bright",
  };
  const flavourLabel: Record<CravingQuizAnswers["flavour"], string> = {
    umami: "Soy, ginger & garlic",
    mediterranean: "Herbs, tomato & olive oil",
    spiced: "Warm spices",
    classic: "Cozy comfort",
  };
  return `${paceLabel[quiz.pace]} · ${styleLabel[quiz.style]} · ${flavourLabel[quiz.flavour]}`;
}

/**
 * Three picks for tonight. Dishes that need an oven are left out when the kitchen has none.
 * When `quiz` answers are provided, picks are drawn from the dishes that best match the
 * cook's mood, texture craving, and flavour direction.
 */
export function pickTonight(
  dishes: MenuDish[],
  {
    day,
    round = 0,
    noOven = false,
    count = 3,
    quiz = null,
  }: {
    day: string;
    round?: number;
    noOven?: boolean;
    count?: number;
    quiz?: CravingQuizAnswers | null;
  }
): MenuDish[] {
  const basePool = dishes.filter((d) => !noOven || !d.needsOven);
  if (basePool.length === 0) return [];

  let pool = basePool;
  if (quiz) {
    const scored = basePool
      .map((dish) => ({ dish, score: scoreDishForQuiz(dish, quiz) }))
      .sort((a, b) => b.score - a.score);
    const strongMatches = scored.filter((item) => item.score >= 5).map((item) => item.dish);
    const goodMatches = scored.filter((item) => item.score >= 3).map((item) => item.dish);
    if (strongMatches.length >= count) {
      pool = strongMatches;
    } else if (goodMatches.length >= count) {
      pool = goodMatches;
    } else {
      pool = scored.slice(0, Math.max(count, Math.ceil(scored.length / 2))).map((item) => item.dish);
    }
  }

  const seedKey = quiz
    ? `${day}#${round}#${quiz.pace}-${quiz.style}-${quiz.flavour}`
    : `${day}#${round}`;
  const rand = mulberry32(hash(seedKey));
  const order = pool.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const picks: MenuDish[] = [];
  const cuisines = new Set<string>();
  for (const dish of order) {
    if (picks.length === count) break;
    if (cuisines.has(dish.cuisine)) continue;
    picks.push(dish);
    cuisines.add(dish.cuisine);
  }
  for (const dish of order) {
    if (picks.length === count) break;
    if (!picks.includes(dish)) picks.push(dish);
  }
  return picks;
}

/** Shuffle a full list of dishes deterministically from a seed so the menu grid varies on each visit. */
export function shuffleDishes(dishes: MenuDish[], seed: string): MenuDish[] {
  const rand = mulberry32(hash(seed));
  const copy = dishes.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** A short, honest line about a dish from what the menu knows: its cuisine and the oven. */
export function dishLine(dish: MenuDish): string {
  const cuisine = cuisineLabel(dish.cuisine);
  const article = /^[aeiou]/i.test(cuisine) ? "An" : "A";
  return dish.needsOven
    ? `${article} ${cuisine} dish, made in the oven`
    : `${article} ${cuisine} dish, no oven needed`;
}
