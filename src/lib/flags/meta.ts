import { V2_FLAG_KEYS, type V2FlagKey } from "./registry"

/**
 * Grouping + governance metadata for the admin feature-flag manager.
 *
 * Kept separate from the pure `registry.ts` (which stays I/O-free and importable
 * anywhere). This maps each flag to its release STAGE, product MODULE, change
 * RISK and parent dependency so the admin console can group, warn and gate.
 */

export type FlagStage = "V1" | "Ops" | "V1.5" | "V2"
export type FlagRisk = "low" | "medium" | "high"
export type FlagModule =
  | "Platform"
  | "Portals"
  | "Auth"
  | "Marketplace"
  | "Booking"
  | "Customer"
  | "Supplier"
  | "Accounting"
  | "Automation"
  | "Global"

export interface FlagMeta {
  stage: FlagStage
  module: FlagModule
  risk: FlagRisk
  /** Parent flag that must be ON for this flag to be effective. */
  parent?: V2FlagKey
}

export const FLAG_META: Record<V2FlagKey, FlagMeta> = {
  contextEngine:        { stage: "Ops",  module: "Platform",    risk: "high" },
  marketplaceEnabled:   { stage: "V2",   module: "Marketplace", risk: "high" },
  marketplaceStays:     { stage: "V2",   module: "Marketplace", risk: "medium", parent: "marketplaceEnabled" },
  marketplaceSuppliers: { stage: "V2",   module: "Marketplace", risk: "medium", parent: "marketplaceEnabled" },
  marketplaceEmergency: { stage: "V2",   module: "Marketplace", risk: "high",   parent: "marketplaceEnabled" },
  marketplacePayments:  { stage: "V2",   module: "Marketplace", risk: "high",   parent: "marketplaceEnabled" },
  marketplaceEscrow:    { stage: "V2",   module: "Marketplace", risk: "high",   parent: "marketplacePayments" },
  marketplaceDisputes:  { stage: "V2",   module: "Marketplace", risk: "medium", parent: "marketplacePayments" },
  bookingManagement:    { stage: "V2",   module: "Booking",     risk: "medium" },
  directBookingPages:   { stage: "V1.5", module: "Booking",     risk: "medium" },
  customerWorkspace:    { stage: "V2",   module: "Customer",    risk: "high" },
  supplierWorkspace:    { stage: "V2",   module: "Supplier",    risk: "high" },
  icalSync:             { stage: "V1.5", module: "Booking",     risk: "low" },
  canvasLite:           { stage: "V1.5", module: "Automation",  risk: "medium" },
  multiCountryPortfolio:{ stage: "V2",   module: "Global",      risk: "medium" },
  globalCountryPacks:   { stage: "V1",   module: "Global",      risk: "low" },
  accountingGl:         { stage: "V2",   module: "Accounting",  risk: "high" },
  automationsFull:      { stage: "V2",   module: "Automation",  risk: "high",   parent: "canvasLite" },
  portalTenant:         { stage: "V1",   module: "Portals",     risk: "low" },
  portalLandlord:       { stage: "V1",   module: "Portals",     risk: "low" },
  portalSupplier:       { stage: "V1",   module: "Portals",     risk: "low" },
  registrationCustomer: { stage: "V2",   module: "Auth",        risk: "medium", parent: "customerWorkspace" },
  registrationSupplier: { stage: "V2",   module: "Auth",        risk: "medium", parent: "supplierWorkspace" },
  affiliateEnabled:     { stage: "V1",   module: "Platform",    risk: "low" },
  sellerVerificationRequired: { stage: "V2", module: "Marketplace", risk: "high", parent: "marketplaceEnabled" },
  legalSection:              { stage: "V1",   module: "Platform",    risk: "low" },
  planningEnabled:           { stage: "V1",   module: "Platform",    risk: "low" },
}

export function flagMeta(key: V2FlagKey): FlagMeta {
  return FLAG_META[key]
}

/** Display order for stage sections in the admin console. */
export const STAGE_ORDER: FlagStage[] = ["V1", "Ops", "V1.5", "V2"]

/** Display order for module sub-groups. */
export const MODULE_ORDER: FlagModule[] = [
  "Platform", "Portals", "Auth", "Accounting", "Automation", "Booking",
  "Marketplace", "Customer", "Supplier", "Global",
]

export const STAGE_BLURB: Record<FlagStage, string> = {
  V1: "Live V1 operational kill-switches. ON by default — turn off only to disable a shipped surface (e.g. a portal) platform-wide.",
  Ops: "Infrastructure / platform behaviour. Changing these affects how the whole app routes and resolves context.",
  "V1.5": "Premium / near-term surfaces. Safe to stage on for beta cohorts once tested.",
  V2: "Future platform layers. Default OFF for V1 — turning these on lights up marketplace, customer, supplier-SaaS, GL and full automations.",
}

/** Flags grouped by stage → module, in canonical order. */
export function groupFlagsByStage(): { stage: FlagStage; modules: { module: FlagModule; keys: V2FlagKey[] }[] }[] {
  return STAGE_ORDER.map((stage) => {
    const keysInStage = V2_FLAG_KEYS.filter((k) => FLAG_META[k].stage === stage)
    const modules = MODULE_ORDER
      .map((module) => ({ module, keys: keysInStage.filter((k) => FLAG_META[k].module === module) }))
      .filter((m) => m.keys.length > 0)
    return { stage, modules }
  }).filter((s) => s.modules.length > 0)
}
