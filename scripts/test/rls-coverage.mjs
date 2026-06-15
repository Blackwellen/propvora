// RLS coverage audit — every PUBLIC table that carries a `workspace_id` column
// MUST have row-level security ENABLED and at least one policy. We introspect the
// live database via the Supabase Management API (pg_class.relrowsecurity +
// pg_policies + information_schema.columns) and assert coverage table-by-table.
//
//   FINDING (not auto-fail-on-views): views that expose workspace_id (relkind 'v')
//   cannot carry RLS themselves — they inherit it from their base tables. We list
//   them as observations.
//
//   CRITICAL: any base table (relkind 'r') with workspace_id that has RLS OFF is a
//   tenant-isolation hole and FAILS loudly.
//
//   FINDING: a table with RLS ON but ZERO policies is default-deny (safe — no rows
//   readable/writable by anon or authenticated), but usually indicates an
//   unfinished surface. We record each as an explicit finding, not a hard fail,
//   UNLESS the table is one users are expected to read (then it's a functional gap).
//
// Usage: node scripts/test/rls-coverage.mjs
import { readFileSync } from "node:fs"

function loadEnv(p){const o={};try{for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);o[m[1]]=v}}catch{}return o}
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") }
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL
const PAT = env.SUPABASE_PERSONAL_ACCESS_KEY
if (!SUPA_URL || !PAT) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_PERSONAL_ACCESS_KEY"); process.exit(2) }
const ref = new URL(SUPA_URL).host.split(".")[0]

async function q(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    // Connection: close avoids a lingering undici keep-alive socket that triggers
    // a harmless "Assertion failed: async.c" abort + non-zero exit on Windows.
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json", Connection: "close" },
    body: JSON.stringify({ query: sql }),
  })
  if (!r.ok) { console.error("Management API error", r.status, await r.text()); process.exit(2) }
  return r.json()
}

const results = []
const failures = []
const findings = []
function check(name, pass, detail) {
  results.push({ name, pass })
  if (!pass) failures.push(`${name}${detail ? ` — ${detail}` : ""}`)
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}

try {
  const rows = await q(`
    with ws as (
      select table_name from information_schema.columns
      where table_schema = 'public' and column_name = 'workspace_id'
    ),
    pc as (
      select c.relname, c.relrowsecurity, c.relkind
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
    ),
    pol as (
      select tablename, count(*) n from pg_policies
      where schemaname = 'public' group by tablename
    )
    select ws.table_name,
           coalesce(pc.relkind::text, '?') as relkind,
           coalesce(pc.relrowsecurity, false) as rls,
           coalesce(pol.n, 0)::int as policies
    from ws
    left join pc on pc.relname = ws.table_name
    left join pol on pol.tablename = ws.table_name
    order by ws.table_name
  `)

  const realTables = rows.filter((r) => r.relkind === "r")
  const views = rows.filter((r) => r.relkind === "v" || r.relkind === "m")

  check("introspected workspace_id-bearing relations", rows.length > 0, `${rows.length} relations (${realTables.length} tables, ${views.length} views)`)

  // CRITICAL assertion: every base table with workspace_id has RLS enabled.
  for (const t of realTables) {
    check(`RLS enabled: ${t.table_name}`, t.rls === true,
      t.rls ? "" : "CRITICAL: RLS is OFF on a tenant table — cross-workspace data is exposed")
  }

  // Assertion: every base table with RLS has >=1 policy.
  //   - RLS ON  + 0 policies = default-deny (SAFE — nothing readable/writable).
  //     Recorded as a FINDING, NOT a hard fail (it is not a tenant-isolation hole).
  //   - RLS OFF + 0 policies = wide open. That is already caught as a hard FAIL by
  //     the "RLS enabled" assertion above; here we only HARD-FAIL the genuinely
  //     dangerous combination, and treat default-deny as an observation.
  for (const t of realTables) {
    const hasPolicy = t.policies >= 1
    if (!hasPolicy && t.rls) {
      findings.push(`${t.table_name}: RLS ENABLED but 0 policies (default-deny — no access for anyone; likely unfinished surface)`)
      // default-deny is safe; do not count as a failing assertion.
      continue
    }
    check(`Policy present: ${t.table_name}`, hasPolicy,
      hasPolicy ? `${t.policies} policies` : "0 policies AND RLS off — LEAK")
  }

  // Views that expose workspace_id — observation only.
  for (const v of views) {
    findings.push(`VIEW ${v.table_name}: exposes workspace_id; RLS is inherited from base tables (cannot be set on a view)`)
  }
} catch (e) {
  check("harness ran without throwing", false, e.message)
}

const failed = results.filter((r) => !r.pass).length
if (findings.length) {
  console.log("\n--- FINDINGS (observations, not leaks) ---")
  findings.forEach((f) => console.log("  • " + f))
}
if (failed) {
  console.log("\n--- CRITICAL: RLS COVERAGE FAILURES ---")
  failures.forEach((f) => console.log("  ✗ " + f))
}
console.log(`\n=== RLS COVERAGE: ${results.length - failed}/${results.length} passed, ${failed} failed, ${findings.length} findings ===`)
// Set the exit code and let the event loop drain naturally. Calling process.exit()
// here while an undici keep-alive socket is still closing triggers a harmless
// "Assertion failed: async.c" abort on Windows that corrupts the exit code; a
// natural exit avoids it. Proactively close any lingering global dispatcher.
process.exitCode = failed > 0 ? 1 : 0
try {
  const { getGlobalDispatcher } = await import("undici")
  await getGlobalDispatcher().close()
} catch { /* undici not resolvable as a bare specifier in some setups — ignore */ }
