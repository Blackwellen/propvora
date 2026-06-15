import "server-only"

/**
 * P8 — Risk & Fraud Engine: aggregation, transaction heuristics, admin actions.
 *
 *   • recomputeWorkspaceRisk — read all risk_events, score via pure rules, upsert
 *     the rolled-up risk_scores row (preserving any active manual flag);
 *   • assessTransactionRisk — PURE velocity/amount/new-account heuristic;
 *   • flagWorkspace / clearWorkspaceFlag — explicit, AUDITED admin actions that
 *     also record a manual_flag / manual_clear risk_event.
 *
 * All DB work uses a service-role client and MUST run behind the platform-admin
 * guard. 42P01-tolerant throughout.
 *
 * HONESTY: scores are advisory weightings of observed signals to assist a human
 * reviewer — never automated enforcement or an accusation. A flag/clear is a
 * recorded human decision.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { recordAudit } from "@/lib/audit/log"
import { evaluateRules, bandForScore } from "./rules"
import type {
  RiskBand,
  RiskRule,
  RiskScore,
  TransactionRiskAssessment,
} from "./types"

type AnyClient = SupabaseClient<any, any, any>

const MISSING_RELATION = "42P01"
const UNDEFINED_COLUMN = "42703"
const PGRST_MISSING_RELATION = "PGRST205"
const PGRST_MISSING_COLUMN = "PGRST204"

function isSchemaGap(code?: string): boolean {
  return (
    code === MISSING_RELATION ||
    code === UNDEFINED_COLUMN ||
    code === PGRST_MISSING_RELATION ||
    code === PGRST_MISSING_COLUMN
  )
}

/** Load active rule weights as event_type → weight. Best-effort, never throws. */
export async function loadRuleWeights(supabase: AnyClient): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  try {
    const { data, error } = await supabase
      .from("risk_rules")
      .select("event_type, weight, active")
      .eq("active", true)
    if (error) return out
    for (const r of data ?? []) {
      const t = r.event_type as string
      const w = Number(r.weight ?? 0)
      // If multiple rules target one type, keep the heaviest.
      out.set(t, Math.max(out.get(t) ?? 0, w))
    }
  } catch {
    /* ignore */
  }
  return out
}

/** Load active rules (full DTO) for explainability in the UI. */
export async function loadRiskRules(supabase: AnyClient): Promise<RiskRule[]> {
  try {
    const { data, error } = await supabase
      .from("risk_rules")
      .select("id, name, event_type, condition, weight, active")
      .order("weight", { ascending: false })
    if (error) return []
    return (data ?? []).map((r: Record<string, any>) => ({
      id: r.id as string,
      name: (r.name as string) ?? "",
      eventType: (r.event_type as string) ?? "",
      condition: (r.condition as Record<string, unknown>) ?? {},
      weight: Number(r.weight ?? 0),
      active: Boolean(r.active),
    }))
  } catch {
    return []
  }
}

/**
 * Recompute and upsert the rolled-up risk_scores row for a workspace from its
 * full risk_events history. Preserves an active manual flag (flag is a separate
 * human decision; recompute must not silently clear it). Returns the resulting
 * score, or null if the tables are absent.
 */
export async function recomputeWorkspaceRisk(
  supabase: AnyClient,
  workspaceId: string
): Promise<RiskScore | null> {
  let events: Array<Record<string, any>> = []
  try {
    const { data, error } = await supabase
      .from("risk_events")
      .select("event_type, severity, score_delta, created_at")
      .eq("workspace_id", workspaceId)
    if (error) {
      if (isSchemaGap(error.code)) return null
    } else {
      events = data ?? []
    }
  } catch {
    return null
  }

  const weights = await loadRuleWeights(supabase)
  const { score, band } = evaluateRules(
    events.map((e) => ({
      eventType: (e.event_type as string) ?? "",
      severity: ((e.severity as string) ?? "low") as RiskScore["band"],
      scoreDelta: Number(e.score_delta ?? 0),
      createdAt: (e.created_at as string) ?? null,
    })),
    weights
  )

  const lastEventAt =
    events.length > 0
      ? events
          .map((e) => (e.created_at as string) ?? "")
          .filter(Boolean)
          .sort()
          .at(-1) ?? null
      : null

  // Preserve an existing manual flag across recompute.
  let flagged = false
  let flaggedReason: string | null = null
  try {
    const { data: existing } = await supabase
      .from("risk_scores")
      .select("flagged, flagged_reason")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (existing) {
      flagged = Boolean(existing.flagged)
      flaggedReason = (existing.flagged_reason as string) ?? null
    }
  } catch {
    /* ignore */
  }

  const upsertRow = {
    workspace_id: workspaceId,
    score,
    band,
    last_event_at: lastEventAt,
    flagged,
    flagged_reason: flaggedReason,
    updated_at: new Date().toISOString(),
  }

  try {
    const { error } = await supabase
      .from("risk_scores")
      .upsert(upsertRow, { onConflict: "workspace_id" })
    if (error && !isSchemaGap(error.code)) {
      console.error("[risk] recompute upsert failed:", error.message)
      return null
    }
    if (error) return null
  } catch (err) {
    console.error("[risk] recompute unexpected:", err)
    return null
  }

  return {
    workspaceId,
    score,
    band,
    lastEventAt,
    flagged,
    flaggedReason,
    updatedAt: upsertRow.updated_at,
  }
}

// ── Pure transaction-risk heuristics ─────────────────────────────────────────

