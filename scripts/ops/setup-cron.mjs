// Set up Supabase pg_cron jobs that drive the app's /api/cron/* endpoints.
// Reads the Management API PAT + CRON_SECRET from .env.local so neither value is
// printed. Prints only job names/schedules and a prod auth test result.
//
// Usage: node scripts/ops/setup-cron.mjs [--verify-only]
import { readFileSync } from "node:fs"

function parseEnv(path) {
  const out = {}
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {}
  return out
}

const env = { ...parseEnv(".env"), ...parseEnv(".env.local") }
const PAT = env.SUPABASE_PERSONAL_ACCESS_KEY
const CRON_SECRET = env.CRON_SECRET
const PROJECT_REF = "oovgfknmzjcgbilwumch"
const BASE = "https://propvora.com"
const verifyOnly = process.argv.includes("--verify-only")

if (!PAT) { console.error("Missing SUPABASE_PERSONAL_ACCESS_KEY"); process.exit(1) }
if (!CRON_SECRET) { console.error("Missing CRON_SECRET"); process.exit(1) }

async function runSql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`SQL ${res.status}: ${text.slice(0, 300)}`)
  try { return JSON.parse(text) } catch { return text }
}

// Jobs: name → [cron schedule, endpoint path]. Off-minute schedules to avoid the
// global :00 stampede. All endpoints are idempotent.
// NOTE: /api/cron/daily is intentionally NOT scheduled here — the Vercel cron in
// vercel.json owns the daily aggregator (and Vercel injects its own CRON_SECRET,
// so it already works). These pg_cron jobs add the higher-frequency coverage
// Vercel Hobby cannot (10-min automations, hourly holds, 6-hourly reconcile +
// affiliate clearing/payouts). All endpoints are idempotent.
const JOBS = [
  ["propvora-automation-runner", "*/10 * * * *", "/api/cron/automation-runner"],
  ["propvora-expire-holds", "17 * * * *", "/api/cron/expire-holds"],
  ["propvora-reconcile", "0 */6 * * *", "/api/cron/reconcile"],
  ["propvora-affiliate", "20 */6 * * *", "/api/cron/affiliate"],
]

function scheduleSql(name, sched, path) {
  // net.http_post carries the Bearer secret. Dollar-quote the command body.
  const cmd = `select net.http_post(url := '${BASE}${path}', headers := jsonb_build_object('Authorization', 'Bearer ${CRON_SECRET}', 'Content-Type', 'application/json'), body := '{}'::jsonb, timeout_milliseconds := 20000);`
  return `select cron.schedule('${name}', '${sched}', $cron_cmd$${cmd}$cron_cmd$);`
}

async function main() {
  if (!verifyOnly) {
    console.log("Ensuring pg_cron + pg_net extensions…")
    await runSql("create extension if not exists pg_cron; create extension if not exists pg_net;")

    for (const [name, sched, path] of JOBS) {
      // Unschedule first (ignore if absent), then (re)schedule — deterministic.
      await runSql(`do $$ begin perform cron.unschedule('${name}'); exception when others then null; end $$;`)
      await runSql(scheduleSql(name, sched, path))
      console.log(`  scheduled ${name}  [${sched}]  → ${path}`)
    }
  }

  // Show the live job list (no secrets — command column omitted).
  const jobs = await runSql("select jobname, schedule, active from cron.job where jobname like 'propvora-%' order by jobname;")
  console.log("\nActive pg_cron jobs:")
  console.log(JSON.stringify(jobs, null, 2))

  // Verify prod cron auth: hit the read-only reconcile endpoint with the secret.
  // 200 → the deployed app's CRON_SECRET matches, so pg_cron will authenticate.
  // 401 → mismatch; the Vercel CRON_SECRET must be set to this value.
  try {
    const res = await fetch(`${BASE}/api/cron/reconcile`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CRON_SECRET}`, "Content-Type": "application/json" },
    })
    console.log(`\nProd cron-auth test (POST /api/cron/reconcile): HTTP ${res.status} ${res.status === 200 ? "✓ secret matches" : res.status === 401 ? "✗ CRON_SECRET mismatch (set Vercel CRON_SECRET to the .env.local value)" : ""}`)
  } catch (e) {
    console.log(`\nProd cron-auth test failed to connect: ${String(e).slice(0, 160)}`)
  }
}

main().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1) })
