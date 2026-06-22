// One-off Stripe TEST-MODE smoke test. Safe: refuses anything but sk_test_.
// Proves: key validity, manual-capture (escrow) PaymentIntent create/retrieve/
// cancel, and lists webhook endpoints. Never prints secrets.
import { readFileSync } from "node:fs"
import Stripe from "stripe"

function envFromFile(name) {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    const m = txt.match(new RegExp(`^${name}=(.*)$`, "m"))
    return m ? m[1].trim() : undefined
  } catch { return undefined }
}

const sk = envFromFile("STRIPE_SECRET_KEY_TEST") || ""
if (!sk.startsWith("sk_test_")) {
  console.error("REFUSING: STRIPE_SECRET_KEY_TEST is not an sk_test_ key. Aborting (no live charges in tests).")
  process.exit(1)
}

const stripe = new Stripe(sk, { apiVersion: "2026-05-27.dahlia" })

async function main() {
  const results = []

  // 1. Account reachable
  const acct = await stripe.accounts.retrieve()
  results.push(["account", `ok · ${acct.country} · charges_enabled=${acct.charges_enabled}`])

  // 2. Escrow intent: manual capture (auth-only hold), automatic methods
  const pi = await stripe.paymentIntents.create({
    amount: 1000, currency: "gbp", capture_method: "manual",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    description: "Propvora smoke test (escrow hold)",
    metadata: { kind: "smoke_test" },
  })
  results.push(["intent.create", `ok · ${pi.id} · status=${pi.status} · cs=${pi.client_secret ? "present" : "MISSING"}`])

  // 3. Retrieve + cancel (clean up — nothing captured)
  const got = await stripe.paymentIntents.retrieve(pi.id)
  results.push(["intent.retrieve", `ok · status=${got.status}`])
  const cancelled = await stripe.paymentIntents.cancel(pi.id)
  results.push(["intent.cancel", `ok · status=${cancelled.status}`])

  // 4. Customer + SetupIntent (saved-card path)
  const cust = await stripe.customers.create({ metadata: { kind: "smoke_test" } })
  const si = await stripe.setupIntents.create({ customer: cust.id, automatic_payment_methods: { enabled: true, allow_redirects: "never" } })
  results.push(["setupIntent", `ok · ${si.id} · status=${si.status}`])
  await stripe.customers.del(cust.id)

  // 5. Webhook endpoints configured
  const hooks = await stripe.webhookEndpoints.list({ limit: 10 })
  results.push(["webhooks", `${hooks.data.length} endpoint(s)`])
  for (const h of hooks.data) results.push(["  webhook", `${h.status} · ${h.url} · events=${h.enabled_events.length}`])

  // 6. Connect capability (for Express onboarding)
  try {
    const accts = await stripe.accounts.list({ limit: 1 })
    results.push(["connect", `ok · connected accounts visible (${accts.data.length} shown)`])
  } catch (e) {
    results.push(["connect", `unavailable · ${e.message?.slice(0, 60)}`])
  }

  console.log("\n=== STRIPE TEST-MODE SMOKE RESULTS ===")
  for (const [k, v] of results) console.log(`${k.padEnd(18)} ${v}`)
  console.log("=== all good ===\n")
}

main().catch((e) => {
  console.error("SMOKE FAILED:", e.type ?? "", e.message)
  process.exit(2)
})
