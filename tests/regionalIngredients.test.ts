import { describe, it, expect } from "vitest";
import {
  TOP_50_EUROPEAN_INGREDIENTS,
  isEuropeanCuisine,
  getPopularIngredientsForCuisine,
  EUROPEAN_CUISINE_IDS,
} from "@/config/regionalIngredients";
import { COMMON_INGREDIENTS_CATALOGUE } from "@/config/ingredientsCatalogue";

describe("Regional & European Distinctive Ingredients Benchmark", () => {
  it("contains exactly 50 European benchmark ingredients", () => {
    expect(TOP_50_EUROPEAN_INGREDIENTS.length).toBe(50);
  });

  it("assigns sequential ranks 1 through 50", () => {
    const ranks = TOP_50_EUROPEAN_INGREDIENTS.map((item) => item.rank);
    for (let i = 1; i <= 50; i++) {
      expect(ranks).toContain(i);
    }
  });

  it("excludes universal basics like plain table salt or white sugar", () => {
    const namesLower = TOP_50_EUROPEAN_INGREDIENTS.map((item) => item.en.toLowerCase());
    expect(namesLower).not.toContain("salt");
    expect(namesLower).not.toContain("table salt");
    expect(namesLower).not.toContain("sugar");
    expect(namesLower).not.toContain("white sugar");
  });

  it("ranks Butter #1 and Olive Oil #2 according to the definitive benchmark", () => {
    expect(TOP_50_EUROPEAN_INGREDIENTS[0].en).toBe("Butter");
    expect(TOP_50_EUROPEAN_INGREDIENTS[0].rank).toBe(1);
    expect(TOP_50_EUROPEAN_INGREDIENTS[0].consolidatedUsagePct).toBe(64.4);

    expect(TOP_50_EUROPEAN_INGREDIENTS[1].en).toBe("Extra-Virgin Olive Oil");
    expect(TOP_50_EUROPEAN_INGREDIENTS[1].rank).toBe(2);
    expect(TOP_50_EUROPEAN_INGREDIENTS[1].consolidatedUsagePct).toBe(52.7);
  });

  it("has an id and an English name for all 50 items", () => {
    for (const item of TOP_50_EUROPEAN_INGREDIENTS) {
      expect(item.id).toBeTruthy();
      expect(item.en).toBeTruthy();
    }
  });

  it("correctly identifies all European countries and styles", () => {
    const europeanSamples = [
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
    ];
    for (const cuisine of europeanSamples) {
      expect(isEuropeanCuisine(cuisine), `Expected ${cuisine} to be European`).toBe(true);
    }

    const nonEuropeanSamples = [
      "cantonese",
      "sichuan",
      "japanese",
      "korean",
      "thai",
      "vietnamese",
      "indian",
      "mexican",
    ];
    for (const cuisine of nonEuropeanSamples) {
      expect(isEuropeanCuisine(cuisine), `Expected ${cuisine} to NOT be European`).toBe(false);
    }
  });

  it("shows exactly the Top 10 benchmark items as quick tap for every European cuisine", () => {
    const top10 = TOP_50_EUROPEAN_INGREDIENTS.slice(0, 10).map((i) => i.en);
    for (const cuisine of ["western", "italian", "french", "spanish", "mediterranean", "british", "german", "greek"]) {
      const chips = getPopularIngredientsForCuisine(cuisine, 14).map((c) => c.en);
      expect(chips, cuisine).toEqual(top10);
    }
    expect(top10[0]).toBe("Butter");
    expect(top10[9]).toBe("Feta Cheese");
  });

  it("keeps non-European quick tap chips regional", () => {
    const chips = getPopularIngredientsForCuisine("cantonese").map((c) => c.en);
    expect(chips).toContain("Bok Choy");
    expect(chips).not.toContain("Parmigiano-Reggiano");
  });
  it("ensures European benchmark items are searchable in the autocomplete catalogue", () => {
    const sampleItems = [
      "Dijon Mustard",
      "Pecorino Romano",
      "Gnocchi",
      "Pancetta",
      "Spanish Chorizo",
      "Gruyère Cheese",
      "Capers",
      "Sauerkraut",
    ];
    for (const item of sampleItems) {
      const found = COMMON_INGREDIENTS_CATALOGUE.some(
        (cat) => cat.en.toLowerCase() === item.toLowerCase()
      );
      expect(found, `Expected ${item} in autocomplete catalogue`).toBe(true);
    }
  });
});

