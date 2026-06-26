/**
 * Rent regulation / rent control (dimension 6).
 *
 * Increase frequency, indexation and caps: Ireland nationwide CPI-or-2% (from
 * 1 Mar 2026), Scotland Rent Adjudication, Germany Mietpreisbremse + Kappung,
 * England/Wales once-yearly via tribunal. Drives Money ▸ Income + Tenancy +
 * Planning Income Model: warn when an increase exceeds the cap or is too soon.
 * SOURCED / indicative — NOT legal advice.
 */

export interface RentControlRule {
  jurisdiction: string
  /** Minimum months between increases (12 = once a year). */
  frequencyMonths: number
  indexMethod: string
  /** Maximum increase as a % (null = no general cap). */
  capPct: number | null
  /** Notice of increase in days. */
  noticeDays: number | null
  note: string
  citation: string
}

const RULES: Record<string, RentControlRule> = {
  GB: rule("GB-EW", 12, "market / tribunal (s13)", null, 30, "Once per year; tenant can challenge at the First-tier Tribunal. No general cap.", "GOV.UK — rent increases (s13 / tribunal)"),
  "GB:SCT": rule("GB-SCT", 12, "Rent Adjudication (CPI+1%, max 6%)", 6, 84, "Housing (Scotland) Act 2025 — adjudicated increases CPI+1%, capped at 6%.", "gov.scot — Rent Adjudication"),
  IE: rule("IE", 12, "CPI-or-2% (whichever lower)", 2, 90, "Nationwide CPI-or-2% cap from 1 Mar 2026 (whichever is lower).", "rtb.ie — rent caps (CPI-or-2% from 2026)"),
  DE: rule("DE", 12, "Mietspiegel + Mietpreisbremse", 20, 84, "Kappungsgrenze 15–20% over 3 years; Mietpreisbremse limits new lettings to 10% over the local reference rent.", "DE — Mietpreisbremse / Kappungsgrenze"),
  FR: rule("FR", 12, "IRL index (+ encadrement in zones)", null, 0, "Annual IRL-indexed increase; rent control (encadrement) in tense zones.", "FR — IRL index + encadrement"),
  ES: rule("ES", 12, "IRAV index", null, 0, "IRAV reference index replaces CPI; caps in declared stressed areas (zonas tensionadas).", "ES — IRAV index / zonas tensionadas"),
  NZ: rule("NZ", 12, "market", null, 60, "Once every 12 months; 60 days' notice.", "NZ — rent increase once per 12 months"),
}

function rule(jurisdiction: string, frequencyMonths: number, indexMethod: string, capPct: number | null, noticeDays: number | null, note: string, citation: string): RentControlRule {
  return { jurisdiction, frequencyMonths, indexMethod, capPct, noticeDays, note, citation }
}

const GENERIC: RentControlRule = rule("generic", 12, "contractual / market", null, null, "No reviewed rent-control rule — check local increase limits.", "Verify local rules")

export function rentIncreaseRule(countryCode: string | null | undefined, region?: string | null): RentControlRule {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()
  if (cc === "GB" && rg === "SCT") return RULES["GB:SCT"]
  return RULES[cc] ?? { ...GENERIC, jurisdiction: cc }
}

/** Maximum allowed new rent given the cap (null = no cap). */
export function maxIncreasedRent(rule: RentControlRule, currentRent: number): number | null {
  if (rule.capPct == null) return null
  return currentRent * (1 + rule.capPct / 100)
}

/** Whether enough time has passed since the last increase. */
export function canIncreaseNow(rule: RentControlRule, lastIncreaseAt: Date | string | null): boolean {
  if (!lastIncreaseAt) return true
  const last = new Date(lastIncreaseAt)
  const next = new Date(last)
  next.setMonth(next.getMonth() + rule.frequencyMonths)
  return new Date() >= next
}

/** True when a proposed new rent exceeds the jurisdiction cap. */
export function isAboveCap(rule: RentControlRule, currentRent: number, proposedRent: number): boolean {
  const max = maxIncreasedRent(rule, currentRent)
  if (max == null) return false
  return proposedRent > max + 0.005
}
