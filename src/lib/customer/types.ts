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
}
