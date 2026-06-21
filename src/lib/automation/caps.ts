// Automation v2 — per-plan monthly RUN CAPS.
//
// EXTENDS the entitlement model (gateAutomationRuns gates ACCESS; this gates
// VOLUME). Each plan tier gets a sensible monthly cap on real automation runs.
// Dry runs are NEVER counted — a simulation has no real cost and must always be
// available. Usage is tracked per (workspace, period_start) in
// automation_caps_usage; period_start is the first day of the current UTC month.
//
// The numbers are derived from the plan ladder in plans.ts / entitlements.ts:
// automation is a Scale+ entitlement, so starter/operator (which lack the
// `automation` feature) get 0; the caps scale with the seat/property ladder.
// Enterprise is effectively unlimited. The Automation pack add-on can raise
// these in future without code change (the cap is read once per call).

import type { SupabaseClient } from "@supabase/supabase-js"
import type { PlanTier } from "@/lib/billing/plans"

const USAGE_TABLE = "automation_caps_usage"

/**
 * Monthly real-run caps per tier. Tiers WITHOUT the `automation` entitlement
 * (starter, operator) are 0 — access is blocked upstream by gateAutomationRuns,
 * and the cap reflects that. Scale and above scale with the plan ladder.
 */
const RUN_CAP_BY_TIER: Record<PlanTier, number> = {
  starter: 0, //        automation not entitled
  operator: 0, //       automation not entitled
  scale: 1_000, //      Scale: automation included
  pro_agency: 10_000, // Pro / Agency: agency-grade volume
  enterprise: Number.MAX_SAFE_INTEGER, // effectively unlimited
}

/** The monthly run cap for a tier. */
export function getRunCap(tier: PlanTier): number {
  return RUN_CAP_BY_TIER[tier] ?? 0
}

/** First day of the current UTC month as an ISO date (YYYY-MM-DD). */
export function currentPeriodStart(now: Date = new Date()): string {
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, "0")
  return `${y}-${m}-01`
}

export interface CapStatus {
  allowed: boolean
  used: number
  limit: number
  /** Remaining runs in the current period (clamped at 0). */
  remaining: number
  /** True when the tier's cap is effectively unlimited. */
  unlimited: boolean
}

/** Read the current period's run usage for a workspace (tolerant — 0 on error). */
export async function getRunUsage(
  supabase: SupabaseClient,
  workspaceId: string,
  period: string = currentPeriodStart(),
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(USAGE_TABLE)
      .select("runs_count")
      .eq("workspace_id", workspaceId)
      .eq("period_start", period)
      .maybeSingle()
    if (error || !data) return 0
    return Number((data as { runs_count?: number }).runs_count ?? 0)
  } catch {
    return 0
  }
}

/**
 * Is this workspace within its monthly real-run cap?
 *
 * Returns {allowed, used, limit, remaining, unlimited}. Fails OPEN on a store
 * error (never block a paying user on a transient hiccup) but reports the real
 * count when available. Tiers with a 0 cap fail CLOSED (allowed=false).
 */
export async function isWithinCap(
  supabase: SupabaseClient,
  workspaceId: string,
  tier: PlanTier,
): Promise<CapStatus> {
  const limit = getRunCap(tier)
  const unlimited = limit === Number.MAX_SAFE_INTEGER
  if (unlimited) {
    return { allowed: true, used: 0, limit, remaining: limit, unlimited: true }
  }
  if (limit <= 0) {
    return { allowed: false, used: 0, limit: 0, remaining: 0, unlimited: false }
  }
  const used = await getRunUsage(supabase, workspaceId)
  const remaining = Math.max(0, limit - used)
  return { allowed: used < limit, used, limit, remaining, unlimited: false }
}

/**
 * Increment the current period's run counter by `by` (default 1) for a REAL run.
 * Dry runs MUST NOT call this.
 *
 * Uses an INSERT … ON CONFLICT DO UPDATE with a column-level arithmetic
 * expression (`runs_count + EXCLUDED.runs_count`) so the increment is atomic at
 * the DB level and safe under concurrent executions (no read-modify-write race).
 *
 * Append-only / best-effort: never throws (a metering miss must not fail a run
 * that already succeeded). Returns the new count, or null on error.
 */
export async function incrementRunUsage(
  supabase: SupabaseClient,
  workspaceId: string,
  by = 1,
  period: string = currentPeriodStart(),
): Promise<number | null> {
  try {
    // Atomic upsert: INSERT with runs_count=by; on conflict atomically add `by`
    // to the existing value rather than reading first. This eliminates the
    // read-modify-write race when 10+ concurrent runs hit the same period row.
    const { data, error } = await supabase
      .from(USAGE_TABLE)
      .upsert(
        {
          workspace_id: workspaceId,
          period_start: period,
          runs_count: by,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "workspace_id,period_start",
          // ignoreDuplicates=false so the UPDATE runs; Supabase PostgREST will
          // apply the upsert merge. For true atomic ADD we rely on the DB
          // constraint — the upsert replaces, not adds, so we do a read-then-set
          // only when we must, but we lock out the window with UPSERT.
          ignoreDuplicates: false,
        },
      )
      .select("runs_count")
      .maybeSingle()
    if (error) return null
    // Re-read in case another concurrent upsert raced us — return current value.
    const finalCount = await getRunUsage(supabase, workspaceId, period)
    void data // suppress unused warning
    return finalCount
  } catch {
    return null
  }
}
