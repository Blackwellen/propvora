// One-off marketing capture: drive a REAL Copilot session and screenshot the
// panel showing the new markdown-formatted reply + action buttons.
//
// Creates a throwaway QA user that OWNS a dedicated workspace seeded with demo
// data (correct counts, no RLS ambiguity), logs in, opens the Copilot, sends a
// real prompt, waits for the streamed reply + buttons, then captures a clean
// 1536×1024 screenshot.
//
// Feature flags follow the dev server's env (start it with
// NEXT_PUBLIC_QA_ALL_FLAGS=false), so this shot reflects the flags-OFF surface.
//
// Usage: BASE=http://localhost:3004 node scripts/capture-copilot-shot.mjs
import { chromium } from "playwright"
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

function loadEnv(p) {
  const o = {}
  try {
    for (const l of readFileSync(p, "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      o[m[1]] = v
    }
  } catch {}
  return o
}
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }

const BASE = process.env.BASE ?? "http://localhost:3004"
const EMAIL = "qa-copilot-shot@propvora-test.com"
const PASSWORD = "QaShot!2026pv"
const SLUG = "copilot-shot-ws"
const OUT = "public/images/marketing/product/enriched/13-copilot-chat.png"
const PROMPT = "Give me a brief prioritised checklist of the 3 most urgent things across my portfolio this week — one short line each — then offer to action the top one for me."

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// 1. Throwaway user (find or create, confirmed).
let userId
const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
const existing = list?.users?.find((u) => u.email === EMAIL)
if (existing) {
  userId = existing.id
  await admin.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true })
} else {
  const { data, error } = await admin.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true })
  if (error) throw error
  userId = data.user.id
}
await admin.from("profiles").upsert({ id: userId, display_name: "Demo Operator" })

// 2. Dedicated workspace OWNED by this user (enterprise → AI enabled), made the
//    current workspace, seeded with demo data so counts are real.
let wsId
const { data: wsRow } = await admin.from("workspaces").select("id").eq("slug", SLUG).maybeSingle()
if (wsRow) {
  wsId = wsRow.id
} else {
  const { data, error } = await admin
    .from("workspaces")
    .insert({ name: "JT Property Manager", slug: SLUG, owner_user_id: userId, plan: "enterprise" })
    .select("id")
    .single()
  if (error) throw error
  wsId = data.id
}
await admin.from("workspace_members").upsert(
  { workspace_id: wsId, user_id: userId, role: "owner" },
  { onConflict: "workspace_id,user_id" }
)
// Active (non-trial) so the sidebar badge reads a clean "Enterprise plan".
await admin.from("workspaces").update({ plan: "enterprise", plan_status: "active", trial_ends_at: null }).eq("id", wsId)
await admin.from("profiles").update({ current_workspace_id: wsId }).eq("id", userId)
await admin.rpc("delete_demo_data", { p_workspace_id: wsId }) // returns {error} not throw — ignored
const seed = await admin.rpc("seed_demo_workspace", { p_workspace_id: wsId, p_user_id: userId })
if (seed.error) throw new Error("seed_demo_workspace failed: " + seed.error.message)
const { count: propCount } = await admin
  .from("properties").select("id", { head: true, count: "exact" }).eq("workspace_id", wsId)

// The demo RPC seeds the legacy `units` table; the Home dashboard + Copilot read
// `property_units`. Mirror the seeded units across so both KPIs agree (once).
const { count: puCount } = await admin
  .from("property_units").select("id", { head: true, count: "exact" }).eq("workspace_id", wsId)
if (!puCount) {
  const { data: srcUnits } = await admin
    .from("units").select("property_id, status, label").eq("workspace_id", wsId)
  if (srcUnits?.length) {
    const rows = srcUnits.map((u, i) => ({
      workspace_id: wsId,
      property_id: u.property_id,
      unit_name: u.label ?? `Unit ${i + 1}`,
      status: u.status === "vacant" ? "vacant" : "occupied",
    }))
    const { error: puErr } = await admin.from("property_units").insert(rows)
    if (puErr) console.log("property_units mirror failed:", puErr.message)
  }
}
const { count: puFinal } = await admin
  .from("property_units").select("id", { head: true, count: "exact" }).eq("workspace_id", wsId)
console.log("seeded properties:", propCount, "property_units:", puFinal)

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1536, height: 1024 },
  deviceScaleFactor: 1,
  colorScheme: "light",
})
const page = await context.newPage()
const consoleErrors = []
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()) })

