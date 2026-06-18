import { chromium } from "playwright"
const BASE = "http://localhost:3000"
const ts = Date.now()
const pw = "Test1234!pass"
const accounts = {
  supplier: `sup.test.${ts}@example.com`,
  operator: `pm.test.${ts}@example.com`,
}
const results = {}
const b = await chromium.launch()

async function settle(p) {
  await p.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {})
  await p.waitForTimeout(2200)
  await p.getByRole("button", { name: /accept all/i }).click({ timeout: 2500 }).catch(() => {})
  await p.waitForTimeout(300)
}
function kind(url) {
  const u = url.split("?")[0]
  if (u.includes("/onboarding/supplier")) return "SUPPLIER-ONBOARDING"
  if (u.includes("/onboarding")) return "OPERATOR-ONBOARDING"
  if (u.includes("/supplier")) return "SUPPLIER-WORKSPACE"
  if (u.includes("/property-manager") || u.includes("/app")) return "PM-WORKSPACE"
  if (u.includes("/user") || u.includes("/customer")) return "CUSTOMER"
  if (u.includes("/login")) return "STILL-LOGIN"
  if (u.includes("/register")) return "STILL-REGISTER"
  return "OTHER:" + u
}

async function register(intent) {
  const email = accounts[intent]
  const ctx = await b.newContext(); const p = await ctx.newPage()
  async function fill() {
    await p.getByPlaceholder("Your full name").fill(intent === "supplier" ? "Sam Supplier" : "Pat Manager")
    await p.getByPlaceholder("Company name").fill(intent === "supplier" ? "Sam's Trades Ltd" : "Pat Property Co").catch(()=>{})
    await p.locator('input[type="email"]').first().fill(email)
    await p.getByPlaceholder("Create a strong password").fill(pw)
    await p.getByPlaceholder("Repeat your password").fill(pw)
    await p.locator('input[type="checkbox"]').first().check({ force: true }).catch(() => {})
  }
  await p.goto(`${BASE}/register?intent=${intent}`, { waitUntil: "networkidle" }); await settle(p)
  await fill(); await p.waitForTimeout(1500)
  await p.getByRole("button", { name: /create account/i }).click()
  await p.waitForTimeout(1800)
  if (p.url().includes("fullName=") || p.url().includes("/register")) {       // native-GET or stuck → retry slower
    await p.goto(`${BASE}/register?intent=${intent}`, { waitUntil: "networkidle" }); await settle(p)
    await fill(); await p.waitForTimeout(4000)
    await p.getByRole("button", { name: /create account/i }).click()
  }
  await p.waitForURL((u) => !u.toString().includes("/register"), { timeout: 45000 }).catch(() => {})
  await p.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {})
  await p.waitForTimeout(1200)
  const h = await p.locator("h1,h2").first().innerText().catch(() => "(none)")
  await p.screenshot({ path: `scripts/_onb-${intent}.png` })
  results[`register_${intent}`] = { url: p.url(), kind: kind(p.url()), heading: h.replace(/\n/g," ").slice(0,60) }
  await ctx.close()
}

async function login(persona, email, tabName) {
  const ctx = await b.newContext(); const p = await ctx.newPage()
  async function go() {
    await p.goto(`${BASE}/login`, { waitUntil: "networkidle" }); await settle(p)
    await p.getByRole("tab", { name: tabName }).click().catch(async () => { await p.getByText(tabName, { exact: true }).first().click().catch(()=>{}) })
    await p.waitForTimeout(500)
    await p.getByPlaceholder("Enter your email").fill(email)
    await p.getByPlaceholder("Enter your password").fill(pw)
    await p.waitForTimeout(1200)
    await p.getByRole("button", { name: /^sign in$/i }).click()
    await p.waitForTimeout(1800)
  }
  await go()
  if (p.url().includes("email=")) { await go() }   // native-GET retry
  await p.waitForURL((u) => !u.toString().includes("/login"), { timeout: 45000 }).catch(() => {})
  await p.waitForTimeout(1200)
  results[`login_${persona}`] = { url: p.url(), kind: kind(p.url()) }
  await ctx.close()
}

await register("supplier")
await register("operator")
await login("supplier", accounts.supplier, /supplier/i)
await login("operator", accounts.operator, /property manager/i)

await b.close()
console.log("\n===== PERSONA AUTH E2E =====")
console.log("accounts:", JSON.stringify(accounts))
console.log(JSON.stringify(results, null, 2))
