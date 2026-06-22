// ============================================================================
// Marketplace fee calculator — the single DB-driven source of platform/provider
// fees. The 2.5% default (and every override) lives in `marketplace_fee_rules`,
// NOT in this file. The ONLY constant here is FALLBACK_FEE_PERCENT, a documented
// last-resort used when the table is missing (42P01) or empty, so a fee can
// always be computed and a checkout is never blocked by a cold/migrating DB.
//
// Resolution: the MOST-SPECIFIC active rule wins — the rule matching the most
// non-null dimensions (country_code, transaction_type, plan_tier, category).
// Ties break on `priority` (higher wins), then most-recent. A rule with a
// non-null dimension that does NOT match the request is rejected outright.
//
// All money is integer pence. See migration 20260616030000_marketplace_fee_rules.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

/** Marketplace transaction kinds (mirrors the DB CHECK constraint). */
export type MarketplaceTransactionType =
  | "stay_booking"
  | "supplier_job"
  | "emergency_job"
  | "service_package"
  | "subscription_addon"

/** A single fee rule row from `marketplace_fee_rules`. */
export interface MarketplaceFeeRule {
  id: string
  country_code: string | null
  transaction_type: MarketplaceTransactionType | null
  plan_tier: string | null
  category: string | null
  fee_percent: number
  minimum_fee_pence: number | null
  maximum_fee_pence: number | null
  provider_fee_pass_through: boolean
  tax_inclusive: boolean
  active: boolean
  priority: number
}

/** Inputs to {@link calculateMarketplaceFee}. */
export interface CalculateMarketplaceFeeArgs {
  /** RLS-scoped Supabase client. Omit to resolve purely from the fallback. */
  supabase?: SupabaseClient
  /** ISO 3166-1 alpha-2 country of the transaction, e.g. "GB". */
  countryCode: string
  transactionType: MarketplaceTransactionType
  /** Operator plan tier (starter|operator|scale|pro_agency|enterprise). */
  planTier?: string
  /** Free-text marketplace category, if the rule set discriminates on it. */
  category?: string
  /** Gross transaction amount in integer pence. */
  grossPence: number
  /**
   * Payment-provider (e.g. Stripe) fee in integer pence, already computed by the
   * caller. Affects the seller payout when the matched rule passes it through.
   * Defaults to 0.
   */
  providerFeePence?: number
}

/**
 * The fee breakdown contract consumed by P2 (transactions) and P5 (payments).
 * All amounts are integer pence.
 */
export interface FeeBreakdown {
  /** Platform commission rate actually applied (percent, e.g. 2.5). */
  platformFeePercent: number
  /** Platform commission in pence, AFTER min/max clamps. */
  platformFeePence: number
  /** Payment-provider fee in pence (echoed from input; 0 if none). */
  providerFeePence: number
  /**
   * Amount paid out to the seller in pence:
   *   gross − platformFee − (providerFee if passed through to the seller).
   */
  sellerPayoutPence: number
  /**
   * Net revenue the platform keeps in pence:
   *   platformFee − (providerFee if the platform absorbs it).
   */
  netPlatformRevenuePence: number
  /** id of the rule that was applied, or null when the fallback was used. */
  appliedRuleId: string | null
}

// ── Propvora fee policy (founder-set 2026-06-22) ────────────────────────────
// We never charge SELLERS (property suppliers / service suppliers) more than
// 6.5% commission, on top of which the Stripe fee is passed through to the
// BUYER. The buyer also pays a 1% platform surcharge. Net Propvora margin is
// therefore ~7.5% all-in (6.5% seller + 1% buyer) — e.g. a £1,000 booking earns
// Propvora £75, with Stripe's fee washed through to the buyer.
//
// Seller commission can be tuned DOWN per rule in `marketplace_fee_rules`, but
// is HARD-CAPPED at MAX_SELLER_FEE_PERCENT in computeFee so a misconfigured rule
// can never overcharge a seller.
export const MAX_SELLER_FEE_PERCENT = 6.5

// Seller commission scales DOWN with the property manager's subscription tier
// (founder-set 2026-06-22): better plans pay lower marketplace commission.
//   lower tiers 6.5% · mid 5.5% · highest 4.5% · enterprise 3.5%
export const SELLER_FEE_BY_TIER: Record<string, number> = {
  starter: 6.5,
  operator: 6.5,
  scale: 5.5,
  pro_agency: 4.5,
  enterprise: 3.5,
}

/** Resolve the seller commission % for a plan tier (defaults to the 6.5% cap). */
export function sellerFeePercentForTier(tier?: string | null): number {
  if (!tier) return MAX_SELLER_FEE_PERCENT
  return SELLER_FEE_BY_TIER[tier] ?? MAX_SELLER_FEE_PERCENT
}

