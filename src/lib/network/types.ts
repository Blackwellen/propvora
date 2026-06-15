// CROSS-CUTTING — PARTNER NETWORK + UNIFIED ACTIVITY · shared types.
//
// Pure types only (no runtime, no server-only) so both server data layers and
// client islands can import them freely.

/** The kind of relationship the OWNING workspace has with a partner. */
export type RelationshipType =
  | "supplier"            // partner supplies the owner (owner is operator)
  | "operator"            // partner is an operator the owner works for/with
  | "customer"            // partner is a booking customer of the owner
  | "marketplace_seller"  // owner bought from partner
  | "marketplace_buyer"   // owner sold to partner

export type RelationshipStatus = "active" | "pending" | "ended"

/** A cached, directed relationship-graph edge owned by a single workspace. */
export interface PartnerRelationship {
  id: string
  workspaceId: string
  partnerWorkspaceId: string
  partnerName: string | null
  partnerType: string | null            // workspaces.workspace_type/type of the partner
  relationshipType: RelationshipType
  status: RelationshipStatus
  firstInteractionAt: string | null
  lastInteractionAt: string | null
  interactionCount: number
}

/** A coarse grouping used by the network overview UI. */
export type PartnerGroupKey = "suppliers" | "operators" | "customers" | "marketplace"

export interface PartnerGroup {
  key: PartnerGroupKey
  label: string
  partners: PartnerRelationship[]
}

export interface PartnerSummary {
  totalPartners: number
  suppliers: number
  operators: number
  customers: number
  marketplaceCounterparties: number
  activeCount: number
  pendingCount: number
  totalInteractions: number
}

export interface PartnerListResult {
  /** True when the partner_relationships table is provisioned. */
  ready: boolean
  groups: PartnerGroup[]
  summary: PartnerSummary
}

export interface PartnerDetail {
  ready: boolean
  relationship: PartnerRelationship | null
}

// ── Unified cross-module activity ────────────────────────────────────────────

/** Which v2 module an activity item originated from. */
export type ActivityModule =
  | "marketplace"
  | "booking"
  | "supplier"
  | "payout"
  | "dispute"
  | "kyc"
  | "risk"
  | "audit"

export type ActivitySeverity = "info" | "success" | "warning" | "critical"

/** A single normalised, time-ordered activity event the workspace is party to. */
export interface ActivityItem {
  id: string                    // module-prefixed, stable id
  module: ActivityModule
  type: string                  // module-specific event key (e.g. "transaction.completed")
  title: string                 // human one-line summary
  detail?: string | null
  timestamp: string             // ISO; the sort key
  refType: string               // e.g. "marketplace_transaction", "booking"
  refId: string | null
  severity: ActivitySeverity
}

export interface ActivityResult {
  /** True when at least one source module is provisioned (best-effort). */
  ready: boolean
  items: ActivityItem[]
  /** Modules that actually returned rows / were queryable. */
  availableModules: ActivityModule[]
}

export const ACTIVITY_MODULE_META: Record<ActivityModule, { label: string }> = {
  marketplace: { label: "Marketplace" },
  booking: { label: "Bookings" },
  supplier: { label: "Suppliers" },
  payout: { label: "Payouts" },
  dispute: { label: "Disputes" },
  kyc: { label: "Identity / KYC" },
  risk: { label: "Risk" },
  audit: { label: "Audit" },
}

export const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
  supplier: "Supplier",
  operator: "Operator",
  customer: "Customer",
  marketplace_seller: "Marketplace seller",
  marketplace_buyer: "Marketplace buyer",
}
