// Shared client/server types for the public booking checkout. These mirror the
// API contracts in /api/booking/* so the client and the routes agree on shape.

export interface QuoteLineItem {
  label: string
  amountPence: number
  detail?: string
}

export interface QuoteBreakdown {
  listingId: string
  currency: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  nightlyPence: number
  lineItems: QuoteLineItem[]
  totalPence: number
  cleaningFeePence: number
  ready: boolean
}

/** The browse-safe published listing shape the public page renders. */
export interface PublicListingView {
  id: string
  title: string
  description: string | null
  currency: string
  basePricePence: number | null
  location: string | null
  images: string[]
  maxGuests: number | null
  countryCode: string | null
}

/** Successful reserve response. Payment is NOT taken (P5) — held only. */
export interface ReserveResult {
  ok: true
  reference: string | null
  reservationId: string | null
  status: string
  held: boolean
  currency: string
  totalPence: number
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  listingTitle: string | null
}
