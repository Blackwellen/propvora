/* ──────────────────────────────────────────────────────────────────────────
   Supplier-workspace shared types. These describe the SHAPES the pages consume
   from the sibling `/api/supplier/*` and `/api/marketplace/*` routes. They are
   intentionally permissive (most fields optional) because the API contracts are
   owned by other agents and may evolve — pages tolerate missing fields.
─────────────────────────────────────────────────────────────────────────── */

/**
 * Shape of the supplier_workspace_profiles row returned by /api/supplier/profile.
 * Column names match the live DB table exactly.
 * Legacy UI-only fields are kept as optional so pages that reference them still
 * compile — but they will always be undefined at runtime (they have no DB column).
 */
export interface SupplierProfile {
  /** workspace_id — PK */
  workspace_id?: string
  /** Public display / business name (DB: display_name) */
  display_name?: string
  /** Short bio / about text (DB: bio) */
  bio?: string
  /** Trade categories the supplier covers (DB: trades text[]) */
  trades?: string[]
  years_experience?: number
  insurance_verified?: boolean
  public_liability_cover_pence?: number | null
  service_radius_km?: number | null
  base_location?: string | null
  latitude?: number | null
  longitude?: number | null
  response_time_hours?: number | null
  accepts_emergency?: boolean
  /** Profile publish status: 'draft' | 'active' | 'paused' (DB: status) */
  status?: string
  created_at?: string
  updated_at?: string

  // ── Legacy / derived fields (not persisted in supplier_workspace_profiles) ──
  // These are populated by higher-level API aggregations or verification routes
  // and kept optional so existing UI code that reads them continues to compile.
  /** @deprecated Use display_name */
  business_name?: string
  trading_name?: string
  supplier_type?: string
  description_short?: string
  description_long?: string
  service_categories?: string[]
  emergency_categories?: string[]
  team_size?: number
  average_rating?: number
  reviews_count?: number
  completed_jobs_count?: number
  availability_status?: string
  marketplace_enabled?: boolean
  profile_visibility?: string
  insurance_status?: string
  licence_status?: string
  id_verification_status?: string
  onboarding_step?: string
  onboarding_complete?: boolean
}

export interface SupplierService {
  id?: string
  title?: string
  category?: string
  price_type?: string
  starting_price?: number | null
  fixed_price?: number | null
  currency?: string
  status?: string
  estimated_duration?: string
}

export interface SupplierCoverageArea {
  id?: string
  label?: string
  postcode?: string
  city?: string
  region?: string
  radius_miles?: number | null
  emergency?: boolean
}

export interface SupplierAvailabilityDay {
  day?: string
  enabled?: boolean
  start?: string
  end?: string
}

export interface SupplierQuoteRequest {
  id?: string
  reference?: string
  category?: string
  property_label?: string
  description?: string
  urgency?: string
  status?: string
  budget_min?: number | null
  budget_max?: number | null
  quote_deadline?: string | null
  created_at?: string
}

export interface SupplierJob {
  id?: string
  reference?: string
  title?: string
  category?: string
  property_label?: string
  status?: string
  scheduled_date?: string | null
  amount?: number | null
  currency?: string
  urgency?: string
  created_at?: string
  updated_at?: string
}

export interface SupplierJobEvent {
  id?: string
  status?: string
  note?: string
  created_at?: string
  actor?: string
}

export interface SupplierEarningsSummary {
  currency?: string
  total_earned?: number
  pending_payout?: number
  paid_out?: number
  in_escrow?: number
  platform_fee_total?: number
  jobs_paid?: number
  indicative?: boolean
}

export interface SupplierPaymentRow {
  id?: string
  job_reference?: string
  job_title?: string
  gross_amount?: number | null
  platform_fee_amount?: number | null
  payout_amount?: number | null
  currency?: string
  status?: string
  created_at?: string
}

export interface SupplierReview {
  id?: string
  author?: string
  rating?: number
  title?: string
  body?: string
  job_reference?: string
  created_at?: string
  reply?: string | null
}

export interface SupplierMarketplaceListing {
  id?: string
  title?: string
  category?: string
  status?: string
  price_type?: string
  starting_price?: number | null
  currency?: string
  views?: number
  leads?: number
  updated_at?: string
}

