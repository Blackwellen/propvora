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
const TIER_FEATURES: Record<
  PlanTier,
  Pick<FeatureFlags, "whiteLabel" | "ssoSaml" | "portals" | "automation">
> = {
  starter: { whiteLabel: false, ssoSaml: false, portals: false, automation: false },
  operator: { whiteLabel: false, ssoSaml: false, portals: false, automation: false },
  scale: { whiteLabel: false, ssoSaml: false, portals: true, automation: true },
  pro_agency: { whiteLabel: true, ssoSaml: true, portals: true, automation: true },
  enterprise: { whiteLabel: true, ssoSaml: true, portals: true, automation: true },
}

/** Storage allowance per tier (bytes). Mirrors gates.ts STORAGE_LIMIT_BYTES. */
const STORAGE_BYTES: Record<PlanTier, number> = {
  starter: 2 * 1024 ** 3, //     2 GB
  operator: 10 * 1024 ** 3, //  10 GB
  scale: 50 * 1024 ** 3, //     50 GB
  pro_agency: 200 * 1024 ** 3, // 200 GB
  enterprise: Infinity, //      unlimited
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
