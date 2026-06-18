/* ──────────────────────────────────────────────────────────────────────────
   Supplier Jobs — domain types for the field-work execution surface.

   These shape the five Jobs tabs (Active / Scheduled / Awaiting Evidence /
   Completed / Cancelled). Money is ALWAYS integer pence. Statuses are
   lower_snake tokens, humanised in the UI.
─────────────────────────────────────────────────────────────────────────── */

export type JobStatus =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"

/** Which Jobs tab a job belongs to (route-aware `?tab=`). */
export type JobTab =
  | "active"
  | "scheduled"
  | "awaiting_evidence"
  | "completed"
  | "cancelled"

export type EscrowStatus = "held" | "released" | "paid" | "none"

export type EvidenceItemKey =
  | "before_photos"
  | "after_photos"
  | "completion_notes"
  | "invoice"
  | "customer_signoff"

export interface EvidenceItem {
  key: EvidenceItemKey
  label: string
  received: boolean
  required: boolean
}

export interface JobMaterial {
  id: string
  name: string
  quantity: number
  unit: string
  unitCostPence: number
  status: "pending" | "ordered" | "ready" | "used"
}

export interface JobNote {
  id: string
  body: string
  kind: "note" | "completion" | "followup"
  authorName: string
  createdAt: string
}

export interface JobMessage {
  id: string
  body: string
  direction: "inbound" | "outbound"
  authorName: string
  createdAt: string
}

export interface JobEvidenceFile {
  id: string
  name: string
  kind: "before" | "after" | "document" | "invoice"
  url: string | null
  uploadedAt: string
}

export interface JobCancellation {
  cancelledBy: "customer" | "supplier" | "platform"
  reason: string
  feePence: number | null
  feePolicy: string | null
  lostEarningsPence: number
  scoreImpact: number
  disputeRisk: "low" | "medium" | "high"
  rescheduleEligibleUntil: string | null
  cancelledAt: string
}

export interface JobAddress {
  line1: string
  city: string
  postcode: string
  lat: number
  lng: number
}

export interface JobAuditEntry {
  at: string
  label: string
}

/** A single job — denormalised for the on-site UI. */
export interface SupplierJob {
  id: string
  ref: string
  title: string
  service: string
  status: JobStatus
  /** Derived bucket the job currently sits in. */
  tab: JobTab

  // Customer + property
  customerName: string
  customerPhone: string | null
  address: JobAddress
  keySafeCode: string | null
  accessNotes: string | null

  // Scheduling
  appointmentAt: string | null
  appointmentEndAt: string | null
  appointmentConfirmed: boolean
  reminderSent: boolean
  reminderScheduledAt: string | null
  travelMins: number | null
  travelMiles: number | null
  rescheduleRisk: "low" | "medium" | "high"

  // Route
  routePosition: number | null
  routeTotal: number | null

  // Progress / SLA
  progressPct: number
  onTrack: boolean
  startedAt: string | null
  onSiteAt: string | null
  slaDueAt: string | null

  // Money (pence)
  pricePence: number
  platformFeePct: number
  vatPct: number
  escrowStatus: EscrowStatus
  escrowPence: number
  payoutPaidAt: string | null

  // Evidence
  evidence: EvidenceItem[]
  evidenceFiles: JobEvidenceFile[]

  // Materials / notes / messages / sign-off
  materials: JobMaterial[]
  notes: JobNote[]
  messages: JobMessage[]
  signoffStatus: "none" | "requested" | "signed" | "declined"

  // Completion + rating
  completedAt: string | null
  rating: number | null
  reviewText: string | null
  repeatCustomer: boolean
  rebookChance: "low" | "medium" | "high"

  // Cancellation
  cancellation: JobCancellation | null

  // Audit
  audit: JobAuditEntry[]

  createdAt: string
  updatedAt: string
}

/** The async data envelope every tab consumes. */
export interface JobsData {
  data: SupplierJob[]
  loading: boolean
  error: string | null
  /** Where the rows came from — drives the seed/live banner. */
  source: "live" | "seed" | "empty"
  reload: () => void
}

// ── Derived helpers ──────────────────────────────────────────────────────────

export const REQUIRED_EVIDENCE_KEYS: EvidenceItemKey[] = [
  "before_photos",
  "after_photos",
  "completion_notes",
  "invoice",
  "customer_signoff",
]

export function evidenceComplete(job: SupplierJob): boolean {
  return job.evidence.filter((e) => e.required).every((e) => e.received)
}

export function evidenceReceivedCount(job: SupplierJob): number {
  return job.evidence.filter((e) => e.received).length
}

export function evidencePct(job: SupplierJob): number {
  if (job.evidence.length === 0) return 0
  return Math.round((evidenceReceivedCount(job) / job.evidence.length) * 100)
}

export function materialsReadyCount(job: SupplierJob): number {
  return job.materials.filter((m) => m.status === "ready" || m.status === "used").length
}

/** Net payout = price − platform fee, plus VAT on the net (mirrors UI breakdown). */
export interface PayoutBreakdown {
  pricePence: number
  platformFeePence: number
  netPence: number
  vatPence: number
  totalPayoutPence: number
}

export function payoutBreakdown(job: SupplierJob): PayoutBreakdown {
  const platformFeePence = Math.round(job.pricePence * (job.platformFeePct / 100))
  const netPence = job.pricePence - platformFeePence
  const vatPence = Math.round(netPence * (job.vatPct / 100))
  return {
    pricePence: job.pricePence,
    platformFeePence,
    netPence,
    vatPence,
    totalPayoutPence: netPence + vatPence,
  }
}
