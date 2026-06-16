/**
 * CRON: /api/cron/automation-runner — drain the automation v2 queue.
 *
 * This is the consumer that was missing: it claims queued `automation_v2_runs`
 * and executes them through the real engine (see `lib/automation/executor.ts`).
 *
 * SECURITY: only the scheduler may call this. We verify the
 * `Authorization: Bearer $CRON_SECRET` header (Vercel Cron attaches it) via
 * `authorizeCron`; any other request gets 401. There is no authenticated user —
 * the secret is the credential, so we run with the SERVICE-ROLE admin client
 * (server-only; never exposed). Fails closed if CRON_SECRET is unset.
 *
 * Schedule: every few minutes (see vercel.json). GET and POST behave the same so
 * Vercel Cron (which issues GET) and manual POSTs both work.
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { authorizeCron } from "@/lib/cron/auth"
import { drainAutomationQueue } from "@/lib/automation/executor"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** How many queued runs to drain per invocation (clamped inside the executor). */
const DRAIN_LIMIT = 50

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
    const result = await drainAutomationQueue(admin, { limit: DRAIN_LIMIT })
    return NextResponse.json({
      ok: true,
      claimed: result.claimed,
      executed: result.executed,
      succeeded: result.succeeded,
      failed: result.failed,
      skipped: result.skipped,
    })
  } catch (err) {
    captureException(err, { source: "api/cron/automation-runner", requestId })
    return NextResponse.json({ error: "Drain failed.", requestId }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handle(request)
}

export async function GET(request: Request) {
  return handle(request)
}
