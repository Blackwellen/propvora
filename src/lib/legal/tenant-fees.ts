/**
 * Tenant fees / permitted payments (dimension 22).
 *
 * Banned-fee regimes: Tenant Fees Act 2019 (England), Scotland (no premiums),
 * Wales (Renting Homes (Fees etc.) Act 2019). Drives Create Tenancy + Money:
 * warn when a banned fee is charged; enforce the holding-deposit cap. SOURCED /
 * indicative — NOT legal advice.
 */

export interface TenantFeesRule {
  jurisdiction: string
  /** A banned-fees regime is in force (only permitted payments are lawful). */
  bannedFeesRegime: boolean
  /** Holding-deposit cap in weeks of rent (null = none specified). */
  holdingDepositCapWeeks: number | null
  /** Fee categories that are permitted. */
  permitted: string[]
  /** Fee categories that are banned. */
  banned: string[]
  note: string
  citation: string
}

const UK_PERMITTED = ["rent", "tenancy deposit", "holding deposit", "default fees (late rent, lost keys)", "change/early-termination at tenant request", "utilities/council tax/TV/broadband"]
const UK_BANNED = ["referencing", "admin/setup fees", "inventory check", "renewal fees", "check-out fees", "guarantor fees", "professional cleaning (as a condition)"]

const RULES: Record<string, TenantFeesRule> = {
  GB: rule("GB-EW", true, 1, UK_PERMITTED, UK_BANNED, "Tenant Fees Act 2019: only permitted payments; holding deposit capped at 1 week's rent.", "GOV.UK — Tenant Fees Act 2019"),
  "GB:SCT": rule("GB-SCT", true, null, ["rent", "deposit (≤2 months)"], ["any premium/fee beyond rent & deposit"], "Scotland: charging any premium beyond rent and a deposit is illegal.", "gov.scot — Rent (Scotland) Act 1984 (no premiums)"),
  "GB:NI": rule("GB-NI", false, null, ["rent", "deposit"], [], "NI: tenancy-fee rules differ; verify locally.", "nidirect — tenancy costs"),
}

function rule(jurisdiction: string, bannedFeesRegime: boolean, holdingDepositCapWeeks: number | null, permitted: string[], banned: string[], note: string, citation: string): TenantFeesRule {
  return { jurisdiction, bannedFeesRegime, holdingDepositCapWeeks, permitted, banned, note, citation }
}

const GENERIC: TenantFeesRule = rule("generic", false, null, [], [], "No reviewed tenant-fee rule — check local permitted-payment rules.", "Verify local rules")

export function tenantFeesRule(countryCode: string | null | undefined, region?: string | null): TenantFeesRule {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()
  if (cc === "GB") {
    if (rg === "SCT") return RULES["GB:SCT"]
    if (rg === "NI") return RULES["GB:NI"]
    return RULES.GB
  }
  return { ...GENERIC, jurisdiction: cc }
}

/** Holding-deposit cap in currency (major units), or null where none applies. */
export function holdingDepositCap(rule: TenantFeesRule, monthlyRent: number): number | null {
  if (rule.holdingDepositCapWeeks == null) return null
  return ((monthlyRent * 12) / 52) * rule.holdingDepositCapWeeks
}

/** True when a fee category is banned in a banned-fees regime. */
export function isBannedFee(rule: TenantFeesRule, feeLabel: string): boolean {
  if (!rule.bannedFeesRegime) return false
  const f = feeLabel.toLowerCase()
  return rule.banned.some((b) => f.includes(b.toLowerCase().split(" ")[0]))
}
