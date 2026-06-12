// Audit: which tables are declared in migrations but MISSING from the live DB.
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

// 1. Expected tables from migrations
const dir = "supabase/migrations"
const expected = new Set()
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".sql")) continue
  const sql = readFileSync(`${dir}/${f}`, "utf8")
  const re = /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?["']?([a-z_][a-z0-9_]*)["']?/gi
  let m
  while ((m = re.exec(sql))) expected.add(m[1].toLowerCase())
}

// 2. Existing tables from DB
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: "SELECT table_name FROM information_schema.tables WHERE table_schema='public'" }),
})
const rows = await res.json()
if (!res.ok) { console.error("Query failed:", rows); process.exit(1) }
const existing = new Set(rows.map((r) => r.table_name.toLowerCase()))

// 3. Diff
const missing = [...expected].filter((t) => !existing.has(t)).sort()
console.log(`Expected (migrations): ${expected.size}`)
console.log(`Existing (DB):         ${existing.size}`)
console.log(`MISSING (${missing.length}):`)
for (const t of missing) console.log(`  - ${t}`)
