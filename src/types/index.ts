/**
 * CookCart Core TypeScript Type Definitions
 */

export type UserRole = "CUSTOMER" | "STORE_PARTNER" | "ADMIN";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED";

export type FulfillmentType = "DELIVERY" | "PICKUP";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  storeId?: string; // If STORE_PARTNER
  chefName?: string;
  chefAvatarUrl?: string;
  chefPersonality?: string;
}

export interface RecipeIngredient {
  name: string;
  nameZh: string;
  amount: number;
  unit: string;
  optional?: boolean;
}

export interface RecipeStep {
  step: number;
  title: string;
  titleZh?: string;
  text: string;
  textZh?: string;
  timerSeconds?: number;
}

export interface DishSuggestion {
  id: string;
  title: string;
  titleZh: string;
  cuisine: string;
  cookTimeMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  servings: number;
  description: string;
  descriptionZh: string;
  usedUserIngredients: string[]; // Ingredients from user input
  extraIngredientsNeeded: RecipeIngredient[]; // Extra needed
  omittedUserIngredients?: { ingredient: string; reason: string }[];
  localSubstituteNotes?: string;
  estimatedCostHkd: number;
  availabilityNote: string; // e.g. "All ingredients available at nearby stores"
  // Resolved server-side by lib/images/foodImage.ts. Optional because a suggestion
  // is still valid and renderable if photo lookup failed entirely.
  imageUrl?: string;
  // Real cooking instructions, when the suggestion came from a live recipe source
  // (lib/recipes/spoonacular.ts) rather than the local generator. Optional because
  // the local engine only produces a description, and the detail page already
  // builds its own steps as a fallback.
  steps?: RecipeStep[];
  // Provenance for live recipes. Kept so the UI can attribute the recipe to its
  // source and link back to it, which most recipe APIs require for attribution.
  sourceUrl?: string;
  sourceName?: string;
  // True when the recipe bakes or roasts; drives the "no oven" kitchen setting.
  needsOven?: boolean;
}

export interface StoreComparisonResult {
  storeId: string;
  storeName: string;
  storeNameZh: string;
  slug: string;
  totalPrice: number;
  availableItemsCount: number;
  totalItemsCount: number;
  missingItems: string[];
  deliveryFee: number;
  freeDeliveryThreshold: number;
  deliveryTimeEstimate: string;
  pickupAvailable: boolean;
  isCheapest: boolean;
  isMostComplete: boolean;
}
