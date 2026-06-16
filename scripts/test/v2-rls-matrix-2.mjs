// ============================================================================
// v2 RLS / ISOLATION MATRIX  —  PART 2
//
// Probes EVERY table created in the 2026-06-17 release wave (the payments/money,
// international/country-pack, and legal/iCal migrations) for:
//   1. RLS enabled + at least one policy (Management API introspection).
//   2. The policy's USING expression, auto-classified as:
//        PUBLIC  — USING(true)              → anon read INTENDED (reference data)
//        DENY    — USING(false)             → service-role only (no anon, no member)
//        SCOPED  — is_workspace_member()/workspace_members/EXISTS(...)
//                                            → workspace-scoped; anon MUST be blocked
//   3. An anon-key SELECT, asserting the result matches the intended class:
//        PUBLIC → anon may read (no permission error)
//        DENY / SCOPED → anon MUST be blocked (0 rows OR permission error), and
//        must NEVER return live rows the service role can see.
//   4. The live row count visible to the SERVICE role, so the matrix is honest
//      about whether the table actually had data to leak.
//
// READ-ONLY. No insert/update/delete. No seeding.
//
// Usage: node scripts/test/v2-rls-matrix-2.mjs   [--json]
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"

function loadEnv(p){const o={};try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);o[m[1]]=v}}catch{}return o}
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TOKEN = env.SUPABASE_PERSONAL_ACCESS_KEY
if (!SUPA_URL || !ANON) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON key"); process.exit(2) }
const REF = new URL(SUPA_URL).hostname.split(".")[0]
const JSON_OUT = process.argv.includes("--json")

const anon = createClient(SUPA_URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
const admin = SERVICE ? createClient(SUPA_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } }) : null

// Every table created in the 2026-06-17 wave (payments / intl / legal+ical).
// `intended` is the AUTHOR'S declared intent; the script ALSO derives the class
// from the live USING expression and flags any mismatch.
const TABLES = [
  // ── legal + iCal (THIS session) ──
  { t: "booking_legal_documents", intended: "PUBLIC", note: "public legal registry (USING true)" },
  { t: "booking_listing_legal", intended: "SCOPED", note: "per-listing legal config (workspace member)" },
  { t: "booking_ical_connections", intended: "SCOPED", note: "iCal connections; export token mediated by service-role route only" },
  { t: "booking_ical_sync_events", intended: "SCOPED", note: "iCal sync audit (workspace member read)" },
  // booking_legal_acceptances pre-existed but its RLS was re-asserted this session.
  { t: "booking_legal_acceptances", intended: "SCOPED", note: "server-captured acceptances; member read, no client insert" },
  // ── payments / money accounting ──
  { t: "booking_revenue_entries", intended: "SCOPED" },
  { t: "hold_ledger_entries", intended: "SCOPED" },
  { t: "payment_release_blocks", intended: "SCOPED" },
  { t: "dispute_actions", intended: "SCOPED", note: "read gated to dispute participants" },
  { t: "fee_rule_audit", intended: "DENY", note: "USING(false) → service-role only" },
  { t: "fx_rates", intended: "SCOPED", note: "global rows (workspace_id null) readable + member rows" },
  // ── international / country packs ──
  { t: "address_models", intended: "PUBLIC", note: "reference" },
  { t: "billing_country_matrix", intended: "PUBLIC", note: "reference" },
  { t: "connect_payout_country_matrix", intended: "PUBLIC", note: "reference" },
  { t: "country_consumer_rules", intended: "PUBLIC", note: "reference" },
  { t: "country_invoice_rules", intended: "PUBLIC", note: "reference" },
  { t: "country_pack_audit_events", intended: "PUBLIC", note: "country-pack audit (reference, USING true)" },
  { t: "country_pack_reviews", intended: "PUBLIC", note: "reference" },
  { t: "country_pack_versions", intended: "PUBLIC", note: "reference" },
  { t: "country_privacy_profiles", intended: "PUBLIC", note: "reference" },
  { t: "country_profiles", intended: "PUBLIC", note: "reference" },
  { t: "country_regions", intended: "PUBLIC", note: "reference" },
  { t: "country_release_gates", intended: "PUBLIC", note: "reference" },
  { t: "country_representatives", intended: "PUBLIC", note: "reference" },
  { t: "country_tax_profiles", intended: "PUBLIC", note: "reference" },
  { t: "country_tax_rates", intended: "PUBLIC", note: "reference" },
  { t: "data_transfer_mechanisms", intended: "PUBLIC", note: "reference" },
  { t: "regional_terms_versions", intended: "PUBLIC", note: "reference" },
  { t: "sanctions_country_rules", intended: "PUBLIC", note: "reference" },
  { t: "subprocessor_register", intended: "PUBLIC", note: "public subprocessor list" },
  { t: "intl_translation_keys", intended: "PUBLIC", note: "reference" },
  { t: "intl_translation_namespaces", intended: "PUBLIC", note: "reference" },
  { t: "intl_translation_strings", intended: "PUBLIC", note: "reference" },
  // ── privacy / compliance (workspace) ──
  { t: "privacy_requests", intended: "SCOPED" },
  { t: "privacy_request_events", intended: "SCOPED" },
  { t: "regional_terms_consent_events", intended: "SCOPED" },
  { t: "breach_incident_clocks", intended: "SCOPED" },
]

