// Marketplace lib barrel. Re-exports the DB-driven fee calculator (P1), the
// listings CRUD (P2) and the commerce-kernel transactions (P2).
// Consumers should import from "@/lib/marketplace".

// ── P1: fees ────────────────────────────────────────────────────────────────
export {
  calculateMarketplaceFee,
  computeFee,
  resolveFeeRule,
  FALLBACK_FEE_PERCENT,
} from "./fees"
export type {
  CalculateMarketplaceFeeArgs,
  FeeBreakdown,
  MarketplaceFeeRule,
  MarketplaceTransactionType,
} from "./fees"

// ── Shared types ────────────────────────────────────────────────────────────
export { transactionTypeForListing, isMissingObject, toErrorMessage } from "./types"
export type { ListingType, Result } from "./types"

// ── P2: listings ──────────────────────────────────────────────────────────────
export {
  createListing,
  updateListing,
  publishListing,
  pauseListing,
  archiveListing,
  attachListingMedia,
  getListing,
  listWorkspaceListings,
  setListingCategories,
  setListingAvailability,
  setListingPricing,
} from "./listings"
export type {
  ListingStatus,
  MarketplaceListing,
  MarketplaceListingMedia,
  CreateListingInput,
  UpdateListingInput,
  ListListingsOptions,
  ListingAvailabilityInput,
  ListingPricingInput,
  Result as ListingResult,
} from "./listings"

// ── P2: transactions (commerce kernel) ────────────────────────────────────────
export {
  createMarketplaceTransaction,
  getTransaction,
  transitionTransactionStatus,
  isAllowedTransition,
} from "./transactions"
export type {
  TransactionStatus,
  MarketplaceTransaction,
  MarketplaceOrder,
  CommissionLedgerEntry,
  CreateTransactionArgs,
  CreateTransactionResult,
  Result as TransactionResult,
} from "./transactions"

// ── P2: orders (fulfilment) ───────────────────────────────────────────────────
export {
  listOrders,
  getOrder,
  transitionOrderStatus,
  isAllowedOrderTransition,
} from "./orders"
export type { OrderStatus, OrderSide, ListOrdersOptions } from "./orders"

// ── Read-side search (FTS) ────────────────────────────────────────────────────
export { searchListings, recordSearchEvent } from "./search"
export type { PublicListing, SearchListingsParams, SearchListingsResult } from "./search"
