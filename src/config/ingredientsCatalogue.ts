/**
 * Common Fresh Ingredients Catalogue for Instant Local Autocomplete Search
 * 100% Client-side and in-memory — 0ms latency, zero API costs, zero rate-limits.
 */

export interface IngredientItem {
  en: string;
  zh: string;
  category: "meat" | "seafood" | "vegetable" | "tofu_dairy" | "pantry_seasoning" | "grain_noodle";
}

export const COMMON_INGREDIENTS_CATALOGUE: IngredientItem[] = [
  // Meat & Poultry
  { en: "Chicken Thighs", zh: "雞腿肉", category: "meat" },
  { en: "Chicken Breast", zh: "雞胸肉", category: "meat" },
  { en: "Chicken Wings", zh: "雞翼", category: "meat" },
  { en: "Pork Belly", zh: "五花腩", category: "meat" },
  { en: "Pork Chops", zh: "豬扒", category: "meat" },
  { en: "Minced Pork", zh: "免治豬肉", category: "meat" },
  { en: "Pork Ribs", zh: "排骨", category: "meat" },
  { en: "Sliced Beef", zh: "肥牛片", category: "meat" },
  { en: "Beef Sirloin Steak", zh: "西冷牛扒", category: "meat" },
  { en: "Minced Beef", zh: "免治牛肉", category: "meat" },
  { en: "Beef Brisket", zh: "牛腩", category: "meat" },
  { en: "Lamb Chops", zh: "羊扒", category: "meat" },
  { en: "Bacon", zh: "煙肉", category: "meat" },
  { en: "Sausages", zh: "香腸", category: "meat" },

  // Seafood
  { en: "Salmon Fillet", zh: "三文魚柳", category: "seafood" },
  { en: "Cod Fish Fillet", zh: "鱈魚柳", category: "seafood" },
  { en: "Fresh Prawns / Shrimps", zh: "鮮蝦", category: "seafood" },
  { en: "Squid / Calamari", zh: "魷魚", category: "seafood" },
  { en: "Fresh Scallops", zh: "帶子", category: "seafood" },
  { en: "Fresh Clams", zh: "蜆肉", category: "seafood" },
  { en: "Fish Balls", zh: "魚蛋", category: "seafood" },
  { en: "Crab Sticks", zh: "蟹柳", category: "seafood" },
  { en: "Mussels", zh: "青口", category: "seafood" },

  // Vegetables & Herbs
  { en: "Bok Choy", zh: "白菜仔", category: "vegetable" },
  { en: "Gai Lan (Chinese Broccoli)", zh: "芥蘭", category: "vegetable" },
  { en: "Choy Sum", zh: "菜心", category: "vegetable" },
  { en: "Spinach", zh: "菠菜", category: "vegetable" },
  { en: "Broccoli", zh: "西蘭花", category: "vegetable" },
  { en: "Cauliflower", zh: "椰菜花", category: "vegetable" },
  { en: "Chinese Cabbage (Wong Nga Pak)", zh: "黃芽白 / 娃娃菜", category: "vegetable" },
  { en: "Lettuce", zh: "生菜", category: "vegetable" },
  { en: "Tomatoes", zh: "蕃茄", category: "vegetable" },
  { en: "Carrots", zh: "紅蘿蔔", category: "vegetable" },
  { en: "Potatoes", zh: "薯仔", category: "vegetable" },
  { en: "Yellow Onions", zh: "洋蔥", category: "vegetable" },
  { en: "Red Onion", zh: "紫洋蔥", category: "vegetable" },
  { en: "Spring Onions (Scallions)", zh: "青蔥", category: "vegetable" },
  { en: "Garlic", zh: "大蒜", category: "vegetable" },
  { en: "Old Ginger", zh: "老薑", category: "vegetable" },
  { en: "Fresh Coriander (Cilantro)", zh: "芫荽", category: "vegetable" },
  { en: "Bell Peppers", zh: "彩椒", category: "vegetable" },
  { en: "Fresh Shiitake Mushrooms", zh: "鮮冬菇", category: "vegetable" },
  { en: "Enoki Mushrooms", zh: "金針菇", category: "vegetable" },
  { en: "King Oyster Mushrooms", zh: "杏鮑菇", category: "vegetable" },
  { en: "Button Mushrooms", zh: "白蘑菇", category: "vegetable" },
  { en: "Cucumber", zh: "青瓜", category: "vegetable" },
  { en: "Eggplant (Aubergine)", zh: "茄子", category: "vegetable" },
  { en: "Zucchini (Courgette)", zh: "意大利西葫蘆", category: "vegetable" },
  { en: "Sweet Corn", zh: "粟米", category: "vegetable" },
  { en: "Asparagus", zh: "蘆筍", category: "vegetable" },
  { en: "Green Beans", zh: "四季豆", category: "vegetable" },
  { en: "Bean Sprouts", zh: "芽菜", category: "vegetable" },

  // Tofu, Eggs & Dairy
  { en: "Fresh Eggs", zh: "鮮雞蛋", category: "tofu_dairy" },
  { en: "Firm Tofu", zh: "硬豆腐", category: "tofu_dairy" },
  { en: "Soft Silken Tofu", zh: "嫩豆腐", category: "tofu_dairy" },
  { en: "Fried Tofu Puffs", zh: "豆卜", category: "tofu_dairy" },
  { en: "Butter", zh: "牛油", category: "tofu_dairy" },
  { en: "Cheddar Cheese", zh: "芝士", category: "tofu_dairy" },
  { en: "Fresh Milk", zh: "鮮牛奶", category: "tofu_dairy" },
  { en: "Heavy Cream", zh: "淡忌廉", category: "tofu_dairy" },

  // Grains, Pasta & Noodles
  { en: "Jasmine White Rice", zh: "泰國香米", category: "grain_noodle" },
  { en: "Spaghetti Pasta", zh: "意大利粉", category: "grain_noodle" },
  { en: "Penne Pasta", zh: "長通粉", category: "grain_noodle" },
  { en: "Fresh Wonton Egg Noodles", zh: "全蛋幼麵", category: "grain_noodle" },
  { en: "Japanese Udon Noodles", zh: "烏冬", category: "grain_noodle" },
  { en: "Ramen Noodles", zh: "拉麵", category: "grain_noodle" },
  { en: "Rice Vermicelli", zh: "米粉", category: "grain_noodle" },
  { en: "Soba Noodles", zh: "蕎麥麵", category: "grain_noodle" },
];

