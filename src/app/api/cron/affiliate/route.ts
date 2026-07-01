/**
 * CRON: /api/cron/affiliate — affiliate ledger clearing + automated payouts.
 *
 * Two ordered steps, each wrapped so one failure never blocks the other:
 *   1. clearMaturedCommissions — move pending commissions past the 30-day
 *      cooling-off / chargeback hold to `payable` and shift pending_pence →
 *      cleared_pence. (Moves no money; this is the hold-release.)
 *   2. runAffiliateAutoPayouts — pay every eligible affiliate their cleared
 *      balance via a real Stripe Connect transfer. Idempotent; only pays money
 *      that has already cleared the hold and only to payouts-enabled connected
 *      accounts. Gated by NEXT_PUBLIC_AFFILIATE_PAYOUTS_ENABLED.
 *
 * SECURITY: scheduler-only via `Authorization: Bearer $CRON_SECRET`. Runs with
 * the SERVICE-ROLE admin client. Fails closed if the secret / service-role key
 * are unset.
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authorizeCron } from "@/lib/cron/auth"
import { clearMaturedCommissions } from "@/lib/affiliate/commission"
import { runAffiliateAutoPayouts } from "@/lib/affiliate/auto-payouts"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function handle(request: Request): Promise<NextResponse> {
  const requestId = requestIdFrom(request.headers)

  const auth = authorizeCron(request)
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 })
  }

  const admin = createAdminClient()
  const out: Record<string, unknown> = { ok: true }

  // 1. Release matured commissions past the 30-day hold (pending → payable).
  try {
    out.cleared = await clearMaturedCommissions(admin)
  } catch (err) {
    captureException(err, { source: "api/cron/affiliate:clear", requestId })
    out.clearError = true
  }

  // 2. Execute automated payouts for cleared balances (real Stripe transfers).
  try {
    out.payouts = await runAffiliateAutoPayouts(admin)
  } catch (err) {
    captureException(err, { source: "api/cron/affiliate:payouts", requestId })
    out.payoutsError = true
  }

  return NextResponse.json(out)
}

export async function POST(request: Request) {
  return handle(request)
}

export async function GET(request: Request) {
  return handle(request)
}
