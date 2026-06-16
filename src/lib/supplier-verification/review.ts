import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { recordAudit } from "@/lib/audit/log"
import type {
  AdminDecision,
  SupplierVerificationStatus,
  SupplierVerificationEventRow,
  CheckStatus,
  ManualReviewStatus,
} from "./types"

/**
 * Admin review decisions for supplier ID verification.
 *
 * EVERY decision is an EXPLICIT, recorded admin action. Nothing here auto-
 * decides: there is no path that approves identity, insurance, or a licence
 * without an admin invoking one of these functions. Each decision:
 *   1. writes the new status onto the canonical record,
 *   2. appends a supplier_verification_events row (append-only trail),
 *   3. writes an audit_logs entry via recordAudit (best-effort).
 */

const AUDIT_ACTIONS = {
  APPROVE: "supplier_verification.approved",
  REJECT: "supplier_verification.rejected",
  MORE_INFO: "supplier_verification.more_info",
  EXPIRED: "supplier_verification.expired",
  SUSPICIOUS: "supplier_verification.flagged_suspicious",
  BLOCKED: "supplier_verification.blocked",
} as const

/** Map a decision verb onto the resulting canonical status + review status. */
function targetStateFor(decision: AdminDecision): {
  status: SupplierVerificationStatus
  manualReview: ManualReviewStatus
  docCheck?: CheckStatus
  selfieCheck?: CheckStatus
} {
  switch (decision) {
    case "approve":
      // Identity (L4) review approved: both checks pass, manual review approved.
      return { status: "verified", manualReview: "approved", docCheck: "passed", selfieCheck: "passed" }
    case "reject":
      return { status: "rejected", manualReview: "rejected", docCheck: "failed", selfieCheck: "failed" }
    case "more_info":
      return { status: "pending_review", manualReview: "more_info" }
    case "expired":
      return { status: "expired", manualReview: "not_required" }
    case "suspicious":
      // A flag for review — keeps record in review, does not approve.
      return { status: "pending_review", manualReview: "pending" }
    case "blocked":
      return { status: "suspended", manualReview: "rejected" }
  }
}

export interface DecideArgs {
  verificationId: string
  decision: AdminDecision
  adminUserId: string
  note?: string | null
  /** Optional risk-flag payload appended on suspicious/blocked. */
  riskFlag?: { flagType: string; severity: "low" | "medium" | "high"; detail?: Record<string, unknown> }
}

export interface DecideResult {
  ok: boolean
  newStatus: SupplierVerificationStatus | null
  error?: string
}

/**
 * Apply an admin decision. Returns the new status, or an error string. NEVER
 * auto-decides — the caller (an admin route guarded by requireAdmin) supplies
 * the explicit decision verb.
 */