const failures = []
const fail = (m) => failures.push(m)

// ── 1. introspection: rls, policy count, and the USING expr per table ──────
const intro = {}       // table -> { exists, rls, policy_count, quals:[...] }
let introOk = false
if (TOKEN) {
  const names = TABLES.map((x) => `'${x.t}'`).join(",")
  const sql = `
    SELECT c.relname AS t, c.relrowsecurity AS rls,
      (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid) AS pol,
      COALESCE((SELECT string_agg(COALESCE(pg_get_expr(p.polqual,p.polrelid),'<no-qual>'), ' | ')
                FROM pg_policy p WHERE p.polrelid=c.oid), '') AS quals
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname IN (${names});`
  try {
    const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    })
    if (r.ok) {
      for (const row of await r.json()) {
        intro[row.t] = {
          exists: true,
          rls: row.rls === true || row.rls === "true",
          policy_count: Number(row.pol ?? 0),
          quals: String(row.quals ?? ""),
        }
      }
      introOk = true
    } else { console.log(`(introspection HTTP ${r.status})`) }
  } catch (e) { console.log(`(introspection error: ${e.message})`) }
} else {
  console.log("(no SUPABASE_PERSONAL_ACCESS_KEY — anon probes still run, introspection skipped)")
}

// derive class from the USING expression(s)
function deriveClass(quals) {
  if (!quals) return "UNKNOWN"
  const q = quals.toLowerCase()
  // a table is PUBLIC only if it has a plain USING(true) and no member gate
  const hasTrue = /(^|\|)\s*true\s*($|\|)/.test(quals) || quals.split("|").some((p) => p.trim() === "true")
  const hasMember = /is_workspace_member|workspace_members|auth\.uid\(\)/.test(q)
  const hasExists = /exists/.test(q)
  const allFalse = quals.split("|").every((p) => p.trim() === "false" || p.trim() === "<no-qual>")
  if (allFalse) return "DENY"
  if (hasMember || hasExists) return "SCOPED"
  if (hasTrue) return "PUBLIC"
  return "UNKNOWN"
}

const results = []

