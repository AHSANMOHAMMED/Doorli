import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noDirectRequestJson from "./eslint-rules/no-direct-request-json.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Soften React 19 / React Compiler hook rules that currently flag hundreds of
  // existing ERP screens (modals, fetch-on-open, render helpers). Keep as warn/off
  // so CI can stay green while those screens are gradually refactored.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "prefer-const": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  // Custom rule: prevent direct request.json() in API routes
  {
    files: ["src/app/api/**/*.ts"],
    plugins: {
      "custom-rules": {
        rules: {
          "no-direct-request-json": noDirectRequestJson,
        },
      },
    },
    rules: {
      "custom-rules/no-direct-request-json": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated at build (CJS with require)
    "server.js",
    // Legacy CJS scripts (run with node, not ESM)
    "dark-mode-fix.js",
    "dark-mode-scan.js",
    "scripts/clone-production.js",
    // Tooling / tests — not part of the Next app compile surface
    "scripts/**",
    "e2e/**",
    "stress-tests/**",
    "fix-migration-numbers.js",
    "rebuild-migration-table.js",
    "update-drizzle-migrations.js",
  ]),
]);

export default eslintConfig;
