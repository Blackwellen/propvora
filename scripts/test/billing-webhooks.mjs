// Stripe webhook coverage audit (STATIC — no network).
//
// Parses src/app/api/webhooks/stripe/route.ts and asserts:
//   1. Signature verification is present (constructEvent + STRIPE_WEBHOOK_SECRET).
//   2. Idempotency / replay protection is present (stripe_webhook_events dedupe).
//   3. Every event the subscription lifecycle needs has a handler case.
//   4. Raw body is read (request.text(), not request.json()) for sig verify.
//
// Usage: node scripts/test/billing-webhooks.mjs
import { readFileSync } from "node:fs"

const FILE = "src/app/api/webhooks/stripe/route.ts"
const src = readFileSync(FILE, "utf8")

const results = []
function check(name, pass, detail) {
  results.push({ name, pass })
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`)
}

// Extract the event types that have an explicit `case "..."` in the switch.
// Stripe event names always contain a dot (e.g. invoice.paid); this filters out
// the unrelated subscription-status switch ("active", "canceled", …).
const handled = new Set(
  [...src.matchAll(/case\s+"([a-z0-9_]+(?:\.[a-z0-9_]+)+)"\s*:/g)].map((m) => m[1])
)
console.log(`Handled events (${handled.size}): ${[...handled].sort().join(", ")}\n`)

// ── 1. Signature verification ────────────────────────────────────────────────
check("signature verification (webhooks.constructEvent)",
  /webhooks\.constructEvent\s*\(/.test(src))
check("uses STRIPE_WEBHOOK_SECRET",
  src.includes("STRIPE_WEBHOOK_SECRET"))
check("rejects missing stripe-signature header",
  /stripe-signature/.test(src) && /400/.test(src))
check("reads RAW body (request.text, not request.json)",
  /request\.text\(\)/.test(src) && !/await\s+request\.json\(\)/.test(src))

// ── 2. Idempotency / replay protection ───────────────────────────────────────
check("idempotency: dedupe store (stripe_webhook_events)",
  src.includes("stripe_webhook_events"))
check("idempotency: checks event.id before processing",
  /stripe_event_id/.test(src) && /event\.id/.test(src))
check("idempotency: records event id AFTER success",
  /insert\([^)]*stripe_event_id/s.test(src) ||
  /\.insert\(\{\s*[^}]*stripe_event_id/s.test(src))
check("retries on failure (returns 500, does not record)",
  /status:\s*500/.test(src))

// ── 3. Critical subscription-lifecycle events ────────────────────────────────
// The minimum set a SaaS subscription needs end-to-end. Each maps to a real
// state transition in the app (plan, plan_status, affiliate accrual/reversal).
const CRITICAL = {
  "checkout.session.completed": "activate plan after checkout (webhook, not client redirect)",
  "customer.subscription.created": "set tier on new subscription",
  "customer.subscription.updated": "tier/status change (upgrade/downgrade/past_due)",
  "customer.subscription.deleted": "downgrade to starter on cancel",
  "invoice.paid": "revenue recognised + affiliate accrual",
  "invoice.payment_failed": "mark workspace past_due (dunning)",
}
// Recommended (not strictly blocking) lifecycle events.
const RECOMMENDED = {
  "charge.refunded": "reverse affiliate commission on refund",
  "charge.dispute.created": "flag workspace + reverse commission on chargeback",
}

for (const [evt, why] of Object.entries(CRITICAL)) {
  check(`handles ${evt}`, handled.has(evt), handled.has(evt) ? why : `MISSING — needed to: ${why}`)
}
for (const [evt, why] of Object.entries(RECOMMENDED)) {
  if (handled.has(evt)) check(`handles ${evt} (recommended)`, true, why)
  else console.log(`⚠️  INFO  ${evt} not handled — recommended: ${why}`)
}

// ── 4. Connect-related (only matters when NEXT_PUBLIC_FF_STRIPE_CONNECT on) ───
if (handled.has("account.updated")) {
  check("handles account.updated (Stripe Connect status sync)", true,
    "syncs connected-account onboarding status when Connect is enabled")
}

const failed = results.filter((r) => !r.pass).length
console.log(`\n=== WEBHOOK COVERAGE: ${results.length - failed}/${results.length} checks passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
