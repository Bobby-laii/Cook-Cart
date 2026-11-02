import { describe, it, expect } from "vitest";
import { APP_CONFIG } from "@/config/appConfig";

/**
 * Guards for the cuisine picker.
 *
 * The dropdown used to render `{c.label} ({c.region})` from a single mixed
 * string like "Cantonese (粵菜)", which displayed English and Chinese at the
 * same time regardless of the user's language, and appended a continent.
 * These tests pin the two rules that fixed it, because both are easy to
 * regress by pasting a bilingual label back into the config.
 */
describe("Cuisine preference options", () => {
    const cuisines = APP_CONFIG.cuisines;

    it("gives every option a separate English and Chinese label", () => {
        for (const c of cuisines) {
            expect(c.label, `${c.id} is missing label`).toBeTruthy();
            expect(c.labelZh, `${c.id} is missing labelZh`).toBeTruthy();
        }
    });

    it("keeps Chinese characters out of the English label", () => {
        // A mixed label defeats the point: the UI picks one language, so a CJK
        // fragment baked into `label` would show up for English users.
        const cjk = /[\u3400-\u9FFF\uF900-\uFAFF]/;
        for (const c of cuisines) {
            expect(cjk.test(c.label), `${c.id} label contains CJK: "${c.label}"`).toBe(false);
        }
    });

    it("keeps Latin text out of the Chinese label", () => {
        for (const c of cuisines) {
            // The Surprise Me option is emoji + Chinese, no Latin letters.
            expect(/[A-Za-z]/.test(c.labelZh), `${c.id} labelZh contains Latin: "${c.labelZh}"`).toBe(false);
        }
    });

    it("never embeds the continent in the label text", () => {
        // The old label read "Cantonese (粵菜)" and the UI appended " (Asia)" on top
        // of that, so every option ended in a continent. The rule is that the label
        // carries no parenthesised suffix at all.
        //
        // Note: this deliberately does NOT assert `!label.includes(region)` — the
        // broad style "Asian Food" contains "Asia" as part of the dish name, which
        // is correct and must not be flagged.
        for (const c of cuisines) {
            expect(c.label, `${c.id} has a parenthesised suffix: "${c.label}"`).not.toContain("(");
            expect(c.label, `${c.id} has a bracket suffix: "${c.label}"`).not.toContain("[");
            expect(c.labelZh, `${c.id} labelZh has a parenthesised suffix`).not.toContain("(");
        }
    });

    it("offers country-agnostic styles alongside specific cuisines", () => {
        const broad = cuisines.filter((c) => c.broadStyle);
        expect(broad.length).toBeGreaterThanOrEqual(2);
        expect(broad.map((c) => c.label)).toEqual(
            expect.arrayContaining(["Asian Food", "Western Food"])
        );
    });

    it("uses unique ids", () => {
        const ids = cuisines.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("keeps the default selection ('cantonese') selectable", () => {
        // QuickStartForm initialises `useState("cantonese")`. If that id ever
        // disappears the select renders with no matching option and silently
        // desyncs from the state.
        expect(cuisines.some((c) => c.id === "cantonese")).toBe(true);
    });
});
