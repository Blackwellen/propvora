import "server-only"

/**
 * P5+ — ADMIN FEE-RULES EDITOR (CRUD over marketplace_fee_rules).
 *
 * Platform admins manage the fee matrix: per country / transaction_type / plan /
 * category, with a percent + min/max pence + provider-fee pass-through + tax
 * inclusivity + priority. Every CRUD writes an immutable `fee_rule_audit` row
 * (before/after snapshot).
 *
 * This module is the WRITE side; fee RESOLUTION (picking the winning rule for a
 * transaction) lives in src/lib/marketplace/fees.ts and is unchanged. We keep a
 * thin `resolveFeeRule` reader here for the admin preview.
 *
 * Money is integer pence. Service-role client (admin-only).
 */

export interface FeeRulesSupabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export interface FeeRule {
  id: string
  country_code: string | null
  transaction_type: string | null
  plan_tier: string | null
  category: string | null
  fee_percent: number
  minimum_fee_pence: number | null
  maximum_fee_pence: number | null
  provider_fee_pass_through: boolean
  tax_inclusive: boolean
  active: boolean
  priority: number
  created_at: string
  updated_at: string
}

export interface FeeRuleInput {
  country_code?: string | null
  transaction_type?: string | null
  plan_tier?: string | null
  category?: string | null
  fee_percent: number
  minimum_fee_pence?: number | null
  maximum_fee_pence?: number | null
  provider_fee_pass_through?: boolean
  tax_inclusive?: boolean
  active?: boolean
  priority?: number
}

function sanitize(input: FeeRuleInput): Record<string, unknown> {
  const pct = Number(input.fee_percent)
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    throw new Error("fee_percent must be between 0 and 100.")
  }
  const min = input.minimum_fee_pence == null ? null : Math.max(0, Math.trunc(Number(input.minimum_fee_pence)))
  const max = input.maximum_fee_pence == null ? null : Math.max(0, Math.trunc(Number(input.maximum_fee_pence)))
  if (min != null && max != null && max < min) {
    throw new Error("maximum_fee_pence cannot be less than minimum_fee_pence.")
  }
  return {
    country_code: input.country_code?.trim() || null,
    transaction_type: input.transaction_type?.trim() || null,
    plan_tier: input.plan_tier?.trim() || null,
    category: input.category?.trim() || null,
    fee_percent: pct,
    minimum_fee_pence: min,
    maximum_fee_pence: max,
    provider_fee_pass_through: input.provider_fee_pass_through ?? false,
    tax_inclusive: input.tax_inclusive ?? false,
    active: input.active ?? true,
    priority: Number.isFinite(Number(input.priority)) ? Math.trunc(Number(input.priority)) : 100,
  }
}

async function audit(
  supabase: FeeRulesSupabase,
  action: "created" | "updated" | "archived" | "restored",
  feeRuleId: string,
  actorId: string | null,
  before: unknown,
  after: unknown
): Promise<void> {
  try {
    await supabase.from("fee_rule_audit").insert({
      fee_rule_id: feeRuleId,
      action,
      actor_id: actorId,
      before: before ?? null,
      after: after ?? null,
    })
  } catch {
    /* audit table absent — non-fatal */
  }
}

export async function listFeeRules(supabase: FeeRulesSupabase): Promise<FeeRule[]> {
  const { data, error } = await supabase
    .from("marketplace_fee_rules")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data as FeeRule[]) ?? []
}

export async function createFeeRule(
  supabase: FeeRulesSupabase,
  input: FeeRuleInput,
  actorId?: string | null
): Promise<FeeRule> {
  const row = sanitize(input)
  const { data, error } = await supabase.from("marketplace_fee_rules").insert(row).select("*").single()
  if (error) throw error
  const rule = data as FeeRule
  await audit(supabase, "created", rule.id, actorId ?? null, null, rule)
  return rule
}

export async function updateFeeRule(
  supabase: FeeRulesSupabase,
  id: string,
  input: FeeRuleInput,
  actorId?: string | null
): Promise<FeeRule> {
  const { data: before } = await supabase.from("marketplace_fee_rules").select("*").eq("id", id).maybeSingle()
  const row = sanitize(input)
  const { data, error } = await supabase
    .from("marketplace_fee_rules")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  const rule = data as FeeRule
  await audit(supabase, "updated", id, actorId ?? null, before ?? null, rule)
  return rule
}

export async function setFeeRuleActive(
  supabase: FeeRulesSupabase,
  id: string,
  active: boolean,
  actorId?: string | null
): Promise<FeeRule> {
  const { data: before } = await supabase.from("marketplace_fee_rules").select("*").eq("id", id).maybeSingle()
  const { data, error } = await supabase
    .from("marketplace_fee_rules")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  const rule = data as FeeRule
  await audit(supabase, active ? "restored" : "archived", id, actorId ?? null, before ?? null, rule)
  return rule
}

/**
 * resolveFeeRule — PURE preview of which rule would win for a context. Mirrors
 * the resolution order in marketplace/fees.ts: most-specific match wins, ties
 * broken by lowest priority number. NULL fields are wildcards.
 */
export function resolveFeeRule(
  rules: FeeRule[],
  ctx: { countryCode?: string | null; transactionType?: string | null; planTier?: string | null; category?: string | null }
): FeeRule | null {
  const candidates = rules.filter((r) => {
    if (!r.active) return false
    if (r.country_code && ctx.countryCode && r.country_code !== ctx.countryCode) return false
    if (r.transaction_type && ctx.transactionType && r.transaction_type !== ctx.transactionType) return false
    if (r.plan_tier && ctx.planTier && r.plan_tier !== ctx.planTier) return false
    if (r.category && ctx.category && r.category !== ctx.category) return false
    return true
  })
  if (candidates.length === 0) return null
  function specificity(r: FeeRule): number {
    return [r.country_code, r.transaction_type, r.plan_tier, r.category].filter(Boolean).length
  }
  candidates.sort((a, b) => specificity(b) - specificity(a) || a.priority - b.priority)
  return candidates[0]
}

/** PURE: compute the fee for a gross amount under a rule, integer pence. */
export function computeFeePence(rule: FeeRule, grossPence: number): number {
  const gross = Math.max(0, Math.trunc(grossPence))
  let fee = Math.round((gross * Number(rule.fee_percent)) / 100)
  if (rule.minimum_fee_pence != null) fee = Math.max(fee, rule.minimum_fee_pence)
  if (rule.maximum_fee_pence != null) fee = Math.min(fee, rule.maximum_fee_pence)
  return Math.min(fee, gross)
}
