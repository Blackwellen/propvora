// Set Vercel env vars + optionally redeploy. Reads the CLI OAuth token from
// auth.json (never printed). Public feature flags only (no secrets handled here).
//
//   node scripts/ops/vercel-env.mjs            # list current values of target keys
//   node scripts/ops/vercel-env.mjs --set      # upsert the flags (production+preview)
//   node scripts/ops/vercel-env.mjs --set --deploy   # ... then trigger a prod redeploy
import { readFileSync } from "node:fs"

const PROJECT_ID = "prj_8Nz6rwuJh9TSGuBGoaPudt8SNgB5"
const TEAM_ID = "team_ettVHV6E9tHbmqV762QNqrri"
const AUTH = "C:/Users/PC/AppData/Roaming/xdg.data/com.vercel.cli/auth.json"

const TOKEN = process.env.VERCEL_TOKEN || JSON.parse(readFileSync(AUTH, "utf8")).token
if (!TOKEN) { console.error("no token"); process.exit(1) }

// Public feature flags to enable in production. Values are non-secret.
const VARS = {
  NEXT_PUBLIC_AFFILIATE_PAYOUTS_ENABLED: "true",
  NEXT_PUBLIC_FF_STRIPE_CONNECT: "true",
}
const TARGETS = ["production", "preview"]

async function api(path, init = {}) {
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`https://api.vercel.com${path}${sep}teamId=${TEAM_ID}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(init.headers || {}) },
  })
  const t = await res.text()
  let b; try { b = JSON.parse(t) } catch { b = t }
  return { status: res.status, ok: res.ok, body: b }
}

async function listTargets() {
  const r = await api(`/v9/projects/${PROJECT_ID}/env?decrypt=true`)
  if (!r.ok) { console.log("list env failed:", r.status, JSON.stringify(r.body).slice(0, 200)); return }
  const envs = (r.body.envs || r.body || [])
  for (const key of Object.keys(VARS)) {
    const matches = envs.filter((e) => e.key === key)
    if (!matches.length) console.log(`  ${key}: (not set)`)
    else for (const m of matches) console.log(`  ${key} = ${m.value} [${(m.target || []).join(",")}] (${m.type}) id=${m.id}`)
  }
}

async function upsert() {
  for (const [key, value] of Object.entries(VARS)) {
    const r = await api(`/v10/projects/${PROJECT_ID}/env?upsert=true`, {
      method: "POST",
      body: JSON.stringify({ key, value, type: "encrypted", target: TARGETS }),
    })
    console.log(`  upsert ${key}=${value} → ${r.status} ${r.ok ? "OK" : JSON.stringify(r.body).slice(0, 200)}`)
  }
}

async function deploy() {
  const body = {
    name: "propvora",
    target: "production",
    gitSource: { type: "github", org: "Blackwellen", repo: "propvora", ref: "main" },
  }
  const r = await api(`/v13/deployments?forceNew=1`, { method: "POST", body: JSON.stringify(body) })
  if (r.ok) console.log(`  deploy created: id=${r.body.id} url=https://${r.body.url} state=${r.body.readyState || r.body.status}`)
  else console.log(`  deploy failed → ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`)
}

const set = process.argv.includes("--set")
const dep = process.argv.includes("--deploy")
console.log("Current Vercel env (target keys):")
await listTargets()
if (set) { console.log("\nUpserting:"); await upsert(); console.log("\nAfter upsert:"); await listTargets() }
if (dep) { console.log("\nTriggering production redeploy:"); await deploy() }
