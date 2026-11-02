import { describe, it, expect } from "vitest";
import { toSearchTerms, pollinationsImageUrl } from "@/lib/images/foodImage";

describe("food image search-term extraction", () => {
    it("searches the ingredient that follows the delimiter, not the cuisine", () => {
        const terms = toSearchTerms(
            "Homestyle Cantonese Wok Sauté of Chicken Thighs & Bok Choy"
        );
        // Regression guard: an earlier version took the first two words and searched
        // "cantonese wok", which matches no recipe and silently degraded every dish
        // to a generic stock photo.
        expect(terms[0]).toBe("chicken thighs");
        expect(terms).not.toContain("cantonese wok");
    });

    it("handles titles using 'with' instead of 'of'", () => {
        const terms = toSearchTerms("Savory Claypot-Style Braised Salmon Fillet with Asparagus");
        expect(terms[0]).toBe("salmon fillet");
    });

    it("still produces a usable term for a title with no delimiter", () => {
        const terms = toSearchTerms("Chicken Teriyaki Donburi");
        expect(terms.length).toBeGreaterThan(0);
        expect(terms.some((t) => t.includes("chicken"))).toBe(true);
    });

    it("strips accents rather than truncating the word", () => {
        const terms = toSearchTerms("Wok Sauté of Beef Brisket");
        // "sauté" must become "saute", not be sliced into "saut".
        expect(terms.join(" ")).not.toContain("saut ");
    });

    it("never returns an empty list for a real dish title", () => {
        expect(toSearchTerms("Braised Pork Belly").length).toBeGreaterThan(0);
    });

    it("caps candidates so one dish cannot spam the provider", () => {
        const terms = toSearchTerms(
            "Homestyle Cantonese Wok Sauté of Chicken Thighs Bok Choy Garlic Ginger"
        );
        expect(terms.length).toBeLessThanOrEqual(3);
    });
});

describe("pollinations image URL", () => {
    it("is deterministic for the same dish, so the same dish keeps its photo", () => {
        expect(pollinationsImageUrl("Beef Brisket")).toBe(pollinationsImageUrl("Beef Brisket"));
    });

    it("encodes the prompt so the URL is valid", () => {
        const url = pollinationsImageUrl("Salt & Pepper Squid");
        expect(url).not.toContain(" ");
        expect(url.startsWith("https://image.pollinations.ai/prompt/")).toBe(true);
    });
});
