// Idempotent full-migration applier via Supabase Management API.
// Runs every migrations/*.sql in order. Tries each file whole; on error,
// falls back to per-statement execution, tolerating "already exists"/duplicate
// objects and REFUSING destructive statements (DROP TABLE / TRUNCATE / DELETE).
import { readFileSync, readdirSync } from "node:fs"

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
const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]

async function run(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

function splitStatements(sql) {
  const stmts = []
  let cur = "", i = 0
  const n = sql.length
  let inLine = false, inBlock = false, inSingle = false, dollarTag = null
  while (i < n) {
    const c = sql[i], c2 = sql[i + 1]
    if (inLine) { cur += c; if (c === "\n") inLine = false; i++; continue }
    if (inBlock) { cur += c; if (c === "*" && c2 === "/") { cur += c2; i += 2; inBlock = false; continue } i++; continue }
    if (inSingle) { cur += c; if (c === "'") { if (c2 === "'") { cur += c2; i += 2; continue } inSingle = false } i++; continue }
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) { cur += dollarTag; i += dollarTag.length; dollarTag = null; continue }
      cur += c; i++; continue
    }
    if (c === "-" && c2 === "-") { inLine = true; cur += c; i++; continue }
    if (c === "/" && c2 === "*") { inBlock = true; cur += c; i++; continue }
    if (c === "'") { inSingle = true; cur += c; i++; continue }
    if (c === "$") {
      const m = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(i))
      if (m) { dollarTag = m[0]; cur += dollarTag; i += dollarTag.length; continue }
    }
    if (c === ";") { stmts.push(cur.trim()); cur = ""; i++; continue }
    cur += c; i++
  }
  if (cur.trim()) stmts.push(cur.trim())
  return stmts.filter((s) => s && !/^(--|\/\*)/.test(s))
}

const TOLERATE = /already exists|duplicate|already a member|is already/i
const DESTRUCTIVE = /^\s*(DROP\s+TABLE|TRUNCATE|DROP\s+SCHEMA|DELETE\s+FROM)\b/i

const dir = "supabase/migrations"
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
let totalApplied = 0, totalSkipped = 0, totalRefused = 0
const realErrors = []

for (const f of files) {
  const sql = readFileSync(`${dir}/${f}`, "utf8")
  const whole = await run(sql)
  if (whole.ok) { console.log(`✔ ${f}  (whole-file OK)`); continue }
  // Fallback: per-statement
  const stmts = splitStatements(sql)
  let applied = 0, skipped = 0, refused = 0, errs = 0
  for (const st of stmts) {
    if (DESTRUCTIVE.test(st)) { refused++; continue }
    const r = await run(st)
    if (r.ok) applied++
    else if (TOLERATE.test(r.text)) skipped++
    else { errs++; realErrors.push(`${f}: ${r.text.slice(0, 200).replace(/\s+/g, " ")} :: ${st.slice(0, 90).replace(/\s+/g, " ")}`) }
  }
  totalApplied += applied; totalSkipped += skipped; totalRefused += refused
  console.log(`~ ${f}  applied=${applied} skipped=${skipped} refused=${refused} errors=${errs}`)
}

console.log(`\n=== TOTALS ===`)
console.log(`applied(new)=${totalApplied} skipped(existing)=${totalSkipped} refused(destructive)=${totalRefused} realErrors=${realErrors.length}`)
if (realErrors.length) {
  console.log(`\n=== REAL ERRORS (first 40) ===`)
  for (const e of realErrors.slice(0, 40)) console.log("  • " + e)
}
