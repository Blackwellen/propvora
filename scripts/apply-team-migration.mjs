// Applies ONLY supabase/migrations/20260618000000_supplier_team_enterprise.sql
// to the linked project via the Supabase Management API (PAT auth), bypassing
// the desynced CLI migration history. Idempotent → safe to re-run.
//
//   node scripts/apply-team-migration.mjs            # apply
//   node scripts/apply-team-migration.mjs --verify   # verify only (no write)
//
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const REF = "oovgfknmzjcgbilwumch"
const API = `https://api.supabase.com/v1/projects/${REF}/database/query`

function readEnv(name) {
  for (const f of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(join(ROOT, f), "utf8")
      const m = txt.match(new RegExp(`^${name}=(.*)$`, "m"))
      if (m) return m[1].trim().replace(/^["']|["']$/g, "")
    } catch {}
  }
  return null
}

const PAT = readEnv("SUPABASE_PERSONAL_ACCESS_KEY")
if (!PAT) { console.error("✗ SUPABASE_PERSONAL_ACCESS_KEY not found in .env.local/.env"); process.exit(1) }

async function runSql(query, label) {
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  if (!res.ok) {
    console.error(`✗ [${label}] HTTP ${res.status}:`, typeof json === "string" ? json.slice(0, 1200) : JSON.stringify(json).slice(0, 1200))
    return { ok: false, json }
  }
  return { ok: true, json }
}

const VERIFY_SQL = `
select
  (select count(*) from information_schema.tables
     where table_schema='public' and table_name like 'supplier_%') as supplier_tables,
  (select count(*) from pg_policies
     where schemaname='public' and tablename like 'supplier_%') as supplier_policies,
  (select exists(select 1 from information_schema.columns
     where table_schema='public' and table_name='workspaces' and column_name='plan_type')) as has_plan_type,
  (select exists(select 1 from storage.buckets where id='supplier-workspaces')) as has_bucket,
  (select count(*) from pg_policies where schemaname='storage' and tablename='objects'
     and policyname like 'supplier_ws_files_%') as storage_policies;
`

async function main() {
  const verifyOnly = process.argv.includes("--verify")

  // 1. connectivity
  const ping = await runSql("select current_database() as db, current_user as usr, now() as ts;", "ping")
  if (!ping.ok) process.exit(1)
  console.log("✓ connected:", JSON.stringify(ping.json))

  // 2. before snapshot
  const before = await runSql(VERIFY_SQL, "verify-before")
  if (before.ok) console.log("• before:", JSON.stringify(before.json))

  if (!verifyOnly) {
    // 3. apply migration (idempotent). Strip outer begin/commit — the API runs
    //    the batch in its own transaction; explicit control can conflict.
    let sql = readFileSync(join(ROOT, "supabase/migrations/20260618000000_supplier_team_enterprise.sql"), "utf8")
    sql = sql.replace(/^\s*begin\s*;\s*$/im, "").replace(/^\s*commit\s*;\s*$/im, "")
    const apply = await runSql(sql, "apply-migration")
    if (!apply.ok) { console.error("✗ migration failed"); process.exit(1) }
    console.log("✓ migration applied")

    // 4. record in CLI migration history so future tooling sees it (best-effort)
    await runSql(
      `create schema if not exists supabase_migrations;
       create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
       insert into supabase_migrations.schema_migrations (version, name)
         values ('20260618000000','supplier_team_enterprise')
         on conflict (version) do nothing;`,
      "record-history"
    )
  }

  // 5. after snapshot
  const after = await runSql(VERIFY_SQL, "verify-after")
  if (after.ok) console.log("• after:", JSON.stringify(after.json))
  console.log("done.")
}

main().catch((e) => { console.error("✗ fatal", e); process.exit(1) })
