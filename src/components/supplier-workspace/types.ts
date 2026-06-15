/* ──────────────────────────────────────────────────────────────────────────
   Supplier-workspace shared types. These describe the SHAPES the pages consume
   from the sibling `/api/supplier/*` and `/api/marketplace/*` routes. They are
   intentionally permissive (most fields optional) because the API contracts are
   owned by other agents and may evolve — pages tolerate missing fields.
─────────────────────────────────────────────────────────────────────────── */

export interface SupplierProfile {
  id?: string
  business_name?: string
  trading_name?: string
  supplier_type?: string
  description_short?: string
  description_long?: string
  service_categories?: string[]
  emergency_categories?: string[]
  years_experience?: number
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
