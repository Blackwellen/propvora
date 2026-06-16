/**
 * CRON: /api/cron/reconcile — scheduled platform-wide reconciliation.
 *
 * Runs `reconcilePayments` (READ-ONLY; makes ZERO Stripe calls and moves NO
 * money) across the whole platform and LOGS any discrepancies. It never
 * auto-corrects, releases, or transfers funds — money state only ever flips on a
 * verified Stripe webhook (lib/payments/webhooks.ts). A drift here is a signal
 * for a human, recorded to the audit log + observability, not an action.
 *
 * SECURITY: scheduler-only via `authorizeCron` (Bearer $CRON_SECRET); else 401.
 * Runs with the service-role admin client (server-only). Fails closed if
 * CRON_SECRET is unset.
 *
 * Schedule: daily (see vercel.json).
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authorizeCron } from "@/lib/cron/auth"
import { reconcilePayments } from "@/lib/payments/reconciliation"
import { recordAudit } from "@/lib/audit/log"
import { captureMessage, captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

    // Platform-wide sweep (no workspaceId → all rows). Read-only.
    const report = await reconcilePayments(
      admin as unknown as Parameters<typeof reconcilePayments>[0]
    )

    // Log discrepancies (signal only — we do NOT move money on drift).
    if (!report.clean) {
      captureMessage(
        `Reconciliation found ${report.discrepancies.length} discrepancy(ies).`,
        "warning",
        {
          source: "api/cron/reconcile",
          requestId,
          tags: { discrepancies: report.discrepancies.length },
        }
      )
      // One audit row per discrepancy, scoped to the affected workspace where known.
      for (const d of report.discrepancies) {
        await recordAudit(admin, {
          workspaceId: d.workspaceId,
          action: "payments.reconciliation_discrepancy",
          resourceType: d.kind,
          resourceId: d.id,
          metadata: {
            kind: d.kind,
            expectedPence: d.expectedPence,
            actualPence: d.actualPence,
            deltaPence: d.deltaPence,
            detail: d.detail,
            source: "cron",
          },
        })
      }
    }

    return NextResponse.json({
      ok: true,
      clean: report.clean,
      discrepancies: report.discrepancies.length,
      counts: report.counts,
      note: "Read-only reconciliation. Discrepancies are logged; no funds were moved.",
    })
  } catch (err) {
    captureException(err, { source: "api/cron/reconcile", requestId })
    return NextResponse.json({ error: "Reconcile failed.", requestId }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handle(request)
}

export async function GET(request: Request) {
  return handle(request)
}
