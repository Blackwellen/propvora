// REAL escrow E2E against a REAL published listing + the app's own API.
//   seed held booking -> POST /api/payments/intent (app creates escrow_payments
//   + Stripe PI) -> confirm PI with pm_card_visa (Stripe) -> SELF-SIGN the
//   payment_intent webhook -> POST /api/payments/webhook (app DB state machine)
//   -> capture -> sign succeeded webhook -> verify bookings + escrow_payments.
// Test mode only. Service-role for seeding/verification; never prints secrets.
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

function env(n) { const t = readFileSync(new URL("../.env.local", import.meta.url), "utf8"); const m = t.match(new RegExp(`^${n}=(.*)$`, "m")); return m ? m[1].trim() : undefined }
const sb = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } })
const sk = env("STRIPE_SECRET_KEY_TEST"); if (!sk.startsWith("sk_test_")) { console.error("not sk_test_"); process.exit(1) }
const stripe = new Stripe(sk, { apiVersion: "2026-05-27.dahlia" })
const whsec = env("STRIPE_WEBHOOK_SECRET")
const BASE = "http://localhost:3001"
const log = (k, v) => console.log(`${String(k).padEnd(26)} ${v}`)
const LISTING = "5eed0000-0000-0000-0001-000000000001"
const WS = "7d9e941b-c6f1-4293-bcbc-76b2197a69bb"

async function signedPost(path, event) {
  const payload = JSON.stringify(event)
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: whsec })
  const res = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": header }, body: payload })
  return { status: res.status, body: await res.text().catch(() => "") }
}

async function main() {
  console.log("=== REAL ESCROW E2E (real listing + app API) ===")

  // 1. Seed a held booking against the real listing
  const bookingId = crypto.randomUUID()
  const { error: insErr } = await sb.from("bookings").insert({
    id: bookingId, listing_id: LISTING, workspace_id: WS,
    guest_name: "E2E Tester", guest_email: "e2e@example.com",
    check_in: "2026-09-01", check_out: "2026-09-04", nights: 3, guests_count: 2,
    currency: "GBP", subtotal_pence: 15000, fees_pence: 0, total_pence: 15000,
    status: "pending_payment", source: "e2e",
  })
  if (insErr) { log("seed booking", `FAIL ${insErr.message}`); return }
  log("seed held booking", `OK ${bookingId.slice(0, 8)} £150 pending_payment`)

  // 2. App creates the escrow PaymentIntent
  const intentRes = await fetch(BASE + "/api/payments/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingRef: bookingId }) })
  const intent = await intentRes.json().catch(() => null)
  if (!intentRes.ok || !intent?.clientSecret) { log("app /payments/intent", `FAIL HTTP ${intentRes.status} ${JSON.stringify(intent).slice(0, 120)}`); await cleanup(bookingId); return }
  const piId = intent.clientSecret.split("_secret")[0]
  log("app /payments/intent", `OK PI ${piId} created (escrow, manual capture)`)

  // 3. Confirm the PI with a test card (simulates the guest paying)
  const confirmed = await stripe.paymentIntents.confirm(piId, { payment_method: "pm_card_visa" })
  log("confirm (guest pays)", confirmed.status === "requires_capture" ? `OK held (requires_capture)` : `status=${confirmed.status}`)

  // 4. Webhook → app state machine (held)
  const piObj = await stripe.paymentIntents.retrieve(piId)
  const heldEvt = { id: "evt_" + Date.now(), object: "event", type: "payment_intent.amount_capturable_updated", data: { object: piObj }, api_version: "2026-05-27.dahlia" }
  const w1 = await signedPost("/api/payments/webhook", heldEvt)
  log("webhook held -> app", `HTTP ${w1.status}`)

  // 5. Capture (release) + succeeded webhook
  const captured = await stripe.paymentIntents.capture(piId)
  log("capture (release)", captured.status === "succeeded" ? "OK captured" : `status=${captured.status}`)
  const okEvt = { id: "evt_" + (Date.now() + 1), object: "event", type: "payment_intent.succeeded", data: { object: await stripe.paymentIntents.retrieve(piId) }, api_version: "2026-05-27.dahlia" }
  const w2 = await signedPost("/api/payments/webhook", okEvt)
  log("webhook succeeded -> app", `HTTP ${w2.status}`)

  // 6. Verify DB state
  const { data: ep } = await sb.from("escrow_payments").select("status, stripe_payment_intent_id").eq("stripe_payment_intent_id", piId).maybeSingle()
  log("escrow_payments row", ep ? `OK status=${ep.status}` : "NONE (app may use legacy payments table)")
  const { data: bk } = await sb.from("bookings").select("status, payment_status").eq("id", bookingId).maybeSingle()
  log("booking final state", bk ? `status=${bk.status} payment_status=${bk.payment_status}` : "missing")

  // 7. Refund + cleanup the Stripe side
  try { await stripe.refunds.create({ payment_intent: piId }); log("refund (cleanup)", "OK") } catch (e) { log("refund", e.message?.slice(0, 50)) }
  await cleanup(bookingId)
  console.log("=== done ===")
}

async function cleanup(bookingId) {
  await sb.from("escrow_payments").delete().eq("booking_id", bookingId)
  await sb.from("bookings").delete().eq("id", bookingId)
}

main().catch((e) => { console.error("E2E FAILED:", e.message); process.exit(2) })