export interface AssessTransactionArgs {
  /** Amount of THIS transaction, in pence. */
  amountPence: number
  /** Count of transactions by this party in the trailing window. */
  recentTxCount: number
  /** Sum of recent transaction amounts in the window, in pence. */
  recentTxTotalPence: number
  /** Age of the acting account in days. */
  accountAgeDays: number
  /** Whether the acting workspace has any open/unresolved dispute. */
  hasOpenDispute?: boolean
}

/**
 * PURE advisory assessment for a single transaction. Produces a 0–100 score, a
 * band, and human-readable reasons. NOT an authorisation gate — it never blocks
 * a transaction; it only surfaces reasons a human might want to look closer.
 */
export function assessTransactionRisk(
  args: AssessTransactionArgs
): TransactionRiskAssessment {
  const reasons: string[] = []
  let score = 0

  // Velocity: many transactions in a short window.
  if (args.recentTxCount >= 10) {
    score += 30
    reasons.push(`High velocity: ${args.recentTxCount} transactions in window`)
  } else if (args.recentTxCount >= 5) {
    score += 15
    reasons.push(`Elevated velocity: ${args.recentTxCount} transactions in window`)
  }

  // Large single amount (> £5,000).
  if (args.amountPence >= 500_000) {
    score += 25
    reasons.push("Large transaction amount (≥ £5,000)")
  } else if (args.amountPence >= 200_000) {
    score += 12
    reasons.push("Above-average transaction amount (≥ £2,000)")
  }

  // Large cumulative window total (> £20,000).
  if (args.recentTxTotalPence >= 2_000_000) {
    score += 20
    reasons.push("High cumulative volume in window (≥ £20,000)")
  }

  // New account (< 7 days) doing notable volume.
  if (args.accountAgeDays < 7 && args.amountPence >= 100_000) {
    score += 20
    reasons.push("New account (< 7 days) with a notable transaction")
  } else if (args.accountAgeDays < 30) {
    score += 5
    reasons.push("Relatively new account (< 30 days)")
  }

  if (args.hasOpenDispute) {
    score += 15
    reasons.push("Party has an open marketplace dispute")
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  return { score: clamped, band: bandForScore(clamped), reasons }
}

// ── Admin manual actions (audited) ───────────────────────────────────────────

export interface FlagArgs {
  workspaceId: string
  /** Acting admin user id (for created_by + audit). */
  adminUserId: string
  reason: string
  ip?: string | null
}

export interface FlagResult {
  ok: boolean
  error?: string
  score?: RiskScore | null
}

/**
 * Explicitly flag a workspace for review. Records a `manual_flag` risk_event
 * (which the recompute folds into the score), sets risk_scores.flagged, and
 * writes an audit entry. This is a recorded HUMAN decision, never automated.
 */
export async function flagWorkspace(
  supabase: AnyClient,
  args: FlagArgs
): Promise<FlagResult> {
  if (!args.reason || !args.reason.trim()) {
    return { ok: false, error: "A reason is required to flag a workspace." }
  }

  // Record the manual_flag event (recomputes score as a side effect).
  try {
    const { error } = await supabase.from("risk_events").insert({
      workspace_id: args.workspaceId,
      event_type: "manual_flag",
      severity: "high",
      score_delta: 0, // weight derived from rules during recompute
      detail: { reason: args.reason.trim() },
      source: "manual",
      created_by: args.adminUserId,
    })
    if (error && !isSchemaGap(error.code)) {
      return { ok: false, error: error.message }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Insert failed" }
  }

  const score = await recomputeWorkspaceRisk(supabase, args.workspaceId)

  // Set the flag on the score row (recompute preserves it once set, but this is
  // the point it is first turned on).
  try {
    await supabase
      .from("risk_scores")
      .upsert(
        {
          workspace_id: args.workspaceId,
          flagged: true,
          flagged_reason: args.reason.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id" }
      )
  } catch {
    /* best-effort */
  }

  await recordAudit(supabase, {
    workspaceId: args.workspaceId,
    userId: args.adminUserId,
    action: "risk.workspace_flagged",
    resourceType: "workspace",
    resourceId: args.workspaceId,
    metadata: { reason: args.reason.trim() },
    ip: args.ip ?? null,
  })

  return { ok: true, score }
}

/**
 * Clear a workspace's manual flag. Records a `manual_clear` risk_event (which
 * resets accrued score during recompute), unsets the flag, and audits.
 */
export async function clearWorkspaceFlag(
  supabase: AnyClient,
  args: FlagArgs
): Promise<FlagResult> {
  try {
    const { error } = await supabase.from("risk_events").insert({
      workspace_id: args.workspaceId,
      event_type: "manual_clear",
      severity: "low",
      score_delta: 0,
      detail: { reason: args.reason?.trim() || "Cleared by admin" },
      source: "manual",
      created_by: args.adminUserId,
    })
    if (error && !isSchemaGap(error.code)) {
      return { ok: false, error: error.message }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Insert failed" }
  }

  // Unset the flag BEFORE recompute so recompute preserves the cleared state.
  try {
    await supabase
      .from("risk_scores")
      .upsert(
        {
          workspace_id: args.workspaceId,
          flagged: false,
          flagged_reason: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id" }
      )
  } catch {
    /* best-effort */
  }

  const score = await recomputeWorkspaceRisk(supabase, args.workspaceId)

  await recordAudit(supabase, {
    workspaceId: args.workspaceId,
    userId: args.adminUserId,
    action: "risk.workspace_flag_cleared",
    resourceType: "workspace",
    resourceId: args.workspaceId,
    metadata: { reason: args.reason?.trim() || null },
    ip: args.ip ?? null,
  })

  return { ok: true, score }
}
