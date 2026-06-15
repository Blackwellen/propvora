// Supplier portal scoping test (security hardening fix #3).
//
// Proves that the RLS added in 20260615060000_supplier_portal_scoping.sql
// enforces, at the DATABASE level, that a portal-linked supplier can read ONLY
// the jobs/invoices tied to THEIR contact id — never the whole workspace.
//
// Setup (service role):
//   * one workspace + owner
//   * two supplier `contacts`: A and B
//   * one auth user linked to supplier A via supplier_portal_access (active)
//   * jobs + supplier_invoices for BOTH A and B
// Assertions (supplier A signed in via the anon client, RLS enforced):
//   * A sees its OWN job + invoice
//   * A does NOT see B's job or invoice (cross-supplier isolation)
//   * A cannot read an unrelated workspace-wide job (no member access)
//
// Usage: node scripts/test/supplier-scope.mjs
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

function loadEnv(p){const o={};try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);o[m[1]]=v}}catch{}return o}
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!URL || !SERVICE || !ANON) { console.error("Missing Supabase env"); process.exit(2) }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })
const S = Date.now()
const PW = `Supp!${S}aZ9`
const results = []
const failures = []
function check(name, pass, detail) {
  results.push({ name, pass })
  if (!pass) failures.push(`${name}${detail ? ` — ${detail}` : ""}`)
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}

let ws, owner, supplierUser
const ids = { contacts: [], jobs: [], invoices: [], access: [] }
let tableMissing = false

try {
  // Owner + workspace
  owner = (await admin.auth.admin.createUser({ email: `supp-owner${S}@propvora-test.com`, password: PW, email_confirm: true })).data.user
  await admin.from("profiles").upsert({ id: owner.id, display_name: "Supp Owner" })
  ws = (await admin.from("workspaces").insert({ name: `Supp WS ${S}`, slug: `supp-ws-${S}`, owner_user_id: owner.id, plan: "enterprise" }).select("id").single()).data?.id
  await admin.from("workspace_members").insert({ workspace_id: ws, user_id: owner.id, role: "owner", status: "active" })
  check("create workspace + owner", !!ws)

  // Two supplier contacts A + B
  const cA = (await admin.from("contacts").insert({ workspace_id: ws, type: "supplier", display_name: "Supplier A", email: `suppA${S}@propvora-test.com` }).select("id").single()).data?.id
  const cB = (await admin.from("contacts").insert({ workspace_id: ws, type: "supplier", display_name: "Supplier B", email: `suppB${S}@propvora-test.com` }).select("id").single()).data?.id
  ids.contacts.push(cA, cB)
  check("create supplier contacts A + B", !!cA && !!cB)

  // Auth user for supplier A + portal access link
  supplierUser = (await admin.auth.admin.createUser({ email: `suppA${S}@propvora-test.com`, password: PW, email_confirm: true })).data.user
  await admin.from("profiles").upsert({ id: supplierUser.id, display_name: "Supplier A user" })
  const accRes = await admin.from("supplier_portal_access").insert({ workspace_id: ws, contact_id: cA, user_id: supplierUser.id, active: true }).select("id").single()
  if (accRes.error && accRes.error.code === "42P01") { tableMissing = true }
  if (accRes.data?.id) ids.access.push(accRes.data.id)
  check("create supplier_portal_access link for A", !!accRes.data?.id, accRes.error?.message?.slice(0,60))

  // Jobs for A and B
  const jA = (await admin.from("jobs").insert({ workspace_id: ws, title: "Job for A", status: "new", supplier_contact_id: cA }).select("id").single()).data?.id
  const jB = (await admin.from("jobs").insert({ workspace_id: ws, title: "Job for B", status: "new", supplier_contact_id: cB }).select("id").single()).data?.id
  ids.jobs.push(jA, jB)
  check("seed jobs for A + B", !!jA && !!jB)

  // Invoices for A and B
  const iA = (await admin.from("supplier_invoices").insert({ workspace_id: ws, contact_id: cA, invoice_number: `A-${S}`, amount: 100, status: "submitted" }).select("id").single()).data?.id
  const iB = (await admin.from("supplier_invoices").insert({ workspace_id: ws, contact_id: cB, invoice_number: `B-${S}`, amount: 200, status: "submitted" }).select("id").single()).data?.id
  ids.invoices.push(iA, iB)
  check("seed invoices for A + B", !!iA && !!iB)

  // Sign in as supplier A (anon client → RLS enforced)
  const c = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: signErr } = await c.auth.signInWithPassword({ email: `suppA${S}@propvora-test.com`, password: PW })
  check("supplier A signs in", !signErr, signErr?.message)

  // A sees its OWN job
  {
    const { data, error } = await c.from("jobs").select("id, supplier_contact_id").eq("id", jA)
    const can = !error && (data || []).length === 1
    check("supplier A reads OWN job", can, error?.message?.slice(0,60))
  }
  // A does NOT see B's job
  {
    const { data, error } = await c.from("jobs").select("id").eq("id", jB)
    const hidden = !error && (data || []).length === 0
    check("supplier A CANNOT read B's job (isolation)", hidden, error ? error.message.slice(0,60) : `saw ${(data||[]).length} row(s)`)
  }
  // A reads only its own jobs in a broad select (no workspace-wide leak)
  {
    const { data, error } = await c.from("jobs").select("id, supplier_contact_id")
    const onlyOwn = !error && (data || []).every((r) => r.supplier_contact_id === cA)
    check("supplier A broad job select returns only A's rows", onlyOwn && (data||[]).length >= 1, error ? error.message.slice(0,60) : `rows=${(data||[]).length}`)
  }
  // A sees its OWN invoice
  {
    const { data, error } = await c.from("supplier_invoices").select("id").eq("id", iA)
    check("supplier A reads OWN invoice", !error && (data || []).length === 1, error?.message?.slice(0,60))
  }
  // A does NOT see B's invoice
  {
    const { data, error } = await c.from("supplier_invoices").select("id").eq("id", iB)
    const hidden = !error && (data || []).length === 0
    check("supplier A CANNOT read B's invoice (isolation)", hidden, error ? error.message.slice(0,60) : `saw ${(data||[]).length} row(s)`)
  }
} catch (e) {
  check("harness ran without throwing", false, e.message)
} finally {
  try { for (const id of ids.invoices) if (id) await admin.from("supplier_invoices").delete().eq("id", id) } catch {}
  try { for (const id of ids.jobs) if (id) await admin.from("jobs").delete().eq("id", id) } catch {}
  try { for (const id of ids.access) if (id) await admin.from("supplier_portal_access").delete().eq("id", id) } catch {}
  try { for (const id of ids.contacts) if (id) await admin.from("contacts").delete().eq("id", id) } catch {}
  try { if (ws) await admin.from("workspace_members").delete().eq("workspace_id", ws) } catch {}
  try { if (ws) await admin.from("workspaces").delete().eq("id", ws) } catch {}
  try { if (supplierUser) await admin.auth.admin.deleteUser(supplierUser.id) } catch {}
  try { if (owner) await admin.auth.admin.deleteUser(owner.id) } catch {}
  console.log("   (cleanup complete)")
}

const failed = results.filter((r) => !r.pass).length
if (tableMissing) console.log("\n⚠️  supplier_portal_access table missing — run migration 20260615060000 first.")
if (failed) { console.log("\n--- SUPPLIER SCOPE FAILURES ---"); failures.forEach((f) => console.log("  ✗ " + f)) }
console.log(`\n=== SUPPLIER SCOPE: ${results.length - failed}/${results.length} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
