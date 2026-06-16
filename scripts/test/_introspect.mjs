// Introspect the live Supabase DB via the Management API.
// Usage: node scripts/test/_introspect.mjs "<SQL>"
//   or:  node scripts/test/_introspect.mjs --file <path.sql>
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

let sql
if (process.argv[2] === "--file") sql = readFileSync(process.argv[3], "utf8")
else sql = process.argv[2]
if (!sql) { console.error("No SQL provided"); process.exit(2) }

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
})
const text = await res.text()
if (!res.ok) { console.error(`HTTP ${res.status}`); console.error(text.slice(0, 4000)); process.exit(1) }
try { console.log(JSON.stringify(JSON.parse(text), null, 2)) }
catch { console.log(text) }
