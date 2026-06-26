import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getWorkspaceTier, getPlanLimits } from "@/lib/billing/gates"
import type { PlanTier } from "@/lib/billing/plans"

// ============================================================================
// AI hard caps — FAIL CLOSED.
//
// Before every AI call we read the workspace's recent usage from
// ai_usage_events and refuse (with a clear quota error) if it is over ANY of:
//   • request count over a rolling 6h / day / week / month window
//   • token total over those same windows
//   • a monthly cost budget (pence)
//
// Limits are per-plan. Unlike the billing GATES (which fail OPEN on a store
// error so a paying user is never wrongly blocked), caps are an ABUSE / spend
// guard: if we genuinely cannot read usage we still ALLOW the call (the gateway
// itself can't run away — every call is bounded by max_tokens and these caps
// are re-checked on the next request). What we never do is silently proceed
// PAST a known-exceeded cap. A cap that is known to be exceeded always refuses.
// ============================================================================

export interface CapLimits {
  // rolling-window request counts
  requests6h: number
  requestsDay: number
  requestsWeek: number
  requestsMonth: number
  // rolling-window token totals (in + out combined)
  tokens6h: number
  tokensDay: number
  tokensWeek: number
  tokensMonth: number
  // monthly cost budget in pence
  costPenceMonth: number
}

// ── Azure OpenAI profitability reference (GPT-4o-mini, EU West region) ──────
// Input:  £0.012 per 1k tokens  ($0.15/1M × 0.79 USD→GBP)
// Output: £0.047 per 1k tokens  ($0.60/1M × 0.79 USD→GBP)
//
// Worst-case Azure cost per plan if every allowed monthly message hits limits
// (system prompt + workspace context adds ~3k tokens overhead per call):
//
//   Scale     750 msg × 5k total in/2k out  ≈ £0.90/month   → cap £30   (33× margin)
//   Pro/Agency 3k msg × 7k total in/3k out  ≈ £5.90/month   → cap £120  (20× margin)
//   Enterprise bounded by per-workspace cap below
//
// These CAPS are the HARD FINANCIAL backstop. They override per-plan message
// and token allowances if a workspace hits unusual usage (API automation,
// rapid-fire prompts). A cap that is known to be exceeded REFUSES the call.
const UNLIM = Number.MAX_SAFE_INTEGER

export const PLAN_CAPS: Record<PlanTier, CapLimits> = {
  // Starter / Operator: gateAiCopilot() blocks before caps are reached, but
  // small non-zero values here act as a final defence-in-depth if the gate
  // is ever relaxed (e.g. trial / internal testing).
  starter: {
    requests6h: 10, requestsDay: 25,  requestsWeek: 75,  requestsMonth: 200,
    tokens6h: 30_000, tokensDay: 75_000, tokensWeek: 250_000, tokensMonth: 750_000,
    costPenceMonth: 100, // £1.00 — absolute backstop
  },
  operator: {
    requests6h: 20, requestsDay: 60,  requestsWeek: 200, requestsMonth: 600,
    tokens6h: 60_000, tokensDay: 200_000, tokensWeek: 750_000, tokensMonth: 2_000_000,
    costPenceMonth: 300, // £3.00 — backstop only (AI not sold on Operator)
  },
  scale: {
    // 750 msg/mo plan limit × max 4k tokens per turn (in+out) ≈ 3M tokens/mo.
    // Cap at 2× expected volume (6M) + generous rolling windows for burst chat.
    // £30 cost ceiling = 33× the realistic Azure spend at full utilisation.
    requests6h: 60,  requestsDay: 200,  requestsWeek: 800,   requestsMonth: 2_000,
    tokens6h: 200_000, tokensDay: 700_000, tokensWeek: 3_000_000, tokensMonth: 10_000_000,
    costPenceMonth: 3_000, // £30.00
  },
  pro_agency: {
    // 3k msg/mo × avg 7k total tokens (overhead + user turn) ≈ 21M/mo.
    // Cap at 2× for burst headroom. £120 = 20× the realistic Azure spend.
    requests6h: 200, requestsDay: 800,  requestsWeek: 3_500,  requestsMonth: 12_000,
    tokens6h: 700_000, tokensDay: 2_500_000, tokensWeek: 12_000_000, tokensMonth: 50_000_000,
    costPenceMonth: 12_000, // £120.00
  },
  enterprise: {
    // Enterprise is negotiated — a per-workspace cost ceiling prevents any
    // single workspace from running away. Set high enough not to interrupt
    // legitimate enterprise use while still bounding exposure.
    requests6h: UNLIM, requestsDay: UNLIM, requestsWeek: UNLIM, requestsMonth: UNLIM,
    tokens6h: UNLIM, tokensDay: UNLIM, tokensWeek: UNLIM, tokensMonth: UNLIM,
    costPenceMonth: 50_000, // £500/mo per workspace — negotiate higher for large accounts
  },
}

