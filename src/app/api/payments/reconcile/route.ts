/**
 * POST /api/payments/reconcile — admin/owner-triggered RECONCILIATION.
 *
 * Runs `reconcilePayments` (read-only, NO Stripe calls) and returns the
 * discrepancy report. Gated by workspace membership AND an elevated role
 * (owner / admin) — a regular member cannot run a workspace money audit.
 *
 * Body: { workspaceId: string }
 *   - The report is scoped to that workspace's sold transactions + payouts.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { reconcilePayments } from "@/lib/payments/reconciliation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Roles allowed to run a reconciliation audit. */
const RECONCILE_ROLES = new Set(["owner", "admin"])

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as { workspaceId?: unknown } | null
    const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : ""
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }

    // Membership + role gate. Look up the caller's accepted membership row.
    const { data: membership, error: memErr } = await supabase
      .from("workspace_members")
      .select("role, status")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (memErr) {
      // Membership table missing entirely → treat as not provisioned.
      const code = (memErr as { code?: string }).code
      if (code === "42P01" || code === "PGRST205") {
        return NextResponse.json({ error: "Workspaces are not provisioned." }, { status: 503 })
      }
      throw memErr
    }
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }
    const role = (membership as { role?: string }).role ?? ""
    const status = (membership as { status?: string }).status ?? ""
    if (status && status !== "active" && status !== "accepted") {
      return NextResponse.json({ error: "Membership is not active" }, { status: 403 })
    }
    if (!RECONCILE_ROLES.has(role)) {
      return NextResponse.json(
        { error: "Reconciliation requires an owner or admin role" },
        { status: 403 }
      )
    }

    const report = await reconcilePayments(supabase as unknown as Parameters<typeof reconcilePayments>[0], workspaceId)
    return NextResponse.json({ report })
  } catch (err) {
    captureException(err, { source: "api/payments/reconcile POST", requestId })
    return NextResponse.json({ error: "Reconciliation failed", requestId }, { status: 500 })
  }
}
