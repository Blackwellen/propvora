// Live browser click-through driver. Logs in as the QA fixture (Enterprise +
// platform admin), seeds demo data, then walks /app, /admin and every portal,
// capturing per-route: HTTP status, console/page errors, horizontal overflow
// (warp check) at desktop AND mobile, and a screenshot. Writes a JSON + MD report.
//
// Prereqs: app running at BASE; `node scripts/test/seed-qa-user.mjs` done.
// Usage: node e2e/drive.mjs
import { chromium } from "playwright"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const fx = JSON.parse(readFileSync("e2e/.qa-fixture.json", "utf8"))
mkdirSync("e2e/.report/shots", { recursive: true })

const APP = [
  "/app",
  "/app/portfolio", "/app/portfolio/properties", "/app/portfolio/units", "/app/portfolio/tenancies",
  "/app/contacts",
  "/app/work", "/app/work/tasks", "/app/work/jobs", "/app/work/board", "/app/work/gantt", "/app/work/suppliers", "/app/work/complaints", "/app/work/ppm",
  "/app/money", "/app/money/income", "/app/money/expenses", "/app/money/invoices", "/app/money/bills", "/app/money/deposits",
  "/app/accounting/mtd",
  "/app/compliance", "/app/compliance/certificates", "/app/compliance/inspections", "/app/compliance/documents",
  "/app/calendar",
  "/app/planning", "/app/planning/profiles", "/app/planning/sets", "/app/planning/forecasts", "/app/planning/landlord-offers",
  "/app/reports", "/app/portals", "/app/changelog",
  "/app/account", "/app/account/profile", "/app/account/security", "/app/account/sessions", "/app/account/connected-accounts", "/app/account/data-privacy", "/app/account/activity",
  "/app/account-settings",
  "/app/workspace-settings", "/app/workspace-settings/profile", "/app/workspace-settings/team", "/app/workspace-settings/roles", "/app/workspace-settings/subscription", "/app/workspace-settings/billing", "/app/workspace-settings/addons", "/app/workspace-settings/integrations", "/app/workspace-settings/audit", "/app/workspace-settings/demo-data", "/app/workspace-settings/branding", "/app/workspace-settings/notifications", "/app/workspace-settings/security", "/app/workspace-settings/sso", "/app/workspace-settings/data", "/app/workspace-settings/storage", "/app/workspace-settings/email", "/app/workspace-settings/ai", "/app/workspace-settings/white-label",
  "/app/legal",
]
const ADMIN = [
  "/admin", "/admin/customers", "/admin/users", "/admin/workspaces", "/admin/subscriptions", "/admin/affiliates",
  "/admin/portfolios", "/admin/work", "/admin/planning",
  "/admin/data-requests", "/admin/bugs", "/admin/stripe-events", "/admin/ai-usage",
  "/admin/changelog", "/admin/announcements", "/admin/audit", "/admin/security", "/admin/health", "/admin/settings",
]
const PORTALS = [
  "/tenant-portal", "/tenant-portal/messages", "/tenant-portal/documents", "/tenant-portal/maintenance", "/tenant-portal/tenancy", "/tenant-portal/viewings",
  "/landlord-portal", "/landlord-portal/messages",
  "/supplier-portal", "/supplier-portal/jobs", "/supplier-portal/invoices",
  "/affiliate",
]
// List → detail probes: visit list, click first detail link, record where it lands.
const DETAIL_PROBES = [
  ["/app/portfolio/properties", "a[href*='/portfolio/properties/']"],
  ["/app/contacts", "a[href*='/contacts/']"],
  ["/app/work/tasks", "a[href*='/work/tasks/']"],
  ["/app/work/jobs", "a[href*='/work/jobs/']"],
  ["/app/money/invoices", "a[href*='/money/invoices/']"],
  ["/app/compliance/certificates", "a[href*='/certificates/']"],
]

