/**
 * POST /api/payments/webhook — PAYMENTS / ESCROW / PAYOUT Stripe webhook.
 *
 * SEPARATE endpoint from the BILLING webhook (`/api/webhooks/stripe`). This one
 * receives escrow / Connect transfer / refund / account events and drives the
 * P5 money state machine in `src/lib/payments/webhooks.ts`.
 *
 * Signature verification, raw-body handling, runtime, and idempotency follow
 * the EXACT pattern of the existing billing webhook — only the dedupe store
 * (public.payments_webhook_events) and the dispatcher differ.
 *
 * Webhook signing secret: `STRIPE_PAYMENTS_WEBHOOK_SECRET` if set (recommended —
 * a dedicated endpoint in the Stripe dashboard has its own secret), otherwise
 * falls back to `STRIPE_WEBHOOK_SECRET`. We NEVER trust an event whose
 * signature does not verify against the chosen secret.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { captureException, requestIdFrom } from "@/lib/observability"
import { handlePaymentEvent } from "@/lib/payments/webhooks"
import { stripeSecretKey } from "@/lib/payments/stripe-keys"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)

  const webhookSecret =
    process.env.STRIPE_PAYMENTS_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET
  const secretKey = stripeSecretKey()
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe payments webhook is not configured." }, { status: 503 })
  }

  const sig = request.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 })
  }

  // Raw body is REQUIRED for signature verification — never use request.json().
  const body = await request.text()

  let event: import("stripe").Stripe.Event
  try {
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia" as const,
    })
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    // Never echo the signature/secret; log for observability only.
    captureException(err, {
      source: "api/payments/webhook:verify",
      requestId,
      tags: { stage: "signature" },
    })
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── Idempotency guard (payments-specific dedupe store) ────────────────────
  // Stripe delivers at-least-once. If we've already processed this event id,
  // acknowledge without re-applying any money transition. A failed run below
  // returns 500 WITHOUT recording, so Stripe's retry is reprocessed; the unique
  // index on stripe_event_id is the hard backstop on a concurrent re-delivery.
  try {
    const { data: seen } = await supabase
      .from("payments_webhook_events")
      .select("stripe_event_id")
      .eq("stripe_event_id", event.id)
      .maybeSingle()
    if (seen) {
      return NextResponse.json({ received: true, duplicate: true })
    }
  } catch {
    // Dedupe store unavailable — fail open and process (signature already valid).
  }

  let summary: Awaited<ReturnType<typeof handlePaymentEvent>>
  try {
    summary = await handlePaymentEvent(event, { supabase })
  } catch (err) {
    captureException(err, {
      source: "api/payments/webhook",
      requestId,
      tags: { eventType: event.type, eventId: event.id },
    })
    // 500 → Stripe retries. We deliberately do NOT record the event id, so the
    // retry is reprocessed rather than skipped as a duplicate.
    return NextResponse.json({ error: "Payment event processing failed." }, { status: 500 })
  }

  // Record the processed event id AFTER success. A concurrent re-delivery that
  // raced past the dedupe check hits the unique index and is ignored.
  try {
    await supabase.from("payments_webhook_events").insert({
      stripe_event_id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    })
  } catch {
    /* unique-violation on concurrent delivery, or store unavailable — non-fatal */
  }

  // 200 fast. Include the (non-sensitive) handled summary for observability.
  return NextResponse.json({
    received: true,
    handled: summary.handled,
    type: summary.type,
    transitions: summary.transitions,
  })
}
