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
