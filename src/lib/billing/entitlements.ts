import type { SupabaseClient } from "@supabase/supabase-js"
import { PLAN_DISPLAY, PLAN_ORDER, type PlanTier } from "./plans"
import { getWorkspaceTier } from "./gates"

/**
 * Central entitlement service.
 *
 * Maps a workspace's plan tier to a typed set of LIMITS and boolean FEATURE
 * FLAGS. This is the single source of truth that server-side gates and the
 * (cosmetic) client hook both read from, so a plan change is reflected
 * everywhere consistently.
 *
 * It LAYERS on top of PLAN_DISPLAY (it does not mutate its shape): the limits
 * and the `advancedReports`/`aiCopilot` flags are sourced from
 * PLAN_DISPLAY.features, while the additional gated features (whiteLabel,
 * ssoSaml, portals, automation) are defined in the TIER_FEATURES map below.
 *
 * Best-effort: any read failure resolves to the `starter` tier rather than
 * throwing, mirroring the gate philosophy (never lock a user out on a hiccup).
 */

/** Boolean feature flags an entitlement can carry. */
export interface FeatureFlags {
  aiCopilot: boolean
  advancedReports: boolean
  whiteLabel: boolean
  ssoSaml: boolean
  portals: boolean
  automation: boolean
  // ── Layer 2 additions (additive; V1 tiers unaffected for existing keys) ──
  /** Direct booking management (reservation operations board). */
  bookingManagement: boolean
  /** Public direct-booking pages. */
  directBookingPages: boolean
  /** Can invite suppliers into a supplier workspace. */
  supplierWorkspaceInvites: boolean
  /** Browse the supplier/booking marketplace. */
  marketplaceBrowsing: boolean
  /** Publish listings to the marketplace. */
  marketplacePublishing: boolean
  /** Canvas Lite automation surface. */
  canvasLite: boolean
  /** Supplier procurement rules (agency-grade controls). */
  procurementRules: boolean
  /** Owner / client portals (multi-landlord). */
  ownerPortals: boolean
  // ── Intelligence Layer (additive) ──────────────────────────────────────
  /**
   * Agentic Copilot tier (Tier C/D): autonomous agent runs, web/market
   * intelligence, document generation and continuous monitors. Scale+ on plan;
   * lower tiers unlock it via the AI-Pro add-on. Conversation Copilot
   * (aiCopilot) is separate and lighter.
   */
  aiAgentRuns: boolean
  /** Bring-your-own AI provider key (Enterprise) — unlimited, own data terms. */
  byok: boolean
}

/** The gated feature keys (used by the generic gate). */
export type FeatureKey = keyof FeatureFlags

/** Coarse numeric limits, resolved per tier. */
export interface EntitlementLimits {
  /** Max properties; Infinity means unlimited. */
  properties: number
  /** Max team seats; Infinity means unlimited. */
  teamSeats: number
  /** Storage allowance in bytes; Infinity means unlimited. */
  storageBytes: number
}

export interface Entitlements {
  tier: PlanTier
  limits: EntitlementLimits
  features: FeatureFlags
}

/**
 * Per-tier flags for the features NOT already on PLAN_DISPLAY.features.
 *
 *  - whiteLabel / ssoSaml : pro_agency and enterprise (white-label ready;
 *    full SSO/SAML is an enterprise headline but available from pro_agency).
 *  - portals / automation : scale and above.
 *
 * `advancedReports` and `aiCopilot` are intentionally NOT duplicated here —
 * they are read from PLAN_DISPLAY.features to stay in lock-step with the
 * pricing table.
 */
type TierFeatureKeys =
  | "whiteLabel"
  | "ssoSaml"
  | "portals"
  | "automation"
  | "bookingManagement"
  | "directBookingPages"
  | "supplierWorkspaceInvites"
  | "marketplaceBrowsing"
  | "marketplacePublishing"
  | "canvasLite"
  | "procurementRules"
  | "ownerPortals"
  | "aiAgentRuns"
  | "byok"

