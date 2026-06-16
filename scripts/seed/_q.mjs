import { readFileSync } from "node:fs"
const env = {}
for (const f of [".env", ".env.local"]) {
  try {
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {}
}
const PAK = env.SUPABASE_PERSONAL_ACCESS_KEY
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const ref = new URL(URL_).hostname.split(".")[0]
export async function q(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAK}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  })
  const t = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${t}`)
  return t.trim() ? JSON.parse(t) : []
}
export { ref }
