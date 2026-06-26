/**
 * Insurance obligations (dimension 24).
 *
 * Buildings insurance duty, landlord liability, HMO/short-let cover, contractor
 * public-liability minimums. SOURCED / indicative — NOT legal/insurance advice.
 */

export interface InsuranceDuty {
  id: string
  name: string
  /** Typically required (vs recommended). */
  required: boolean
  note: string
}

export interface InsuranceResult {
  jurisdiction: string
  duties: InsuranceDuty[]
  /** Indicative contractor public-liability minimum (major units, in local currency). */
  contractorPlMinimum: number | null
  citation: string
}

export function insuranceDuties(countryCode: string | null | undefined, propertyType?: string): InsuranceResult {
  const cc = (countryCode || "GB").toUpperCase()
  const isHmo = (propertyType ?? "").toLowerCase().includes("hmo")

  const duties: InsuranceDuty[] = [
    { id: "buildings", name: "Buildings insurance", required: true, note: "Usually a lender/leasehold requirement; landlord's responsibility for the structure." },
    { id: "liability", name: "Landlord/property-owner liability", required: false, note: "Covers injury/damage claims by tenants or visitors." },
  ]
  if (isHmo) duties.push({ id: "hmo_cover", name: "HMO insurance", required: false, note: "Specialist cover; standard policies may exclude HMOs." })

  // UK contractors commonly require £2–5m public liability.
  const plMin = cc === "GB" || cc === "UK" || cc === "IE" ? 2_000_000 : null

  return {
    jurisdiction: cc,
    duties,
    contractorPlMinimum: plMin,
    citation: "Indicative insurance obligations — verify with your broker and lender/leasehold terms.",
  }
}
