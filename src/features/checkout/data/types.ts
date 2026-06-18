// ============================================================================
// Checkout — shared types for the four checkout flows.
// Money is INTEGER PENCE everywhere. These mirror the columns in
// supabase/migrations/20260617212000_checkout.sql.
// ============================================================================

export type CheckoutType = "booking" | "service" | "emergency" | "quote_request"

export type CheckoutSessionStatus =
  | "draft"
  | "pending_payment"
  | "processing"
  | "confirmed"
  | "dispatched"
  | "requested"
  | "failed"
  | "cancelled"
  | "expired"

export type PaymentMethodType = "card" | "apple_pay" | "google_pay" | "bank_transfer"

export type PaymentAttemptStatus =
  | "requires_payment"
  | "authorized"
  | "held"
  | "captured"
  | "released"
  | "refunded"
  | "failed"
  | "cancelled"

export type DispatchStage =
  | "request_sent"
  | "provider_accepted"
  | "en_route"
  | "on_site"
  | "completed"

export type PreferredContact = "call" | "text" | "whatsapp"
export type SiteVisit = "none" | "virtual" | "on_site"
export type Urgency = "flexible" | "soon" | "urgent"

/** Where the hook got its data from — live DB or the bundled seed fallback. */
export type DataSource = "supabase" | "seed"

export interface AsyncData<T> {
  data: T | null
  loading: boolean
  error: string | null
  source: DataSource
  reload: () => void
}

export interface CheckoutSession {
  id: string
  workspace_id: string
  checkout_type: CheckoutType
  reference_type: string | null
  reference_id: string | null
  status: CheckoutSessionStatus
  currency: string
  total_due_now_pence: number
  contact_email: string | null
  expires_at: string | null
  metadata_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CheckoutLineItem {
  id: string
  checkout_session_id: string
  kind: "base" | "extra" | "add_on" | "fee" | "discount" | "deposit" | "tax"
  label: string
  quantity: number
  unit_amount_pence: number
  amount_pence: number
  currency: string
  selected: boolean
}

export interface CheckoutPaymentMethod {
  id: string
  checkout_session_id: string
  method_type: PaymentMethodType
  brand: string | null
  last4: string | null
  exp_label: string | null
  is_default: boolean
}

export interface CheckoutPriceBreakdown {
  id: string
  checkout_session_id: string
  subtotal_pence: number
  cleaning_fee_pence: number
  service_fee_pence: number
  platform_fee_pence: number
  vat_pence: number
  vat_rate_bps: number
  discount_pence: number
  deposit_hold_pence: number
  total_due_now_pence: number
  total_full_pence: number
  estimate_low_pence: number | null
  estimate_high_pence: number | null
  currency: string
  promo_code: string | null
}

export interface CheckoutGuestDetails {
  full_name: string | null
  email: string | null
  phone: string | null
  guests_count: number | null
  check_in: string | null
  check_out: string | null
  arrival_notes: string | null
  special_requests: string | null
  billing_same_as_contact: boolean
  billing_line1: string | null
  billing_city: string | null
  billing_postcode: string | null
  billing_country: string | null
}

export interface CheckoutServiceDetails {
  supplier_name: string | null
  service_name: string | null
  service_scope: string | null
  appointment_at: string | null
  property_address: string | null
  access_details: string | null
  contact_name: string | null
  contact_phone: string | null
  service_notes: string | null
  appointment_confirmed: boolean
}

export interface CheckoutEmergencyDetails {
  provider_name: string | null
  response_time_label: string | null
  coverage_area: string | null
  property_address: string | null
  issue_details: string | null
  access_notes: string | null
  live_phone: string | null
  emergency_contact: string | null
  preferred_contact: PreferredContact
  acceptance_deadline: string | null
  dispatch_stage: DispatchStage
}

export interface CheckoutQuoteRequestDetails {
  supplier_name: string | null
  service_type: string | null
  service_description: string | null
  property_address: string | null
  preferred_date: string | null
  preferred_time: string | null
  flexibility: string | null
  budget_low_pence: number | null
  budget_high_pence: number | null
  urgency: Urgency
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  message: string | null
  site_visit: SiteVisit
}

/** Booking property summary (read from the originating booking record). */
export interface BookingPropertySummary {
  property_name: string
  location: string
  image_url: string | null
  nightly_pence: number
  nights: number
  rating: number | null
  reviews_count: number | null
}

/** Service supplier summary card. */
export interface ServiceSupplierSummary {
  logo_url: string | null
  avatar_url: string | null
  rating: number | null
  reviews_count: number | null
  vetted: boolean
}

/** Optional priced extras / add-ons offered on a session. */
export interface CheckoutAddOn {
  id: string
  label: string
  amount_pence: number
  selected: boolean
}

/** The full bundle a checkout screen needs. */
export interface CheckoutBundle {
  session: CheckoutSession
  breakdown: CheckoutPriceBreakdown
  lineItems: CheckoutLineItem[]
  paymentMethods: CheckoutPaymentMethod[]
  addOns: CheckoutAddOn[]
  guest?: CheckoutGuestDetails
  service?: ServiceDetailsBundle
  emergency?: CheckoutEmergencyDetails
  quoteRequest?: CheckoutQuoteRequestDetails
  property?: BookingPropertySummary
  supplier?: ServiceSupplierSummary
}

export type ServiceDetailsBundle = CheckoutServiceDetails
