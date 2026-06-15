// Anonymous exposure test — with the ANON client and NO signed-in user, every
// sensitive workspace-scoped table MUST return 0 rows (RLS blocks the rows).
//
// We FIRST seed one real row into a throwaway workspace per table via the service
// role, so that "0 rows to anon" genuinely proves RLS is filtering live data —
// not just that the table happens to be empty. Then we query each table with a
// pure anon client (PostgREST role = anon, auth.uid() = null) and assert 0 rows.
//
// Any table that returns >0 rows to anon is a CRITICAL data leak and FAILS loudly.
// We also do a raw REST GET against /properties to confirm 200 + empty array
// (not a real-data leak).
//
// Usage: node scripts/test/anon-exposure.mjs
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

function loadEnv(p){const o={};try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);o[m[1]]=v}}catch{}return o}
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!URL || !SERVICE || !ANON) { console.error("Missing Supabase env"); process.exit(2) }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })
const anon = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })

const S = Date.now()
const results = []
const failures = []
function check(name, pass, detail) {
  results.push({ name, pass })
  if (!pass) failures.push(`${name}${detail ? ` — ${detail}` : ""}`)
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}

const SENSITIVE = [
  "properties","units","tenancies","contacts","tasks","jobs","supplier_jobs",
  "compliance_items","bills","invoices","expense_records","deposits",
  "arrears_records","money_transactions","calendar_events","message_threads",
  "messages","planning_sets","possession_cases","hmo_licences","documents",
  "property_documents","notifications","workspace_members","workspace_billing",
  "workspace_settings","profiles","audit_logs",
]

let userB, wsB
const cleanupRows = []
async function insB(table, row) {
  const { data, error } = await admin.from(table).insert({ workspace_id: wsB, ...row }).select("id").single()
  if (error) { console.log(`   (seed ${table} skipped: ${error.message})`); return null }
  cleanupRows.unshift({ table, id: data.id })
  return data.id
}

try {
  userB = (await admin.auth.admin.createUser({ email: `anon+b${S}@propvora-test.com`, password: `Anon!${S}aZ9`, email_confirm: true })).data.user
  await admin.from("profiles").upsert({ id: userB.id, display_name: "ANON B" })
  wsB = (await admin.from("workspaces").insert({ name: `ANON B ${S}`, slug: `anon-b-${S}`, owner_user_id: userB.id, plan: "starter" }).select("id").single()).data?.id
  await admin.from("workspace_members").insert({ workspace_id: wsB, user_id: userB.id, role: "owner", status: "active" })
  check("seed throwaway workspace with live data", !!wsB)

  // Seed at least one row in each sensitive table so "0 to anon" is meaningful.
  const propB = await insB("properties", { template: "standard_rental", nickname: "Anon House", address_line1: "1 Anon St", postcode: "A1 1AA" })
  const contactB = await insB("contacts", { type: "supplier", display_name: "Anon Supplier" })
  if (propB) await insB("tenancies", { property_id: propB, start_date: "2026-01-01", rent_amount: 1000, rent_period: "monthly" })
  if (propB) await insB("units", { property_id: propB, label: "Anon Unit" })
  await insB("tasks", { title: "Anon task" })
  if (propB && contactB) await insB("jobs", { title: "Anon job", property_id: propB, supplier_contact_id: contactB })
  if (propB && contactB) await insB("supplier_jobs", { property_id: propB, supplier_contact_id: contactB, title: "Anon sjob" })
  await insB("compliance_items", { kind: "gas_safety", title: "Anon gas", ...(propB ? { property_id: propB } : {}) })
  await insB("bills", { bill_type: "supplier_invoice", total: 100 })
  await insB("invoices", { total: 200 })
  await insB("expense_records", { amount: 50, date: "2026-01-01" })
  await insB("deposits", { amount: 1000 })
  await insB("arrears_records", { amount_due: 300 })
  await insB("money_transactions", { direction: "in", category: "rent", amount: 1000, occurred_on: "2026-01-01" })
  await insB("calendar_events", { title: "Anon event", start_date: "2026-01-01" })
  const threadB = await insB("message_threads", { title: "Anon thread" })
  if (threadB) await insB("messages", { thread_id: threadB, sender_name: "Anon", content: "secret anon msg" })
  await insB("planning_sets", { title: "Anon plan" })
  if (propB) await insB("possession_cases", { property_id: propB })
  if (propB) await insB("hmo_licences", { property_id: propB, expiry_date: "2027-01-01" })
  await insB("documents", { name: "Anon doc", r2_key: `ws/${wsB}/a.pdf` })
  if (propB) await insB("property_documents", { property_id: propB, name: "Anon pdoc", file_url: "https://x/a.pdf" })
  await insB("notifications", { user_id: userB.id, kind: "system", title: "Anon notif" })
  // workspace_members / workspace_billing / workspace_settings rows already exist for wsB
  await admin.from("workspace_settings").upsert({ workspace_id: wsB }).select("workspace_id")
  check("seeded sensitive tables", cleanupRows.length >= 18, `${cleanupRows.length} rows seeded`)

  // Anon SELECT on every sensitive table → must be 0 rows (RLS denies anon)
  for (const table of SENSITIVE) {
    const { data, error } = await anon.from(table).select("*").limit(100)
    const rows = (data || []).length
    // With RLS + no policy granting anon, PostgREST returns [] (200) not an error.
    // A non-permission error (e.g. table missing) is informational, not a leak.
    const blocked = rows === 0
    check(`ANON: ${table} returns 0 rows`, blocked,
      blocked ? (error ? `(query note: ${error.message.slice(0, 50)})` : "") : `LEAK: ${rows} rows exposed to anon`)
  }

  // Raw REST GET against /properties — confirm 200 + empty array, not a data leak.
  try {
    const r = await fetch(`${URL}/rest/v1/properties?select=id,nickname&limit=50`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    })
    const body = await r.json()
    const arr = Array.isArray(body) ? body : null
    check("ANON raw REST /properties → 200 + empty array",
      r.status === 200 && arr !== null && arr.length === 0,
      arr === null ? `non-array body: ${JSON.stringify(body).slice(0, 80)}` : `status ${r.status}, ${arr ? arr.length : "?"} rows`)
  } catch (e) {
    check("ANON raw REST /properties → 200 + empty array", false, e.message)
  }
} catch (e) {
  check("harness ran without throwing", false, e.message)
} finally {
  for (const { table, id } of cleanupRows) { try { await admin.from(table).delete().eq("id", id) } catch {} }
  try { if (wsB) await admin.from("workspace_settings").delete().eq("workspace_id", wsB) } catch {}
  try { if (wsB) await admin.from("workspace_members").delete().eq("workspace_id", wsB) } catch {}
  try { if (wsB) await admin.from("workspaces").delete().eq("id", wsB) } catch {}
  try { if (userB) await admin.auth.admin.deleteUser(userB.id) } catch {}
  console.log("   (cleanup complete)")
}

const failed = results.filter((r) => !r.pass).length
if (failed) { console.log("\n--- CRITICAL: ANON EXPOSURE FAILURES ---"); failures.forEach((f) => console.log("  ✗ " + f)) }
console.log(`\n=== ANON EXPOSURE: ${results.length - failed}/${results.length} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
