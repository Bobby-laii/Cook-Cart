import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f6",
          100: "#f2e8e5",
          200: "#eaddd7",
          300: "#e0cec7",
          400: "#d2bab0",
          500: "#e05822", // warm terracotta / cooking orange
          600: "#c84715",
          700: "#a6360c",
          800: "#862e0d",
          900: "#6e290f",
        },
        fresh: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e", // vibrant grocery fresh green
          600: "#16a34a",
          700: "#15803d",
        },
      },
    },
  },
  plugins: [],
};
export default config;
