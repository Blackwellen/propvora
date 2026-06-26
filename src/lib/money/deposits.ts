/**
 * Deposit / bond rules per jurisdiction (dimension 2).
 *
 * The biggest tenancy gap: deposit scheme, cap, protection duty, prescribed
 * information, return window and disputes body all differ by jurisdiction. These
 * are SOURCED defaults — informational, from verified public sources, NOT legal
 * advice. The operator verifies and may override (per-tenancy) via the override
 * chain (`resolveValue`), and every figure renders through `<SourcedValue>` with
 * the permanent dismissible disclaimer.
 *
 * Figures from release-gated/docs/internationalisation/legal-frameworks/
 * deposit-rules-sourced.md + ALL-45-country-matrix.md.
 */

import type { SourcedDefault } from "@/lib/jurisdiction/resolve"

/** How a deposit cap is expressed. */
export type DepositCapKind = "weeks" | "months" | "percent" | "none"

export interface DepositRule {
  /** Jurisdiction key the rule resolved for (may be a fallback). */
  jurisdiction: string
  /** Protection/holding scheme name, or null where none is mandated. */
  scheme: string | null
  /** Statutory cap. `value` null when no fixed statutory multiple exists. */
  cap: { kind: DepositCapKind; value: number | null }
  /** Whether the deposit must be protected/registered in a scheme. */
  protectionRequired: boolean
  /** Days to protect/lodge after receipt (null = not specified). */
  protectionWindowDays: number | null
  /** Whether prescribed information must be served on the tenant. */
  prescribedInfo: boolean
  /** Days to return the deposit after tenancy end (null = not specified). */
  returnWindowDays: number | null
  /** Disputes/adjudication body, if any. */
  disputesBody: string | null
  /** Source citation for the figures. */
  citation: string
}

// Keyed by country code, or "GB:SCT"/"GB:NI" for UK sub-jurisdictions.
const RULES: Record<string, DepositRule> = {
  "GB": {
    jurisdiction: "GB-EW",
    scheme: "TDP (DPS / MyDeposits / TDS)",
    cap: { kind: "weeks", value: 5 }, // 5 weeks where annual rent < £50,000, else 6
    protectionRequired: true,
    protectionWindowDays: 30,
    prescribedInfo: true,
    returnWindowDays: 10,
    disputesBody: "Scheme adjudication (free)",
    citation: "GOV.UK — Tenancy Deposit Protection; Tenant Fees Act 2019 (5 weeks < £50k / 6 weeks)",
  },
  "GB:SCT": {
    jurisdiction: "GB-SCT",
    scheme: "Approved tenancy deposit scheme (SafeDeposits / Letting Protection / mydeposits Scotland)",
    cap: { kind: "months", value: null }, // no statutory multiple; schemes commonly accept up to ~2 months
    protectionRequired: true,
    protectionWindowDays: 30, // 30 working days
    prescribedInfo: true,
    returnWindowDays: null,
    disputesBody: "Scheme adjudication",
    citation: "gov.scot — Tenancy Deposit Schemes (Scotland) Regulations 2011 (lodge within 30 working days)",
  },
  "GB:NI": {
    jurisdiction: "GB-NI",
    scheme: "Approved scheme (TDS NI / mydeposits NI)",
    cap: { kind: "months", value: 1 },
    protectionRequired: true,
    protectionWindowDays: 28,
    prescribedInfo: true,
    returnWindowDays: null,
    disputesBody: "Scheme adjudication",
    citation: "nidirect — Tenancy Deposit Scheme (≤1 month; protect within 28 days)",
  },
  "IE": {
    jurisdiction: "IE",
    scheme: "RTB (registration); no national deposit scheme",
    cap: { kind: "months", value: 1 }, // 1 month deposit (+ 1 month advance rent)
    protectionRequired: false,
    protectionWindowDays: null,
    prescribedInfo: false,
    returnWindowDays: null,
    disputesBody: "RTB dispute resolution",
    citation: "rtb.ie — deposit ≤1 month (+1 month advance); RTB dispute resolution",
  },
  "ES": {
    jurisdiction: "ES",
    scheme: "Fianza (deposited with regional housing authority)",
    cap: { kind: "months", value: 1 },
    protectionRequired: true,
    protectionWindowDays: null,
    prescribedInfo: false,
    returnWindowDays: 30,
    disputesBody: "Regional authority / courts",
    citation: "Ley de Arrendamientos Urbanos — 1 month fianza (regional deposit)",
  },
  "DE": {
    jurisdiction: "DE",
    scheme: "Kaution in a separate interest-bearing account (§551 BGB)",
    cap: { kind: "months", value: 3 }, // 3 months cold rent (Kaltmiete), payable in 3 instalments
    protectionRequired: true,
    protectionWindowDays: null,
    prescribedInfo: false,
    returnWindowDays: null,
    disputesBody: "Courts",
    citation: "§551 BGB — max 3 months cold rent, separate account",
  },
  "FR": {
    jurisdiction: "FR",
    scheme: "Dépôt de garantie",
    cap: { kind: "months", value: 1 }, // 1 month unfurnished / 2 furnished
    protectionRequired: false,
    protectionWindowDays: null,
    prescribedInfo: false,
    returnWindowDays: 60,
    disputesBody: "Commission départementale de conciliation",
    citation: "service-public.fr — 1 month (unfurnished) / 2 months (furnished); return ≤1–2 months",
  },
  "IT": {
    jurisdiction: "IT",
    scheme: "Cauzione",
    cap: { kind: "months", value: 3 },
    protectionRequired: false,
    protectionWindowDays: null,
    prescribedInfo: false,
    returnWindowDays: null,
    disputesBody: "Courts",
    citation: "Legge 392/1978 — cauzione max 3 months",
  },
  "NL": {
    jurisdiction: "NL",
    scheme: "Waarborgsom",
    cap: { kind: "months", value: 2 }, // max 2 months (Good Landlordship Act)
    protectionRequired: false,
    protectionWindowDays: null,
    prescribedInfo: false,
    returnWindowDays: 14,
    disputesBody: "Huurcommissie / courts",
    citation: "Wet goed verhuurderschap — max 2 months; return ≤14 days",
  },
  "AU": {
    jurisdiction: "AU",
    scheme: "State bond authority (e.g. NSW Rental Bonds Online)",
    cap: { kind: "weeks", value: 4 },
    protectionRequired: true,
    protectionWindowDays: null,
    prescribedInfo: false,
    returnWindowDays: null,
    disputesBody: "State tribunal (e.g. NCAT)",
    citation: "State residential tenancy law — 4 weeks bond, lodged with the state authority",
  },
  "AE": {
    jurisdiction: "AE",
    scheme: "Landlord-held security deposit",
    cap: { kind: "percent", value: 5 }, // 5% unfurnished / 10% furnished of annual rent
    protectionRequired: false,
    protectionWindowDays: null,
    prescribedInfo: false,
    returnWindowDays: null,
    disputesBody: "Rental Dispute Settlement Centre (Dubai)",
    citation: "Dubai practice — 5% (unfurnished) / 10% (furnished) of annual rent",
  },
}

