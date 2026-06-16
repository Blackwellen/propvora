// ============================================================================
// Marketplace shared types — the unified vocabulary for the commerce kernel.
//
// `MarketplaceTransactionType` (the 5 fee-bearing kinds) lives in ./fees and is
// re-exported here. `ListingType` is the finer-grained 17-value discovery
// taxonomy that maps DOWN to a transaction type for fee resolution.
// ============================================================================

import type { MarketplaceTransactionType } from "./fees"

export type { MarketplaceTransactionType }

/** The 17-value unified listing taxonomy (mirrors the DB CHECK constraint). */
export type ListingType =
  | "property_stay"
  | "serviced_accommodation"
  | "holiday_let"
  | "mid_term_stay"
  | "student_room"
  | "hmo_room"
  | "co_living_room"
  | "commercial_space"
  | "supplier_service"
  | "supplier_package"
  | "emergency_service"
  | "utility_setup"
  | "move_in_logistics"
  | "cleaning_turnover"
  | "maintenance_callout"
  | "compliance_service"
  | "professional_service"

/**
 * Map a fine-grained {@link ListingType} to the fee-bearing
 * {@link MarketplaceTransactionType} used by the fee engine + the
 * `marketplace_transactions.transaction_type` CHECK. Pure + exported for reuse.
 */
export function transactionTypeForListing(
  listingType: ListingType
): MarketplaceTransactionType {
  switch (listingType) {
    case "property_stay":
    case "serviced_accommodation":
    case "holiday_let":
    case "mid_term_stay":
    case "student_room":
    case "hmo_room":
    case "co_living_room":
    case "commercial_space":
      return "stay_booking"
    case "emergency_service":
    case "maintenance_callout":
      return "emergency_job"
    case "supplier_package":
    case "compliance_service":
      return "service_package"
    case "utility_setup":
    case "move_in_logistics":
    case "cleaning_turnover":
    case "supplier_service":
    case "professional_service":
    default:
      return "supplier_job"
  }
}

/** Tolerant data-access result. `error` is a short code, never a throw. */
export interface Result<T> {
  data: T | null
  error: string | null
}

/** Postgres / PostgREST codes meaning "not provisioned yet" → tolerate. */
export const NOT_PROVISIONED_CODES = new Set([
  "42P01", // undefined_table
  "42703", // undefined_column
  "PGRST202", // RPC not found
  "PGRST204", // column not found in schema cache
  "PGRST205", // table not found in schema cache
])

/** True when an error is "relation/function does not exist" (unmigrated). */
export function isMissingObject(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED_CODES.has(e.code)) return true
  return /does not exist|not provisioned/i.test(e.message ?? "")
}

/** Normalise any thrown/returned error into a short string code. */
export function toErrorMessage(err: unknown): string {
  if (isMissingObject(err)) return "marketplace_unavailable"
  const e = err as { message?: string } | null
  return e?.message ?? "marketplace_error"
}
