import "dotenv/config"
import { chromium } from "playwright"
import { createClient } from "@supabase/supabase-js"
import { mkdirSync } from "node:fs"

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const email = process.env.CAPTURE_EMAIL
const password = process.env.CAPTURE_PASSWORD
const captureOnly = process.env.CAPTURE_ONLY

if (!email || !password) throw new Error("CAPTURE_EMAIL and CAPTURE_PASSWORD are required")

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const output = "public/images/marketing/product/raw"
mkdirSync(output, { recursive: true })

const { data: userPage, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (usersError) throw usersError
const user = userPage.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase())
if (!user) throw new Error("Capture user was not found")

const { data: profile, error: profileError } = await admin
  .from("profiles")
  .select("current_workspace_id")
  .eq("id", user.id)
  .single()
if (profileError) throw profileError

const originalWorkspaceId = profile.current_workspace_id
const { data: memberships, error: membershipsError } = await admin
  .from("workspace_members")
  .select("workspace_id")
  .eq("user_id", user.id)
if (membershipsError) throw membershipsError

const workspaceIds = memberships.map((membership) => membership.workspace_id)
const { data: workspaces, error: workspacesError } = await admin
  .from("workspaces")
  .select("id,workspace_type")
  .in("id", workspaceIds)
if (workspacesError) throw workspacesError

const operatorWorkspace = workspaces.find((workspace) => workspace.workspace_type === "property-manager")
const supplierWorkspace = workspaces.find((workspace) => workspace.workspace_type === "supplier")
if (!operatorWorkspace) throw new Error("Property-manager workspace was not found")

const workspaceId = operatorWorkspace.id
const findRows = async (table, columns, filters = {}) => {
  let query = admin.from(table).select(columns).eq("workspace_id", workspaceId)
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value)
  const { data, error } = await query.limit(20)
  if (error) throw error
  return data ?? []
}

const properties = await findRows("properties", "id")
const units = await findRows("units", "id")
const tenancies = await findRows("tenancies", "id")
if (!properties[0] || !units[0] || !tenancies[0]) throw new Error("Seeded detail records are missing")

const portalContacts = await findRows("contacts", "id,type,email", {})
const portalTypes = {
  tenant: ["tenant", "post_tenant", "applicant"],
  landlord: ["landlord", "owner", "investor"],
  supplier: ["supplier"],
}
const temporaryContacts = Object.fromEntries(
  Object.entries(portalTypes).map(([persona, types]) => [
    persona,
    portalContacts.find((contact) => types.includes(contact.type)),
  ]),
)

const originalContactEmails = new Map()
for (const contact of Object.values(temporaryContacts)) {
  if (!contact) continue
  originalContactEmails.set(contact.id, contact.email)
  const { error } = await admin.from("contacts").update({ email }).eq("id", contact.id)
  if (error) throw error
}

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  colorScheme: "light",
})
const page = await context.newPage()
const failures = []
const consoleErrors = []
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text())
})
page.on("response", (response) => {
  if (response.status() >= 500) failures.push(`${response.status()} ${response.url()}`)
  if (response.status() === 400) console.log(`HTTP 400 ${response.url()}`)
})

async function settle() {
  await page.waitForLoadState("domcontentloaded")
  await page.waitForTimeout(1400)
  for (const name of ["Reject non-essential", "Accept all", "Close", "Skip", "Not now"]) {
    const button = page.getByRole("button", { name, exact: true })
    if (await button.count()) await button.first().click().catch(() => {})
  }
  await page.waitForTimeout(300)
}

async function applyDemoIdentity() {
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const node of nodes) {
      if (!node.textContent) continue
      node.textContent = node.textContent
        .replace(/jamahlthomas1996@gmail\.com/gi, "demo@propvora.com")
        .replace(/jamahl thomas/gi, "Demo Operator")
    }
  })
}

