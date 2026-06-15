import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { recordAudit } from "@/lib/audit/log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/identity/review — platform-admin KYC decision endpoint.
 *
 * Body: { verificationId, action: 'approve' | 'reject' | 'request_info', note? }
 *
 * Contract & guarantees:
 *  - Authorises the caller as a platform admin (service-role profile read,
 *    fail-closed). A non-admin gets 403 before anything is read or written.
 *  - The decision is ALWAYS an explicit admin action — there is no code path
 *    that approves/rejects without the admin's action arriving here. The system
 *    never auto-decides.
 *  - Validates the transition (only queue states pending/processing/
 *    requires_input can be acted on; terminal states are rejected).
 *  - Writes the status change via the sibling `setVerificationStatus` contract
 *    when present; tolerates its absence by writing the status directly with the
 *    service-role client.
 *  - Records an audit-trail entry for EVERY decision, then returns the real new
 *    status. Success is only reported after the status change actually landed.
 */

type Action = "approve" | "reject" | "request_info"

// Action → resulting verification status. These MUST match the
// identity_verifications.status CHECK constraint (migration 20260616110000):
// not_started|pending|processing|verified|requires_input|rejected|cancelled.
// 'approve' resolves to 'verified' (there is no 'approved' state).
const ACTION_TO_STATUS: Record<Action, string> = {
  approve: "verified",
  reject: "rejected",
  request_info: "requires_input",
}

const ACTIONABLE_FROM = new Set(["pending", "processing", "requires_input"])

const AUDIT_ACTION: Record<Action, string> = {
  approve: "identity.verification_approved",
  reject: "identity.verification_rejected",
  request_info: "identity.verification_info_requested",
}

function isAction(v: unknown): v is Action {
  return v === "approve" || v === "reject" || v === "request_info"
}

export async function POST(req: Request) {
  // ── Auth: session user → platform admin (fail-closed). ──
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle()

  let isAdmin = profile?.platform_role === "admin"
  if (!isAdmin) {
    // Secondary grant path mirrors the guard's platform_admins table.
    try {
      const { data } = await admin
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()
      if (data) isAdmin = true
    } catch {
      /* table missing — stays denied */
    }
  }
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // ── Parse + validate body. ──
  let body: { verificationId?: string; action?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const { verificationId } = body
  const action = body.action
  const note = typeof body.note === "string" ? body.note.trim() : ""

  if (!verificationId || !isAction(action)) {
    return NextResponse.json({ error: "Missing or invalid verificationId / action" }, { status: 400 })
  }
  if ((action === "reject" || action === "request_info") && note.length === 0) {
    return NextResponse.json({ error: "A note is required for this action" }, { status: 400 })
  }

  // ── Load the verification to validate the transition + resolve workspace. ──
  const { data: verification, error: loadError } = await admin
    .from("identity_verifications")
    .select("id, subject_type, subject_id, workspace_id, status")
    .eq("id", verificationId)
    .maybeSingle()

  if (loadError) {
    return NextResponse.json({ error: "Could not load verification" }, { status: 500 })
  }
  if (!verification) {
    return NextResponse.json({ error: "Verification not found" }, { status: 404 })
  }

  const currentStatus = (verification.status as string) ?? "pending"
  if (!ACTIONABLE_FROM.has(currentStatus)) {
    return NextResponse.json(
      { error: `Verification is in a final state (${currentStatus}); no action possible` },
      { status: 409 }
    )
  }

  const newStatus = ACTION_TO_STATUS[action]
  const workspaceId = (verification.workspace_id as string) ?? null
  const subjectUserId =
    verification.subject_type === "user" ? ((verification.subject_id as string) ?? null) : null

  // ── Apply the status change. Prefer the sibling contract; fall back to a
  //    direct service-role update if it is absent or fails to expose the fn. ──
  let applied = false
  let appliedVia = "direct"
  try {
    const mod = await import("@/lib/identity/verification").catch(() => null)
    const setFn = mod && (mod as { setVerificationStatus?: unknown }).setVerificationStatus
    if (typeof setFn === "function") {
      await (setFn as (
        client: unknown,
        id: string,
        status: string,
        opts?: Record<string, unknown>
      ) => Promise<unknown>)(admin, verificationId, newStatus, {
        note: note || undefined,
        reviewerId: user.id,
      })
      applied = true
      appliedVia = "contract"
    }
  } catch {
    // Contract present but threw — fall through to the direct path so the
    // admin's decision still lands.
    applied = false
  }

  if (!applied) {
    const update: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    // review_note may not exist on every schema; try with it, retry without on
    // an undefined-column error so the status change is never blocked.
    let { error: updErr } = await admin
      .from("identity_verifications")
      .update({ ...update, review_note: note || null, reviewed_by: user.id })
      .eq("id", verificationId)
    if (updErr && (updErr.code === "42703" || updErr.code === "PGRST204")) {
      ;({ error: updErr } = await admin
        .from("identity_verifications")
        .update(update)
        .eq("id", verificationId))
    }
    if (updErr) {
      return NextResponse.json(
        { error: `Could not record decision: ${updErr.message}` },
        { status: 500 }
      )
    }
    applied = true
  }

  // ── Audit the decision (best-effort, never blocks the response). ──
  await recordAudit(admin, {
    workspaceId,
    userId: user.id,
    action: AUDIT_ACTION[action],
    resourceType: "identity_verification",
    resourceId: verificationId,
    metadata: {
      from_status: currentStatus,
      to_status: newStatus,
      subject_user_id: subjectUserId,
      has_note: note.length > 0,
      applied_via: appliedVia,
    },
  })

  // ── Only now report success, with the real new status. ──
  return NextResponse.json(
    { ok: true, status: newStatus, action },
    { headers: { "Cache-Control": "no-store" } }
  )
}
