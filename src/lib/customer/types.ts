// ============================================================================
// Customer WORKSPACE — shared types (P7).
//
// The buyer/guest-side workspace: profile, saved listings (favourites),
// bookings (the customer's own stays) and marketplace orders (buyer side of
// marketplace_transactions). Money is integer pence; formatted at the edge.
// ============================================================================

export interface CustomerProfile {
  workspace_id: string
  display_name: string | null
  email: string | null
  phone: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CustomerProfileInput = Partial<
  Pick<CustomerProfile, "display_name" | "email" | "phone" | "preferences">
>

/** A favourited marketplace listing, joined to a thin listing summary. */
export interface SavedListing {
  id: string
  listing_id: string
  created_at: string
  listing: ListingSummary | null
}

/** Thin, public-shaped projection of a marketplace listing. */
export interface ListingSummary {
  id: string
  title: string | null
  company_name: string | null
  listing_type: string | null
  category: string | null
  location: string | null
  location_city: string | null
  currency: string
  base_price_pence: number | null
  price: number | null
  price_unit: string | null
  images: string[] | null
  status: string | null
}

/** The customer's own stay (read from `bookings`). */
export interface CustomerBooking {
  id: string
  listing_id: string | null
  booking_listing_id: string | null
  property_id: string | null
  booking_ref: string | null
  guest_name: string | null
  guest_email: string | null
  check_in: string | null
  check_out: string | null
  nights: number | null
  guests_count: number | null
  currency: string
  subtotal_pence: number | null
  fees_pence: number | null
  deposit_pence: number | null
  total_pence: number | null
  status: string
  payment_status: string | null
  arrival_time: string | null
  source: string | null
  created_at: string
  /** Joined stay title, when the booking is backed by a booking_listing. */
  listing_title?: string | null
  listing_slug?: string | null
  listing_type?: string | null
  let_type?: string | null
}

/** A marketplace order — the BUYER side of a marketplace_transaction. */
export interface CustomerOrder {
  id: string
  listing_id: string | null
  transaction_type: string | null
  gross_pence: number | null
  platform_fee_pence: number | null
  currency: string
  status: string
  created_at: string
  listing: ListingSummary | null
}

/** A message thread visible to the customer (their workspace). */
export interface CustomerThread {
  id: string
  title: string | null
  type: string | null
  updated_at: string | null
  created_at: string | null
  last_message: string | null
  last_sender: string | null
  last_at: string | null
  booking_id?: string | null
  unread?: number
}

/** A single message inside a customer thread. */
export interface CustomerMessage {
  id: string
  thread_id: string
  sender_role: "customer" | "host" | "system"
  sender_name: string | null
  body: string
  created_at: string
}

/** A guest notification (booking confirmed, payment due, check-in, review, message). */
export interface CustomerNotification {
  id: string
  kind: string
  title: string
  body: string | null
  href: string | null
  severity: "info" | "success" | "warning" | "critical"
  entity_type: string | null
  entity_id: string | null
  read_at: string | null
  created_at: string
}

/** A saved stay search the guest can re-run. */
export interface CustomerSavedSearch {
  id: string
  label: string
  query: Record<string, unknown>
  created_at: string
}

/** Rich detail for a booking_listing, surfaced on the trip detail page. */
export interface CustomerListingDetail {
  id: string
  title: string | null
  summary: string | null
  description: string | null
  listing_type: string | null
  max_guests: number | null
  bedrooms: number | null
  beds: number | null
  bathrooms: number | null
  amenities: string[]
  house_rules: string[]
  check_in_window: string | null
  checkout_time: string | null
  cancellation_policy: string | null
  country_code: string | null
  timezone: string | null
}

/** A guest-facing legal/policy document (booking terms, house rules, cancellation…). */
export interface CustomerLegalDoc {
  slug: string
  title: string
  version: string
  jurisdiction: string | null
  /** Whether the guest has accepted this document version for this booking. */
  accepted: boolean
  accepted_at: string | null
}

/** A receipt / payment line for the guest's payments page. */
export interface CustomerReceipt {
  id: string
  booking_ref: string | null
  booking_id: string
  title: string | null
  check_in: string | null
  check_out: string | null
  total_pence: number | null
  deposit_pence: number | null
  currency: string
  status: string
  payment_status: string | null
  created_at: string
}

/** Compact "your stays" rollup for the dashboard / profile summary chart. */
export interface CustomerStaySummary {
  total_stays: number
  completed_stays: number
  upcoming_stays: number
  total_nights: number
  total_spend_pence: number
  currency: string
  /** Spend per month (last 6 months with stays), for a tiny bar chart. */
  by_month: { month: string; nights: number; spend_pence: number }[]
}
