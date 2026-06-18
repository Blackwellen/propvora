// Types for Money > Escrow Management. Money is integer pence.
// The escrow state machine:
//   created → funding_pending → funded → held → evidence_pending →
//   review_pending → ready_to_release → partially_released → released →
//   disputed → refunded → cancelled → failed

export type EscrowState =
  | "created" | "funding_pending" | "funded" | "held" | "evidence_pending"
  | "review_pending" | "ready_to_release" | "partially_released" | "released"
  | "disputed" | "refunded" | "cancelled" | "failed"

export const ESCROW_STATES: EscrowState[] = [
  "created", "funding_pending", "funded", "held", "evidence_pending",
  "review_pending", "ready_to_release", "partially_released", "released",
  "disputed", "refunded", "cancelled", "failed",
]

export type EscrowEvidenceStatus = "missing" | "partial" | "submitted" | "approved"
export type EscrowRisk = "low" | "medium" | "high"
export type EscrowLinkedType = "service_order" | "booking"

export interface ManagedEscrowRow {
  id: string
  escrowId: string
  linkedType: EscrowLinkedType
  reference: string
  counterparty: string         // Guest / Supplier
  counterpartyInitials: string
  propertyLabel: string
  amountHeldPence: number
  fundedAmountPence: number
  releaseDate: string | null
  stage: EscrowState
  evidenceStatus: EscrowEvidenceStatus
  releaseRule: string
  risk: EscrowRisk
  hasDispute: boolean
  milestoneProgress: number
}

export interface EscrowEvidenceItem {
  id: string
  name: string
  phase: "before" | "during" | "after"
  approved: boolean
  uploadedAt: string
}

export interface EscrowMilestoneItem {
  id: string
  label: string
  done: boolean
}

export interface EscrowReleaseConditionItem {
  id: string
  label: string
  required: boolean
  met: boolean
}

export interface EscrowTimelineItem {
  id: string
  fromState: EscrowState | null
  toState: EscrowState
  reason: string | null
  actor: string
  at: string
}

export interface EscrowSplitItem {
  id: string
  label: string
  amountPence: number
  released: boolean
}

export interface ManagedEscrowKpis {
  totalInEscrowPence: number
  releaseDueSoon: number
  disputedEscrowPence: number
  avgHoldDays: number
  awaitingEvidence: number
}

export interface EscrowCashflowPoint {
  month: string
  inflowPence: number
  releasedPence: number
}

export interface EscrowProjectionPoint {
  date: string
  projectedReleasePence: number
}
