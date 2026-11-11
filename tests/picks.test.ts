import { describe, it, expect } from "vitest";
import {
  buildHomeShelves,
  pickTonight,
  scoreDishForQuiz,
  formatQuizSummary,
  shuffleDishes,
  type CravingQuizAnswers,
} from "@/components/home/picks";
import type { MenuDish } from "@/lib/recipes/mealdb";

const SAMPLE_DISHES: MenuDish[] = [
  {
    id: "mealdb-1",
    title: "Spicy Sichuan Dan Dan Noodles",
    imageUrl: "https://www.themealdb.com/images/media/meals/1.jpg",
    cuisine: "Chinese",
    needsOven: false,
    description: "Quick stir-fried wheat noodles tossed in fiery chili oil and minced pork.",
  },
  {
    id: "mealdb-2",
    title: "Creamy Mushroom Risotto",
    imageUrl: "https://www.themealdb.com/images/media/meals/2.jpg",
    cuisine: "Italian",
    needsOven: false,
    description: "Slow-simmered arborio rice with butter, parmesan cheese, and rich mushrooms.",
  },
  {
    id: "mealdb-3",
    title: "Crispy Fried Chicken Cutlet",
    imageUrl: "https://www.themealdb.com/images/media/meals/3.jpg",
    cuisine: "Japanese",
    needsOven: false,
    description: "Golden pan-fried panko chicken breast served hot and crunchy.",
  },
  {
    id: "mealdb-4",
    title: "Fresh Herb Lemon Grilled Fish Salad",
    imageUrl: "https://www.themealdb.com/images/media/meals/4.jpg",
    cuisine: "Greek",
    needsOven: false,
    description: "Light seared white fish over crisp greens with lemon and mint dressing.",
  },
  {
    id: "mealdb-5",
    title: "Sunday Roasted Beef Brisket Pie",
    imageUrl: "https://www.themealdb.com/images/media/meals/5.jpg",
    cuisine: "British",
    needsOven: true,
    description: "Slow braised beef baked under a golden pastry crust.",
  },
  {
    id: "mealdb-6",
    title: "Thai Green Curry Noodle Soup",
    imageUrl: "https://www.themealdb.com/images/media/meals/6.jpg",
    cuisine: "Thai",
    needsOven: false,
    description: "Fragrant coconut broth with rice noodles, lime leaf, and green chili.",
  },
];

describe("pickTonight & randomization", () => {
  it("picks 3 distinct dishes from different cuisines when available", () => {
    const picks = pickTonight(SAMPLE_DISHES, {
      day: "2026-11-04-seedA",
      round: 0,
      noOven: false,
    });
    expect(picks).toHaveLength(3);
    const cuisines = new Set(picks.map((p) => p.cuisine));
    expect(cuisines.size).toBe(3);
  });

  it("varies picks across different visit seeds and shuffle rounds", () => {
    const visitA = pickTonight(SAMPLE_DISHES, {
      day: "2026-11-04-101",
      round: 0,
      noOven: false,
    });
    const visitB = pickTonight(SAMPLE_DISHES, {
      day: "2026-11-04-999",
      round: 1,
      noOven: false,
    });
    expect(visitA.map((d) => d.id)).not.toEqual(visitB.map((d) => d.id));
  });

  it("filters out oven dishes when noOven is true", () => {
    for (let round = 0; round < 5; round++) {
      const picks = pickTonight(SAMPLE_DISHES, {
        day: "2026-11-04",
        round,
        noOven: true,
      });
      expect(picks.every((d) => !d.needsOven)).toBe(true);
    }
  });

  it("tailors suggestions to CravingQuizAnswers when quiz is provided", () => {
    const soupyUmamiQuiz: CravingQuizAnswers = {
      pace: "quick",
      style: "soupy",
      flavour: "umami",
    };

    expect(scoreDishForQuiz(SAMPLE_DISHES[0], soupyUmamiQuiz)).toBeGreaterThan(
      scoreDishForQuiz(SAMPLE_DISHES[4], soupyUmamiQuiz)
    );

    const picks = pickTonight(SAMPLE_DISHES, {
      day: "2026-11-04-quiz",
      round: 0,
      noOven: false,
      quiz: soupyUmamiQuiz,
    });
    expect(picks).toHaveLength(3);
    const ids = picks.map((p) => p.id);
    // Chinese Dan Dan Noodles, Japanese Chicken Cutlet, and Thai Green Curry Noodle Soup match umami/quick/soupy
    expect(ids).toContain("mealdb-1");
    expect(ids).toContain("mealdb-6");
  });

  it("formats a human-readable summary of quiz answers", () => {
    expect(
      formatQuizSummary({
        pace: "quick",
        style: "crispy",
        flavour: "umami",
      })
    ).toBe("Quick & easy · Golden & seared · Soy, ginger & garlic");
  });

  it("shuffles dishes deterministically for a given visit seed", () => {
    const shuffled1 = shuffleDishes(SAMPLE_DISHES, "seed-123");
    const shuffled2 = shuffleDishes(SAMPLE_DISHES, "seed-456");
    expect(shuffled1).toHaveLength(SAMPLE_DISHES.length);
    expect(shuffled1.map((d) => d.id)).not.toEqual(shuffled2.map((d) => d.id));
  });
});

describe("buildHomeShelves", () => {
  const cuisines = ["Italian", "Thai", "Mexican", "Japanese"];
  const titles = ["Chicken curry", "Beef stew", "Egg fried rice", "Prawn noodle soup", "Tomato pasta", "Pork tacos", "Baked pie", "Lentil soup"];
  const MANY: MenuDish[] = cuisines.flatMap((cuisine, ci) =>
    titles.map((t, ti) => ({
      id: `mealdb-${ci}-${ti}`,
      title: `${cuisine} ${t}`,
      imageUrl: "https://www.themealdb.com/images/media/meals/x.jpg",
      cuisine,
      needsOven: t.startsWith("Baked"),
      description: "",
    }))
  );

  it("never repeats a dish across shelves or Tonight, and mixes card templates", () => {
    const shelves = buildHomeShelves(MANY, { seed: "abc", exclude: ["mealdb-0-0"] });
    const ids = shelves.flatMap((s) => s.dishes.map((d) => d.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain("mealdb-0-0");
    expect(new Set(shelves.map((s) => s.variant)).size).toBeGreaterThanOrEqual(2);
    expect(shelves.every((s) => s.dishes.length >= 4)).toBe(true);
  });

  it("respects the no-oven kitchen", () => {
    const shelves = buildHomeShelves(MANY, { seed: "xyz", noOven: true });
    expect(shelves.flatMap((s) => s.dishes).every((d) => !d.needsOven)).toBe(true);
  });
});
