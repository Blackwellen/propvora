/* ──────────────────────────────────────────────────────────────────────────
   Propvora Marketplace UI primitives (P2 substrate).

   Premium, light-token-only building blocks for the marketplace browse,
   detail and management surfaces. Money is integer pence end-to-end; only
   PriceTag/formatPence humanise at the edge. Mobile has dedicated branches
   (ListingCardMobile, MobileFilterSheet wiring) — not reflowed desktop markup.
─────────────────────────────────────────────────────────────────────────── */

export {
  type MarketListing,
  type OwnListing,
  type OwnListingStatus,
  type SearchResponse,
  normaliseListing,
  normaliseOwn,
  normaliseSearchResponse,
} from "./types"

export {
  CATEGORIES,
  TRANSACTION_TYPES,
  COUNTRY_OPTIONS,
  categoryMeta,
  transactionTypeMeta,
  prettify,
  type CategoryMeta,
  type TransactionTypeMeta,
} from "./taxonomy"

export { PriceTag, formatPence } from "./PriceTag"
export { TransactionTypeBadge } from "./TransactionTypeBadge"
export { TrustBadge, type TrustKind } from "./TrustBadge"
export { ReviewStars } from "./ReviewStars"
export { MarketplaceEmptyState } from "./MarketplaceEmptyState"
export { ListingCard, type ListingCardProps } from "./ListingCard"
export { ListingCardMobile } from "./ListingCardMobile"
export { ListingGrid } from "./ListingGrid"
export { CategoryNav } from "./CategoryNav"
export { FilterBar, type MarketplaceFilters } from "./FilterBar"
export { ListingDetail, type ListingDetailProps } from "./ListingDetail"
