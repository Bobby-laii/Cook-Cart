import { describe, it, expect } from "vitest";
import { hasSpoonacularKey } from "@/lib/recipes/spoonacular";

/**
 * These cover the pure, offline parts of the live recipe client: the key guard
 * and the fail-soft contract. They deliberately do NOT call the network — the
 * free tier is 150 points/day, so a test suite that hit the API would drain the
 * quota and then pass or fail depending on the day's usage.
 *
 * The endpoint and parameter choices (includeIngredients over query, one
 * complexSearch instead of findByIngredients + N x /information) were verified
 * by hand against the live API; the reasoning is recorded in the module header.
 */
describe("Live recipe service: guards and fail-soft behaviour", () => {
    it("reports no key when the env var is absent", () => {
        const saved = process.env.SPOONACULAR_API_KEY;
        delete process.env.SPOONACULAR_API_KEY;
        expect(hasSpoonacularKey()).toBe(false);
        if (saved !== undefined) process.env.SPOONACULAR_API_KEY = saved;
    });

    it("treats a whitespace-only key as missing", () => {
        const saved = process.env.SPOONACULAR_API_KEY;
        process.env.SPOONACULAR_API_KEY = "   ";
        expect(hasSpoonacularKey()).toBe(false);
        if (saved !== undefined) process.env.SPOONACULAR_API_KEY = saved;
        else delete process.env.SPOONACULAR_API_KEY;
    });

    it("detects a configured key", () => {
        const saved = process.env.SPOONACULAR_API_KEY;
        process.env.SPOONACULAR_API_KEY = "abc123";
        expect(hasSpoonacularKey()).toBe(true);
        if (saved !== undefined) process.env.SPOONACULAR_API_KEY = saved;
        else delete process.env.SPOONACULAR_API_KEY;
    });

    it("returns an empty array rather than throwing when no key is set", async () => {
        // Imported lazily so the env mutation above is cleanly scoped.
        const { fetchLiveRecipes } = await import("@/lib/recipes/spoonacular");
        const saved = process.env.SPOONACULAR_API_KEY;
        delete process.env.SPOONACULAR_API_KEY;

        // The contract the chat endpoint depends on: no key means "fall back to
        // the local engine", never an exception that would 500 the request.
        await expect(fetchLiveRecipes(["Salmon"], "Cantonese", 3)).resolves.toEqual([]);

        if (saved !== undefined) process.env.SPOONACULAR_API_KEY = saved;
    }, 20000);

    it("returns an empty array when the ingredient list is empty", async () => {
        const { fetchLiveRecipes } = await import("@/lib/recipes/spoonacular");
        const saved = process.env.SPOONACULAR_API_KEY;
        process.env.SPOONACULAR_API_KEY = "dummy-key-for-guard-test";

        // Must short-circuit before any network call: an empty search would spend
        // a quota point to learn nothing.
        await expect(fetchLiveRecipes([], "Cantonese", 3)).resolves.toEqual([]);

        if (saved !== undefined) process.env.SPOONACULAR_API_KEY = saved;
        else delete process.env.SPOONACULAR_API_KEY;
    }, 20000);
});
