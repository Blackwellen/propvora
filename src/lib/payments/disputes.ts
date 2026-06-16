import "server-only"

/**
 * P5+ — UNIFIED DISPUTES (stay / supplier / marketplace).
 *
 * `marketplace_disputes` now carries dispute_type, booking_id,
 * supplier_assignment_id, payment_id, amount_disputed_pence,
 * amount_refunded_pence, payout_held, priority, evidence_requested_at,
 * workspace_id (migration 20260617070000). Every admin action appends an
 * immutable `dispute_actions` row.
 *
 * Admin actions: request-evidence, hold-payout, release-partial, refund, settle,
 * suspend, escalate, close. Each:
 *   - mutates the dispute header (status / payout_held / amounts);
 *   - appends a dispute_actions audit row;
 *   - where it touches money, ties into release-blocks (hold/release) but NEVER
 *     fabricates a Stripe movement — refunds are recorded as intent + a hold
 *     deduction; the actual card refund is webhook-confirmed.
 *
 * Money is integer pence. dispute_actions is append-only (DB trigger).
 */

import { placeAdminHold, liftAdminHold } from "./release-blocks"

export interface DisputesSupabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export type DisputeType = "stay" | "supplier" | "marketplace"
export type DisputePriority = "low" | "normal" | "high" | "urgent"
export type DisputeActionType =
  | "opened"
  | "evidence_requested"
  | "evidence_submitted"
  | "payout_held"
  | "payout_released"
  | "partial_refund"
  | "full_refund"
  | "settled"
  | "suspended"
  | "escalated"
  | "closed"
  | "note"
  | "assigned"

export interface DisputeRecord {
  id: string
  dispute_type: DisputeType
  transaction_id: string | null
  booking_id: string | null
  supplier_assignment_id: string | null
  payment_id: string | null
  workspace_id: string | null
  raised_by_workspace_id: string | null
  against_workspace_id: string | null
  reason: string | null
  detail: string | null
  status: string
  resolution: string | null
  priority: DisputePriority
  payout_held: boolean
  amount_disputed_pence: number
  amount_refunded_pence: number
  evidence_requested_at: string | null
  assigned_admin: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface DisputeActionRow {
  id: string
  dispute_id: string
  action: DisputeActionType
  actor_id: string | null
  actor_role: string | null
  amount_pence: number
  detail: string | null
  metadata: Record<string, unknown>
  created_at: string
}

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703"])
function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

async function appendAction(
  supabase: DisputesSupabase,
  row: {
    disputeId: string
    action: DisputeActionType
    actorId?: string | null
    actorRole?: string | null
    amountPence?: number
    detail?: string | null
    metadata?: Record<string, unknown>
  }
): Promise<DisputeActionRow | null> {
  const { data, error } = await supabase
    .from("dispute_actions")
    .insert({
      dispute_id: row.disputeId,
      action: row.action,
      actor_id: row.actorId ?? null,
      actor_role: row.actorRole ?? null,
      amount_pence: Math.trunc(row.amountPence ?? 0),
      detail: row.detail ?? null,
      metadata: row.metadata ?? {},
    })
    .select("*")
    .single()
  if (error) {
    if (isNotProvisioned(error)) return null
    throw error
  }
  return data as DisputeActionRow
}

export interface OpenDisputeArgs {
  disputeType: DisputeType
  workspaceId: string
  raisedByWorkspaceId?: string | null
  againstWorkspaceId?: string | null
  paymentId?: string | null
  bookingId?: string | null
  transactionId?: string | null
  supplierAssignmentId?: string | null
  reason: string
  detail?: string | null
  amountDisputedPence?: number
  priority?: DisputePriority
  actorId?: string | null
}

/** openDispute — create a dispute (any type) + opening audit action. */
export async function openDispute(
  supabase: DisputesSupabase,
  args: OpenDisputeArgs
): Promise<DisputeRecord> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .insert({
      dispute_type: args.disputeType,
      workspace_id: args.workspaceId,
      raised_by_workspace_id: args.raisedByWorkspaceId ?? args.workspaceId,
      against_workspace_id: args.againstWorkspaceId ?? null,
      payment_id: args.paymentId ?? null,
      booking_id: args.bookingId ?? null,
      transaction_id: args.transactionId ?? null,
      supplier_assignment_id: args.supplierAssignmentId ?? null,
      reason: args.reason,
      detail: args.detail ?? null,
      status: "open",
      priority: args.priority ?? "normal",
      amount_disputed_pence: Math.max(0, Math.trunc(args.amountDisputedPence ?? 0)),
    })
    .select("*")
    .single()
  if (error) throw error
  const dispute = data as DisputeRecord
  await appendAction(supabase, {
    disputeId: dispute.id,
    action: "opened",
    actorId: args.actorId,
    detail: args.reason,
    amountPence: dispute.amount_disputed_pence,
  })
  return dispute
}

