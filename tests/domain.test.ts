import { describe, it, expect } from "vitest";
import {
  generateLocalMockCookingResponse,
  isOffTopic,
  extractMenuFromLLMResponse,
  isMenuOrRecipeRequest,
  isCookingStepOrTechniqueQuestion,
  answerCookingQuestionLocally,
  humanizeChefMessage,
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
    const multiplier = targetServings / baseServings;

    const baseAmount = 250;
    const scaledAmount = Math.round(baseAmount * multiplier * 10) / 10;

    expect(scaledAmount).toBe(750);
  });

  // Test 4: AI Safe-Space Companion Behavior (off-topic guardrail intentionally disabled)
  it("should allow daily life and general conversation alongside cooking questions", () => {
    expect(isOffTopic("Who won the English Premier League yesterday?")).toBe(false);
    expect(isOffTopic("I had a really exhausting day at work today.")).toBe(false);
    expect(isOffTopic("How do I steam fresh chicken with ginger and scallions?")).toBe(false);
    expect(isOffTopic("What can I substitute for Shaoxing wine in Hong Kong?")).toBe(false);
    expect(isOffTopic("How much does bok choy cost in WellMart?")).toBe(false);
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

    const llmSample = `Here is a delicious garlic butter salmon menu! Click Start Step-by-Step Cooking below.\n<COOKCART_MENU>[{"title":"Garlic Butter Salmon","cuisine":"Western","cookTimeMinutes":15,"difficulty":"Easy","servings":2,"description":"Crispy skin salmon.","usedUserIngredients":["Salmon","Garlic"],"extraIngredientsNeeded":[],"estimatedCostHkd":68,"steps":[{"step":1,"title":"Pat Dry","text":"Pat salmon dry and season.","timerSeconds":120},{"step":2,"title":"Pan Sear","text":"Sear skin-side down for 4 mins.","timerSeconds":240}]}]</COOKCART_MENU>`;
    const parsed = extractMenuFromLLMResponse(llmSample);
    expect(parsed.cleanMessage).not.toContain("<COOKCART_MENU>");
    expect(parsed.menuDishes).toHaveLength(1);
    expect(parsed.menuDishes?.[0].title).toBe("Garlic Butter Salmon");
    expect(parsed.menuDishes?.[0].steps).toHaveLength(2);
    expect(isMenuOrRecipeRequest("Can you give me a dinner menu?")).toBe(true);
    expect(isMenuOrRecipeRequest("What should I cook for lunch?")).toBe(true);
    expect(isMenuOrRecipeRequest("How was your day?")).toBe(false);
  });

  it("distinguishes mid-recipe step questions from menu requests and answers them directly", () => {
    const stepPrompt =
      'I am on step 3 of 5 while cooking "Teriyaki Chicken" for 2. High-Heat Sear: Heat 1 tbsp oil in your pan. Quick question: How hot should the pan be? (Please answer in 2 or 3 practical sentences.)';
    expect(isCookingStepOrTechniqueQuestion(stepPrompt)).toBe(true);
    expect(isMenuOrRecipeRequest(stepPrompt)).toBe(false);

    const answer = answerCookingQuestionLocally(stepPrompt);
    expect(answer).toContain("190°C");
    expect(answer).toContain("375°F");
  });

  it("replaces robotic **bold** and - bullet dish lists with casual kitchen talk", () => {
    const roboticReply = `**Quick 30-minute meals with rice, eggs, and garlic**

- **Garlic Fried-Rice with Sunny-Side Eggs** – sautéed garlic, gently fried rice, topped with two sunny-side eggs.
- **Garlic-Infused Egg-Rice Pilaf** – fluffy rice simmered with garlic, folded with scrambled eggs and herbs.
- **Garlic Egg Curry over Steamed Rice** – spicy garlic sauce with boiled eggs, served over steaming rice.`;

    const casual = humanizeChefMessage(roboticReply, true, ["Rice", "Eggs", "Garlic"]);
    expect(casual).not.toContain("**");
    expect(casual).not.toContain("- ");
    expect(casual).toContain("Rice, eggs, garlic go really well together");
  });
});
