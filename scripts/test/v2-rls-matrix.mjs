// v2 RLS / ISOLATION MATRIX — verifies that every v2 marketplace-platform table
// enforces workspace isolation, and that the anon role can reach ONLY the
// intentionally-public surfaces (published marketplace listings + their media/
// pricing/availability, reference/global tables, and the public booking RPC).
//
// This probe is READ-ONLY. It performs:
//   1. Management API introspection (pg_class / pg_policy) for every v2 table:
//        - exists, relrowsecurity (RLS enabled), relforcerowsecurity, policy_count
//   2. Anon-key SELECT against every v2 table and asserts the row count matches
//      the table's INTENDED anon exposure:
//        - PUBLIC tables (reference/global, published-listing surfaces, public
//          legal docs) → anon MAY read (>=0 rows, no permission error).
//        - WORKSPACE-SCOPED / ADMIN / append-only tables → anon MUST be blocked
//          (0 rows OR a permission error — never live workspace rows).
//   3. The public booking RPC (create_public_reservation) is confirmed callable
//      by anon at the RPC layer WITHOUT actually creating a reservation (we call
//      with a non-existent listing id and assert it is rejected by validation,
//      not by a "function does not exist / permission denied" error). No write.
//   4. Append-only ledgers — confirms the immutable trigger exists via
//      introspection (UPDATE/DELETE rejection is enforced by a BEFORE trigger).
//
// It does NOT insert, update, or delete any data. Because it does not seed a
// throwaway workspace, "anon sees 0 rows" is a weaker proof than the seeded
// anon-exposure.mjs probe for tables that happen to be empty; we therefore ALSO
// report, per table, the LIVE row count visible to the SERVICE role, so the
// matrix is honest about whether the table had data to leak.
//
// Usage: node scripts/test/v2-rls-matrix.mjs
//        node scripts/test/v2-rls-matrix.mjs --json   (machine-readable summary)
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