const TIER_FEATURES: Record<PlanTier, Pick<FeatureFlags, TierFeatureKeys>> = {
  // V1 keys (whiteLabel/ssoSaml/portals/automation) keep their exact prior
  // values. Layer-2 keys are NEW and additive — they map per the doc §3/§9.
  starter: {
    whiteLabel: false, ssoSaml: false, portals: false, automation: false,
    bookingManagement: false, directBookingPages: false, supplierWorkspaceInvites: false,
    marketplaceBrowsing: false, marketplacePublishing: false, canvasLite: false,
    procurementRules: false, ownerPortals: false,
    aiAgentRuns: false, byok: false,
  },
  operator: {
    whiteLabel: false, ssoSaml: false, portals: false, automation: false,
    // Operator: booking management + supplier/customer portal workflows, no
    // advanced marketplace controls, no direct booking pages, no Canvas Lite.
    bookingManagement: true, directBookingPages: false, supplierWorkspaceInvites: false,
    marketplaceBrowsing: false, marketplacePublishing: false, canvasLite: false,
    procurementRules: false, ownerPortals: false,
    aiAgentRuns: false, byok: false,
  },
  scale: {
    whiteLabel: false, ssoSaml: false, portals: true, automation: true,
    // Scale: direct booking pages, supplier workspace invites, Canvas Lite,
    // marketplace browsing.
    bookingManagement: true, directBookingPages: true, supplierWorkspaceInvites: true,
    marketplaceBrowsing: true, marketplacePublishing: false, canvasLite: true,
    procurementRules: false, ownerPortals: false,
    // Scale unlocks the agentic Copilot layer (with a bundled credit allowance).
    aiAgentRuns: true, byok: false,
  },
  pro_agency: {
    whiteLabel: true, ssoSaml: true, portals: true, automation: true,
    // Pro / Agency: procurement rules, owner portals, advanced marketplace
    // controls (publishing).
    bookingManagement: true, directBookingPages: true, supplierWorkspaceInvites: true,
    marketplaceBrowsing: true, marketplacePublishing: true, canvasLite: true,
    procurementRules: true, ownerPortals: true,
    aiAgentRuns: true, byok: false,
  },
  enterprise: {
    whiteLabel: true, ssoSaml: true, portals: true, automation: true,
    bookingManagement: true, directBookingPages: true, supplierWorkspaceInvites: true,
    marketplaceBrowsing: true, marketplacePublishing: true, canvasLite: true,
    procurementRules: true, ownerPortals: true,
    // Enterprise: agentic layer + bring-your-own-key.
    aiAgentRuns: true, byok: true,
  },
}

/** Storage allowance per tier (bytes). Mirrors gates.ts STORAGE_LIMIT_BYTES. */
const STORAGE_BYTES: Record<PlanTier, number> = {
  starter:    2 * 1024 ** 3,  //   2 GB
  operator:   5 * 1024 ** 3,  //   5 GB
  scale:     15 * 1024 ** 3,  //  15 GB
  pro_agency: 35 * 1024 ** 3, //  35 GB
  enterprise: 100 * 1024 ** 3, // 100 GB — capped; add-on available for more
}

function toLimit(v: number | "Unlimited"): number {
  return v === "Unlimited" ? Infinity : v
}

/** Resolve the full, typed feature set for a tier (pure — no I/O). */
export function featuresForTier(tier: PlanTier): FeatureFlags {
  const base = PLAN_DISPLAY[tier].features
  const extra = TIER_FEATURES[tier]
  return {
    aiCopilot: base.aiCopilot,
    advancedReports: base.advancedReports,
    whiteLabel: extra.whiteLabel,
    ssoSaml: extra.ssoSaml,
    portals: extra.portals,
    automation: extra.automation,
    bookingManagement: extra.bookingManagement,
    directBookingPages: extra.directBookingPages,
    supplierWorkspaceInvites: extra.supplierWorkspaceInvites,
    marketplaceBrowsing: extra.marketplaceBrowsing,
    marketplacePublishing: extra.marketplacePublishing,
    canvasLite: extra.canvasLite,
    procurementRules: extra.procurementRules,
    ownerPortals: extra.ownerPortals,
    aiAgentRuns: extra.aiAgentRuns,
    byok: extra.byok,
  }
}

/** Resolve the typed limits for a tier (pure — no I/O). */
export function limitsForTier(tier: PlanTier): EntitlementLimits {
  const f = PLAN_DISPLAY[tier].features
  return {
    properties: toLimit(f.properties),
    teamSeats: toLimit(f.teamSeats),
    storageBytes: STORAGE_BYTES[tier],
  }
}

