// ============================================================================
// Propvora Affiliate Programme — levels, commission rules and shared helpers.
//
// SINGLE SOURCE OF TRUTH for commission rules across public pages, the affiliate
// dashboard and admin. Margin-safe defaults: 10% recurring for 6 months (NOT the
// 20%/12mo that earlier scaffolding wrongly advertised). Levels are driven by the
// count of ACTIVE valid paying referred customers, never clicks/signups.
// ============================================================================

export interface AffiliateLevel {
  band: number
  name: string
  /** Inclusive lower bound of active paying referrals to reach this band. */
  minReferrals: number
  /** Recurring commission rate as a fraction (0.10 = 10%). */
  rate: number
  durationMonths: number
  cookieWindowDays: number
  payoutDelayDays: number
  minPayoutPence: number
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
    blurb: "Custom approved terms, co-marketing and manual deal review.",
  },
]

export const DEFAULT_RATE = 0.1
export const DEFAULT_DURATION_MONTHS = 6
export const PENDING_DAYS = 30
export const MIN_PAYOUT_PENCE = 5000

/** Resolve the level for a given count of active paying referrals. */
export function levelForReferrals(activeReferrals: number): AffiliateLevel {
  let current = AFFILIATE_LEVELS[0]
  for (const lvl of AFFILIATE_LEVELS) {
    if (activeReferrals >= lvl.minReferrals) current = lvl
  }
  return current
}

/** Resolve a level by its stored band number (fallback to band 1). */
export function levelByBand(band: number | null | undefined): AffiliateLevel {
  return AFFILIATE_LEVELS.find((l) => l.band === band) ?? AFFILIATE_LEVELS[0]
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
