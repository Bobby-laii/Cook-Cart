/**
 * CookCart Core Configuration
 * All business model parameters, brand names, and defaults are centralized here.
 * As requested in Section 1 and Section 2 of the brief, this is changeable in one place.
 */

export const APP_CONFIG = {
  // Brand name (changeable here)
  appName: process.env.NEXT_PUBLIC_APP_NAME || "BON TASTE",
  appTagline: "A calm cooking companion: recipes, your own chef, and step-by-step cooking",
  currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "HKD",
  currencySymbol: "HK$",

  // Market & Region
  defaultRegion: "Hong Kong",
  defaultLanguage: "en",

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
    defaultModel: "gemini-2.5-flash", // overridable with GEMINI_MODEL
    monthlySpendingCapHkd: 100.0, // HK$100 monthly limit
    dailyUserRequestLimit: 30, // Max 30 chef messages per user per day; keeps the free Gemini quota shared
  },

  // Cuisine Categories.
  // `region` is kept for grouping only and is never rendered next to the label —
  // it was previously appended as "(Asia)" / "(Europe)", which read as noise in a
  // dropdown of dish styles. `broadStyle` entries are deliberately not tied to a
  // country, for people who want "Asian food" rather than a specific cuisine.
  cuisines: [
    // Broad, country-agnostic styles first — the common everyday choice.
    // "any" is the default: no particular style, the chef picks what suits the ingredients.
    { id: "any", label: "Any style", region: "Global", broadStyle: true },
    { id: "asian", label: "Asian Food", region: "Asia", broadStyle: true },
    { id: "western", label: "Western Food", region: "Global", broadStyle: true },

    { id: "cantonese", label: "Cantonese", region: "Asia" },
    { id: "sichuan", label: "Sichuan / Spicy", region: "Asia" },
    { id: "japanese", label: "Japanese", region: "Asia" },
    { id: "korean", label: "Korean", region: "Asia" },
    { id: "thai", label: "Thai", region: "Asia" },
    { id: "vietnamese", label: "Vietnamese", region: "Asia" },
    { id: "indian", label: "Indian / Curry", region: "Asia" },
    { id: "italian", label: "Italian", region: "Europe" },
    { id: "french", label: "French", region: "Europe" },
    { id: "spanish", label: "Spanish / Tapas", region: "Europe" },
    { id: "mediterranean", label: "Mediterranean", region: "Europe" },
    { id: "british", label: "British", region: "Europe" },
    { id: "german", label: "German", region: "Europe" },
    { id: "greek", label: "Greek", region: "Europe" },
    { id: "mexican", label: "Mexican", region: "Americas" },
    { id: "american", label: "American / Comfort", region: "Americas" },
    { id: "african", label: "African / Tagine", region: "Africa" },
  ],

  // Available Kitchen Equipment
  equipmentList: [
    { id: "stove", label: "Stovetop / Gas / Induction", default: true },
    { id: "rice_cooker", label: "Rice Cooker", default: true },
    { id: "microwave", label: "Microwave", default: false },
    { id: "oven", label: "Oven / Air Fryer", default: false },
  ],

  // Skill Levels
  skillLevels: [
    { id: "beginner", label: "Beginner (Easy & Quick)" },
    { id: "intermediate", label: "Home Cook (Standard)" },
    { id: "advanced", label: "Advanced (Gourmet)" },
  ],

  // Dietary Restrictions
  dietaryOptions: [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "halal", label: "Halal" },
    { id: "gluten_free", label: "Gluten-Free" },
    { id: "low_carb", label: "Low Carb / Keto" },
    { id: "dairy_free", label: "Dairy-Free" },
  ],

  // Common Allergies
  allergyOptions: [
    { id: "peanuts", label: "Peanuts & Tree Nuts" },
    { id: "seafood", label: "Seafood / Shellfish" },
    { id: "dairy", label: "Cow's Milk / Lactose" },
    { id: "eggs", label: "Eggs" },
    { id: "soy", label: "Soybeans" },
    { id: "wheat", label: "Wheat / Gluten" },
  ],
};
