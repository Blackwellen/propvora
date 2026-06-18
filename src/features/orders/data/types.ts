// Types for the PM Work > Orders section. An "order" is, in the data, a
// supplier_job_assignments row (operator_workspace_id = the PM workspace).
// All money is integer pence.

export type OrderMilestoneStatus =
  | "not_started" | "in_progress" | "awaiting_evidence" | "review" | "completed"
export type OrderEvidenceStatus = "missing" | "partial" | "submitted" | "approved"
export type OrderSlaStatus = "on_track" | "due_soon" | "at_risk" | "breached"
export type OrderRisk = "low" | "medium" | "high"
export type OrderStatus =
  | "assigned" | "accepted" | "in_progress" | "completed" | "cancelled"

export interface OrderRow {
  id: string
  orderRef: string
  propertyLabel: string
  location: string
  orderType: string
  supplierName: string
  supplierInitials: string
  scheduledDate: string | null
  escrowAmountPence: number
  fundedAmountPence: number
  milestoneStatus: OrderMilestoneStatus
  evidenceStatus: OrderEvidenceStatus
  slaStatus: OrderSlaStatus
  risk: OrderRisk
  status: OrderStatus
  // detail
  supplierRating?: number
  supplierPhone?: string
  supplierEmail?: string
  escrowState?: string
  completedDate?: string | null
  finalCostPence?: number
  payoutStatus?: string
  rating?: number
}

export interface OrderAttachment {
  id: string
  name: string
  kind: string
  sizeLabel: string
  uploadedAt: string
}

export interface OrderActivity {
  id: string
  kind: "status" | "note" | "evidence" | "dispute" | "schedule" | "release"
  text: string
  actor: string
  at: string
}

export interface OrderMilestone {
  id: string
  label: string
  status: "pending" | "in_progress" | "done"
  due?: string | null
  amountPence?: number
}

export interface QuoteRow {
  id: string
  supplierName: string
  supplierInitials: string
  priceExVatPence: number
  etaDays: number
  leadTimeLabel: string
  warrantyMonths: number
  insuranceCoverPence: number
  available: boolean
  responseHours: number
  coverageArea: string
  notes: string
  recommendation?: "best_match" | "best_value" | "lowest_price" | null
  status: "requested" | "quoted" | "accepted" | "declined" | "expired" | "withdrawn"
}

export interface RfqRow {
  id: string
  rfqRef: string
  title: string
  propertyLabel: string
  orderType: string
  quoteCount: number
  status: "open" | "comparing" | "approved" | "expired"
  createdAt: string
  bestPricePence: number
  savingsPence: number
}

export interface EscrowRow {
  id: string
  escrowId: string
  orderRef: string
  propertyLabel: string
  supplierName: string
  totalHeldPence: number
  fundedAmountPence: number
  releaseDate: string | null
  milestoneLabel: string
  milestoneProgress: number
  evidenceStatus: OrderEvidenceStatus
  hasDispute: boolean
  escrowState: string
  // detail
  payoutSplits?: PayoutSplit[]
  releaseConditions?: ReleaseCondition[]
}

export interface PayoutSplit {
  id: string
  splitType: "supplier_net" | "platform_fee" | "retention" | "tax" | "adjustment"
  label: string
  amountPence: number
  released: boolean
}

export interface ReleaseCondition {
  id: string
  key: string
  label: string
  required: boolean
  met: boolean
}

export interface CompletedOrderRow extends OrderRow {
  completedDate: string | null
  finalCostPence: number
  payoutStatus: "pending" | "paid" | "reversed"
  evidenceBundle: string
  rating: number
}

export interface OrdersKpis {
  active: number
  awaitingAcceptance: number
  inProgress: number
  atRisk: number
}
export interface QuotesKpis {
  pending: number
  awaitingComparison: number
  approved: number
  expired: number
  savingsPence: number
}
export interface EscrowKpis {
  fundsHeldPence: number
  releasingSoon: number
  evidencePending: number
  atRisk: number
}
export interface CompletedKpis {
  completedThisMonth: number
  paidOutPence: number
  avgCompletionDays: number
  ratedJobs: number
}
