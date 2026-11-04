/**
 * Regional Distinctive Ingredients Configuration
 *
 * Backed by the authoritative benchmark:
 * "Top 50 Distinctive European Ingredients — Master Cross-File Usage & Ranking Summary"
 * Consolidated across Recipe Frequency, Home Cook Penetration, Household Specialty,
 * and Signature Recipe datasets (excluding universal basics like table salt & white sugar).
 */

export interface RegionalIngredientItem {
  id: string;
  en: string;
  rank?: number;
  consolidatedUsagePct?: number;
  peakUsagePct?: number;
  associatedRegions: string[];
  category:
    | "dairy_fat"
    | "fat_oil"
    | "aged_cheese"
    | "fresh_cheese"
    | "brined_cheese"
    | "semi_hard_cheese"
    | "herb"
    | "fruit_acid"
    | "condiment"
    | "grain_starch"
    | "cooking_wine"
    | "cured_meat"
    | "cured_sausage"
    | "legume"
    | "vegetable"
    | "allium"
    | "seafood"
    | "spice";
}

/**
 * The Top 50 Distinctive European Ingredients dataset
 * Extracted directly from the definitive European Culinary Cross-Dataset Benchmark.
 */
export const TOP_50_EUROPEAN_INGREDIENTS: RegionalIngredientItem[] = [
  {
    id: "butter",
    en: "Butter",
    rank: 1,
    consolidatedUsagePct: 64.4,
    peakUsagePct: 84.0,
    associatedRegions: ["europe", "western", "france", "uk", "british", "germany", "central_europe"],
    category: "dairy_fat",
  },
  {
    id: "olive-oil",
    en: "Extra-Virgin Olive Oil",
    rank: 2,
    consolidatedUsagePct: 52.7,
    peakUsagePct: 85.0,
    associatedRegions: ["europe", "western", "mediterranean", "italy", "spain", "greece"],
    category: "fat_oil",
  },
  {
    id: "parmesan",
    en: "Parmigiano-Reggiano",
    rank: 3,
    consolidatedUsagePct: 38.2,
    peakUsagePct: 65.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "aged_cheese",
  },
  {
    id: "pesto",
    en: "Pesto Genovese",
    rank: 4,
    consolidatedUsagePct: 35.0,
    peakUsagePct: 35.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "condiment",
  },
  {
    id: "parsley",
    en: "Flat-Leaf Parsley",
    rank: 5,
    consolidatedUsagePct: 34.8,
    peakUsagePct: 70.0,
    associatedRegions: ["europe", "western", "france", "italy", "spain", "uk", "british"],
    category: "herb",
  },
  {
    id: "pasta",
    en: "Semolina Pasta",
    rank: 6,
    consolidatedUsagePct: 31.6,
    peakUsagePct: 60.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "grain_starch",
  },
  {
    id: "thyme",
    en: "Fresh Thyme",
    rank: 7,
    consolidatedUsagePct: 29.5,
    peakUsagePct: 65.0,
    associatedRegions: ["europe", "western", "france", "mediterranean", "spain", "uk", "british"],
    category: "herb",
  },
  {
    id: "bay-leaves",
    en: "Bay Leaves",
    rank: 8,
    consolidatedUsagePct: 28.5,
    peakUsagePct: 62.0,
    associatedRegions: ["europe", "western", "france", "italy", "spain", "uk", "british"],
    category: "herb",
  },
  {
    id: "lemon",
    en: "Lemon",
    rank: 9,
    consolidatedUsagePct: 27.8,
    peakUsagePct: 39.0,
    associatedRegions: ["europe", "western", "mediterranean", "italy", "spain", "greece"],
    category: "fruit_acid",
  },
  {
    id: "feta",
    en: "Feta Cheese",
    rank: 10,
    consolidatedUsagePct: 27.2,
    peakUsagePct: 40.0,
    associatedRegions: ["europe", "western", "greece", "mediterranean"],
    category: "brined_cheese",
  },
  {
    id: "dijon-mustard",
    en: "Dijon Mustard",
    rank: 11,
    consolidatedUsagePct: 26.2,
    peakUsagePct: 49.0,
    associatedRegions: ["europe", "western", "france"],
    category: "condiment",
  },
  {
    id: "gouda",
    en: "Gouda Cheese",
    rank: 12,
    consolidatedUsagePct: 25.0,
    peakUsagePct: 25.0,
    associatedRegions: ["europe", "western", "netherlands", "central_europe"],
    category: "semi_hard_cheese",
  },
  {
    id: "gnocchi",
    en: "Gnocchi",
    rank: 13,
    consolidatedUsagePct: 25.0,
    peakUsagePct: 25.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "grain_starch",
  },
  {
    id: "basil",
    en: "Fresh Basil",
    rank: 14,
    consolidatedUsagePct: 24.1,
    peakUsagePct: 56.0,
    associatedRegions: ["europe", "western", "italy", "mediterranean"],
    category: "herb",
  },
  {
    id: "white-wine",
    en: "White Wine",
    rank: 15,
    consolidatedUsagePct: 23.4,
    peakUsagePct: 46.0,
    associatedRegions: ["europe", "western", "france", "italy", "spain"],
    category: "cooking_wine",
  },
  {
    id: "oregano",
    en: "Oregano",
    rank: 16,
    consolidatedUsagePct: 23.1,
    peakUsagePct: 54.0,
    associatedRegions: ["europe", "western", "italy", "greece", "mediterranean"],
    category: "herb",
  },
  {
    id: "mozzarella",
    en: "Mozzarella",
    rank: 17,
    consolidatedUsagePct: 22.8,
    peakUsagePct: 45.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "fresh_cheese",
  },
  {
    id: "rosemary",
    en: "Rosemary",
    rank: 18,
    consolidatedUsagePct: 22.4,
    peakUsagePct: 53.0,
    associatedRegions: ["europe", "western", "italy", "france", "mediterranean", "spain"],
    category: "herb",
  },
  {
    id: "cannellini-beans",
    en: "Cannellini Beans",
    rank: 19,
    consolidatedUsagePct: 21.0,
    peakUsagePct: 21.0,
    associatedRegions: ["europe", "western", "italy", "spain"],
    category: "legume",
  },
  {
    id: "red-wine",
    en: "Red Wine",
    rank: 20,
    consolidatedUsagePct: 20.7,
    peakUsagePct: 47.0,
    associatedRegions: ["europe", "western", "france", "italy", "spain"],
    category: "cooking_wine",
  },
  {
    id: "cheddar",
    en: "Cheddar Cheese",
    rank: 21,
    consolidatedUsagePct: 20.7,
    peakUsagePct: 33.0,
    associatedRegions: ["europe", "western", "uk", "british"],
    category: "aged_cheese",
  },
  {
    id: "chorizo",
    en: "Spanish Chorizo",
    rank: 22,
    consolidatedUsagePct: 20.3,
    peakUsagePct: 30.0,
    associatedRegions: ["europe", "western", "spain"],
    category: "cured_sausage",
  },
  {
    id: "prosciutto",
    en: "Prosciutto di Parma",
    rank: 23,
    consolidatedUsagePct: 20.2,
    peakUsagePct: 45.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "cured_meat",
  },
  {
    id: "sourdough",
    en: "Sourdough Bread",
    rank: 24,
    consolidatedUsagePct: 20.0,
    peakUsagePct: 20.0,
    associatedRegions: ["europe", "western", "france", "uk", "british", "germany"],
    category: "grain_starch",
  },
  {
    id: "goat-cheese",
    en: "Goat Cheese",
    rank: 25,
    consolidatedUsagePct: 20.0,
    peakUsagePct: 20.0,
    associatedRegions: ["europe", "western", "france", "mediterranean"],
    category: "fresh_cheese",
  },
  {
    id: "gruyere",
    en: "Gruyère Cheese",
    rank: 26,
    consolidatedUsagePct: 19.7,
    peakUsagePct: 32.0,
    associatedRegions: ["europe", "western", "france", "switzerland", "central_europe"],
    category: "semi_hard_cheese",
  },
  {
    id: "wine-vinegar",
    en: "Wine Vinegar",
    rank: 27,
    consolidatedUsagePct: 18.7,
    peakUsagePct: 27.0,
    associatedRegions: ["europe", "western", "france", "spain", "italy"],
    category: "condiment",
  },
  {
    id: "leeks",
    en: "Leeks",
    rank: 28,
    consolidatedUsagePct: 18.2,
    peakUsagePct: 44.0,
    associatedRegions: ["europe", "western", "france", "uk", "british"],
    category: "allium",
  },
  {
    id: "shallots",
    en: "Shallots",
    rank: 29,
    consolidatedUsagePct: 18.1,
    peakUsagePct: 42.0,
    associatedRegions: ["europe", "western", "france"],
    category: "allium",
  },
  {
    id: "lentils",
    en: "Green Lentils",
    rank: 30,
    consolidatedUsagePct: 18.0,
    peakUsagePct: 18.0,
    associatedRegions: ["europe", "western", "france"],
    category: "legume",
  },
  {
    id: "chickpeas",
    en: "Chickpeas",
    rank: 31,
    consolidatedUsagePct: 18.0,
    peakUsagePct: 18.0,
    associatedRegions: ["europe", "western", "spain", "italy", "mediterranean"],
    category: "legume",
  },
  {
    id: "brie-camembert",
    en: "Brie Cheese",
    rank: 32,
    consolidatedUsagePct: 17.3,
    peakUsagePct: 27.0,
    associatedRegions: ["europe", "western", "france"],
    category: "fresh_cheese",
  },
  {
    id: "creme-fraiche",
    en: "Crème Fraîche",
    rank: 33,
    consolidatedUsagePct: 17.0,
    peakUsagePct: 27.0,
    associatedRegions: ["europe", "western", "france"],
    category: "dairy_fat",
  },
  {
    id: "pecorino",
    en: "Pecorino Romano",
    rank: 34,
    consolidatedUsagePct: 16.8,
    peakUsagePct: 25.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "aged_cheese",
  },
  {
    id: "pancetta",
    en: "Pancetta",
    rank: 35,
    consolidatedUsagePct: 16.8,
    peakUsagePct: 30.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "cured_meat",
  },
  {
    id: "balsamic-vinegar",
    en: "Balsamic Vinegar of Modena",
    rank: 36,
    consolidatedUsagePct: 16.4,
    peakUsagePct: 32.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "condiment",
  },
  {
    id: "chives",
    en: "Fresh Chives",
    rank: 37,
    consolidatedUsagePct: 15.7,
    peakUsagePct: 41.0,
    associatedRegions: ["europe", "western", "france", "germany"],
    category: "herb",
  },
  {
    id: "dill",
    en: "Fresh Dill",
    rank: 38,
    consolidatedUsagePct: 15.5,
    peakUsagePct: 40.0,
    associatedRegions: ["europe", "western", "germany", "central_europe", "eastern_europe"],
    category: "herb",
  },
  {
    id: "salami",
    en: "Salami",
    rank: 39,
    consolidatedUsagePct: 15.5,
    peakUsagePct: 20.0,
    associatedRegions: ["europe", "western", "italy", "germany"],
    category: "cured_sausage",
  },
  {
    id: "anchovies",
    en: "Anchovies",
    rank: 40,
    consolidatedUsagePct: 14.9,
    peakUsagePct: 36.0,
    associatedRegions: ["europe", "western", "mediterranean", "italy", "spain"],
    category: "seafood",
  },
  {
    id: "capers",
    en: "Capers",
    rank: 41,
    consolidatedUsagePct: 14.4,
    peakUsagePct: 37.0,
    associatedRegions: ["europe", "western", "mediterranean", "italy", "spain", "greece"],
    category: "condiment",
  },
  {
    id: "ricotta",
    en: "Ricotta",
    rank: 42,
    consolidatedUsagePct: 13.9,
    peakUsagePct: 26.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "fresh_cheese",
  },
  {
    id: "mascarpone",
    en: "Mascarpone",
    rank: 43,
    consolidatedUsagePct: 12.8,
    peakUsagePct: 26.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "fresh_cheese",
  },
  {
    id: "blue-cheese",
    en: "Blue Cheese",
    rank: 44,
    consolidatedUsagePct: 12.6,
    peakUsagePct: 25.0,
    associatedRegions: ["europe", "western", "france", "italy"],
    category: "aged_cheese",
  },
  {
    id: "emmental",
    en: "Emmental Cheese",
    rank: 45,
    consolidatedUsagePct: 11.7,
    peakUsagePct: 24.0,
    associatedRegions: ["europe", "western", "switzerland", "central_europe"],
    category: "semi_hard_cheese",
  },
  {
    id: "beetroot",
    en: "Beetroot",
    rank: 46,
    consolidatedUsagePct: 11.7,
    peakUsagePct: 22.0,
    associatedRegions: ["europe", "western", "eastern_europe"],
    category: "vegetable",
  },
  {
    id: "sour-cream",
    en: "Sour Cream",
    rank: 47,
    consolidatedUsagePct: 10.4,
    peakUsagePct: 22.0,
    associatedRegions: ["europe", "western", "germany", "central_europe", "eastern_europe"],
    category: "dairy_fat",
  },
  {
    id: "sauerkraut",
    en: "Sauerkraut",
    rank: 48,
    consolidatedUsagePct: 10.1,
    peakUsagePct: 18.0,
    associatedRegions: ["europe", "western", "germany", "central_europe"],
    category: "vegetable",
  },
  {
    id: "horseradish",
    en: "Horseradish",
    rank: 49,
    consolidatedUsagePct: 10.2,
    peakUsagePct: 17.0,
    associatedRegions: ["europe", "western", "germany", "eastern_europe"],
    category: "spice",
  },
  {
    id: "caraway-seeds",
    en: "Caraway Seeds",
    rank: 50,
    consolidatedUsagePct: 10.0,
    peakUsagePct: 16.0,
    associatedRegions: ["europe", "western", "germany", "central_europe"],
    category: "spice",
  },
];

