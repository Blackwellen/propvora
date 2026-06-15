// Marketplace lib barrel. Re-exports the DB-driven fee calculator (phase P1).
// Consumers (P2 transactions, P5 payments) should import from "@/lib/marketplace".
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
