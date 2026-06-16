/**
 * CRON: /api/cron/expire-holds — release stale reservation holds.
 *
 * WHAT IT DOES (and honestly does NOT):
 *   1. Booking holds: flips any `bookings` row in status='hold' whose
 *      `hold_expires_at` is in the past to 'cancelled', FREEING those dates for
 *      other guests. This is a safe, reversible state flip — NO money moves
 *      (holds never captured a payment). Done via `expireStaleHolds` with the
 *      service-role client for a PLATFORM-WIDE sweep across all workspaces.
 *   2. Escrow holds: REPORT-ONLY. The escrow money model has no time-based
 *      expiry, and money state only ever flips on a verified Stripe webhook
 *      (see lib/payments/webhooks.ts). So this endpoint NEVER releases, refunds,
 *      or otherwise moves escrowed funds. It counts escrow holds still in
 *      status='held' so an operator can see the backlog — that is the honest,
 *      best-effort signal; actual release stays webhook-driven.
 *
 * SECURITY: scheduler-only via `authorizeCron` (Bearer $CRON_SECRET); else 401.
 * Runs with the service-role admin client (server-only). Fails closed if
 * CRON_SECRET is unset.
 *
 * Schedule: every 15 minutes (see vercel.json).
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authorizeCron } from "@/lib/cron/auth"
import { expireStaleHolds } from "@/lib/booking/reservations"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Count escrow holds still 'held' (report-only — money is never moved here). */
async function countHeldEscrow(admin: ReturnType<typeof createAdminClient>): Promise<number | null> {
  try {
    const { count, error } = await admin
      .from("escrow_holds")
      .select("id", { count: "exact", head: true })
      .eq("status", "held")
    if (error) return null
    return count ?? 0
  } catch {
    return null
  }
}

async function handle(request: Request): Promise<NextResponse> {
  const requestId = requestIdFrom(request.headers)

  const auth = authorizeCron(request)
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Runner not configured." }, { status: 503 })
  }

  try {
    const admin = createAdminClient()
    // Platform-wide booking-hold expiry (no workspaceId → all workspaces).
    const bookingHoldsExpired = await expireStaleHolds(admin)
    // Report-only escrow backlog signal.
    const escrowHeld = await countHeldEscrow(admin)

    return NextResponse.json({
      ok: true,
      bookingHoldsExpired,
      escrowHeld, // informational only; no funds moved
      note: "Escrow release is webhook-driven; this endpoint never moves money.",
    })
  } catch (err) {
    captureException(err, { source: "api/cron/expire-holds", requestId })
    return NextResponse.json({ error: "Expire-holds failed.", requestId }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handle(request)
}

export async function GET(request: Request) {
  return handle(request)
}
