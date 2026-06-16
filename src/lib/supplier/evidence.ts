import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier JOB EVIDENCE + EVENTS data layer (P3 deep).
//
// Backed by the new `supplier_job_evidence` (before/during/after R2-backed
// evidence on a job assignment) and `supplier_job_events` (append-only audit log
// of state transitions + notes). RLS scopes both to members of either side of
// the assignment. 42P01/PGRST205-tolerant.
// ============================================================================

export type EvidencePhase = "before" | "during" | "after"

export interface JobEvidence {
  id: string
  assignment_id: string
  supplier_workspace_id: string
  phase: EvidencePhase
  r2_key: string
  file_name: string | null
  content_type: string | null
  size_bytes: number | null
  caption: string | null
  uploaded_by: string | null
  created_at: string
  deleted_at: string | null
}

export interface JobEvent {
  id: string
  assignment_id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  note: string | null
  actor_user_id: string | null
  actor_side: string | null
  metadata: Record<string, unknown>
  created_at: string
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703" || c === "PGRST205"
}

// ── Evidence ────────────────────────────────────────────────────────────────

const EV_COLS =
  "id, assignment_id, supplier_workspace_id, phase, r2_key, file_name, " +
  "content_type, size_bytes, caption, uploaded_by, created_at, deleted_at"

/** List (non-deleted) evidence for an assignment, newest first. */
export async function listEvidence(
  supabase: SupabaseClient,
  assignmentId: string
): Promise<JobEvidence[]> {
  if (!assignmentId) return []
  try {
    const { data, error } = await supabase
      .from("supplier_job_evidence")
      .select(EV_COLS)
      .eq("assignment_id", assignmentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as JobEvidence[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Record a piece of evidence (after the file has been uploaded to R2). */
export async function addEvidence(
  supabase: SupabaseClient,
  params: {
    assignmentId: string
    supplierWorkspaceId: string
    phase: EvidencePhase
    r2Key: string
    fileName?: string | null
    contentType?: string | null
    sizeBytes?: number | null
    caption?: string | null
    uploadedBy?: string | null
  }
): Promise<JobEvidence | null> {
  try {
    const { data, error } = await supabase
      .from("supplier_job_evidence")
      .insert({
        assignment_id: params.assignmentId,
        supplier_workspace_id: params.supplierWorkspaceId,
        phase: params.phase,
        r2_key: params.r2Key,
        file_name: params.fileName ?? null,
        content_type: params.contentType ?? null,
        size_bytes: params.sizeBytes ?? null,
        caption: params.caption ?? null,
        uploaded_by: params.uploadedBy ?? null,
      })
      .select(EV_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as JobEvidence | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Soft-delete a piece of evidence (scoped to the supplier workspace). */
export async function removeEvidence(
  supabase: SupabaseClient,
  workspaceId: string,
  evidenceId: string
): Promise<boolean> {
  if (!workspaceId || !evidenceId) return false
  try {
    const { error } = await supabase
      .from("supplier_job_evidence")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", evidenceId)
      .eq("supplier_workspace_id", workspaceId)
    if (error) {
      if (tolerable(error)) return false
      throw error
    }
    return true
  } catch (e) {
    if (tolerable(e)) return false
    throw e
  }
}

// ── Events (audit log) ────────────────────────────────────────────────────────

const EVT_COLS =
  "id, assignment_id, event_type, from_status, to_status, note, " +
  "actor_user_id, actor_side, metadata, created_at"

/** List the recorded audit events for an assignment, newest first. */
export async function listJobEvents(
  supabase: SupabaseClient,
  assignmentId: string
): Promise<JobEvent[]> {
  if (!assignmentId) return []
  try {
    const { data, error } = await supabase
      .from("supplier_job_events")
      .select(EVT_COLS)
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as JobEvent[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Append an audit event. Best-effort: never throws on a missing table. */
export async function recordJobEvent(
  supabase: SupabaseClient,
  params: {
    assignmentId: string
    eventType?: string
    fromStatus?: string | null
    toStatus?: string | null
    note?: string | null
    actorUserId?: string | null
    actorSide?: "operator" | "supplier" | "system" | null
    metadata?: Record<string, unknown>
  }
): Promise<JobEvent | null> {
  try {
    const { data, error } = await supabase
      .from("supplier_job_events")
      .insert({
        assignment_id: params.assignmentId,
        event_type: params.eventType ?? "status",
        from_status: params.fromStatus ?? null,
        to_status: params.toStatus ?? null,
        note: params.note ?? null,
        actor_user_id: params.actorUserId ?? null,
        actor_side: params.actorSide ?? null,
        metadata: params.metadata ?? {},
      })
      .select(EVT_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as JobEvent | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}