const GENERIC: DepositRule = {
  jurisdiction: "generic",
  scheme: null,
  cap: { kind: "none", value: null },
  protectionRequired: false,
  protectionWindowDays: null,
  prescribedInfo: false,
  returnWindowDays: null,
  disputesBody: null,
  citation: "No reviewed deposit rule for this jurisdiction — set and verify your own figure.",
}

/** Resolve the sourced deposit rule for a jurisdiction (+ optional region). */
export function depositRules(countryCode: string | null | undefined, region?: string | null): DepositRule {
  const cc = (countryCode || "GB").toUpperCase().trim()
  const rg = (region || "").toUpperCase().trim()
  if (cc === "GB" && (rg === "SCT" || rg === "NI")) return RULES[`GB:${rg}`]
  return RULES[cc] ?? { ...GENERIC, jurisdiction: cc }
}

/**
 * Maximum deposit amount the cap allows, in the rent's currency (major units).
 * Returns null where no statutory multiple applies (operator sets their own).
 *
 * @param monthlyRent rent per month (major units)
 * @param annualRent  optional annual rent for percent-of-annual caps (AE); falls
 *                    back to monthlyRent*12
 */
export function maxDeposit(rule: DepositRule, monthlyRent: number, annualRent?: number): number | null {
  const { kind, value } = rule.cap
  if (value == null) return null
  const annual = annualRent ?? monthlyRent * 12
  switch (kind) {
    case "weeks":
      return (annual / 52) * value
    case "months":
      return monthlyRent * value
    case "percent":
      return (annual * value) / 100
    default:
      return null
  }
}

/** True when `amount` exceeds the jurisdiction cap. False when no cap applies. */
export function isOverCap(rule: DepositRule, amount: number, monthlyRent: number, annualRent?: number): boolean {
  const max = maxDeposit(rule, monthlyRent, annualRent)
  if (max == null) return false
  return amount > max + 0.005 // tolerate float dust
}

/** Build a SourcedDefault for the cap amount, for use with `resolveValue`/`<SourcedValue>`. */
export function depositCapSourced(
  rule: DepositRule,
  monthlyRent: number,
  annualRent?: number,
): SourcedDefault<number> | null {
  const max = maxDeposit(rule, monthlyRent, annualRent)
  if (max == null) return null
  return { value: max, citation: rule.citation, statutoryMinimum: undefined }
}