export async function decide(args: DecideArgs): Promise<DecideResult> {
  const { verificationId, decision, adminUserId, note } = args
  const target = targetStateFor(decision)

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { ok: false, newStatus: null, error: "service unavailable" }
  }

  // Load current row for from_status + workspace.
  const { data: current, error: loadErr } = await admin
    .from("supplier_identity_verifications")
    .select("id, supplier_workspace_id, status")
    .eq("id", verificationId)
    .maybeSingle()
  if (loadErr || !current) {
    return { ok: false, newStatus: null, error: "verification not found" }
  }

  const fromStatus = current.status as string
  const supplierWorkspaceId = current.supplier_workspace_id as string

  const patch: Record<string, unknown> = {
    status: target.status,
    manual_review_status: target.manualReview,
  }
  if (target.docCheck) patch.document_check_status = target.docCheck
  if (target.selfieCheck) patch.selfie_check_status = target.selfieCheck
  if (decision === "approve") patch.verified_at = new Date().toISOString()

  const { error: updErr } = await admin
    .from("supplier_identity_verifications")
    .update(patch)
    .eq("id", verificationId)
  if (updErr) {
    return { ok: false, newStatus: null, error: updErr.message }
  }

  // Append the event (audit trail).
  await recordEvent({
    verificationId,
    supplierWorkspaceId,
    eventType: `admin_${decision}`,
    fromStatus,
    toStatus: target.status,
    actorUserId: adminUserId,
    actorRole: "admin",
    detail: note ? { note } : {},
  })

  // Optional risk flag on suspicious / blocked.
  if (args.riskFlag && (decision === "suspicious" || decision === "blocked")) {
    try {
      await admin.from("supplier_verification_risk_flags").insert({
        verification_id: verificationId,
        supplier_workspace_id: supplierWorkspaceId,
        flag_type: args.riskFlag.flagType,
        severity: args.riskFlag.severity,
        detail: args.riskFlag.detail ?? {},
      })
    } catch {
      /* best-effort */
    }
  }

  // Tamper-aware audit (best-effort, never throws).
  const action =
    decision === "approve" ? AUDIT_ACTIONS.APPROVE
    : decision === "reject" ? AUDIT_ACTIONS.REJECT
    : decision === "more_info" ? AUDIT_ACTIONS.MORE_INFO
    : decision === "expired" ? AUDIT_ACTIONS.EXPIRED
    : decision === "suspicious" ? AUDIT_ACTIONS.SUSPICIOUS
    : AUDIT_ACTIONS.BLOCKED
  await recordAudit(admin, {
    workspaceId: supplierWorkspaceId,
    userId: adminUserId,
    action,
    resourceType: "supplier_verification",
    resourceId: verificationId,
    metadata: { from: fromStatus, to: target.status, decision },
  })

  return { ok: true, newStatus: target.status }
}

export interface RecordEventArgs {
  verificationId: string
  supplierWorkspaceId: string
  eventType: string
  fromStatus?: string | null
  toStatus?: string | null
  actorUserId?: string | null
  actorRole?: "supplier" | "admin" | "system"
  detail?: Record<string, unknown>
}

/** Append an event row to the supplier verification trail. Best-effort. */
export async function recordEvent(args: RecordEventArgs): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from("supplier_verification_events").insert({
      verification_id: args.verificationId,
      supplier_workspace_id: args.supplierWorkspaceId,
      event_type: args.eventType,
      from_status: args.fromStatus ?? null,
      to_status: args.toStatus ?? null,
      actor_user_id: args.actorUserId ?? null,
      actor_role: args.actorRole ?? "system",
      detail: args.detail ?? {},
    })
  } catch {
    /* best-effort */
  }
}

/** Accept a piece of evidence (insurance / licence / business doc) — admin only. */
export async function acceptEvidence(
  table: "supplier_insurance_policies" | "supplier_licence_verifications" | "supplier_business_verifications" | "supplier_identity_documents",
  id: string,
  adminUserId: string,
  accept: boolean,
  note?: string | null
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data: row } = await admin.from(table).select("verification_id, supplier_workspace_id").eq("id", id).maybeSingle()
    const { error } = await admin
      .from(table)
      .update({ status: accept ? "accepted" : "rejected", notes: note ?? null })
      .eq("id", id)
    if (error) return false
    if (row) {
      await recordEvent({
        verificationId: row.verification_id as string,
        supplierWorkspaceId: row.supplier_workspace_id as string,
        eventType: accept ? "evidence_accepted" : "evidence_rejected",
        actorUserId: adminUserId,
        actorRole: "admin",
        detail: { table, id, note: note ?? null },
      })
    }
    return true
  } catch {
    return false
  }
}

/** List the event trail for a verification (newest first). */
export async function listEvents(
  verificationId: string
): Promise<SupplierVerificationEventRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_verification_events")
      .select("*")
      .eq("verification_id", verificationId)
      .order("created_at", { ascending: false })
    if (error) return []
    return (data ?? []) as SupplierVerificationEventRow[]
  } catch {
    return []
  }
}
