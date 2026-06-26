/**
 * Short-let / holiday-let licensing (dimension 10).
 *
 * Tourist registration/licence, night caps and change-of-use vary sharply:
 * Scotland short-term let licence + control areas, England planning use-class
 * direction, ES VUT, FR n° d'enregistrement + 120-night primary-residence cap,
 * PT Alojamento Local, IE planning in RPZs, AE DTCM permit. Drives Planning SA /
 * Holiday profiles. SOURCED / indicative — NOT legal advice.
 */

export type ShortLetApplicability = "build" | "flag" | "gate"

export interface ShortLetRule {
  jurisdiction: string
  /** A tourist registration/licence is required. */
  registrationRequired: boolean
  registrationName: string | null
  /** Annual night cap on a whole-home short let (null = none/varies). */
  nightCap: number | null
  /** Change-of-use / planning permission may be required. */
  changeOfUse: boolean
  /** A tourist/occupancy tax typically applies. */
  touristTax: boolean
  /** How Propvora treats the SA/Holiday profile here. */
  applicability: ShortLetApplicability
  note: string
  citation: string
}

const RULES: Record<string, ShortLetRule> = {
  "GB:SCT": r("GB-SCT", true, "Short-term let licence", null, true, false, "build", "Mandatory short-term let licence; control areas may require planning permission.", "gov.scot — Short-term lets licensing (2022) + control areas"),
  GB: r("GB-EW", false, null, 90, true, false, "build", "London 90-night cap; planning use-class C5 direction proposed for England.", "GOV.UK — London 90-night rule; short-term let registration scheme (proposed)"),
  ES: r("ES", true, "VUT (licencia turística)", null, true, true, "gate", "Regional tourist-let licence (VUT); many cities restrict or freeze new licences.", "ES — regional VUT licensing"),
  FR: r("FR", true, "N° d'enregistrement", 120, true, true, "build", "Registration number; 120-night cap on a primary residence; change-of-use in big cities.", "FR — déclaration / n° d'enregistrement, 120-night cap"),
  PT: r("PT", true, "Alojamento Local (AL)", null, true, true, "flag", "AL registration; suspensions/limits in pressured areas.", "PT — Alojamento Local registration"),
  IE: r("IE", true, "Planning permission (RPZ)", 90, true, false, "flag", "Planning permission generally required for short lets in Rent Pressure Zones; 90-night limit on a principal residence.", "IE — short-term letting in RPZs (planning)"),
  IT: r("IT", true, "CIN (Codice Identificativo Nazionale)", null, false, true, "build", "National identification code (CIN) for short lets; regional tourist tax.", "IT — CIN national code"),
  AE: r("AE", true, "DTCM holiday-home permit", null, false, true, "build", "Dubai DTCM holiday-home operator + unit permit; Tourism Dirham fee.", "Dubai DTCM — holiday homes"),
}

function r(jurisdiction: string, registrationRequired: boolean, registrationName: string | null, nightCap: number | null, changeOfUse: boolean, touristTax: boolean, applicability: ShortLetApplicability, note: string, citation: string): ShortLetRule {
  return { jurisdiction, registrationRequired, registrationName, nightCap, changeOfUse, touristTax, applicability, note, citation }
}

const GENERIC: ShortLetRule = r("generic", false, null, null, false, false, "flag", "No reviewed short-let rule — check local tourist-licensing requirements.", "Verify local rules")

export function shortLetRule(countryCode: string | null | undefined, region?: string | null): ShortLetRule {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()
  if (cc === "GB" && rg === "SCT") return RULES["GB:SCT"]
  return RULES[cc] ?? { ...GENERIC, jurisdiction: cc }
}
