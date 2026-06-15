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
} from "./listings"
export type {
  ListingStatus,
  MarketplaceListing,
  MarketplaceListingMedia,
  CreateListingInput,
  UpdateListingInput,
  ListListingsOptions,
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
  CommissionLedgerEntry,
  CreateTransactionArgs,
  CreateTransactionResult,
  Result as TransactionResult,
} from "./transactions"
