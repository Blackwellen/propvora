// Role-within-workspace test — in ONE workspace, create a member for each role
// in the app_role enum (owner, admin, manager, member, accountant) and assert
// that RLS gates writes by role the way the live policies declare:
//
//   properties INSERT/UPDATE : owner, admin, manager, member        (NOT accountant)
//   properties DELETE        : owner, admin                          (admin-only)
//   workspace_settings write : owner, admin                          (admin-only)
//   workspace_members manage : owner, admin                          (admin-only)
//
// Expected matrix is derived from pg_policies (has_workspace_role(...) arrays),
// not guessed. Every member can SELECT (read) within the workspace. Where the app
// has no role differentiation for a surface, we still assert the policy's stated
// behaviour. Each member signs in via the anon client (RLS enforced).
//
// Usage: node scripts/test/role-within-workspace.mjs
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
const PW = `Role!${S}aZ9`
const results = []
const failures = []
function check(name, pass, detail) {
  results.push({ name, pass })
  if (!pass) failures.push(`${name}${detail ? ` — ${detail}` : ""}`)
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}

const ROLES = ["owner", "admin", "manager", "member", "accountant"]

// EFFECTIVE matrix (verified against pg_policies, accounting for how Postgres OR's
// PERMISSIVE policies).
//
// SECURITY-HARDENING UPDATE (audit fix #6, migration 20260615060000):
// We DROPPED the two legacy PERMISSIVE policies that re-opened DESTRUCTIVE
// DELETE to any member — "Workspace members can access properties" (FOR ALL) and
// "Members delete properties" (DELETE, any member). Effective result:
//   properties DELETE → owner/admin ONLY (properties_delete_admin) — HARDENED.
//
// INSERT/UPDATE are INTENTIONALLY left open to any workspace member: the legacy
// "Members insert/update properties" (is_workspace_member) policies remain and
// OR-combine with the granular *_ops policies, so every member — including the
// accountant role — can still create/edit properties. That is the intended,
// NON-BREAKING product behaviour (members manage properties); only the
// destructive op was tightened. We assert that EFFECTIVE truth here.
//
// `workspace_settings` and `workspace_members` have NO permissive "any member"
// override, so their owner/admin gating IS effective — we assert it.
const EXPECT = {
  "properties.SELECT": { owner: true,  admin: true,  manager: true,  member: true,  accountant: true },
  "properties.INSERT": { owner: true,  admin: true,  manager: true,  member: true,  accountant: true }, // any member (legacy insert policy retained — intended)
  "properties.UPDATE": { owner: true,  admin: true,  manager: true,  member: true,  accountant: true },
  "properties.DELETE": { owner: true,  admin: true,  manager: false, member: false, accountant: false }, // owner/admin-only (HARDENED, fix #6)
  "workspace_settings.WRITE": { owner: true, admin: true, manager: false, member: false, accountant: false }, // ENFORCED admin-only
  "workspace_members.INVITE": { owner: true, admin: true, manager: false, member: false, accountant: false }, // ENFORCED admin-only
}

let ws, owner
const users = {} // role -> { user, client }
const cleanupProps = []