export interface AdminActionArgs {
  disputeId: string
  actorId?: string | null
  actorRole?: string | null
  detail?: string | null
  amountPence?: number
}

async function loadDispute(supabase: DisputesSupabase, id: string): Promise<DisputeRecord> {
  const { data, error } = await supabase.from("marketplace_disputes").select("*").eq("id", id).single()
  if (error) throw error
  return data as DisputeRecord
}

/** request-evidence — flag the dispute as awaiting evidence + stamp time. */
export async function requestEvidence(supabase: DisputesSupabase, args: AdminActionArgs): Promise<DisputeRecord> {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update({ status: "awaiting_evidence", evidence_requested_at: nowIso, updated_at: nowIso })
    .eq("id", args.disputeId)
    .select("*")
    .single()
  if (error) throw error
  await appendAction(supabase, { disputeId: args.disputeId, action: "evidence_requested", actorId: args.actorId, actorRole: args.actorRole, detail: args.detail })
  return data as DisputeRecord
}

/** hold-payout — set payout_held + place an admin_hold release block. */
export async function holdPayout(supabase: DisputesSupabase, args: AdminActionArgs): Promise<DisputeRecord> {
  const dispute = await loadDispute(supabase, args.disputeId)
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update({ payout_held: true, updated_at: new Date().toISOString() })
    .eq("id", args.disputeId)
    .select("*")
    .single()
  if (error) throw error
  if (dispute.payment_id && dispute.workspace_id) {
    try {
      await placeAdminHold(supabase, {
        workspaceId: dispute.workspace_id,
        paymentId: dispute.payment_id,
        detail: `Payout held for dispute ${dispute.id.slice(0, 8)}`,
        actorId: args.actorId,
      })
    } catch (err) {
      if (!isNotProvisioned(err)) throw err
    }
  }
  await appendAction(supabase, { disputeId: args.disputeId, action: "payout_held", actorId: args.actorId, actorRole: args.actorRole, detail: args.detail })
  return data as DisputeRecord
}

/** release-payout — clear payout_held + lift the admin_hold block. */
export async function releasePayout(supabase: DisputesSupabase, args: AdminActionArgs): Promise<DisputeRecord> {
  const dispute = await loadDispute(supabase, args.disputeId)
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update({ payout_held: false, updated_at: new Date().toISOString() })
    .eq("id", args.disputeId)
    .select("*")
    .single()
  if (error) throw error
  if (dispute.payment_id) {
    try {
      await liftAdminHold(supabase, { paymentId: dispute.payment_id })
    } catch (err) {
      if (!isNotProvisioned(err)) throw err
    }
  }
  await appendAction(supabase, { disputeId: args.disputeId, action: "payout_released", actorId: args.actorId, actorRole: args.actorRole, detail: args.detail })
  return data as DisputeRecord
}

/**
 * recordRefund — record a (partial or full) refund decision on the dispute.
 * Increments amount_refunded_pence; marks the dispute partial/full. This records
 * the DECISION + audit; the actual card refund is webhook-confirmed (and the
 * refunds module appends the reversal ledger entry on that event).
 */
export async function recordDisputeRefund(
  supabase: DisputesSupabase,
  args: AdminActionArgs & { partial: boolean }
): Promise<DisputeRecord> {
  const dispute = await loadDispute(supabase, args.disputeId)
  const add = Math.max(0, Math.trunc(args.amountPence ?? 0))
  const newRefunded = Math.max(0, Math.trunc(dispute.amount_refunded_pence)) + add
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update({
      amount_refunded_pence: newRefunded,
      status: args.partial ? "partially_refunded" : "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.disputeId)
    .select("*")
    .single()
  if (error) throw error
  await appendAction(supabase, {
    disputeId: args.disputeId,
    action: args.partial ? "partial_refund" : "full_refund",
    actorId: args.actorId,
    actorRole: args.actorRole,
    amountPence: add,
    detail: args.detail,
  })
  return data as DisputeRecord
}

/** settle — record a resolution and close the money side. */
export async function settleDispute(supabase: DisputesSupabase, args: AdminActionArgs & { resolution: string }): Promise<DisputeRecord> {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update({ status: "settled", resolution: args.resolution, payout_held: false, resolved_at: nowIso, updated_at: nowIso })
    .eq("id", args.disputeId)
    .select("*")
    .single()
  if (error) throw error
  const dispute = data as DisputeRecord
  if (dispute.payment_id) {
    try {
      await liftAdminHold(supabase, { paymentId: dispute.payment_id })
    } catch (err) {
      if (!isNotProvisioned(err)) throw err
    }
  }
  await appendAction(supabase, { disputeId: args.disputeId, action: "settled", actorId: args.actorId, actorRole: args.actorRole, detail: args.resolution })
  return dispute
}

/** suspend — pause the dispute (e.g. awaiting third party). */
export async function suspendDispute(supabase: DisputesSupabase, args: AdminActionArgs): Promise<DisputeRecord> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update({ status: "suspended", updated_at: new Date().toISOString() })
    .eq("id", args.disputeId)
    .select("*")
    .single()
  if (error) throw error
  await appendAction(supabase, { disputeId: args.disputeId, action: "suspended", actorId: args.actorId, actorRole: args.actorRole, detail: args.detail })
  return data as DisputeRecord
}

/** escalate — bump priority to urgent + audit. */
export async function escalateDispute(supabase: DisputesSupabase, args: AdminActionArgs): Promise<DisputeRecord> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update({ status: "escalated", priority: "urgent", updated_at: new Date().toISOString() })
    .eq("id", args.disputeId)
    .select("*")
    .single()
  if (error) throw error
  await appendAction(supabase, { disputeId: args.disputeId, action: "escalated", actorId: args.actorId, actorRole: args.actorRole, detail: args.detail })
  return data as DisputeRecord
}

