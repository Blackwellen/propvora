// Legal section RLS isolation + IDOR integration test.
//
// Mirrors scripts/test/money-rls.mjs but targets the Legal section tables:
// possession_cases, possession_evidence, hmo_licences. Creates two real auth
// users + workspaces, seeds workspace B with legal rows, then proves user A can
// NEVER list / fetch-by-id / insert / update / delete workspace B's legal data
// (the "no cross-workspace legal leakage" release gate). Also asserts the
// POSITIVE path: user B CAN read its own rows.
//
// Robust cleanup in finally. Exit code 1 if any leak/assertion fails.
//
// Usage: node scripts/test/legal-rls.mjs
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
const PW = `Legal!${S}aZ9`
const NIL_UUID = "00000000-0000-0000-0000-000000000000"
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
  userA = (await admin.auth.admin.createUser({ email: `legalrls+a${S}@propvora-test.com`, password: PW, email_confirm: true })).data.user
  userB = (await admin.auth.admin.createUser({ email: `legalrls+b${S}@propvora-test.com`, password: PW, email_confirm: true })).data.user
  check("create test users A + B", !!userA && !!userB)
  await admin.from("profiles").upsert({ id: userA.id, display_name: "Legal A" })
  await admin.from("profiles").upsert({ id: userB.id, display_name: "Legal B" })

  // 2. Workspaces
  wsA = (await admin.from("workspaces").insert({ name: `Legal A ${S}`, slug: `legal-a-${S}`, owner_user_id: userA.id, plan: "starter" }).select("id").single()).data?.id
  wsB = (await admin.from("workspaces").insert({ name: `Legal B ${S}`, slug: `legal-b-${S}`, owner_user_id: userB.id, plan: "starter" }).select("id").single()).data?.id
  check("create workspaces A + B", !!wsA && !!wsB)

  // 3. Memberships
  await admin.from("workspace_members").insert([
    { workspace_id: wsA, user_id: userA.id, role: "owner" },
    { workspace_id: wsB, user_id: userB.id, role: "owner" },
  ])
  await admin.from("profiles").update({ current_workspace_id: wsA }).eq("id", userA.id)
  await admin.from("profiles").update({ current_workspace_id: wsB }).eq("id", userB.id)

  // 4. Seed workspace B across LEGAL tables (FK-aware order). jsonb NOT-NULL
  //    columns (grounds, validity_snapshot, conditions) are OMITTED so their
  //    '{}' defaults apply — never send explicit null (23502).
  const propB = await insB("properties", { template: "standard_rental", nickname: "B House", address_line1: "1 Legal St", postcode: "B1 1BB" })
  const tenantB = await insB("contacts", { type: "tenant", display_name: "B Tenant" })
  // possession_cases.tenancy_id has a NOT-NULL FK to tenancies — seed a real one.
  const tenancyB = await insB("tenancies", {
    property_id: propB, start_date: "2026-01-01", rent_amount: 1200, rent_period: "monthly",
    status: "active", tenancy_type: "periodic",
  })

  const caseB = await insB("possession_cases", {
    tenancy_id: tenancyB ?? NIL_UUID, property_id: propB, contact_id: tenantB,
    ground: "Ground 8 — serious rent arrears", arrears_amount: 2400, arrears_weeks: 9,
    status: "gathering_evidence",
  })
  if (caseB) {
    await insB("possession_evidence", {
      possession_case_id: caseB, evidence_type: "rent_statement",
      description: "B arrears statement", amount: 2400, event_date: "2026-06-01",
    })
  }
  await insB("hmo_licences", {
    property_id: propB, licence_type: "mandatory", licence_number: `HMO-B-${S}`,
    issuing_council: "B Council", expiry_date: "2027-06-01", max_occupants: 5, status: "active",
  })
  // Custom legal pack row (workspace_legal_modules) — must be workspace-isolated too.
  await insB("workspace_legal_modules", {
    module_key: `custom_b_${S}`, label: "B legal note", note: "B-only guidance", is_custom: true,
  })

  const legalTables = ["possession_cases", "possession_evidence", "hmo_licences", "workspace_legal_modules"].filter((t) => seeded[t])
  check("seeded workspace B legal fixtures", legalTables.length >= 3, `${legalTables.length}/4 legal tables`)

  // 5. Sign in as user A (attacker) and user B (legit owner)
  const a = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: signA } = await a.auth.signInWithPassword({ email: `legalrls+a${S}@propvora-test.com`, password: PW })
  check("user A sign-in", !signA, signA?.message)
  const b = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: signB } = await b.auth.signInWithPassword({ email: `legalrls+b${S}@propvora-test.com`, password: PW })
  check("user B sign-in", !signB, signB?.message)

  // 6. Negative: for every seeded legal table A must NOT list or fetch-by-id B's rows
  for (const table of legalTables) {
    const bId = seeded[table]
    const { data: listed, error: listErr } = await a.from(table).select("id, workspace_id").limit(1000)
    const visibleB = (listed || []).filter((r) => r.workspace_id === wsB || r.id === bId)
    check(`RLS: A cannot LIST workspace-B ${table}`, !listErr ? visibleB.length === 0 : false,
      listErr ? `query error: ${listErr.message}` : `${visibleB.length} B-rows visible (of ${(listed || []).length})`)

    const { data: byId } = await a.from(table).select("id").eq("id", bId)
    check(`IDOR: A cannot FETCH B's ${table} by id`, (byId || []).length === 0, `${(byId || []).length} rows`)
  }

  // 7. Positive: B CAN read its own possession case + HMO licence
  if (seeded.possession_cases) {
    const { data: bCase } = await b.from("possession_cases").select("id").eq("id", seeded.possession_cases)
    check("RLS+: B CAN read own possession case", (bCase || []).length === 1, `${(bCase || []).length} rows`)
  }
  if (seeded.hmo_licences) {
    const { data: bLic } = await b.from("hmo_licences").select("id").eq("id", seeded.hmo_licences)
    check("RLS+: B CAN read own HMO licence", (bLic || []).length === 1, `${(bLic || []).length} rows`)
  }

  // 8. Write isolation — A cannot INSERT an HMO licence into workspace B
  const { error: wErr } = await a.from("hmo_licences").insert({
    workspace_id: wsB, property_id: seeded.properties, licence_type: "mandatory",
    licence_number: `EVIL-${S}`, expiry_date: "2027-01-01", status: "active",
  })
  check("RLS: A cannot INSERT an HMO licence into workspace B", !!wErr, wErr ? wErr.message.slice(0, 60) : "INSERT SUCCEEDED — LEAK")

  // 9. Write isolation — A cannot UPDATE B's possession case (e.g. advance status)
  if (seeded.possession_cases) {
    const { data: upd } = await a.from("possession_cases").update({ status: "resolved" }).eq("id", seeded.possession_cases).select("id")
    check("RLS: A cannot UPDATE B's possession case", (upd || []).length === 0, `${(upd || []).length} rows updated`)
  }

  // 10. Write isolation — A cannot DELETE B's HMO licence
  if (seeded.hmo_licences) {
    const { data: del } = await a.from("hmo_licences").delete().eq("id", seeded.hmo_licences).select("id")
    check("RLS: A cannot DELETE B's HMO licence", (del || []).length === 0, `${(del || []).length} rows deleted`)
  }

  // 11. Custom legal pack (workspace_legal_modules) isolation
  if (seeded.workspace_legal_modules) {
    // Positive: B CAN read its own custom legal module.
    const { data: bMod } = await b.from("workspace_legal_modules").select("id").eq("id", seeded.workspace_legal_modules)
    check("RLS+: B CAN read own legal module", (bMod || []).length === 1, `${(bMod || []).length} rows`)

    // A cannot INSERT a legal module into workspace B.
    const { error: insErr } = await a.from("workspace_legal_modules").insert({
      workspace_id: wsB, module_key: `evil_${S}`, label: "EVIL", is_custom: true,
    })
    check("RLS: A cannot INSERT a legal module into workspace B", !!insErr, insErr ? insErr.message.slice(0, 60) : "INSERT SUCCEEDED — LEAK")

    // A cannot UPDATE B's legal module.
    const { data: upd } = await a.from("workspace_legal_modules").update({ label: "HACKED" }).eq("id", seeded.workspace_legal_modules).select("id")
    check("RLS: A cannot UPDATE B's legal module", (upd || []).length === 0, `${(upd || []).length} rows updated`)

    // A cannot DELETE B's legal module.
    const { data: del } = await a.from("workspace_legal_modules").delete().eq("id", seeded.workspace_legal_modules).select("id")
    check("RLS: A cannot DELETE B's legal module", (del || []).length === 0, `${(del || []).length} rows deleted`)
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
console.log(`\n=== LEGAL RLS ISOLATION: ${results.length - failed}/${results.length} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
