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
  zh: string;
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
    zh: "牛油",
    rank: 1,
    consolidatedUsagePct: 64.4,
    peakUsagePct: 84.0,
    associatedRegions: ["europe", "western", "france", "uk", "british", "germany", "central_europe"],
    category: "dairy_fat",
  },
  {
    id: "olive-oil",
    en: "Extra-Virgin Olive Oil",
    zh: "特級初榨橄欖油",
    rank: 2,
    consolidatedUsagePct: 52.7,
    peakUsagePct: 85.0,
    associatedRegions: ["europe", "western", "mediterranean", "italy", "spain", "greece"],
    category: "fat_oil",
  },
  {
    id: "parmesan",
    en: "Parmigiano-Reggiano",
    zh: "巴馬臣芝士",
    rank: 3,
    consolidatedUsagePct: 38.2,
    peakUsagePct: 65.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "aged_cheese",
  },
  {
    id: "pesto",
    en: "Pesto Genovese",
    zh: "意式青醬",
    rank: 4,
    consolidatedUsagePct: 35.0,
    peakUsagePct: 35.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "condiment",
  },
  {
    id: "parsley",
    en: "Flat-Leaf Parsley",
    zh: "歐芹",
    rank: 5,
    consolidatedUsagePct: 34.8,
    peakUsagePct: 70.0,
    associatedRegions: ["europe", "western", "france", "italy", "spain", "uk", "british"],
    category: "herb",
  },
  {
    id: "pasta",
    en: "Semolina Pasta",
    zh: "意大利麵",
    rank: 6,
    consolidatedUsagePct: 31.6,
    peakUsagePct: 60.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "grain_starch",
  },
  {
    id: "thyme",
    en: "Fresh Thyme",
    zh: "百里香",
    rank: 7,
    consolidatedUsagePct: 29.5,
    peakUsagePct: 65.0,
    associatedRegions: ["europe", "western", "france", "mediterranean", "spain", "uk", "british"],
    category: "herb",
  },
  {
    id: "bay-leaves",
    en: "Bay Leaves",
    zh: "香葉",
    rank: 8,
    consolidatedUsagePct: 28.5,
    peakUsagePct: 62.0,
    associatedRegions: ["europe", "western", "france", "italy", "spain", "uk", "british"],
    category: "herb",
  },
  {
    id: "lemon",
    en: "Lemon",
    zh: "檸檬",
    rank: 9,
    consolidatedUsagePct: 27.8,
    peakUsagePct: 39.0,
    associatedRegions: ["europe", "western", "mediterranean", "italy", "spain", "greece"],
    category: "fruit_acid",
  },
  {
    id: "feta",
    en: "Feta Cheese",
    zh: "菲達芝士",
    rank: 10,
    consolidatedUsagePct: 27.2,
    peakUsagePct: 40.0,
    associatedRegions: ["europe", "western", "greece", "mediterranean"],
    category: "brined_cheese",
  },
  {
    id: "dijon-mustard",
    en: "Dijon Mustard",
    zh: "第戎芥末醬",
    rank: 11,
    consolidatedUsagePct: 26.2,
    peakUsagePct: 49.0,
    associatedRegions: ["europe", "western", "france"],
    category: "condiment",
  },
  {
    id: "gouda",
    en: "Gouda Cheese",
    zh: "高達芝士",
    rank: 12,
    consolidatedUsagePct: 25.0,
    peakUsagePct: 25.0,
    associatedRegions: ["europe", "western", "netherlands", "central_europe"],
    category: "semi_hard_cheese",
  },
  {
    id: "gnocchi",
    en: "Gnocchi",
    zh: "意式薯糰",
    rank: 13,
    consolidatedUsagePct: 25.0,
    peakUsagePct: 25.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "grain_starch",
  },
  {
    id: "basil",
    en: "Fresh Basil",
    zh: "羅勒",
    rank: 14,
    consolidatedUsagePct: 24.1,
    peakUsagePct: 56.0,
    associatedRegions: ["europe", "western", "italy", "mediterranean"],
    category: "herb",
  },
  {
    id: "white-wine",
    en: "White Wine",
    zh: "白酒",
    rank: 15,
    consolidatedUsagePct: 23.4,
    peakUsagePct: 46.0,
    associatedRegions: ["europe", "western", "france", "italy", "spain"],
    category: "cooking_wine",
  },
  {
    id: "oregano",
    en: "Oregano",
    zh: "牛至",
    rank: 16,
    consolidatedUsagePct: 23.1,
    peakUsagePct: 54.0,
    associatedRegions: ["europe", "western", "italy", "greece", "mediterranean"],
    category: "herb",
  },
  {
    id: "mozzarella",
    en: "Mozzarella",
    zh: "水牛芝士",
    rank: 17,
    consolidatedUsagePct: 22.8,
    peakUsagePct: 45.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "fresh_cheese",
  },
  {
    id: "rosemary",
    en: "Rosemary",
    zh: "迷迭香",
    rank: 18,
    consolidatedUsagePct: 22.4,
    peakUsagePct: 53.0,
    associatedRegions: ["europe", "western", "italy", "france", "mediterranean", "spain"],
    category: "herb",
  },
  {
    id: "cannellini-beans",
    en: "Cannellini Beans",
    zh: "白豆",
    rank: 19,
    consolidatedUsagePct: 21.0,
    peakUsagePct: 21.0,
    associatedRegions: ["europe", "western", "italy", "spain"],
    category: "legume",
  },
  {
    id: "red-wine",
    en: "Red Wine",
    zh: "紅酒",
    rank: 20,
    consolidatedUsagePct: 20.7,
    peakUsagePct: 47.0,
    associatedRegions: ["europe", "western", "france", "italy", "spain"],
    category: "cooking_wine",
  },
  {
    id: "cheddar",
    en: "Cheddar Cheese",
    zh: "車打芝士",
    rank: 21,
    consolidatedUsagePct: 20.7,
    peakUsagePct: 33.0,
    associatedRegions: ["europe", "western", "uk", "british"],
    category: "aged_cheese",
  },
  {
    id: "chorizo",
    en: "Spanish Chorizo",
    zh: "西班牙辣腸",
    rank: 22,
    consolidatedUsagePct: 20.3,
    peakUsagePct: 30.0,
    associatedRegions: ["europe", "western", "spain"],
    category: "cured_sausage",
  },
  {
    id: "prosciutto",
    en: "Prosciutto di Parma",
    zh: "巴馬火腿",
    rank: 23,
    consolidatedUsagePct: 20.2,
    peakUsagePct: 45.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "cured_meat",
  },
  {
    id: "sourdough",
    en: "Sourdough Bread",
    zh: "酸種麵包",
    rank: 24,
    consolidatedUsagePct: 20.0,
    peakUsagePct: 20.0,
    associatedRegions: ["europe", "western", "france", "uk", "british", "germany"],
    category: "grain_starch",
  },
  {
    id: "goat-cheese",
    en: "Goat Cheese",
    zh: "山羊芝士",
    rank: 25,
    consolidatedUsagePct: 20.0,
    peakUsagePct: 20.0,
    associatedRegions: ["europe", "western", "france", "mediterranean"],
    category: "fresh_cheese",
  },
  {
    id: "gruyere",
    en: "Gruyère Cheese",
    zh: "格呂耶爾芝士",
    rank: 26,
    consolidatedUsagePct: 19.7,
    peakUsagePct: 32.0,
    associatedRegions: ["europe", "western", "france", "switzerland", "central_europe"],
    category: "semi_hard_cheese",
  },
  {
    id: "wine-vinegar",
    en: "Wine Vinegar",
    zh: "酒醋",
    rank: 27,
    consolidatedUsagePct: 18.7,
    peakUsagePct: 27.0,
    associatedRegions: ["europe", "western", "france", "spain", "italy"],
    category: "condiment",
  },
  {
    id: "leeks",
    en: "Leeks",
    zh: "韭蔥",
    rank: 28,
    consolidatedUsagePct: 18.2,
    peakUsagePct: 44.0,
    associatedRegions: ["europe", "western", "france", "uk", "british"],
    category: "allium",
  },
  {
    id: "shallots",
    en: "Shallots",
    zh: "干蔥",
    rank: 29,
    consolidatedUsagePct: 18.1,
    peakUsagePct: 42.0,
    associatedRegions: ["europe", "western", "france"],
    category: "allium",
  },
  {
    id: "lentils",
    en: "Green Lentils",
    zh: "小扁豆",
    rank: 30,
    consolidatedUsagePct: 18.0,
    peakUsagePct: 18.0,
    associatedRegions: ["europe", "western", "france"],
    category: "legume",
  },
  {
    id: "chickpeas",
    en: "Chickpeas",
    zh: "鷹嘴豆",
    rank: 31,
    consolidatedUsagePct: 18.0,
    peakUsagePct: 18.0,
    associatedRegions: ["europe", "western", "spain", "italy", "mediterranean"],
    category: "legume",
  },
  {
    id: "brie-camembert",
    en: "Brie Cheese",
    zh: "布里芝士",
    rank: 32,
    consolidatedUsagePct: 17.3,
    peakUsagePct: 27.0,
    associatedRegions: ["europe", "western", "france"],
    category: "fresh_cheese",
  },
  {
    id: "creme-fraiche",
    en: "Crème Fraîche",
    zh: "法式酸忌廉",
    rank: 33,
    consolidatedUsagePct: 17.0,
    peakUsagePct: 27.0,
    associatedRegions: ["europe", "western", "france"],
    category: "dairy_fat",
  },
  {
    id: "pecorino",
    en: "Pecorino Romano",
    zh: "佩科里諾羊奶芝士",
    rank: 34,
    consolidatedUsagePct: 16.8,
    peakUsagePct: 25.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "aged_cheese",
  },
  {
    id: "pancetta",
    en: "Pancetta",
    zh: "意式生煙肉",
    rank: 35,
    consolidatedUsagePct: 16.8,
    peakUsagePct: 30.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "cured_meat",
  },
  {
    id: "balsamic-vinegar",
    en: "Balsamic Vinegar of Modena",
    zh: "摩德納香醋",
    rank: 36,
    consolidatedUsagePct: 16.4,
    peakUsagePct: 32.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "condiment",
  },
  {
    id: "chives",
    en: "Fresh Chives",
    zh: "細香蔥",
    rank: 37,
    consolidatedUsagePct: 15.7,
    peakUsagePct: 41.0,
    associatedRegions: ["europe", "western", "france", "germany"],
    category: "herb",
  },
  {
    id: "dill",
    en: "Fresh Dill",
    zh: "蒔蘿",
    rank: 38,
    consolidatedUsagePct: 15.5,
    peakUsagePct: 40.0,
    associatedRegions: ["europe", "western", "germany", "central_europe", "eastern_europe"],
    category: "herb",
  },
  {
    id: "salami",
    en: "Salami",
    zh: "薩拉米香腸",
    rank: 39,
    consolidatedUsagePct: 15.5,
    peakUsagePct: 20.0,
    associatedRegions: ["europe", "western", "italy", "germany"],
    category: "cured_sausage",
  },
  {
    id: "anchovies",
    en: "Anchovies",
    zh: "銀魚柳",
    rank: 40,
    consolidatedUsagePct: 14.9,
    peakUsagePct: 36.0,
    associatedRegions: ["europe", "western", "mediterranean", "italy", "spain"],
    category: "seafood",
  },
  {
    id: "capers",
    en: "Capers",
    zh: "酸豆",
    rank: 41,
    consolidatedUsagePct: 14.4,
    peakUsagePct: 37.0,
    associatedRegions: ["europe", "western", "mediterranean", "italy", "spain", "greece"],
    category: "condiment",
  },
  {
    id: "ricotta",
    en: "Ricotta",
    zh: "意大利乳清芝士",
    rank: 42,
    consolidatedUsagePct: 13.9,
    peakUsagePct: 26.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "fresh_cheese",
  },
  {
    id: "mascarpone",
    en: "Mascarpone",
    zh: "馬斯卡彭芝士",
    rank: 43,
    consolidatedUsagePct: 12.8,
    peakUsagePct: 26.0,
    associatedRegions: ["europe", "western", "italy"],
    category: "fresh_cheese",
  },
  {
    id: "blue-cheese",
    en: "Blue Cheese",
    zh: "藍芝士",
    rank: 44,
    consolidatedUsagePct: 12.6,
    peakUsagePct: 25.0,
    associatedRegions: ["europe", "western", "france", "italy"],
    category: "aged_cheese",
  },
  {
    id: "emmental",
    en: "Emmental Cheese",
    zh: "埃曼塔芝士",
    rank: 45,
    consolidatedUsagePct: 11.7,
    peakUsagePct: 24.0,
    associatedRegions: ["europe", "western", "switzerland", "central_europe"],
    category: "semi_hard_cheese",
  },
  {
    id: "beetroot",
    en: "Beetroot",
    zh: "紅菜頭",
    rank: 46,
    consolidatedUsagePct: 11.7,
    peakUsagePct: 22.0,
    associatedRegions: ["europe", "western", "eastern_europe"],
    category: "vegetable",
  },
  {
    id: "sour-cream",
    en: "Sour Cream",
    zh: "酸忌廉",
    rank: 47,
    consolidatedUsagePct: 10.4,
    peakUsagePct: 22.0,
    associatedRegions: ["europe", "western", "germany", "central_europe", "eastern_europe"],
    category: "dairy_fat",
  },
  {
    id: "sauerkraut",
    en: "Sauerkraut",
    zh: "德式酸菜",
    rank: 48,
    consolidatedUsagePct: 10.1,
    peakUsagePct: 18.0,
    associatedRegions: ["europe", "western", "germany", "central_europe"],
    category: "vegetable",
  },
  {
    id: "horseradish",
    en: "Horseradish",
    zh: "辣根",
    rank: 49,
    consolidatedUsagePct: 10.2,
    peakUsagePct: 17.0,
    associatedRegions: ["europe", "western", "germany", "eastern_europe"],
    category: "spice",
  },
  {
    id: "caraway-seeds",
    en: "Caraway Seeds",
    zh: "葛縷子",
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
const NON_EUROPEAN_REGIONAL_INGREDIENTS: Record<string, { en: string; zh: string }[]> = {
  cantonese: [
    { en: "Chicken Thighs", zh: "雞腿肉" },
    { en: "Bok Choy", zh: "白菜仔" },
    { en: "Gai Lan", zh: "芥蘭" },
    { en: "Fresh Eggs", zh: "鮮雞蛋" },
    { en: "Firm Tofu", zh: "硬豆腐" },
    { en: "Pork Belly", zh: "五花腩" },
    { en: "Sliced Beef", zh: "牛肉片" },
    { en: "Shiitake Mushrooms", zh: "鮮冬菇" },
    { en: "Garlic", zh: "大蒜" },
    { en: "Old Ginger", zh: "老薑" },
    { en: "Spring Onions", zh: "青蔥" },
    { en: "Tomatoes", zh: "蕃茄" },
  ],
  asian: [
    { en: "Chicken Thighs", zh: "雞腿肉" },
    { en: "Bok Choy", zh: "白菜仔" },
    { en: "Fresh Eggs", zh: "鮮雞蛋" },
    { en: "Firm Tofu", zh: "硬豆腐" },
    { en: "Pork Belly", zh: "五花腩" },
    { en: "Sliced Beef", zh: "牛肉片" },
    { en: "Garlic", zh: "大蒜" },
    { en: "Old Ginger", zh: "老薑" },
    { en: "Spring Onions", zh: "青蔥" },
    { en: "Jasmine White Rice", zh: "泰國香米" },
    { en: "Fresh Prawns", zh: "鮮蝦" },
    { en: "Shiitake Mushrooms", zh: "鮮冬菇" },
  ],
  sichuan: [
    { en: "Sliced Beef", zh: "肥牛片" },
    { en: "Firm Tofu", zh: "硬豆腐" },
    { en: "Pork Belly", zh: "五花腩" },
    { en: "Bean Sprouts", zh: "芽菜" },
    { en: "Garlic", zh: "大蒜" },
    { en: "Old Ginger", zh: "老薑" },
    { en: "Spring Onions", zh: "青蔥" },
    { en: "Shiitake Mushrooms", zh: "鮮冬菇" },
    { en: "Chinese Cabbage", zh: "娃娃菜" },
    { en: "Chicken Thighs", zh: "雞腿肉" },
    { en: "Cucumber", zh: "青瓜" },
    { en: "Fresh Eggs", zh: "鮮雞蛋" },
  ],
  japanese: [
    { en: "Salmon Fillet", zh: "三文魚柳" },
    { en: "Japanese Udon", zh: "烏冬" },
    { en: "Fresh Eggs", zh: "鮮雞蛋" },
    { en: "Firm Tofu", zh: "硬豆腐" },
    { en: "Shiitake Mushrooms", zh: "鮮冬菇" },
    { en: "Sliced Beef", zh: "肥牛片" },
    { en: "Spring Onions", zh: "青蔥" },
    { en: "Chicken Thighs", zh: "雞腿肉" },
    { en: "Cucumber", zh: "青瓜" },
    { en: "Carrots", zh: "紅蘿蔔" },
    { en: "Enoki Mushrooms", zh: "金針菇" },
    { en: "Cod Fish Fillet", zh: "鱈魚柳" },
  ],
  korean: [
    { en: "Pork Belly", zh: "五花腩" },
    { en: "Sliced Beef", zh: "肥牛片" },
    { en: "Firm Tofu", zh: "硬豆腐" },
    { en: "Fresh Eggs", zh: "鮮雞蛋" },
    { en: "Spring Onions", zh: "青蔥" },
    { en: "Garlic", zh: "大蒜" },
    { en: "Enoki Mushrooms", zh: "金針菇" },
    { en: "Chinese Cabbage", zh: "娃娃菜" },
    { en: "Chicken Thighs", zh: "雞腿肉" },
    { en: "Bean Sprouts", zh: "芽菜" },
    { en: "Zucchini", zh: "意大利西葫蘆" },
    { en: "Yellow Onions", zh: "洋蔥" },
  ],
  thai: [
    { en: "Fresh Prawns", zh: "鮮蝦" },
    { en: "Chicken Thighs", zh: "雞腿肉" },
    { en: "Tomatoes", zh: "蕃茄" },
    { en: "Garlic", zh: "大蒜" },
    { en: "Spring Onions", zh: "青蔥" },
    { en: "Squid", zh: "魷魚" },
    { en: "Fresh Coriander", zh: "芫荽" },
    { en: "Firm Tofu", zh: "硬豆腐" },
    { en: "Bean Sprouts", zh: "芽菜" },
    { en: "Jasmine White Rice", zh: "泰國香米" },
    { en: "Pork Belly", zh: "五花腩" },
    { en: "Eggplant", zh: "茄子" },
  ],
  vietnamese: [
    { en: "Sliced Beef", zh: "肥牛片" },
    { en: "Rice Vermicelli", zh: "米粉" },
    { en: "Fresh Prawns", zh: "鮮蝦" },
    { en: "Bean Sprouts", zh: "芽菜" },
    { en: "Fresh Coriander", zh: "芫荽" },
    { en: "Cucumber", zh: "青瓜" },
    { en: "Pork Belly", zh: "五花腩" },
    { en: "Carrots", zh: "紅蘿蔔" },
    { en: "Spring Onions", zh: "青蔥" },
    { en: "Chicken Thighs", zh: "雞腿肉" },
    { en: "Garlic", zh: "大蒜" },
    { en: "Old Ginger", zh: "老薑" },
  ],
  indian: [
    { en: "Chicken Thighs", zh: "雞腿肉" },
    { en: "Tomatoes", zh: "蕃茄" },
    { en: "Yellow Onions", zh: "洋蔥" },
    { en: "Garlic", zh: "大蒜" },
    { en: "Old Ginger", zh: "老薑" },
    { en: "Chickpeas", zh: "鷹嘴豆" },
    { en: "Spinach", zh: "菠菜" },
    { en: "Potatoes", zh: "薯仔" },
    { en: "Fresh Coriander", zh: "芫荽" },
    { en: "Jasmine White Rice", zh: "香米" },
    { en: "Butter", zh: "牛油" },
    { en: "Cauliflower", zh: "椰菜花" },
  ],
  mexican: [
    { en: "Chicken Breast", zh: "雞胸肉" },
    { en: "Minced Beef", zh: "免治牛肉" },
    { en: "Cheddar Cheese", zh: "車打芝士" },
    { en: "Tomatoes", zh: "蕃茄" },
    { en: "Red Onion", zh: "紫洋蔥" },
    { en: "Fresh Coriander", zh: "芫荽" },
    { en: "Bell Peppers", zh: "彩椒" },
    { en: "Garlic", zh: "大蒜" },
    { en: "Sweet Corn", zh: "粟米" },
    { en: "Prawns", zh: "鮮蝦" },
    { en: "Sour Cream", zh: "酸忌廉" },
    { en: "Cannellini Beans", zh: "白豆" },
  ],
  american: [
    { en: "Minced Beef", zh: "免治牛肉" },
    { en: "Cheddar Cheese", zh: "車打芝士" },
    { en: "Bacon", zh: "煙肉" },
    { en: "Potatoes", zh: "薯仔" },
    { en: "Butter", zh: "牛油" },
    { en: "Yellow Onions", zh: "洋蔥" },
    { en: "Tomatoes", zh: "蕃茄" },
    { en: "Lettuce", zh: "生菜" },
    { en: "Chicken Breast", zh: "雞胸肉" },
    { en: "Sweet Corn", zh: "粟米" },
    { en: "Sausages", zh: "香腸" },
    { en: "Fresh Eggs", zh: "鮮雞蛋" },
  ],
  african: [
    { en: "Lamb Chops", zh: "羊扒" },
    { en: "Chickpeas", zh: "鷹嘴豆" },
    { en: "Tomatoes", zh: "蕃茄" },
    { en: "Yellow Onions", zh: "洋蔥" },
    { en: "Garlic", zh: "大蒜" },
    { en: "Carrots", zh: "紅蘿蔔" },
    { en: "Lemon", zh: "檸檬" },
    { en: "Fresh Coriander", zh: "芫荽" },
    { en: "Chicken Thighs", zh: "雞腿肉" },
    { en: "Extra-Virgin Olive Oil", zh: "特級初榨橄欖油" },
    { en: "Potatoes", zh: "薯仔" },
    { en: "Zucchini", zh: "意大利西葫蘆" },
  ],
};

/** Number of European benchmark ingredients shown as quick-tap chips. */
export const EUROPEAN_QUICK_TAP_COUNT = 10;

/**
 * Returns quick-tap ingredients for the specified cuisine.
 * European cuisines always get the Top 10 of the European benchmark.
 */
export function getPopularIngredientsForCuisine(
  cuisineId: string,
  limit: number = 14
): { en: string; zh: string }[] {
  const normalized = (cuisineId || "cantonese").trim().toLowerCase();

  // Every European cuisine shows the Top 10 from the European benchmark, in rank order.
  if (isEuropeanCuisine(normalized)) {
    return TOP_50_EUROPEAN_INGREDIENTS.slice(0, EUROPEAN_QUICK_TAP_COUNT).map((item) => ({
      en: item.en,
      zh: item.zh,
    }));
  }

  // Handle non-European cuisines
  if (NON_EUROPEAN_REGIONAL_INGREDIENTS[normalized]) {
    return NON_EUROPEAN_REGIONAL_INGREDIENTS[normalized].slice(0, limit);
  }

  // Fallback for surprise_me or unspecified
  return NON_EUROPEAN_REGIONAL_INGREDIENTS.cantonese.slice(0, limit);
}

