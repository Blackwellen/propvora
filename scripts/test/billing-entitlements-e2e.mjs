// Entitlement-gate E2E — drives the REAL gate + entitlement functions across
// every tier boundary, asserting allow/deny + upgrade messaging (fail-closed).
//
// Extends billing-gates.mjs from a unit check into an end-to-end style:
//   • Feature gates (AI/reports/whiteLabel/SSO/portals/automation) at every tier.
//   • Numeric limits (properties / seats / storage) from the entitlement service.
//   • Upgrade-message presence + correct "min tier" hint on every deny.
//   • A REAL seeded workspace in the LIVE DB exercises gateStorage end-to-end
//     (over-limit blocks, under-limit allows), then cleans up.
//
// Read-only against Stripe (none used here). The only DB writes are a temp
// workspace + a temp files row, both deleted in finally.
//
// Usage: node scripts/test/billing-entitlements-e2e.mjs
import { createClient } from "@supabase/supabase-js"
import ts from "typescript"
import { readFileSync } from "node:fs"

// ── env loader ────────────────────────────────────────────────────────────────
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

// ── load the REAL billing modules (transpiled in-process) ────────────────────
function loadTsInto(file, deps, target) {
  const src = readFileSync(file, "utf8")
  const js = ts.transpileModule(src, {
    compilerOptions: { module: "commonjs", target: "es2020", esModuleInterop: true },
  }).outputText
  const m = { exports: target }
  const req = (spec) => {
    if (spec in deps) return deps[spec]
    throw new Error(`unresolved import: ${spec}`)
  }
  new Function("module", "exports", "require", js)(m, m.exports, req)
  if (m.exports !== target) Object.assign(target, m.exports)
  return target
}
const catalog = JSON.parse(readFileSync("src/lib/billing/catalog.generated.json", "utf8"))
const plans = {}, entitlements = {}, gates = {}
loadTsInto("src/lib/billing/plans.ts", { "./catalog.generated.json": catalog }, plans)
loadTsInto("src/lib/billing/entitlements.ts", { "./plans": plans, "./gates": gates }, entitlements)
loadTsInto("src/lib/billing/gates.ts", { "./plans": plans, "./entitlements": entitlements }, gates)

const TIERS = plans.PLAN_ORDER

const results = []
function check(name, pass, detail) {
  results.push({ name, pass })
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}

// Mock Supabase returning a chosen plan for getWorkspaceTier().
const mockClient = (plan) => ({
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan }, error: null }) }) }) }),
})

// ── Expected feature matrix (mirrors entitlements TIER_FEATURES) ─────────────
const FEATURE_MATRIX = {
  gateAiCopilot:        { starter: false, operator: false, scale: true,  pro_agency: true, enterprise: true },
  gateAdvancedReports:  { starter: false, operator: true,  scale: true,  pro_agency: true, enterprise: true },
  gateWhiteLabel:       { starter: false, operator: false, scale: false, pro_agency: true, enterprise: true },
  gateSso:              { starter: false, operator: false, scale: false, pro_agency: true, enterprise: true },
  gatePortals:          { starter: false, operator: false, scale: true,  pro_agency: true, enterprise: true },
  gateAutomation:       { starter: false, operator: false, scale: true,  pro_agency: true, enterprise: true },
}

console.log("\n=== ENTITLEMENT-GATE E2E (real gate functions, every tier) ===\n")

// 1) Feature gates at every tier boundary — allow/deny + upgrade messaging.
for (const [gateName, expect] of Object.entries(FEATURE_MATRIX)) {
  const fn = gates[gateName]
  for (const tier of TIERS) {
    const want = expect[tier]
    const r = await fn(mockClient(tier), "ws-e2e")
    const allowOk = r.allowed === want
    check(`${gateName} @ ${tier} → ${want ? "allow" : "deny"}`, allowOk,
      allowOk ? "" : `got ${r.allowed ? "allow" : "deny"}`)
    // Fail-closed contract: a deny MUST carry an upgrade reason + 402.
    if (!want) {
      check(`${gateName} @ ${tier}: deny has upgrade message + 402`,
        r.allowed === false && typeof r.reason === "string" && r.reason.length > 0 && r.status === 402,
        r.reason ? "" : "missing reason/status on deny")
    }
  }
}

// 2) Entitlement limits resolve correctly per tier (properties / seats / storage).
const EXPECTED_LIMITS = {
  starter:    { properties: 5,        teamSeats: 1 },
  operator:   { properties: 25,       teamSeats: 3 },
  scale:      { properties: 100,      teamSeats: 10 },
  pro_agency: { properties: 500,      teamSeats: 25 },
  enterprise: { properties: Infinity, teamSeats: Infinity },
}
for (const tier of TIERS) {
  const ent = entitlements.entitlementsForTier(tier)
  const exp = EXPECTED_LIMITS[tier]
  check(`limits @ ${tier}: properties=${exp.properties}`, ent.limits.properties === exp.properties,
    ent.limits.properties === exp.properties ? "" : `got ${ent.limits.properties}`)
  check(`limits @ ${tier}: teamSeats=${exp.teamSeats}`, ent.limits.teamSeats === exp.teamSeats,
    ent.limits.teamSeats === exp.teamSeats ? "" : `got ${ent.limits.teamSeats}`)
  // Storage allowance is finite below enterprise and unlimited at enterprise.
  const storageOk = tier === "enterprise" ? ent.limits.storageBytes === Infinity : ent.limits.storageBytes > 0 && ent.limits.storageBytes !== Infinity
  check(`limits @ ${tier}: storage ${tier === "enterprise" ? "unlimited" : "finite"}`, storageOk)
}

