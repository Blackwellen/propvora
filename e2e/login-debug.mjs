import { chromium } from "playwright"
import { readFileSync } from "node:fs"
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const fx = JSON.parse(readFileSync("e2e/.qa-fixture.json", "utf8"))
const b = await chromium.launch()
const p = await (await b.newContext()).newPage()
const errs = []
p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 160)))
p.on("response", (r) => { const u = r.url(); if (/auth|token|rate-check|login/.test(u)) console.log("  resp", r.status(), u.replace(BASE, "").slice(0, 70)) })
await p.goto(BASE + "/login", { waitUntil: "domcontentloaded" })
await p.waitForTimeout(600)
// Dismiss cookie banner so it can't intercept clicks.
for (const t of ["Reject non-essential", "Accept all", "Reject", "Accept"]) {
  const btn = p.getByRole("button", { name: t })
  if (await btn.count()) { await btn.first().click().catch(() => {}); break }
}
await p.waitForTimeout(300)
const email = p.locator('input[name="email"]')
const pw = p.locator('input[name="password"]')
await email.click(); await email.pressSequentially(fx.email, { delay: 10 })
await pw.click(); await pw.pressSequentially(fx.password, { delay: 10 })
console.log("email value:", await email.inputValue(), "| pw len:", (await pw.inputValue()).length)
await pw.press("Enter")
await p.waitForTimeout(5000)
console.log("URL after submit:", p.url())
const errText = await p.locator("text=/incorrect|wrong|invalid|too many|error|failed|required|verify/i").first().textContent().catch(() => null)
console.log("visible error:", errText)
console.log("console errors:", errs.slice(0, 4))
await p.screenshot({ path: "e2e/.report/login-after.png" })
await b.close()
process.exit(0)
