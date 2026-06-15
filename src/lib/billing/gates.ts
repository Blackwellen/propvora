import type { SupabaseClient } from "@supabase/supabase-js"
import { normaliseTier, PLAN_DISPLAY, PLAN_ORDER, type PlanTier } from "./plans"
import { featuresForTier, type FeatureKey } from "./entitlements"

/**
 * Server-side plan/feature gates. Each helper reads the workspace's live plan
 * and answers a single "is this allowed?" question, returning a structured
 * result the API route can turn into a 402/403 with an upgrade message.
 *
 * Gates fail OPEN on a store error (never lock a paying user out because of a
 * transient DB hiccup) but fail CLOSED on an explicit "feature not on plan".
 */

export interface GateResult {
  allowed: boolean
  tier: PlanTier
  /** Upgrade message shown to the user when `allowed` is false. */
  reason?: string
  /** Suggested HTTP status when blocking (402 Payment Required by default). */
  status?: number
}

/** Fetch and normalise the workspace's current plan tier (best-effort). */
export async function getWorkspaceTier(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<PlanTier> {
  if (!workspaceId || workspaceId === "demo-workspace") return "starter"
  try {
    const { data } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", workspaceId)
      .maybeSingle()
    return normaliseTier((data?.plan as string | undefined) ?? null)
  } catch {
    return "starter"
  }
}

/**
 * Gate: AI Copilot. Allowed only on plans whose feature set includes it
 * (Scale and above). Lower tiers get a clear upgrade prompt.
 */
export async function gateAiCopilot(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  const def = PLAN_DISPLAY[tier]
  if (def.features.aiCopilot) return { allowed: true, tier }
  return {
    allowed: false,
    tier,
    status: 402,
    reason: `AI Copilot isn't included on the ${def.name} plan. Upgrade to Scale or above to use the assistant.`,
  }
}

/**
 * Gate: storage. Blocks an upload that would push the workspace over its plan
 * allowance. Limits are coarse and generous — the goal is to stop abuse, not to
 * nickel-and-dime — and the check fails open if usage can't be read.
 */
const STORAGE_LIMIT_BYTES: Record<PlanTier, number> = {
  starter: 2 * 1024 ** 3, //   2 GB
  operator: 10 * 1024 ** 3, // 10 GB
  scale: 50 * 1024 ** 3, //    50 GB
  pro_agency: 200 * 1024 ** 3, // 200 GB
  enterprise: Number.MAX_SAFE_INTEGER, // unlimited
}

export async function gateStorage(
  supabase: SupabaseClient,
  workspaceId: string,
  incomingBytes: number
): Promise<GateResult> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  const limit = STORAGE_LIMIT_BYTES[tier]
  if (limit === Number.MAX_SAFE_INTEGER) return { allowed: true, tier }

  let used = 0
  try {
    // Sum stored file sizes for this workspace (best-effort — table may be
    // unmigrated, in which case we fail open).
    const { data } = await supabase
      .from("files")
      .select("size_bytes")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
    if (Array.isArray(data)) {
      used = data.reduce((sum, r) => sum + Number((r as { size_bytes?: number }).size_bytes ?? 0), 0)
    }
  } catch {
    return { allowed: true, tier } // fail open
  }

  if (used + incomingBytes <= limit) return { allowed: true, tier }
  const gb = (n: number) => (n / 1024 ** 3).toFixed(1)
  return {
    allowed: false,
    tier,
    status: 402,
    reason: `This upload would exceed your ${PLAN_DISPLAY[tier].name} storage limit of ${gb(limit)} GB (currently using ${gb(used)} GB). Upgrade your plan or remove some files.`,
  }
}

/**
 * Generic feature gate driven by the central entitlement map. Reads the
 * workspace's live tier and checks the requested boolean feature flag,
 * returning the same {allowed, tier, reason, status:402} shape as the
 * purpose-built gates above. Fails closed (feature off) for a tier that
 * genuinely lacks the feature; the tier read itself is best-effort.
 */
const FEATURE_LABEL: Record<FeatureKey, string> = {
  aiCopilot: "AI Copilot",
  advancedReports: "Advanced reports",
  whiteLabel: "White-label branding",
  ssoSaml: "SSO / SAML",
  portals: "Client & supplier portals",
  automation: "Automation",
  bookingManagement: "Booking management",
  directBookingPages: "Direct booking pages",
  supplierWorkspaceInvites: "Supplier workspace invites",
  marketplaceBrowsing: "Marketplace browsing",
  marketplacePublishing: "Marketplace publishing",
  canvasLite: "Canvas Lite automations",
  procurementRules: "Supplier procurement rules",
  ownerPortals: "Owner / client portals",
}

/** Lowest tier whose feature set includes `feature` (for the upgrade hint). */
function minTierFor(feature: FeatureKey): string | null {
  for (const t of PLAN_ORDER) {
    if (featuresForTier(t)[feature]) return PLAN_DISPLAY[t].name
  }
  return null
}