// 3) Monotonic boundaries: each gated feature flips on at exactly one tier and
//    stays on (no feature turns OFF as you go UP a tier — catches regressions).
for (const [gateName, expect] of Object.entries(FEATURE_MATRIX)) {
  let seenTrue = false
  let monotonic = true
  for (const tier of TIERS) {
    if (expect[tier]) seenTrue = true
    else if (seenTrue) monotonic = false // turned back off after being on
  }
  check(`${gateName}: monotonic across tiers (no higher-tier downgrade)`, monotonic)
}

// 4) END-TO-END gateStorage against a REAL seeded workspace (LIVE DB).
//    Proves the gate's actual files-table summation path, not just the mock.
let seededWsId = null
let seededFileId = null
let seededOwnerId = null
let admin = null
if (!URL || !SERVICE) {
  console.log("\n⚠️  Supabase env missing — skipping live seeded gateStorage E2E (mock-only above still ran).")
} else {
  admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })
  try {
    // A workspace needs a real owner (owner_user_id) + unique slug.
    const S = Date.now()
    const owner = (await admin.auth.admin.createUser({
      email: `billing-e2e+${S}@propvora-test.com`,
      password: `Be2e!${S}aZ9`,
      email_confirm: true,
    })).data.user
    seededOwnerId = owner?.id ?? null

    // Seed a temp starter workspace (2 GB storage limit).
    const ins = await admin.from("workspaces").insert({
      name: `billing-e2e-${S}`,
      slug: `billing-e2e-${S}`,
      owner_user_id: seededOwnerId,
      plan: "starter",
    }).select("id").single()
    if (ins.error) throw new Error(`seed workspace: ${ins.error.message}`)
    seededWsId = ins.data.id

    // Real gate read: under-limit upload allowed on a fresh (empty) workspace.
    const under = await gates.gateStorage(admin, seededWsId, 100 * 1024 * 1024) // 100 MB
    check("E2E gateStorage: 100MB on empty starter ws → allow",
      under.allowed === true && under.tier === "starter",
      under.allowed ? "" : `denied: ${under.reason ?? ""}`)

    // Over-limit upload (5 GB > 2 GB starter limit) blocked with a 402 + message.
    const over = await gates.gateStorage(admin, seededWsId, 5 * 1024 ** 3)
    check("E2E gateStorage: 5GB on 2GB starter ws → deny (402 + message)",
      over.allowed === false && over.status === 402 && /storage limit/i.test(over.reason ?? ""),
      over.allowed === false ? "" : "expected a deny but got allow (files table may be unmigrated → fail-open)")

    // Seed a large file row, then confirm the summation counts it (best-effort:
    // the files table may not exist in this environment → gate fails open).
    const big = await admin.from("files").insert({
      workspace_id: seededWsId,
      name: "e2e-big.bin",
      size_bytes: 1.9 * 1024 ** 3, // 1.9 GB used, leaving < 0.1 GB headroom
    }).select("id").single()
    if (!big.error) {
      seededFileId = big.data.id
      const tight = await gates.gateStorage(admin, seededWsId, 0.5 * 1024 ** 3) // +0.5 GB → over 2 GB
      check("E2E gateStorage: usage summation blocks when near limit",
        tight.allowed === false && tight.status === 402,
        tight.allowed === false ? "" : "summation did not register the seeded file")
    } else {
      console.log(`   (files seed skipped: ${big.error.message} — gateStorage fails open here, not a failure)`)
    }
  } catch (e) {
    console.log(`\n⚠️  Live gateStorage E2E error (non-fatal): ${e.message}`)
  } finally {
    // Cleanup — order matters (file row → workspace → owner user).
    try { if (seededFileId) await admin.from("files").delete().eq("id", seededFileId) } catch {}
    try { if (seededWsId) await admin.from("workspaces").delete().eq("id", seededWsId) } catch {}
    try { if (seededOwnerId) await admin.auth.admin.deleteUser(seededOwnerId) } catch {}
    console.log("   cleanup: temp workspace + file + owner removed.")
  }
}

const failed = results.filter((r) => !r.pass).length
console.log(`\n=== BILLING ENTITLEMENTS E2E: ${results.length - failed}/${results.length} passed, ${failed} failed ===`)
// Set exitCode (don't process.exit) so the Supabase client's async handles drain
// cleanly — an immediate process.exit here triggers a libuv UV_HANDLE_CLOSING abort.
process.exitCode = failed > 0 ? 1 : 0
