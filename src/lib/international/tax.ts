import type { SupabaseClient } from "@supabase/supabase-js"
import { isCountrySanctioned, normaliseCountryCode } from "./countries"
import type { TaxAppliesTo, TaxCalculation, TaxRule, TaxSystem } from "./types"

/**
 * Tax ESTIMATE engine.
 *
 * IMPORTANT (compliance / honesty): every figure produced here is an OPERATIONAL
 * ESTIMATE to help a user reason about prices. It is NOT tax advice, NOT a tax
 * filing, and NOT a statement that any tax has been collected, declared or paid.
 * Every {@link TaxCalculation} carries `isEstimate: true` and callers MUST surface
 * an estimate label. GB VAT is kept correct (20% standard / 5% reduced / 0% zero).
 *
 * Rates are DB-driven from `country_tax_rules`, with a hard-coded GB-VAT fallback
 * so UK money handling never breaks when the DB is cold.
 */

/** Plain-language disclaimer to render alongside any tax output. */
export const TAX_ESTIMATE_DISCLAIMER =
  "Estimate only — not tax advice. Propvora does not file or pay tax on your behalf. " +
  "Verify all figures with a qualified tax adviser."

/** Hard-coded GB VAT rates (percent) used when no DB rule is found. */
const GB_VAT_RATES: Record<string, number> = {
  standard: 20,
  reduced: 5,
  zero: 0,
}

/** Map a generic category to a country_tax_rules `applies_to` bucket. */
function categoryToAppliesTo(category?: string): TaxAppliesTo {
  switch ((category ?? "").toLowerCase()) {
    case "reduced":
      return "reduced"
    case "zero":
      return "zero"
    case "exempt":
      return "exempt"
    case "services":
      return "services"
    case "accommodation":
      return "accommodation"
    case "standard":
    case "":
      return "standard"
    default:
      return "standard"
  }
}

export interface CalculateTaxInput {
  countryCode: string
  /** Amount in integer minor units (pence). */
  amountPence: number
  /** Generic category → applies_to bucket (default "standard"). */
  category?: string
  /** If true, amountPence already INCLUDES tax (gross); else it is net. */
  taxInclusive?: boolean
}

/**
 * Pure core: compute a tax calculation from an explicit rate. No DB, no I/O,
 * integer pence throughout. Always flags the result as an estimate.
 */
export function computeTax(args: {
  countryCode: string
  amountPence: number
  ratePercent: number
  taxLabel: string
  appliesTo: TaxAppliesTo
  taxInclusive?: boolean
  usedFallback?: boolean
}): TaxCalculation {
  const cc = normaliseCountryCode(args.countryCode)
  const amount = Math.round(Number.isFinite(args.amountPence) ? args.amountPence : 0)
  const rate = Number.isFinite(args.ratePercent) ? args.ratePercent : 0

  let netPence: number
  let taxPence: number
  let grossPence: number

  if (args.taxInclusive) {
    // amount is gross; back out the tax portion.
    grossPence = amount
    netPence = Math.round(amount / (1 + rate / 100))
    taxPence = grossPence - netPence
  } else {
    netPence = amount
    taxPence = Math.round(amount * (rate / 100))
    grossPence = netPence + taxPence
  }

  return {
    countryCode: cc,
    netPence,
    taxPence,
    grossPence,
    rate,
    taxLabel: args.taxLabel,
    appliesTo: args.appliesTo,
    isEstimate: true,
    usedFallback: !!args.usedFallback,
  }
}

/** Zero-tax estimate (sanctioned / no tax system / unknown country). */
function zeroTax(
  countryCode: string,
  amountPence: number,
  appliesTo: TaxAppliesTo,
  taxLabel = "Tax"
): TaxCalculation {
  return computeTax({
    countryCode,
    amountPence,
    ratePercent: 0,
    taxLabel,
    appliesTo,
    usedFallback: true,
  })
}

/**
 * DB wrapper: look up the live rate from `country_tax_rules` for the country +
 * category, then compute. Falls back to GB VAT rates if GB has no DB row, and to
 * a zero-rate estimate for unknown/non-tax countries. Sanctioned countries never
 * produce a positive tax figure (and must be blocked from transacting upstream).
 */
