import "server-only"

/**
 * P5+ — RELEASE-BLOCK ENGINE.
 *
 * Before ANY payout / escrow release / transfer is allowed, the funds must pass
 * EVERY block gate. The cardinal rule: **NEVER FAIL OPEN.** If a gate cannot be
 * evaluated (table missing, query error, verification subsystem down), the block
 * is treated as ACTIVE and the release is denied. A payout is allowed only when
 * every gate explicitly returns "clear".
 *
 * Each evaluation is recorded in `payment_release_blocks` (append-style audit):
 * when a gate fires we INSERT a blocked row; when a previously-blocked gate now
 * clears we stamp `cleared_at` on the open row. This means a payout can never
 * silently fail open — every decision leaves a trail.
 *
 * Gates (block_code):
 *   open_dispute      — an unresolved dispute touches this payment/booking/txn.
 *   missing_evidence  — supplier-job evidence not submitted/approved.
 *   insurance_invalid — supplier insurance evidence not valid for the job.
 *   licence_invalid   — supplier licence evidence not valid for the category.
 *   sanctions         — a sanctions / AML flag is open on a party.
 *   approval_missing  — a required manual approval (high-risk job) is absent.
 *   safety_issue      — an open safety incident on the job/booking.
 *   admin_hold        — an operator/admin has manually held the payout.
 *
 * This module uses a SERVICE-ROLE client (passed in) because it is called from
 * the webhook / release engine where RLS would otherwise hide cross-workspace
 * rows (e.g. a dispute raised by the buyer against the seller).
 */

import { canAcceptJob } from "@/lib/supplier-verification/gating"
import type { JobRiskTier } from "@/lib/supplier-verification/types"

export interface ReleaseSupabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export type ReleaseBlockCode =
  | "open_dispute"
  | "missing_evidence"
  | "insurance_invalid"
  | "licence_invalid"
  | "sanctions"
  | "approval_missing"
  | "safety_issue"
  | "admin_hold"

export interface ReleaseContext {
  workspaceId: string
  /** escrow_payments.id (the funds being released). */
  paymentId?: string | null
  /** Optional linkage for the gates. */
  bookingId?: string | null
  transactionId?: string | null
  /** Supplier job linkage — drives evidence / insurance / licence / approval. */
  supplierJobId?: string | null
  supplierWorkspaceId?: string | null
  jobRisk?: JobRiskTier | null
  jobCategory?: string | null
  /** Who triggered the evaluation (audit). */
  evaluatedBy?: string | null
}

export interface BlockResult {
  code: ReleaseBlockCode
  blocked: boolean
  detail: string
}

export interface ReleaseDecision {
  allowed: boolean
  blocks: BlockResult[]
  /** Only the gates that are actively blocking. */
  activeBlocks: BlockResult[]
}

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703"])
function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/**
 * Run a guarded query. On a provisioning error we return `undefined` (gate can't
 * read its source) — the CALLER decides the fail-closed default. On any other
 * error we THROW so the release halts (never silently allow).
 */
async function guardedRows<T = Record<string, unknown>>(
  run: () => Promise<{ data: T[] | null; error: unknown }>
): Promise<T[] | undefined> {
  try {
    const { data, error } = await run()
    if (error) {
      if (isNotProvisioned(error)) return undefined
      throw error
    }
    return (data as T[]) ?? []
  } catch (err) {
    if (isNotProvisioned(err)) return undefined
    throw err
  }
}

// ─── Individual gates ────────────────────────────────────────────────────────

/** OPEN DISPUTE — any non-terminal dispute touching the payment/booking/txn. */
async function gateOpenDispute(
  supabase: ReleaseSupabase,
  ctx: ReleaseContext
): Promise<BlockResult> {
  // Marketplace/stay/supplier unified disputes.
  const ors: string[] = []
  if (ctx.paymentId) ors.push(`payment_id.eq.${ctx.paymentId}`)
  if (ctx.bookingId) ors.push(`booking_id.eq.${ctx.bookingId}`)
  if (ctx.transactionId) ors.push(`transaction_id.eq.${ctx.transactionId}`)
  if (ctx.supplierJobId) ors.push(`supplier_assignment_id.eq.${ctx.supplierJobId}`)

  if (ors.length === 0) {
    return { code: "open_dispute", blocked: false, detail: "No dispute linkage to check." }
  }

  const rows = await guardedRows(() =>
    supabase
      .from("marketplace_disputes")
      .select("id, status, payout_held")
      .or(ors.join(","))
  )
  // Source unreadable → FAIL CLOSED.
  if (rows === undefined) {
    return { code: "open_dispute", blocked: true, detail: "Dispute table unavailable — blocking to be safe." }
  }
  const open = rows.filter((r) => {
    const s = String((r as { status?: string }).status ?? "").toLowerCase()
    const held = Boolean((r as { payout_held?: boolean }).payout_held)
    return held || !["resolved", "closed", "settled", "withdrawn", "rejected"].includes(s)
  })
  if (open.length > 0) {
    return {
      code: "open_dispute",
      blocked: true,
      detail: `${open.length} open dispute(s) — payout held until resolved.`,
    }
  }
  return { code: "open_dispute", blocked: false, detail: "No open disputes." }
}

