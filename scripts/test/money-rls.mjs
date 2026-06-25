// Money section RLS isolation + IDOR integration test.
//
// Mirrors scripts/test/rls-isolation.mjs but targets the Money detail-page
// tables: invoices, invoice_lines, bills, bill_lines, payments, deposits,
// arrears_records. Creates two real auth users + workspaces, seeds workspace B
// with money rows, then proves user A can NEVER list / fetch-by-id / insert /
// update workspace B's financial data (the "no cross-workspace money leakage"
// release gate). Also asserts the POSITIVE path: user B CAN read its own rows.
//
// Robust cleanup in finally. Exit code 1 if any leak/assertion fails.
//
// Usage: node scripts/test/money-rls.mjs
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

function loadEnv(path) {
  const out = {}
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      out[m[1]] = v
    }
  } catch {}
  return out
}
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!URL || !SERVICE || !ANON) { console.error("Missing Supabase env"); process.exit(2) }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })

const S = Date.now()
const PW = `Money!${S}aZ9`
const results = []
function check(name, pass, detail) {
  results.push({ name, pass })
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}

let userA, userB, wsA, wsB
const seeded = {} // table -> row id (in workspace B)
const cleanupRows = [] // {table, id}

async function insB(table, row) {
  const { data, error } = await admin.from(table).insert({ workspace_id: wsB, ...row }).select("id").single()
  if (error) { console.log(`   (seed ${table} skipped: ${error.message})`); return null }
  seeded[table] = data.id
  cleanupRows.unshift({ table, id: data.id })
  return data.id
}

