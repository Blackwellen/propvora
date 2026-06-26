/**
 * Recurring property tax / local rates (dimension 21).
 *
 * Council Tax (UK, occupier, band-based), LPT (Ireland, landlord), IBI (Spain),
 * taxe foncière (France), Grundsteuer (Germany), IMU (Italy), property tax (US),
 * council rates (AU/NZ). Feeds Planning cost drivers + Money expenses. SOURCED /
 * indicative — NOT tax advice; the operator sets the actual figure.
 */

export type RecurringTaxBasis = "band" | "value" | "cadastral" | "rates" | "none"
export type TaxPayer = "landlord" | "occupier" | "owner"

export interface RecurringTaxRule {
  jurisdiction: string
  taxName: string
  basis: RecurringTaxBasis
  payer: TaxPayer
  /** Indicative annual rate as a % of value/cadastral value; null where band/rates-based. */
  indicativeRatePct: number | null
  note: string
  citation: string
}

const RULES: Record<string, RecurringTaxRule> = {
  GB: rule("GB", "Council Tax", "band", "occupier", null, "Set by valuation band; the tenant usually pays during a tenancy.", "GOV.UK — Council Tax (band-based)"),
  IE: rule("IE", "LPT (Local Property Tax)", "value", "landlord", 0.1029, "Charged on market value bands; the landlord pays.", "revenue.ie — LPT 0.1029%+ of value"),
  ES: rule("ES", "IBI", "cadastral", "owner", 0.6, "0.4–1.1% of cadastral value (municipal).", "ES IBI — cadastral value 0.4–1.1%"),
  FR: rule("FR", "Taxe foncière", "value", "owner", null, "Municipal; based on cadastral rental value × local rates.", "FR taxe foncière (municipal rates)"),
  DE: rule("DE", "Grundsteuer", "value", "owner", null, "Reformed 2025; value × Messzahl × municipal Hebesatz.", "DE Grundsteuer (reformed 2025)"),
  IT: rule("IT", "IMU", "cadastral", "owner", 0.76, "0.4–1.06% of cadastral value (exempt for prima casa).", "IT IMU 0.4–1.06%"),
  US: rule("US", "Property Tax", "value", "owner", 1.1, "State/local; ~1.1% of assessed value (varies widely).", "US property tax (state/local, ~1.1% avg)"),
  AU: rule("AU", "Council Rates + Land Tax", "rates", "owner", null, "Council rates + state land tax (thresholds).", "AU council rates + land tax (state)"),
  NZ: rule("NZ", "Council Rates", "rates", "owner", null, "Territorial authority rates.", "NZ council rates"),
  AE: rule("AE", "None", "none", "owner", null, "No annual property tax in the UAE.", "UAE — no annual property tax"),
}

function rule(jurisdiction: string, taxName: string, basis: RecurringTaxBasis, payer: TaxPayer, indicativeRatePct: number | null, note: string, citation: string): RecurringTaxRule {
  return { jurisdiction, taxName, basis, payer, indicativeRatePct, note, citation }
}

const GENERIC: RecurringTaxRule = rule("generic", "Recurring property tax", "none", "owner", null, "No reviewed recurring-tax rate — set your own figure.", "Set your own figure")

export function recurringTax(countryCode: string | null | undefined, _region?: string | null): RecurringTaxRule {
  const cc = (countryCode || "GB").toUpperCase()
  return RULES[cc] ?? { ...GENERIC, jurisdiction: cc }
}

/** Indicative annual amount from a value where a % rate exists; null when band/rates-based. */
export function estimateRecurringTax(rule: RecurringTaxRule, baseValue: number): number | null {
  if (rule.indicativeRatePct == null) return null
  return (baseValue * rule.indicativeRatePct) / 100
}