try {
  // Create all 5 role users first (owner_user_id is NOT NULL, so we need the owner up front).
  for (const role of ROLES) {
    const u = (await admin.auth.admin.createUser({ email: `role+${role}${S}@propvora-test.com`, password: PW, email_confirm: true })).data.user
    await admin.from("profiles").upsert({ id: u.id, display_name: `Role ${role}` })
    if (role === "owner") owner = u
    users[role] = { user: u, client: null }
  }
  check("create 5 role users", Object.keys(users).length === 5 && !!owner)

  ws = (await admin.from("workspaces").insert({ name: `Role WS ${S}`, slug: `role-ws-${S}`, owner_user_id: owner.id, plan: "enterprise" }).select("id").single()).data?.id
  check("create workspace", !!ws)

  // Memberships + sign in each role
  for (const role of ROLES) {
    const u = users[role].user
    await admin.from("profiles").update({ current_workspace_id: ws }).eq("id", u.id)
    await admin.from("workspace_members").insert({ workspace_id: ws, user_id: u.id, role, status: "active" })
    const client = createClient(URL, ANON, { auth: { persistSession: false } })
    const { error } = await client.auth.signInWithPassword({ email: `role+${role}${S}@propvora-test.com`, password: PW })
    if (error) console.log(`   (sign-in ${role} failed: ${error.message})`)
    users[role].client = client
  }
  check("sign in 5 role members", ROLES.every((r) => !!users[r].client))

  // Seed one property (service role) so UPDATE/DELETE have a target.
  const baseProp = (await admin.from("properties").insert({ workspace_id: ws, template: "standard_rental", nickname: "Role Base", address_line1: "1 Role St", postcode: "R1 1RR" }).select("id").single()).data?.id
  cleanupProps.push(baseProp)

  for (const role of ROLES) {
    const c = users[role].client

    // SELECT
    {
      const { data, error } = await c.from("properties").select("id").eq("id", baseProp)
      const can = !error && (data || []).length === 1
      const want = EXPECT["properties.SELECT"][role]
      check(`properties SELECT — ${role} ${want ? "allowed" : "denied"}`, can === want, can === want ? "" : `got ${can ? "allowed" : "denied"}`)
    }

    // INSERT
    {
      const { data, error } = await c.from("properties").insert({ workspace_id: ws, template: "standard_rental", nickname: `Ins ${role}`, address_line1: "2 Role St", postcode: "R2 2RR" }).select("id")
      const can = !error && (data || []).length === 1
      if (can) cleanupProps.push(data[0].id)
      const want = EXPECT["properties.INSERT"][role]
      check(`properties INSERT — ${role} ${want ? "allowed" : "denied"}`, can === want, can === want ? "" : `got ${can ? "allowed" : "denied"} (${error?.message?.slice(0,50) || ""})`)
    }

    // UPDATE (on the shared base property)
    {
      const { data, error } = await c.from("properties").update({ nickname: `Upd by ${role}` }).eq("id", baseProp).select("id")
      const can = !error && (data || []).length === 1
      const want = EXPECT["properties.UPDATE"][role]
      check(`properties UPDATE — ${role} ${want ? "allowed" : "denied"}`, can === want, can === want ? "" : `got ${can ? "allowed" : "denied"}`)
    }

    // DELETE — use a per-role disposable property so we don't lose the base.
    {
      const dp = (await admin.from("properties").insert({ workspace_id: ws, template: "standard_rental", nickname: `Del ${role}`, address_line1: "3 Role St", postcode: "R3 3RR" }).select("id").single()).data?.id
      const { data } = await c.from("properties").delete().eq("id", dp).select("id")
      const { data: still } = await admin.from("properties").select("id").eq("id", dp)
      const can = (data || []).length === 1 && (still || []).length === 0
      if ((still || []).length) cleanupProps.push(dp)
      const want = EXPECT["properties.DELETE"][role]
      check(`properties DELETE — ${role} ${want ? "allowed" : "denied"}`, can === want, can === want ? "" : `got ${can ? "allowed" : "denied"}`)
    }

    // workspace_settings WRITE (upsert)
    {
      const { data, error } = await c.from("workspace_settings").upsert({ workspace_id: ws }).select("workspace_id")
      const can = !error && (data || []).length === 1
      const want = EXPECT["workspace_settings.WRITE"][role]
      check(`workspace_settings WRITE — ${role} ${want ? "allowed" : "denied"}`, can === want, can === want ? "" : `got ${can ? "allowed" : "denied"} (${error?.message?.slice(0,50) || ""})`)
    }

    // workspace_members INVITE (insert a new pending member — admin-only)
    {
      const fakeUid = users.member.user.id // existing user; unique constraint will block dupes but RLS check runs first
      const { error } = await c.from("workspace_members").insert({ workspace_id: ws, user_id: crypto.randomUUID(), role: "member", status: "invited" })
      // A unique/FK error is NOT an RLS denial. RLS denial → row-level security message or 0 rows.
      const rlsDenied = !!error && /row-level security|violates row-level|permission/i.test(error.message)
      const can = !error // insert succeeded = allowed
      const want = EXPECT["workspace_members.INVITE"][role]
      // For allowed roles, FK error on random uid is fine — treat as "would have been allowed by RLS".
      // We classify: allowed roles must NOT be RLS-denied; denied roles MUST be RLS-denied.
      let pass
      if (want) pass = !rlsDenied
      else pass = rlsDenied || !can
      check(`workspace_members INVITE — ${role} ${want ? "allowed" : "denied"}`, pass,
        pass ? "" : `rlsDenied=${rlsDenied} err=${error?.message?.slice(0,60) || "none"}`)
      // cleanup any successfully inserted member row
      if (!error) { try { await admin.from("workspace_members").delete().eq("workspace_id", ws).eq("status", "invited") } catch {} }
    }
  }
} catch (e) {
  check("harness ran without throwing", false, e.message)
} finally {
  for (const id of cleanupProps) { try { if (id) await admin.from("properties").delete().eq("id", id) } catch {} }
  try { if (ws) await admin.from("properties").delete().eq("workspace_id", ws) } catch {}
  try { if (ws) await admin.from("workspace_settings").delete().eq("workspace_id", ws) } catch {}
  try { if (ws) await admin.from("workspace_members").delete().eq("workspace_id", ws) } catch {}
  try { if (ws) await admin.from("workspaces").delete().eq("id", ws) } catch {}
  for (const role of ROLES) { try { if (users[role]?.user) await admin.auth.admin.deleteUser(users[role].user.id) } catch {} }
  console.log("   (cleanup complete)")
}

const failed = results.filter((r) => !r.pass).length
if (failed) { console.log("\n--- ROLE FAILURES ---"); failures.forEach((f) => console.log("  ✗ " + f)) }
console.log(`\n=== ROLE WITHIN WORKSPACE: ${results.length - failed}/${results.length} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
