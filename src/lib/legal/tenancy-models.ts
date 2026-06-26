/**
 * Tenancy types & agreement models (dimensions 11 + 18).
 *
 * Statutory tenancy type, minimum term and the agreement model differ:
 * England post-RRA periodic (Section 21 abolished 1 May 2026), Wales OCCUPATION
 * CONTRACTS (Renting Homes (Wales) Act 2016 — not "tenancies"), Scotland PRT,
 * France bail vide/meublé, Germany Mietvertrag. SOURCED / indicative — NOT legal
 * advice.
 */

export interface TenancyTypeOption {
  id: string
  name: string
  minTermMonths: number | null
}

export interface TenancyModel {
  jurisdiction: string
  /** What an agreement is called here ("tenancy" vs Wales "occupation contract"). */
  agreementTerm: string
  types: TenancyTypeOption[]
  /** Whether a written statement of terms must be provided. */
  writtenStatementDuty: boolean
  note: string
  citation: string
}

const MODELS: Record<string, TenancyModel> = {
  GB: model("GB-EW", "tenancy", [
    { id: "periodic", name: "Periodic assured tenancy (post-RRA)", minTermMonths: null },
    { id: "ast", name: "Assured shorthold (pre-1 May 2026)", minTermMonths: 6 },
    { id: "lodger", name: "Lodger / licence", minTermMonths: null },
    { id: "company", name: "Company let", minTermMonths: null },
  ], true, "From 1 May 2026 the Renters' Rights Act ends new fixed-term ASTs — tenancies become periodic.", "GOV.UK — Renters' Rights Act 2026"),
  "GB:WLS": model("GB-WLS", "occupation contract", [
    { id: "standard", name: "Standard occupation contract", minTermMonths: null },
    { id: "secure", name: "Secure occupation contract", minTermMonths: null },
  ], true, "Wales uses OCCUPATION CONTRACTS (not tenancies); a written statement must be issued within 14 days.", "gov.wales — Renting Homes (Wales) Act 2016"),
  "GB:SCT": model("GB-SCT", "tenancy", [
    { id: "prt", name: "Private Residential Tenancy (PRT)", minTermMonths: null },
  ], true, "Scotland's open-ended Private Residential Tenancy with a model agreement.", "gov.scot — Private Residential Tenancy"),
  FR: model("FR", "bail", [
    { id: "vide", name: "Bail vide (unfurnished)", minTermMonths: 36 },
    { id: "meuble", name: "Bail meublé (furnished)", minTermMonths: 12 },
    { id: "mobilite", name: "Bail mobilité", minTermMonths: 1 },
  ], true, "Unfurnished 3-year / furnished 1-year minimum terms.", "FR — loi du 6 juillet 1989"),
  DE: model("DE", "Mietvertrag", [
    { id: "unbefristet", name: "Unbefristeter Mietvertrag (open-ended)", minTermMonths: null },
    { id: "befristet", name: "Zeitmietvertrag (fixed, with reason)", minTermMonths: null },
  ], true, "Open-ended lease is the norm; fixed terms need a statutory reason.", "DE — BGB Mietrecht"),
  IE: model("IE", "tenancy", [
    { id: "further", name: "Tenancy of unlimited duration (since 2022)", minTermMonths: null },
  ], true, "Tenancies become of unlimited duration after 6 months (Part 4).", "IE — Residential Tenancies Act"),
}

function model(jurisdiction: string, agreementTerm: string, types: TenancyTypeOption[], writtenStatementDuty: boolean, note: string, citation: string): TenancyModel {
  return { jurisdiction, agreementTerm, types, writtenStatementDuty, note, citation }
}

const GENERIC: TenancyModel = model("generic", "tenancy", [{ id: "standard", name: "Standard tenancy", minTermMonths: null }], false, "No reviewed tenancy model — verify local agreement types.", "Verify local rules")

export function tenancyModel(countryCode: string | null | undefined, region?: string | null): TenancyModel {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()
  if (cc === "GB") {
    if (rg === "WLS" || rg === "WALES") return MODELS["GB:WLS"]
    if (rg === "SCT") return MODELS["GB:SCT"]
    return MODELS.GB
  }
  return MODELS[cc] ?? { ...GENERIC, jurisdiction: cc }
}
