/**
 * CookCart Core Configuration
 * All business model parameters, brand names, and defaults are centralized here.
 * As requested in Section 1 and Section 2 of the brief, this is changeable in one place.
 */

export const APP_CONFIG = {
  // Brand name (changeable here)
  appName: process.env.NEXT_PUBLIC_APP_NAME || "CookCart",
  appTagline: "AI-Powered Cooking & Grocery Delivery in Hong Kong",
  currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "HKD",
  currencySymbol: "HK$",

  // Market & Region
  defaultRegion: "Hong Kong",
  defaultLanguage: "en", // "en" or "zh-HK"

  // Business Model Settings (Defaults, can be updated via Admin Settings)
  fees: {
    transactionFeePercent: 5.0, // 5% platform commission
    defaultDeliveryFee: 30.0, // HK$30 flat delivery fee
    freeDeliveryThreshold: 350.0, // Free delivery for orders over HK$350
    pickupFee: 0.0, // Self-pickup is always HK$0
    minOrderAmount: 80.0, // Minimum order amount HK$80
  },

  // AI Service Defaults
  ai: {
    defaultProvider: "gemini", // 'gemini' | 'openai' | 'mock'
    defaultModel: "gemini-1.5-flash",
    monthlySpendingCapHkd: 100.0, // HK$100 monthly limit
    dailyUserRequestLimit: 30, // Max 30 AI queries per user per day
  },

  // Cuisine Categories.
  // Labels are split into `label` / `labelZh` rather than baked into one string
  // like "Cantonese (粵菜)": the UI shows a single language based on the user's
  // choice, so mixing both here forced every locale to display the other one too.
  // `region` is kept for grouping only and is never rendered next to the label —
  // it was previously appended as "(Asia)" / "(Europe)", which read as noise in a
  // dropdown of dish styles. `broadStyle` entries are deliberately not tied to a
  // country, for people who want "Asian food" rather than a specific cuisine.
  cuisines: [
    // Broad, country-agnostic styles first — the common everyday choice.
    { id: "asian", label: "Asian Food", labelZh: "亞洲菜", region: "Asia", broadStyle: true },
    { id: "western", label: "Western Food", labelZh: "西式料理", region: "Global", broadStyle: true },

    { id: "cantonese", label: "Cantonese", labelZh: "粵菜", region: "Asia" },
    { id: "sichuan", label: "Sichuan / Spicy", labelZh: "川菜", region: "Asia" },
    { id: "japanese", label: "Japanese", labelZh: "日式", region: "Asia" },
    { id: "korean", label: "Korean", labelZh: "韓式", region: "Asia" },
    { id: "thai", label: "Thai", labelZh: "泰式", region: "Asia" },
    { id: "vietnamese", label: "Vietnamese", labelZh: "越式", region: "Asia" },
    { id: "indian", label: "Indian / Curry", labelZh: "印度", region: "Asia" },
    { id: "italian", label: "Italian", labelZh: "意式", region: "Europe" },
    { id: "french", label: "French", labelZh: "法式", region: "Europe" },
    { id: "spanish", label: "Spanish / Tapas", labelZh: "西班牙", region: "Europe" },
    { id: "mediterranean", label: "Mediterranean", labelZh: "地中海", region: "Europe" },
    { id: "british", label: "British", labelZh: "英式", region: "Europe" },
    { id: "german", label: "German", labelZh: "德式", region: "Europe" },
    { id: "greek", label: "Greek", labelZh: "希臘", region: "Europe" },
    { id: "mexican", label: "Mexican", labelZh: "墨西哥", region: "Americas" },
    { id: "american", label: "American / Comfort", labelZh: "美式", region: "Americas" },
    { id: "african", label: "African / Tagine", labelZh: "非洲", region: "Africa" },

    { id: "surprise_me", label: "🎲 Surprise Me!", labelZh: "🎲 隨機驚喜！", region: "Global" },
  ],

  // Available Kitchen Equipment
  equipmentList: [
    { id: "stove", label: "Stovetop / Gas / Induction", labelZh: "爐灶 (明火 / 電磁爐)", default: true },
    { id: "rice_cooker", label: "Rice Cooker", labelZh: "電飯煲", default: true },
    { id: "microwave", label: "Microwave", labelZh: "微波爐", default: false },
    { id: "oven", label: "Oven / Air Fryer", labelZh: "焗爐 / 氣炸鍋", default: false },
  ],

  // Skill Levels
  skillLevels: [
    { id: "beginner", label: "Beginner (Easy & Quick)", labelZh: "新手 (簡單快速)" },
    { id: "intermediate", label: "Home Cook (Standard)", labelZh: "家庭廚師 (標準)" },
    { id: "advanced", label: "Advanced (Gourmet)", labelZh: "廚藝達人 (進階)" },
  ],

  // Dietary Restrictions
  dietaryOptions: [
    { id: "vegetarian", label: "Vegetarian", labelZh: "素食" },
    { id: "vegan", label: "Vegan", labelZh: "全素" },
    { id: "halal", label: "Halal", labelZh: "清真" },
    { id: "gluten_free", label: "Gluten-Free", labelZh: "無麩質" },
    { id: "low_carb", label: "Low Carb / Keto", labelZh: "生酮 / 低碳" },
    { id: "dairy_free", label: "Dairy-Free", labelZh: "無乳製品" },
  ],

  // Common Allergies
  allergyOptions: [
    { id: "peanuts", label: "Peanuts & Tree Nuts", labelZh: "花生及堅果" },
    { id: "seafood", label: "Seafood / Shellfish", labelZh: "海鮮及甲殼類" },
    { id: "dairy", label: "Cow's Milk / Lactose", labelZh: "牛奶 / 乳糖" },
    { id: "eggs", label: "Eggs", labelZh: "雞蛋" },
    { id: "soy", label: "Soybeans", labelZh: "大豆" },
    { id: "wheat", label: "Wheat / Gluten", labelZh: "小麥 / 麩質" },
  ],
};
