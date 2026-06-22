// Full Stripe TEST-MODE payment-cycle test. Safe: refuses anything but sk_test_.
// Drives REAL test-card cycles server-side (no browser): escrow hold->capture->
// refund, subscription + add-on lifecycle, a dispute, and Connect onboarding.
// Cleans up created objects. Never prints secrets.
import { readFileSync } from "node:fs"
import Stripe from "stripe"

function env(name) {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    const m = txt.match(new RegExp(`^${name}=(.*)$`, "m"))
    return m ? m[1].trim() : undefined
  } catch { return undefined }
}
const sk = env("STRIPE_SECRET_KEY_TEST") || ""
if (!sk.startsWith("sk_test_")) { console.error("REFUSING: not an sk_test_ key."); process.exit(1) }
const stripe = new Stripe(sk, { apiVersion: "2026-05-27.dahlia" })
const log = (k, v) => console.log(`${String(k).padEnd(26)} ${v}`)
const ok = (s) => `\x1b[32mOK\x1b[0m ${s}`
const bad = (s) => `\x1b[31mFAIL\x1b[0m ${s}`

async function escrowCycle() {
  console.log("\n── 1. ESCROW CYCLE (stay/service: hold → capture → refund) ──")
  // hold (manual capture) confirmed with a test card
  const pi = await stripe.paymentIntents.create({
    amount: 5000, currency: "gbp", capture_method: "manual", confirm: true,
    payment_method: "pm_card_visa",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    description: "Propvora cycle test — escrow", metadata: { kind: "cycle_test" },
  })
  log("authorise (hold)", pi.status === "requires_capture" ? ok(`${pi.id} held`) : bad(`status=${pi.status}`))
  const cap = await stripe.paymentIntents.capture(pi.id)
  log("capture (release)", cap.status === "succeeded" ? ok("captured £50.00") : bad(`status=${cap.status}`))
  const charge = cap.latest_charge
  const refund = await stripe.refunds.create({ charge: typeof charge === "string" ? charge : charge.id })
  log("refund", refund.status === "succeeded" || refund.status === "pending" ? ok(`refunded ${refund.status}`) : bad(refund.status))
}

async function subscriptionCycle() {
  console.log("\n── 2. SUBSCRIPTION + ADD-ON CYCLE ──")
  const product = await stripe.products.create({ name: "Propvora Test Plan", metadata: { kind: "cycle_test" } })
  const base = await stripe.prices.create({ product: product.id, unit_amount: 2900, currency: "gbp", recurring: { interval: "month" } })
  const addon = await stripe.prices.create({ product: product.id, unit_amount: 500, currency: "gbp", recurring: { interval: "month" } })
  const cust = await stripe.customers.create({ metadata: { kind: "cycle_test" } })
  const pm = await stripe.paymentMethods.attach("pm_card_visa", { customer: cust.id })
  await stripe.customers.update(cust.id, { invoice_settings: { default_payment_method: pm.id } })
  const sub = await stripe.subscriptions.create({
    customer: cust.id,
    items: [{ price: base.id }, { price: addon.id }], // plan + add-on
    default_payment_method: pm.id,
  })
  log("create subscription", ["active", "trialing"].includes(sub.status) ? ok(`${sub.id} ${sub.status} (plan+addon)`) : bad(`status=${sub.status}`))
  log("  items", `${sub.items.data.length} (base £29 + add-on £5)`)
  const cancelled = await stripe.subscriptions.cancel(sub.id)
  log("cancel subscription", cancelled.status === "canceled" ? ok("canceled") : bad(cancelled.status))
  // cleanup
  await stripe.customers.del(cust.id)
  await stripe.products.update(product.id, { active: false })
}

async function disputeCycle() {
  console.log("\n── 3. DISPUTE (test card that auto-disputes) ──")
  try {
    const pm = await stripe.paymentMethods.create({ type: "card", card: { token: "tok_createDispute" } })
    const pi = await stripe.paymentIntents.create({
      amount: 4200, currency: "gbp", confirm: true, payment_method: pm.id,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: "Propvora cycle test — dispute", metadata: { kind: "cycle_test" },
    })
    log("charge (disputed card)", pi.status === "succeeded" ? ok(`${pi.id} charged → dispute incoming`) : bad(`status=${pi.status}`))
    // Disputes are created asynchronously; poll briefly.
    let found = null
    for (let i = 0; i < 6 && !found; i++) {
      await new Promise((r) => setTimeout(r, 1500))
      const list = await stripe.disputes.list({ payment_intent: pi.id, limit: 1 })
      found = list.data[0] ?? null
    }
    log("dispute created", found ? ok(`${found.id} status=${found.status} reason=${found.reason}`) : "pending (async — appears within ~1 min; webhook charge.dispute.created will fire)")
  } catch (e) {
    log("dispute", bad(e.message?.slice(0, 70) ?? "error"))
  }
}

async function connectCycle() {
  console.log("\n── 4. CONNECT EXPRESS ONBOARDING ──")
  try {
    const acct = await stripe.accounts.create({ type: "express", country: "GB", metadata: { kind: "cycle_test" } })
    const link = await stripe.accountLinks.create({
      account: acct.id, type: "account_onboarding",
      refresh_url: "https://propvora.com/connect/refresh", return_url: "https://propvora.com/connect/return",
    })
    log("create express account", ok(acct.id))
    log("onboarding link", link.url ? ok("hosted onboarding URL generated") : bad("no url"))
    await stripe.accounts.del(acct.id)
    log("cleanup", ok("test account deleted"))
  } catch (e) {
    log("connect", bad(e.message?.slice(0, 70) ?? "error"))
  }
}

async function main() {
  console.log("=== PROPVORA STRIPE FULL-CYCLE TEST (test mode) ===")
  await escrowCycle()
  await subscriptionCycle()
  await disputeCycle()
  await connectCycle()
  console.log("\n=== done ===")
}
main().catch((e) => { console.error("CYCLE FAILED:", e.type ?? "", e.message); process.exit(2) })
