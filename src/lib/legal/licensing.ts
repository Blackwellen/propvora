/**
 * Shared-occupancy / HMO licensing (dim 3) + mandatory registration (dim 5).
 *
 * Licence/registration classes, thresholds and authority differ: E&W mandatory/
 * additional/selective HMO licensing, Scotland HMO licence + Landlord
 * Registration, NI HMO licence, Ireland RTB registration. SOURCED / indicative —
 * NOT legal advice.
 */

export interface LicenceClass {
  id: string
  name: string
  threshold: string
  authority: string
}

export interface LicensingFramework {
  jurisdiction: string
  /** Whether a shared-occupancy/HMO licensing concept exists. */
  applies: boolean
  classes: LicenceClass[]
  /** Mandatory landlord/tenancy registration duties (dim 5). */
  registrationDuties: { id: string; name: string; authority: string }[]
  note: string
  citation: string
}

const EW: LicensingFramework = {
  jurisdiction: "GB-EW",
  applies: true,
  classes: [
    { id: "mandatory", name: "Mandatory HMO licence", threshold: "5+ persons, 2+ households", authority: "Local authority" },
    { id: "additional", name: "Additional HMO licence", threshold: "Smaller HMOs in a designated area", authority: "Local authority" },
    { id: "selective", name: "Selective licence", threshold: "All private rentals in a designated area", authority: "Local authority" },
  ],
  registrationDuties: [],
  note: "Mandatory HMO licence for 5+ persons in 2+ households; additional/selective schemes vary by council.",
  citation: "GOV.UK — HMO licensing (Housing Act 2004)",
}

const SCT: LicensingFramework = {
  jurisdiction: "GB-SCT",
  applies: true,
  classes: [{ id: "hmo", name: "HMO licence", threshold: "3+ unrelated persons", authority: "Local authority" }],
  registrationDuties: [{ id: "landlord_reg", name: "Scottish Landlord Registration", authority: "Local authority" }],
  note: "HMO licence for 3+ unrelated persons; all landlords must register.",
  citation: "gov.scot — HMO licensing + Landlord Registration",
}

const NI: LicensingFramework = {
  jurisdiction: "GB-NI",
  applies: true,
  classes: [{ id: "hmo", name: "HMO licence", threshold: "3+ persons, 2+ households", authority: "NIHE / councils" }],
  registrationDuties: [{ id: "landlord_reg", name: "Landlord Registration Scheme (NI)", authority: "Department for Communities" }],
  note: "HMO licence + landlord registration.",
  citation: "nidirect — HMO licensing + landlord registration",
}

const IE: LicensingFramework = {
  jurisdiction: "IE",
  applies: false,
  classes: [],
  registrationDuties: [{ id: "rtb", name: "RTB tenancy registration", authority: "Residential Tenancies Board" }],
  note: "No HMO licensing concept; every tenancy must be registered with the RTB.",
  citation: "rtb.ie — tenancy registration",
}

const FRAMEWORKS: Record<string, LicensingFramework> = { GB: EW, "GB:SCT": SCT, "GB:NI": NI, IE }

export function licensingFramework(countryCode: string | null | undefined, region?: string | null): LicensingFramework {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()
  if (cc === "GB") {
    if (rg === "SCT") return FRAMEWORKS["GB:SCT"]
    if (rg === "NI") return FRAMEWORKS["GB:NI"]
    return FRAMEWORKS.GB
  }
  return (
    FRAMEWORKS[cc] ?? {
      jurisdiction: cc,
      applies: false,
      classes: [],
      registrationDuties: [],
      note: "No reviewed shared-occupancy licensing — verify local rules.",
      citation: "Verify local rules",
    }
  )
}

/** Whether an HMO/shared-occupancy licence is likely required for the occupancy. */
export function requiresLicence(countryCode: string | null | undefined, region: string | null | undefined, persons: number, households: number): { required: boolean; class: string | null } {
  const f = licensingFramework(countryCode, region)
  if (!f.applies) return { required: false, class: null }
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()
  if (cc === "GB" && rg === "SCT") return persons >= 3 ? { required: true, class: "hmo" } : { required: false, class: null }
  if (cc === "GB" && rg === "NI") return persons >= 3 && households >= 2 ? { required: true, class: "hmo" } : { required: false, class: null }
  // England & Wales mandatory
  if (cc === "GB") return persons >= 5 && households >= 2 ? { required: true, class: "mandatory" } : { required: false, class: null }
  return { required: false, class: null }
}
