import { chromium } from "playwright"

const BASE = "http://localhost:3000"
const ts = Date.now()
const email = `cust.test.${ts}@example.com`
const pw = "Test1234!pass"
const results = {}

function destKind(fullUrl) {
  const url = fullUrl.split("?")[0] // ignore query (e.g. ?redirectTo=/supplier)
  if (url.includes("/user") || url.includes("/customer")) return "CUSTOMER ✓"
  if (url.includes("/supplier")) return "SUPPLIER ✗"
  if (url.includes("/property-manager") || url.includes("/app")) return "PM ✗"
  if (url.includes("/onboarding")) return "ONBOARDING ✗"
  if (url.includes("/login")) return "STILL ON LOGIN ✗"
  if (url.includes("/register")) return "STILL ON REGISTER ✗"
  return "OTHER: " + url
}

const browser = await chromium.launch()

// Wait for Next.js client hydration so React's onSubmit (preventDefault) is
// attached — otherwise a click triggers a native GET form submit.
async function settle(p) {
  await p.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {})
  await p.waitForTimeout(1800)
  // Dismiss the cookie-consent banner so it can't intercept the submit click.
  await p.getByRole("button", { name: /accept all/i }).click({ timeout: 2500 }).catch(() => {})
  await p.waitForTimeout(300)
}
async function err(p) {
  return (await p.locator('[class*="red-7"], [class*="red-5"]').allInnerTexts().catch(() => [])).join(" | ").slice(0, 200)
}

// ── TEST 1: Register as customer ──────────────────────────────────────────────
try {
  const ctx = await browser.newContext()
  const p = await ctx.newPage()
  await p.goto(`${BASE}/register?intent=customer`, { waitUntil: "domcontentloaded" }); await settle(p)
  await p.getByPlaceholder("Your full name").fill("Test Customer")
  await p.locator('input[type="email"]').first().fill(email)
  await p.getByPlaceholder("Create a strong password").fill(pw)
  await p.getByPlaceholder("Repeat your password").fill(pw)
  // Tick the TERMS checkbox directly (cookie banner already dismissed in settle).
  await p.locator('input[type="checkbox"]').first().check({ force: true }).catch(() => {})
  await p.waitForTimeout(2500) // ensure react-hook-form is hydrated before submit
  // Submit via the React handler; if a native GET slips through, retry once.
  await p.getByRole("button", { name: /create account/i }).click()
  await p.waitForTimeout(1500)
  if (p.url().includes("fullName=")) {
    await p.goto(`${BASE}/register?intent=customer`, { waitUntil: "networkidle" }); await settle(p)
    await p.getByPlaceholder("Your full name").fill("Test Customer")
    await p.locator('input[type="email"]').first().fill(email)
    await p.getByPlaceholder("Create a strong password").fill(pw)
    await p.getByPlaceholder("Repeat your password").fill(pw)
    await p.locator('input[type="checkbox"]').first().check({ force: true }).catch(() => {})
    await p.waitForTimeout(3500)
    await p.getByRole("button", { name: /create account/i }).click()
  }
  await p.waitForURL((u) => !u.toString().includes("/register"), { timeout: 45000 }).catch(() => {})
  await p.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {})
  results.register = { url: p.url(), verdict: destKind(p.url()), error: await err(p) }
  await p.screenshot({ path: "scripts/_reg-customer.png" })
  await ctx.close()
} catch (e) { results.register = { error: String(e).slice(0, 300) } }

// ── TEST 2: Login as customer (plain) ─────────────────────────────────────────
try {
  const ctx = await browser.newContext()
  const p = await ctx.newPage()
  await p.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" }); await settle(p)
  await p.getByRole("tab", { name: /customer/i }).click().catch(async () => { await p.getByText("Customer", { exact: true }).first().click() })
  await p.getByPlaceholder("Enter your email").fill(email)
  await p.getByPlaceholder("Enter your password").fill(pw)
  await p.getByRole("button", { name: /^sign in$/i }).click()
  await p.waitForURL((u) => !u.toString().includes("/login"), { timeout: 45000 }).catch(() => {})
  await p.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {})
  results.login = { url: p.url(), verdict: destKind(p.url()), error: await err(p) }
  await p.screenshot({ path: "scripts/_login-customer.png" })
  await ctx.close()
} catch (e) { results.login = { error: String(e).slice(0, 300) } }

// ── TEST 3: BUG scenario — login as customer with ?redirectTo=/supplier ────────
try {
  const ctx = await browser.newContext()
  const p = await ctx.newPage()
  await p.goto(`${BASE}/login?redirectTo=/supplier`, { waitUntil: "domcontentloaded" }); await settle(p)
  await p.getByRole("tab", { name: /customer/i }).click().catch(async () => { await p.getByText("Customer", { exact: true }).first().click() })
  await p.getByPlaceholder("Enter your email").fill(email)
  await p.getByPlaceholder("Enter your password").fill(pw)
  await p.getByRole("button", { name: /^sign in$/i }).click()
  await p.waitForURL((u) => !u.toString().includes("/login"), { timeout: 45000 }).catch(() => {})
  await p.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {})
  results.loginWithSupplierRedirect = { url: p.url(), verdict: destKind(p.url()), error: await err(p), note: "picked Customer despite ?redirectTo=/supplier — must NOT land on supplier" }
  await ctx.close()
} catch (e) { results.loginWithSupplierRedirect = { error: String(e).slice(0, 300) } }

await browser.close()
console.log("\n===== CUSTOMER AUTH TEST RESULTS =====")
console.log("test email:", email)
console.log(JSON.stringify(results, null, 2))
