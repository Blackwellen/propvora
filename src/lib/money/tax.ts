/**
 * Sales-tax / VAT / GST engine (dimension 8).
 *
 * Computes the tax line on an invoice per jurisdiction: VAT (UK/EU), GST
 * (AU/NZ), sales tax (US — state-set), or none. Handles the property-sector
 * specials: residential rent is generally VAT-EXEMPT (UK/IE/EU) or input-taxed
 * (AU), and cross-border B2B services use the reverse charge (customer accounts
 * for VAT). Rates are SOURCED defaults — informational, NOT tax advice; the
 * operator verifies and may override per invoice.
 */

export type TaxSystem = "VAT" | "GST" | "sales_tax" | "none"
export type RentTreatment = "exempt" | "standard" | "zero"
export type SupplyCategory = "rent" | "service" | "goods"

export interface TaxScheme {
  jurisdiction: string
  system: TaxSystem
  /** Standard headline rate as a fraction (0.20 = 20%). */
  standardRate: number
  label: string // e.g. "VAT", "GST", "Sales tax"
  /** How residential rent is treated for this tax. */
  rentTreatment: RentTreatment
  /** True where the jurisdiction operates the EU-style reverse charge for cross-border B2B. */
  reverseChargeEU: boolean
  citation: string
}

// Standard VAT/GST rates (headline). Sales-tax jurisdictions are state-set → 0 default.
const SCHEMES: Record<string, TaxScheme> = {
  GB: scheme("GB", "VAT", 0.2, "exempt", true, "GOV.UK — standard VAT 20%; residential rent exempt"),
  IE: scheme("IE", "VAT", 0.23, "exempt", true, "revenue.ie — VAT 23%; residential rent exempt"),
  DE: scheme("DE", "VAT", 0.19, "exempt", true, "DE Umsatzsteuer 19%; Wohnraummiete steuerfrei"),
  FR: scheme("FR", "VAT", 0.2, "exempt", true, "FR TVA 20%; loyers d'habitation exonérés"),
  ES: scheme("ES", "VAT", 0.21, "exempt", true, "ES IVA 21%; alquiler de vivienda exento"),
  IT: scheme("IT", "VAT", 0.22, "exempt", true, "IT IVA 22%; locazioni abitative esenti"),
  NL: scheme("NL", "VAT", 0.21, "exempt", true, "NL BTW 21%; woningverhuur vrijgesteld"),
  BE: scheme("BE", "VAT", 0.21, "exempt", true, "BE VAT 21%; residential rent exempt"),
  AT: scheme("AT", "VAT", 0.2, "standard", true, "AT USt 20% (residential rent 10%)"),
  PT: scheme("PT", "VAT", 0.23, "exempt", true, "PT IVA 23%; residential rent exempt"),
  SE: scheme("SE", "VAT", 0.25, "exempt", true, "SE moms 25%; residential rent exempt"),
  FI: scheme("FI", "VAT", 0.255, "exempt", true, "FI ALV 25.5%; residential rent exempt"),
  DK: scheme("DK", "VAT", 0.25, "exempt", true, "DK moms 25%; residential rent exempt"),
  CZ: scheme("CZ", "VAT", 0.21, "exempt", true, "CZ DPH 21%; residential rent exempt"),
  GR: scheme("GR", "VAT", 0.24, "exempt", true, "GR ΦΠΑ 24%; residential rent exempt"),
  AU: scheme("AU", "GST", 0.1, "exempt", false, "ATO — GST 10%; residential rent input-taxed"),
  NZ: scheme("NZ", "GST", 0.15, "exempt", false, "IRD — GST 15%; residential rent exempt"),
  AE: scheme("AE", "VAT", 0.05, "exempt", false, "FTA — VAT 5%; residential rent exempt/zero-rated, commercial 5%"),
  US: scheme("US", "sales_tax", 0, "exempt", false, "US — sales tax is state/local set; rent generally not subject to sales tax"),
  CA: scheme("CA", "GST", 0.05, "exempt", false, "CA — GST/HST varies by province; residential rent exempt"),
}

function scheme(
  jurisdiction: string,
  system: TaxSystem,
  standardRate: number,
  rentTreatment: RentTreatment,
  reverseChargeEU: boolean,
  citation: string,
): TaxScheme {
  return { jurisdiction, system, standardRate, label: system === "GST" ? "GST" : system === "sales_tax" ? "Sales tax" : "VAT", rentTreatment, reverseChargeEU, citation }
}

const GENERIC: TaxScheme = scheme("generic", "none", 0, "exempt", false, "No reviewed tax scheme — set your own rate.")

/** Resolve the tax scheme for a jurisdiction. */
export function taxScheme(countryCode: string | null | undefined): TaxScheme {
  const cc = (countryCode || "GB").toUpperCase()
  return SCHEMES[cc] ?? { ...GENERIC, jurisdiction: cc }
}

export interface ComputeTaxInput {
  countryCode: string
  /** Net amount (major units). */
  net: number
  category?: SupplyCategory
  /** Cross-border B2B supply within the EU (triggers reverse charge). */
  b2bCrossBorder?: boolean
  /** Optional explicit rate override (fraction). */
  overrideRate?: number | null
}

export interface ComputeTaxResult {
  label: string
  rate: number
  taxAmount: number
  gross: number
  reverseCharge: boolean
  /** Human note explaining the treatment (exempt, reverse charge, etc.). */
  note: string
  citation: string
}

/** Compute the tax line for an invoice. */
export function computeTax(input: ComputeTaxInput): ComputeTaxResult {
  const s = taxScheme(input.countryCode)
  const category = input.category ?? "service"
  const net = input.net

  // Residential rent: generally exempt / input-taxed → no tax line.
  if (category === "rent" && s.rentTreatment === "exempt") {
    return { label: s.label, rate: 0, taxAmount: 0, gross: net, reverseCharge: false, note: "Residential rent — exempt", citation: s.citation }
  }

  // Cross-border B2B within the EU → reverse charge (customer accounts for VAT).
  if (input.b2bCrossBorder && s.reverseChargeEU && category !== "rent") {
    return { label: s.label, rate: 0, taxAmount: 0, gross: net, reverseCharge: true, note: "Reverse charge — customer accounts for VAT", citation: s.citation }
  }

  const rate = input.overrideRate ?? (category === "rent" && s.rentTreatment === "standard" ? s.standardRate : s.standardRate)
  const taxAmount = net * rate
  return {
    label: s.label,
    rate,
    taxAmount,
    gross: net + taxAmount,
    reverseCharge: false,
    note: rate === 0 ? (s.system === "sales_tax" ? "Sales tax set locally" : "No tax applied") : `${s.label} at ${(rate * 100).toFixed(s.standardRate % 0.01 ? 1 : 0)}%`,
    citation: s.citation,
  }
}
