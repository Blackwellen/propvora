// ============================================================================
// Booking domain barrel — P4 reservation engine + booking data model.
//
// Operator-side reads/writes are workspace-scoped via RLS on workspace_members.
// Public/anon guest checkout goes through createPublicReservation() →
// the SECURITY DEFINER `create_public_reservation` RPC, which validates
// availability and recomputes price server-side (no service-role key needed in
// the frontend). See migration 20260616080000_booking_reservations.sql.
// ============================================================================

export * from "./pricing"
export * from "./availability"
export * from "./rates"
export * from "./reservations"
export * from "./booking-listings"
export * from "./pricing-profiles"
export * from "./public"
export * from "./portal"

// pricing-engine re-exported under explicit names to avoid colliding with the
// legacy `pricing.ts` quoteStay/StayQuote symbols. The deep engine is the
// production path; import these for booking_listings-backed quoting.
export {
  computeQuote,
  quoteStay as quoteListingStay,
  getPricingProfile,
  getPriceRules,
  getDayOverrides,
} from "./pricing-engine"
export type {
  PricingProfile,
  PriceRule,
  PriceRuleType,
  PriceAdjustKind,
  DayOverride,
  QuoteArgs,
  QuoteNightLine,
  QuoteLine,
  StayQuote as ListingStayQuote,
  QuoteStayArgs as ListingQuoteStayArgs,
} from "./pricing-engine"