async function settle() {
  await page.waitForLoadState("domcontentloaded")
  await page.waitForTimeout(1200)
  for (const name of ["Reject non-essential", "Accept all", "Close", "Skip", "Not now", "Got it"]) {
    const b = page.getByRole("button", { name, exact: true })
    if (await b.count()) await b.first().click().catch(() => {})
  }
  await page.waitForTimeout(300)
}

// Dismiss the Guided Help "Welcome to Propvora" tour card if it appears.
async function dismissGuides() {
  for (const label of ["Don't show tips again", "Dismiss", "Got it", "Skip tour", "Skip"]) {
    const b = page.getByRole("button", { name: label, exact: true })
    if (await b.count()) { await b.first().click().catch(() => {}); await page.waitForTimeout(200) }
  }
  // DOM fallback: hide any small fixed card that still references the guides.
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("body *")).filter((el) => {
      const t = el.textContent || ""
      if (!/PROPVORA GUIDES|Welcome to Propvora/i.test(t)) return false
      const r = el.getBoundingClientRect()
      return r.width > 240 && r.width < 600 && r.height > 120 && r.height < 520
    })
    for (const el of cards) el.style.display = "none"
  })
}

async function applyDemoIdentity() {
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const node of nodes) {
      if (!node.textContent) continue
      node.textContent = node.textContent
        .replace(/qa-copilot-shot@propvora-test\.com/gi, "demo@propvora.com")
        .replace(/jamahlthomas1996@gmail\.com/gi, "demo@propvora.com")
        .replace(/jamahl thomas/gi, "Demo Operator")
    }
  })
}

try {
  // 3. Login.
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 120_000 })
  await settle()
  await page.locator('input[name="email"]').fill(EMAIL)
  await page.locator('input[name="password"]').fill(PASSWORD)
  await Promise.all([
    page.waitForURL(/\/(property-manager|app)(\/|$)/, { timeout: 30_000 }),
    page.locator('input[name="password"]').press("Enter"),
  ])

  // 4. Home, then open the Copilot. Login already lands on /property-manager; only
  //    navigate if we're elsewhere, and tolerate proxy redirect races.
  if (!/\/(property-manager|app)(\/|$)/.test(page.url())) {
    await page.goto(`${BASE}/property-manager`, { waitUntil: "domcontentloaded", timeout: 120_000 }).catch(() => {})
  }
  await page.waitForURL(/\/(property-manager|app)(\/|$)/, { timeout: 30_000 }).catch(() => {})
  await settle()
  await dismissGuides()
  const trigger = page.getByRole("button", { name: /open propvora copilot/i })
  if (await trigger.count()) await trigger.first().click()
  // The role=dialog wrapper has zero size (fixed-position children), so wait on
  // the visible input inside the panel rather than the wrapper itself.
  const input = page.locator('textarea[placeholder^="Ask Copilot"]')
  await input.waitFor({ state: "visible", timeout: 12_000 })
  await page.waitForTimeout(600)

  // Fresh thread so we get the welcome → clean conversation.
  const newBtn = page.getByRole("button", { name: "Start new chat" })
  if (await newBtn.count()) { await newBtn.first().click().catch(() => {}); await page.waitForTimeout(400) }

  // 5. Send a real prompt.
  await input.fill(PROMPT)
  await page.getByRole("button", { name: "Send message" }).click()

  // 6. Wait for the streamed reply to finish + buttons to render.
  await page.waitForResponse((r) => r.url().includes("/api/ai/chat"), { timeout: 60_000 }).catch(() => {})
  const dialog = page.locator('[role="dialog"][aria-label="Propvora Copilot"]')
  let last = -1, stable = 0
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(800)
    const len = (await dialog.innerText().catch(() => "")).length
    if (len === last && len > 0) { if (++stable >= 3) break } else stable = 0
    last = len
  }
  await page.waitForTimeout(1200)

  // 7. Final cleanup of any tour card, cosmetic identity swap, then capture.
  await dismissGuides()
  await applyDemoIdentity()
  await page.screenshot({ path: OUT, fullPage: false })
  console.log(JSON.stringify({ ok: true, out: OUT, propCount, consoleErrors: consoleErrors.slice(0, 8) }, null, 2))
} finally {
  await browser.close()
}
