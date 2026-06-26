/**
 * Mortgage-interest / finance-cost relief (dimension 9).
 *
 * The single biggest cross-jurisdiction forecast divergence. The UK restricts
 * finance-cost relief for INDIVIDUAL landlords (Section 24, ITTOIA 2005 s.272A):
 * mortgage interest is NOT deductible from rental profit; instead a basic-rate
 * (20%) tax credit applies. Most other jurisdictions allow interest as a fully
 * deductible expense. Companies are not caught by S24 anywhere, so corporate
 * holdings get full deduction.
 *
 * Figures sourced (GOV.UK / agent-fitness-incometax-language-sourced.md);
 * informational, NOT tax advice — operator verifies and may override.
 */

export type ReliefRegime = "restricted" | "full"

export interface InterestReliefRule {
  jurisdiction: string
  regime: ReliefRegime
  /** Tax-credit rate applied to interest under a restricted regime (UK = 0.20). */
  creditRate: number | null
  citation: string
}

/** Resolve the relief regime for a personal landlord in a jurisdiction. */
export function interestReliefRule(countryCode: string | null | undefined): InterestReliefRule {
  const cc = (countryCode || "GB").toUpperCase()
  if (cc === "GB" || cc === "UK") {
    return {
      jurisdiction: "GB",
      regime: "restricted",
      creditRate: 0.2,
      citation: "GOV.UK — Section 24: finance costs not deductible for individuals; 20% basic-rate tax credit",
    }
  }
  // Full deductibility is the norm elsewhere (DE Werbungskosten, FR charges,
  // ES gastos deducibles, IE 100% since 2019, US Schedule E, etc.).
  return {
    jurisdiction: cc,
    regime: "full",
    creditRate: null,
    citation: "Mortgage interest treated as a deductible expense (full relief) — verify the local rule",
  }
}

export interface IncomeTaxInput {
  countryCode: string
  /** "personal" landlords can be caught by S24; "corporate" always gets full deduction. */
  structure?: "personal" | "corporate"
  /** Rental profit BEFORE deducting mortgage interest (income − non-interest expenses). */
  profitBeforeInterest: number
  /** Annual mortgage interest. */
  interest: number
  /** Marginal income-tax rate as a fraction (e.g. 0.40). */
  marginalRate: number
}

export interface IncomeTaxResult {
  regime: ReliefRegime
  /** Taxable rental profit under the applicable regime. */
  taxableProfit: number
  /** Tax before any finance-cost credit. */
  taxBeforeCredit: number
  /** Basic-rate finance-cost credit (restricted regime only). */
  interestCredit: number
  /** Net tax due under the applicable regime. */
  taxDue: number
  /** What the tax would be if interest were fully deductible (the comparison). */
  taxIfFullyDeductible: number
  /** The extra tax caused by a restricted regime (0 under full relief). */
  reliefPenalty: number
  citation: string
}

/** Compute rental income tax with the correct finance-cost relief treatment. */
export function computeIncomeTax(input: IncomeTaxInput): IncomeTaxResult {
  const { profitBeforeInterest, interest, marginalRate } = input
  const structure = input.structure ?? "personal"
  const rule = interestReliefRule(input.countryCode)

  // The fully-deductible baseline (interest is an expense).
  const fullTaxable = Math.max(0, profitBeforeInterest - interest)
  const taxIfFullyDeductible = fullTaxable * marginalRate

  // Corporate holdings (or full-relief jurisdictions) always get full deduction.
  if (structure === "corporate" || rule.regime === "full") {
    return {
      regime: "full",
      taxableProfit: fullTaxable,
      taxBeforeCredit: taxIfFullyDeductible,
      interestCredit: 0,
      taxDue: taxIfFullyDeductible,
      taxIfFullyDeductible,
      reliefPenalty: 0,
      citation: structure === "corporate" ? "Corporate holding — finance costs fully deductible" : rule.citation,
    }
  }

  // Restricted (UK S24 personal): interest is NOT deducted; a basic-rate credit applies.
  const taxableProfit = Math.max(0, profitBeforeInterest)
  const taxBeforeCredit = taxableProfit * marginalRate
  const interestCredit = interest * (rule.creditRate ?? 0)
  const taxDue = Math.max(0, taxBeforeCredit - interestCredit)

  return {
    regime: "restricted",
    taxableProfit,
    taxBeforeCredit,
    interestCredit,
    taxDue,
    taxIfFullyDeductible,
    reliefPenalty: Math.max(0, taxDue - taxIfFullyDeductible),
    citation: rule.citation,
  }
}
