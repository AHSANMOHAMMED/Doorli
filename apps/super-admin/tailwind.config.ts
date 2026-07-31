import type { Config } from "tailwindcss";

/**
 * Doorli Super Admin — Tailwind Config
 *
 * Color names preserve the original Material Design 3 class names used
 * throughout the 33 pages (bg-surface-container, text-on-surface, etc.),
 * but are now RE-MAPPED to Doorli brand values so the entire app renders
 * in the official Doorli dark theme without touching any page/component.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Core backgrounds ─────────────────────────────────────────────
        background:                   "#060b1c",   // Doorli navy deep
        surface:                      "#0a132e",   // Doorli navy mid
        "surface-dim":                "#030712",   // Doorli deep
        "surface-bright":             "#0f1d3a",
        "surface-variant":            "rgba(255,255,255,0.10)",
        "surface-container-lowest":   "#020610",
        "surface-container-low":      "rgba(255,255,255,0.04)",
        "surface-container":          "rgba(255,255,255,0.06)",
        "surface-container-high":     "rgba(255,255,255,0.09)",
        "surface-container-highest":  "rgba(255,255,255,0.13)",

        // ── Primary (Doorli Blue) ─────────────────────────────────────────
        primary:                      "#185fa5",
        "primary-container":          "rgba(24,95,165,0.25)",
        "primary-fixed":              "#378add",
        "primary-fixed-dim":          "#1a6eb8",
        "on-primary":                 "#ffffff",
        "on-primary-container":       "#a8d0ff",
        "on-primary-fixed":           "#ffffff",
        "on-primary-fixed-variant":   "#c8e1ff",
        "inverse-primary":            "#378add",
        "surface-tint":               "#185fa5",

        // ── Secondary (Doorli Teal) ───────────────────────────────────────
        secondary:                    "#1d9e75",
        "secondary-container":        "rgba(29,158,117,0.22)",
        "secondary-fixed":            "#5dcaa5",
        "secondary-fixed-dim":        "#2faf85",
        "on-secondary":               "#ffffff",
        "on-secondary-container":     "#a0ffe0",
        "on-secondary-fixed":         "#ffffff",
        "on-secondary-fixed-variant": "#b8ffe8",

        // ── Tertiary (Doorli Gold) ────────────────────────────────────────
        tertiary:                     "#fac775",
        "tertiary-container":         "rgba(250,199,117,0.18)",
        "tertiary-fixed":             "#fde4a0",
        "tertiary-fixed-dim":         "#f7c45a",
        "on-tertiary":                "#2a1a00",
        "on-tertiary-container":      "#ffe8b5",
        "on-tertiary-fixed":          "#2a1a00",
        "on-tertiary-fixed-variant":  "#ffe0a0",

        // ── Error (Doorli Rose) ───────────────────────────────────────────
        error:                        "#f2668b",
        "error-container":            "rgba(242,102,139,0.18)",
        "on-error":                   "#ffffff",
        "on-error-container":         "#ffc2d1",

        // ── Text / On-surface ─────────────────────────────────────────────
        "on-background":              "#f4f7fb",
        "on-surface":                 "#f4f7fb",   // Doorli text
        "on-surface-variant":         "#9bb4d0",   // Doorli text-muted
        "inverse-surface":            "#f4f7fb",
        "inverse-on-surface":         "#060b1c",

        // ── Borders / Outlines ────────────────────────────────────────────
        outline:                      "rgba(255,255,255,0.18)",
        "outline-variant":            "rgba(255,255,255,0.10)",

        // ── Brand accent ──────────────────────────────────────────────────
        "doorli-red":                 "#f2668b",
        "doorli-purple":              "#8b5cf6",
        muted:                        "#6b86a6",   // Doorli text-dim
      },

      borderRadius: {
        DEFAULT: "0.75rem",
        sm:   "0.5rem",
        lg:   "0.875rem",
        xl:   "1rem",
        "2xl": "1.25rem",
        full: "9999px",
      },

      spacing: {
        xs:                "4px",
        sm:                "8px",
        md:                "16px",
        lg:                "24px",
        xl:                "32px",
        gutter:            "16px",
        "margin-mobile":   "16px",
        "margin-desktop":  "24px",
        "container-max":   "1440px",
        base:              "4px",
      },

      fontFamily: {
        "body-compact":       ["Inter", "sans-serif"],
        "screen-title":       ["Inter", "sans-serif"],
        "body-main":          ["Inter", "sans-serif"],
        "section-header":     ["Inter", "sans-serif"],
        "label-medium":       ["Inter", "sans-serif"],
        "screen-title-mobile":["Inter", "sans-serif"],
        "kpi-number":         ["Inter", "sans-serif"],
        caption:              ["Inter", "sans-serif"],
      },

      fontSize: {
        "body-compact":        ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "screen-title":        ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "body-main":           ["15px", { lineHeight: "22px", fontWeight: "400" }],
        "section-header":      ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "label-medium":        ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "screen-title-mobile": ["20px", { lineHeight: "28px", fontWeight: "700" }],
        "kpi-number":          ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        caption:               ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" }],
      },

      boxShadow: {
        "doorli-sm": "0 8px 32px rgba(3,7,18,0.45)",
        "doorli-lg": "0 18px 44px -28px rgba(0,0,0,0.85)",
        "primary-glow": "0 6px 22px rgba(24,95,165,0.38)",
      },
    },
  },
  plugins: [],
};

export default config;
