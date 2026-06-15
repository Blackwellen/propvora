// Automation v2 — append-only RUN HISTORY data layer.
//
// EXTENDS the engine with a richer run record than smart_rule_runs: a run can be
// a DRY RUN (is_dry_run=true / status='dry_run') and it owns an ordered array of
// `automation_run_steps` (one per action), so the runs UI can show exactly what
// each step did (or, for a dry run, what it WOULD do — status='simulated').
//
// History is APPEND-ONLY: recordRun creates the row, recordRunStep appends a
// step, finishRun stamps the terminal status. Nothing here mutates a definition
// or performs an action side-effect — that is owned by execute.ts (real) and
// dry-run.ts (simulated). All writes use the caller's RLS-scoped client.

import type { SupabaseClient } from "@supabase/supabase-js"

const RUNS_TABLE = "automation_v2_runs"
const STEPS_TABLE = "automation_run_steps"

export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "skipped" | "dry_run"
export type StepStatus = "pending" | "succeeded" | "failed" | "skipped" | "simulated"

export interface AutomationRun {
  id: string
  workspace_id: string
  definition_id: string | null
  status: RunStatus
  trigger_context: Record<string, unknown>
  started_at: string | null
  finished_at: string | null
  error: string | null
  is_dry_run: boolean
  created_at: string
}

export interface AutomationRunStep {
  id: string
  run_id: string
  step_index: number
  action_type: string
  status: StepStatus
  input: Record<string, unknown>
  output: Record<string, unknown>
  error: string | null
  created_at: string
}

export interface RunWithSteps extends AutomationRun {
  steps: AutomationRunStep[]
}

type Row = Record<string, unknown>

function toRun(r: Row): AutomationRun {
  return {
    id: String(r.id),
    workspace_id: String(r.workspace_id),
    definition_id: (r.definition_id as string | null) ?? null,
    status: (r.status as RunStatus) ?? "queued",
    trigger_context: (r.trigger_context && typeof r.trigger_context === "object" ? r.trigger_context : {}) as Record<string, unknown>,
    started_at: (r.started_at as string | null) ?? null,
    finished_at: (r.finished_at as string | null) ?? null,
    error: (r.error as string | null) ?? null,
    is_dry_run: Boolean(r.is_dry_run),
    created_at: String(r.created_at ?? ""),
  }
}

function toStep(r: Row): AutomationRunStep {
  return {
    id: String(r.id),
    run_id: String(r.run_id),
    step_index: Number(r.step_index ?? 0),
    action_type: String(r.action_type ?? ""),
    status: (r.status as StepStatus) ?? "pending",
    input: (r.input && typeof r.input === "object" ? r.input : {}) as Record<string, unknown>,
    output: (r.output && typeof r.output === "object" ? r.output : {}) as Record<string, unknown>,
    error: (r.error as string | null) ?? null,
    created_at: String(r.created_at ?? ""),
  }
}

export interface RecordRunInput {
  definitionId?: string | null
  status?: RunStatus
  triggerContext?: Record<string, unknown>
  isDryRun?: boolean
  /** If true (default for real runs), stamp started_at now. */
  start?: boolean
}

/**
 * Create a run history row. For a real run, pass status 'running' (and start).
 * For a dry run, pass isDryRun + status 'dry_run'. Returns the run id.
 */
export async function recordRun(
  supabase: SupabaseClient,
  workspaceId: string,
  input: RecordRunInput = {},
): Promise<{ id: string } | null> {
  try {
    const isDry = input.isDryRun ?? false
    const status: RunStatus = input.status ?? (isDry ? "dry_run" : "running")
    const insert: Row = {
      workspace_id: workspaceId,
      definition_id: input.definitionId ?? null,
      status,
      trigger_context: input.triggerContext ?? {},
      is_dry_run: isDry,
    }
    if (input.start ?? !isDry) insert.started_at = new Date().toISOString()
    const { data, error } = await supabase.from(RUNS_TABLE).insert(insert).select("id").single()
    if (error || !data) return null
    return { id: String(data.id) }
  } catch {
    return null
  }
}

export interface RecordStepInput {
  stepIndex: number
  actionType: string
  status: StepStatus
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string | null
}

/** Append a step to a run. Returns the step id (or null on error). */
export async function recordRunStep(
  supabase: SupabaseClient,
  runId: string,
  step: RecordStepInput,
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabase
      .from(STEPS_TABLE)
      .insert({
        run_id: runId,
        step_index: step.stepIndex,
        action_type: step.actionType,
        status: step.status,
        input: step.input ?? {},
        output: step.output ?? {},
        error: step.error ?? null,
      })
      .select("id")
      .single()
    if (error || !data) return null
    return { id: String(data.id) }
  } catch {
    return null
  }
}

/** Stamp a run's terminal status + finished_at (+ optional error). */
export async function finishRun(
  supabase: SupabaseClient,
  runId: string,
  status: RunStatus,
  error?: string | null,
): Promise<void> {
  try {
    await supabase
      .from(RUNS_TABLE)
      .update({ status, finished_at: new Date().toISOString(), error: error ?? null })
      .eq("id", runId)
  } catch {
    /* append-only history is best-effort; never throw from a finaliser */
  }
}

export interface RunFilters {
  definitionId?: string
  status?: RunStatus
  isDryRun?: boolean
  limit?: number
}

/** List runs for a workspace, newest first (tolerant — empty on error). */
export async function listRuns(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: RunFilters = {},
): Promise<AutomationRun[]> {
  try {
    let q = supabase
      .from(RUNS_TABLE)
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 200)
    if (filters.definitionId) q = q.eq("definition_id", filters.definitionId)
    if (filters.status) q = q.eq("status", filters.status)
    if (filters.isDryRun !== undefined) q = q.eq("is_dry_run", filters.isDryRun)
    const { data, error } = await q
    if (error || !data) return []
    return (data as Row[]).map(toRun)
  } catch {
    return []
  }
}

/** Fetch a single run with its ordered steps (tolerant — null if missing). */
export async function getRun(
  supabase: SupabaseClient,
  workspaceId: string,
  runId: string,
): Promise<RunWithSteps | null> {
  try {
    const { data: run, error } = await supabase
      .from(RUNS_TABLE)
      .select("*")
      .eq("id", runId)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error || !run) return null

    const { data: steps } = await supabase
      .from(STEPS_TABLE)
      .select("*")
      .eq("run_id", runId)
      .order("step_index", { ascending: true })

    return {
      ...toRun(run as Row),
      steps: ((steps as Row[]) ?? []).map(toStep),
    }
  } catch {
    return null
  }
}