async function capture(name, route, prepare) {
  if (captureOnly && captureOnly !== name) return
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 120_000 })
  await settle()
  if (prepare) await prepare()
  await applyDemoIdentity()
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: false })
  const title = await page.title()
  const body = await page.locator("body").innerText().catch(() => "")
  const bad = /application error|internal server error|page not found/i.test(`${title}\n${body}`)
  console.log(`${bad ? "FAIL" : "PASS"} ${name} -> ${new URL(page.url()).pathname}`)
  if (bad) failures.push(`${name}: rendered an error page`)
}

async function waitForHydratedContent() {
  await page.locator(".animate-pulse").first().waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {})
  await page.waitForTimeout(1000)
}

async function dismissPortalTour() {
  const close = page.getByRole("button", { name: "Close", exact: true })
  await close.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
  if (await close.count()) await close.first().click().catch(() => {})
  await page.waitForTimeout(1200)
}

try {
  await admin.from("profiles").update({ current_workspace_id: workspaceId }).eq("id", user.id)

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 120_000 })
  await settle()
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await Promise.all([
    page.waitForURL(/\/(property-manager|app)(\/|$)/, { timeout: 30_000 }),
    page.locator('input[name="password"]').press("Enter"),
  ])

  await capture("01-home", "/property-manager")
  await capture("02-portfolio", "/property-manager/portfolio/properties")
  await capture("03-property-detail", `/property-manager/portfolio/properties/${properties[0].id}`)
  await capture("04-unit-detail", `/property-manager/portfolio/units/${units[0].id}`)
  await capture("05-tenancy", `/property-manager/portfolio/tenancies/${tenancies[0].id}`, async () => {
    await page.getByText("Loading tenancy...").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {})
  })
  await capture("06-work", "/property-manager/work")
  await capture("07-ppm", "/property-manager/work/ppm")
  await capture("08-calendar", "/property-manager/calendar")
  await capture("09-messages", "/property-manager/messages", waitForHydratedContent)
  await capture("10-money", "/property-manager/money")
  await capture("11-invoices", "/property-manager/money/invoices", waitForHydratedContent)
  await capture("12-compliance", "/property-manager/compliance")
  await capture("13-copilot-chat", "/property-manager", async () => {
    const trigger = page.getByRole("button", { name: /open propvora copilot/i })
    if (await trigger.count()) await trigger.first().click()
    await page.waitForSelector('[role="dialog"][aria-label="Propvora Copilot"]', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(600)
  })
  await capture("14-automation", "/property-manager/automations/canvas", async () => {
    await page.getByText("Active automations", { exact: true }).waitFor({ state: "visible", timeout: 20_000 }).catch(() => {})
    await waitForHydratedContent()
  })
  await capture("18-legal", "/property-manager/legal", waitForHydratedContent)
  await capture("19-affiliate", "/property-manager/affiliates", waitForHydratedContent)
  await capture("15-landlord-portal", "/landlord-portal", dismissPortalTour)
  await capture("16-tenant-portal", "/tenant-portal", dismissPortalTour)
  if (!captureOnly || captureOnly === "17-supplier-portal") {
    if (!supplierWorkspace) throw new Error("Supplier workspace was not found")
    await admin.from("profiles").update({ current_workspace_id: supplierWorkspace.id }).eq("id", user.id)
    await page.evaluate(() => localStorage.setItem("propvora.login.persona", "supplier"))
  }
  await capture("17-supplier-portal", "/supplier-portal", dismissPortalTour)
} finally {
  await browser.close()
  await admin.from("profiles").update({ current_workspace_id: originalWorkspaceId }).eq("id", user.id)
  for (const [id, originalEmail] of originalContactEmails) {
    await admin.from("contacts").update({ email: originalEmail }).eq("id", id)
  }
}

console.log(JSON.stringify({ screenshots: 19, failures, consoleErrors: consoleErrors.slice(0, 20) }, null, 2))
if (failures.length) process.exit(1)
