// ============================================================================
// Marketplace dispute engine — typed, workspace-scoped data layer over
// `marketplace_disputes` (P2 trust substrate).
//
// EVERYTHING here is workspace-scoped and 42P01-tolerant: a missing table never
// throws — operations return { data, error } instead. RLS in the DB is the real
// isolation boundary (either party's workspace members may read; the raiser may
// write; resolution authority is the can_resolve_dispute helper).
//
// SAFETY (hard rule): dispute RESOLUTION is an explicit admin action. We NEVER
// report a resolution as completed unless the DB write actually succeeded:
//   1. authorisation is checked via the DB helper `can_resolve_dispute`
//      (SECURITY DEFINER, defined in 20260616010000_v2_foundation.sql);
//   2. the status/resolution update is performed and its row returned;
//   3. only on a confirmed write do we record an audit entry and return success.
// If the caller is not authorised, or the write affected no row, we return an
// error and write nothing.
//
// NO feature flags — gating is entitlement + workspace type at the caller.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { recordAudit } from "@/lib/audit/log"

/** Dispute lifecycle states (mirrors the DB CHECK). */
export type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "rejected"
  | "escalated"

/** A marketplace dispute row. */
export interface MarketplaceDispute {
  id: string
  transaction_id: string | null
  raised_by_workspace_id: string
  against_workspace_id: string | null
  reason: string | null
  detail: string | null
  status: DisputeStatus
  resolution: string | null
  assigned_admin: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

/** Uniform tolerant result. `error` is a short code/message, never a throw. */
export interface Result<T> {
  data: T | null
  error: string | null
}

const DISPUTE_COLUMNS =
  "id, transaction_id, raised_by_workspace_id, against_workspace_id, reason, " +
  "detail, status, resolution, assigned_admin, resolved_at, created_at, updated_at"

/**
 * Allowed status transitions. Terminal states ('resolved','rejected') have no
 * outgoing transitions. 'escalated' may only be resolved/rejected by an admin.
 */
const ALLOWED_TRANSITIONS: Record<DisputeStatus, DisputeStatus[]> = {
  open: ["under_review", "escalated", "rejected", "resolved"],
  under_review: ["escalated", "rejected", "resolved", "open"],
  escalated: ["resolved", "rejected", "under_review"],
  resolved: [],
  rejected: [],
}

function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

function toMessage(err: unknown): string {
  if (isMissingTable(err)) return "marketplace_unavailable"
  const e = err as { message?: string } | null
  return e?.message ?? "marketplace_error"
}

/** Fields a caller may set when opening a dispute. */
export interface OpenDisputeInput {
  reason: string
  detail?: string | null
  transactionId?: string | null
  /** The counterparty workspace, if known. */
  againstWorkspaceId?: string | null
}

/**
 * Open a dispute raised BY `raisedByWorkspaceId`. RLS only permits inserting a
 * row whose raiser matches the acting member's workspace. Tolerant.
 */
export async function openDispute(
  supabase: SupabaseClient,
  raisedByWorkspaceId: string,
  input: OpenDisputeInput
): Promise<Result<MarketplaceDispute>> {
  if (!raisedByWorkspaceId) return { data: null, error: "workspace_required" }
  if (!input.reason?.trim()) return { data: null, error: "reason_required" }
  try {
    const row = {
      raised_by_workspace_id: raisedByWorkspaceId,
      against_workspace_id: input.againstWorkspaceId ?? null,
      transaction_id: input.transactionId ?? null,
      reason: input.reason.trim(),
      detail: input.detail ?? null,
      status: "open" as DisputeStatus,
    }
    const { data, error } = await supabase
      .from("marketplace_disputes")
      .insert(row)
      .select(DISPUTE_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as unknown as MarketplaceDispute, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/** Options for {@link listDisputes}. */
export interface ListDisputesOptions {
  status?: DisputeStatus
  /**
   * Which side to list. 'raised' = disputes this workspace raised; 'against' =
   * disputes filed against it; 'either' (default) = both.
   */
  side?: "raised" | "against" | "either"
  limit?: number
  offset?: number
}

/**
 * List disputes visible to `workspaceId` (as raiser and/or respondent). Admins
 * see disputes through RLS too, but this query is workspace-scoped; an admin
 * console would query without the workspace filter under its own RLS grant.
 * Tolerant → [] on failure.
 */
export async function listDisputes(
  supabase: SupabaseClient,
  workspaceId: string,
  options: ListDisputesOptions = {}
): Promise<Result<MarketplaceDispute[]>> {
  if (!workspaceId) return { data: [], error: "workspace_required" }
  try {
    let query = supabase
      .from("marketplace_disputes")
      .select(DISPUTE_COLUMNS)
      .order("created_at", { ascending: false })

    const side = options.side ?? "either"
    if (side === "raised") query = query.eq("raised_by_workspace_id", workspaceId)
    else if (side === "against") query = query.eq("against_workspace_id", workspaceId)
    else
      query = query.or(
        `raised_by_workspace_id.eq.${workspaceId},against_workspace_id.eq.${workspaceId}`
      )

    if (options.status) query = query.eq("status", options.status)

    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200)
    const offset = Math.max(options.offset ?? 0, 0)
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) {
      if (isMissingTable(error)) return { data: [], error: null }
      return { data: [], error: toMessage(error) }
    }
    return { data: (data as unknown as MarketplaceDispute[]) ?? [], error: null }
  } catch (err) {
    if (isMissingTable(err)) return { data: [], error: null }
    return { data: [], error: toMessage(err) }
  }
}

/** True if a transition from `from` → `to` is permitted. */
export function isAllowedDisputeTransition(
  from: DisputeStatus,
  to: DisputeStatus
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Move a dispute to a new status, validating the transition first. Does NOT
 * grant resolution authority on its own — moving to 'resolved'/'rejected'
 * SHOULD go through {@link resolveDispute} (which checks the admin helper).
 * This helper is for non-terminal moves (e.g. open → under_review). It refuses
 * to set a terminal status here to avoid bypassing the authorisation check.
 * Tolerant.
 */
export async function transitionDispute(
  supabase: SupabaseClient,
  disputeId: string,
  toStatus: DisputeStatus
): Promise<Result<MarketplaceDispute>> {
  if (!disputeId) return { data: null, error: "dispute_required" }
  if (toStatus === "resolved" || toStatus === "rejected")
    return { data: null, error: "use_resolve_dispute" }
  try {
    const { data: current, error: readErr } = await supabase
      .from("marketplace_disputes")
      .select("id, status")
      .eq("id", disputeId)
      .maybeSingle()
    if (readErr) return { data: null, error: toMessage(readErr) }
    if (!current) return { data: null, error: "dispute_not_found" }

    const from = (current as { status: DisputeStatus }).status
    if (!isAllowedDisputeTransition(from, toStatus))
      return { data: null, error: "invalid_transition" }

    const { data, error } = await supabase
      .from("marketplace_disputes")
      .update({ status: toStatus })
      .eq("id", disputeId)
      .select(DISPUTE_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as unknown as MarketplaceDispute, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/** Input for {@link resolveDispute}. */
export interface ResolveDisputeInput {
  /** The acting admin user id (checked against can_resolve_dispute). */
  adminUserId: string
  /** 'resolved' (upheld/settled) or 'rejected' (dismissed). */
  outcome: "resolved" | "rejected"
  /** Human-readable resolution note recorded on the dispute. */
  resolution: string
}

/**
 * Resolve a dispute — an EXPLICIT, AUTHORISED admin action.
 *
 * Order of operations (so we never claim a resolution that did not happen):
 *   1. Load the dispute (must exist, must not already be terminal).
 *   2. Authorise via the DB helper `can_resolve_dispute(user, raiser_ws)`.
 *   3. Write status + resolution + resolved_at + assigned_admin, returning row.
 *   4. ONLY on a confirmed write, record an audit entry and return success.
 *
 * Returns an error (and writes nothing) if unauthorised or if the write fails.
 * Tolerant: never throws.
 */
export async function resolveDispute(
  supabase: SupabaseClient,
  disputeId: string,
  input: ResolveDisputeInput
): Promise<Result<MarketplaceDispute>> {
  if (!disputeId) return { data: null, error: "dispute_required" }
  if (!input.adminUserId) return { data: null, error: "admin_required" }
  if (!input.resolution?.trim()) return { data: null, error: "resolution_required" }
  if (input.outcome !== "resolved" && input.outcome !== "rejected")
    return { data: null, error: "invalid_outcome" }

  try {
    // 1. Load the dispute.
    const { data: current, error: readErr } = await supabase
      .from("marketplace_disputes")
      .select("id, status, raised_by_workspace_id")
      .eq("id", disputeId)
      .maybeSingle()
    if (readErr) return { data: null, error: toMessage(readErr) }
    if (!current) return { data: null, error: "dispute_not_found" }

    const row = current as {
      status: DisputeStatus
      raised_by_workspace_id: string
    }
    if (row.status === "resolved" || row.status === "rejected")
      return { data: null, error: "already_resolved" }
    if (!isAllowedDisputeTransition(row.status, input.outcome))
      return { data: null, error: "invalid_transition" }

    // 2. Authorise via the DB SECURITY DEFINER helper. If we cannot positively
    //    confirm authorisation, refuse — never resolve on ambiguity.
    const { data: allowed, error: authErr } = await supabase.rpc(
      "can_resolve_dispute",
      { p_user: input.adminUserId, p_workspace: row.raised_by_workspace_id }
    )
    if (authErr) return { data: null, error: toMessage(authErr) }
    if (allowed !== true) return { data: null, error: "not_authorised" }

    // 3. Perform the write. RLS is also enforced; a no-op update returns no row.
    const { data, error } = await supabase
      .from("marketplace_disputes")
      .update({
        status: input.outcome,
        resolution: input.resolution.trim(),
        assigned_admin: input.adminUserId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", disputeId)
      .select(DISPUTE_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    if (!data) return { data: null, error: "resolution_failed" }

    const resolved = data as unknown as MarketplaceDispute

    // 4. Only now — write confirmed — record the audit trail (best-effort).
    await recordAudit(supabase, {
      workspaceId: resolved.raised_by_workspace_id,
      userId: input.adminUserId,
      action: "marketplace.dispute_resolved",
      resourceType: "marketplace_dispute",
      resourceId: resolved.id,
      metadata: { outcome: input.outcome },
    })

    return { data: resolved, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}
