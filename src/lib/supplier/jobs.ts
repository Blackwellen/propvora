// ============================================================================
// Supplier JOB ASSIGNMENTS data layer (P3).
//
// A `supplier_job_assignment` is a unit of work an operator workspace assigns to
// a supplier workspace, optionally spawned from an accepted quote and optionally
// linked to an existing operator-side `jobs` row (interop, not duplication).
//
// State machine:
//   assigned → accepted → in_progress → completed
//   (assigned|accepted|in_progress) → cancelled
//
// `transitionJob` validates each move; `completeJob` is the only way to reach
// 'completed' and stamps `completed_at` — completion is never claimed without a
// write. RLS is the real boundary; the API enforces which SIDE may make a given
// move. 42P01/PGRST205-tolerant.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export const NOT_PROVISIONED = new Set(["42P01", "PGRST205"])

export type JobStatus =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"

export interface SupplierJobAssignment {
  id: string
  quote_id: string | null
  operator_workspace_id: string
  supplier_workspace_id: string
  job_id: string | null
  status: JobStatus
  scheduled_for: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

/** Allowed forward transitions for the assignment state machine. */
const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  assigned: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

function isMissingTable(err: { code?: string } | null | undefined): boolean {
  return Boolean(err?.code && NOT_PROVISIONED.has(err.code))
}

/**
 * List job assignments touching `workspaceId` on the chosen side. RLS additionally
 * caps visibility to workspaces the caller belongs to.
 */
export async function listSupplierJobs(
  supabase: SupabaseClient,
  workspaceId: string,
  side: "operator" | "supplier",
  opts?: { status?: JobStatus }
): Promise<SupplierJobAssignment[]> {
  const column =
    side === "operator" ? "operator_workspace_id" : "supplier_workspace_id"
  let query = supabase
    .from("supplier_job_assignments")
    .select("*")
    .eq(column, workspaceId)
  if (opts?.status) query = query.eq("status", opts.status)

  const { data, error } = await query.order("created_at", { ascending: false })
  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data as SupplierJobAssignment[]) ?? []
}

/** Load a single assignment by id (RLS-scoped). */
export async function getSupplierJob(
  supabase: SupabaseClient,
  assignmentId: string
): Promise<SupplierJobAssignment | null> {
  const { data, error } = await supabase
    .from("supplier_job_assignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return (data as SupplierJobAssignment) ?? null
}

/** Result of an attempted transition. */
export type TransitionResult =
  | { ok: true; job: SupplierJobAssignment }
  | { ok: false; reason: "not_found" | "invalid_transition" | "not_provisioned" }

/**
 * Validate and apply a state-machine transition. Loads the current row, checks
 * the move is legal, then writes guarded by the current status (so a concurrent
 * change can't be overwritten). `completed` is rejected here — use completeJob.
 */
export async function transitionJob(
  supabase: SupabaseClient,
  assignmentId: string,
  to: JobStatus,
  opts?: { scheduledFor?: string | null }
): Promise<TransitionResult> {
  if (to === "completed") {
    // Force the completion path through completeJob (stamps completed_at).
    return { ok: false, reason: "invalid_transition" }
  }

  const current = await getSupplierJob(supabase, assignmentId)
  if (current === null) {
    // Disambiguate genuine 404 from unprovisioned table.
    const { error } = await supabase
      .from("supplier_job_assignments")
      .select("id")
      .limit(1)
    if (error && isMissingTable(error)) return { ok: false, reason: "not_provisioned" }
    return { ok: false, reason: "not_found" }
  }
  if (!canTransition(current.status, to)) {
    return { ok: false, reason: "invalid_transition" }
  }

  const patch: Record<string, unknown> = { status: to }
  if (opts?.scheduledFor !== undefined) patch.scheduled_for = opts.scheduledFor

  const { data, error } = await supabase
    .from("supplier_job_assignments")
    .update(patch)
    .eq("id", assignmentId)
    .eq("status", current.status)
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return { ok: false, reason: "not_provisioned" }
    throw error
  }
  if (!data) return { ok: false, reason: "invalid_transition" }
  return { ok: true, job: data as SupplierJobAssignment }
}

/**
 * Supplier marks a job complete (in_progress → completed). Stamps completed_at
 * server-side. Guarded on the current status so completion is only ever reached
 * via a real, successful write.
 */
export async function completeJob(
  supabase: SupabaseClient,
  assignmentId: string
): Promise<TransitionResult> {
  const current = await getSupplierJob(supabase, assignmentId)
  if (current === null) {
    const { error } = await supabase
      .from("supplier_job_assignments")
      .select("id")
      .limit(1)
    if (error && isMissingTable(error)) return { ok: false, reason: "not_provisioned" }
    return { ok: false, reason: "not_found" }
  }
  if (!canTransition(current.status, "completed")) {
    return { ok: false, reason: "invalid_transition" }
  }

  const { data, error } = await supabase
    .from("supplier_job_assignments")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("status", "in_progress")
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return { ok: false, reason: "not_provisioned" }
    throw error
  }
  if (!data) return { ok: false, reason: "invalid_transition" }
  return { ok: true, job: data as SupplierJobAssignment }
}
