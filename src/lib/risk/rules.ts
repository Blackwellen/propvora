/**
 * P8 — Risk & Fraud Engine: PURE scoring + banding.
 *
 * No I/O. These helpers turn a set of contributing events into an aggregate
 * score and a band. Kept pure so they are trivially testable and so the engine
 * (which does the DB I/O) can stay thin.
 *
 * HONESTY: the score is an advisory weighting of observed signals, NOT a
 * probability of guilt and NOT an enforcement trigger. Bands exist only to help
 * a human reviewer triage their queue.
 */

import type { RiskBand, RiskEvent, RiskSeverity } from "./types"

/** Multiplier applied to a rule/base weight by the event's severity. */
const SEVERITY_MULTIPLIER: Record<RiskSeverity, number> = {
  low: 0.5,
  medium: 1,
  high: 1.75,
  critical: 3,
}

/** Base weight when no rule matches an event type. */
const DEFAULT_WEIGHT = 5

/**
 * Score thresholds → band. Inclusive lower bounds. Tuned so a single critical
 * signal lands a workspace in at least "high".
 */
const BAND_THRESHOLDS: ReadonlyArray<{ min: number; band: RiskBand }> = [
  { min: 90, band: "critical" },
  { min: 55, band: "high" },
  { min: 25, band: "medium" },
  { min: 0, band: "low" },
]

/** Pure: map a numeric score to a band. */
export function bandForScore(score: number): RiskBand {
  const s = Number.isFinite(score) ? score : 0
  for (const t of BAND_THRESHOLDS) {
    if (s >= t.min) return t.band
  }
  return "low"
}

/** Severity → a band, for a single event (used when no aggregate exists). */
export function bandForSeverity(severity: RiskSeverity): RiskBand {
  return severity
}

/**
 * The weight to apply for an event, given the active rules. If an explicit
 * `scoreDelta` was stored on the event we trust it; otherwise we derive a delta
 * from the matching rule weight (or DEFAULT_WEIGHT) scaled by severity.
 */
export function deltaForEvent(
  event: Pick<RiskEvent, "eventType" | "severity" | "scoreDelta">,
  ruleWeights: Map<string, number>
): number {
  if (event.scoreDelta && event.scoreDelta !== 0) return event.scoreDelta
  const base = ruleWeights.get(event.eventType) ?? DEFAULT_WEIGHT
  const mult = SEVERITY_MULTIPLIER[event.severity] ?? 1
  return Math.round(base * mult)
}

export interface EvaluateResult {
  /** Clamped aggregate score (0–100). */
  score: number
  band: RiskBand
  /** Per-event-type contribution totals, for explainability. */
  contributions: Record<string, number>
}

/**
 * Pure aggregate scoring over a workspace's events.
 *
 * `ruleWeights` maps event_type → weight (from active risk_rules). A
 * `manual_clear` event zeroes the running total at the point it occurs (a human
 * explicitly cleared the workspace); events after it accrue normally.
 *
 * The result is clamped to 0–100 so the gauge and band stay bounded.
 */
export function evaluateRules(
  events: ReadonlyArray<Pick<RiskEvent, "eventType" | "severity" | "scoreDelta" | "createdAt">>,
  ruleWeights: Map<string, number> = new Map()
): EvaluateResult {
  // Process oldest → newest so a manual_clear correctly resets prior accrual.
  const ordered = [...events].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0
    return ta - tb
  })

  let running = 0
  const contributions: Record<string, number> = {}

  for (const e of ordered) {
    if (e.eventType === "manual_clear") {
      running = 0
      for (const k of Object.keys(contributions)) delete contributions[k]
      continue
    }
    const delta = deltaForEvent(e, ruleWeights)
    running += delta
    contributions[e.eventType] = (contributions[e.eventType] ?? 0) + delta
  }

  const score = Math.max(0, Math.min(100, Math.round(running)))
  return { score, band: bandForScore(score), contributions }
}
