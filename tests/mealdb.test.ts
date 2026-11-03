import { describe, it, expect } from "vitest";
import { parseMeasure, splitInstructions, mealToDish } from "@/lib/recipes/mealdb";

describe("TheMealDB measure parsing", () => {
    it("reads whole numbers, decimals and simple fractions", () => {
        expect(parseMeasure("2 cups")).toEqual({ amount: 2, unit: "cups" });
        expect(parseMeasure("1.5 tbsp")).toEqual({ amount: 1.5, unit: "tbsp" });
        expect(parseMeasure("3/4 cup")).toEqual({ amount: 0.75, unit: "cup" });
    });

    it("reads mixed numbers in both ASCII and unicode form", () => {
        expect(parseMeasure("1 1/2 tsp")).toEqual({ amount: 1.5, unit: "tsp" });
        expect(parseMeasure("1 ½ tsp")).toEqual({ amount: 1.5, unit: "tsp" });
        expect(parseMeasure("½ cup")).toEqual({ amount: 0.5, unit: "cup" });
        expect(parseMeasure("2 -1/2 cups")).toEqual({ amount: 2.5, unit: "cups" });
        expect(parseMeasure("2-1/2 cups")).toEqual({ amount: 2.5, unit: "cups" });
    });

    it("keeps a measure with no quantity as the unit, so nothing is lost", () => {
        expect(parseMeasure("pinch")).toEqual({ amount: 1, unit: "pinch" });
        expect(parseMeasure("")).toEqual({ amount: 1, unit: "" });
    });
});

describe("TheMealDB instructions", () => {
    it("numbers each line and drops bare STEP headings", () => {
        const steps = splitInstructions("STEP 1\r\nBoil the water.\r\n\r\nSTEP 2\r\nAdd the noodles.");
        expect(steps.map((s) => s.text)).toEqual(["Boil the water.", "Add the noodles."]);
        expect(steps[1].step).toBe(2);
    });
});

describe("TheMealDB meal to dish", () => {
    it("maps ingredients and marks time as unknown instead of guessing", () => {
        const dish = mealToDish({
            idMeal: "52772",
            strMeal: "Teriyaki Chicken Casserole",
            strMealThumb: "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
            strArea: "Japanese",
            strInstructions: "Bake it.",
            strIngredient1: "soy sauce",
            strMeasure1: "3/4 cup",
            strIngredient2: "",
            strMeasure2: "",
        });
        expect(dish.id).toBe("mealdb-52772");
        expect(dish.extraIngredientsNeeded).toEqual([
            { name: "soy sauce", nameZh: "soy sauce", amount: 0.75, unit: "cup" },
        ]);
        expect(dish.cookTimeMinutes).toBe(0);
        expect(dish.sourceName).toBe("TheMealDB");
    });
});

describe("TheMealDB untrusted links", () => {
    const base = {
        idMeal: "1",
        strMeal: "Test",
        strMealThumb: "https://www.themealdb.com/images/media/meals/x.jpg",
        strInstructions: "Cook.",
    };

    it("drops a javascript: source link and falls back to the TheMealDB page", () => {
        const dish = mealToDish({ ...base, strSource: "javascript:alert(document.cookie)" });
        expect(dish.sourceUrl).toBe("https://www.themealdb.com/meal/1");
    });

    it("keeps a normal https source link", () => {
        const dish = mealToDish({ ...base, strSource: "https://example.com/recipe" });
        expect(dish.sourceUrl).toBe("https://example.com/recipe");
    });

    it("only accepts photos from TheMealDB over https", () => {
        expect(mealToDish({ ...base, strMealThumb: "data:image/svg+xml,<svg onload=alert(1)>" }).imageUrl).toBeUndefined();
        expect(mealToDish({ ...base, strMealThumb: "https://evil.example/x.jpg" }).imageUrl).toBeUndefined();
        expect(mealToDish(base).imageUrl).toBe(base.strMealThumb);
    });
});

describe("menu data TheMealDB lacks", () => {
    it("adds the Chinese name and oven flag for known dishes", () => {
        const dish = mealToDish({
            idMeal: "52772",
            strMeal: "Teriyaki Chicken Casserole",
            strMealThumb: "https://www.themealdb.com/images/media/meals/x.jpg",
            strInstructions: "Preheat oven to 350° F.",
        });
        expect(dish.titleZh).toBe("照燒雞焗飯");
        expect(dish.needsOven).toBe(true);
    });

    it("detects an oven from the steps for dishes not in the data file", () => {
        const dish = mealToDish({
            idMeal: "99999999",
            strMeal: " New Dish ",
            strMealThumb: "https://www.themealdb.com/images/media/meals/x.jpg",
            strInstructions: "Bake for 20 minutes.",
        });
        expect(dish.title).toBe("New Dish");
        expect(dish.titleZh).toBe("New Dish");
        expect(dish.needsOven).toBe(true);
    });
});
