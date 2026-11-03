import type { Config } from "tailwindcss";

/**
 * BON TASTE design system: "cookbook page".
 *
 * The product is a home cook standing in a Hong Kong kitchen asking what to make
 * with what is already in the fridge. The interface should feel like a well-used
 * recipe book, not a SaaS dashboard: warm paper, dark ink, one food colour, real
 * photos, and hairline rules instead of boxed cards and drop shadows.
 *
 *   - stone:  warm paper (50–200) through ink (800–950). Canvas is stone-100.
 *   - brand:  tomato. The only accent: primary actions, active state, prices that win.
 *   - fresh:  herb green. Only for "you already have this" / success states.
 *   - Type:   Fraunces for headings, Instrument Sans for everything else.
 *
 * `amber` is an alias of `brand` while inner pages written for an earlier palette
 * are rebuilt one by one. Remove it once `grep -r "amber-" src` returns nothing.
 */
const tomato = {
  50: "#FBEFEA",
  100: "#F6DCD2",
  200: "#EDB8A6",
  300: "#E08F75",
  400: "#D3664A",
  500: "#C0452B",
  600: "#A23722",
  700: "#842D1D",
  800: "#66241A",
  900: "#4A1B14",
  950: "#2E110C",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "PingFang HK", "Noto Sans TC", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Songti TC", "Noto Serif TC", "Georgia", "serif"],
        display: ["var(--font-serif)", "Songti TC", "Noto Serif TC", "Georgia", "serif"],
        // Prices and counts use tabular figures in the body face (see globals.css), not a code font.
        mono: ["var(--font-sans)", "PingFang HK", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        stone: {
          50: "#FBF8F2",
          100: "#F4EEE3",
          200: "#E6DDCD",
          300: "#D2C6B2",
          400: "#9A8D78",
          500: "#6F6555",
          600: "#5E5548",
          700: "#463F35",
          800: "#2F2A23",
          900: "#1F1B16",
          950: "#14110D",
        },
        brand: tomato,
        amber: tomato,
        fresh: {
          50: "#EEF2E8",
          100: "#DCE5D0",
          500: "#5F7F45",
          600: "#4B6936",
          700: "#3B5329",
        },
      },
      borderRadius: {
        xl: "0.5rem",
        "2xl": "0.625rem",
        "3xl": "0.75rem",
      },
      boxShadow: {
        page: "0 1px 0 rgba(31, 27, 22, 0.04), 0 8px 24px -12px rgba(31, 27, 22, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
