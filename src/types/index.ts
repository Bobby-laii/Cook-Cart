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
  storeId?: string;
  dietaryRestrictions?: string;
  allergies?: string;
  preferredLanguage?: string;
  chefName?: string;
  chefAvatarUrl?: string;
  chefAvatarConfig?: string | null;
  chefPersonality?: string;
  onboardingCompleted?: boolean;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  optional?: boolean;
  note?: string;
  also?: { amount: number; unit: string }[];
}

export interface RecipeStep {
  step: number;
  title: string;
  text: string;
  timerSeconds?: number;
}

export interface DishSuggestion {
  id: string;
  title: string;
  cuisine: string;
  cookTimeMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  servings: number;
  description: string;
  usedUserIngredients: string[];
  extraIngredientsNeeded: RecipeIngredient[];
  omittedUserIngredients?: { ingredient: string; reason: string }[];
  localSubstituteNotes?: string;
  estimatedCostHkd: number;
  availabilityNote: string;
  imageUrl?: string;
  steps?: RecipeStep[];
  sourceUrl?: string;
  sourceName?: string;
  needsOven?: boolean;
}

export interface StoreComparisonResult {
  storeId: string;
  storeName: string;
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
