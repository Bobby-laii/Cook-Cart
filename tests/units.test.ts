import { describe, it, expect } from "vitest";
import { convertAmount, convertTemperatures, defaultUnitSystem, formatAmount, formatQuantity, shortUnit } from "@/lib/units";

describe("convertAmount", () => {
    it("turns US volumes and weights into metric", () => {
        expect(convertAmount(0.75, "cup", "metric")).toEqual({ amount: 180, unit: "ml" });
        expect(convertAmount(2, "lbs", "metric")).toEqual({ amount: 905, unit: "g" });
        expect(convertAmount(3, "lb", "metric")).toEqual({ amount: 1.36, unit: "kg" });
        expect(convertAmount(4, "oz", "metric")).toEqual({ amount: 115, unit: "g" });
    });

    it("turns metric into US units, using spoons for small volumes", () => {
        expect(convertAmount(250, "g", "us")).toEqual({ amount: 8.8, unit: "oz" });
        expect(convertAmount(500, "ml", "us")).toEqual({ amount: 2.08, unit: "cup" });
        expect(convertAmount(30, "ml", "us")).toEqual({ amount: 2, unit: "tbsp" });
    });

    it("leaves spoons, counts and unknown units as written", () => {
        expect(convertAmount(2, "tbsp", "metric")).toEqual({ amount: 2, unit: "tbsp" });
        expect(convertAmount(3, "", "us")).toEqual({ amount: 3, unit: "" });
        expect(convertAmount(1, "(12 oz.)", "metric")).toEqual({ amount: 1, unit: "(12 oz.)" });
    });

    it("does nothing when the unit is already in the chosen system", () => {
        expect(convertAmount(200, "g", "metric")).toEqual({ amount: 200, unit: "g" });
        expect(convertAmount(1, "cup", "us")).toEqual({ amount: 1, unit: "cup" });
    });
});

describe("convertTemperatures", () => {
    it("rewrites oven temperatures in step text", () => {
        expect(convertTemperatures("Preheat oven to 350° F. Bake.", "metric")).toBe("Preheat oven to 175°C. Bake.");
        expect(convertTemperatures("Heat to 180°C", "us")).toBe("Heat to 355°F");
        expect(convertTemperatures("Bake at 400 degrees F", "metric")).toBe("Bake at 205°C");
    });

    it("keeps temperatures already in the chosen scale", () => {
        expect(convertTemperatures("Bake at 200°C", "metric")).toBe("Bake at 200°C");
    });
});

describe("defaultUnitSystem", () => {
    it("guesses US units only for US-style locales", () => {
        expect(defaultUnitSystem("en-US")).toBe("us");
        expect(defaultUnitSystem("en-GB")).toBe("metric");
        expect(defaultUnitSystem("zh-HK")).toBe("metric");
        expect(defaultUnitSystem(undefined)).toBe("metric");
    });
});

describe("shortUnit", () => {
    it("gives one short spelling per unit and nothing for other words", () => {
        expect(shortUnit("Tablespoons")).toBe("tbsp");
        expect(shortUnit("teaspoon")).toBe("tsp");
        expect(shortUnit("cups")).toBe("cup");
        expect(shortUnit("Grams")).toBe("g");
        expect(shortUnit("litres")).toBe("l");
        expect(shortUnit("lbs")).toBe("lb");
        expect(shortUnit("oz.")).toBe("oz");
        expect(shortUnit("cloves")).toBe("clove");
        expect(shortUnit("large")).toBeUndefined();
    });
});

describe("formatAmount after conversion", () => {
    it("shows converted US spoons as fractions, not decimals", () => {
        const { amount, unit } = convertAmount(4, "ml", "us"); // 0.8 tsp
        expect(`${formatAmount(amount, unit)} ${unit}`).toBe("¾ tsp");
        const cups = convertAmount(500, "ml", "us"); // 2.08 cup
        expect(formatQuantity(cups.amount, cups.unit)).toBe("2⅛ cups");
    });

    it("keeps metric amounts decimal and never blank for a positive amount", () => {
        expect(formatAmount(1.36, "kg")).toBe("1.4");
        expect(formatAmount(0.02, "l")).toBe("0.1");
        expect(formatAmount(0, "g")).toBe("");
    });
});
