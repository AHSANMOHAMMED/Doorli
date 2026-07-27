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
        doorli: {
          navy: "var(--doorli-navy)",
          "navy-mid": "var(--doorli-navy-mid)",
          deep: "var(--doorli-deep)",
          blue: "var(--doorli-blue)",
          sky: "var(--doorli-sky)",
          teal: "var(--doorli-teal)",
          mint: "var(--doorli-mint)",
          gold: "var(--doorli-gold)",
          rose: "var(--doorli-rose)",
          text: "var(--doorli-text)",
          muted: "var(--doorli-text-muted)",
          dim: "var(--doorli-text-dim)",
          line: "var(--doorli-line)",
        },
      },
      fontFamily: {
        display: ["var(--font-doorli-display)", "Syne", "system-ui", "sans-serif"],
        sans: ["var(--font-doorli-body)", "Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
