// Authenticated visual capture for human/agent review. Logs in (working method),
// captures lists WITH data, detail pages + their sub-tabs, messaging, settings,
// and the AI Copilot bubble open. Screenshots → e2e/.report/cap/.
import { chromium } from "playwright"
import { readFileSync, mkdirSync } from "node:fs"
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const fx = JSON.parse(readFileSync("e2e/.qa-fixture.json", "utf8"))
mkdirSync("e2e/.report/cap", { recursive: true })
const log = []
const note = (s) => { log.push(s); console.log(s) }

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await ctx.newPage()
const errs = []
page.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 100)))

async function shot(name) { await page.screenshot({ path: `e2e/.report/cap/${name}.png`, fullPage: false }).catch(() => {}) }
async function go(route) { await page.goto(BASE + route, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(900) }

try {
  // Login
  await go("/login")
  for (const t of ["Reject non-essential", "Accept all", "Reject", "Accept"]) { const x = page.getByRole("button", { name: t }); if (await x.count()) { await x.first().click().catch(() => {}); break } }
  const email = page.locator('input[name="email"]'), pw = page.locator('input[name="password"]')
  await email.click(); await email.pressSequentially(fx.email, { delay: 8 })
  await pw.click(); await pw.pressSequentially(fx.password, { delay: 8 }); await pw.press("Enter")
  await page.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {})
  note("login → " + page.url())

  // Home + AI bubble
  await go("/app"); await shot("01_home")
  // open AI copilot bubble (floating button bottom-right)
  const bubble = page.locator("button").filter({ has: page.locator("svg") }).last()
  try {
    // try a few likely bubble selectors
    const candidates = ['button[aria-label*="opilot"]', 'button[aria-label*="AI"]', 'button[aria-label*="hat"]']
    let opened = false
    for (const sel of candidates) { const l = page.locator(sel); if (await l.count()) { await l.first().click().catch(() => {}); opened = true; break } }
    if (!opened) { await bubble.click({ timeout: 2000 }).catch(() => {}) }
    await page.waitForTimeout(1200); await shot("02_ai_bubble_open")
    note("ai bubble: attempted open")
  } catch { note("ai bubble: could not open") }

  // Key list pages (with data)
  for (const [route, name] of [
    ["/app/portfolio/properties", "03_properties_list"],
    ["/app/contacts", "04_contacts_list"],
    ["/app/work/tasks", "05_tasks_list"],
    ["/app/work/jobs", "06_jobs_list"],
    ["/app/money/income", "07_income_list"],
    ["/app/compliance/certificates", "08_compliance_list"],
    ["/app/calendar", "09_calendar"],
    ["/app/reports", "10_reports"],
    ["/app/workspace-settings", "11_workspace_settings"],
    ["/app/workspace-settings/subscription", "12_subscription"],
    ["/app/workspace-settings/team", "13_team"],
  ]) { await go(route); await shot(name) }

  // Detail pages + sub-tabs
  async function detailAndTabs(listRoute, linkSel, prefix) {
    await go(listRoute)
    const link = page.locator(linkSel).first()
    if (!(await link.count())) { note(`${prefix}: no detail link`); return }
    await link.click().catch(() => {}); await page.waitForTimeout(1100)
    note(`${prefix} detail → ${page.url().replace(BASE, "")}`)
    await shot(`${prefix}_detail`)
    // sub-tabs: role=tab, or buttons/links in a tablist-ish row
    const tabs = page.locator('[role="tab"], button[data-tab], nav a[href*="?tab="]')
    const n = Math.min(await tabs.count(), 6)
    for (let i = 0; i < n; i++) {
      try { await tabs.nth(i).click({ timeout: 2500 }); await page.waitForTimeout(700); await shot(`${prefix}_tab${i}`) } catch {}
    }
    note(`${prefix}: ${n} sub-tabs captured`)
  }
  await detailAndTabs("/app/portfolio/properties", "a[href*='/portfolio/properties/']", "14_property")
  await detailAndTabs("/app/contacts", "a[href*='/contacts/']", "15_contact")
  await detailAndTabs("/app/work/tasks", "a[href*='/work/tasks/']", "16_task")
  await detailAndTabs("/app/work/jobs", "a[href*='/work/jobs/']", "17_job")

  // Messaging + portals + admin
  for (const [route, name] of [
    ["/tenant-portal", "18_tenant_portal"],
    ["/tenant-portal/messages", "19_tenant_messages"],
    ["/landlord-portal", "20_landlord_portal"],
    ["/supplier-portal", "21_supplier_portal"],
    ["/admin", "22_admin_home"],
    ["/admin/users", "23_admin_users"],
    ["/admin/ai-usage", "24_admin_ai_usage"],
    ["/app/account/security", "25_account_security"],
  ]) { await go(route); await shot(name) }

  note("console errors during capture: " + errs.length + (errs.length ? " e.g. " + errs.slice(0, 2).join(" | ") : ""))
} finally {
  await b.close()
}
console.log("\n=== CAPTURE LOG ===\n" + log.join("\n"))
process.exit(0)
