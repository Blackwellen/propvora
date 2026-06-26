import type { SupabaseClient } from "@supabase/supabase-js"
import { normaliseTier, PLAN_DISPLAY, PLAN_ORDER, type PlanTier } from "./plans"
import { featuresForTier, type FeatureKey } from "./entitlements"

// ── Plan-level usage limits matrix ────────────────────────────────────────────
// Definitive per-plan quota caps consumed by AI and automation gates.
// Tiers: starter | operator | scale | pro_agency | enterprise

export interface PlanLimits {
  // AI Copilot
  aiEnabled: boolean
  aiMessagesPerMonth: number       // 0 = disabled
  aiInputTokensPerMessage: number  // max tokens per user message
  aiOutputTokensPerMessage: number // max tokens per AI response
  aiRateLimitPerHour: number       // max messages per hour per workspace

  // Automations
  automationsEnabled: boolean
  automationRunsPerMonth: number   // 0 = disabled
  maxAutomationDefinitions: number // max saved active automation rules
  maxWebhooks: number

  // General
  maxProperties: number
  maxUsers: number
  maxStorageGb: number
}

const UNLIM_INT = 9999

// ── AI token limits — Azure GPT-4o-mini profitability notes ──────────────────
// Provider: Azure OpenAI (EU region, GPT-4o-mini class)
//   Input:  ~£0.012 per 1,000 tokens
//   Output: ~£0.047 per 1,000 tokens
//
// Expected average call cost per plan (system prompt ~1,500 tokens overhead):
//   Scale     (750  msg/mo, 2k in  + 2k out user turn):  ~£0.0003/msg → ~£0.22/mo Azure cost
//   Pro/Agency (3k msg/mo, 4k in  + 3k out user turn):  ~£0.0006/msg → ~£1.80/mo Azure cost
//   Enterprise (unlimited):  bounded by PLAN_CAPS costPenceMonth hard ceiling
//
// All AI is gated behind PLAN_CAPS rolling spend ceiling (caps.ts) as the
// financial backstop. Token limits here control per-message quality, not cost.
//
// Starter / Operator plans: AI disabled entirely (aiEnabled: false).
// No amounts appear here because gateAiCopilot() will block first.
export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: {
    aiEnabled: false,
    aiMessagesPerMonth: 0,
    aiInputTokensPerMessage: 0,
    aiOutputTokensPerMessage: 0,
    aiRateLimitPerHour: 0,
    automationsEnabled: false,
    automationRunsPerMonth: 0,
    maxAutomationDefinitions: 0,
    maxWebhooks: 0,
    maxProperties: 5,
    maxUsers: 1,
    maxStorageGb: 2,
  },
  operator: {
    // Operator: no AI Copilot, no automations on V1
    aiEnabled: false,
    aiMessagesPerMonth: 0,
    aiInputTokensPerMessage: 0,
    aiOutputTokensPerMessage: 0,
    aiRateLimitPerHour: 0,
    automationsEnabled: false,
    automationRunsPerMonth: 0,
    maxAutomationDefinitions: 0,
    maxWebhooks: 0,
    maxProperties: 25,
    maxUsers: 3,
    maxStorageGb: 10,
  },
  scale: {
    aiEnabled: true,
    // 750 messages/month. Azure cost ceiling £30 (caps.ts) = ~136× safety margin.
    aiMessagesPerMonth: 750,
    // Per-message limits: 2k input / 2k output.
    // Enough for detailed questions + full reply paragraphs (compliance letters,
    // task summaries, rent chase emails). Constrained enough to keep Scale cost
    // well below the £30 monthly cap even at 100% utilisation.
    aiInputTokensPerMessage: 2_000,
    aiOutputTokensPerMessage: 2_000,
    // 30 messages/hour burst cap (prevents automated spam; humans chat slower).
    aiRateLimitPerHour: 30,
    automationsEnabled: true,
    automationRunsPerMonth: 1_000,
    maxAutomationDefinitions: 50,
    maxWebhooks: 10,
    maxProperties: 100,
    maxUsers: 10,
    maxStorageGb: 50,
  },
  pro_agency: {
    aiEnabled: true,
    // 3,000 messages/month. Azure cost ceiling £120 (caps.ts) = ~67× safety margin.
    aiMessagesPerMonth: 3_000,
    // 4k input / 3k output: agency users paste full tenancy agreements, full
    // portfolio summaries, compliance reports. 3k output covers long legal drafts.
    aiInputTokensPerMessage: 4_000,
    aiOutputTokensPerMessage: 3_000,
    aiRateLimitPerHour: 120,
    automationsEnabled: true,
    automationRunsPerMonth: 10_000,
    maxAutomationDefinitions: 200,
    maxWebhooks: 50,
    maxProperties: 500,
    maxUsers: 25,
    maxStorageGb: 200,
  },
  enterprise: {
    aiEnabled: true,
    // Unlimited messages, bounded only by the PLAN_CAPS monthly cost ceiling.
    aiMessagesPerMonth: UNLIM_INT,
    // Platform absolute maximums (chat/route.ts enforces 8k/4k hard ceiling).
    aiInputTokensPerMessage: 8_000,
    aiOutputTokensPerMessage: 4_000,
    aiRateLimitPerHour: UNLIM_INT,
    automationsEnabled: true,
    automationRunsPerMonth: UNLIM_INT,
    maxAutomationDefinitions: UNLIM_INT,
    maxWebhooks: UNLIM_INT,
    maxProperties: UNLIM_INT,
    maxUsers: UNLIM_INT,
    maxStorageGb: UNLIM_INT,
  },
}

