// Vercel deploy helper. Reads the CLI token from disk (never printed), checks
// recent deployments, and — with --deploy — triggers a production deployment of
// the current main commit from GitHub.
//
// Usage:
//   node scripts/ops/vercel-deploy.mjs            # list recent deployments
//   node scripts/ops/vercel-deploy.mjs --deploy   # trigger prod deploy of main
import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"

const PROJECT_ID = "prj_8Nz6rwuJh9TSGuBGoaPudt8SNgB5"
const TEAM_ID = "team_ettVHV6E9tHbmqV762QNqrri"
const PROJECT_NAME = "propvora"
const REPO = "Blackwellen/propvora"
const AUTH_PATHS = [
  "C:/Users/PC/AppData/Roaming/xdg.data/com.vercel.cli/auth.json",
  "C:/Users/PC/AppData/Roaming/com.vercel.cli/auth.json",
  process.env.APPDATA ? `${process.env.APPDATA}/xdg.data/com.vercel.cli/auth.json` : null,
].filter(Boolean)

function token() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN
  for (const p of AUTH_PATHS) {
    try {
      const j = JSON.parse(readFileSync(p, "utf8"))
      if (j?.token) return j.token
    } catch {}
  }
  throw new Error("No Vercel token found (checked VERCEL_TOKEN env + auth.json paths)")
}
const TOKEN = token()

async function api(path, init = {}) {
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`https://api.vercel.com${path}${sep}teamId=${TEAM_ID}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(init.headers || {}) },
  })
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} → ${res.status}: ${typeof body === "string" ? body.slice(0, 300) : JSON.stringify(body).slice(0, 300)}`)
  return body
}

async function listRecent() {
  const data = await api(`/v6/deployments?projectId=${PROJECT_ID}&limit=6`)
  const rows = (data.deployments || []).map((d) => ({
    state: d.state || d.readyState,
    target: d.target,
    sha: (d.meta?.githubCommitSha || "").slice(0, 8),
    branch: d.meta?.githubCommitRef,
    created: new Date(d.created).toISOString().replace("T", " ").slice(0, 19),
    url: d.url,
  }))
  console.log("Recent deployments:")
  console.log(JSON.stringify(rows, null, 2))
  return data.deployments || []
}

async function triggerProd() {
  const localSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim()
  console.log(`Triggering production deploy of ${REPO}@main (local HEAD ${localSha.slice(0, 8)})…`)
  const body = {
    name: PROJECT_NAME,
    target: "production",
    gitSource: { type: "github", org: "Blackwellen", repo: "propvora", ref: "main" },
  }
  const d = await api(`/v13/deployments?forceNew=1`, { method: "POST", body: JSON.stringify(body) })
  console.log(`Created deployment: id=${d.id} url=https://${d.url} state=${d.readyState || d.status}`)
}

const doDeploy = process.argv.includes("--deploy")
if (doDeploy) {
  await triggerProd()
  console.log("")
}
await listRecent()
