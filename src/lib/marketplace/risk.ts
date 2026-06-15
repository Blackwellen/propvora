// ============================================================================
// Marketplace risk signals — typed, workspace-scoped data layer over
// `marketplace_risk_signals` (P2 trust substrate).
//
// Records discrete risk SIGNALS against a workspace (e.g. a failed verification,
// a chargeback, an unusual velocity) and rolls them up into a simple, explainable
// risk assessment. This is an internal heuristic surface — it makes NO legal or
// financial-advice claim and does not auto-take any destructive action.
//
// 42P01-tolerant and workspace-scoped throughout. RLS in the DB is the real
// boundary (workspace members + dispute-resolvers may read/record).
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

/** Severity bands (mirror the DB CHECK). */
export type RiskSeverity = "low" | "medium" | "high" | "critical"

/** A recorded risk signal row. */
export interface MarketplaceRiskSignal {
  id: string
  workspace_id: string
  signal_type: string
  severity: RiskSeverity
  detail: Record<string, unknown>
  created_at: string
}

/** Uniform tolerant result. */
export interface Result<T> {
  data: T | null
  error: string | null
}

/** Overall risk band for a workspace rollup. */
export type RiskBand = "low" | "medium" | "high" | "critical"

/** Output of {@link assessWorkspaceRisk}. */
export interface WorkspaceRiskAssessment {
  workspace_id: string
  /** 0..100 weighted risk score (higher = riskier). */
  score: number
  band: RiskBand
  signal_count: number
  /** Count of signals per severity. */
  counts: Record<RiskSeverity, number>
}

const SIGNAL_COLUMNS = "id, workspace_id, signal_type, severity, detail, created_at"

/** Per-severity weight used by the rollup. */
const SEVERITY_WEIGHT: Record<RiskSeverity, number> = {
  low: 5,
  medium: 15,
  high: 35,
  critical: 60,
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

function isSeverity(v: unknown): v is RiskSeverity {
  return v === "low" || v === "medium" || v === "high" || v === "critical"
}

/** Fields a caller may set when recording a risk signal. */
export interface RecordRiskSignalInput {
  signalType: string
  severity: RiskSeverity
  detail?: Record<string, unknown> | null
}

/**
 * Record a risk signal against a workspace. Tolerant: returns { data:null,
 * error } rather than throwing. Validates the severity band defensively.
 */
export async function recordRiskSignal(
  supabase: SupabaseClient,
  workspaceId: string,
  input: RecordRiskSignalInput
): Promise<Result<MarketplaceRiskSignal>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }
  if (!input.signalType?.trim()) return { data: null, error: "signal_type_required" }
  if (!isSeverity(input.severity)) return { data: null, error: "invalid_severity" }
  try {
    const { data, error } = await supabase
      .from("marketplace_risk_signals")
      .insert({
        workspace_id: workspaceId,
        signal_type: input.signalType.trim(),
        severity: input.severity,
        detail: input.detail ?? {},
      })
      .select(SIGNAL_COLUMNS)
      .single()
    if (error) return { data: null, error: toMessage(error) }
    return { data: data as MarketplaceRiskSignal, error: null }
  } catch (err) {
    return { data: null, error: toMessage(err) }
  }
}

/** Options for {@link getWorkspaceRiskSignals}. */
export interface ListRiskSignalsOptions {
  severity?: RiskSeverity
  signalType?: string
  limit?: number
  offset?: number
}

/**
 * List a workspace's risk signals, most recent first. Tolerant → [] on failure.
 */
export async function getWorkspaceRiskSignals(
  supabase: SupabaseClient,
  workspaceId: string,
  options: ListRiskSignalsOptions = {}
): Promise<Result<MarketplaceRiskSignal[]>> {
  if (!workspaceId) return { data: [], error: "workspace_required" }
  try {
    let query = supabase
      .from("marketplace_risk_signals")
      .select(SIGNAL_COLUMNS)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (options.severity) query = query.eq("severity", options.severity)
    if (options.signalType) query = query.eq("signal_type", options.signalType)

    const limit = Math.min(Math.max(options.limit ?? 100, 1), 500)
    const offset = Math.max(options.offset ?? 0, 0)
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) {
      if (isMissingTable(error)) return { data: [], error: null }
      return { data: [], error: toMessage(error) }
    }
    return { data: (data as MarketplaceRiskSignal[]) ?? [], error: null }
  } catch (err) {
    if (isMissingTable(err)) return { data: [], error: null }
    return { data: [], error: toMessage(err) }
  }
}

/** Map a 0..100 score to a band. */
function bandFor(score: number): RiskBand {
  if (score >= 75) return "critical"
  if (score >= 45) return "high"
  if (score >= 20) return "medium"
  return "low"
}

/**
 * Roll a workspace's risk signals up into a simple, explainable assessment.
 * Weighted by severity and saturated at 100. Tolerant: a missing table or no
 * signals yields a clean low-risk result rather than an error.
 */
export async function assessWorkspaceRisk(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Result<WorkspaceRiskAssessment>> {
  if (!workspaceId) return { data: null, error: "workspace_required" }

  const empty: WorkspaceRiskAssessment = {
    workspace_id: workspaceId,
    score: 0,
    band: "low",
    signal_count: 0,
    counts: { low: 0, medium: 0, high: 0, critical: 0 },
  }

  const { data: signals, error } = await getWorkspaceRiskSignals(
    supabase,
    workspaceId,
    { limit: 500 }
  )
  if (error) return { data: empty, error }
  const rows = signals ?? []
  if (rows.length === 0) return { data: empty, error: null }

  const counts: Record<RiskSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }
  let raw = 0
  for (const s of rows) {
    if (isSeverity(s.severity)) {
      counts[s.severity] += 1
      raw += SEVERITY_WEIGHT[s.severity]
    }
  }
  const score = Math.min(100, raw)

  return {
    data: {
      workspace_id: workspaceId,
      score,
      band: bandFor(score),
      signal_count: rows.length,
      counts,
    },
    error: null,
  }
}
