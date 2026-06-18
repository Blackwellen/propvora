// ============================================================
// Bookings Disputes — domain types
// Money is always integer pence (formatPence).
// ============================================================

export type DisputeStageKey =
  | 'intake'
  | 'evidence'
  | 'review'
  | 'resolution'
  | 'closed'

export type DisputePriority = 'low' | 'medium' | 'high' | 'critical'

export type DisputeStatus =
  | 'open'
  | 'awaiting_evidence'
  | 'in_review'
  | 'proposed'
  | 'resolved'
  | 'closed'
  | 'reopened'

export type DisputeReason =
  | 'damage'
  | 'cancellation'
  | 'no_show'
  | 'service_quality'
  | 'overcharge'
  | 'refund_request'
  | 'cleanliness'
  | 'misrepresentation'
  | 'other'

export type ClaimantSide = 'host' | 'guest' | 'supplier'

export type PartySide = 'host' | 'counterparty'

export type EvidenceKind =
  | 'photo'
  | 'invoice'
  | 'chat_log'
  | 'inspection_report'
  | 'booking_terms'
  | 'note'

export type ResolutionOutcome =
  | 'full_refund'
  | 'partial_refund'
  | 'no_refund'
  | 'split'
  | 'release_to_host'
  | 'pending'

export interface DisputeEvidence {
  id: string
  side: PartySide
  kind: EvidenceKind
  title: string
  description?: string
  submitted_by: string
  submitted_at: string // ISO
  file_name?: string
  file_size_kb?: number
}

export interface DisputeMessage {
  id: string
  author: string
  author_role: 'host' | 'guest' | 'supplier' | 'adjudicator' | 'system'
  body: string
  sent_at: string // ISO
}

export interface DisputeTimelineEvent {
  id: string
  stage: DisputeStageKey
  label: string
  detail?: string
  actor: string
  at: string // ISO
  kind: 'info' | 'action' | 'evidence' | 'decision' | 'warning'
}

export interface DisputePolicyReference {
  id: string
  code: string
  title: string
  url?: string
  note?: string
}

export interface PayoutAllocationLine {
  id: string
  label: string
  to: 'host' | 'guest' | 'supplier' | 'platform'
  pence: number
}

export interface ResolutionProposal {
  outcome: ResolutionOutcome
  refund_pence: number
  payout_to_host_pence: number
  platform_fee_pence: number
  rationale: string
  sla_due: string // ISO
  accepted_by_host: boolean
  accepted_by_counterparty: boolean
  manager_approved: boolean
  allocations: PayoutAllocationLine[]
  release_schedule: { id: string; label: string; date: string; pence: number; status: 'pending' | 'scheduled' | 'released' }[]
}

export interface Dispute {
  id: string
  reference: string // human ref e.g. DSP-2041
  workspace_id?: string
  booking_id: string
  booking_reference: string
  order_reference?: string
  stage: DisputeStageKey
  status: DisputeStatus
  priority: DisputePriority
  reason: DisputeReason
  claimant_side: ClaimantSide

  guest_name: string
  guest_email?: string
  guest_avatar?: string
  supplier_name?: string
  property_name: string
  property_location?: string
  property_image?: string

  issue_summary: string
  description: string

  currency: string
  amount_disputed_pence: number
  escrow_held_pence: number
  requested_refund_pence: number
  total_released_pence?: number

  policy_reference?: string
  opened_at: string // ISO
  updated_at: string // ISO
  resolved_at?: string
  sla_due?: string

  recommended_outcome?: ResolutionOutcome
  risk_flags?: string[]

  evidence: DisputeEvidence[]
  messages: DisputeMessage[]
  timeline: DisputeTimelineEvent[]
  policy_refs: DisputePolicyReference[]
  proposal?: ResolutionProposal

  intake_checklist?: {
    issue_details_captured: boolean
    claimant_side_confirmed: boolean
    linked_booking_verified: boolean
    policy_reference_added: boolean
  }
}

export type DataSource = 'live' | 'seed'

export interface UseDisputesResult {
  data: Dispute[]
  loading: boolean
  error: string | null
  source: DataSource
  reload: () => void
}

export interface UseDisputeResult {
  data: Dispute | null
  loading: boolean
  error: string | null
  source: DataSource
  reload: () => void
}

// Ordered stages for the stepper.
export const DISPUTE_STAGES: { key: DisputeStageKey; label: string; short: string }[] = [
  { key: 'intake', label: 'Intake', short: 'Intake' },
  { key: 'evidence', label: 'Evidence', short: 'Evidence' },
  { key: 'review', label: 'Review', short: 'Review' },
  { key: 'resolution', label: 'Resolution', short: 'Resolution' },
  { key: 'closed', label: 'Finalisation', short: 'Closed' },
]

export const REASON_LABELS: Record<DisputeReason, string> = {
  damage: 'Property damage',
  cancellation: 'Cancellation',
  no_show: 'No-show',
  service_quality: 'Service quality',
  overcharge: 'Overcharge',
  refund_request: 'Refund request',
  cleanliness: 'Cleanliness',
  misrepresentation: 'Misrepresentation',
  other: 'Other',
}

export const STATUS_LABELS: Record<DisputeStatus, string> = {
  open: 'Open',
  awaiting_evidence: 'Awaiting evidence',
  in_review: 'In review',
  proposed: 'Resolution proposed',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
}

export const PRIORITY_LABELS: Record<DisputePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}