/**
 * Known European cuisines/regions.
 */
export const EUROPEAN_CUISINE_IDS = new Set([
  "europe",
  "western",
  "italian",
  "italy",
  "french",
  "france",
  "spanish",
  "spain",
  "mediterranean",
  "greek",
  "greece",
  "british",
  "uk",
  "german",
  "germany",
]);

/**
 * Checks if a cuisine id represents a European country or Western cuisine.
 */
export function isEuropeanCuisine(cuisineId: string): boolean {
  if (!cuisineId) return false;
  const normalized = cuisineId.trim().toLowerCase();
  if (EUROPEAN_CUISINE_IDS.has(normalized)) return true;
  return (
    normalized.includes("west") ||
    normalized.includes("ital") ||
    normalized.includes("french") ||
    normalized.includes("span") ||
    normalized.includes("mediter") ||
    normalized.includes("greek") ||
    normalized.includes("brit") ||
    normalized.includes("germ") ||
    normalized.includes("euro")
  );
}

/**
 * Regional ingredient mappings for non-European cuisines.
 */
const NON_EUROPEAN_REGIONAL_INGREDIENTS: Record<string, { en: string }[]> = {
  cantonese: [
    { en: "Chicken Thighs" },
    { en: "Bok Choy" },
    { en: "Fresh Eggs" },
    { en: "Firm Tofu" },
    { en: "Pork Belly" },
    { en: "Sliced Beef" },
    { en: "Shiitake Mushrooms" },
    { en: "Garlic" },
    { en: "Ginger" },
    { en: "Spring Onions" },
    { en: "Tomatoes" },
  ],
  asian: [
    { en: "Chicken Thighs" },
    { en: "Bok Choy" },
    { en: "Fresh Eggs" },
    { en: "Firm Tofu" },
    { en: "Pork Belly" },
    { en: "Sliced Beef" },
    { en: "Garlic" },
    { en: "Ginger" },
    { en: "Spring Onions" },
    { en: "Jasmine White Rice" },
    { en: "Fresh Prawns" },
    { en: "Shiitake Mushrooms" },
  ],
  sichuan: [
    { en: "Sliced Beef" },
    { en: "Firm Tofu" },
    { en: "Pork Belly" },
    { en: "Bean Sprouts" },
    { en: "Garlic" },
    { en: "Ginger" },
    { en: "Spring Onions" },
    { en: "Shiitake Mushrooms" },
    { en: "Chinese Cabbage" },
    { en: "Chicken Thighs" },
    { en: "Cucumber" },
    { en: "Fresh Eggs" },
  ],
  japanese: [
    { en: "Salmon Fillet" },
    { en: "Japanese Udon" },
    { en: "Fresh Eggs" },
    { en: "Firm Tofu" },
    { en: "Shiitake Mushrooms" },
    { en: "Sliced Beef" },
    { en: "Spring Onions" },
    { en: "Chicken Thighs" },
    { en: "Cucumber" },
    { en: "Carrots" },
    { en: "Enoki Mushrooms" },
    { en: "Cod Fish Fillet" },
  ],
  korean: [
    { en: "Pork Belly" },
    { en: "Sliced Beef" },
    { en: "Firm Tofu" },
    { en: "Fresh Eggs" },
    { en: "Spring Onions" },
    { en: "Garlic" },
    { en: "Enoki Mushrooms" },
    { en: "Chinese Cabbage" },
    { en: "Chicken Thighs" },
    { en: "Bean Sprouts" },
    { en: "Zucchini" },
    { en: "Yellow Onions" },
  ],
  thai: [
    { en: "Fresh Prawns" },
    { en: "Chicken Thighs" },
    { en: "Tomatoes" },
    { en: "Garlic" },
    { en: "Spring Onions" },
    { en: "Squid" },
    { en: "Fresh Coriander" },
    { en: "Firm Tofu" },
    { en: "Bean Sprouts" },
    { en: "Jasmine White Rice" },
    { en: "Pork Belly" },
    { en: "Eggplant" },
  ],
  vietnamese: [
    { en: "Sliced Beef" },
    { en: "Rice Vermicelli" },
    { en: "Fresh Prawns" },
    { en: "Bean Sprouts" },
    { en: "Fresh Coriander" },
    { en: "Cucumber" },
    { en: "Pork Belly" },
    { en: "Carrots" },
    { en: "Spring Onions" },
    { en: "Chicken Thighs" },
    { en: "Garlic" },
    { en: "Ginger" },
  ],
  indian: [
    { en: "Chicken Thighs" },
    { en: "Tomatoes" },
    { en: "Yellow Onions" },
    { en: "Garlic" },
    { en: "Ginger" },
    { en: "Chickpeas" },
    { en: "Spinach" },
    { en: "Potatoes" },
    { en: "Fresh Coriander" },
    { en: "Jasmine White Rice" },
    { en: "Butter" },
    { en: "Cauliflower" },
  ],
  mexican: [
    { en: "Chicken Breast" },
    { en: "Minced Beef" },
    { en: "Cheddar Cheese" },
    { en: "Tomatoes" },
    { en: "Red Onion" },
    { en: "Fresh Coriander" },
    { en: "Bell Peppers" },
    { en: "Garlic" },
    { en: "Sweet Corn" },
    { en: "Prawns" },
    { en: "Sour Cream" },
    { en: "Cannellini Beans" },
  ],
  american: [
    { en: "Minced Beef" },
    { en: "Cheddar Cheese" },
    { en: "Bacon" },
    { en: "Potatoes" },
    { en: "Butter" },
    { en: "Yellow Onions" },
    { en: "Tomatoes" },
    { en: "Lettuce" },
    { en: "Chicken Breast" },
    { en: "Sweet Corn" },
    { en: "Sausages" },
    { en: "Fresh Eggs" },
  ],
  african: [
    { en: "Lamb Chops" },
    { en: "Chickpeas" },
    { en: "Tomatoes" },
    { en: "Yellow Onions" },
    { en: "Garlic" },
    { en: "Carrots" },
    { en: "Lemon" },
    { en: "Fresh Coriander" },
    { en: "Chicken Thighs" },
    { en: "Extra-Virgin Olive Oil" },
    { en: "Potatoes" },
    { en: "Zucchini" },
  ],
};