export async function gateFeature(
  supabase: SupabaseClient,
  workspaceId: string,
  feature: FeatureKey
): Promise<GateResult> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  if (featuresForTier(tier)[feature]) return { allowed: true, tier }
  const min = minTierFor(feature)
  const label = FEATURE_LABEL[feature]
  return {
    allowed: false,
    tier,
    status: 402,
    reason: min
      ? `${label} isn't included on the ${PLAN_DISPLAY[tier].name} plan. Upgrade to ${min} or above to use it.`
      : `${label} isn't available on your plan. Contact sales to enable it.`,
  }
}

// ── Named feature helpers (thin wrappers over gateFeature) ────────────────

export function gateAdvancedReports(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFeature(supabase, workspaceId, "advancedReports")
}

export function gateWhiteLabel(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFeature(supabase, workspaceId, "whiteLabel")
}

export function gateSso(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFeature(supabase, workspaceId, "ssoSaml")
}

export function gatePortals(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFeature(supabase, workspaceId, "portals")
}

export function gateAutomation(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFeature(supabase, workspaceId, "automation")
}

// ── v2 feature-flag gate (additive) ───────────────────────────────────────
// Bridges the v2 feature-flag registry into the same GateResult shape the
// billing gates use, so v2 surfaces (marketplace, customer/supplier workspace,
// booking, country packs …) can be guarded with one consistent helper. This is
// PURELY ADDITIVE — it does not touch any existing plan/tier gate. Every v2
// flag defaults OFF, so this fails CLOSED for v2 features until a flag is on.

/**
 * Gate: a v2 feature flag. Returns allowed:true only when the flag resolves ON
 * for this workspace (per-workspace override → global → registry default OFF).
 * Tolerant: the flag accessor never throws; a missing flags table → OFF.
 */
export async function gateV2Flag(
  supabase: SupabaseClient,
  workspaceId: string,
  flag: import("@/lib/flags/registry").V2FlagKey
): Promise<GateResult> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  const { isFeatureEnabled } = await import("@/lib/flags")
  const { FLAG_REGISTRY } = await import("@/lib/flags/registry")
  const on = await isFeatureEnabled(flag, { supabase, workspaceId })
  if (on) return { allowed: true, tier }
  const label = FLAG_REGISTRY[flag]?.label ?? flag
  return {
    allowed: false,
    tier,
    status: 403,
    reason: `${label} is not enabled for this workspace.`,
  }
}

// ── Layer-2 gates (entitlement only — v2 is integrated into core) ───────────
// v2 lives on its own product line; gating is by SUBSCRIPTION TIER/ENTITLEMENT
// only (the commercial model), NOT by any on/off platform feature flag. Each
// gate fails CLOSED on plan (402) for tiers that don't include the feature.

/**
 * Compose gate kept for signature stability — now entitlement-only. The `flag`
 * argument is ignored (v2 is core; no feature-flag gating).
 */
async function gateFlagAndFeature(
  supabase: SupabaseClient,
  workspaceId: string,
  _flag: import("@/lib/flags/registry").V2FlagKey,
  feature: FeatureKey
): Promise<GateResult> {
  return gateFeature(supabase, workspaceId, feature)
}

/**
 * Gate: direct booking pages. Needs the `directBookingPages` flag ON and the
 * plan entitlement (Scale and above).
 */
export function gateBookingPages(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFlagAndFeature(supabase, workspaceId, "directBookingPages", "directBookingPages")
}

/**
 * Gate: supplier workspace. Needs the `supplierWorkspace` flag ON and the plan
 * entitlement to INVITE suppliers (Scale and above). Supplier workspaces
 * themselves are free; this gates the OPERATOR's ability to invite/run them.
 */
export function gateSupplierWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFlagAndFeature(supabase, workspaceId, "supplierWorkspace", "supplierWorkspaceInvites")
}

/**
 * Gate: marketplace publishing. Needs the `marketplaceEnabled` flag ON and the
 * plan entitlement (Pro / Agency and above — advanced marketplace controls).
 */
export function gateMarketplacePublishing(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFlagAndFeature(supabase, workspaceId, "marketplaceEnabled", "marketplacePublishing")
}

/**
 * Gate: Canvas Lite automations. Needs the `canvasLite` flag ON and the plan
 * entitlement (Scale and above).
 */
export function gateCanvasLite(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFlagAndFeature(supabase, workspaceId, "canvasLite", "canvasLite")
}

/**
 * Gate: automation runs. Composes the `bookingManagement`-independent base
 * `automation` entitlement with no v2 flag (automation is a V1 entitlement),
 * but caps run volume against the plan. This is the entry gate for executing an
 * automation run; per-run volume caps are enforced by the caller against the
 * returned tier. Fails open on store error, closed on plan.
 */
export async function gateAutomationRuns(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  // Base automation must be on the plan (Scale+). No v2 flag required — Smart
  // Recipes/automation is a V1 entitlement — but Canvas Lite runs additionally
  // require the canvasLite flag, which callers gate separately via gateCanvasLite.
  return gateFeature(supabase, workspaceId, "automation")
}
