/**
 * AML / KYC (dimension 28).
 *
 * Anti-money-laundering duties for agency + transactions: customer due
 * diligence, source-of-funds, sanctions screening, MLRO. UK MLR 2017 / HMRC
 * supervision. SOURCED / indicative — NOT legal/compliance advice.
 */

export interface AmlDuties {
  jurisdiction: string
  /** Whether agency/transactions are within AML scope. */
  inScope: boolean
  /** Customer due diligence required. */
  cddRequired: boolean
  /** Source-of-funds checks on transactions. */
  sourceOfFunds: boolean
  /** Sanctions screening required. */
  sanctionsScreening: boolean
  /** An MLRO (nominated officer) is required. */
  mlroRequired: boolean
  supervisor: string | null
  note: string
  citation: string
}

const DUTIES: Record<string, AmlDuties> = {
  GB: duty("GB", true, true, true, true, true, "HMRC (estate/letting agency)", "Letting agents handling rent ≥ €10,000/month and estate agents are within MLR 2017 scope.", "GOV.UK — Money Laundering Regulations 2017"),
  IE: duty("IE", true, true, true, true, true, "Central Bank / designated body", "AML obligations under the Criminal Justice (Money Laundering) Acts.", "IE — Criminal Justice (ML) Acts"),
  AE: duty("AE", true, true, true, true, true, "Ministry of Economy / DLD", "Real-estate AML reporting (goAML) for relevant transactions.", "AE — Federal Decree-Law 20/2018 (goAML)"),
}

function duty(jurisdiction: string, inScope: boolean, cddRequired: boolean, sourceOfFunds: boolean, sanctionsScreening: boolean, mlroRequired: boolean, supervisor: string | null, note: string, citation: string): AmlDuties {
  return { jurisdiction, inScope, cddRequired, sourceOfFunds, sanctionsScreening, mlroRequired, supervisor, note, citation }
}

const GENERIC: AmlDuties = duty("generic", false, false, false, true, false, null, "AML scope varies — verify whether your activity is regulated.", "Verify local rules")

export function amlDuties(countryCode: string | null | undefined): AmlDuties {
  const cc = (countryCode || "GB").toUpperCase()
  return DUTIES[cc] ?? { ...GENERIC, jurisdiction: cc }
}
