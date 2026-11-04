import type { Config } from "tailwindcss";

/**
 * Bon Taste design system: "Photo first". See DESIGN.md for the reasoning.
 *
 *   - stone:  white paper (50) through warm ink (900). The page is white; food photos
 *             carry the colour.
 *   - brand:  ink by day (primary buttons, active tab, links: deliberately not a hue);
 *             at night it turns herb green, so white button text keeps its contrast.
 *   - butter / fresh: herb green. The only accent: what is live right now (running
 *             timer, current step) and "you already have this". `butter` is kept as
 *             a name for older classes and points at the same herb scale.
 *   - Type:   Newsreader (display: dish names, page titles) + Atkinson Hyperlegible
 *             (everything you read while cooking).
 *
 * `amber` is an alias of `brand` for pages written for older palettes.
 */
/**
 * Every colour is a CSS variable (RGB channels) set in globals.css, so the same class
 * works in light and dark: `bg-stone-50` is white paper by day and a warm near-black at
 * night. Light values are documented in DESIGN.md; dark values live next to them in
 * globals.css. `<alpha-value>` keeps opacity modifiers like `bg-stone-900/40` working.
 */
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
function scale(name: string, steps: readonly number[] = STEPS) {
  return Object.fromEntries(steps.map((n) => [n, `rgb(var(--${name}-${n}) / <alpha-value>)`]));
}
const herbSteps = [50, 100, 200, 300, 400, 500, 600, 700] as const;

const sans = ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"];
const display = ["var(--font-display)", "Georgia", "serif"];

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans,
        serif: display,
        display,
        // Timers keep the reading face; tabular figures come from .font-mono in globals.css.
        mono: sans,
      },
      colors: {
        stone: scale("stone"),
        brand: scale("brand"),
        amber: scale("brand"),
        butter: scale("herb", herbSteps),
        fresh: scale("herb", herbSteps),
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      fontSize: {
        // 17px body: read at arm's length on a phone propped against the splashback.
        base: ["1.0625rem", { lineHeight: "1.55" }],
        // The three reading sizes in DESIGN.md. Use these, not text-[15px] and friends.
        body: ["1.0625rem", { lineHeight: "1.55" }],
        small: ["0.9375rem", { lineHeight: "1.45" }],
        caption: ["0.875rem", { lineHeight: "1.45" }],
      },
      borderRadius: {
        // Magazine-tight corners: photos and buttons 8px, sheets 16px, chips fully round.
        md: "0.5rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1rem",
      },
      boxShadow: {
        // The system has no drop shadows; these exist so older classes render flat.
        sm: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
      },
    },
  },
  plugins: [],
};
export default config;