/**
 * Everyday staples found in kitchens almost everywhere. Shown as quick-tap chips when
 * no particular cuisine is chosen (the default).
 */
export const EVERYDAY_STAPLES: { en: string }[] = [
  { en: "Eggs" },
  { en: "Rice" },
  { en: "Onion" },
  { en: "Garlic" },
  { en: "Tomatoes" },
  { en: "Chicken" },
  { en: "Pasta" },
  { en: "Potatoes" },
  { en: "Carrots" },
  { en: "Cheese" },
];

/** Number of European benchmark ingredients shown as quick-tap chips. */
export const EUROPEAN_QUICK_TAP_COUNT = 10;

/**
 * Returns quick-tap ingredients for the specified cuisine.
 * European cuisines always get the Top 10 of the European benchmark.
 */
export function getPopularIngredientsForCuisine(
  cuisineId: string,
  limit: number = 14
): { en: string }[] {
  const normalized = (cuisineId || "any").trim().toLowerCase();

  // Every European cuisine shows the Top 10 from the European benchmark, in rank order.
  if (isEuropeanCuisine(normalized)) {
    return TOP_50_EUROPEAN_INGREDIENTS.slice(0, EUROPEAN_QUICK_TAP_COUNT).map((item) => ({ en: item.en }));
  }

  // Handle non-European cuisines
  if (NON_EUROPEAN_REGIONAL_INGREDIENTS[normalized]) {
    return NON_EUROPEAN_REGIONAL_INGREDIENTS[normalized].slice(0, limit);
  }

  // "Any style" or anything unrecognised: everyday staples.
  return EVERYDAY_STAPLES.slice(0, limit);
}

