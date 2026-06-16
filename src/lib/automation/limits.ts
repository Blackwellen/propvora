// Automation Engine — per-plan GOVERNANCE LIMITS.
//
// caps.ts already enforces the monthly RUN cap. This file enforces the rest of
// the governance surface: active-automation count, nodes-per-automation,
// webhook count, retention window, and canvas/ai/nl access level. Limits are
// read from the seeded automation_plan_limits table (admin-editable), keyed by
// the human plan label, with a safe in-code fallback when the row is absent.
//
// Tolerant: every read is 42P01/empty-safe and falls back to the in-code map.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { PlanTier } from "@/lib/billing/plans"

const LIMITS_TABLE = "automation_plan_limits"
const DEFINITIONS_TABLE = "automation_definitions"
const WEBHOOKS_TABLE = "automation_webhook_endpoints"

export type AccessLevel = "none" | "trial" | "limited" | "basic" | "full" | "advanced"

export interface PlanLimits {
  plan: string
  maxActive: number
  maxRunsMonth: number
  maxNodes: number
  maxWebhooks: number
  retentionDays: number
  canvasAccess: AccessLevel
  aiAccess: AccessLevel
  nlAccess: AccessLevel
}

/** Map the billing PlanTier → the human plan label used in the limits table. */
export function tierToPlanLabel(tier: PlanTier): string {
  switch (tier) {
    case "starter": return "Starter"
    case "operator": return "Operator"
    case "scale": return "Scale"
    case "pro_agency": return "Pro / Agency"
    case "enterprise": return "Enterprise"
    default: return "Starter"
  }
}

/** In-code fallback mirroring the migration seed. */
const FALLBACK: Record<string, PlanLimits> = {
  "Starter": { plan: "Starter", maxActive: 3, maxRunsMonth: 250, maxNodes: 5, maxWebhooks: 0, retentionDays: 7, canvasAccess: "none", aiAccess: "none", nlAccess: "trial" },
  "Operator": { plan: "Operator", maxActive: 10, maxRunsMonth: 2500, maxNodes: 15, maxWebhooks: 2, retentionDays: 30, canvasAccess: "basic", aiAccess: "limited", nlAccess: "limited" },
  "Scale": { plan: "Scale", maxActive: 50, maxRunsMonth: 25000, maxNodes: 50, maxWebhooks: 10, retentionDays: 90, canvasAccess: "full", aiAccess: "full", nlAccess: "full" },
  "Pro / Agency": { plan: "Pro / Agency", maxActive: 200, maxRunsMonth: 250000, maxNodes: 150, maxWebhooks: 50, retentionDays: 365, canvasAccess: "advanced", aiAccess: "advanced", nlAccess: "advanced" },
  "Enterprise": { plan: "Enterprise", maxActive: 100000, maxRunsMonth: 100000000, maxNodes: 100000, maxWebhooks: 100000, retentionDays: 3650, canvasAccess: "advanced", aiAccess: "advanced", nlAccess: "advanced" },
}

function toLimits(plan: string, r: Record<string, unknown> | null): PlanLimits {
  const fb = FALLBACK[plan] ?? FALLBACK["Starter"]
  if (!r) return fb
  return {
    plan,
    maxActive: Number(r.max_active ?? fb.maxActive),
    maxRunsMonth: Number(r.max_runs_month ?? fb.maxRunsMonth),
    maxNodes: Number(r.max_nodes ?? fb.maxNodes),
    maxWebhooks: Number(r.max_webhooks ?? fb.maxWebhooks),
    retentionDays: Number(r.retention_days ?? fb.retentionDays),
    canvasAccess: (r.canvas_access as AccessLevel) ?? fb.canvasAccess,
    aiAccess: (r.ai_access as AccessLevel) ?? fb.aiAccess,
    nlAccess: (r.nl_access as AccessLevel) ?? fb.nlAccess,
  }
}

/** Read the governance limits for a tier (DB → fallback). */
export async function getPlanLimits(supabase: SupabaseClient, tier: PlanTier): Promise<PlanLimits> {
  const plan = tierToPlanLabel(tier)
  try {
    const { data } = await supabase.from(LIMITS_TABLE).select("*").eq("plan", plan).maybeSingle()
    return toLimits(plan, (data as Record<string, unknown> | null) ?? null)
  } catch {
    return FALLBACK[plan] ?? FALLBACK["Starter"]
  }
}

/** List all plan limits (admin surface). */
export async function listPlanLimits(supabase: SupabaseClient): Promise<PlanLimits[]> {
  try {
    const { data } = await supabase.from(LIMITS_TABLE).select("*")
    const rows = (data as Array<Record<string, unknown>>) ?? []
    if (rows.length === 0) return Object.values(FALLBACK)
    return rows.map((r) => toLimits(String(r.plan), r))
  } catch {
    return Object.values(FALLBACK)
  }
}

export interface UsageSnapshot {
  activeCount: number
  totalCount: number
  webhookCount: number
}

/** Read current usage counts for a workspace (tolerant). */
export async function getUsageSnapshot(supabase: SupabaseClient, workspaceId: string): Promise<UsageSnapshot> {
  let activeCount = 0, totalCount = 0, webhookCount = 0
  try {
    const { count: total } = await supabase.from(DEFINITIONS_TABLE).select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId)
    totalCount = total ?? 0
    const { count: active } = await supabase.from(DEFINITIONS_TABLE).select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("enabled", true)
    activeCount = active ?? 0
    const { count: wh } = await supabase.from(WEBHOOKS_TABLE).select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId)
    webhookCount = wh ?? 0
  } catch {
    /* tolerant */
  }
  return { activeCount, totalCount, webhookCount }
}

export interface LimitCheck {
  allowed: boolean
  reason?: string
  limit: number
  used: number
}

/** Can the workspace ACTIVATE another automation? */
export async function canActivateAnother(supabase: SupabaseClient, tier: PlanTier, workspaceId: string): Promise<LimitCheck> {
  const limits = await getPlanLimits(supabase, tier)
  const { activeCount } = await getUsageSnapshot(supabase, workspaceId)
  const allowed = activeCount < limits.maxActive
  return { allowed, limit: limits.maxActive, used: activeCount, reason: allowed ? undefined : `Active automation limit reached (${activeCount}/${limits.maxActive}). Upgrade or pause one.` }
}

/** Can the workspace add another webhook endpoint? */
export async function canAddWebhook(supabase: SupabaseClient, tier: PlanTier, workspaceId: string): Promise<LimitCheck> {
  const limits = await getPlanLimits(supabase, tier)
  const { webhookCount } = await getUsageSnapshot(supabase, workspaceId)
  const allowed = webhookCount < limits.maxWebhooks
  return { allowed, limit: limits.maxWebhooks, used: webhookCount, reason: allowed ? undefined : `Webhook limit reached (${webhookCount}/${limits.maxWebhooks}).` }
}

/** Does a graph fit the node budget for this plan? */
export function checkNodeBudget(limits: PlanLimits, nodeCount: number): LimitCheck {
  const allowed = nodeCount <= limits.maxNodes
  return { allowed, limit: limits.maxNodes, used: nodeCount, reason: allowed ? undefined : `This plan allows ${limits.maxNodes} nodes per automation (${nodeCount} used).` }
}
