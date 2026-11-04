import { describe, it, expect } from "vitest";
import {
    parseMeasure,
    splitInstructions,
    mealToDish,
    normaliseMeasure,
    mergeIngredients,
    parseTimerSeconds,
} from "@/lib/recipes/mealdb";
import { formatAmount, formatQuantity } from "@/lib/units";

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
            { name: "soy sauce", amount: 0.75, unit: "cup" },
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
    it("takes the oven flag for known dishes from the data file", () => {
        const dish = mealToDish({
            idMeal: "52772",
            strMeal: "Teriyaki Chicken Casserole",
            strMealThumb: "https://www.themealdb.com/images/media/meals/x.jpg",
            strInstructions: "Cook it.",
        });
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
        expect(dish.needsOven).toBe(true);
    });
});

// TheMealDB 53366, Beef and Broccoli Stir-Fry, as the API returns it.
const BEEF_AND_BROCCOLI = {
    idMeal: "53366",
    strMeal: "Beef and Broccoli Stir-Fry",
    strMealThumb: "https://www.themealdb.com/images/media/meals/x.jpg",
    strArea: "Chinese",
    strInstructions:
        "Marinate the beef:\r\nStir together the beef marinade ingredients (1 teaspoon soy sauce, 1 teaspoon Chinese rice wine, 1/2 teaspoon cornstarch, 1/8 teaspoon black pepper) in a medium bowl.\r\n\r\nAdd the beef slices and stir until coated. Let stand for 10 minutes.\r\n\r\nPrepare the sauce:\r\nStir together the sauce ingredients (2 tablespoons oyster sauce, 1 teaspoon Chinese rice wine, 1 teaspoon soy sauce, 1/4 cup chicken broth) in a small bowl. Set aside.\r\n\r\nBlanch or steam the broccoli:\r\nBring a pot of water to a boil. Add the broccoli and cook until crisp-tender, about 2 minutes. Drain thoroughly.\r\n\r\nStir-fry the beef:\r\nHeat a large frying pan or wok over high heat until a bead of water sizzles and instantly evaporates upon contact. Add the cooking oil and swirl to coat.\r\n\r\nAdd the beef and immediately spread it out all over the surface of the wok or pan in a single layer (preferably not touching).\r\n\r\nLet the beef fry undisturbed for 1 minute. Flip the beef slices over, add the garlic to the pan, and fry for an additional 30 seconds to 1 minute until no longer pink.\r\n\r\nAdd the sauce, cornstarch, and broccoli:\r\nPour in the sauce and the cornstarch slurry (1 teaspoon cornstarch dissolved in 1 tablespoon of water). Stir until the sauce boils and thickens, about 30 seconds. Stir in the broccoli.\r\n\r\nServe immediately, with steamed rice or on its own.",
    strIngredient1: "Soy Sauce", strMeasure1: "1 tsp",
    strIngredient2: "Dry sherry", strMeasure2: "1 tsp",
    strIngredient3: "Cornstarch", strMeasure3: "1/2 tsp",
    strIngredient4: "Black Pepper", strMeasure4: "1/8 teaspoon",
    strIngredient5: "Sirloin steak", strMeasure5: "1 lb",
    strIngredient6: "Oyster Sauce", strMeasure6: "2 tablespoons",
    strIngredient7: "Dry sherry", strMeasure7: "1 tsp",
    strIngredient8: "Soy Sauce", strMeasure8: "1 tablespoon",
    strIngredient9: "Chicken Stock", strMeasure9: "1/4 cup",
    strIngredient10: "Broccoli", strMeasure10: "1 lb",
    strIngredient11: "High Heat Cooking Oil", strMeasure11: "2 tablespoons",
    strIngredient12: "Garlic", strMeasure12: "2 cloves minced",
    strIngredient13: "Cornstarch", strMeasure13: "1 tsp",
    strIngredient14: "Water", strMeasure14: "1 tablespoon",
    strIngredient15: "", strMeasure15: "",
};