/** close — terminal close (no money change). */
export async function closeDispute(supabase: DisputesSupabase, args: AdminActionArgs): Promise<DisputeRecord> {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update({ status: "closed", payout_held: false, resolved_at: nowIso, updated_at: nowIso })
    .eq("id", args.disputeId)
    .select("*")
    .single()
  if (error) throw error
  const dispute = data as DisputeRecord
  if (dispute.payment_id) {
    try {
      await liftAdminHold(supabase, { paymentId: dispute.payment_id })
    } catch (err) {
      if (!isNotProvisioned(err)) throw err
    }
  }
  await appendAction(supabase, { disputeId: args.disputeId, action: "closed", actorId: args.actorId, actorRole: args.actorRole, detail: args.detail })
  return dispute
}

/** assign — set the handling admin. */
export async function assignDispute(supabase: DisputesSupabase, args: AdminActionArgs & { adminId: string }): Promise<DisputeRecord> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update({ assigned_admin: args.adminId, updated_at: new Date().toISOString() })
    .eq("id", args.disputeId)
    .select("*")
    .single()
  if (error) throw error
  await appendAction(supabase, { disputeId: args.disputeId, action: "assigned", actorId: args.actorId, actorRole: args.actorRole, detail: args.detail })
  return data as DisputeRecord
}

/** addNote — free-form audit note (no state change). */
export async function addDisputeNote(supabase: DisputesSupabase, args: AdminActionArgs & { note: string }): Promise<DisputeActionRow | null> {
  return appendAction(supabase, { disputeId: args.disputeId, action: "note", actorId: args.actorId, actorRole: args.actorRole, detail: args.note })
}

/** Load a dispute + its action timeline. */
export async function getDisputeWithActions(
  supabase: DisputesSupabase,
  disputeId: string
): Promise<{ dispute: DisputeRecord | null; actions: DisputeActionRow[] }> {
  const { data: d } = await supabase.from("marketplace_disputes").select("*").eq("id", disputeId).maybeSingle()
  const { data: a } = await supabase
    .from("dispute_actions")
    .select("*")
    .eq("dispute_id", disputeId)
    .order("created_at", { ascending: true })
  return { dispute: (d as DisputeRecord | null) ?? null, actions: (a as DisputeActionRow[]) ?? [] }
}

/** List disputes for a workspace (raised-by or against), optional type/status. */
export async function listDisputes(
  supabase: DisputesSupabase,
  workspaceId: string,
  filters: { disputeType?: DisputeType; status?: string } = {}
): Promise<{ items: DisputeRecord[]; provisioned: boolean }> {
  try {
    let q = supabase
      .from("marketplace_disputes")
      .select("*")
      .or(`raised_by_workspace_id.eq.${workspaceId},against_workspace_id.eq.${workspaceId},workspace_id.eq.${workspaceId}`)
      .order("created_at", { ascending: false })
    if (filters.disputeType) q = q.eq("dispute_type", filters.disputeType)
    if (filters.status) q = q.eq("status", filters.status)
    const { data, error } = await q
    if (error) {
      if (isNotProvisioned(error)) return { items: [], provisioned: false }
      throw error
    }
    return { items: (data as DisputeRecord[]) ?? [], provisioned: true }
  } catch (err) {
    if (isNotProvisioned(err)) return { items: [], provisioned: false }
    throw err
  }
}