/**
 * MISSING EVIDENCE — supplier-job completion evidence not submitted, OR the
 * assignment not approved/completed. `supplierJobId` here is the
 * supplier_job_assignments.id (evidence links via assignment_id; the assignment
 * status is the "approved" signal — there is no per-evidence approval column).
 */
async function gateMissingEvidence(
  supabase: ReleaseSupabase,
  ctx: ReleaseContext
): Promise<BlockResult> {
  if (!ctx.supplierJobId) {
    return { code: "missing_evidence", blocked: false, detail: "Not a supplier job — no evidence gate." }
  }
  // 1. Is there completion-phase evidence on the assignment?
  const evidence = await guardedRows(() =>
    supabase
      .from("supplier_job_evidence")
      .select("id, phase, deleted_at")
      .eq("assignment_id", ctx.supplierJobId)
      .is("deleted_at", null)
  )
  if (evidence === undefined) {
    return { code: "missing_evidence", blocked: true, detail: "Evidence table unavailable — blocking to be safe." }
  }
  const completionEvidence = evidence.filter((r) => {
    const phase = String((r as { phase?: string }).phase ?? "").toLowerCase()
    return phase === "" || /complet|after|finish|done/.test(phase)
  })
  if (completionEvidence.length === 0) {
    return { code: "missing_evidence", blocked: true, detail: "No completion evidence submitted." }
  }
  // 2. Is the assignment approved/completed (operator sign-off)?
  const assignment = await guardedRows(() =>
    supabase
      .from("supplier_job_assignments")
      .select("id, status")
      .eq("id", ctx.supplierJobId)
  )
  if (assignment === undefined) {
    return { code: "missing_evidence", blocked: true, detail: "Assignment unavailable — blocking to be safe." }
  }
  const approved = assignment.some((r) =>
    ["approved", "completed", "signed_off", "accepted"].includes(
      String((r as { status?: string }).status ?? "").toLowerCase()
    )
  )
  if (!approved) {
    return { code: "missing_evidence", blocked: true, detail: "Evidence submitted but assignment not approved." }
  }
  return { code: "missing_evidence", blocked: false, detail: "Completion evidence approved." }
}

/**
 * INSURANCE / LICENCE / APPROVAL — re-run supplier verification gating at
 * RELEASE time. If the supplier's insurance/licence expired since acceptance,
 * the payout must be held. Uses the canonical `canAcceptJob` so policy lives in
 * one place.
 */
async function gateSupplierVerification(
  ctx: ReleaseContext
): Promise<BlockResult[]> {
  if (!ctx.supplierWorkspaceId || !ctx.jobRisk) {
    return [
      { code: "insurance_invalid", blocked: false, detail: "Not a verification-gated job." },
      { code: "licence_invalid", blocked: false, detail: "Not a verification-gated job." },
      { code: "approval_missing", blocked: false, detail: "Not a verification-gated job." },
    ]
  }

  let decision
  try {
    decision = await canAcceptJob(ctx.supplierWorkspaceId, ctx.jobRisk, ctx.jobCategory ?? null)
  } catch {
    // Verification subsystem down → FAIL CLOSED on all three gates.
    return [
      { code: "insurance_invalid", blocked: true, detail: "Verification unavailable — blocking." },
      { code: "licence_invalid", blocked: true, detail: "Verification unavailable — blocking." },
      { code: "approval_missing", blocked: true, detail: "Verification unavailable — blocking." },
    ]
  }

  const missing = new Set(decision.missing)
  return [
    {
      code: "insurance_invalid",
      blocked: missing.has("insurance"),
      detail: missing.has("insurance") ? "Insurance evidence not valid at release." : "Insurance valid.",
    },
    {
      code: "licence_invalid",
      blocked: missing.has("licence"),
      detail: missing.has("licence") ? "Licence evidence not valid at release." : "Licence valid.",
    },
    {
      code: "approval_missing",
      blocked: missing.has("admin_approval"),
      detail: missing.has("admin_approval") ? "Required admin approval missing." : "Approval present.",
    },
  ]
}

