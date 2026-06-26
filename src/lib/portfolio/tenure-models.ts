/**
 * Housing / tenure & ownership models (dimension 17) — the schema-shaping one.
 *
 * Tenure types and the governance/periodic-charge model differ structurally by
 * jurisdiction: UK leasehold/freehold (service charge + ground rent), US condo
 * (HOA dues), German WEG apartment (Hausgeld + owners' association), French
 * copropriété (charges + syndic), AU/NZ strata/unit-title (body-corporate
 * levies). Drives Portfolio property model + Money (the periodic charge) +
 * Planning cost drivers. SOURCED / indicative — NOT legal advice.
 */

export interface TenureModel {
  jurisdiction: string
  /** Allowed tenure types in this jurisdiction. */
  tenureTypes: string[]
  /** The collective-ownership governance body label (null where freehold-only). */
  governanceBody: string | null
  /** Label for the recurring owner charge (service charge / Hausgeld / charges / levy). */
  periodicChargeLabel: string | null
  /** Whether a ground rent / equivalent applies. */
  groundRent: boolean
  note: string
  citation: string
}

const MODELS: Record<string, TenureModel> = {
  GB: model("GB", ["freehold", "leasehold", "commonhold", "share of freehold"], "Residents' Management Company / RTM", "Service charge", true, "Leasehold flats pay a service charge + ground rent; commonhold reform ongoing.", "GOV.UK — leasehold & commonhold"),
  US: model("US", ["fee simple", "condominium", "co-op", "townhouse (HOA)"], "Home Owners' Association (HOA)", "HOA dues", false, "Condos/HOAs levy monthly dues + special assessments; co-ops own shares.", "US — condominium / HOA structures"),
  DE: model("DE", ["Volleigentum (freehold)", "Wohnungseigentum (WEG)", "Erbbaurecht"], "Wohnungseigentümergemeinschaft (WEG)", "Hausgeld", false, "Apartments are Sondereigentum within a WEG owners' association paying Hausgeld.", "DE — WEG / Wohnungseigentumsgesetz"),
  FR: model("FR", ["pleine propriété", "copropriété", "SCI"], "Syndicat de copropriété (syndic)", "Charges de copropriété", false, "Lots in a copropriété pay charges managed by a syndic.", "FR — copropriété / loi du 10 juillet 1965"),
  ES: model("ES", ["pleno dominio", "propiedad horizontal"], "Comunidad de Propietarios", "Cuota de comunidad", false, "Flats under Ley de Propiedad Horizontal pay community fees.", "ES — Ley de Propiedad Horizontal"),
  IT: model("IT", ["piena proprietà", "condominio"], "Condominio (amministratore)", "Spese condominiali", false, "Condominio fees managed by an amministratore.", "IT — condominio (Codice Civile)"),
  AU: model("AU", ["freehold (Torrens)", "strata title", "community title"], "Owners Corporation / Body Corporate", "Strata levies", false, "Apartments are strata-titled with body-corporate levies.", "AU — strata title / Owners Corporation"),
  NZ: model("NZ", ["freehold", "unit title", "cross-lease", "leasehold"], "Body Corporate", "Body corporate levies", false, "Unit-title apartments pay body-corporate levies.", "NZ — Unit Titles Act 2010"),
  AE: model("AE", ["freehold", "leasehold (usufruct)"], "Owners' Association (jointly-owned property)", "Service charge", false, "Jointly-owned property service charges regulated (Dubai).", "AE — Jointly Owned Property Law (Dubai)"),
}

function model(jurisdiction: string, tenureTypes: string[], governanceBody: string | null, periodicChargeLabel: string | null, groundRent: boolean, note: string, citation: string): TenureModel {
  return { jurisdiction, tenureTypes, governanceBody, periodicChargeLabel, groundRent, note, citation }
}

const GENERIC: TenureModel = model("generic", ["freehold", "leasehold"], null, "Service charge", false, "No reviewed tenure model — verify local ownership structures.", "Verify local rules")

export function tenureModel(countryCode: string | null | undefined): TenureModel {
  const cc = (countryCode || "GB").toUpperCase()
  return MODELS[cc] ?? { ...GENERIC, jurisdiction: cc }
}
