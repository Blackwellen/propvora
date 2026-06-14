import { chromium } from "playwright"
import { readFileSync, mkdirSync } from "node:fs"
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const fx = JSON.parse(readFileSync("e2e/.qa-fixture.json", "utf8"))
const ids = JSON.parse(readFileSync("e2e/.ids.json", "utf8"))
mkdirSync("e2e/.report/cap2", { recursive: true })
const log = []; const note = (s) => { log.push(s); console.log(s) }
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage()
const errs = []; page.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 80)))
const shot = (n) => page.screenshot({ path: `e2e/.report/cap2/${n}.png` }).catch(() => {})
const go = async (r) => { await page.goto(BASE + r, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(1000) }

async function dismissTour() {
  for (let i = 0; i < 4; i++) {
    const skip = page.getByRole("button", { name: /skip|finish|done|got it|close/i })
    if (await skip.count()) { await skip.first().click().catch(() => {}); await page.waitForTimeout(400) }
    else break
  }
  // also press Escape in case a modal lingers
  await page.keyboard.press("Escape").catch(() => {})
}

try {
  await go("/login")
  for (const t of ["Reject non-essential", "Accept all", "Reject", "Accept"]) { const x = page.getByRole("button", { name: t }); if (await x.count()) { await x.first().click().catch(() => {}); break } }
  const email = page.locator('input[name="email"]'), pw = page.locator('input[name="password"]')
  await email.click(); await email.pressSequentially(fx.email, { delay: 8 })
  await pw.click(); await pw.pressSequentially(fx.password, { delay: 8 }); await pw.press("Enter")
  await page.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(1200)
  await dismissTour()
  note("login + tour dismissed → " + page.url())
  await shot("00_home_clean")

  // AI bubble open
  await dismissTour()
  const bubbleSels = ['button[aria-label*="opilot" i]', 'button[aria-label*="assistant" i]', 'button[aria-label*="chat" i]', 'button[aria-label*="AI" i]']
  let opened = false
  for (const s of bubbleSels) { const l = page.locator(s); if (await l.count()) { await l.first().click().catch(() => {}); opened = true; note("ai bubble via " + s); break } }
  if (!opened) { // click bottom-right-most fixed button
    const btns = page.locator("button"); const n = await btns.count()
    for (let i = n - 1; i >= Math.max(0, n - 8); i--) { const box = await btns.nth(i).boundingBox().catch(() => null); if (box && box.x > 1100 && box.y > 700) { await btns.nth(i).click().catch(() => {}); opened = true; note("ai bubble via position"); break } }
  }
  await page.waitForTimeout(1500); await shot("01_ai_bubble_open"); note("ai opened=" + opened)
  await page.keyboard.press("Escape").catch(() => {})

  // Detail pages (direct URLs) + sub-tabs
  const details = [
    ["/app/portfolio/properties/" + ids.properties, "property"],
    ["/app/portfolio/units/" + ids.property_units, "unit"],
    ["/app/contacts/" + ids.contacts, "contact"],
    ["/app/work/tasks/" + ids.tasks, "task"],
    ["/app/work/jobs/" + ids.jobs, "job"],
    ["/app/portfolio/tenancies/" + ids.tenancies, "tenancy"],
  ]
  for (const [url, name] of details) {
    if (url.endsWith("null")) { note(name + ": no id"); continue }
    await go(url); await dismissTour()
    note(`${name} detail → ${page.url().replace(BASE, "")} (status via dom)`)
    await shot(`detail_${name}`)
    // sub-tabs: clickable tab-like elements
    const tabs = page.locator('[role="tab"], button[data-tab], [data-testid*="tab"]')
    let n = await tabs.count()
    if (!n) { // fallback: buttons in a horizontal tab row that aren't the primary actions
      const alt = page.locator('nav button, .border-b button, [class*="tab" i] button')
      n = Math.min(await alt.count(), 6)
      for (let i = 0; i < n; i++) { try { await alt.nth(i).click({ timeout: 1500 }); await page.waitForTimeout(500); await shot(`detail_${name}_tab${i}`) } catch {} }
    } else {
      n = Math.min(n, 6)
      for (let i = 0; i < n; i++) { try { await tabs.nth(i).click({ timeout: 1500 }); await page.waitForTimeout(500); await shot(`detail_${name}_tab${i}`) } catch {} }
    }
    note(`${name}: ${n} tabs tried`)
  }

  // Messaging surfaces
  await go("/tenant-portal/messages"); await shot("msg_tenant")
  await go("/app/contacts/" + ids.contacts + "?tab=messages"); await dismissTour(); await shot("msg_contact")

  note("console errors: " + errs.length + (errs.length ? " | " + [...new Set(errs)].slice(0, 3).join(" || ") : ""))
} finally { await b.close() }
console.log("\n=== LOG ===\n" + log.join("\n"))
process.exit(0)