describe("step section headers and numbering", () => {
    it("turns a header line into the title of the next step instead of a step", () => {
        const steps = splitInstructions(BEEF_AND_BROCCOLI.strInstructions);
        expect(steps.map((s) => s.text).some((t) => t.endsWith(":"))).toBe(false);
        expect(steps).toHaveLength(9);
        expect(steps[0].title).toBe("Marinate the beef");
        expect(steps[0].text).toMatch(/^Stir together the beef marinade/);
        expect(steps[1].title).toBe("Step 2");
        expect(steps[2].title).toBe("Prepare the sauce");
        expect(steps[7].title).toBe("Add the sauce, cornstarch, and broccoli");
        expect(steps.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("strips 1. / Step 1: numbering and drops numbered-only and empty lines", () => {
        const steps = splitInstructions("1. In a bowl, whisk the eggs.\r\n2) Heat the pan.\r\nStep 3: Pour in the eggs.\r\nSTEP 4 -\r\nFold and serve.\r\n5.\r\n\r\n  \r\n");
        expect(steps.map((s) => s.text)).toEqual([
            "In a bowl, whisk the eggs.",
            "Heat the pan.",
            "Pour in the eggs.",
            "Fold and serve.",
        ]);
    });

    it("keeps a header across a bare STEP line and reads all-caps headers", () => {
        const steps = splitInstructions("For the sauce:\r\nSTEP 1\r\nMix the soy and sugar.\r\nFOR THE NOODLES\r\nBoil the noodles.");
        expect(steps.map((s) => s.title)).toEqual(["For the sauce", "For the noodles"]);
    });

    it("does not mistake a step with a colon inside it for a header", () => {
        const steps = splitInstructions("Make the dressing: whisk oil and lemon.\r\nToss the salad.");
        expect(steps).toHaveLength(2);
        expect(steps[0].text).toBe("Make the dressing: whisk oil and lemon.");
        // A dangling header at the end has no step to name, so it is dropped.
        expect(splitInstructions("Cook the rice.\r\nTo serve:")).toHaveLength(1);
    });
});

describe("step timers", () => {
    it("reads minutes, hours, seconds and mixed numbers", () => {
        expect(parseTimerSeconds("Let stand for 10 minutes.")).toBe(600);
        expect(parseTimerSeconds("Simmer for 1 hour.")).toBe(3600);
        expect(parseTimerSeconds("Braise for 1 1/2 hours.")).toBe(5400);
        expect(parseTimerSeconds("Roast for 1½ hrs")).toBe(5400);
        expect(parseTimerSeconds("Rest for 1 hour 30 minutes")).toBe(5400);
        expect(parseTimerSeconds("about 30 seconds")).toBe(30);
        expect(parseTimerSeconds("cook for one minute once boiling")).toBe(60);
        expect(parseTimerSeconds("leave for half an hour")).toBe(1800);
    });

    it("uses the lower bound of a range", () => {
        expect(parseTimerSeconds("Bake for 30-40 mins until golden.")).toBe(1800);
        expect(parseTimerSeconds("Cook 2 to 3 minutes per side.")).toBe(120);
        expect(parseTimerSeconds("fry for 30 seconds to 1 minute")).toBe(30);
    });

    it("gives no timer for overnight, vague or missing durations", () => {
        expect(parseTimerSeconds("Marinate overnight in the fridge.")).toBeUndefined();
        expect(parseTimerSeconds("Cook for a few minutes.")).toBeUndefined();
        expect(parseTimerSeconds("Preheat oven to 350° F.")).toBeUndefined();
        expect(parseTimerSeconds("Cut into 2 cm pieces.")).toBeUndefined();
    });

    it("puts the first duration of each MealDB step on that step", () => {
        const steps = splitInstructions(BEEF_AND_BROCCOLI.strInstructions);
        expect(steps[1].timerSeconds).toBe(600);
        expect(steps[3].timerSeconds).toBe(120);
        expect(steps[6].timerSeconds).toBe(60);
        expect(steps[0].timerSeconds).toBeUndefined();
    });
});

describe("measure normalising", () => {
    it("shortens unit spellings", () => {
        expect(normaliseMeasure("4 Tablespoons")).toEqual({ amount: 4, unit: "tbsp" });
        expect(normaliseMeasure("1/8 teaspoon")).toEqual({ amount: 0.13, unit: "tsp" });
        expect(normaliseMeasure("2 cups")).toEqual({ amount: 2, unit: "cup" });
        expect(normaliseMeasure("200g")).toEqual({ amount: 200, unit: "g" });
        expect(normaliseMeasure("1 kg")).toEqual({ amount: 1, unit: "kg" });
        expect(normaliseMeasure("500 millilitres")).toEqual({ amount: 500, unit: "ml" });
        expect(normaliseMeasure("2 lbs")).toEqual({ amount: 2, unit: "lb" });
        expect(normaliseMeasure("8 ounces")).toEqual({ amount: 8, unit: "oz" });
    });

    it("splits a preparation note off the unit", () => {
        expect(normaliseMeasure("2 cloves minced")).toEqual({ amount: 2, unit: "clove", note: "minced" });
        expect(normaliseMeasure("Pinch")).toEqual({ amount: 1, unit: "pinch" });
    });

    it("keeps unknown words readable and marks quantity-less measures", () => {
        expect(normaliseMeasure("2 large")).toEqual({ amount: 2, unit: "large" });
        expect(normaliseMeasure("1 (12 oz.)")).toEqual({ amount: 1, unit: "(12 oz.)" });
        expect(normaliseMeasure("To taste")).toEqual({ amount: 0, unit: "", note: "to taste" });
        expect(normaliseMeasure("")).toEqual({ amount: 0, unit: "" });
    });
});

describe("duplicate ingredients", () => {
    it("merges repeated names into one row so React keys stay unique", () => {
        const dish = mealToDish(BEEF_AND_BROCCOLI);
        const names = dish.extraIngredientsNeeded.map((i) => i.name.toLowerCase());
        expect(new Set(names).size).toBe(names.length);
        const find = (n: string) => dish.extraIngredientsNeeded.find((i) => i.name === n)!;
        // 1 tsp + 1 tbsp = 4 tsp = 1⅓ tbsp
        expect(find("Soy Sauce").unit).toBe("tbsp");
        expect(formatQuantity(find("Soy Sauce").amount, find("Soy Sauce").unit)).toBe("1⅓ tbsp");
        expect(find("Dry sherry")).toMatchObject({ amount: 2, unit: "tsp" });
        expect(find("Cornstarch")).toMatchObject({ amount: 1.5, unit: "tsp" });
        expect(find("Garlic")).toMatchObject({ amount: 2, unit: "clove", note: "minced" });
    });

    it("matches names regardless of case and spacing", () => {
        const out = mergeIngredients([
            { name: "Soy Sauce", amount: 2, unit: "tbsp" },
            { name: " soy  sauce ", amount: 1, unit: "tbsp" },
        ]);
        expect(out).toEqual([{ name: "Soy Sauce", amount: 3, unit: "tbsp" }]);
    });

    it("keeps both amounts when the units can't be added", () => {
        const out = mergeIngredients([
            { name: "Ginger", amount: 2, unit: "tbsp" },
            { name: "ginger", amount: 1, unit: "piece" },
            { name: "Ginger", amount: 1, unit: "tsp" },
        ]);
        expect(out).toHaveLength(1);
        expect(out[0].amount).toBeCloseTo(2 + 1 / 3);
        expect(out[0].unit).toBe("tbsp");
        expect(out[0].also).toEqual([{ amount: 1, unit: "piece" }]);
    });

    it("lets a real amount replace a missing one", () => {
        const out = mergeIngredients([
            { name: "Salt", amount: 0, unit: "", note: "to taste" },
            { name: "Salt", amount: 1, unit: "tsp" },
        ]);
        expect(out).toEqual([{ name: "Salt", amount: 1, unit: "tsp", note: "to taste" }]);
    });
});

describe("amounts as shown", () => {
    it("rounds to kitchen fractions", () => {
        expect(formatAmount(0.13, "tsp")).toBe("⅛");
        expect(formatAmount(0.125)).toBe("⅛");
        expect(formatAmount(0.33)).toBe("⅓");
        expect(formatAmount(0.66)).toBe("⅔");
        expect(formatAmount(2.5)).toBe("2½");
        expect(formatAmount(0.97)).toBe("1");
        expect(formatAmount(0.01)).toBe("⅛");
        expect(formatAmount(12.4)).toBe("12½");
        expect(formatAmount(1.36, "kg")).toBe("1.4");
        expect(formatAmount(453.6, "g")).toBe("454");
    });

    it("pluralises count units and leaves quantity-less amounts blank", () => {
        expect(formatQuantity(2, "clove")).toBe("2 cloves");
        expect(formatQuantity(0.5, "cup")).toBe("½ cup");
        expect(formatQuantity(1.5, "cup")).toBe("1½ cups");
        expect(formatQuantity(0, "")).toBe("");
        expect(formatQuantity(3, "")).toBe("3");
    });

    it("never shows more than 2 decimals for any scaled MealDB amount", () => {
        const dish = mealToDish(BEEF_AND_BROCCOLI);
        for (const scale of [0.5, 1 / 3, 0.75, 1, 1.5, 2, 3, 7 / 3]) {
            for (const i of dish.extraIngredientsNeeded) {
                const shown = formatQuantity(i.amount * scale, i.unit);
                expect(shown).not.toMatch(/\d\.\d{3,}/);
                expect(shown).not.toMatch(/^0\.\d/);
            }
        }
        for (let v = 0.01; v < 30; v += 0.037) {
            for (const unit of ["tsp", "cup", "g", "kg", "", "clove"]) {
                expect(formatAmount(v, unit)).toMatch(/^(\d+(\.\d{1,2})?|\d*[⅛¼⅓½⅔¾])$/);
            }
        }
    });
});

// Imports are hoisted; kept here so this block only appends to the file.
import { MENU_NEEDS_OVEN } from "@/lib/recipes/mealdbMeta";
import { MENU_DESCRIPTIONS } from "@/lib/recipes/mealdbDescriptions";

describe("menu descriptions", () => {
    const ids = Object.keys(MENU_NEEDS_OVEN);

    it("has a description for every menu dish", () => {
        expect(ids.length).toBeGreaterThan(0);
        for (const id of ids) {
            expect(MENU_DESCRIPTIONS[id], `meal ${id}`).toBeTruthy();
        }
    });

    it("keeps each description to one short, plain sentence", () => {
        for (const [id, text] of Object.entries(MENU_DESCRIPTIONS)) {
            const label = `meal ${id}: ${text}`;
            expect(text.length, label).toBeLessThanOrEqual(120);
            expect(text.endsWith("."), label).toBe(true);
            // One sentence: the only sentence-ending mark is the final full stop.
            expect(text.slice(0, -1), label).not.toMatch(/[.!?](\s|$)/);
            expect(text, label).not.toMatch(/[!·—]/);
            expect(text, label).not.toMatch(/\b(delicious|perfect|classic|best)\b/i);
        }
    });

    it("is used by mealToDish", () => {
        expect(MENU_DESCRIPTIONS[BEEF_AND_BROCCOLI.idMeal]).toBeTruthy();
        expect(mealToDish(BEEF_AND_BROCCOLI).description).toBe(MENU_DESCRIPTIONS[BEEF_AND_BROCCOLI.idMeal]);
        expect(mealToDish({ ...BEEF_AND_BROCCOLI, idMeal: "99999999" }).description).toBe("");
    });
});
