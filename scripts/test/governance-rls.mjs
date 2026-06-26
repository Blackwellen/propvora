// RLS isolation test for the automation-governance store
// (`workspace_settings.automations.governance`).
//
// Signs in as the QA fixture user (owner of workspace A only) with the ANON key
// — i.e. a real RLS-scoped client — and asserts it can read/write its OWN
// workspace_settings row but can NEVER read or write a FOREIGN workspace's row.
// A service-role client is used only to verify the foreign row is untouched.
//
// Usage: node scripts/test/governance-rls.mjs
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

function loadEnv(p) { const o = {}; try { for (const l of readFileSync(p, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m) continue; let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); o[m[1]] = v } } catch {} return o }
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = "qa-fixture@propvora-test.com"
const PASSWORD = "QaFixture!2026pv"
const WS_A = "7ee76842-a0ee-4ef6-8cb0-cc07c0efd6b4" // fixture user's own workspace
const WS_B = "7d9e941b-c6f1-4293-bcbc-76b2197a69bb" // foreign workspace (JT) — not a member

let pass = 0, fail = 0
const ok = (n) => { pass++; console.log(`  PASS  ${n}`) }
const bad = (n, d) => { fail++; console.log(`  FAIL  ${n}${d ? ` — ${d}` : ""}`) }

async function main() {
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
  const user = createClient(URL, ANON, { auth: { persistSession: false } })

  const { error: signErr } = await user.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (signErr) { console.error("sign-in failed:", signErr.message); process.exit(1) }

  // Snapshot B's automations (service role) so we can prove it stays unchanged.
  const { data: bBefore } = await admin.from("workspace_settings").select("automations").eq("workspace_id", WS_B).maybeSingle()
  const bJsonBefore = JSON.stringify(bBefore?.automations ?? null)

  // 1. POSITIVE: read own workspace settings.
  {
    const { error } = await user.from("workspace_settings").select("automations").eq("workspace_id", WS_A).maybeSingle()
    error ? bad("own read", error.message) : ok("own read (workspace A)")
  }

  // 2. POSITIVE: write own governance.
  const marker = `rls-${Date.now()}`
  {
    const { data: cur } = await user.from("workspace_settings").select("automations").eq("workspace_id", WS_A).maybeSingle()
    const automations = { ...((cur?.automations) ?? {}), governance: { ...(cur?.automations?.governance ?? {}), _rlsMarker: marker } }
    const { error } = await user.from("workspace_settings").upsert({ workspace_id: WS_A, automations, updated_at: new Date().toISOString() }, { onConflict: "workspace_id" })
    error ? bad("own write", error.message) : ok("own write (workspace A)")
  }
  // verify own write landed (service role)
  {
    const { data } = await admin.from("workspace_settings").select("automations").eq("workspace_id", WS_A).maybeSingle()
    data?.automations?.governance?._rlsMarker === marker ? ok("own write persisted") : bad("own write persisted", "marker not found")
  }

  // 3. NEGATIVE: read FOREIGN workspace settings → RLS must hide it (0 rows).
  {
    const { data, error } = await user.from("workspace_settings").select("automations").eq("workspace_id", WS_B)
    if (error) ok("foreign read blocked (error)")
    else if (!data || data.length === 0) ok("foreign read blocked (0 rows)")
    else bad("foreign read", `LEAK — returned ${data.length} row(s)`)
  }

  // 4. NEGATIVE: write FOREIGN workspace settings → must NOT modify B.
  {
    const { error } = await user.from("workspace_settings")
      .upsert({ workspace_id: WS_B, automations: { governance: { _hacked: true } }, updated_at: new Date().toISOString() }, { onConflict: "workspace_id" })
    // Either RLS rejects (error) or it silently affects nothing — verify B unchanged.
    const { data: bAfter } = await admin.from("workspace_settings").select("automations").eq("workspace_id", WS_B).maybeSingle()
    const unchanged = JSON.stringify(bAfter?.automations ?? null) === bJsonBefore && !bAfter?.automations?.governance?._hacked
    if (unchanged) ok(`foreign write blocked${error ? " (error)" : " (no-op)"}`)
    else bad("foreign write", "LEAK — workspace B governance was modified")
  }

  // cleanup own marker
  {
    const { data: cur } = await admin.from("workspace_settings").select("automations").eq("workspace_id", WS_A).maybeSingle()
    const gov = { ...(cur?.automations?.governance ?? {}) }; delete gov._rlsMarker
    await admin.from("workspace_settings").update({ automations: { ...(cur?.automations ?? {}), governance: gov } }).eq("workspace_id", WS_A)
  }

  console.log(`\nGovernance RLS: ${pass} passed, ${fail} failed`)
  process.exit(fail === 0 ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