/* ── Deep-build shapes (match the new /api/supplier/* envelopes) ──────────── */

export interface SupplierLead {
  id: string
  source: "quote_request" | "enquiry"
  title: string
  detail: string | null
  status: string
  counterpartyName: string | null
  amountPence: number | null
  currency: string | null
  createdAt: string
  quoteId: string | null
  listingId: string | null
}

export interface SupplierPackageRow {
  id: string
  workspace_id: string
  name: string
  description: string | null
  price_pence: number | null
  currency: string
  duration_days: number | null
  inclusions: string[]
  exclusions: string[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierInvoiceRow {
  id: string
  workspace_id: string
  assignment_id: string | null
  invoice_number: string | null
  amount_pence: number | null
  currency: string
  status: string
  submitted_at: string | null
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
}

export interface SupplierInvoiceSummary {
  totalPence: number
  outstandingPence: number
  paidPence: number
  draftPence: number
  currency: string
}

export interface SupplierPayoutRow {
  id: string
  amount_pence: number
  currency: string
  status: string
  stripe_transfer_id: string | null
  created_at: string
}

export interface SupplierPayoutSummary {
  paidPence: number
  pendingPence: number
  failedPence: number
  count: number
  currency: string
}

export interface SupplierTeamRow {
  id: string
  user_id: string
  role: string
  created_at: string
  name: string | null
  email: string | null
}

export interface SupplierAssignmentRow {
  id: string
  quote_id: string | null
  operator_workspace_id: string
  supplier_workspace_id: string
  job_id: string | null
  status: string
  scheduled_for: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface SupplierEvidenceRow {
  id: string
  assignment_id: string
  phase: "before" | "during" | "after"
  r2_key: string
  file_name: string | null
  content_type: string | null
  size_bytes: number | null
  caption: string | null
  created_at: string
  url?: string
}

export interface SupplierDisputeRow {
  id: string
  assignment_id: string
  raised_by_side: string
  category: string
  subject: string
  detail: string | null
  status: string
  resolution: string | null
  created_at: string
}

export interface SupplierVerificationBadge {
  key: string
  label: string
  active: boolean
}

export interface SupplierVerificationSummary {
  exists: boolean
  level: number
  levelLabel: string
  status: string
  badges: SupplierVerificationBadge[]
  documentCheckStatus: string
  selfieCheckStatus: string
  manualReviewStatus: string
  hasValidInsurance: boolean
  hasValidLicence: boolean
  insuranceExpiringSoon: boolean
  licenceExpiringSoon: boolean
  expiresAt: string | null
  updatedAt: string | null
}

export interface SupplierInsuranceRow {
  id: string
  insurance_type: string
  provider: string | null
  policy_number_masked: string | null
  coverage_amount_pence: number | null
  valid_from: string | null
  valid_to: string | null
  minimum_cover_met: boolean
  status: string
  expired: boolean
}

export interface SupplierLicenceRow {
  id: string
  licence_type: string
  issuing_body: string | null
  licence_number_masked: string | null
  country: string | null
  region: string | null
  valid_from: string | null
  valid_to: string | null
  required_for_categories: string[]
  status: string
  expired: boolean
}

export interface SupplierDashboardKpis {
  openLeads: number
  activeJobs: number
  unscheduledJobs: number
  completedJobs: number
  payoutsPendingPence: number
  payoutsPaidPence: number
  invoicesOutstandingPence: number
  invoicesCurrency: string
  verificationLevel: number
  verificationLabel: string
  hasValidInsurance: boolean
  insuranceExpiringSoon: boolean
  licenceExpiringSoon: boolean
  status: string
  currency: string
  /** Pence earned in the current calendar month (paid invoices). */
  monthlyEarningsPence: number
  /** 0–100 — proportion of quote requests responded to in last 30 days. */
  responseRatePct: number
  /** 0.0–5.0 average from supplier_reviews (null if no reviews). */
  avgReviewScore: number | null
}

export interface SupplierCalendarEntry {
  date: string       // YYYY-MM-DD
  label: string
  href: string
  status: string
}

export interface SupplierRecentLead {
  id: string
  title: string
  source: "quote_request" | "enquiry"
  status: string
  amountPence: number | null
  currency: string | null
  createdAt: string
  quoteId: string | null
}
