import { readFileSync } from "node:fs"

const env = {}
for (const f of [".env", ".env.local"]) {
  try {
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {
    /* ignore */
  }
}

const PAK = env.SUPABASE_PERSONAL_ACCESS_KEY
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const ref = new URL(URL_).hostname.split(".")[0]

async function q(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAK}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  })
  const t = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${t}`)
  return t.trim() ? JSON.parse(t) : []
}

export { env, PAK, ref, q }

const invokedDirectly =
  process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("_introspect.mjs")
if (invokedDirectly) {
  console.log("ref:", ref)
  const cols = await q(
    `select column_name, data_type from information_schema.columns where table_name='booking_listings' and column_name in ('accommodation_category','let_type','type_details') order by column_name`
  )
  console.log("booking_listings new cols:", JSON.stringify(cols))
  const tabs = await q(
    `select table_name from information_schema.tables where table_schema='public' and table_name in ('accommodation_amenities','booking_keyless_locks','booking_access_codes','booking_access_code_audit','booking_listing_amenities','bookings','booking_listings') order by table_name`
  )
  console.log("tables present:", JSON.stringify(tabs.map((t) => t.table_name)))
}