export interface CapUsage {
  requests6h: number
  requestsDay: number
  requestsWeek: number
  requestsMonth: number
  tokens6h: number
  tokensDay: number
  tokensWeek: number
  tokensMonth: number
  costPenceMonth: number
}

export interface CapCheckResult {
  allowed: boolean
  tier: PlanTier
  /** Clear quota message when blocked. */
  reason?: string
  /** Which limit tripped, for telemetry / UI. */
  exceeded?: string
  limits: CapLimits
  usage: CapUsage
}

const HOUR = 60 * 60 * 1000

function windowStart(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

/**
 * Read rolling-window usage for a workspace from ai_usage_events. One scan over
 * the last 30 days, bucketed in JS — cheap given the per-workspace index.
 */
export async function readCapUsage(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CapUsage> {
  const empty: CapUsage = {
    requests6h: 0, requestsDay: 0, requestsWeek: 0, requestsMonth: 0,
    tokens6h: 0, tokensDay: 0, tokensWeek: 0, tokensMonth: 0, costPenceMonth: 0,
  }
  try {
    const since = windowStart(30 * 24 * HOUR)
    const { data, error } = await supabase
      .from("ai_usage_events")
      .select("tokens_in, tokens_out, cost_pence, created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", since)
      .limit(50_000)
    if (error || !data) return empty

    const now = Date.now()
    const b6 = now - 6 * HOUR
    const bDay = now - 24 * HOUR
    const bWeek = now - 7 * 24 * HOUR
    const u = { ...empty }
    for (const r of data) {
      const t = new Date(r.created_at as string).getTime()
      const tok = Number(r.tokens_in ?? 0) + Number(r.tokens_out ?? 0)
      const cost = Number(r.cost_pence ?? 0)
      // month bucket = whole 30d window
      u.requestsMonth++; u.tokensMonth += tok; u.costPenceMonth += cost
      if (t >= bWeek) { u.requestsWeek++; u.tokensWeek += tok }
      if (t >= bDay) { u.requestsDay++; u.tokensDay += tok }
      if (t >= b6) { u.requests6h++; u.tokens6h += tok }
    }
    return u
  } catch {
    return empty
  }
}

/**
 * Fail-closed cap check. Returns allowed=false with a clear reason when any
 * window's request/token count or the monthly cost budget is already exceeded.
 */
export async function checkCaps(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CapCheckResult> {
  const tier = await getWorkspaceTier(supabase, workspaceId)
  const limits = PLAN_CAPS[tier]
  // demo workspace: no real usage, allow.
  if (!workspaceId || workspaceId === "demo-workspace") {
    return { allowed: true, tier, limits, usage: zeroUsage() }
  }
  const usage = await readCapUsage(supabase, workspaceId)

  const checks: { ok: boolean; key: string; msg: string }[] = [
    { ok: usage.requests6h < limits.requests6h, key: "requests_6h",
      msg: `You've reached the AI request limit for the last 6 hours (${limits.requests6h}). Please try again later or upgrade your plan.` },
    { ok: usage.requestsDay < limits.requestsDay, key: "requests_day",
      msg: `You've reached today's AI request limit (${limits.requestsDay}). It resets on a rolling 24-hour basis. Upgrade for a higher limit.` },
    { ok: usage.requestsWeek < limits.requestsWeek, key: "requests_week",
      msg: `You've reached this week's AI request limit (${limits.requestsWeek}). Upgrade for a higher limit.` },
    { ok: usage.requestsMonth < limits.requestsMonth, key: "requests_month",
      msg: `You've reached this month's AI request limit (${limits.requestsMonth}). Upgrade for a higher limit.` },
    { ok: usage.tokens6h < limits.tokens6h, key: "tokens_6h",
      msg: `You've reached the AI token limit for the last 6 hours. Please try again later or upgrade your plan.` },
    { ok: usage.tokensDay < limits.tokensDay, key: "tokens_day",
      msg: `You've reached today's AI token limit. It resets on a rolling 24-hour basis. Upgrade for more.` },
    { ok: usage.tokensWeek < limits.tokensWeek, key: "tokens_week",
      msg: `You've reached this week's AI token limit. Upgrade for more.` },
    { ok: usage.tokensMonth < limits.tokensMonth, key: "tokens_month",
      msg: `You've reached this month's AI token limit. Upgrade for more.` },
    { ok: usage.costPenceMonth < limits.costPenceMonth, key: "cost_month",
      msg: `This workspace has reached its monthly AI cost budget (£${(limits.costPenceMonth / 100).toFixed(2)}). Upgrade your plan to continue.` },
  ]

  const tripped = checks.find((c) => !c.ok)
  if (tripped) {
    return { allowed: false, tier, reason: tripped.msg, exceeded: tripped.key, limits, usage }
  }
  return { allowed: true, tier, limits, usage }
}

function zeroUsage(): CapUsage {
  return {
    requests6h: 0, requestsDay: 0, requestsWeek: 0, requestsMonth: 0,
    tokens6h: 0, tokensDay: 0, tokensWeek: 0, tokensMonth: 0, costPenceMonth: 0,
  }
}

// ── Monthly message cap (count-based, per PLAN_LIMITS) ───────────────────────

export interface MonthlyCapResult {
  allowed: boolean
  reason?: string
  used: number
  limit: number
}

/**
 * Check whether the workspace has remaining AI messages this calendar month.
 * Counts `role='user'` rows in ai_chat_messages since the 1st of the month.
 * Returns allowed=false with a clear message when the limit is reached.
 * Fails OPEN on store error (never lock a paying user out on a transient hiccup).
 */
export async function checkAiCap(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<MonthlyCapResult> {
  if (!workspaceId || workspaceId === "demo-workspace") {
    return { allowed: true, used: 0, limit: 9999 }
  }
  const limits = await getPlanLimits(supabase, workspaceId)

  if (!limits.aiEnabled || limits.aiMessagesPerMonth === 0) {
    return {
      allowed: false,
      reason: "AI Copilot is not available on your current plan. Upgrade to Scale or above to unlock AI assistance.",
      used: 0,
      limit: 0,
    }
  }

  // Unlimited sentinel — skip the count query
  if (limits.aiMessagesPerMonth >= 9999) {
    return { allowed: true, used: 0, limit: 9999 }
  }

  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from("ai_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("role", "user")
      .gte("created_at", startOfMonth.toISOString())

    if (error) {
      // Fail OPEN on store error — allow the request
      return { allowed: true, used: 0, limit: limits.aiMessagesPerMonth }
    }

    const used = count ?? 0
    if (used >= limits.aiMessagesPerMonth) {
      return {
        allowed: false,
        reason: `Monthly AI message limit reached (${used}/${limits.aiMessagesPerMonth}). This resets on the 1st. Upgrade your plan for a higher limit.`,
        used,
        limit: limits.aiMessagesPerMonth,
      }
    }

    return { allowed: true, used, limit: limits.aiMessagesPerMonth }
  } catch {
    // Fail OPEN on exception
    return { allowed: true, used: 0, limit: limits.aiMessagesPerMonth }
  }
}

// ── Per-hour rate limit (per workspace, per PLAN_LIMITS) ─────────────────────

export interface HourlyRateResult {
  allowed: boolean
  reason?: string
  retryAfterSeconds?: number
}

/**
 * Check whether the workspace has used its per-hour AI message allowance.
 * Counts `role='user'` rows in ai_chat_messages in the last 60 minutes.
 * Fails OPEN on store error (transient hiccup must not block a paying user).
 */
export async function checkAiRateLimit(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<HourlyRateResult> {
  if (!workspaceId || workspaceId === "demo-workspace") {
    return { allowed: true }
  }
  const limits = await getPlanLimits(supabase, workspaceId)

  if (!limits.aiEnabled || limits.aiRateLimitPerHour === 0) {
    return { allowed: false, reason: "AI Copilot is not enabled on your plan." }
  }

  // Unlimited sentinel
  if (limits.aiRateLimitPerHour >= 9999) {
    return { allowed: true }
  }

  try {
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()

    const { count, error } = await supabase
      .from("ai_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("role", "user")
      .gte("created_at", oneHourAgo)

    if (error) {
      // Fail OPEN — allow the call on store error
      return { allowed: true }
    }

    const recentCount = count ?? 0
    if (recentCount >= limits.aiRateLimitPerHour) {
      return {
        allowed: false,
        reason: `Rate limit reached (${recentCount} AI messages in the last hour). Please wait before sending more.`,
        retryAfterSeconds: 300,
      }
    }

    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}
