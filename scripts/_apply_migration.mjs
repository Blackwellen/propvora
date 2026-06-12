// One-shot: apply a SQL migration via the Supabase Management API.
// Usage: node scripts/_apply_migration.mjs <path-to-sql>
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
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL
if (!token) { console.error("Missing SUPABASE_PERSONAL_ACCESS_KEY"); process.exit(2) }
if (!url) { console.error("Missing Supabase URL"); process.exit(2) }

const ref = new URL(url).hostname.split(".")[0]
const sqlPath = process.argv[2]
const sql = readFileSync(sqlPath, "utf8")

console.log(`Project ref: ${ref}`)
console.log(`Applying: ${sqlPath} (${sql.length} bytes)`)

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
})

const text = await res.text()
console.log(`HTTP ${res.status}`)
console.log(text.slice(0, 2000))
process.exit(res.ok ? 0 : 1)
