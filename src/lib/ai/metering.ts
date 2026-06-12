import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// AI metering + rate limiting against the existing live tables:
//   ai_rate_counters   (workspace_id, window_start, count, updated_at)
//   ai_usage_metering  (per-call: tokens, model, cost_usd, ...)
//   ai_token_usage     (daily rollup: workspace_id, day, tokens_in/out, cost_pence)
//
// All writes are best-effort: a logging/limit-store failure must never break a
// user's chat. Rate limiting fails OPEN here (app-level soft guard) — the hard
// edge limits live in the MAX RELEASE hardening phase (Cloudflare/Upstash).
// ============================================================================

const WINDOW_MS = 60 * 1000 // 1-minute fixed window
const DEFAULT_LIMIT = 20 // messages per workspace per window

export interface RateResult {
  allowed: boolean
  remaining: number
}

/**
 * Fixed-window per-workspace rate check. Best-effort: on any store error we
 * allow the request (fail-open) so logging problems never lock users out.
 */
export async function checkRate(
  supabase: SupabaseClient,
  workspaceId: string,
  limit = DEFAULT_LIMIT
): Promise<RateResult> {
  if (!workspaceId || workspaceId === "demo-workspace") return { allowed: true, remaining: limit }
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS).toISOString()
  try {
    const { data, error } = await supabase
      .from("ai_rate_counters")
      .select("count")
      .eq("workspace_id", workspaceId)
      .eq("window_start", windowStart)
      .maybeSingle()
    if (error) return { allowed: true, remaining: limit }

    const current = (data?.count as number | undefined) ?? 0
    if (current >= limit) return { allowed: false, remaining: 0 }

    // increment (upsert) — best-effort
    await supabase
      .from("ai_rate_counters")
      .upsert(
        { workspace_id: workspaceId, window_start: windowStart, count: current + 1, updated_at: new Date().toISOString() },
        { onConflict: "workspace_id,window_start" }
      )
    return { allowed: true, remaining: Math.max(0, limit - current - 1) }
  } catch {
    return { allowed: true, remaining: limit }
  }
}

export interface UsageInput {
  workspaceId: string
  userId: string
  actionType: string
  model: string
  inputTokens: number
  outputTokens: number
  entityType?: string
  entityId?: string
}

/** GPT-4o-mini approx cost (USD): $0.15 / 1M in, $0.60 / 1M out. Coarse but honest. */
function estimateCostUsd(inTok: number, outTok: number): number {
  return (inTok / 1_000_000) * 0.15 + (outTok / 1_000_000) * 0.6
}

/** Record per-call metering + daily rollup. Best-effort, never throws. */
export async function recordUsage(supabase: SupabaseClient, u: UsageInput): Promise<void> {
  if (!u.workspaceId || u.workspaceId === "demo-workspace") return
  const costUsd = estimateCostUsd(u.inputTokens, u.outputTokens)

  // Per-call row
  try {
    await supabase.from("ai_usage_metering").insert({
      workspace_id: u.workspaceId,
      user_id: u.userId,
      action_type: u.actionType,
      model: u.model,
      input_tokens: u.inputTokens,
      output_tokens: u.outputTokens,
      cost_usd: costUsd,
      entity_type: u.entityType ?? null,
      entity_id: u.entityId ?? null,
    })
  } catch {
    /* non-fatal */
  }

  // Daily rollup
  try {
    const day = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from("ai_token_usage")
      .select("tokens_in, tokens_out, cost_pence")
      .eq("workspace_id", u.workspaceId)
      .eq("day", day)
      .maybeSingle()
    const tokIn = Number(data?.tokens_in ?? 0) + u.inputTokens
    const tokOut = Number(data?.tokens_out ?? 0) + u.outputTokens
    const costPence = Number(data?.cost_pence ?? 0) + Math.round(costUsd * 79) // ~USD→pence
    await supabase
      .from("ai_token_usage")
      .upsert(
        { workspace_id: u.workspaceId, day, tokens_in: tokIn, tokens_out: tokOut, cost_pence: costPence, updated_at: new Date().toISOString() },
        { onConflict: "workspace_id,day" }
      )
  } catch {
    /* non-fatal */
  }
}

/** Today's token total for a workspace (for the live "credits" footer). */
export async function getDailyUsage(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<{ tokensIn: number; tokensOut: number; costPence: number } | null> {
  if (!workspaceId || workspaceId === "demo-workspace") return null
  try {
    const day = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from("ai_token_usage")
      .select("tokens_in, tokens_out, cost_pence")
      .eq("workspace_id", workspaceId)
      .eq("day", day)
      .maybeSingle()
    if (error || !data) return null
    return {
      tokensIn: Number(data.tokens_in ?? 0),
      tokensOut: Number(data.tokens_out ?? 0),
      costPence: Number(data.cost_pence ?? 0),
    }
  } catch {
    return null
  }
}
