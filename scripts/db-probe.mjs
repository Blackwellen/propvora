// Probe whether the real booking/escrow schema is provisioned in the DB.
// Read-only (one harmless RPC call with bad args). Service-role key.
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

function env(n) {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  const m = txt.match(new RegExp(`^${n}=(.*)$`, "m"))
  return m ? m[1].trim() : undefined
}
const url = env("NEXT_PUBLIC_SUPABASE_URL")
const key = env("SUPABASE_SERVICE_ROLE_KEY")
if (!url || !key) { console.error("Missing Supabase env"); process.exit(1) }
const sb = createClient(url, key, { auth: { persistSession: false } })

async function tableCount(t) {
  const { count, error } = await sb.from(t).select("*", { count: "exact", head: true })
  if (error) return error.code === "42P01" ? "MISSING" : `err:${error.code ?? error.message?.slice(0, 30)}`
  return `ok (${count ?? 0} rows)`
}

async function rpcExists(fn, args) {
  const { error } = await sb.rpc(fn, args)
  if (!error) return "ok (callable)"
  if (error.code === "42883" || /does not exist|could not find/i.test(error.message ?? "")) return "MISSING"
  // any other error (e.g. validation) means the function EXISTS
  return `EXISTS (rejected bad args: ${(error.message ?? "").slice(0, 40)})`
}

async function main() {
  console.log("=== DB SCHEMA PROBE (booking/escrow) ===")
  for (const t of [
    "booking_listings", "marketplace_listings", "bookings",
    "escrow_payments", "escrow_holds", "marketplace_orders",
    "marketplace_transactions", "marketplace_fee_rules",
  ]) {
    console.log(`${t.padEnd(26)} ${await tableCount(t)}`)
  }
  console.log("\n=== RPC ===")
  console.log(`create_public_reservation  ${await rpcExists("create_public_reservation", {})}`)

  // Any published listing to test against?
  for (const t of ["booking_listings", "marketplace_listings"]) {
    const { data, error } = await sb.from(t).select("id,status").limit(3)
    if (!error && data) console.log(`\n${t} sample:`, data.map((r) => `${String(r.id).slice(0, 8)}:${r.status}`).join(", ") || "(empty)")
  }
}
main().catch((e) => { console.error(e.message); process.exit(2) })
