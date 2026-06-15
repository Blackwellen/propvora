/**
 * P8 — Risk & Fraud Engine: shared DTOs.
 *
 * HONESTY CONTRACT: every value modelled here is a computed SIGNAL produced to
 * assist human admin review. None of it is an automated determination,
 * enforcement action, or accusation. A `manual_flag` / `manual_clear` is an
 * explicit, recorded admin action.
 */

/** Severity buckets for an individual contributing event. */
export type RiskSeverity = "low" | "medium" | "high" | "critical"

/** Rolled-up band for a workspace's aggregate score. */
export type RiskBand = "low" | "medium" | "high" | "critical"

export const RISK_SEVERITIES: readonly RiskSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
] as const

export const RISK_BANDS: readonly RiskBand[] = [
  "low",
  "medium",
  "high",
  "critical",
] as const

/**
 * Canonical event types. Free-text in the DB (so ingest can extend), but these
 * cover the ingest paths and keep call sites greppable.
 */
export const RISK_EVENT_TYPES = {
  VELOCITY: "velocity",
  CHARGEBACK: "chargeback",
  SANCTIONS_SIGNAL: "sanctions_signal",
  DISPUTE_OPENED: "dispute_opened",
  KYC_FAILED: "kyc_failed",
  MARKETPLACE_SIGNAL: "marketplace_signal",
  MANUAL_FLAG: "manual_flag",
  MANUAL_CLEAR: "manual_clear",
} as const

export type RiskEventType =
  (typeof RISK_EVENT_TYPES)[keyof typeof RISK_EVENT_TYPES]

/** Origin of an ingested event. */
export type RiskSource =
  | "sanctions"
  | "verification"
  | "dispute"
  | "transaction"
  | "marketplace"
  | "admin"
  | "manual"

/** A single contributing signal row (read DTO). */
export interface RiskEvent {
  id: string
  workspaceId: string
  eventType: string
  severity: RiskSeverity
  scoreDelta: number
  detail: Record<string, unknown>
  source: string | null
  createdBy: string | null
  createdAt: string | null
}

/** A workspace's rolled-up risk score (read DTO). */
export interface RiskScore {
  workspaceId: string
  score: number
  band: RiskBand
  lastEventAt: string | null
  flagged: boolean
  flaggedReason: string | null
  updatedAt: string | null
}

/** A scoring rule (weighting applied per event_type). */
export interface RiskRule {
  id: string
  name: string
  eventType: string
  condition: Record<string, unknown>
  weight: number
  active: boolean
}

/** Score row joined with workspace display info for the admin dashboard. */
export interface WorkspaceRiskRow extends RiskScore {
  workspaceName: string | null
  country: string | null
  eventCount: number
}

/** Result of a pure transaction-risk assessment (advisory only). */
export interface TransactionRiskAssessment {
  score: number
  band: RiskBand
  /** Human-readable reasons that contributed to the score. */
  reasons: string[]
}

/** Arguments to record a new risk event. */
export interface RecordRiskEventArgs {
  workspaceId: string
  eventType: string
  severity?: RiskSeverity
  /** Explicit delta; when omitted, derived from rule weight + severity. */
  scoreDelta?: number
  detail?: Record<string, unknown>
  source?: RiskSource
  /** Acting admin id for manual events; null/undefined for system ingest. */
  createdBy?: string | null
}

/** Availability-aware wrapper so 42P01 (table absent) is a first-class state. */
export interface RiskResult<T> {
  available: boolean
  data: T
}