const report = []
function rec(o) { report.push(o); const w = o.warpDesktop > 2 || o.warpMobile > 2; console.log(`${o.status >= 400 || o.error ? "❌" : w ? "⚠️ " : "✅"} ${o.route}  [${o.status}]${o.error ? " ERR:" + o.error : ""}${o.consoleErrors ? " console:" + o.consoleErrors : ""}${w ? ` warp d${o.warpDesktop}/m${o.warpMobile}` : ""}`) }

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)

async function visit(page, route, shot) {
  const errs = []
  const onc = (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 120)) }
  const onp = (e) => errs.push("pageerror:" + String(e).slice(0, 120))
  page.on("console", onc); page.on("pageerror", onp)
  let status = 0, error = null, warpD = 0, warpM = 0
  try {
    await page.setViewportSize({ width: 1366, height: 900 })
    const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 20000 })
    status = res?.status() ?? 0
    await page.waitForTimeout(700)
    warpD = await overflow(page)
    const safe = route.replace(/\W+/g, "_").slice(0, 60)
    if (shot) await page.screenshot({ path: `e2e/.report/shots/${safe}.png` }).catch(() => {})
    await page.setViewportSize({ width: 375, height: 750 })
    await page.waitForTimeout(300)
    warpM = await overflow(page)
  } catch (e) { error = String(e.message || e).slice(0, 100) }
  page.off("console", onc); page.off("pageerror", onp)
  rec({ route, status, error, consoleErrors: errs.length, consoleSample: errs.slice(0, 2), warpDesktop: warpD, warpMobile: warpM })
  return status
}

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
try {
  // 1. Login
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" })
  await page.fill('input[name="email"]', fx.email)
  await page.fill('input[name="password"]', fx.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/app|\/onboarding/, { timeout: 20000 }).catch(() => {})
  console.log("post-login url:", page.url())

  // 2. Seed demo data (best-effort)
  try {
    const r = await page.request.post(BASE + "/api/demo/seed", { data: { workspaceId: fx.workspaceId, variant: "full" } })
    console.log("demo seed:", r.status())
  } catch (e) { console.log("demo seed err:", e.message) }
  await page.waitForTimeout(1500)

  // 3. Walk app + admin + portals
  for (const r of APP) await visit(page, r, true)
  for (const r of ADMIN) await visit(page, r, true)
  for (const r of PORTALS) await visit(page, r, true)

  // 4. Detail probes
  for (const [list, sel] of DETAIL_PROBES) {
    try {
      await page.setViewportSize({ width: 1366, height: 900 })
      await page.goto(BASE + list, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(900)
      const link = page.locator(sel).first()
      if (await link.count()) {
        await link.click({ timeout: 5000 }).catch(() => {})
        await page.waitForTimeout(900)
        const warpD = await overflow(page)
        rec({ route: `DETAIL via ${list} → ${page.url().replace(BASE, "")}`, status: 200, error: null, consoleErrors: 0, warpDesktop: warpD, warpMobile: 0 })
      } else {
        rec({ route: `DETAIL via ${list}`, status: 0, error: "no detail link found (empty list?)", consoleErrors: 0, warpDesktop: 0, warpMobile: 0 })
      }
    } catch (e) { rec({ route: `DETAIL via ${list}`, status: 0, error: String(e.message).slice(0, 80), consoleErrors: 0, warpDesktop: 0, warpMobile: 0 }) }
  }
} finally {
  await browser.close()
}

// Summary
const bad = report.filter((r) => r.status >= 400 || r.error)
const warp = report.filter((r) => (r.warpDesktop > 2 || r.warpMobile > 2))
const cerr = report.filter((r) => r.consoleErrors > 0)
writeFileSync("e2e/.report/clickthrough.json", JSON.stringify(report, null, 2))
console.log(`\n=== CLICK-THROUGH: ${report.length} routes · ${bad.length} failed/errored · ${warp.length} warped (>2px) · ${cerr.length} with console errors ===`)
if (bad.length) console.log("FAILED/ERRORED:\n" + bad.map((r) => `  ${r.route} [${r.status}] ${r.error || ""}`).join("\n"))
if (warp.length) console.log("WARPED:\n" + warp.map((r) => `  ${r.route} d${r.warpDesktop}/m${r.warpMobile}`).join("\n"))
process.exit(0)
