// Automation Engine — APPROVALS, NODE-RUNS, RUN-EVENTS, ERRORS.
//
// The governance backbone for high-risk node execution. When the executor
// reaches a gated step (payment/legal/approval/blocked), it does NOT run it —
// it creates an approval object here and records the node-run as
// 'awaiting_approval' (or 'blocked'). A human approves/rejects later. Nothing
// in this file performs a payment, legal serve, or any destructive side-effect;
// it only records approval intent + the run timeline.
//
// All writes are workspace-scoped and tolerant (best-effort timeline writes
// never throw and abort a run).

import type { SupabaseClient } from "@supabase/supabase-js"
import { recordAudit } from "@/lib/audit/log"

const APPROVALS_TABLE = "automation_approvals"
const NODE_RUNS_TABLE = "automation_node_runs"
const RUN_EVENTS_TABLE = "automation_run_events"
const ERRORS_TABLE = "automation_errors"

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "escalated" | "cancelled"

export interface AutomationApproval {
  id: string
  workspace_id: string
  run_id: string | null
  definition_id: string | null
  node_key: string | null
  node_type: string
  category: string
  risk: string
  title: string
  summary: string | null
  payload: Record<string, unknown>
  status: ApprovalStatus
  requested_by: string | null
  decided_by: string | null
  decided_at: string | null
  decision_note: string | null
  due_at: string | null
  escalated_at: string | null
  escalate_to: string | null
  created_at: string
  updated_at: string
}

type Row = Record<string, unknown>
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

function toApproval(r: Row): AutomationApproval {
  return {
    id: String(r.id),
    workspace_id: String(r.workspace_id),
    run_id: (r.run_id as string | null) ?? null,
    definition_id: (r.definition_id as string | null) ?? null,
    node_key: (r.node_key as string | null) ?? null,
    node_type: String(r.node_type ?? ""),
    category: String(r.category ?? "approval"),
    risk: String(r.risk ?? "high"),
    title: String(r.title ?? ""),
    summary: (r.summary as string | null) ?? null,
    payload: obj(r.payload),
    status: (r.status as ApprovalStatus) ?? "pending",
    requested_by: (r.requested_by as string | null) ?? null,
    decided_by: (r.decided_by as string | null) ?? null,
    decided_at: (r.decided_at as string | null) ?? null,
    decision_note: (r.decision_note as string | null) ?? null,
    due_at: (r.due_at as string | null) ?? null,
    escalated_at: (r.escalated_at as string | null) ?? null,
    escalate_to: (r.escalate_to as string | null) ?? null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  }
}

export interface CreateApprovalInput {
  runId?: string | null
  definitionId?: string | null
  nodeKey?: string | null
  nodeType: string
  category?: string
  risk?: string
  title: string
  summary?: string | null
  payload?: Record<string, unknown>
  requestedBy?: string | null
  slaHours?: number
}

/** Create a pending approval object. Returns its id (or null on error). */
export async function createApproval(
  supabase: SupabaseClient,
  workspaceId: string,
  input: CreateApprovalInput,
): Promise<{ id: string } | null> {
  try {
    const due = input.slaHours && input.slaHours > 0 ? new Date(Date.now() + input.slaHours * 3_600_000).toISOString() : null
    const { data, error } = await supabase
      .from(APPROVALS_TABLE)
      .insert({
        workspace_id: workspaceId,
        run_id: input.runId ?? null,
        definition_id: input.definitionId ?? null,
        node_key: input.nodeKey ?? null,
        node_type: input.nodeType,
        category: input.category ?? "approval",
        risk: input.risk ?? "high",
        title: input.title,
        summary: input.summary ?? null,
        payload: input.payload ?? {},
        status: "pending",
        requested_by: input.requestedBy ?? null,
        due_at: due,
      })
      .select("id")
      .single()
    if (error || !data) return null
    return { id: String(data.id) }
  } catch {
    return null
  }
}

/** List approvals for a workspace, newest first. */
export async function listApprovals(
  supabase: SupabaseClient,
  workspaceId: string,
  opts: { status?: ApprovalStatus; limit?: number } = {},
): Promise<AutomationApproval[]> {
  try {
    let q = supabase.from(APPROVALS_TABLE).select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(opts.limit ?? 200)
    if (opts.status) q = q.eq("status", opts.status)
    const { data } = await q
    return ((data as Row[]) ?? []).map(toApproval)
  } catch {
    return []
  }
}

export async function getApproval(supabase: SupabaseClient, workspaceId: string, id: string): Promise<AutomationApproval | null> {
  try {
    const { data } = await supabase.from(APPROVALS_TABLE).select("*").eq("id", id).eq("workspace_id", workspaceId).maybeSingle()
    return data ? toApproval(data as Row) : null
  } catch {
    return null
  }
}

/**
 * Decide an approval (approve/reject). This records the DECISION only — it does
 * NOT itself perform the gated action. A separate, explicit, audited follow-up
 * (outside this engine's auto path) performs an approved payment/legal action.
 * That separation is the safety contract: the engine never auto-executes a
 * payment/legal node even after approval is recorded.
 */