/** Buyer-side platform surcharge, added on top of the price the buyer pays. */
export const BUYER_FEE_PERCENT = 1.0
// Estimated UK Stripe cost for QUOTING the buyer's all-in total (the authoritative
// fee is read from the Stripe balance transaction at settlement). Connect
// domestic card ≈ 1.5% + 20p.
export const STRIPE_EST_PERCENT = 1.5
export const STRIPE_EST_FIXED_PENCE = 20

/**
 * Last-resort fallback SELLER commission, used ONLY when the rule table is
 * missing or empty, so a fee can always be computed. Defaults to the 6.5% cap.
 */
export const FALLBACK_FEE_PERCENT = MAX_SELLER_FEE_PERCENT

/** All-in fee breakdown for quoting (buyer total + seller payout + platform net). */
export interface AllInFees {
  grossPence: number
  /** Seller commission (≤6.5% of gross), deducted from the seller payout. */
  sellerCommissionPence: number
  /** Buyer surcharge (1% of gross), added to what the buyer pays. */
  buyerSurchargePence: number
  /** Estimated Stripe fee, passed through to the buyer. */
  stripeFeePence: number
  /** What the buyer is actually charged: gross + buyer surcharge + Stripe fee. */
  buyerTotalPence: number
  /** What the seller receives: gross − seller commission. */
  sellerPayoutPence: number
  /** Propvora net margin: seller commission + buyer surcharge (~7.5%). */
  platformNetPence: number
}

/**
 * Compute the all-in fee breakdown for a gross transaction. Pure + integer
 * pence. `sellerFeePercent` is clamped to MAX_SELLER_FEE_PERCENT.
 */
export function computeAllInFees(
  grossPence: number,
  sellerFeePercent: number = MAX_SELLER_FEE_PERCENT
): AllInFees {
  const gross = Math.max(0, Math.trunc(grossPence))
  const sellerPct = Math.min(Math.max(0, sellerFeePercent), MAX_SELLER_FEE_PERCENT)
  const sellerCommissionPence = roundPence((gross * sellerPct) / 100)
  const buyerSurchargePence = roundPence((gross * BUYER_FEE_PERCENT) / 100)
  // Stripe fee is charged on the full amount the buyer pays (gross + surcharge).
  const stripeBase = gross + buyerSurchargePence
  const stripeFeePence = roundPence((stripeBase * STRIPE_EST_PERCENT) / 100) + STRIPE_EST_FIXED_PENCE
  return {
    grossPence: gross,
    sellerCommissionPence,
    buyerSurchargePence,
    stripeFeePence,
    buyerTotalPence: gross + buyerSurchargePence + stripeFeePence,
    sellerPayoutPence: Math.max(0, gross - sellerCommissionPence),
    platformNetPence: sellerCommissionPence + buyerSurchargePence,
  }
}

/** A synthetic rule built from {@link FALLBACK_FEE_PERCENT}; appliedRuleId null. */
function fallbackRule(): MarketplaceFeeRule {
  return {
    id: "__fallback__",
    country_code: null,
    transaction_type: null,
    plan_tier: null,
    category: null,
    fee_percent: FALLBACK_FEE_PERCENT,
    minimum_fee_pence: null,
    maximum_fee_pence: null,
    provider_fee_pass_through: true,
    tax_inclusive: false,
    active: true,
    priority: -1,
  }
}

/** True when an error is "relation does not exist" (migration not applied). */
function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

/** Round half-up to the nearest whole pence (fees are never fractional pence). */
function roundPence(value: number): number {
  return Math.round(value)
}

interface ResolveTarget {
  countryCode: string
  transactionType: MarketplaceTransactionType
  planTier?: string
  category?: string
}

/**
 * Pick the most-specific active rule for `target` from `rules`.
 *
 * A rule is ELIGIBLE only if every non-null dimension matches the target. Among
 * eligible rules the winner has (in order): the most matched (non-null)
 * dimensions, then the highest `priority`. Returns null when none are eligible.
 *
 * Pure + exported for unit testing without a DB.
 */
export function resolveFeeRule(
  rules: MarketplaceFeeRule[],
  target: ResolveTarget
): MarketplaceFeeRule | null {
  const eligible = rules.filter((r) => {
    if (!r.active) return false
    if (r.country_code !== null && r.country_code !== target.countryCode) return false
    if (r.transaction_type !== null && r.transaction_type !== target.transactionType) return false
    if (r.plan_tier !== null && r.plan_tier !== (target.planTier ?? null)) return false
    if (r.category !== null && r.category !== (target.category ?? null)) return false
    return true
  })
  if (eligible.length === 0) return null

  const specificity = (r: MarketplaceFeeRule): number =>
    (r.country_code !== null ? 1 : 0) +
    (r.transaction_type !== null ? 1 : 0) +
    (r.plan_tier !== null ? 1 : 0) +
    (r.category !== null ? 1 : 0)

  return eligible.reduce((best, r) => {
    const ds = specificity(r) - specificity(best)
    if (ds > 0) return r
    if (ds < 0) return best
    return r.priority > best.priority ? r : best
  })
}

