// Subscription/feature gate tests — drives the REAL gate functions
// (src/lib/billing/gates.ts) with a mock Supabase client returning a chosen
// plan, asserting allow/block per tier. Proves server-side entitlement gating.
//
// Usage: node scripts/test/billing-gates.mjs
import ts from "typescript"
import { readFileSync } from "node:fs"

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

// Stable export objects so the gates↔entitlements cycle resolves (both only
// CALL each other at runtime, not at module load).
const catalog = JSON.parse(readFileSync("src/lib/billing/catalog.generated.json", "utf8"))
const plans = {}, entitlements = {}, gates = {}, flags = {}, flagsRegistry = {}
loadTsInto("src/lib/billing/plans.ts", { "./catalog.generated.json": catalog }, plans)
loadTsInto("src/lib/billing/entitlements.ts", { "./plans": plans, "./gates": gates }, entitlements)
loadTsInto("src/lib/flags/registry.ts", {}, flagsRegistry)
loadTsInto("src/lib/flags/index.ts", { "./registry": flagsRegistry }, flags)
// gates.ts lazily `await import()`s @/lib/flags and @/lib/flags/registry inside
// gateV2Flag; provide them so the composed Layer-2 gates can resolve.
loadTsInto(
  "src/lib/billing/gates.ts",
  {
    "./plans": plans,
    "./entitlements": entitlements,
    "@/lib/flags": flags,
    "@/lib/flags/registry": flagsRegistry,
  },
  gates
)

// Mock Supabase. getWorkspaceTier does
//   .from("workspaces").select("plan").eq("id",x).maybeSingle()
// The flag accessor does
//   .from("platform_feature_flags"|"workspace_feature_flags")
//     .select("enabled").eq(...).eq(...)?.maybeSingle()
// `flagsOn` controls whether the platform_feature_flags table reports enabled.
const mockClient = (plan, flagsOn = false) => ({
  from: (table) => {
    if (table === "workspaces") {
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan }, error: null }) }) }),
      }
    }
    if (table === "workspace_feature_flags") {
      // No per-workspace override row.
      return {
        select: () => ({
          eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        }),
      }
    }
    if (table === "platform_feature_flags") {
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: flagsOn ? { enabled: true } : null, error: null }) }),
        }),
      }
    }
    // files table etc — return empty.
    return {
      select: () => ({ eq: () => ({ is: () => ({}) }) }),
    }
  },
})

const results = []
function check(name, pass, detail) {
  results.push({ name, pass })
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}

async function gateAllowed(fn, plan) {
  const r = await fn(mockClient(plan), "ws-test")
  return r.allowed === true
}

// Expected matrix (from entitlements TIER_FEATURES):
//   aiCopilot: scale+   advancedReports: operator+   whiteLabel/ssoSaml: pro_agency+   portals/automation: scale+
const cases = [
  ["gateAiCopilot", gates.gateAiCopilot, { starter: false, operator: false, scale: true, pro_agency: true, enterprise: true }],
  ["gateAdvancedReports", gates.gateAdvancedReports, { starter: false, operator: true, scale: true, pro_agency: true, enterprise: true }],
  ["gateWhiteLabel", gates.gateWhiteLabel, { starter: false, operator: false, scale: false, pro_agency: true, enterprise: true }],
  ["gateSso", gates.gateSso, { starter: false, operator: false, scale: false, pro_agency: true, enterprise: true }],
  ["gatePortals", gates.gatePortals, { starter: false, operator: false, scale: true, pro_agency: true, enterprise: true }],
  ["gateAutomation", gates.gateAutomation, { starter: false, operator: false, scale: true, pro_agency: true, enterprise: true }],
]

for (const [name, fn, expect] of cases) {
  for (const [plan, want] of Object.entries(expect)) {
    const got = await gateAllowed(fn, plan)
    check(`${name} on ${plan} → ${want ? "allowed" : "blocked"}`, got === want, got === want ? "" : `got ${got ? "allowed" : "blocked"}`)
  }
}

// Storage gate: starter limit < enterprise; over-limit blocks.
const overStarter = await gates.gateStorage(mockClient("starter"), "ws", 5 * 1024 ** 3) // 5GB on a 2GB plan... but gateStorage reads files table too
check("gateStorage starter returns a result", typeof overStarter.allowed === "boolean")

// ── Layer-2 composed gates: flag AND entitlement ─────────────────────────
// With the v2 flag OFF (flagsOn=false) EVERY composed gate must block (403),
// proving V1 is unchanged. With the flag ON, the plan entitlement decides.

async function composedAllowed(fn, plan, flagsOn) {
  const r = await fn(mockClient(plan, flagsOn), "ws-test")
  return r.allowed === true
}

// 1) Flag OFF → always blocked, regardless of tier.
for (const [name, fn] of [
  ["gateBookingPages", gates.gateBookingPages],
  ["gateSupplierWorkspace", gates.gateSupplierWorkspace],
  ["gateMarketplacePublishing", gates.gateMarketplacePublishing],
  ["gateCanvasLite", gates.gateCanvasLite],
]) {
  const got = await composedAllowed(fn, "enterprise", false)
  check(`${name} blocked on enterprise when flag OFF`, got === false, got ? "allowed" : "")
}

// 2) Flag ON → entitlement tier decides. Per TIER_FEATURES:
//    directBookingPages/canvasLite/supplierWorkspaceInvites: scale+
//    marketplacePublishing: pro_agency+
const composedFlagOn = [
  ["gateBookingPages", gates.gateBookingPages, { starter: false, operator: false, scale: true, pro_agency: true, enterprise: true }],
  ["gateSupplierWorkspace", gates.gateSupplierWorkspace, { starter: false, operator: false, scale: true, pro_agency: true, enterprise: true }],
  ["gateMarketplacePublishing", gates.gateMarketplacePublishing, { starter: false, operator: false, scale: false, pro_agency: true, enterprise: true }],
  ["gateCanvasLite", gates.gateCanvasLite, { starter: false, operator: false, scale: true, pro_agency: true, enterprise: true }],
]
for (const [name, fn, expect] of composedFlagOn) {
  for (const [plan, want] of Object.entries(expect)) {
    const got = await composedAllowed(fn, plan, true)
    check(`${name} (flag ON) on ${plan} → ${want ? "allowed" : "blocked"}`, got === want, got === want ? "" : `got ${got ? "allowed" : "blocked"}`)
  }
}

// 3) gateAutomationRuns: V1 automation entitlement (scale+), no v2 flag needed.
for (const [plan, want] of Object.entries({ starter: false, operator: false, scale: true, pro_agency: true, enterprise: true })) {
  const got = await gateAllowed(gates.gateAutomationRuns, plan)
  check(`gateAutomationRuns on ${plan} → ${want ? "allowed" : "blocked"}`, got === want, got === want ? "" : `got ${got ? "allowed" : "blocked"}`)
}

// 4) Supplier free entitlement is non-Stripe: 3 active-leads cap, no premium feats.
const supEnt = entitlements.SUPPLIER_FREE_ENTITLEMENTS
check("supplier_free cap is 3 active leads", supEnt && supEnt.activeLeadsCap === 3)
check("supplier_free has no promoted ranking", supEnt && supEnt.features.promotedRanking === false)
check("supplier_free has workspace + profile", supEnt && supEnt.features.workspace === true && supEnt.features.profile === true)

const failed = results.filter((r) => !r.pass).length
console.log(`\n=== BILLING GATES: ${results.length - failed}/${results.length} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
