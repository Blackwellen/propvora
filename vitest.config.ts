import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

/**
 * Vitest config for Propvora unit tests.
 *
 * Scope: PURE logic only (calculators, ledger maths, AI caps, legal notice
 * periods, billing entitlement helpers). No DB, no network, no framework — the
 * live-DB integration suites live in scripts/test/ and run via `test:integration`.
 *
 * The `@/*` alias mirrors tsconfig.json so test imports match app imports.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` is a build-time guard that throws when imported outside a
      // React Server Component bundle. In unit tests we import the pure logic of
      // server modules directly, so stub it out to a harmless empty module.
      "server-only": fileURLToPath(
        new URL("./src/__tests__/__stubs__/server-only.ts", import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // The smoke test uses CommonJS require() and Jest-style describe/it; Vitest
    // provides those globals, so it runs unchanged alongside the new suites.
  },
})