export async function decideApproval(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  decision: "approved" | "rejected",
  deciderId: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(APPROVALS_TABLE)
      .update({
        status: decision,
        decided_by: deciderId,
        decided_at: new Date().toISOString(),
        decision_note: note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .eq("status", "pending") // only a pending approval can be decided
    if (error) return { ok: false, error: error.message }
    await recordAudit(supabase, {
      workspaceId,
      userId: deciderId,
      action: decision === "approved" ? "automation.approval_approved" : "automation.approval_rejected",
      resourceType: "automation_approval",
      resourceId: id,
      metadata: { decision, note: note ?? null },
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "decision failed" }
  }
}

/**
 * Escalate overdue pending approvals (due_at passed). Marks them 'escalated' and
 * stamps escalated_at. Best-effort batch — used by the cron runner. Returns the
 * number escalated.
 */
export async function escalateOverdueApprovals(supabase: SupabaseClient, workspaceId?: string): Promise<number> {
  try {
    let q = supabase
      .from(APPROVALS_TABLE)
      .update({ status: "escalated", escalated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("status", "pending")
      .lt("due_at", new Date().toISOString())
      .select("id")
    if (workspaceId) q = q.eq("workspace_id", workspaceId)
    const { data } = await q
    return ((data as Row[]) ?? []).length
  } catch {
    return 0
  }
}

// ── Node-run records ─────────────────────────────────────────────────────────

export type NodeRunStatus = "pending" | "running" | "succeeded" | "failed" | "skipped" | "blocked" | "awaiting_approval" | "simulated"

export interface RecordNodeRunInput {
  nodeKey: string
  nodeType: string
  category?: string
  seq: number
  status: NodeRunStatus
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string | null
  approvalId?: string | null
}

/** Append a per-node execution record to a run. Best-effort. */
export async function recordNodeRun(
  supabase: SupabaseClient,
  workspaceId: string,
  runId: string,
  input: RecordNodeRunInput,
): Promise<{ id: string } | null> {
  try {
    const now = new Date().toISOString()
    const terminal = ["succeeded", "failed", "skipped", "blocked", "simulated"].includes(input.status)
    const { data, error } = await supabase
      .from(NODE_RUNS_TABLE)
      .insert({
        workspace_id: workspaceId,
        run_id: runId,
        node_key: input.nodeKey,
        node_type: input.nodeType,
        category: input.category ?? "utility",
        seq: input.seq,
        status: input.status,
        input: input.input ?? {},
        output: input.output ?? {},
        error: input.error ?? null,
        approval_id: input.approvalId ?? null,
        started_at: now,
        finished_at: terminal ? now : null,
      })
      .select("id")
      .single()
    if (error || !data) return null
    return { id: String(data.id) }
  } catch {
    return null
  }
}

export async function listNodeRuns(supabase: SupabaseClient, runId: string): Promise<Row[]> {
  try {
    const { data } = await supabase.from(NODE_RUNS_TABLE).select("*").eq("run_id", runId).order("seq", { ascending: true })
    return (data as Row[]) ?? []
  } catch {
    return []
  }
}

// ── Run events (timeline) ────────────────────────────────────────────────────

export interface RunEventInput {
  level?: "debug" | "info" | "warn" | "error"
  eventType: string
  nodeKey?: string | null
  message?: string
  data?: Record<string, unknown>
}

/** Append a structured event to a run's timeline. Best-effort (never throws). */
export async function recordRunEvent(
  supabase: SupabaseClient,
  workspaceId: string,
  runId: string,
  event: RunEventInput,
): Promise<void> {
  try {
    await supabase.from(RUN_EVENTS_TABLE).insert({
      workspace_id: workspaceId,
      run_id: runId,
      level: event.level ?? "info",
      event_type: event.eventType,
      node_key: event.nodeKey ?? null,
      message: event.message ?? null,
      data: event.data ?? {},
    })
  } catch {
    /* timeline is best-effort */
  }
}

export async function listRunEvents(supabase: SupabaseClient, runId: string): Promise<Row[]> {
  try {
    const { data } = await supabase.from(RUN_EVENTS_TABLE).select("*").eq("run_id", runId).order("created_at", { ascending: true })
    return (data as Row[]) ?? []
  } catch {
    return []
  }
}

// ── Errors surface ───────────────────────────────────────────────────────────

export interface RecordErrorInput {
  definitionId?: string | null
  runId?: string | null
  nodeKey?: string | null
  nodeType?: string | null
  severity?: "warning" | "error" | "critical"
  code?: string
  message: string
  context?: Record<string, unknown>
}

/** Record an actionable error for the Errors surface. Best-effort. */
export async function recordAutomationError(
  supabase: SupabaseClient,
  workspaceId: string,
  input: RecordErrorInput,
): Promise<void> {
  try {
    await supabase.from(ERRORS_TABLE).insert({
      workspace_id: workspaceId,
      definition_id: input.definitionId ?? null,
      run_id: input.runId ?? null,
      node_key: input.nodeKey ?? null,
      node_type: input.nodeType ?? null,
      severity: input.severity ?? "error",
      code: input.code ?? null,
      message: input.message,
      context: input.context ?? {},
    })
  } catch {
    /* best-effort */
  }
}

export async function listErrors(
  supabase: SupabaseClient,
  workspaceId: string,
  opts: { resolved?: boolean; limit?: number } = {},
): Promise<Row[]> {
  try {
    let q = supabase.from(ERRORS_TABLE).select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(opts.limit ?? 200)
    if (opts.resolved !== undefined) q = q.eq("resolved", opts.resolved)
    const { data } = await q
    return (data as Row[]) ?? []
  } catch {
    return []
  }
}

export async function resolveError(supabase: SupabaseClient, workspaceId: string, id: string, userId: string): Promise<void> {
  try {
    await supabase
      .from(ERRORS_TABLE)
      .update({ resolved: true, resolved_by: userId, resolved_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
  } catch {
    /* best-effort */
  }
}
