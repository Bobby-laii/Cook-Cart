import type { Config } from "tailwindcss";

/**
 * BON TASTE Design System — `design-clean` skill + BON TASTE Logo Palette
 *
 * Foundations from `.agents/skills/design-clean`:
 *   - Visual style: minimal, clean, ample whitespace, 8pt baseline spacing grid
 *   - Typography: primary=Roboto, display=Poppins, mono=Inconsolata
 *                 + Cormorant Garamond for the BON TASTE classical serif wordmark
 *   - Surface: #FFFFFF / #F8F9FA   Text: #0F2A3D / #111827
 *   - Semantic: success=#16A34A, warning=#D97706, danger=#DC2626
 *
 * Colors extracted directly from the BON TASTE logo:
 *   - Deep Midnight Navy ("B O N" & outer plate ring): #0F2A3D
 *   - Refined Slate-Blue ("T A S T E" & rules):        #4E7B94
 *   - Soft Plate Ring Blue (inner plate circle):       #7DA3B8
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-roboto)", "var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "var(--font-roboto)", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["var(--font-inconsolata)", "ui-monospace", "monospace"],
      },
      colors: {
        // Clean porcelain & slate neutrals (`design-clean`: surface=#FFFFFF, text=#111827/#0F2A3D)
        stone: {
          50: "#F8F9FA",
          100: "#F1F5F8",
          200: "#E2E8EE",
          300: "#CBD5DF",
          400: "#94A6B8",
          500: "#64788B",
          600: "#475B6D",
          700: "#2D4255",
          800: "#1B3244",
          900: "#0F2A3D", // BON TASTE deep navy ink
          950: "#091B28",
        },
        // BON TASTE slate-blue & navy primary scale
        brand: {
          50: "#F2F7FA",
          100: "#E3EEF4",
          200: "#C5DCE8",
          300: "#7DA3B8", // inner plate ring blue
          400: "#628FA8",
          500: "#4E7B94", // "TASTE" signature slate-blue
          600: "#3B647B",
          700: "#2B4E63",
          800: "#1B3A4B",
          900: "#0F2A3D", // "BON" deep navy
        },
        // Harmonize existing amber-* utility classes across inner pages to the logo's slate-blue
        amber: {
          50: "#F2F7FA",
          100: "#E3EEF4",
          200: "#C5DCE8",
          300: "#7DA3B8",
          400: "#628FA8",
          500: "#4E7B94",
          600: "#3B647B",
          700: "#2B4E63",
          800: "#1B3A4B",
          900: "#0F2A3D",
          950: "#091B28",
        },
        caramel: {
          50: "#F2F7FA",
          100: "#E3EEF4",
          300: "#7DA3B8",
          500: "#4E7B94",
          600: "#0F2A3D",
        },
        fresh: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          500: "#22C55E",
          600: "#16A34A", // `design-clean` success token
          700: "#15803D",
        },
      },
      boxShadow: {
        clean: "0 1px 2px rgba(15, 42, 61, 0.04), 0 4px 16px -4px rgba(15, 42, 61, 0.06)",
        "clean-lg": "0 2px 4px rgba(15, 42, 61, 0.04), 0 12px 32px -8px rgba(15, 42, 61, 0.10)",
        cafe: "0 1px 2px rgba(15, 42, 61, 0.04), 0 4px 16px -4px rgba(15, 42, 61, 0.06)",
        "cafe-lg": "0 2px 4px rgba(15, 42, 61, 0.04), 0 12px 32px -8px rgba(15, 42, 61, 0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