/**
 * Resolve the PlanLimits for a workspace. Reads the live plan tier; falls
 * back to `starter` limits on any store error (fail-safe / audit-safe).
 */
export async function getPlanLimits(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<PlanLimits> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.starter
}

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
  starter:    2 * 1024 ** 3,  //   2 GB
  operator:   5 * 1024 ** 3,  //   5 GB
  scale:     15 * 1024 ** 3,  //  15 GB
  pro_agency: 35 * 1024 ** 3, //  35 GB
  enterprise: 100 * 1024 ** 3, // 100 GB — capped; add-on available for more
}

const ADDON_PACK_BYTES_GATE = 10 * 1024 ** 3 // 10 GB per extra-storage pack

export async function gateStorage(
  supabase: SupabaseClient,
  workspaceId: string,
  incomingBytes: number
): Promise<GateResult> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  const baseLimit = STORAGE_LIMIT_BYTES[tier]

  // Stack purchased add-on packs on top of the plan base limit.
  let addonPacks = 0
  try {
    const { data } = await supabase
      .from("workspace_addons")
      .select("quantity")
      .eq("workspace_id", workspaceId)
      .eq("addon_key", "extra_storage")
      .eq("status", "active")
    if (Array.isArray(data)) {
      addonPacks = data.reduce((sum, r) => sum + Number((r as { quantity?: number }).quantity ?? 0), 0)
    }
  } catch { /* fail open */ }

  const limit = baseLimit + addonPacks * ADDON_PACK_BYTES_GATE

  let used = 0
  try {
    const { data } = await supabase
      .from("files")
      .select("size_bytes")
      .eq("workspace_id", workspaceId)
      .neq("status", "deleted")
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
    reason: `This upload would exceed your ${PLAN_DISPLAY[tier].name} storage limit of ${gb(limit)} GB (currently using ${gb(used)} GB). Upgrade your plan or purchase more storage.`,
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
  aiAgentRuns: "AI agents & autonomous actions",
  byok: "Bring your own AI key",
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

// ── Quota gates (count-based limits) ──────────────────────────────────────

/**
 * Gate: property count. Blocks creation when the workspace already has as many
 * properties as the plan allows. Fails open on store error (never lock a paying
 * user out on a transient DB hiccup); fails closed only when the limit is
 * genuinely reached. Uses the anon client — RLS scopes the count to the caller's
 * workspace automatically.
 */
export async function gatePropertyCount(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  const limit = PLAN_DISPLAY[tier].features.properties
  if (limit === "Unlimited") return { allowed: true, tier }

  let count = 0
  try {
    const { count: c, error } = await supabase
      .from("properties")
      .select("id", { head: true, count: "exact" })
      .eq("workspace_id", workspaceId)
    if (error) return { allowed: true, tier } // fail open
    count = c ?? 0
  } catch {
    return { allowed: true, tier } // fail open
  }

  if (count < limit) return { allowed: true, tier }

  // Find the next tier that allows more properties.
  let upgradeTo: string | null = null
  for (const t of PLAN_ORDER) {
    const tLimit = PLAN_DISPLAY[t].features.properties
    if (tLimit === "Unlimited" || (typeof tLimit === "number" && tLimit > limit)) {
      upgradeTo = PLAN_DISPLAY[t].name
      break
    }
  }

  return {
    allowed: false,
    tier,
    status: 402,
    reason: upgradeTo
      ? `Your ${PLAN_DISPLAY[tier].name} plan includes up to ${limit} ${limit === 1 ? "property" : "properties"}. Upgrade to ${upgradeTo} to add more.`
      : `Your plan's property limit of ${limit} has been reached. Contact sales to increase it.`,
  }
}

/**
 * Gate: team seat count. Blocks invitation creation when the workspace's active
 * members + pending invitations would meet or exceed the plan seat cap. Fails
 * open on store error. Uses the anon client — RLS scopes counts to the caller's
 * workspace.
 */
export async function gateTeamSeats(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  const limit = PLAN_DISPLAY[tier].features.teamSeats
  if (limit === "Unlimited") return { allowed: true, tier }

  let memberCount = 0
  let pendingCount = 0
  try {
    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("id", { head: true, count: "exact" })
        .eq("workspace_id", workspaceId),
      supabase
        .from("workspace_invitations")
        .select("id", { head: true, count: "exact" })
        .eq("workspace_id", workspaceId)
        .eq("status", "pending"),
    ])
    if (membersRes.error || invitesRes.error) return { allowed: true, tier } // fail open
    memberCount = membersRes.count ?? 0
    pendingCount = invitesRes.count ?? 0
  } catch {
    return { allowed: true, tier } // fail open
  }

  const total = memberCount + pendingCount
  if (total < limit) return { allowed: true, tier }

  // Find the next tier that allows more seats.
  let upgradeTo: string | null = null
  for (const t of PLAN_ORDER) {
    const tLimit = PLAN_DISPLAY[t].features.teamSeats
    if (tLimit === "Unlimited" || (typeof tLimit === "number" && tLimit > limit)) {
      upgradeTo = PLAN_DISPLAY[t].name
      break
    }
  }

  return {
    allowed: false,
    tier,
    status: 402,
    reason: upgradeTo
      ? `Your ${PLAN_DISPLAY[tier].name} plan includes ${limit} team ${limit === 1 ? "seat" : "seats"}. Upgrade to ${upgradeTo} to invite more members.`
      : `Your plan's team seat limit of ${limit} has been reached. Contact sales to increase it.`,
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

/**
 * Gate: agentic Copilot layer (Tier C/D — agent runs, web/market intelligence,
 * document generation, monitors). Scale+ on plan. NOTE: lower tiers can unlock
 * this via the AI-Pro add-on; callers that support the add-on should OR this
 * gate with an active-add-on check before blocking.
 */
export function gateAiAgents(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFeature(supabase, workspaceId, "aiAgentRuns")
}

/** Gate: bring-your-own AI key. Enterprise only. */
export function gateByok(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<GateResult> {
  return gateFeature(supabase, workspaceId, "byok")
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