export async function calculateTax(
  supabase: SupabaseClient,
  input: CalculateTaxInput
): Promise<TaxCalculation> {
  const cc = normaliseCountryCode(input.countryCode)
  const appliesTo = categoryToAppliesTo(input.category)

  // Sanctioned countries: no estimate beyond zero (they cannot transact).
  if (isCountrySanctioned(cc)) {
    return zeroTax(cc, input.amountPence, appliesTo)
  }

  // Try the live rate table first.
  try {
    const { data, error } = await supabase
      .from("country_tax_rules")
      .select("country_code, tax_type, name, rate, applies_to, valid_from, valid_to, notes")
      .eq("country_code", cc)
      .eq("applies_to", appliesTo)
      .order("valid_from", { ascending: false })
    if (!error && Array.isArray(data) && data.length > 0) {
      const row = data[0] as Record<string, unknown>
      const rate = Number(row.rate)
      const label = deriveTaxLabel(String(row.tax_type ?? ""))
      return computeTax({
        countryCode: cc,
        amountPence: input.amountPence,
        ratePercent: Number.isFinite(rate) ? rate : 0,
        taxLabel: label,
        appliesTo,
        taxInclusive: input.taxInclusive,
      })
    }
  } catch {
    /* fall through to fallback below */
  }

  // GB fallback: keep UK VAT correct even when the DB is cold.
  if (cc === "GB") {
    const rate = GB_VAT_RATES[appliesTo] ?? GB_VAT_RATES.standard
    return computeTax({
      countryCode: cc,
      amountPence: input.amountPence,
      ratePercent: rate,
      taxLabel: "VAT",
      appliesTo,
      taxInclusive: input.taxInclusive,
      usedFallback: true,
    })
  }

  // Unknown / no-rate country: zero-rate estimate (never invent a rate).
  return zeroTax(cc, input.amountPence, appliesTo)
}

/** Display label for a tax system. */
export function deriveTaxLabel(taxType: string): string {
  switch (taxType) {
    case "vat":
      return "VAT"
    case "gst":
      return "GST"
    case "sales_tax":
      return "Sales Tax"
    default:
      return "Tax"
  }
}

/** Fetch all live tax rules for a country (estimate reference data). */
export async function listTaxRules(
  supabase: SupabaseClient,
  countryCode: string
): Promise<TaxRule[]> {
  const cc = normaliseCountryCode(countryCode)
  try {
    const { data, error } = await supabase
      .from("country_tax_rules")
      .select("country_code, tax_type, name, rate, applies_to, valid_from, valid_to, notes")
      .eq("country_code", cc)
      .order("applies_to", { ascending: true })
    if (error || !Array.isArray(data)) return cc === "GB" ? gbFallbackRules() : []
    if (data.length === 0) return cc === "GB" ? gbFallbackRules() : []
    return (data as Record<string, unknown>[]).map((row) => ({
      countryCode: normaliseCountryCode(row.country_code as string),
      taxType: (row.tax_type as TaxSystem) ?? "none",
      name: (row.name as string) ?? "",
      rate: Number(row.rate) || 0,
      appliesTo: (row.applies_to as TaxAppliesTo) ?? "standard",
      validFrom: (row.valid_from as string) ?? null,
      validTo: (row.valid_to as string) ?? null,
      notes: (row.notes as string) ?? null,
    }))
  } catch {
    return cc === "GB" ? gbFallbackRules() : []
  }
}

/** Hard-coded GB VAT rule set for cold-DB resilience. */
function gbFallbackRules(): TaxRule[] {
  return (["standard", "reduced", "zero"] as TaxAppliesTo[]).map((appliesTo) => ({
    countryCode: "GB",
    taxType: "vat",
    name: `UK VAT ${appliesTo} rate`,
    rate: GB_VAT_RATES[appliesTo] ?? 0,
    appliesTo,
    validFrom: null,
    validTo: null,
    notes: "GB VAT fallback rate",
  }))
}