/** Build the full entitlement object for a known tier (pure — no I/O). */
export function entitlementsForTier(tier: PlanTier): Entitlements {
  return {
    tier,
    limits: limitsForTier(tier),
    features: featuresForTier(tier),
  }
}

/**
 * Resolve a workspace's live entitlements. Reads the plan via getWorkspaceTier
 * (best-effort; defaults to `starter` on any error).
 */
export async function getEntitlements(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Entitlements> {
  let tier: PlanTier = "starter"
  try {
    tier = await getWorkspaceTier(supabase, workspaceId)
  } catch {
    tier = "starter"
  }
  if (!PLAN_ORDER.includes(tier)) tier = "starter"
  return entitlementsForTier(tier)
}

// ── Workspace-type dimension (Layer 2) ─────────────────────────────────────
// Operator workspaces resolve entitlements from their Stripe PLAN TIER (above).
// Supplier and customer workspaces are NON-Stripe: their entitlements come from
// a workspace-type role, NOT from a paid subscription. This keeps supplier
// onboarding free while still giving every supplier feature a server-side gate.
//
// This is purely additive: an operator workspace behaves exactly as before.

/** The kind of workspace an entitlement is being resolved for. */
export type WorkspaceType = "operator" | "supplier" | "customer"

/**
 * Supplier feature flags. These are SEPARATE from the operator FeatureFlags
 * because they describe supplier-workspace capabilities (promoted ranking,
 * emergency availability, team roster, advanced automation), most of which are
 * unlocked by supplier paid add-ons rather than a base plan.
 */
export interface SupplierFeatureFlags {
  /** Supplier workspace + profile (always true on the free tier). */
  workspace: boolean
  /** Public/private supplier profile. */
  profile: boolean
  /** Promoted ranking in marketplace results (paid add-on). */
  promotedRanking: boolean
  /** Emergency availability badge + dispatch eligibility (paid add-on). */
  emergencyAvailability: boolean
  /** Team roster beyond owner/admin (paid add-on). */
  teamRoster: boolean
  /** Advanced supplier automation (paid add-on). */
  advancedAutomation: boolean
  /** Supplier AI assistant (paid add-on). */
  aiAssistant: boolean
}

export interface SupplierEntitlements {
  workspaceType: "supplier"
  /** Non-Stripe role label. */
  role: "supplier_free"
  features: SupplierFeatureFlags
  /** Max simultaneously-active marketplace leads. */
  activeLeadsCap: number
}

/**
 * The permanent FREE supplier entitlement. Per doc §4: supplier workspace +
 * profile + up to 3 active marketplace leads; NO promoted ranking, emergency
 * badge, extra team roster or advanced automation (those are paid add-ons).
 * This is a non-Stripe entitlement — it never reads a plan tier.
 */
export const SUPPLIER_FREE_ENTITLEMENTS: SupplierEntitlements = {
  workspaceType: "supplier",
  role: "supplier_free",
  features: {
    workspace: true,
    profile: true,
    promotedRanking: false,
    emergencyAvailability: false,
    teamRoster: false,
    advancedAutomation: false,
    aiAssistant: false,
  },
  activeLeadsCap: 3,
}

/** Resolve a supplier workspace's entitlements (pure — no I/O). */
export function supplierEntitlements(): SupplierEntitlements {
  return SUPPLIER_FREE_ENTITLEMENTS
}

/**
 * Resolve a workspace's entitlements with the workspace-type dimension applied.
 *
 *  - `operator` (default)  → plan-tier-based entitlements (Stripe-backed).
 *  - `supplier`            → the free supplier entitlement (non-Stripe).
 *  - `customer`            → minimal; reuses the supplier-free shape's "free"
 *                            posture but is gated entirely by feature flags, so
 *                            we resolve it to the operator starter posture for
 *                            limits and rely on flags for surface area.
 *
 * Supplier entitlements resolve INDEPENDENTLY of the Stripe plan, so a supplier
 * workspace is never charged a subscription to exist.
 */
export async function getEntitlementsForType(
  supabase: SupabaseClient,
  workspaceId: string,
  workspaceType: WorkspaceType
): Promise<Entitlements | SupplierEntitlements> {
  if (workspaceType === "supplier") return supplierEntitlements()
  // Operator (and customer fallback) resolve from the Stripe plan tier.
  return getEntitlements(supabase, workspaceId)
}
