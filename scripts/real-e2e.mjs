// FULL REAL guest-booking escrow E2E through the app's own APIs + DB.
//   reserve (real RPC hold) -> /api/payments/intent (real escrow PI +
//   escrow_payments) -> confirm PI with pm_card_visa -> self-signed webhook
//   (held) -> capture -> self-signed webhook (succeeded) -> verify DB ->
//   refund + cleanup. Test mode only; never prints secrets.
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

function env(f, n) { const t = readFileSync(new URL(f, import.meta.url), "utf8"); const m = t.match(new RegExp(`^${n}=(.*)$`, "m")); return m ? m[1].trim().replace(/^["']|["']$/g, "") : undefined }
const sb = createClient(env("../.env.local", "NEXT_PUBLIC_SUPABASE_URL"), env("../.env.local", "SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } })
const sk = env("../.env.local", "STRIPE_SECRET_KEY_TEST"); if (!sk.startsWith("sk_test_")) { console.error("not sk_test_"); process.exit(1) }
const stripe = new Stripe(sk, { apiVersion: "2026-05-27.dahlia" })
const whsec = env("../.env.local", "STRIPE_WEBHOOK_SECRET")
const BASE = "http://localhost:3001"
const LISTING = "5eed0000-0000-0000-0001-000000000001"
const log = (k, v) => console.log(`${String(k).padEnd(24)} ${v}`)

// random future dates to dodge overlapping holds
const mo = 1 + Math.floor(Math.random() * 11), d1 = 1 + Math.floor(Math.random() * 20)
const ci = `2027-${String(mo).padStart(2, "0")}-${String(d1).padStart(2, "0")}`
const co = `2027-${String(mo).padStart(2, "0")}-${String(d1 + 3).padStart(2, "0")}`

async function signedPost(path, type, obj) {
  const payload = JSON.stringify({ id: "evt_" + Date.now() + Math.random().toString(36).slice(2), object: "event", type, data: { object: obj }, api_version: "2026-05-27.dahlia" })
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: whsec })
  const res = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": header }, body: payload })
  return res.status
}

async function main() {
  console.log("=== FULL REAL GUEST-BOOKING ESCROW E2E ===")
  // 1. reserve
  const rr = await fetch(BASE + "/api/booking/reserve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId: LISTING, checkIn: ci, checkOut: co, guests: 2, guest: { fullName: "E2E Tester", email: "e2e@example.com", phone: "", message: "", acceptHouseRules: true, acceptCancellation: true, acceptTerms: true, acceptDataSharing: true } }) })
  const rj = await rr.json()
  if (!rj.reservationId) { log("reserve", `FAIL ${JSON.stringify(rj).slice(0, 120)}`); return }
  const bookingId = rj.reservationId
  log("1 reserve (real hold)", `OK ${bookingId.slice(0, 8)} £${(rj.totalPence / 100).toLocaleString()} ${rj.status}`)

  // 2. intent
  const ir = await fetch(BASE + "/api/payments/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingRef: bookingId }) })
  const ij = await ir.json()
  if (!ij.clientSecret) { log("intent", `FAIL ${JSON.stringify(ij).slice(0, 120)}`); await cleanup(bookingId); return }
  const piId = ij.clientSecret.split("_secret")[0]
  log("2 intent (escrow PI)", `OK ${piId} £${(ij.amountPence / 100).toLocaleString()}`)

  // 3. confirm (guest pays)
  const conf = await stripe.paymentIntents.confirm(piId, { payment_method: "pm_card_visa", return_url: "https://propvora.com/return" })
  log("3 confirm (guest pays)", conf.status === "requires_capture" ? "OK held (requires_capture)" : `status=${conf.status}`)

  // 4. webhook -> app (held)
  const w1 = await signedPost("/api/payments/webhook", "payment_intent.amount_capturable_updated", await stripe.paymentIntents.retrieve(piId))
  log("4 webhook held->app", `HTTP ${w1}`)

  // 5. capture (release escrow)
  const cap = await stripe.paymentIntents.capture(piId)
  log("5 capture (release)", cap.status === "succeeded" ? "OK captured" : `status=${cap.status}`)
  const w2 = await signedPost("/api/payments/webhook", "payment_intent.succeeded", await stripe.paymentIntents.retrieve(piId))
  log("6 webhook succeeded->app", `HTTP ${w2}`)

  // 7. verify DB
  await new Promise((r) => setTimeout(r, 800))
  const { data: ep } = await sb.from("escrow_payments").select("status").eq("stripe_payment_intent_id", piId).maybeSingle()
  log("7 escrow_payments.status", ep ? `${ep.status}` : "none")
  const { data: bk } = await sb.from("bookings").select("status, payment_status").eq("id", bookingId).maybeSingle()
  log("8 booking final", bk ? `status=${bk.status} payment_status=${bk.payment_status}` : "missing")

  // 8. refund + cleanup
  try { await stripe.refunds.create({ payment_intent: piId }) } catch { }
  await cleanup(bookingId)
  console.log("=== done ===")
}
async function cleanup(id) { await sb.from("escrow_payments").delete().eq("booking_id", id); await sb.from("bookings").delete().eq("id", id) }
main().catch((e) => { console.error("E2E FAILED:", e.message); process.exit(2) })