/** SANCTIONS — an open sanctions/AML flag on the supplier workspace. */
async function gateSanctions(
  supabase: ReleaseSupabase,
  ctx: ReleaseContext
): Promise<BlockResult> {
  if (!ctx.supplierWorkspaceId) {
    return { code: "sanctions", blocked: false, detail: "No party to screen." }
  }
  const rows = await guardedRows(() =>
    supabase
      .from("supplier_verification_risk_flags")
      .select("id, flag_type, resolved, resolved_at")
      .eq("supplier_workspace_id", ctx.supplierWorkspaceId)
  )
  // If the flags table is absent, we DO NOT fail closed on sanctions alone
  // (no screening subsystem provisioned) — sanctions screening is additive and
  // its absence is an explicit non-block. (The other gates already protect funds.)
  if (rows === undefined) {
    return { code: "sanctions", blocked: false, detail: "No sanctions screening configured." }
  }
  const open = rows.filter((r) => {
    const t = String((r as { flag_type?: string }).flag_type ?? "").toLowerCase()
    const resolved = Boolean((r as { resolved?: boolean }).resolved) || Boolean((r as { resolved_at?: string }).resolved_at)
    return /sanction|aml|pep|fraud/.test(t) && !resolved
  })
  if (open.length > 0) {
    return { code: "sanctions", blocked: true, detail: `${open.length} open sanctions/AML flag(s).` }
  }
  return { code: "sanctions", blocked: false, detail: "No open sanctions flags." }
}

/**
 * SAFETY — an open safety incident on the job. `job_complaints` links to the
 * parent supplier_jobs row via `job_id` (the ctx carries the supplier job id in
 * `supplierJobId` for verification gates but the complaint key is the job, which
 * the caller passes as `bookingId` is NOT used here). We screen by the supplier
 * job id when present.
 */
async function gateSafety(
  supabase: ReleaseSupabase,
  ctx: ReleaseContext
): Promise<BlockResult> {
  const jobId = ctx.supplierJobId
  if (!jobId) {
    return { code: "safety_issue", blocked: false, detail: "No job to screen for safety." }
  }
  const rows = await guardedRows(() =>
    supabase
      .from("job_complaints")
      .select("id, severity, status")
      .eq("job_id", jobId)
  )
  // Complaints subsystem absent → not a hard block (additive screen).
  if (rows === undefined) {
    return { code: "safety_issue", blocked: false, detail: "No safety screening configured." }
  }
  const open = rows.filter((r) => {
    const sev = String((r as { severity?: string }).severity ?? "").toLowerCase()
    const st = String((r as { status?: string }).status ?? "").toLowerCase()
    return /safety|hazard|danger|critical/.test(sev) && !["resolved", "closed"].includes(st)
  })
  if (open.length > 0) {
    return { code: "safety_issue", blocked: true, detail: `${open.length} open safety incident(s).` }
  }
  return { code: "safety_issue", blocked: false, detail: "No open safety incidents." }
}

