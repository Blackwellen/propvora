/**
 * CRON: /api/cron/daily — single daily aggregator.
 *
 * Vercel Hobby plans allow cron jobs to run at most once per day, so the three
 * separate workers (automation drain, stale-hold expiry, payment reconciliation)
 * are folded into ONE daily invocation here. Each step is wrapped so a failure in
 * one never blocks the others. On Pro, the individual cron endpoints can be
 * scheduled at higher frequency instead.
 *
 * SECURITY: scheduler-only via `Authorization: Bearer $CRON_SECRET` (Vercel Cron
 * attaches it). No authenticated user — runs with the SERVICE-ROLE admin client
 * (server-only). Fails closed if CRON_SECRET / service-role key are unset.
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authorizeCron } from "@/lib/cron/auth"
import { drainAutomationQueue } from "@/lib/automation/executor"
import { enqueueAllDue } from "@/lib/automation/enqueue"
import { escalateOverdueApprovals } from "@/lib/automation/approvals"
import { expireStaleHolds } from "@/lib/booking/reservations"
import { reconcilePayments } from "@/lib/payments/reconciliation"
import { dispatchPpmReminderEmails } from "@/lib/ppm/reminder-emails"
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

  // 1. Evaluate active automations → enqueue due runs, then drain + escalate.
  //    The enqueue step was previously missing, so the drain had nothing to do
  //    and automations never fired on real events.
  try {
    out.automationEnqueued = await enqueueAllDue(admin)
    out.automation = await drainAutomationQueue(admin, { limit: 100 })
    out.approvalsEscalated = await escalateOverdueApprovals(admin)
  } catch (err) {
    captureException(err, { source: "api/cron/daily:automation", requestId })
    out.automationError = true
  }

  // 2. Expire stale booking holds (frees their dates; moves no money).
  try {
    out.holdsExpired = await expireStaleHolds(admin)
  } catch (err) {
    captureException(err, { source: "api/cron/daily:holds", requestId })
    out.holdsError = true
  }

  // 3. Read-only payment reconciliation (zero Stripe calls, moves no money).
  try {
    out.reconcile = await reconcilePayments(admin)
  } catch (err) {
    captureException(err, { source: "api/cron/daily:reconcile", requestId })
    out.reconcileError = true
  }

  // 4. PPM reminder emails — ensure today's in-app reminders exist (idempotent),
  //    then email any not-yet-emailed dispatch rows via Resend.
  try {
    out.ppmReminders = await dispatchPpmReminderEmails(admin)
  } catch (err) {
    captureException(err, { source: "api/cron/daily:ppmReminders", requestId })
    out.ppmRemindersError = true
  }

  return NextResponse.json(out)
}

export async function POST(request: Request) {
  return handle(request)
}

export async function GET(request: Request) {
  return handle(request)
}