// Exposure classes:
//   PUBLIC      — anon SELECT is INTENDED (reference/global, published surfaces, public docs)
//   SCOPED      — workspace-scoped; anon MUST be blocked (0 rows / permission error)
//   ADMIN       — platform-admin / service only; anon MUST be blocked
//   SELF        — per-user rows (user_id = auth.uid()); anon MUST be blocked
// `ledger:true` flags append-only tables that must carry an immutability trigger.
const TABLES = [
  // --- marketplace core ---
  { t: "marketplace_listings", cls: "SCOPED", note: "published rows readable via separate published_read policy (status='published')" },
  { t: "marketplace_listing_media", cls: "SCOPED", note: "published-listing media readable; rest workspace-scoped" },
  { t: "marketplace_listing_availability", cls: "SCOPED" },
  { t: "marketplace_listing_pricing", cls: "SCOPED" },
  { t: "marketplace_categories", cls: "PUBLIC", note: "reference taxonomy, USING(true)" },
  { t: "marketplace_transactions", cls: "SCOPED" },
  { t: "marketplace_commission_ledger", cls: "SCOPED", ledger: true },
  { t: "marketplace_reviews", cls: "SCOPED", note: "read gated to participants" },
  { t: "marketplace_disputes", cls: "SCOPED" },
  { t: "marketplace_trust_scores", cls: "PUBLIC", note: "trust scores read USING(true) — public trust signal" },
  { t: "marketplace_terms_acceptance", cls: "SCOPED" },
  { t: "marketplace_risk_signals", cls: "SCOPED" },
  { t: "marketplace_fee_rules", cls: "PUBLIC", note: "fee schedule read for authenticated; verify anon exposure" },
  // --- supplier workspace ---
  { t: "supplier_workspace_profiles", cls: "SCOPED" },
  { t: "supplier_workspace_services", cls: "SCOPED" },
  { t: "supplier_workspace_coverage_areas", cls: "SCOPED" },
  { t: "supplier_workspace_availability", cls: "SCOPED" },
  { t: "supplier_workspace_onboarding_state", cls: "SCOPED" },
  { t: "supplier_connections", cls: "SCOPED" },
  { t: "supplier_marketplace_quotes", cls: "SCOPED" },
  { t: "supplier_job_assignments", cls: "SCOPED" },
  // --- bookings ---
  { t: "bookings", cls: "SCOPED" },
  { t: "rate_plans", cls: "SCOPED", note: "published-listing rate plans readable" },
  { t: "booking_blocked_dates", cls: "SCOPED", note: "published-listing blocked dates readable" },
  // --- payments / escrow ---
  { t: "escrow_payments", cls: "SCOPED" },
  { t: "escrow_holds", cls: "SCOPED" },
  { t: "payouts", cls: "SCOPED" },
  { t: "payout_ledger", cls: "SCOPED", ledger: true },
  { t: "payments_webhook_events", cls: "ADMIN", note: "RLS enabled, no policy → service-only (public webhook handler uses service role)" },
  // --- identity / KYC ---
  { t: "identity_verifications", cls: "SCOPED" },
  { t: "verification_documents", cls: "SCOPED" },
  { t: "verification_checks", cls: "SCOPED" },
  { t: "sanctions_screenings", cls: "SCOPED" },
  // --- customer workspace ---
  { t: "customer_profiles", cls: "SCOPED" },
  { t: "customer_saved_listings", cls: "SCOPED" },
  // --- risk engine ---
  { t: "risk_events", cls: "ADMIN", note: "platform-admin only" },
  { t: "risk_scores", cls: "ADMIN", note: "admin all + workspace-member read" },
  // --- automation v2 ---
  { t: "automation_definitions", cls: "SCOPED" },
  { t: "automation_v2_runs", cls: "SCOPED" },
  { t: "automation_run_steps", cls: "SCOPED" },
  { t: "automation_webhook_endpoints", cls: "SCOPED" },
  { t: "automation_webhook_deliveries", cls: "SCOPED" },
  // --- reference / global (global read OK) ---
  { t: "country_packs", cls: "PUBLIC", note: "reference, USING(true)" },
  { t: "country_tax_rules", cls: "PUBLIC", note: "reference, USING(true)" },
  { t: "jurisdiction_profiles", cls: "PUBLIC", note: "reference, USING(true)" },
  // --- marketplace legal ---
  { t: "marketplace_legal_documents", cls: "PUBLIC", note: "public legal docs, USING(true)" },
  { t: "marketplace_policy_acceptance", cls: "SELF", note: "per-user (user_id=auth.uid()); anon has no uid → 0 rows" },
  // --- partner relationships (may not exist) ---
  { t: "partner_relationships", cls: "SCOPED" },
]

const results = []   // per-table result objects
const failures = []
function fail(msg){ failures.push(msg) }

// ---- 1. Management API introspection -------------------------------------
let introspect = {}   // table -> { exists, rls_enabled, rls_forced, policy_count }
let triggers = {}     // table -> [trigger names]
let introspectOk = false
if (TOKEN) {
  const names = TABLES.map((x) => `'${x.t}'`).join(",")
  const sql = `
    SELECT c.relname AS table,
           c.relrowsecurity AS rls_enabled,
           c.relforcerowsecurity AS rls_forced,
           (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname IN (${names});`
  const trigSql = `
    SELECT c.relname AS table, t.tgname AS trigger
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND NOT t.tgisinternal AND c.relname IN (${names});`
  try {
    const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    })
    if (r.ok) {
      for (const row of await r.json()) {
        introspect[row.table] = {
          exists: true,
          rls_enabled: row.rls_enabled === true || row.rls_enabled === "true",
          rls_forced: row.rls_forced === true || row.rls_forced === "true",
          policy_count: Number(row.policy_count ?? 0),
        }
      }
      introspectOk = true
    } else { console.log(`(introspection HTTP ${r.status}: ${(await r.text()).slice(0,120)})`) }
    const rt = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: trigSql }),
    })
    if (rt.ok) for (const row of await rt.json()) { (triggers[row.table] ??= []).push(row.trigger) }
  } catch (e) { console.log(`(introspection error: ${e.message})`) }
} else {
  console.log("(no SUPABASE_PERSONAL_ACCESS_KEY — skipping Management API introspection; anon probes still run)")
}