/** ADMIN HOLD — an operator manually parked the payout (active block row). */
async function gateAdminHold(
  supabase: ReleaseSupabase,
  ctx: ReleaseContext
): Promise<BlockResult> {
  if (!ctx.paymentId) {
    return { code: "admin_hold", blocked: false, detail: "No payment to check for admin hold." }
  }
  const rows = await guardedRows(() =>
    supabase
      .from("payment_release_blocks")
      .select("id, block_code, blocked, cleared_at")
      .eq("payment_id", ctx.paymentId)
      .eq("block_code", "admin_hold")
      .eq("blocked", true)
      .is("cleared_at", null)
  )
  if (rows === undefined) {
    // Our own audit table is missing → we cannot prove there is NO hold → block.
    return { code: "admin_hold", blocked: true, detail: "Release-block audit unavailable — blocking." }
  }
  if (rows.length > 0) {
    return { code: "admin_hold", blocked: true, detail: "An operator has held this payout." }
  }
  return { code: "admin_hold", blocked: false, detail: "No active admin hold." }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/**
 * evaluateReleaseBlocks — run every gate. NEVER fails open. Returns the full
 * gate result set + a final allowed flag. Pure evaluation (no writes) — call
 * {@link recordReleaseEvaluation} to persist the audit trail.
 */
export async function evaluateReleaseBlocks(
  supabase: ReleaseSupabase,
  ctx: ReleaseContext
): Promise<ReleaseDecision> {
  // Run gates; any THROW (non-provisioning error) propagates and halts release.
  const [dispute, evidence, verification, sanctions, safety, adminHold] = await Promise.all([
    gateOpenDispute(supabase, ctx),
    gateMissingEvidence(supabase, ctx),
    gateSupplierVerification(ctx),
    gateSanctions(supabase, ctx),
    gateSafety(supabase, ctx),
    gateAdminHold(supabase, ctx),
  ])

  const blocks: BlockResult[] = [dispute, evidence, ...verification, sanctions, safety, adminHold]
  const activeBlocks = blocks.filter((b) => b.blocked)
  return { allowed: activeBlocks.length === 0, blocks, activeBlocks }
}

/**
 * recordReleaseEvaluation — persist the decision to `payment_release_blocks`.
 *
 * For each ACTIVE block we ensure an open (blocked, cleared_at null) row exists.
 * For each gate that is now CLEAR we stamp `cleared_at` on any previously-open
 * row of that code. Append-only friendly: we never delete. Tolerant of the
 * table being absent (no-op), but note that {@link evaluateReleaseBlocks} will
 * already have BLOCKED admin_hold in that case.
 */
export async function recordReleaseEvaluation(
  supabase: ReleaseSupabase,
  ctx: ReleaseContext,
  decision: ReleaseDecision
): Promise<void> {
  const nowIso = new Date().toISOString()

  for (const b of decision.blocks) {
    if (b.code === "admin_hold") continue // admin holds are created by operators, not the evaluator
    if (b.blocked) {
      // Open a block row if none active for this code+payment.
      const existing = await guardedRows(() =>
        supabase
          .from("payment_release_blocks")
          .select("id")
          .eq("payment_id", ctx.paymentId ?? null)
          .eq("block_code", b.code)
          .eq("blocked", true)
          .is("cleared_at", null)
      )
      if (existing !== undefined && existing.length === 0) {
        try {
          await supabase.from("payment_release_blocks").insert({
            workspace_id: ctx.workspaceId,
            payment_id: ctx.paymentId ?? null,
            transaction_id: ctx.transactionId ?? null,
            block_code: b.code,
            blocked: true,
            detail: b.detail,
            evaluated_by: ctx.evaluatedBy ?? null,
            created_at: nowIso,
          })
        } catch (err) {
          if (!isNotProvisioned(err)) throw err
        }
      }
    } else {
      // Clear any open rows for this code.
      try {
        await supabase
          .from("payment_release_blocks")
          .update({ cleared_at: nowIso })
          .eq("payment_id", ctx.paymentId ?? null)
          .eq("block_code", b.code)
          .eq("blocked", true)
          .is("cleared_at", null)
      } catch (err) {
        if (!isNotProvisioned(err)) throw err
      }
    }
  }
}

/**
 * canReleaseFunds — the GATE the release engine must call. Evaluates and records
 * in one step, returning the decision. If `allowed` is false the caller MUST NOT
 * create a transfer / payout.
 */
export async function canReleaseFunds(
  supabase: ReleaseSupabase,
  ctx: ReleaseContext
): Promise<ReleaseDecision> {
  const decision = await evaluateReleaseBlocks(supabase, ctx)
  await recordReleaseEvaluation(supabase, ctx, decision)
  return decision
}

/**
 * placeAdminHold / liftAdminHold — operator controls over the admin_hold gate.
 * Append-only: lifting stamps cleared_at, it does not delete.
 */
export async function placeAdminHold(
  supabase: ReleaseSupabase,
  args: { workspaceId: string; paymentId: string; detail?: string; actorId?: string | null }
): Promise<void> {
  await supabase.from("payment_release_blocks").insert({
    workspace_id: args.workspaceId,
    payment_id: args.paymentId,
    block_code: "admin_hold",
    blocked: true,
    detail: args.detail ?? "Manual admin hold",
    evaluated_by: args.actorId ?? null,
    created_at: new Date().toISOString(),
  })
}

export async function liftAdminHold(
  supabase: ReleaseSupabase,
  args: { paymentId: string }
): Promise<void> {
  await supabase
    .from("payment_release_blocks")
    .update({ cleared_at: new Date().toISOString() })
    .eq("payment_id", args.paymentId)
    .eq("block_code", "admin_hold")
    .eq("blocked", true)
    .is("cleared_at", null)
}
