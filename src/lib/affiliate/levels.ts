// ============================================================================
// Propvora Affiliate Programme — levels, commission rules and shared helpers.
//
// SINGLE SOURCE OF TRUTH for all commission rules across public pages, the
// affiliate dashboard, and admin. Margin-safe defaults: 10% recurring for 6
// months (NOT the 20%/12mo that earlier scaffolding wrongly advertised).
// Levels are driven by the count of ACTIVE valid paying referred customers,
// never clicks/signups.
// ============================================================================

export interface AffiliateLevel {
  band: number
  name: string
  /** Inclusive lower bound of active paying referrals to reach this band. */
  minReferrals: number
  /** Direct commission rate as a fraction (0.10 = 10%). */
  rate: number
  durationMonths: number
  cookieWindowDays: number
  payoutDelayDays: number
  minPayoutPence: number
  /** Sub-affiliate earn-through rate (fraction) for recruits at this band. */
  subAffiliateRate: number
  blurb: string
}

export const AFFILIATE_LEVELS: AffiliateLevel[] = [
  {
    band: 1,
    name: "Approved Affiliate",
    minReferrals: 1,
    rate: 0.1,
    durationMonths: 6,
    cookieWindowDays: 60,
    payoutDelayDays: 30,
    minPayoutPence: 5000,
    subAffiliateRate: 0.03,
    blurb: "Dashboard, referral links, assets, earnings and payouts.",
  },
  {
    band: 2,
    name: "Growth Partner",
    minReferrals: 3,
    rate: 0.1,
    durationMonths: 6,
    cookieWindowDays: 60,
    payoutDelayDays: 30,
    minPayoutPence: 5000,
    subAffiliateRate: 0.03,
    blurb: "Priority assets, partner resources and dashboard badges.",
  },
  {
    band: 3,
    name: "Pro Partner",
    minReferrals: 10,
    rate: 0.12,
    durationMonths: 6,
    cookieWindowDays: 60,
    payoutDelayDays: 30,
    minPayoutPence: 5000,
    subAffiliateRate: 0.03,
    blurb: "Enhanced assets, priority support and co-branded review.",
  },
  {
    band: 4,
    name: "Elite Partner",
    minReferrals: 25,
    rate: 0.15,
    durationMonths: 6,
    cookieWindowDays: 60,
    payoutDelayDays: 30,
    minPayoutPence: 5000,
    subAffiliateRate: 0.05,
    blurb: "Featured-partner eligibility and custom campaign support.",
  },
  {
    band: 5,
    name: "Strategic Partner",
    minReferrals: 50,
    rate: 0.15,
    durationMonths: 6,
    cookieWindowDays: 90,
    payoutDelayDays: 30,
    minPayoutPence: 5000,
    subAffiliateRate: 0.05,
    blurb: "Custom approved terms, co-marketing and manual deal review.",
  },
]

export const DEFAULT_RATE = 0.1
export const DEFAULT_DURATION_MONTHS = 6
export const PENDING_DAYS = 30
export const MIN_PAYOUT_PENCE = 5000

// ── Discount link ─────────────────────────────────────────────────────────────

/** Percentage discount applied to the customer's first 3 months when they use
 *  the affiliate's discount link (absorbed by Propvora, not deducted from commission). */
export const DISCOUNT_LINK_PERCENT = 5
/** Extended trial length (days) for customers arriving via the discount link. */
export const DISCOUNT_TRIAL_DAYS = 30

/** Generate the discount referral code from the standard code.
 *  E.g. "alice-x7f2" → "alice-x7f2-5off" */
export function discountCodeFromHandle(referralCode: string): string {
  return `${referralCode}-5off`
}

// ── Milestone bonuses ─────────────────────────────────────────────────────────

export interface MilestoneConfig {
  key: "m5" | "m15" | "m50"
  /** Active paying referrals required to unlock. */
  threshold: number
  bonusPence: number
  label: string
}

export const MILESTONE_CONFIGS: MilestoneConfig[] = [
  { key: "m5",  threshold: 5,  bonusPence: 5000,  label: "5 referrals — £50 bonus" },
  { key: "m15", threshold: 15, bonusPence: 15000, label: "15 referrals — £150 bonus" },
  { key: "m50", threshold: 50, bonusPence: 50000, label: "50 referrals — £500 bonus" },
]

/** Return which milestones should be awarded given current active referral count
 *  and which milestones are already awarded. */
export function pendingMilestones(
  activeReferrals: number,
  awarded: { m5: boolean; m15: boolean; m50: boolean }
): MilestoneConfig[] {
  return MILESTONE_CONFIGS.filter((m) => {
    if (activeReferrals < m.threshold) return false
    return !awarded[m.key]
  })
}

// ── Level helpers ─────────────────────────────────────────────────────────────

/** Resolve the level for a given count of active paying referrals. */
export function levelForReferrals(activeReferrals: number): AffiliateLevel {
  let current = AFFILIATE_LEVELS[0]
  for (const lvl of AFFILIATE_LEVELS) {
    if (activeReferrals >= lvl.minReferrals) current = lvl
  }
  return current
}

/** Resolve a level by its stored band number (fallback to band 1). */
export function levelByBand(band: number | string | null | undefined): AffiliateLevel {
  const legacyNames: Record<string, number> = {
    bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5, elite: 5,
  }
  const resolved = typeof band === "string" ? legacyNames[band.toLowerCase()] : band
  return AFFILIATE_LEVELS.find((l) => l.band === resolved) ?? AFFILIATE_LEVELS[0]
}

export function formatPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    (pence ?? 0) / 100
  )
}

/** Audience types offered on the public application form. */
export const AUDIENCE_TYPES = [
  "Property consultant",
  "Letting agent",
  "Property manager",
  "Landlord educator",
  "Content creator",
  "Supplier network",
  "Accountant / bookkeeper",
  "Compliance consultant",
  "Existing customer",
  "Agency",
  "Other",
] as const

export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "pending_review",
  "approved",
  "rejected",
  "needs_more_info",
  "waitlisted",
  "suspended",
] as const