// ---- 2 & 3. Per-table anon probe + service row count ---------------------
for (const spec of TABLES) {
  const meta = introspect[spec.t] || { exists: !introspectOk ? null : false }
  const row = { table: spec.t, cls: spec.cls, note: spec.note || "" , ...meta }

  // anon SELECT
  const { data: aData, error: aErr } = await anon.from(spec.t).select("*").limit(50)
  const anonRows = (aData || []).length
  row.anon_rows = anonRows
  row.anon_error = aErr ? aErr.message.slice(0, 80) : null

  // service row count (does the table even have data to leak?)
  let liveRows = null
  if (admin) {
    const { count } = await admin.from(spec.t).select("*", { count: "exact", head: true })
    liveRows = typeof count === "number" ? count : null
  }
  row.live_rows = liveRows

  // existence: if introspection says false AND anon error is "relation does not exist", mark not present
  const missing = (meta.exists === false) ||
    (aErr && /does not exist|could not find the table|schema cache/i.test(aErr.message))
  row.exists = missing ? false : (meta.exists ?? (aErr ? null : true))

  if (row.exists === false) {
    row.verdict = "NOT_PRESENT"
    row.anon_blocked = null
    results.push(row); continue
  }

  // For SCOPED/ADMIN/SELF: anon MUST be blocked. "Blocked" = 0 rows returned
  // (RLS filters to empty) OR a permission/RLS error. For these, if live_rows>0
  // and anon_rows>0 that is a HARD leak.
  const isPublic = spec.cls === "PUBLIC"
  const anonBlocked = anonRows === 0
  row.anon_blocked = anonBlocked

  if (isPublic) {
    // anon is ALLOWED to read. We assert it does NOT error with permission denied.
    const permDenied = aErr && /permission denied|row-level security/i.test(aErr.message)
    row.verdict = permDenied ? "PUBLIC_BLOCKED_UNEXPECTED" : "PUBLIC_OK"
    if (permDenied) fail(`${spec.t}: PUBLIC table but anon got permission error: ${aErr.message}`)
  } else {
    // SCOPED / ADMIN / SELF
    if (!anonBlocked) {
      // anon returned rows from a non-public table → LEAK
      row.verdict = "LEAK"
      fail(`${spec.t}: ${spec.cls} table LEAKED ${anonRows} rows to anon (live rows=${liveRows})`)
    } else {
      row.verdict = "BLOCKED"
    }
    // RLS-enabled + policy presence gates (only meaningful with introspection)
    if (introspectOk) {
      if (!meta.rls_enabled) { row.verdict = "RLS_DISABLED"; fail(`${spec.t}: RLS NOT enabled on workspace/admin table`) }
      else if (meta.policy_count === 0 && spec.cls !== "ADMIN") {
        // ADMIN tables intentionally may have 0 anon-relevant policies but we expect >=1; webhook_events is the documented service-only exception
        row.verdict = row.verdict === "BLOCKED" ? "RLS_NO_POLICY" : row.verdict
        if (spec.t !== "payments_webhook_events") fail(`${spec.t}: RLS enabled but 0 policies (deny-all; verify intended)`)
      }
    }
  }

  // ledger immutability trigger check
  if (spec.ledger && introspectOk) {
    const trg = triggers[spec.t] || []
    row.immutable_trigger = trg.some((n) => /immutab|append|no_update|protect|readonly/i.test(n)) ? trg.join(",") : (trg.join(",") || "NONE")
    if (!trg.length) fail(`${spec.t}: append-only ledger has NO triggers (immutability not enforced)`)
  }

  results.push(row)
}

