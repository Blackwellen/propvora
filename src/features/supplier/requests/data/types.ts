/* ──────────────────────────────────────────────────────────────────────────
   Supplier → Requests sales-pipeline domain types.

   The Requests section is a 5-stage pipeline driven off two parent tables
   (supplier_requests + supplier_quotes) and four child tables
   (supplier_request_files, supplier_request_messages, supplier_quote_versions,
   supplier_quote_line_items). These types are the UI-facing shapes the hooks
   normalise the (42P01-safe) Supabase reads — and the rich seed — into.
─────────────────────────────────────────────────────────────────────────── */

export type RequestTab = "new" | "quoted" | "won" | "lost" | "archived"

export const REQUEST_TABS: RequestTab[] = ["new", "quoted", "won", "lost", "archived"]

export type Urgency = "low" | "standard" | "high" | "emergency"

export type QuoteStatus =
  | "awaiting"
  | "revision_requested"
  | "expiring"
  | "accepted"
  | "withdrawn"
  | "expired"

export type EscrowStatus = "funded" | "pending" | "none"

export type LossReason =
  | "price_too_high"
  | "competitor_chosen"
  | "no_response"
  | "no_coverage"
  | "other"

export type Outcome = "won" | "lost"

/** A data envelope every hook returns — drives loading / empty / error / source. */
export interface RequestsEnvelope<T> {
  data: T
  loading: boolean
  error: string | null
  /** 'live' = from Supabase, 'seed' = 42P01-safe demo fallback. */
  source: "live" | "seed"
  /** True when the underlying table/relation is missing (permission/42P01). */
  permissionDenied: boolean
  reload: () => void
}

export interface RequestFile {
  id: string
  fileName: string
  kind: "photo" | "document"
  status: string
  uploadedAt: string | null
}

export interface RequestMessage {
  id: string
  authorRole: "supplier" | "customer"
  authorName: string
  body: string
  createdAt: string | null
}

export interface QuoteVersion {
  id: string
  version: number
  label: string
  amountPence: number | null
  totalIncVatPence: number | null
  status: string
  note: string | null
  createdAt: string | null
}

export interface QuoteLineItem {
  id: string
  description: string
  quantity: number
  unitPricePence: number | null
  lineTotalPence: number | null
}

export interface PropertyDetails {
  type: string | null
  year: number | null
  tenure: string | null
  heating: string | null
  bedrooms: number | null
  units: number | null
  address: string | null
}

/** Quote recommendation block shown on the New-tab detail panel. */
export interface QuoteRecommendation {
  suggestedPricePence: number | null
  marginEstPct: number | null
  winProbabilityPct: number | null
  /** "why this is a good fit" checks. */
  fitChecks: { label: string; ok: boolean }[]
}

/** The unified pipeline row — a request, optionally with its quote. */
export interface PipelineRequest {
  id: string
  ref: string
  tab: RequestTab
  // Requester / customer
  requesterCompany: string
  requesterVerified: boolean
  customerName: string | null
  customerReturning: boolean
  // Service + property
  serviceTitle: string
  scopeSummary: string
  scopeBullets: string[]
  property: PropertyDetails
  // Commercials
  urgency: Urgency
  budgetMinPence: number | null
  budgetMaxPence: number | null
  withinCoverage: boolean
  winScore: number // 0-100
  // Dates
  createdAt: string | null
  dueAt: string | null
  // Docs
  files: RequestFile[]
  docsRequired: number
  // Quote (present once quoted / won / lost)
  quoteId: string | null
  quoteStatus: QuoteStatus | null
  quoteAmountPence: number | null
  quoteIncVatPence: number | null
  quoteSentAt: string | null
  quoteExpiresAt: string | null
  winChance: number | null // 0-100
  followUpAt: string | null
  versions: QuoteVersion[]
  lineItems: QuoteLineItem[]
  messages: RequestMessage[]
  recommendation: QuoteRecommendation
  // Won
  wonValuePence: number | null
  acceptedAt: string | null
  escrow: EscrowStatus
  nextStep: string | null
  scheduleReady: boolean
  // Lost
  lostAt: string | null
  lostValuePence: number | null
  lossReason: LossReason | null
  recoverable: boolean
  notes: string | null
  // Archived
  archivedAt: string | null
  archiveReason: string | null
  outcome: Outcome | null
  reactivationUntil: string | null
}

export interface RequestsKpi {
  label: string
  value: string
  sub?: string
}
