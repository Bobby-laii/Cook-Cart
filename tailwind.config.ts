import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      colors: {
        // Warm café neutrals (`design-cafe`: surface=#F9F7F5, secondary=#E9E3DD, text=#3E2B1E)
        stone: {
          50: "#F9F7F5",
          100: "#F3EEE9",
          200: "#E9E3DD",
          300: "#D8CDC2",
          400: "#B3A291",
          500: "#8A7564",
          600: "#6D5848",
          700: "#564334",
          800: "#46352A",
          900: "#3E2B1E",
          950: "#2A1D14",
        },
        // Espresso primary (`design-cafe`: primary=#5D4432)
        brand: {
          50: "#F8F2ED",
          100: "#EFE3D9",
          200: "#DFC8B6",
          300: "#CAA88E",
          400: "#BC9372",
          500: "#5D4432",
          600: "#4D3829",
          700: "#3F2E21",
          800: "#33251B",
          900: "#281C14",
        },
        // Warm latte / caramel replaces harsh yellow-amber across existing pages
        amber: {
          50: "#FBF6F0",
          100: "#F4E9DC",
          200: "#E8D3BA",
          300: "#D9B68E",
          400: "#C59563",
          500: "#A67342",
          600: "#5D4432",
          700: "#4D3829",
          800: "#3E2B1E",
          900: "#2E2016",
          950: "#21160F",
        },
        caramel: {
          50: "#FDF6EC",
          100: "#F9E8CF",
          300: "#E9B97A",
          500: "#C8873A",
          600: "#A86C27",
        },
        fresh: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16A34A",
          700: "#15803d",
        },
      },
      boxShadow: {
        cafe: "0 1px 2px rgba(62,43,30,0.06), 0 8px 24px -12px rgba(62,43,30,0.18)",
        "cafe-lg": "0 2px 4px rgba(62,43,30,0.06), 0 20px 40px -16px rgba(62,43,30,0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