try {
  // 1. Users
  userA = (await admin.auth.admin.createUser({ email: `moneyrls+a${S}@propvora-test.com`, password: PW, email_confirm: true })).data.user
  userB = (await admin.auth.admin.createUser({ email: `moneyrls+b${S}@propvora-test.com`, password: PW, email_confirm: true })).data.user
  check("create test users A + B", !!userA && !!userB)
  await admin.from("profiles").upsert({ id: userA.id, display_name: "Money A" })
  await admin.from("profiles").upsert({ id: userB.id, display_name: "Money B" })

  // 2. Workspaces
  wsA = (await admin.from("workspaces").insert({ name: `Money A ${S}`, slug: `money-a-${S}`, owner_user_id: userA.id, plan: "starter" }).select("id").single()).data?.id
  wsB = (await admin.from("workspaces").insert({ name: `Money B ${S}`, slug: `money-b-${S}`, owner_user_id: userB.id, plan: "starter" }).select("id").single()).data?.id
  check("create workspaces A + B", !!wsA && !!wsB)

  // 3. Memberships
  await admin.from("workspace_members").insert([
    { workspace_id: wsA, user_id: userA.id, role: "owner" },
    { workspace_id: wsB, user_id: userB.id, role: "owner" },
  ])
  await admin.from("profiles").update({ current_workspace_id: wsA }).eq("id", userA.id)
  await admin.from("profiles").update({ current_workspace_id: wsB }).eq("id", userB.id)

  // 4. Seed workspace B across MONEY tables (FK-aware order)
  const propB = await insB("properties", { template: "standard_rental", nickname: "B House", address_line1: "1 Money St", postcode: "B1 1BB" })
  const supplierB = await insB("contacts", { type: "supplier", display_name: "B Supplier" })
  const tenantB = await insB("contacts", { type: "tenant", display_name: "B Tenant" })

  const invB = await insB("invoices", {
    invoice_number: `INV-B-${S}`, contact_id: tenantB, property_id: propB, invoice_type: "outbound",
    issue_date: "2026-06-01", due_date: "2026-06-15", subtotal: 1000, tax_amount: 200, total: 1200,
    currency: "GBP", status: "sent",
  })
  if (invB) await insB("invoice_lines", { invoice_id: invB, description: "B line", quantity: 1, unit_price: 1000, tax_rate: 20, line_total: 1200 })

  const billB = await insB("bills", {
    bill_number: `BILL-B-${S}`, bill_type: "supplier_invoice", supplier_contact_id: supplierB, property_id: propB,
    status: "awaiting_review", issue_date: "2026-06-01", due_date: "2026-06-20", subtotal: 300, tax_amount: 60, total: 360, currency: "GBP",
  })
  if (billB) await insB("bill_lines", { bill_id: billB, description: "B work", quantity: 1, unit_price: 300, tax_rate: 20, line_total: 360 })

  await insB("payments", {
    payment_type: "inbound", linked_type: "invoice", linked_id: invB, contact_id: tenantB,
    amount: 1200, currency: "GBP", payment_date: "2026-06-10", payment_method: "BACS", status: "completed",
  })
  await insB("deposits", { deposit_type: "tenancy", property_id: propB, contact_id: tenantB, amount: 1500, currency: "GBP", status: "protected", received_date: "2026-06-01", protection_scheme: "DPS" })
  await insB("arrears_records", { contact_id: tenantB, property_id: propB, amount_due: 800, days_overdue: 12, status: "open" })

  const moneyTables = ["invoices", "invoice_lines", "bills", "bill_lines", "payments", "deposits", "arrears_records"].filter((t) => seeded[t])
  check("seeded workspace B money fixtures", moneyTables.length >= 5, `${moneyTables.length}/7 money tables`)

  // 5. Sign in as user A (attacker) and user B (legit owner)
  const a = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: signA } = await a.auth.signInWithPassword({ email: `moneyrls+a${S}@propvora-test.com`, password: PW })
  check("user A sign-in", !signA, signA?.message)
  const b = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: signB } = await b.auth.signInWithPassword({ email: `moneyrls+b${S}@propvora-test.com`, password: PW })
  check("user B sign-in", !signB, signB?.message)

  // 6. Negative: for every seeded money table A must NOT list or fetch-by-id B's rows
  for (const table of moneyTables) {
    const bId = seeded[table]
    const { data: listed, error: listErr } = await a.from(table).select("id, workspace_id").limit(1000)
    const visibleB = (listed || []).filter((r) => r.workspace_id === wsB || r.id === bId)
    check(`RLS: A cannot LIST workspace-B ${table}`, !listErr ? visibleB.length === 0 : false,
      listErr ? `query error: ${listErr.message}` : `${visibleB.length} B-rows visible (of ${(listed || []).length})`)

    const { data: byId } = await a.from(table).select("id").eq("id", bId)
    check(`IDOR: A cannot FETCH B's ${table} by id`, (byId || []).length === 0, `${(byId || []).length} rows`)
  }

  // 7. Positive: B CAN read its own invoice + bill (proves policy isn't over-restrictive)
  if (seeded.invoices) {
    const { data: bInv } = await b.from("invoices").select("id").eq("id", seeded.invoices)
    check("RLS+: B CAN read own invoice", (bInv || []).length === 1, `${(bInv || []).length} rows`)
  }
  if (seeded.bills) {
    const { data: bBill } = await b.from("bills").select("id").eq("id", seeded.bills)
    check("RLS+: B CAN read own bill", (bBill || []).length === 1, `${(bBill || []).length} rows`)
  }

  // 8. Write isolation — A cannot INSERT a bill into workspace B
  const { error: wErr } = await a.from("bills").insert({
    workspace_id: wsB, bill_number: `EVIL-${S}`, bill_type: "supplier_invoice", status: "awaiting_review",
    total: 1, subtotal: 1, tax_amount: 0, currency: "GBP", issue_date: "2026-06-01", due_date: "2026-06-02",
  })
  check("RLS: A cannot INSERT a bill into workspace B", !!wErr, wErr ? wErr.message.slice(0, 60) : "INSERT SUCCEEDED — LEAK")

  // 9. Write isolation — A cannot UPDATE B's invoice (e.g. mark paid)
  if (seeded.invoices) {
    const { data: upd } = await a.from("invoices").update({ status: "paid" }).eq("id", seeded.invoices).select("id")
    check("RLS: A cannot UPDATE B's invoice", (upd || []).length === 0, `${(upd || []).length} rows updated`)
  }

  // 10. Write isolation — A cannot DELETE B's deposit
  if (seeded.deposits) {
    const { data: del } = await a.from("deposits").delete().eq("id", seeded.deposits).select("id")
    check("RLS: A cannot DELETE B's deposit", (del || []).length === 0, `${(del || []).length} rows deleted`)
  }
} catch (e) {
  check("harness ran without throwing", false, e.message)
} finally {
  for (const { table, id } of cleanupRows) { try { await admin.from(table).delete().eq("id", id) } catch {} }
  try { if (wsA) await admin.from("workspace_members").delete().eq("workspace_id", wsA) } catch {}
  try { if (wsB) await admin.from("workspace_members").delete().eq("workspace_id", wsB) } catch {}
  try { if (wsA) await admin.from("workspaces").delete().eq("id", wsA) } catch {}
  try { if (wsB) await admin.from("workspaces").delete().eq("id", wsB) } catch {}
  try { if (userA) await admin.auth.admin.deleteUser(userA.id) } catch {}
  try { if (userB) await admin.auth.admin.deleteUser(userB.id) } catch {}
  console.log("   (cleanup complete)")
}

const failed = results.filter((r) => !r.pass).length
console.log(`\n=== MONEY RLS ISOLATION: ${results.length - failed}/${results.length} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
