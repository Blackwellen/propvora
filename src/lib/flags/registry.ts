/**
 * v2 FEATURE-FLAG REGISTRY
 * ------------------------
 * A single typed catalogue of every Propvora v2 flag (context engine,
 * combined marketplace, workspace types, booking, global packs …).
 *
 * EVERYTHING DEFAULTS OFF. With all of these flags off the app must look and
 * behave exactly as V1 does today — these flags only ever ADD surface area when
 * explicitly turned on (per-workspace override or a global platform flag row).
 *
 * The registry is pure data + types. The accessor that actually reads the
 * `platform_feature_flags` table (with workspace overrides) lives in
 * `./index.ts`. Keep this file free of I/O so it can be imported anywhere
 * (client, server, edge) without pulling in Supabase.
 */

/** Canonical list of v2 feature flag keys (camelCase identifiers). */
export const V2_FLAG_KEYS = [
  "contextEngine",
  "marketplaceEnabled",
  "marketplaceStays",
  "marketplaceSuppliers",
  "marketplaceEmergency",
  "marketplacePayments",
  "marketplaceEscrow",
  "marketplaceDisputes",
  "bookingManagement",
  "directBookingPages",
  "customerWorkspace",
  "supplierWorkspace",
  "icalSync",
  "canvasLite",
  "multiCountryPortfolio",
  "globalCountryPacks",
  "accountingGl",
  "automationsFull",
  "portalTenant",
  "portalLandlord",
  "portalSupplier",
  "registrationCustomer",
  "registrationSupplier",
  "affiliateEnabled",
  "sellerVerificationRequired",
  "legalSection",
  "planningEnabled",
] as const

/** A v2 feature flag identifier (camelCase). */
export type V2FlagKey = (typeof V2_FLAG_KEYS)[number]

/** Definition of a single flag in the catalogue. */
export interface FlagDefinition {
  /** camelCase code identifier, used throughout the app. */
  key: V2FlagKey
  /**
   * snake_case database key as stored in `platform_feature_flags.flag_key`.
   * The DB rows use snake_case (matching the live schema convention); the code
   * uses camelCase. This is the bridge between the two.
   */
  dbKey: string
  /** Human label shown in the admin feature-flags console. */
  label: string
  /** Short description of what the flag unlocks. */
  description: string
  /** Default state. ALWAYS false for v2 — V1 must be unchanged with flags off. */
  defaultEnabled: boolean
}

