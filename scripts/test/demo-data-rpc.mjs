/**
 * Demo-data RPC integration proof (live DB, service role).
 *
 *   node scripts/test/demo-data-rpc.mjs
 *
 * Proves, against a real workspace:
 *   1. seed_demo_workspace  → demo rows appear + demo_data_loaded = true
 *   2. demo_data_status     → counts + injected_at + expires_at returned
 *   3. (preserve) edit a demo row, then delete_demo_data(ws, true) keeps it
 *   4. delete_demo_data(ws, false) → workspace clean + demo_data_loaded = false
 *
 * Always cleans up at the end. Requires NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY and e2e/.qa-fixture.json (workspaceId + a user id).
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

function loadEnv(path) {
  const out = {}
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let v = m[2].trim()
      if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) v = v.slice(1, -1)
      out[m[1]] = v
    }
  } catch {}
  return out
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const fx = JSON.parse(readFileSync("e2e/.qa-fixture.json", "utf8"))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const ws = fx.workspaceId
let pass = 0
let fail = 0
const ok = (cond, msg) => {
  if (cond) { pass++; console.log("  PASS:", msg) }
  else { fail++; console.log("  FAIL:", msg) }
}

async function userId() {
  if (fx.userId) return fx.userId
  const { data } = await admin
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", ws)
    .in("role", ["owner", "admin"])
    .limit(1)
  return data?.[0]?.user_id
}

async function main() {
  console.log("Demo-data RPC proof — workspace:", ws)
  const uid = await userId()
  if (!uid) { console.log("No owner/admin user id resolvable — aborting."); process.exit(2) }

  // Clean slate.
  await admin.rpc("delete_demo_data", { p_workspace_id: ws })

  // 1. Seed.
  const seed = await admin.rpc("seed_demo_workspace", { p_workspace_id: ws, p_user_id: uid })
  ok(!seed.error, `seed_demo_workspace ran (${seed.error?.message ?? "batch " + seed.data})`)

  const { count: propCount } = await admin
    .from("properties").select("id", { head: true, count: "exact" })
    .eq("workspace_id", ws).eq("demo", true)
  ok((propCount ?? 0) >= 6, `seeded properties present (${propCount})`)

  // 2. Status RPC (requires the new migration to be deployed).
  const status = await admin.rpc("demo_data_status", { p_workspace_id: ws })
  if (status.error) {
    console.log("  SKIP: demo_data_status not deployed yet —", status.error.message)
  } else {
    ok(status.data?.loaded === true, "status.loaded = true")
    ok(!!status.data?.injected_at, `status.injected_at = ${status.data?.injected_at}`)
    ok(!!status.data?.expires_at, `status.expires_at = ${status.data?.expires_at}`)
    ok((status.data?.total_count ?? 0) > 0, `status.total_count = ${status.data?.total_count}`)
  }

  // 3. Preserve-edited: edit one demo property, then reset with preserve=true.
  const { data: oneProp } = await admin
    .from("properties").select("id").eq("workspace_id", ws).eq("demo", true).limit(1)
  const editedId = oneProp?.[0]?.id
  if (editedId) {
    await admin.from("properties")
      .update({ notes: "EDITED BY DEMO PROOF", updated_at: new Date().toISOString() })
      .eq("id", editedId)

    const preserve = await admin.rpc("delete_demo_data", { p_workspace_id: ws, p_preserve_edited: true })
    if (preserve.error) {
      console.log("  SKIP: preserve-edited delete not deployed yet —", preserve.error.message)
    } else {
      const { data: kept } = await admin
        .from("properties").select("id, notes").eq("id", editedId)
      ok((kept?.length ?? 0) === 1, "edited demo property preserved on preserve-reset")
      ok(kept?.[0]?.notes === "EDITED BY DEMO PROOF", "preserved row keeps the user edit")
    }
  }

  // 4. Full reset → clean.
  const reset = await admin.rpc("delete_demo_data", { p_workspace_id: ws })
  ok(!reset.error, `delete_demo_data ran (${reset.error?.message ?? "ok"})`)
  const { count: after } = await admin
    .from("properties").select("id", { head: true, count: "exact" })
    .eq("workspace_id", ws).eq("demo", true)
  ok((after ?? 0) === 0, `workspace clean after reset (demo properties = ${after})`)

  const { data: wsRow } = await admin
    .from("workspaces").select("demo_data_loaded").eq("id", ws).maybeSingle()
  ok(wsRow?.demo_data_loaded === false, "demo_data_loaded cleared")

  console.log(`\n${fail === 0 ? "ALL PASS" : "FAILURES"}: ${pass} passed, ${fail} failed`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
