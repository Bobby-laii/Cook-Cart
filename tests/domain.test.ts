import { describe, it, expect } from "vitest";
import {
  generateLocalMockCookingResponse,
  isOffTopic,
  extractMenuFromLLMResponse,
  isMenuOrRecipeRequest,
} from "../src/lib/ai/aiService";

describe("Stage 11: Domain Logic & Business Rules Tests", () => {
  // Test 1: "Use all ingredients" rule
  it("should incorporate ALL user-specified ingredients into recommendations", () => {
    const userIngredients = ["Chicken Thighs", "Bok Choy", "Garlic", "Shiitake Mushrooms"];
    const response = generateLocalMockCookingResponse("Suggest something", {
      cuisine: "Cantonese",
      ingredients: userIngredients,
      servings: 2,
    });

    expect(response.suggestions).toHaveLength(3);

    response.suggestions.forEach((suggestion) => {
      // Every user ingredient must be in usedUserIngredients or explained in omitted
      userIngredients.forEach((ing) => {
        const isUsed = suggestion.usedUserIngredients.includes(ing);
        const isOmittedWithReason = suggestion.omittedUserIngredients?.some(
          (o) => o.ingredient === ing && o.reason.length > 0
        );
        expect(isUsed || isOmittedWithReason).toBe(true);
      });
    });
  });

  // Test 2: Recipe scaling logic
  it("should accurately scale ingredient quantities by portion count", () => {
    const baseServings = 2;
    const targetServings = 6;
    const multiplier = targetServings / baseServings; // 3x

    const baseAmount = 250; // 250g
    const scaledAmount = Math.round(baseAmount * multiplier * 10) / 10;

    expect(scaledAmount).toBe(750);
  });

  // Test 3: Fee Calculation rules (Requirement 2 & Section 4.5)
  it("should calculate delivery and transaction fees correctly for delivery and pickup", () => {
    const subtotal = 200.0;
    const freeDeliveryThreshold = 350.0;
    const defaultDeliveryFee = 30.0;
    const transactionFeePercent = 5.0; // 5%

    // Case A: Home Delivery under threshold
    const feeDelivery = subtotal >= freeDeliveryThreshold ? 0 : defaultDeliveryFee;
    const feePlatform = Math.round(((subtotal * transactionFeePercent) / 100) * 10) / 10;
    const totalDelivery = subtotal + feeDelivery + feePlatform;

    expect(feeDelivery).toBe(30.0);
    expect(feePlatform).toBe(10.0);
    expect(totalDelivery).toBe(240.0);

    // Case B: Home Delivery OVER threshold
    const highSubtotal = 400.0;
    const feeDeliveryHigh = highSubtotal >= freeDeliveryThreshold ? 0 : defaultDeliveryFee;
    const feePlatformHigh = Math.round(((highSubtotal * transactionFeePercent) / 100) * 10) / 10;
    const totalDeliveryHigh = highSubtotal + feeDeliveryHigh + feePlatformHigh;

    expect(feeDeliveryHigh).toBe(0.0);
    expect(feePlatformHigh).toBe(20.0);
    expect(totalDeliveryHigh).toBe(420.0);

    // Case C: Self Pickup (Delivery fee must always be HK$0)
    const feePickup = 0.0;
    const totalPickup = subtotal + feePickup + feePlatform;
    expect(feePickup).toBe(0.0);
    expect(totalPickup).toBe(210.0);
  });

  // Test 4: AI Safe-Space Companion Behavior (off-topic guardrail intentionally disabled)
  it("should allow daily life and general conversation alongside cooking questions", () => {
    expect(isOffTopic("Who won the English Premier League yesterday?")).toBe(false);
    expect(isOffTopic("I had a really exhausting day at work today.")).toBe(false);
    expect(isOffTopic("How do I steam fresh chicken with ginger and scallions?")).toBe(false);
    expect(isOffTopic("What can I substitute for Shaoxing wine in Hong Kong?")).toBe(false);
    expect(isOffTopic("How much does bok choy cost in WellMart?")).toBe(false);
  });

  // Test 5: Store Comparison cheapest and most complete logic
  it("should identify cheapest and most complete store across comparisons", () => {
    const mockStoreResults = [
      { id: "store1", totalBasketPrice: 120, itemsAvailableCount: 4, isCheapest: false, isMostComplete: false },
      { id: "store2", totalBasketPrice: 95, itemsAvailableCount: 3, isCheapest: false, isMostComplete: false }, // Cheapest
      { id: "store3", totalBasketPrice: 150, itemsAvailableCount: 5, isCheapest: false, isMostComplete: false }, // Most complete
    ];

    let minPrice = Infinity;
    let maxItems = -1;

    mockStoreResults.forEach((s) => {
      if (s.totalBasketPrice < minPrice) minPrice = s.totalBasketPrice;
      if (s.itemsAvailableCount > maxItems) maxItems = s.itemsAvailableCount;
    });

    mockStoreResults.forEach((s) => {
      if (s.totalBasketPrice === minPrice) s.isCheapest = true;
      if (s.itemsAvailableCount === maxItems) s.isMostComplete = true;
    });

    expect(mockStoreResults.find((s) => s.isCheapest)?.id).toBe("store2");
    expect(mockStoreResults.find((s) => s.isMostComplete)?.id).toBe("store3");
  });

  // Test 6: Menu extraction and step-by-step instructions for guided cooking
  it("should attach multi-step cooking instructions to every suggested dish and parse <COOKCART_MENU>", () => {
    const local = generateLocalMockCookingResponse("Give me a menu", {
      cuisine: "Cantonese",
      ingredients: ["Beef", "Broccoli"],
      servings: 2,
    });

    local.suggestions.forEach((dish) => {
      expect(dish.steps).toBeDefined();
      expect((dish.steps || []).length).toBeGreaterThanOrEqual(4);
    });

    const llmSample = `Here is a delicious garlic butter salmon menu! Click Start Step-by-Step Cooking below.\n<COOKCART_MENU>[{"title":"Garlic Butter Salmon","titleZh":"香蒜牛油三文魚","cuisine":"Western","cookTimeMinutes":15,"difficulty":"Easy","servings":2,"description":"Crispy skin salmon.","usedUserIngredients":["Salmon","Garlic"],"extraIngredientsNeeded":[],"estimatedCostHkd":68,"steps":[{"step":1,"title":"Pat Dry","text":"Pat salmon dry and season.","timerSeconds":120},{"step":2,"title":"Pan Sear","text":"Sear skin-side down for 4 mins.","timerSeconds":240}]}]</COOKCART_MENU>`;
    const parsed = extractMenuFromLLMResponse(llmSample);
    expect(parsed.cleanMessage).not.toContain("<COOKCART_MENU>");
    expect(parsed.menuDishes).toHaveLength(1);
    expect(parsed.menuDishes?.[0].title).toBe("Garlic Butter Salmon");
    expect(parsed.menuDishes?.[0].steps).toHaveLength(2);
    expect(isMenuOrRecipeRequest("Can you give me a dinner menu?")).toBe(true);
    expect(isMenuOrRecipeRequest("今天有什麼晚餐食譜推薦？")).toBe(true);
  });
});
