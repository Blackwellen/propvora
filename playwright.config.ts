import { defineConfig, devices } from "@playwright/test"

/**
 * Propvora E2E / responsive QA config.
 *
 * Runs the same specs across desktop, tablet and mobile viewports so the
 * no-horizontal-scroll + core-flow assertions cover every breakpoint
 * (MAX-RELEASE / FINAL-AUDIT items 14, 22).
 *
 * Start the app first (`npm run dev` or `npm run build && npm run start`) then
 * `npx playwright test`. baseURL is overridable via E2E_BASE_URL.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/.report" }]],
  use: { baseURL, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-1920", use: { viewport: { width: 1920, height: 1080 } } },
    { name: "desktop-1366", use: { viewport: { width: 1366, height: 768 } } },
    { name: "tablet-ipad", use: { ...devices["iPad (gen 7)"] } },
    { name: "tablet-mini", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile-se", use: { viewport: { width: 375, height: 667 } } },
    { name: "mobile-iphone", use: { ...devices["iPhone 13"] } },
    { name: "mobile-pixel", use: { ...devices["Pixel 5"] } },
  ],
  // Optional: let Playwright start the app. Disabled by default so it reuses a
  // server you already have running. Set E2E_WEBSERVER=1 to enable.
  ...(process.env.E2E_WEBSERVER === "1"
    ? {
        webServer: {
          command: "npm run start",
          url: baseURL,
          timeout: 120_000,
          reuseExistingServer: true,
        },
      }
    : {}),
})
