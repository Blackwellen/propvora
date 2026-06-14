// RLS multi-workspace isolation + IDOR integration test.
//
// Creates two real auth users + workspaces (service role), seeds workspace B
// with rows across tenant tables, then signs in AS USER A and asserts that A
// can NEVER see, fetch-by-id, or write into workspace B's data. Proves the
// Critical "no cross-workspace leakage" release gate against the LIVE database.
//
// Robust cleanup in finally (rows → memberships → workspaces → profiles → users).
// Exit code 1 if any leak/assertion fails.
//
// Usage: node scripts/test/rls-isolation.mjs
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
const PW = `Rls!${S}aZ9`
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
  userA = (await admin.auth.admin.createUser({ email: `rlstest+a${S}@propvora-test.com`, password: PW, email_confirm: true })).data.user
  userB = (await admin.auth.admin.createUser({ email: `rlstest+b${S}@propvora-test.com`, password: PW, email_confirm: true })).data.user
  check("create test users A + B", !!userA && !!userB)
  // profiles (trigger may already create them)
  await admin.from("profiles").upsert({ id: userA.id, display_name: "RLS A" })
  await admin.from("profiles").upsert({ id: userB.id, display_name: "RLS B" })

  // 2. Workspaces (A owned by A, B owned by B)
  wsA = (await admin.from("workspaces").insert({ name: `RLS A ${S}`, slug: `rls-a-${S}`, owner_user_id: userA.id, plan: "starter" }).select("id").single()).data?.id
  wsB = (await admin.from("workspaces").insert({ name: `RLS B ${S}`, slug: `rls-b-${S}`, owner_user_id: userB.id, plan: "starter" }).select("id").single()).data?.id
  check("create workspaces A + B", !!wsA && !!wsB)

  // 3. Memberships
  await admin.from("workspace_members").insert([
    { workspace_id: wsA, user_id: userA.id, role: "owner" },
    { workspace_id: wsB, user_id: userB.id, role: "owner" },
  ])
  await admin.from("profiles").update({ current_workspace_id: wsA }).eq("id", userA.id)
  await admin.from("profiles").update({ current_workspace_id: wsB }).eq("id", userB.id)

  // 4. Seed workspace B across tenant tables (FK-aware order)
  const propB = await insB("properties", { template: "standard_rental", nickname: "B House", address_line1: "1 B St", postcode: "B1 1BB" })
  const contactB = await insB("contacts", { type: "supplier", display_name: "B Supplier" })
  await insB("tasks", { title: "B task" })
  await insB("notifications", { user_id: userB.id, kind: "system", title: "B notif" })
  await insB("documents", { name: "B doc", r2_key: `ws/${wsB}/b.pdf` })
  if (propB && contactB) await insB("supplier_jobs", { property_id: propB, supplier_contact_id: contactB, title: "B job" })
  if (propB) await insB("tenancies", { property_id: propB, start_date: "2026-01-01", rent_amount: 1000, rent_period: "monthly" })

  const seedTables = Object.keys(seeded)
  check("seeded workspace B fixtures", seedTables.length >= 4, `${seedTables.length} tables`)

  // 5. Sign in as user A
  const a = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: signErr } = await a.auth.signInWithPassword({ email: `rlstest+a${S}@propvora-test.com`, password: PW })
  check("user A sign-in", !signErr, signErr?.message)

  // 6. For every seeded table: A must NOT see any workspace-B row (list + by-id)
  for (const table of seedTables) {
    const bId = seeded[table]
    const { data: listed, error: listErr } = await a.from(table).select("id, workspace_id").limit(1000)
    const visibleB = (listed || []).filter((r) => r.workspace_id === wsB || r.id === bId)
    check(`RLS: A cannot LIST workspace-B ${table}`, !listErr ? visibleB.length === 0 : false,
      listErr ? `query error: ${listErr.message}` : `${visibleB.length} B-rows visible (of ${(listed || []).length})`)

    const { data: byId } = await a.from(table).select("id").eq("id", bId)
    check(`IDOR: A cannot FETCH B's ${table} by id`, (byId || []).length === 0, `${(byId || []).length} rows`)
  }

  // 7. Write isolation — A cannot INSERT into workspace B
  const { error: wErr } = await a.from("contacts").insert({ workspace_id: wsB, type: "tenant", display_name: "evil" })
  check("RLS: A cannot INSERT into workspace B", !!wErr, wErr ? wErr.message.slice(0, 60) : "INSERT SUCCEEDED — LEAK")

  // 8. Write isolation — A cannot UPDATE B's contact
  if (seeded.contacts) {
    const { data: upd } = await a.from("contacts").update({ display_name: "hacked" }).eq("id", seeded.contacts).select("id")
    check("RLS: A cannot UPDATE B's contact", (upd || []).length === 0, `${(upd || []).length} rows updated`)
  }
} catch (e) {
  check("harness ran without throwing", false, e.message)
} finally {
  // Cleanup — rows first (FK order via unshift), then memberships/workspaces/profiles/users
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
console.log(`\n=== RLS ISOLATION: ${results.length - failed}/${results.length} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