// ── 2. anon probe + service count per table ────────────────────────────────
for (const spec of TABLES) {
  const meta = intro[spec.t] || { exists: !introOk ? null : false }
  const row = { table: spec.t, intended: spec.intended, note: spec.note || "", ...meta }
  row.derived = introOk ? deriveClass(meta.quals || "") : "n/a"

  const { data: aData, error: aErr } = await anon.from(spec.t).select("*").limit(50)
  const anonRows = (aData || []).length
  row.anon_rows = anonRows
  row.anon_error = aErr ? aErr.message.slice(0, 70) : null

  let liveRows = null
  if (admin) {
    const { count } = await admin.from(spec.t).select("*", { count: "exact", head: true })
    liveRows = typeof count === "number" ? count : null
  }
  row.live_rows = liveRows

  const missing = (meta.exists === false) ||
    (aErr && /does not exist|could not find the table|schema cache/i.test(aErr.message))
  row.exists = missing ? false : (meta.exists ?? (aErr ? null : true))
  if (row.exists === false) { row.verdict = "NOT_PRESENT"; results.push(row); continue }

  // RLS / policy gates
  if (introOk) {
    if (!meta.rls) { fail(`${spec.t}: RLS NOT enabled`); row.verdict = "RLS_DISABLED"; results.push(row); continue }
    if (meta.policy_count === 0) { fail(`${spec.t}: RLS enabled but 0 policies`); row.verdict = "RLS_NO_POLICY"; results.push(row); continue }
    if (row.derived !== "UNKNOWN" && row.derived !== spec.intended) {
      // not necessarily a failure, but flag the mismatch loudly
      row.mismatch = `intended=${spec.intended} derived=${row.derived}`
    }
  }

  const intended = spec.intended
  const anonBlocked = anonRows === 0
  row.anon_blocked = anonBlocked

  if (intended === "PUBLIC") {
    const permDenied = aErr && /permission denied|row-level security/i.test(aErr.message)
    row.verdict = permDenied ? "PUBLIC_BLOCKED_UNEXPECTED" : "PUBLIC_OK"
    if (permDenied) fail(`${spec.t}: PUBLIC table but anon hit a permission error`)
    // safety: a PUBLIC table whose derived class is SCOPED is a real config bug
    if (introOk && row.derived === "SCOPED") fail(`${spec.t}: marked PUBLIC but USING expr is workspace-scoped`)
  } else {
    // SCOPED / DENY → anon must be blocked
    if (!anonBlocked) { row.verdict = "LEAK"; fail(`${spec.t}: ${intended} table LEAKED ${anonRows} rows to anon (live=${liveRows})`) }
    else { row.verdict = "BLOCKED" }
    // a SCOPED/DENY table whose derived class is PUBLIC would be a real bug
    if (introOk && row.derived === "PUBLIC") fail(`${spec.t}: marked ${intended} but USING expr is true (anon-readable)`)
  }

  results.push(row)
}

// ── output ──────────────────────────────────────────────────────────────────
if (JSON_OUT) {
  console.log(JSON.stringify({ ref: REF, introOk, results, failures }, null, 2))
  process.exit(failures.length ? 1 : 0)
}
const pad = (s, n) => String(s ?? "").padEnd(n)
console.log(`\n=== v2 RLS / ISOLATION MATRIX — PART 2  (project ${REF}) ===`)
console.log(`introspection: ${introOk ? "ON" : "OFF"} · service-role counts: ${admin ? "ON" : "OFF"}\n`)
console.log(pad("TABLE", 34), pad("INTENDED", 9), pad("DERIVED", 8), pad("EXISTS", 7), pad("RLS", 4), pad("POL", 4), pad("ANON", 5), pad("LIVE", 5), "VERDICT")
console.log("-".repeat(120))
let present=0, leaks=0, blocked=0, pub=0, deny=0, notPresent=0
for (const r of results) {
  if (r.verdict === "NOT_PRESENT") notPresent++
  else { present++; if (r.verdict==="LEAK") leaks++; else if (r.verdict==="BLOCKED") blocked++; else if (r.verdict==="PUBLIC_OK") pub++ }
  if (r.intended === "DENY" && r.verdict === "BLOCKED") deny++
  console.log(
    pad(r.table,34), pad(r.intended,9), pad(r.derived,8),
    pad(r.exists===false?"no":(r.exists===null?"?":"yes"),7),
    pad(r.rls===undefined?"?":(r.rls?"Y":"N"),4),
    pad(r.policy_count ?? "?",4), pad(r.anon_rows ?? "?",5), pad(r.live_rows ?? "?",5),
    r.verdict + (r.mismatch ? `  [${r.mismatch}]` : ""),
  )
}
console.log(`\n--- SUMMARY ---`)
console.log(`tables covered:   ${TABLES.length}`)
console.log(`present:          ${present}`)
console.log(`not present:      ${notPresent}`)
console.log(`anon blocked (scoped/deny): ${blocked}`)
console.log(`public-read OK:   ${pub}`)
console.log(`LEAKS:            ${leaks}`)
if (failures.length) { console.log(`\n--- FAILURES (${failures.length}) ---`); failures.forEach((f)=>console.log("  x "+f)) }
else console.log(`\nNo isolation failures detected.`)
process.exit(failures.length ? 1 : 0)
