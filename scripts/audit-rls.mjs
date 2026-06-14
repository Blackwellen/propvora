// RLS coverage audit — reports, for every base table in the public schema:
//   - whether row-level security is ENABLED
//   - whether it is FORCED (applies even to the table owner)
//   - how many policies are attached
//   - whether a workspace_id column exists (tenant-scoping signal)
//
// Flags:
//   CRITICAL — RLS disabled on a table that has a workspace_id (tenant data
//              readable cross-workspace if the authenticated role has SELECT).
//   HIGH     — RLS disabled on any other base table.
//   REVIEW   — RLS enabled but ZERO policies (deny-all; safe but may break features).
//
// Usage: node scripts/audit-rls.mjs
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
const token = env.SUPABASE_PERSONAL_ACCESS_KEY
const url = env.NEXT_PUBLIC_SUPABASE_URL
if (!token || !url) { console.error("Missing SUPABASE_PERSONAL_ACCESS_KEY or NEXT_PUBLIC_SUPABASE_URL"); process.exit(2) }
const ref = new URL(url).hostname.split(".")[0]

const sql = `
SELECT c.relname AS "table",
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count,
       EXISTS (SELECT 1 FROM information_schema.columns col
               WHERE col.table_schema='public' AND col.table_name=c.relname
                 AND col.column_name='workspace_id') AS has_workspace_id
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
ORDER BY c.relname;`

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
})
if (!res.ok) { console.error(`HTTP ${res.status}: ${await res.text()}`); process.exit(1) }
const rows = await res.json()

const critical = [], high = [], review = []
let enabled = 0
for (const r of rows) {
  const rls = r.rls_enabled === true || r.rls_enabled === "true"
  const ws = r.has_workspace_id === true || r.has_workspace_id === "true"
  const pc = Number(r.policy_count ?? 0)
  if (rls) {
    enabled++
    if (pc === 0) review.push(r.table)
  } else if (ws) {
    critical.push(r.table)
  } else {
    high.push(r.table)
  }
}

console.log(`\n=== RLS coverage: ${rows.length} base tables · ${enabled} with RLS enabled ===\n`)
const fmt = (label, arr) => {
  console.log(`${label}: ${arr.length}`)
  for (const t of arr) console.log(`  - ${t}`)
  console.log("")
}
fmt("CRITICAL — RLS DISABLED on tenant table (has workspace_id)", critical)
fmt("HIGH — RLS DISABLED on other table", high)
fmt("REVIEW — RLS enabled but 0 policies (deny-all)", review)

process.exit(critical.length > 0 ? 1 : 0)