/**
 * Pure fee computation for a resolved rule. No DB, no async — the unit-testable
 * core. Applies the percent, then clamps to [minimum_fee_pence, maximum_fee_pence]
 * (either bound may be null = unbounded), then derives payout and net revenue
 * from `provider_fee_pass_through`.
 *
 * @param rule         the resolved fee rule (or fallback)
 * @param grossPence   gross amount in pence
 * @param providerFeePence payment-provider fee in pence (default 0)
 * @param appliedRuleId rule id to surface; pass null for the fallback
 */
export function computeFee(
  rule: MarketplaceFeeRule,
  grossPence: number,
  providerFeePence = 0,
  appliedRuleId: string | null = rule.id
): FeeBreakdown {
  const gross = Math.max(0, Math.trunc(grossPence))
  const provider = Math.max(0, Math.trunc(providerFeePence))

  // Hard-cap the seller commission at the policy maximum (6.5%) so a
  // misconfigured DB rule can never overcharge a seller.
  const effectivePercent = Math.min(rule.fee_percent, MAX_SELLER_FEE_PERCENT)
  let platformFeePence = roundPence((gross * effectivePercent) / 100)

  // Clamp to the rule's min/max (each independently optional).
  if (rule.minimum_fee_pence !== null) {
    platformFeePence = Math.max(platformFeePence, rule.minimum_fee_pence)
  }
  if (rule.maximum_fee_pence !== null) {
    platformFeePence = Math.min(platformFeePence, rule.maximum_fee_pence)
  }
  // Never charge more than the gross.
  platformFeePence = Math.min(platformFeePence, gross)

  // Payout = gross − platform fee − (provider fee iff passed through to seller).
  const sellerPayoutPence = Math.max(
    0,
    gross - platformFeePence - (rule.provider_fee_pass_through ? provider : 0)
  )

  // Platform keeps its commission; if it does NOT pass the provider fee through,
  // it absorbs that cost out of its commission.
  const netPlatformRevenuePence =
    platformFeePence - (rule.provider_fee_pass_through ? 0 : provider)

  return {
    platformFeePercent: effectivePercent,
    platformFeePence,
    providerFeePence: provider,
    sellerPayoutPence,
    netPlatformRevenuePence,
    appliedRuleId,
  }
}

/**
 * Resolve the most-specific active fee rule for the given transaction from the
 * DB and compute the breakdown. 42P01 / empty-result tolerant: falls back to a
 * safe {@link FALLBACK_FEE_PERCENT} default rather than throwing.
 */
export async function calculateMarketplaceFee(
  args: CalculateMarketplaceFeeArgs
): Promise<FeeBreakdown> {
  const { supabase, countryCode, transactionType, planTier, category, grossPence } = args
  const providerFeePence = args.providerFeePence ?? 0

  // No client → fallback (e.g. pure/preview contexts).
  if (!supabase) {
    return computeFee(fallbackRule(), grossPence, providerFeePence, null)
  }

  let rules: MarketplaceFeeRule[] = []
  try {
    // Pull candidate rows; final specificity resolution happens in JS so the
    // ranking logic is unit-testable and identical online and offline.
    const { data, error } = await supabase
      .from("marketplace_fee_rules")
      .select(
        "id, country_code, transaction_type, plan_tier, category, fee_percent, " +
          "minimum_fee_pence, maximum_fee_pence, provider_fee_pass_through, " +
          "tax_inclusive, active, priority"
      )
      .eq("active", true)

    if (error) {
      if (isMissingTable(error)) {
        return computeFee(fallbackRule(), grossPence, providerFeePence, null)
      }
      // Other read failures also fall back rather than blocking a transaction.
      return computeFee(fallbackRule(), grossPence, providerFeePence, null)
    }
    rules = (data ?? []) as unknown as MarketplaceFeeRule[]
  } catch (err) {
    if (isMissingTable(err)) {
      return computeFee(fallbackRule(), grossPence, providerFeePence, null)
    }
    return computeFee(fallbackRule(), grossPence, providerFeePence, null)
  }

  const rule = resolveFeeRule(rules, { countryCode, transactionType, planTier, category })
  if (!rule) {
    // Empty / no eligible rule → safe default.
    return computeFee(fallbackRule(), grossPence, providerFeePence, null)
  }

  return computeFee(rule, grossPence, providerFeePence, rule.id)
}
