/**
 * Repair / fitness / habitation standards (dimension 23).
 *
 * Fitness-for-habitation regimes + repair SLAs: England Homes (Fitness for Human
 * Habitation) Act 2018 + Awaab's Law timescales, Scotland Repairing Standard,
 * Ireland S.I.137/2019 minimum standards. Drives Compliance + Work job SLAs.
 * SOURCED / indicative — NOT legal advice.
 */

export interface FitnessStandard {
  jurisdiction: string
  standardName: string
  /** Repair-response SLA (days) for serious hazards (e.g. Awaab's Law damp/mould); null = none specified. */
  hazardResponseDays: number | null
  slaSource: string | null
  checklist: string[]
  note: string
  citation: string
}

const STANDARDS: Record<string, FitnessStandard> = {
  GB: std("GB-EW", "Fitness for Human Habitation + Awaab's Law", 14, "Awaab's Law", [
    "Property fit for human habitation (Homes Act 2018)",
    "Damp & mould investigated within strict timescales (Awaab's Law)",
    "Decent Homes Standard (where applicable)",
  ], "Awaab's Law sets timescales to investigate and fix serious hazards (e.g. damp/mould).", "GOV.UK — Homes (Fitness) Act 2018 + Awaab's Law"),
  "GB:SCT": std("GB-SCT", "Repairing Standard", null, null, [
    "Wind & watertight; structure sound",
    "Installations for water/gas/electricity in working order",
    "Repairing Standard compliance (incl. RCD, safe electrics)",
  ], "Landlords must meet the Repairing Standard throughout the tenancy.", "gov.scot — Repairing Standard"),
  IE: std("IE", "Minimum Standards (S.I.137/2019)", null, null, [
    "Structural condition, ventilation, heating",
    "Sanitary facilities + safety (gas/electrical/fire)",
  ], "Rental minimum standards under S.I.137/2019.", "rtb.ie — minimum standards"),
}

function std(jurisdiction: string, standardName: string, hazardResponseDays: number | null, slaSource: string | null, checklist: string[], note: string, citation: string): FitnessStandard {
  return { jurisdiction, standardName, hazardResponseDays, slaSource, checklist, note, citation }
}

const GENERIC: FitnessStandard = std("generic", "Habitability standard", null, null, ["Verify local fitness/repair standards"], "No reviewed fitness standard — verify locally.", "Verify local rules")

export function fitnessStandard(countryCode: string | null | undefined, region?: string | null): FitnessStandard {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()
  if (cc === "GB" && rg === "SCT") return STANDARDS["GB:SCT"]
  return STANDARDS[cc] ?? { ...GENERIC, jurisdiction: cc }
}
