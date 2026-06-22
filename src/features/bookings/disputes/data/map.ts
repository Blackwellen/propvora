// ============================================================
// Bookings Disputes — REAL data mapper.
// Converts the live `marketplace_disputes` row (+ `dispute_actions`
// audit trail + optional booking/listing join) into the rich `Dispute`
// UI shape. No fabricated money — amounts come straight from the row;
// missing display context degrades to neutral placeholders.
// ============================================================
export type { Dispute } from './types'
import type {
  Dispute,
  DisputeStageKey,
  DisputeStatus,
  DisputePriority,
  DisputeReason,
  ClaimantSide,
  DisputeTimelineEvent,
  DisputeMessage,
  DisputeEvidence,
  ResolutionProposal,
  ResolutionOutcome,
} from './types'

/** Raw marketplace_disputes row (lib `DisputeRecord`, loosely typed for the client). */
export interface RawDispute {
  id: string
  dispute_type: string | null
  transaction_id: string | null
  booking_id: string | null
  supplier_assignment_id: string | null
  payment_id: string | null
  workspace_id: string | null
  raised_by_workspace_id: string | null
  against_workspace_id: string | null
  reason: string | null
  detail: string | null
  status: string | null
  resolution: string | null
  priority: string | null
  payout_held: boolean | null
  amount_disputed_pence: number | null
  amount_refunded_pence: number | null
  evidence_requested_at: string | null
  assigned_admin: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface RawDisputeAction {
  id: string
  dispute_id: string
  action: string
  actor_id: string | null
  actor_role: string | null
  amount_pence: number | null
  detail: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

/** Optional joined context (booking / listing / parties) for richer display. */
export interface DisputeContext {
  booking_reference?: string
  guest_name?: string
  guest_email?: string
  property_name?: string
  property_location?: string
  property_image?: string
  supplier_name?: string
  counterparty_name?: string
  escrow_held_pence?: number
}

const num = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function mapStatus(s: string | null): DisputeStatus {
  switch ((s ?? '').toLowerCase()) {
    case 'open': return 'open'
    case 'awaiting_evidence': return 'awaiting_evidence'
    case 'under_review':
    case 'in_review':
    case 'escalated': return 'in_review'
    case 'proposed': return 'proposed'
    case 'partially_refunded':
    case 'refunded':
    case 'settled': return 'resolved'
    case 'suspended': return 'awaiting_evidence'
    case 'closed': return 'closed'
    case 'reopened': return 'reopened'
    default: return 'open'
  }
}

function mapStage(s: string | null, resolvedAt: string | null): DisputeStageKey {
  const st = (s ?? '').toLowerCase()
  if (st === 'closed') return 'closed'
  if (['settled', 'refunded', 'partially_refunded'].includes(st)) return resolvedAt ? 'closed' : 'resolution'
  if (['proposed'].includes(st)) return 'resolution'
  if (['under_review', 'in_review', 'escalated'].includes(st)) return 'review'
  if (['awaiting_evidence', 'suspended'].includes(st)) return 'evidence'
  return 'intake'
}

function mapPriority(p: string | null): DisputePriority {
  switch ((p ?? '').toLowerCase()) {
    case 'low': return 'low'
    case 'normal':
    case 'medium': return 'medium'
    case 'high': return 'high'
    case 'urgent':
    case 'critical': return 'critical'
    default: return 'medium'
  }
}

function mapReason(r: string | null): DisputeReason {
  const v = (r ?? '').toLowerCase()
  if (v.includes('damage')) return 'damage'
  if (v.includes('cancel')) return 'cancellation'
  if (v.includes('no_show') || v.includes('no-show')) return 'no_show'
  if (v.includes('incomplete') || v.includes('quality') || v.includes('work')) return 'service_quality'
  if (v.includes('overcharge') || v.includes('charge')) return 'overcharge'
  if (v.includes('refund')) return 'refund_request'
  if (v.includes('clean')) return 'cleanliness'
  if (v.includes('misrep') || v.includes('listing')) return 'misrepresentation'
  return 'other'
}

function mapClaimant(disputeType: string | null): ClaimantSide {
  switch ((disputeType ?? '').toLowerCase()) {
    case 'supplier': return 'supplier'
    case 'stay': return 'guest'
    default: return 'guest'
  }
}

const humanize = (s: string | null | undefined) =>
  (s ?? '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim()

const ACTION_KIND: Record<string, DisputeTimelineEvent['kind']> = {
  opened: 'info',
  assigned: 'info',
  evidence_requested: 'warning',
  evidence_submitted: 'evidence',
  payout_held: 'warning',
  payout_released: 'action',
  partial_refund: 'decision',
  full_refund: 'decision',
  settled: 'decision',
  suspended: 'warning',
  escalated: 'warning',
  closed: 'decision',
  note: 'info',
}

function actionStage(action: string): DisputeStageKey {
  if (['opened', 'assigned'].includes(action)) return 'intake'
  if (['evidence_requested', 'evidence_submitted'].includes(action)) return 'evidence'
  if (['escalated', 'suspended', 'payout_held'].includes(action)) return 'review'
  if (['partial_refund', 'full_refund', 'settled', 'payout_released'].includes(action)) return 'resolution'
  if (action === 'closed') return 'closed'
  return 'review'
}

function buildTimeline(actions: RawDisputeAction[]): DisputeTimelineEvent[] {
  return actions.map((a) => ({
    id: a.id,
    stage: actionStage(a.action),
    label: humanize(a.action),
    detail: a.detail ?? undefined,
    actor: a.actor_role ? humanize(a.actor_role) : (a.actor_id ? 'Team' : 'System'),
    at: a.created_at,
    kind: ACTION_KIND[a.action] ?? 'info',
  }))
}

function buildMessages(actions: RawDisputeAction[]): DisputeMessage[] {
  return actions
    .filter((a) => a.action === 'note' && a.detail)
    .map((a) => ({
      id: a.id,
      author: a.actor_role ? humanize(a.actor_role) : 'Adjudicator',
      author_role: 'adjudicator' as const,
      body: a.detail ?? '',
      sent_at: a.created_at,
    }))
}

function buildEvidence(actions: RawDisputeAction[]): DisputeEvidence[] {
  return actions
    .filter((a) => a.action === 'evidence_submitted')
    .map((a) => ({
      id: a.id,
      side: a.actor_role === 'host' || a.actor_role === 'operator' ? 'host' : 'counterparty',
      kind: 'note' as const,
      title: a.detail ?? 'Evidence submitted',
      submitted_by: a.actor_role ? humanize(a.actor_role) : 'Party',
      submitted_at: a.created_at,
    }))
}

function buildProposal(d: RawDispute): ResolutionProposal | undefined {
  const refunded = num(d.amount_refunded_pence)
  const disputed = num(d.amount_disputed_pence)
  const terminal = ['settled', 'refunded', 'partially_refunded', 'closed'].includes((d.status ?? '').toLowerCase())
  if (!terminal && refunded === 0) return undefined
  let outcome: ResolutionOutcome = 'pending'
  if (refunded === 0) outcome = 'no_refund'
  else if (refunded >= disputed && disputed > 0) outcome = 'full_refund'
  else outcome = 'partial_refund'
  return {
    outcome,
    refund_pence: refunded,
    payout_to_host_pence: Math.max(0, disputed - refunded),
    platform_fee_pence: 0,
    rationale: d.resolution ?? 'Resolution recorded.',
    sla_due: d.resolved_at ?? d.updated_at,
    accepted_by_host: Boolean(d.resolved_at),
    accepted_by_counterparty: Boolean(d.resolved_at),
    manager_approved: Boolean(d.resolved_at),
    allocations: [
      ...(refunded > 0 ? [{ id: 'refund', label: 'Refund to claimant', to: 'guest' as const, pence: refunded }] : []),
      ...(disputed - refunded > 0 ? [{ id: 'host', label: 'Released to host', to: 'host' as const, pence: disputed - refunded }] : []),
    ],
    release_schedule: [],
  }
}

export function mapDispute(
  d: RawDispute,
  actions: RawDisputeAction[] = [],
  ctx: DisputeContext = {},
): Dispute {
  const disputed = num(d.amount_disputed_pence)
  const refunded = num(d.amount_refunded_pence)
  const sorted = [...actions].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const isSupplier = (d.dispute_type ?? '') === 'supplier'

  return {
    id: d.id,
    reference: `DSP-${d.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
    workspace_id: d.workspace_id ?? undefined,
    booking_id: d.booking_id ?? d.transaction_id ?? d.id,
    booking_reference: ctx.booking_reference ?? (d.booking_id ? `BK-${d.booking_id.replace(/-/g, '').slice(0, 6).toUpperCase()}` : '—'),
    order_reference: d.payment_id ?? undefined,
    stage: mapStage(d.status, d.resolved_at),
    status: mapStatus(d.status),
    priority: mapPriority(d.priority),
    reason: mapReason(d.reason),
    claimant_side: mapClaimant(d.dispute_type),

    guest_name: ctx.guest_name ?? ctx.counterparty_name ?? (isSupplier ? 'Supplier' : 'Counterparty'),
    guest_email: ctx.guest_email,
    supplier_name: ctx.supplier_name ?? (isSupplier ? humanize(d.reason) : undefined),
    property_name: ctx.property_name ?? '—',
    property_location: ctx.property_location,
    property_image: ctx.property_image,

    issue_summary: humanize(d.reason) || 'Dispute raised',
    description: d.detail ?? 'No further detail provided.',

    currency: 'GBP',
    amount_disputed_pence: disputed,
    escrow_held_pence: ctx.escrow_held_pence ?? (d.payout_held ? disputed : 0),
    requested_refund_pence: disputed,
    total_released_pence: refunded,

    policy_reference: undefined,
    opened_at: d.created_at,
    updated_at: d.updated_at,
    resolved_at: d.resolved_at ?? undefined,
    sla_due: d.evidence_requested_at ?? undefined,

    recommended_outcome: undefined,
    risk_flags: d.payout_held ? ['Payout held'] : undefined,

    evidence: buildEvidence(sorted),
    messages: buildMessages(sorted),
    timeline: buildTimeline(sorted),
    policy_refs: [],
    proposal: buildProposal(d),

    intake_checklist: {
      issue_details_captured: Boolean(d.detail),
      claimant_side_confirmed: Boolean(d.dispute_type),
      linked_booking_verified: Boolean(d.booking_id || d.transaction_id),
      policy_reference_added: false,
    },
  }
}
