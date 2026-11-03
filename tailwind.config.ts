import type { Config } from "tailwindcss";

/**
 * Bon Taste design system: "Enamelware". See DESIGN.md for the reasoning.
 *
 *   - stone:  enamel white and pot white (50–200) through navy ink (800–950).
 *             Canvas is stone-100, raised surfaces stone-50 (pure white).
 *   - brand:  cobalt, the enamel rim. Primary actions, active tab, the step card.
 *   - butter: only what is live right now: a running timer, the current step.
 *   - fresh:  herb green, only for "you already have this".
 *   - Type:   Atkinson Hyperlegible, one family, hierarchy by size and weight.
 *
 * `amber` is an alias of `brand` while inner pages written for an earlier palette
 * are rebuilt one by one. Remove it once `grep -r "amber-" src` returns nothing.
 */
const cobalt = {
  50: "#EEF2FC",
  100: "#DCE4F8",
  200: "#B9C8F0",
  300: "#8AA2E3",
  400: "#5577D2",
  500: "#2A4FBF",
  600: "#1D3B9A",
  700: "#18307D",
  800: "#142764",
  900: "#101F4F",
  950: "#0A1433",
};

const sans = ["var(--font-sans)", "PingFang HK", "Noto Sans TC", "ui-sans-serif", "system-ui", "sans-serif"];

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // One family. `serif`, `display` and `mono` point at it too so older classes
        // render in the system instead of falling back to Times or a code font.
        sans,
        serif: sans,
        display: sans,
        mono: sans,
      },
      colors: {
        stone: {
          50: "#FFFFFF",
          100: "#F4F6F8",
          200: "#E3E8EF",
          300: "#CBD3DF",
          400: "#8E99AD",
          500: "#5B6680",
          600: "#47526B",
          700: "#33405A",
          800: "#1F2B47",
          900: "#12204A",
          950: "#0B1533",
        },
        brand: cobalt,
        amber: cobalt,
        butter: {
          100: "#FDF3CC",
          200: "#FBE79A",
          300: "#F8DA6B",
          400: "#F5C842",
          500: "#E6B422",
          700: "#8A6A0A",
        },
        fresh: {
          50: "#E9F5EE",
          100: "#CDEBD8",
          500: "#2E8B57",
          600: "#23744A",
          700: "#1B5C3A",
        },
        danger: "#B3261E",
      },
      fontSize: {
        // 17px body: read at arm's length on a phone propped against the splashback.
        base: ["1.0625rem", { lineHeight: "1.55" }],
      },
      borderRadius: {
        // Hierarchy, not one radius everywhere: buttons 14px, photos 16px, sheets 24px.
        md: "0.875rem",
        lg: "1rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        // The system has no drop shadows; these exist so older classes render flat.
        sm: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        page: "0 0 0 1px #E3E8EF",
      },
    },
  },
  plugins: [],
};
export default config;