/** camelCase -> snake_case (e.g. marketplaceStays -> marketplace_stays). */
function toDbKey(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

/**
 * The catalogue. Every entry defaults OFF. `dbKey` is derived deterministically
 * so the migration seed and the runtime accessor agree without duplication.
 */
export const FLAG_REGISTRY: Record<V2FlagKey, FlagDefinition> = {
  contextEngine: {
    key: "contextEngine",
    dbKey: toDbKey("contextEngine"),
    label: "Context Engine",
    description:
      "Central routeContext resolver that adapts modules by workspace type, actor and country. Off = V1 single-context behaviour.",
    defaultEnabled: false,
  },
  marketplaceEnabled: {
    key: "marketplaceEnabled",
    dbKey: toDbKey("marketplaceEnabled"),
    label: "Marketplace",
    description: "Master switch for the combined marketplace OS. Off = no marketplace surface at all.",
    defaultEnabled: false,
  },
  marketplaceStays: {
    key: "marketplaceStays",
    dbKey: toDbKey("marketplaceStays"),
    label: "Marketplace — Stays",
    description: "Property stay / booking listing type within the marketplace.",
    defaultEnabled: false,
  },
  marketplaceSuppliers: {
    key: "marketplaceSuppliers",
    dbKey: toDbKey("marketplaceSuppliers"),
    label: "Marketplace — Suppliers",
    description: "Supplier service / package listing type within the marketplace.",
    defaultEnabled: false,
  },
  marketplaceEmergency: {
    key: "marketplaceEmergency",
    dbKey: toDbKey("marketplaceEmergency"),
    label: "Marketplace — Emergency",
    description: "Emergency dispatch listing type and emergency supplier chain.",
    defaultEnabled: false,
  },
  marketplacePayments: {
    key: "marketplacePayments",
    dbKey: toDbKey("marketplacePayments"),
    label: "Marketplace — Payments",
    description: "Marketplace payment capture / payout flows and commission tracking.",
    defaultEnabled: false,
  },
  marketplaceEscrow: {
    key: "marketplaceEscrow",
    dbKey: toDbKey("marketplaceEscrow"),
    label: "Marketplace — Escrow / Holds",
    description: "Payment authorisation, delayed capture and platform-hold flows.",
    defaultEnabled: false,
  },
  marketplaceDisputes: {
    key: "marketplaceDisputes",
    dbKey: toDbKey("marketplaceDisputes"),
    label: "Marketplace — Disputes",
    description: "Unified dispute lifecycle and resolution workflows.",
    defaultEnabled: false,
  },
  bookingManagement: {
    key: "bookingManagement",
    dbKey: toDbKey("bookingManagement"),
    label: "Booking Management",
    description: "Reservation operations section (calendar, availability, check-in/out, turnover).",
    defaultEnabled: false,
  },
  directBookingPages: {
    key: "directBookingPages",
    dbKey: toDbKey("directBookingPages"),
    label: "Direct Booking Pages",
    description: "Public direct-booking pages with reduced/zero platform fee.",
    defaultEnabled: false,
  },
  customerWorkspace: {
    key: "customerWorkspace",
    dbKey: toDbKey("customerWorkspace"),
    label: "Customer Workspace",
    description: "Lightweight customer / guest workspace route group and landing.",
    defaultEnabled: false,
  },
  supplierWorkspace: {
    key: "supplierWorkspace",
    dbKey: toDbKey("supplierWorkspace"),
    label: "Supplier Workspace",
    description: "Full supplier workspace (services, packages, jobs, payouts) beyond the lightweight portal.",
    defaultEnabled: false,
  },
  icalSync: {
    key: "icalSync",
    dbKey: toDbKey("icalSync"),
    label: "iCal Sync",
    description: "Channel iCal import/export for booking availability.",
    defaultEnabled: false,
  },
  canvasLite: {
    key: "canvasLite",
    dbKey: toDbKey("canvasLite"),
    label: "Canvas Lite",
    description: "Lightweight visual canvas / board surface for planning.",
    defaultEnabled: false,
  },
  multiCountryPortfolio: {
    key: "multiCountryPortfolio",
    dbKey: toDbKey("multiCountryPortfolio"),
    label: "Multi-Country Portfolio",
    description: "Per-property country, jurisdiction and currency across a single workspace.",
    defaultEnabled: false,
  },
  globalCountryPacks: {
    key: "globalCountryPacks",
    dbKey: toDbKey("globalCountryPacks"),
    label: "Global Country Packs",
    description:
      "Workspace-level jurisdiction packs: per-country compliance requirement sets, " +
      "legal-section gating and jurisdiction disclaimers. Pulled forward to V1 — the " +
      "workspace jurisdiction picker (Settings → Jurisdiction) drives Compliance + Legal. " +
      "(Per-property multi-country remains V2 under multiCountryPortfolio.)",
    defaultEnabled: true,
  },
  accountingGl: {
    key: "accountingGl",
    dbKey: toDbKey("accountingGl"),
    label: "Accounting — General Ledger",
    description:
      "Full double-entry accounting GL (chart of accounts, journals, trial balance, MTD filing, reconciliation). Off = Money basics only; accounting is positioned as a Xero/QuickBooks integration. Never in V1 nav.",
    defaultEnabled: false,
  },
  automationsFull: {
    key: "automationsFull",
    dbKey: toDbKey("automationsFull"),
    label: "Automations — Full Canvas",
    description:
      "Full automation engine (visual canvas, node registry, webhooks, integrations marketplace, usage marketplace, advanced run debugger). Off = automations-lite (presets/approvals/reminders) via canvasLite only. Requires canvasLite.",
    defaultEnabled: false,
  },
  // ── Operational portal kill-switches (V1 Layer B — default ON) ───────────────
  portalTenant: {
    key: "portalTenant",
    dbKey: toDbKey("portalTenant"),
    label: "Tenant Portal",
    description: "Magic-link tenant portal (tenancy, payments, maintenance, documents, messages). Operational kill-switch — ON in V1.",
    defaultEnabled: true,
  },
  portalLandlord: {
    key: "portalLandlord",
    dbKey: toDbKey("portalLandlord"),
    label: "Landlord Portal",
    description: "Magic-link landlord/owner portal (properties, financials, owner statements, maintenance, documents). Operational kill-switch — ON in V1.",
    defaultEnabled: true,
  },
  portalSupplier: {
    key: "portalSupplier",
    dbKey: toDbKey("portalSupplier"),
    label: "Supplier Portal",
    description: "Magic-link supplier portal (jobs, documents/evidence, invoices, payments, messages). Operational kill-switch — ON in V1.",
    defaultEnabled: true,
  },
  // ── Registration / login segments (V2 personas — default OFF) ────────────────
  registrationCustomer: {
    key: "registrationCustomer",
    dbKey: toDbKey("registrationCustomer"),
    label: "Customer Registration",
    description: "Show the Customer choice on /register and the Customer tab on /login. Off in V1 (customer workspace is staged).",
    defaultEnabled: false,
  },
  registrationSupplier: {
    key: "registrationSupplier",
    dbKey: toDbKey("registrationSupplier"),
    label: "Supplier Registration",
    description: "Show the Supplier choice on /register and the Supplier tab on /login. Off in V1 until the supplier workspace is staged on.",
    defaultEnabled: false,
  },
  affiliateEnabled: {
    key: "affiliateEnabled",
    dbKey: toDbKey("affiliateEnabled"),
    label: "Affiliate Programme",
    description: "Show the Affiliate nav item for workspaces enrolled in the referral programme. Off by default — enabled per workspace on enrolment.",
    defaultEnabled: false,
  },
  sellerVerificationRequired: {
    key: "sellerVerificationRequired",
    dbKey: toDbKey("sellerVerificationRequired"),
    label: "Seller verification gate",
    description: "Enforce identity/KYC (+ supplier insurance) before a seller can go live or receive payouts. OFF until marketplace launch so pre-launch listings aren't blocked; turn ON at launch.",
    defaultEnabled: false,
  },
  // ── Operational section kill-switches (V1 — default ON) ──────────────────────
  legalSection: {
    key: "legalSection",
    dbKey: toDbKey("legalSection"),
    label: "Legal Section",
    description: "Legal advisory tools: HMO licences, EPC advisory, possession notices (Section 8/21), RRA 2026 tracker. Operational kill-switch — ON in V1. Can be disabled per-workspace if not needed.",
    defaultEnabled: true,
  },
  planningEnabled: {
    key: "planningEnabled",
    dbKey: toDbKey("planningEnabled"),
    label: "Planning Engine",
    description: "Planning Engine section: forecasts, portfolio intelligence, yield analysis, scenario modelling, property acquisition sets. Operational kill-switch — ON in V1.",
    defaultEnabled: true,
  },
}

/** All flag definitions as an array (stable registry order). */
export const FLAG_DEFINITIONS: FlagDefinition[] = V2_FLAG_KEYS.map((k) => FLAG_REGISTRY[k])

/** Map of dbKey (snake_case) -> camelCase flag key, for reverse lookups. */
export const DB_KEY_TO_FLAG: Record<string, V2FlagKey> = Object.fromEntries(
  FLAG_DEFINITIONS.map((d) => [d.dbKey, d.key])
) as Record<string, V2FlagKey>

/** Default state for a flag (always its registry default — OFF for v2). */
export function defaultFor(flag: V2FlagKey): boolean {
  return FLAG_REGISTRY[flag]?.defaultEnabled ?? false
}

/** Type guard: is this string a known v2 flag key? */
export function isV2FlagKey(value: string): value is V2FlagKey {
  return Object.prototype.hasOwnProperty.call(FLAG_REGISTRY, value)
}
