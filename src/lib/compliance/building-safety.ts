/**
 * Building safety (dimension 27) — attaches to the BUILDING, not the unit.
 *
 * England & Wales Building Safety Act 2022: higher-risk buildings (≥18m OR
 * ≥7 storeys AND ≥2 residential units) carry an Accountable Person + safety case;
 * leaseholder cost protections apply. Uses the `buildings` entity. SOURCED /
 * indicative — NOT legal advice.
 */

export interface BuildingSafetyInput {
  countryCode: string
  region?: string | null
  heightM?: number | null
  storeys?: number | null
  unitCount?: number | null
}

export interface BuildingSafetyResult {
  jurisdiction: string
  /** Whether the building meets the higher-risk threshold. */
  isHigherRisk: boolean
  /** The duties that apply (checklist labels). */
  duties: string[]
  note: string
  citation: string
}

/** Higher-risk threshold: ≥18m OR ≥7 storeys, AND ≥2 residential units (E&W). */
export function isHigherRisk(input: BuildingSafetyInput): boolean {
  const cc = (input.countryCode || "GB").toUpperCase()
  if (cc !== "GB" && cc !== "UK") return false // E&W reviewed; others verify locally
  const units = input.unitCount ?? 0
  const tall = (input.heightM ?? 0) >= 18 || (input.storeys ?? 0) >= 7
  return tall && units >= 2
}

export function buildingSafetyDuties(input: BuildingSafetyInput): BuildingSafetyResult {
  const cc = (input.countryCode || "GB").toUpperCase()
  const higher = isHigherRisk(input)

  if (cc === "GB" || cc === "UK") {
    const duties = higher
      ? [
          "Register the building with the Building Safety Regulator",
          "Appoint an Accountable Person (Principal Accountable Person)",
          "Prepare and maintain a safety case + safety case report",
          "Resident engagement strategy + complaints process",
          "Golden thread of building information",
        ]
      : [
          "Fire Risk Assessment (Regulatory Reform (Fire Safety) Order 2005)",
          "EWS1 only if lender-requested (not required < 18m)",
        ]
    return {
      jurisdiction: "GB-EW",
      isHigherRisk: higher,
      duties,
      note: higher
        ? "Higher-risk building — full BSA 2022 occupation-phase duties apply. Qualifying leaseholders cannot be charged for cladding remediation."
        : "Not a higher-risk building — standard fire-safety duties apply.",
      citation: "GOV.UK — Building Safety Act 2022 (higher-risk ≥18m/7-storeys + 2 units)",
    }
  }

  return {
    jurisdiction: cc,
    isHigherRisk: false,
    duties: ["Verify local fire-safety / high-rise façade rules"],
    note: "No reviewed building-safety regime — verify local high-rise/fire rules.",
    citation: "Verify local rules",
  }
}