// ---- 4. Public booking RPC reachable by anon (no write) ------------------
let rpcResult = { name: "create_public_reservation", anon_callable: null, note: "" }
try {
  const fakeListing = "00000000-0000-0000-0000-000000000000"
  const { error } = await anon.rpc("create_public_reservation", {
    p_listing_id: fakeListing, p_check_in: "2099-01-01", p_check_out: "2099-01-02",
    p_guests_count: 1, p_guest_name: "RLS Probe", p_guest_email: "probe@propvora-test.invalid",
    p_guest_phone: null, p_session_token: null, p_hold_minutes: 30,
  })
  // We EXPECT a domain rejection (listing not found / not published), NOT a
  // "function does not exist" or "permission denied for function" error.
  if (!error) {
    rpcResult.anon_callable = true
    rpcResult.note = "RPC returned success for a non-existent listing — UNEXPECTED (should reject)"
    fail("create_public_reservation: accepted a non-existent listing (validation gap)")
  } else if (/does not exist|permission denied for function|could not find/i.test(error.message)) {
    rpcResult.anon_callable = false
    rpcResult.note = `anon cannot reach RPC: ${error.message.slice(0,90)}`
    fail(`create_public_reservation: not reachable by anon — ${error.message.slice(0,90)}`)
  } else {
    rpcResult.anon_callable = true
    rpcResult.note = `reachable; rejected bad input as expected: ${error.message.slice(0,90)}`
  }
} catch (e) {
  rpcResult.note = `exception: ${e.message.slice(0,90)}`
  fail(`create_public_reservation probe threw: ${e.message}`)
}

// ---- Output --------------------------------------------------------------
if (JSON_OUT) {
  console.log(JSON.stringify({ ref: REF, introspectOk, results, rpc: rpcResult, failures }, null, 2))
  process.exit(failures.length ? 1 : 0)
}

const pad = (s, n) => String(s ?? "").padEnd(n)
console.log(`\n=== v2 RLS / ISOLATION MATRIX  (project ${REF}) ===`)
console.log(`introspection: ${introspectOk ? "ON (Management API)" : "OFF (anon-only)"} · service-role row counts: ${admin ? "ON" : "OFF"}\n`)
console.log(pad("TABLE", 38), pad("CLS", 7), pad("EXISTS", 7), pad("RLS", 4), pad("POL", 4), pad("ANON", 5), pad("LIVE", 5), "VERDICT")
console.log("-".repeat(110))
let present = 0, rlsOn = 0, leaks = 0, blocked = 0, publicOk = 0, notPresent = 0
for (const r of results) {
  if (r.verdict === "NOT_PRESENT") { notPresent++ }
  else {
    present++
    if (r.rls_enabled) rlsOn++
    if (r.verdict === "LEAK") leaks++
    else if (r.verdict === "BLOCKED") blocked++
    else if (r.verdict === "PUBLIC_OK") publicOk++
  }
  console.log(
    pad(r.table, 38), pad(r.cls, 7),
    pad(r.exists === false ? "no" : (r.exists === null ? "?" : "yes"), 7),
    pad(r.rls_enabled === undefined ? "?" : (r.rls_enabled ? "Y" : "N"), 4),
    pad(r.policy_count ?? "?", 4),
    pad(r.anon_rows ?? "?", 5),
    pad(r.live_rows ?? "?", 5),
    r.verdict + (r.immutable_trigger ? `  [trg:${r.immutable_trigger}]` : ""),
  )
}
console.log(`\nRPC create_public_reservation → anon_callable=${rpcResult.anon_callable} · ${rpcResult.note}`)
console.log(`\n--- SUMMARY ---`)
console.log(`tables covered:     ${TABLES.length}`)
console.log(`present:            ${present}`)
console.log(`not present:        ${notPresent}`)
console.log(`RLS enabled:        ${rlsOn}/${present}${introspectOk ? "" : " (introspection off — count unavailable)"}`)
console.log(`anon blocked (scoped/admin/self): ${blocked}`)
console.log(`public-read OK:     ${publicOk}`)
console.log(`LEAKS:              ${leaks}`)
if (failures.length) { console.log(`\n--- FAILURES (${failures.length}) ---`); failures.forEach((f) => console.log("  x " + f)) }
else console.log(`\nNo isolation failures detected.`)
process.exit(failures.length ? 1 : 0)
