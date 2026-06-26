/**
 * Letting-agent / property-manager regulation (dimension 19).
 *
 * Agent licensing + Client Money Protection + redress: Rent Smart Wales,
 * Scotland Letting Agent Register, England redress + CMP. Drives Settings ▸
 * Workspace + portal CMP/redress disclosure. SOURCED / indicative — NOT advice.
 */

export interface AgentDuties {
  jurisdiction: string
  /** Whether agents must be licensed/registered. */
  licenceRequired: boolean
  licenceName: string | null
  /** Client Money Protection scheme membership required. */
  cmpRequired: boolean
  /** Redress/ombudsman scheme membership required. */
  redressRequired: boolean
  redressSchemes: string[]
  note: string
  citation: string
}

const DUTIES: Record<string, AgentDuties> = {
  GB: duty("GB-EW", false, null, true, true, ["The Property Ombudsman", "Property Redress Scheme"], "England: agents must join a redress scheme + hold Client Money Protection.", "GOV.UK — letting agent redress + CMP"),
  "GB:WLS": duty("GB-WLS", true, "Rent Smart Wales licence", true, true, ["Rent Smart Wales-approved redress"], "Wales: landlords register and agents must be licensed via Rent Smart Wales.", "gov.wales — Rent Smart Wales"),
  "GB:SCT": duty("GB-SCT", true, "Scottish Letting Agent Register", true, true, ["Letting Agent Code of Practice"], "Scotland: letting agents must join the register and follow the Code of Practice.", "gov.scot — Letting Agent Registration"),
  IE: duty("IE", true, "PSRA licence", true, false, ["PSRA"], "Ireland: property services providers must hold a PSRA licence.", "psr.ie — PSRA licensing"),
}

function duty(jurisdiction: string, licenceRequired: boolean, licenceName: string | null, cmpRequired: boolean, redressRequired: boolean, redressSchemes: string[], note: string, citation: string): AgentDuties {
  return { jurisdiction, licenceRequired, licenceName, cmpRequired, redressRequired, redressSchemes, note, citation }
}

const GENERIC: AgentDuties = duty("generic", false, null, false, false, [], "No reviewed agent-regulation regime — verify locally.", "Verify local rules")

export function agentDuties(countryCode: string | null | undefined, region?: string | null): AgentDuties {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()
  if (cc === "GB") {
    if (rg === "WLS" || rg === "WALES") return DUTIES["GB:WLS"]
    if (rg === "SCT") return DUTIES["GB:SCT"]
    return DUTIES.GB
  }
  return DUTIES[cc] ?? { ...GENERIC, jurisdiction: cc }
}
