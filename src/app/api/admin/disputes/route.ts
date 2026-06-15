import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminIdentity } from "@/lib/admin/guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/admin/disputes — platform-admin dispute resolution.
 *
 * Body: { disputeId: string, outcome: 'resolved' | 'rejected', resolution: string }
 *
 * SAFETY / HONESTY (hard rule):
 *   • Caller MUST be a verified platform admin (getAdminIdentity, fail-closed).
 *   • Resolution is an EXPLICIT action — never auto-applied. We delegate to
 *     `resolveDispute` (dynamic import from @/lib/marketplace/disputes) which:
 *       1. loads the dispute (must exist, must not be terminal);
 *       2. authorises via the DB helper `can_resolve_dispute`;
 *       3. writes status + resolution + resolved_at + assigned_admin;
 *       4. records an audit entry — ONLY on a confirmed write.
 *   • If `resolveDispute` returns an error (unauthorised / write failed), we
 *     surface it and write nothing. We never report a resolution that did not
 *     happen.
 *
 * The dispute write uses the SERVICE-ROLE client because a platform admin acts
 * across workspaces (cross-tenant by design). Authorisation does NOT rely on
 * that elevated client: `resolveDispute` calls `can_resolve_dispute(p_user,
 * p_workspace)` with the verified admin's own user id, so the SECURITY DEFINER
 * helper is the authority for whether this admin may resolve THIS dispute.
 *
 * GET /api/admin/disputes — admin oversight read of the dispute queue.
 */

const ALLOWED_OUTCOMES = new Set(["resolved", "rejected"])

export async function POST(req: Request) {
  // ── Auth: verified platform admin (fail-closed). ──
  const identity = await getAdminIdentity()
  if (!identity) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ── Parse + validate body. ──
  let body: { disputeId?: string; outcome?: string; resolution?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const disputeId = (body.disputeId ?? "").trim()
  const outcome = (body.outcome ?? "").trim()
  const resolution = (body.resolution ?? "").trim()

  if (!disputeId) return NextResponse.json({ error: "dispute_required" }, { status: 400 })
  if (!ALLOWED_OUTCOMES.has(outcome))
    return NextResponse.json({ error: "invalid_outcome" }, { status: 400 })
  if (!resolution) return NextResponse.json({ error: "resolution_required" }, { status: 400 })

  // ── Delegate to the authorised, audited resolver (dynamic import). ──
  try {
    const { resolveDispute } = await import("@/lib/marketplace/disputes")
    // Service-role client: a platform admin acts cross-tenant. Authorisation is
    // still enforced inside resolveDispute via can_resolve_dispute(adminUserId).
    const admin = createAdminClient()

    const { data, error } = await resolveDispute(admin, disputeId, {
      adminUserId: identity.userId,
      outcome: outcome as "resolved" | "rejected",
      resolution,
    })

    if (error) {
      const status = error === "not_authorised" ? 403 : error === "dispute_not_found" ? 404 : 400
      return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } })
    }

    return NextResponse.json(
      { ok: true, dispute: data },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "resolution_failed" },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  const identity = await getAdminIdentity()
  if (!identity) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const status = url.searchParams.get("status") ?? undefined

  // Cross-tenant oversight read via the data layer (service-role, gated above).
  const { listDisputesForAdmin } = await import("@/components/admin-marketplace/data")
  const result = await listDisputesForAdmin({ status: status ?? undefined })
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
}
