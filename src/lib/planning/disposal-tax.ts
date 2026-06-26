/**
 * Capital gains / disposal tax (dimension 26).
 *
 * UK CGT (18% basic / 24% higher residential, PPR relief, 60-day reporting),
 * Ireland CGT 33%, France plus-value (taper), Germany Spekulationssteuer (exempt
 * after 10-yr hold), Italy 26% if sold <5yr, US (FIRPTA non-resident withholding),
 * Australia (50% discount > 12mo, main-residence exemption). Two big patterns:
 * holding-period exemptions and non-resident withholding. SOURCED / indicative —
 * NOT tax advice; drives Planning Dev/Flip + exit modelling.
 */

export interface DisposalTaxInput {
  countryCode: string
  /** Capital gain (major units). */
  gain: number
  /** Years the asset was held (drives holding-period exemptions). */
  holdingYears?: number
  /** Main/primary residence (PPR / own-use exemptions). */
  isMainResidence?: boolean
  /** Non-resident seller (withholding regimes). */
  isNonResident?: boolean
  /** Higher/additional-rate taxpayer (UK 24% vs 18%). */
  higherRate?: boolean
}

export interface DisposalTaxResult {
  jurisdiction: string
  taxName: string
  rate: number
  taxAmount: number
  net: number
  /** Withholding on non-resident sale, where applicable (already part of taxAmount estimate). */
  withholding: number
  /** Days to report/pay after completion, where a specific deadline exists. */
  reportingDeadlineDays: number | null
  note: string
  citation: string
}

export function disposalTax(input: DisposalTaxInput): DisposalTaxResult {
  const cc = (input.countryCode || "GB").toUpperCase()
  const gain = Math.max(0, input.gain)
  const years = input.holdingYears ?? 0

  const base = (jurisdiction: string, taxName: string, rate: number, opts?: Partial<DisposalTaxResult>): DisposalTaxResult => ({
    jurisdiction,
    taxName,
    rate,
    taxAmount: gain * rate,
    net: gain - gain * rate,
    withholding: 0,
    reportingDeadlineDays: null,
    note: "",
    citation: "",
    ...opts,
  })

  if (cc === "GB" || cc === "UK") {
    if (input.isMainResidence) return base("GB", "CGT (PRR)", 0, { note: "Private Residence Relief — main home generally exempt", citation: "GOV.UK — Private Residence Relief", reportingDeadlineDays: 60 })
    const rate = input.higherRate ? 0.24 : 0.18
    return base("GB", "Capital Gains Tax", rate, { note: `Residential CGT ${(rate * 100).toFixed(0)}%; report & pay within 60 days`, citation: "GOV.UK — CGT on residential property (18/24%, 60-day)", reportingDeadlineDays: 60 })
  }

  if (cc === "DE") {
    if (years >= 10 || input.isMainResidence) return base("DE", "Spekulationssteuer", 0, { note: years >= 10 ? "Exempt — held over 10 years" : "Own-use exemption", citation: "DE — Spekulationssteuer (exempt after 10-yr hold)" })
    return base("DE", "Spekulationssteuer", input.higherRate ? 0.42 : 0.3, { note: "Taxed at income rate if sold within 10 years", citation: "DE — taxed at personal income rate within 10 years" })
  }

  if (cc === "IT") {
    if (years >= 5 || input.isMainResidence) return base("IT", "Plusvalenza", 0, { note: years >= 5 ? "Exempt — held over 5 years" : "Main-home exemption", citation: "IT — plusvalenza exempt after 5 years / main home" })
    return base("IT", "Plusvalenza", 0.26, { note: "26% substitute tax if sold within 5 years", citation: "IT — 26% if sold <5 years" })
  }

  if (cc === "FR") {
    if (input.isMainResidence) return base("FR", "Plus-value immobilière", 0, { note: "Main residence exempt", citation: "FR — résidence principale exonérée" })
    // Simplified: full 36.2% under ~5yr; tapering toward exemption by 22/30 yrs.
    const rate = years >= 30 ? 0 : years >= 22 ? 0.172 : 0.362
    return base("FR", "Plus-value immobilière", rate, { note: "19% + 17.2% social; tapers to exempt (income 22yr / social 30yr)", citation: "FR — plus-value immobilière with taper relief" })
  }

  if (cc === "IE") return base("IE", "CGT", 0.33, { note: "33% (PPR relief for main home)", citation: "revenue.ie — CGT 33%" })

  if (cc === "ES") {
    const wh = input.isNonResident ? gain * 0.03 : 0
    return base("ES", "CGT (IRPF) + plusvalía", 0.21, { note: "19–28% savings scale + municipal plusvalía; non-resident 3% retention", citation: "ES — CGT savings scale + plusvalía municipal", withholding: wh })
  }

  if (cc === "US") {
    const rate = input.higherRate ? 0.2 : 0.15
    const wh = input.isNonResident ? gain * 0.15 : 0
    if (input.isMainResidence) return base("US", "Capital Gains (§121)", 0, { note: "§121 primary-home exclusion ($250k/$500k)", citation: "IRS §121 exclusion" })
    return base("US", "Capital Gains", rate, { note: "0/15/20% federal long-term + state; FIRPTA 15% non-resident withholding", citation: "IRS — long-term CGT + FIRPTA", withholding: wh })
  }

  if (cc === "AU") {
    if (input.isMainResidence) return base("AU", "CGT (main residence)", 0, { note: "Main-residence exemption", citation: "ATO — main residence exemption" })
    const discounted = years >= 1 ? 0.5 : 1 // 50% discount held > 12 months
    const rate = (input.higherRate ? 0.45 : 0.325) * discounted
    return base("AU", "Capital Gains Tax", rate, { note: "Marginal rate; 50% discount if held > 12 months (no discount for foreign residents)", citation: "ATO — CGT 50% discount" })
  }

  return base(cc, "Disposal tax", 0, { note: "No reviewed disposal-tax rule — set your own figure.", citation: "Set your own figure" })
}
