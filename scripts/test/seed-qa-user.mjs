// Persistent QA fixture: a confirmed test user + workspace + membership for
// browser click-through QA. Idempotent (safe to re-run). Writes credentials +
// workspace id to e2e/.qa-fixture.json for the Playwright drive spec.
//
// Usage: node scripts/test/seed-qa-user.mjs
import { createClient } from "@supabase/supabase-js"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"

function loadEnv(p) { const o={}; try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);o[m[1]]=v}}catch{} return o }
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

const EMAIL = "qa-fixture@propvora-test.com"
const PASSWORD = "QaFixture!2026pv"
const SLUG = "qa-fixture-ws"

async function main() {
  // 1. User (find or create)
  let userId
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
  const existing = list?.users?.find((u) => u.email === EMAIL)
  if (existing) {
    userId = existing.id
    await admin.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true })
    console.log("reused user", userId)
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true })
    if (error) throw error
    userId = data.user.id
    console.log("created user", userId)
  }
  await admin.from("profiles").upsert({ id: userId, display_name: "QA Fixture" })

  // 2. Workspace (find or create by slug)
  let wsId
  const { data: ws } = await admin.from("workspaces").select("id").eq("slug", SLUG).maybeSingle()
  if (ws) { wsId = ws.id; console.log("reused workspace", wsId) }
  else {
    const { data, error } = await admin.from("workspaces").insert({ name: "QA Fixture Workspace", slug: SLUG, owner_user_id: userId, plan: "scale" }).select("id").single()
    if (error) throw error
    wsId = data.id; console.log("created workspace", wsId)
  }

  // 3. Membership + current workspace
  await admin.from("workspace_members").upsert({ workspace_id: wsId, user_id: userId, role: "owner" }, { onConflict: "workspace_id,user_id" })
  await admin.from("profiles").update({ current_workspace_id: wsId }).eq("id", userId)

  mkdirSync("e2e", { recursive: true })
  writeFileSync("e2e/.qa-fixture.json", JSON.stringify({ email: EMAIL, password: PASSWORD, workspaceId: wsId, userId }, null, 2))
  console.log("wrote e2e/.qa-fixture.json")
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
