/**
 * POST /api/identity/webhook — Stripe IDENTITY (KYC) webhook.
 *
 * Receives `identity.verification_session.*` events and drives the P6 identity
 * verification status in `src/lib/identity/verification.ts` (handleIdentityEvent).
 * SEPARATE endpoint from the BILLING webhook (`/api/webhooks/stripe`) and the
 * PAYMENTS webhook (`/api/payments/webhook`).
 *
 * Signature verification, raw-body handling, runtime, and idempotency follow the
 * EXACT pattern of those existing webhooks. This handler NEVER calls Stripe other
 * than the SDK's local `constructEvent` signature check (no live API request).
 *
 * SIGNING SECRET
 * --------------
 * Uses `STRIPE_IDENTITY_WEBHOOK_SECRET` when set (recommended — a dedicated
 * Stripe webhook endpoint has its own secret), otherwise falls back to
 * `STRIPE_WEBHOOK_SECRET`. We NEVER trust an event whose signature does not
 * verify against the chosen secret.
 *
 * IDEMPOTENCY
 * -----------
 * Reuses the existing `public.payments_webhook_events` dedupe store rather than
 * adding a new table. Stripe event ids are globally unique (`evt_...`), so an
 * identity event id can never collide with a payments event id; sharing the
 * store is safe and keeps the dedupe logic identical to the payments webhook.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { captureException, requestIdFrom } from "@/lib/observability"
import { handleIdentityEvent } from "@/lib/identity"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)

  const webhookSecret =
    process.env.STRIPE_IDENTITY_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json({ error: "Stripe identity webhook is not configured." }, { status: 503 })
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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia" as const,
    })
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    // Never echo the signature/secret; log for observability only.
    captureException(err, {
      source: "api/identity/webhook:verify",
      requestId,
      tags: { stage: "signature" },
    })
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── Idempotency guard (shared payments dedupe store) ──────────────────────
  // Stripe delivers at-least-once. If we've already processed this event id,
  // acknowledge without re-applying the status transition. A failed run below
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

  let result: Awaited<ReturnType<typeof handleIdentityEvent>>
  try {
    result = await handleIdentityEvent(
      {
        id: event.id,
        type: event.type,
        data: { object: event.data.object as { id?: string | null; status?: string | null } },
      },
      { supabase }
    )
  } catch (err) {
    captureException(err, {
      source: "api/identity/webhook",
      requestId,
      tags: { eventType: event.type, eventId: event.id },
    })
    // 500 → Stripe retries. We deliberately do NOT record the event id, so the
    // retry is reprocessed rather than skipped as a duplicate.
    return NextResponse.json({ error: "Identity event processing failed." }, { status: 500 })
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
    handled: result.handled,
    type: result.type,
    transition: result.transition,
  })
}
