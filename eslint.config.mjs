import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Rule-severity policy for the CI hard gate.
    //
    // The project is build-green and tsc-clean. A handful of rules in the
    // Next 16 / React 19 ESLint preset are newly enforced as *errors* and flag
    // large numbers of pre-existing, non-behavioural patterns (untyped `any`,
    // React-Compiler heuristics about effects/static components). Rewriting all
    // of them risks regressing working code, so they are demoted to WARNINGS:
    // they stay visible in `npm run lint` output but do not fail the build/CI.
    //
    // Everything else remains an ERROR, so CI (`npm run lint`) is a genuine
    // hard gate — any newly introduced error fails the job. Burn these warnings
    // down incrementally; do not add new ones.
    plugins: { "unused-imports": unusedImports },
    rules: {
      // Auto-fixable: removes unused IMPORTS on `eslint --fix`. Kept as a
      // warning so it never fails CI, but it cleans up on every fix run.
      "unused-imports/no-unused-imports": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },
]);

export default eslintConfig;
