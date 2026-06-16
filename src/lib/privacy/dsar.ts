import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * ============================================================================
 * PRIVACY / DSAR engine — data layer.
 * ============================================================================
 * Workspace-scoped privacy (data subject access) requests and the breach
 * incident clock. The due dates are computed from the workspace's resolved
 * privacy regime (dsar_response_days / breach_notify_hours) — for an unreviewed
 * country these fall back to a conservative GDPR-style clock, and the surface
 * makes clear the regime is not reviewed.
 *
 * All reads/writes are RLS-scoped (workspace membership) and 42P01-tolerant.
 * ============================================================================
 */

export type PrivacyRequestType =
  | "access" | "erasure" | "rectification" | "portability" | "objection" | "restriction"

export type PrivacyRequestStatus =
  | "received" | "identity_check" | "in_progress" | "extended" | "fulfilled" | "refused" | "withdrawn"

export interface PrivacyRequest {
  id: string
  workspaceId: string | null
  countryCode: string | null
  regime: string | null
  requestType: PrivacyRequestType
  status: PrivacyRequestStatus
  subjectName: string | null
  subjectEmail: string | null
  receivedAt: string
  dueAt: string | null
  fulfilledAt: string | null
  notes: string | null
}

function mapRequest(r: Record<string, unknown>): PrivacyRequest {
  return {
    id: String(r.id),
    workspaceId: (r.workspace_id as string | null) ?? null,
    countryCode: (r.country_code as string | null) ?? null,
    regime: (r.regime as string | null) ?? null,
    requestType: (r.request_type as PrivacyRequestType) ?? "access",
    status: (r.status as PrivacyRequestStatus) ?? "received",
    subjectName: (r.subject_name as string | null) ?? null,
    subjectEmail: (r.subject_email as string | null) ?? null,
    receivedAt: String(r.received_at ?? r.created_at ?? new Date().toISOString()),
    dueAt: (r.due_at as string | null) ?? null,
    fulfilledAt: (r.fulfilled_at as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
  }
}

export async function listPrivacyRequests(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<PrivacyRequest[]> {
  try {
    const { data, error } = await supabase
      .from("privacy_requests")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("received_at", { ascending: false })
    if (error) return []
    return ((data as Record<string, unknown>[]) ?? []).map(mapRequest)
  } catch {
    return []
  }
}

export interface CreatePrivacyRequestInput {
  workspaceId: string
  countryCode: string
  regime: string
  dsarResponseDays: number | null
  requestType: PrivacyRequestType
  subjectName?: string
  subjectEmail?: string
  notes?: string
}

/** Create a DSAR with the due date computed from the regime's response window. */
export async function createPrivacyRequest(
  supabase: SupabaseClient,
  input: CreatePrivacyRequestInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const days = input.dsarResponseDays ?? 30 // conservative GDPR-style default
  const due = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  try {
    const { data, error } = await supabase
      .from("privacy_requests")
      .insert({
        workspace_id: input.workspaceId,
        country_code: input.countryCode,
        regime: input.regime,
        request_type: input.requestType,
        status: "received",
        subject_name: input.subjectName ?? null,
        subject_email: input.subjectEmail ?? null,
        due_at: due,
        notes: input.notes ?? null,
      })
      .select("id")
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id as string | undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updatePrivacyRequestStatus(
  supabase: SupabaseClient,
  id: string,
  status: PrivacyRequestStatus
): Promise<{ ok: boolean; error?: string }> {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === "fulfilled") patch.fulfilled_at = new Date().toISOString()
  try {
    const { error } = await supabase.from("privacy_requests").update(patch).eq("id", id)
    if (error) return { ok: false, error: error.message }
    // Best-effort event trail.
    await supabase.from("privacy_request_events").insert({
      request_id: id,
      event_type: `status.${status}`,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Breach clock ────────────────────────────────────────────────────────────

export interface BreachClock {
  id: string
  workspaceId: string | null
  countryCode: string | null
  title: string
  state: string
  discoveredAt: string
  authorityDueAt: string | null
  severity: string
}

export async function listBreachClocks(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<BreachClock[]> {
  try {
    const { data, error } = await supabase
      .from("breach_incident_clocks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("discovered_at", { ascending: false })
    if (error) return []
    return ((data as Record<string, unknown>[]) ?? []).map((r) => ({
      id: String(r.id),
      workspaceId: (r.workspace_id as string | null) ?? null,
      countryCode: (r.country_code as string | null) ?? null,
      title: String(r.title ?? "Breach incident"),
      state: String(r.state ?? "open"),
      discoveredAt: String(r.discovered_at ?? new Date().toISOString()),
      authorityDueAt: (r.authority_due_at as string | null) ?? null,
      severity: String(r.severity ?? "medium"),
    }))
  } catch {
    return []
  }
}

export async function createBreachClock(
  supabase: SupabaseClient,
  input: {
    workspaceId: string
    countryCode: string
    regime: string
    title: string
    notifyWithinHours: number | null
    severity?: string
    description?: string
  }
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const hours = input.notifyWithinHours ?? 72 // GDPR default
  const due = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
  try {
    const { data, error } = await supabase
      .from("breach_incident_clocks")
      .insert({
        workspace_id: input.workspaceId,
        country_code: input.countryCode,
        regime: input.regime,
        title: input.title,
        state: "open",
        notify_within_hours: hours,
        authority_due_at: due,
        severity: input.severity ?? "medium",
        description: input.description ?? null,
      })
      .select("id")
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id as string | undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
