import { test, expect, type Page } from "@playwright/test"

/**
 * Responsive smoke: every public route loads and has NO page-level horizontal
 * scroll at any viewport (FINAL-AUDIT rule 0.3 / item 22). These pages need no
 * auth, so this suite runs against any running instance. Authenticated /app,
 * /admin and /portal flows live in separate specs that need seeded accounts
 * (see e2e/README.md).
 */

const PUBLIC_ROUTES = [
  "/",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/affiliate-programme",
  "/legal",
  "/legal/privacy",
  "/legal/terms",
  "/login",
  "/register",
  "/forgot-password",
  "/changelog",
]

/** Asserts the document is not wider than the viewport (allowing a 2px fudge). */
async function expectNoHorizontalScroll(page: Page, route: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  )
  expect(overflow, `${route} has ${overflow}px horizontal overflow`).toBeLessThanOrEqual(2)
}

for (const route of PUBLIC_ROUTES) {
  test(`loads + no horizontal scroll: ${route}`, async ({ page }) => {
    const res = await page.goto(route, { waitUntil: "domcontentloaded" })
    expect(res?.status() ?? 0, `${route} returned ${res?.status()}`).toBeLessThan(400)
    // Let layout settle (fonts/images) before measuring.
    await page.waitForTimeout(400)
    await expectNoHorizontalScroll(page, route)
  })
}
