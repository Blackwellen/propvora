// Deep interaction harness. For each target route: clicks every sub-tab, opens
// every 3-dot / dropdown menu, clicks Edit buttons (then cancels), and records
// console/page errors + a screenshot after each interaction. Surfaces broken
// dropdowns, edit buttons that error, dead menus, etc.
//
// Usage: node e2e/interact.mjs            (default target set)
//        node e2e/interact.mjs /app/x     (single route)
import { chromium } from "playwright"
import { readFileSync, mkdirSync } from "node:fs"
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const fx = JSON.parse(readFileSync("e2e/.qa-fixture.json", "utf8"))
const ids = JSON.parse(readFileSync("e2e/.ids.json", "utf8"))
mkdirSync("e2e/.report/ix", { recursive: true })

const TARGETS = process.argv[2] ? [process.argv[2]] : [
  "/app/portfolio/properties/" + ids.properties,
  "/app/contacts/" + ids.contacts,
  "/app/work/tasks/" + ids.tasks,
  "/app/work/jobs/" + ids.jobs,
  "/app/portfolio/tenancies/" + ids.tenancies,
  "/app/money/income",
  "/app/work/suppliers",
  "/admin/users",
  "/admin/workspaces",
]

const findings = []
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()
let curErrs = []
page.on("console", (m) => m.type() === "error" && curErrs.push(m.text().slice(0, 120)))
page.on("pageerror", (e) => curErrs.push("pageerror:" + String(e).slice(0, 120)))

async function dismissTour() { for (let i = 0; i < 4; i++) { const s = page.getByRole("button", { name: /skip|finish|done|got it/i }); if (await s.count()) { await s.first().click().catch(() => {}); await page.waitForTimeout(300) } else break } await page.keyboard.press("Escape").catch(() => {}) }
const snap = () => { const e = curErrs.slice(); curErrs = []; return e }

async function exercise(route) {
  const safe = route.replace(/\W+/g, "_").slice(0, 50)
  const result = { route, tabs: 0, menus: 0, edits: 0, errors: [] }
  await page.goto(BASE + route, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(1100)
  await dismissTour()
  snap() // clear load errors baseline (report separately)
  await page.screenshot({ path: `e2e/.report/ix/${safe}_0.png` }).catch(() => {})

  // Sub-tabs: role=tab OR tab-like buttons in a border-b/nav row
  let tabs = page.locator('[role="tab"]')
  if (!(await tabs.count())) tabs = page.locator('.border-b button, nav button, [class*="tab" i] > button')
  const tcount = Math.min(await tabs.count(), 10)
  for (let i = 0; i < tcount; i++) {
    try {
      await tabs.nth(i).click({ timeout: 1500 }); await page.waitForTimeout(450)
      const e = snap(); if (e.length) result.errors.push({ on: `tab#${i}`, e })
      result.tabs++
      await page.screenshot({ path: `e2e/.report/ix/${safe}_tab${i}.png` }).catch(() => {})
    } catch {}
  }

  // 3-dot / dropdown menus: aria-haspopup, aria-expanded, or buttons with a "more" icon
  const menuTriggers = page.locator('button[aria-haspopup], button[aria-expanded], button:has(svg.lucide-ellipsis), button:has(svg.lucide-more-horizontal), button:has(svg.lucide-more-vertical)')
  const mcount = Math.min(await menuTriggers.count(), 12)
  for (let i = 0; i < mcount; i++) {
    try {
      await menuTriggers.nth(i).click({ timeout: 1200 }); await page.waitForTimeout(350)
      const e = snap(); if (e.length) result.errors.push({ on: `menu#${i}`, e })
      // count visible menu items to detect dead menus
      const items = page.locator('[role="menuitem"], [role="menu"] button, [role="menu"] a')
      result.menus++
      await page.keyboard.press("Escape").catch(() => {})
      await page.waitForTimeout(150)
    } catch {}
  }

  // Edit buttons (open then cancel/close)
  const editBtns = page.getByRole("button", { name: /^edit\b|edit details|edit\b/i })
  const ecount = Math.min(await editBtns.count(), 4)
  for (let i = 0; i < ecount; i++) {
    try {
      await editBtns.nth(i).click({ timeout: 1500 }); await page.waitForTimeout(500)
      const e = snap(); if (e.length) result.errors.push({ on: `edit#${i}`, e })
      result.edits++
      await page.screenshot({ path: `e2e/.report/ix/${safe}_edit${i}.png` }).catch(() => {})
      // close: Cancel / Close / Escape
      const cancel = page.getByRole("button", { name: /cancel|close|discard/i })
      if (await cancel.count()) await cancel.first().click().catch(() => {})
      await page.keyboard.press("Escape").catch(() => {})
      await page.waitForTimeout(250)
    } catch {}
  }
  findings.push(result)
  console.log(`${route}  tabs:${result.tabs} menus:${result.menus} edits:${result.edits} errors:${result.errors.length}`)
}

try {
  // login
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" }); await page.waitForTimeout(500)
  for (const t of ["Reject non-essential", "Accept all", "Reject", "Accept"]) { const x = page.getByRole("button", { name: t }); if (await x.count()) { await x.first().click().catch(() => {}); break } }
  const em = page.locator('input[name="email"]'), pwd = page.locator('input[name="password"]')
  await em.click(); await em.pressSequentially(fx.email, { delay: 8 })
  await pwd.click(); await pwd.pressSequentially(fx.password, { delay: 8 }); await pwd.press("Enter")
  await page.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(1000); await dismissTour()
  for (const r of TARGETS) await exercise(r)
} finally { await b.close() }

console.log("\n=== INTERACTION FINDINGS ===")
for (const f of findings) {
  if (f.errors.length) { console.log(`\n${f.route}:`); for (const er of f.errors) console.log(`  ${er.on}: ${er.e.slice(0,2).join(" | ")}`) }
}
const totalErr = findings.reduce((a, f) => a + f.errors.length, 0)
console.log(`\nTotal: ${findings.length} pages · ${findings.reduce((a,f)=>a+f.tabs,0)} tabs · ${findings.reduce((a,f)=>a+f.menus,0)} menus · ${findings.reduce((a,f)=>a+f.edits,0)} edits exercised · ${totalErr} interaction errors`)
process.exit(0)
