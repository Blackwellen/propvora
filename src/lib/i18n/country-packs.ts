/**
 * Country packs: property-law configuration per jurisdiction.
 *
 * A country pack is NOT a translation — it configures:
 *   - Currency, locale, date format
 *   - Legal framework (landlord/tenant law names)
 *   - Compliance item taxonomy
 *   - Property type names
 *   - Terminology overrides (e.g. "tenant" vs "renter" vs "lessee")
 *   - Which tabs/sections are visible (UK-only items hidden elsewhere)
 *
 * Default: GB (fully reviewed). All other packs are "generic" (research-only
 * depth) until a qualified local legal review is recorded in country_packs.
 *
 * The `reviewStatus` field mirrors `country_packs.legal_status` in the DB; the
 * source of truth for AI depth + disclaimer gating remains
 * `src/lib/international/guardrails.ts`. These packs drive UI taxonomy only.
 */

export interface ComplianceCategory {
  key: string
  label: string
  mandatory: boolean
  description: string
  renewalYears?: number
}

export interface PropertyTypeOption {
  key: string
  label: string
  description?: string
}

export interface CountryPackTerms {
  tenant: string
  landlord: string
  tenancy: string
  lettingAgent: string
  notice: string
  deposit: string
  section21: string | null
  section8: string | null
}

export interface CountryPackTabVisibility {
  hmoLicensing: boolean
  rightToRent: boolean
  depositProtection: boolean
  section21Tracker: boolean
  section8Tracker: boolean
  rentalBonding: boolean
  rtiAct: boolean
  fairHousing: boolean
  rentControl: boolean
}

export interface CountryPack {
  code: string
  name: string
  currency: string
  currencySymbol: string
  locale: string
  dateFormat: string
  legalFramework: string
  reviewStatus: "reviewed" | "generic"
  terms: CountryPackTerms
  propertyTypes: PropertyTypeOption[]
  complianceCategories: ComplianceCategory[]
  tabVisibility: CountryPackTabVisibility
  legalDisclaimer: string
}

// ---------------------------------------------------------------------------
// Packs
// ---------------------------------------------------------------------------

export const COUNTRY_PACKS: Record<string, CountryPack> = {
  GB: {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    locale: "en-GB",
    dateFormat: "DD/MM/YYYY",
    legalFramework: "Housing Act 1988 (England & Wales), Housing (Scotland) Act 1988",
    reviewStatus: "reviewed",
    terms: {
      tenant: "tenant",
      landlord: "landlord",
      tenancy: "tenancy",
      lettingAgent: "letting agent",
      notice: "notice",
      deposit: "deposit",
      section21: "Section 21 notice",
      section8: "Section 8 notice",
    },
    propertyTypes: [
      { key: "detached_house", label: "Detached house" },
      { key: "semi_detached_house", label: "Semi-detached house" },
      { key: "terraced_house", label: "Terraced house" },
      { key: "flat_apartment", label: "Flat / Apartment" },
      { key: "studio_flat", label: "Studio flat" },
      { key: "maisonette", label: "Maisonette" },
      { key: "bungalow", label: "Bungalow" },
      { key: "townhouse", label: "Townhouse" },
      { key: "hmo", label: "HMO (House in Multiple Occupation)" },
      { key: "hmo_room", label: "HMO room / Lettable room" },
      { key: "serviced_apartment", label: "Serviced apartment" },
      { key: "holiday_let", label: "Holiday let" },
      { key: "student_house", label: "Student house" },
      { key: "commercial_unit", label: "Commercial unit" },
      { key: "mixed_use", label: "Mixed-use property" },
      { key: "other", label: "Other" },
    ],
    complianceCategories: [
      {
        key: "gas_safety",
        label: "Gas Safety Certificate (CP12)",
        mandatory: true,
        description: "Annual gas safety inspection by Gas Safe registered engineer",
        renewalYears: 1,
      },
      {
        key: "eicr",
        label: "Electrical Installation Condition Report (EICR)",
        mandatory: true,
        description: "Electrical safety certificate required every 5 years",
        renewalYears: 5,
      },
      {
        key: "epc",
        label: "Energy Performance Certificate (EPC)",
        mandatory: true,
        description: "Energy efficiency rating valid 10 years; must be E or above to let",
        renewalYears: 10,
      },
      {
        key: "right_to_rent",
        label: "Right to Rent Check",
        mandatory: true,
        description: "Immigration status check on all adult tenants over 18",
        renewalYears: 1,
      },
      {
        key: "deposit_protection",
        label: "Deposit Protection",
        mandatory: true,
        description: "Deposit must be protected in government-approved scheme within 30 days",
      },
      {
        key: "hmo_licence",
        label: "HMO Licence",
        mandatory: false,
        description: "Required for HMOs with 5+ tenants from 2+ households",
        renewalYears: 5,
      },
      {
        key: "fire_safety",
        label: "Fire Safety",
        mandatory: true,
        description: "Smoke alarms on each floor, CO alarm where solid fuel burning",
      },
      {
        key: "legionella",
        label: "Legionella Risk Assessment",
        mandatory: true,
        description: "Landlord must assess risk of Legionella exposure",
      },
      {
        key: "pat_testing",
        label: "PAT Testing",
        mandatory: false,
        description: "Portable appliance testing for furnished properties",
      },
    ],
    tabVisibility: {
      hmoLicensing: true,
      rightToRent: true,
      depositProtection: true,
      section21Tracker: true,
      section8Tracker: true,
      rentalBonding: false,
      rtiAct: false,
      fairHousing: false,
      rentControl: false,
    },
    legalDisclaimer:
      "This information relates to England and Wales property law. Scotland and Northern Ireland have different regulations. Always consult a qualified solicitor for legal advice.",
  },

  US: {
    code: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    locale: "en-US",
    dateFormat: "MM/DD/YYYY",
    legalFramework: "Varies by state — URLTA model, state landlord-tenant statutes",
    reviewStatus: "generic",
    terms: {
      tenant: "tenant",
      landlord: "landlord",
      tenancy: "lease",
      lettingAgent: "property manager",
      notice: "eviction notice",
      deposit: "security deposit",
      section21: null,
      section8: null,
    },
    propertyTypes: [
      { key: "single_family", label: "Single-Family Home" },
      { key: "condo", label: "Condominium" },
      { key: "apartment", label: "Apartment" },
      { key: "duplex", label: "Duplex" },
      { key: "multi_family", label: "Multi-Family" },
      { key: "townhouse", label: "Townhouse" },
      { key: "commercial", label: "Commercial" },
      { key: "other", label: "Other" },
    ],
    complianceCategories: [
      {
        key: "habitability",
        label: "Habitability Inspection",
        mandatory: true,
        description: "Property must meet local habitability standards",
      },
      {
        key: "smoke_co",
        label: "Smoke & CO Detectors",
        mandatory: true,
        description: "State-mandated smoke and carbon monoxide detector requirements",
      },
      {
        key: "lead_paint",
        label: "Lead Paint Disclosure",
        mandatory: true,
        description: "Required for properties built before 1978 (federal law)",
      },
      {
        key: "fair_housing",
        label: "Fair Housing Compliance",
        mandatory: true,
        description:
          "Federal Fair Housing Act compliance — no discrimination on protected characteristics",
      },
      {
        key: "security_deposit",
        label: "Security Deposit Limits",
        mandatory: true,
        description: "State-specific limits on security deposit amounts and return timelines",
      },
    ],
    tabVisibility: {
      hmoLicensing: false,
      rightToRent: false,
      depositProtection: false,
      section21Tracker: false,
      section8Tracker: false,
      rentalBonding: false,
      rtiAct: false,
      fairHousing: true,
      rentControl: true,
    },
    legalDisclaimer:
      "Landlord-tenant law varies significantly by state and municipality. Propvora provides general guidance only. Always consult a licensed attorney in your state for legal advice.",
  },

  AU: {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "A$",
    locale: "en-AU",
    dateFormat: "DD/MM/YYYY",
    legalFramework: "Residential Tenancies Acts (varies by state/territory)",
    reviewStatus: "generic",
    terms: {
      tenant: "tenant",
      landlord: "landlord",
      tenancy: "tenancy agreement",
      lettingAgent: "property manager",
      notice: "termination notice",
      deposit: "bond",
      section21: null,
      section8: null,
    },
    propertyTypes: [
      { key: "house", label: "House" },
      { key: "unit", label: "Unit / Apartment" },
      { key: "townhouse", label: "Townhouse" },
      { key: "granny_flat", label: "Granny Flat" },
      { key: "duplex", label: "Duplex" },
      { key: "commercial", label: "Commercial" },
      { key: "other", label: "Other" },
    ],
    complianceCategories: [
      {
        key: "smoke_alarms",
        label: "Smoke Alarms",
        mandatory: true,
        description: "Hardwired or 10-year battery smoke alarms required",
      },
      {
        key: "bond_lodgement",
        label: "Bond Lodgement",
        mandatory: true,
        description: "Bond must be lodged with state bond authority within 10 business days",
      },
      {
        key: "pool_safety",
        label: "Pool Safety Certificate",
        mandatory: false,
        description: "Required for properties with pools",
      },
      {
        key: "gas_appliances",
        label: "Gas Appliance Safety",
        mandatory: true,
        description: "Gas appliances must be serviced by licensed gas fitter",
      },
    ],
    tabVisibility: {
      hmoLicensing: false,
      rightToRent: false,
      depositProtection: false,
      section21Tracker: false,
      section8Tracker: false,
      rentalBonding: true,
      rtiAct: false,
      fairHousing: false,
      rentControl: false,
    },
    legalDisclaimer:
      "Residential tenancy law varies by Australian state and territory. This information is general in nature. Consult a licensed agent or solicitor for advice specific to your state.",
  },

  CA: {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    currencySymbol: "C$",
    locale: "en-CA",
    dateFormat: "YYYY-MM-DD",
    legalFramework: "Provincial Residential Tenancies Acts",
    reviewStatus: "generic",
    terms: {
      tenant: "tenant",
      landlord: "landlord",
      tenancy: "tenancy agreement",
      lettingAgent: "property manager",
      notice: "notice of termination",
      deposit: "security deposit",
      section21: null,
      section8: null,
    },
    propertyTypes: [
      { key: "house", label: "House" },
      { key: "condo", label: "Condominium" },
      { key: "apartment", label: "Apartment" },
      { key: "townhouse", label: "Townhouse" },
      { key: "basement_suite", label: "Basement Suite" },
      { key: "other", label: "Other" },
    ],
    complianceCategories: [
      {
        key: "smoke_co",
        label: "Smoke & CO Alarms",
        mandatory: true,
        description: "Province-mandated smoke and CO alarm requirements",
      },
      {
        key: "fire_safety",
        label: "Fire Safety Inspection",
        mandatory: true,
        description: "Annual fire safety inspection for multi-unit buildings",
      },
    ],
    tabVisibility: {
      hmoLicensing: false,
      rightToRent: false,
      depositProtection: false,
      section21Tracker: false,
      section8Tracker: false,
      rentalBonding: false,
      rtiAct: false,
      fairHousing: false,
      rentControl: true,
    },
    legalDisclaimer:
      "Tenancy law varies by province in Canada. This information is general guidance only. Consult a local lawyer or tenant rights organisation for specific advice.",
  },

  DE: {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    currencySymbol: "€",
    locale: "de-DE",
    dateFormat: "DD.MM.YYYY",
    legalFramework: "Bürgerliches Gesetzbuch (BGB) §§ 535–580a, Mietrecht",
    reviewStatus: "generic",
    terms: {
      tenant: "Mieter",
      landlord: "Vermieter",
      tenancy: "Mietvertrag",
      lettingAgent: "Immobilienmakler",
      notice: "Kündigung",
      deposit: "Kaution",
      section21: null,
      section8: null,
    },
    propertyTypes: [
      { key: "wohnung", label: "Wohnung (Apartment)" },
      { key: "haus", label: "Haus (House)" },
      { key: "gewerbe", label: "Gewerbe (Commercial)" },
      { key: "other", label: "Other" },
    ],
    complianceCategories: [
      {
        key: "heizung",
        label: "Heizungscheck (Heating Inspection)",
        mandatory: true,
        description: "Annual heating system inspection",
        renewalYears: 1,
      },
      {
        key: "nebenkostenabrechnung",
        label: "Betriebskostenabrechnung",
        mandatory: true,
        description: "Annual service charge reconciliation",
        renewalYears: 1,
      },
      {
        key: "rauchmelder",
        label: "Rauchwarnmelder (Smoke Detectors)",
        mandatory: true,
        description: "Smoke detectors required in all rooms",
      },
    ],
    tabVisibility: {
      hmoLicensing: false,
      rightToRent: false,
      depositProtection: false,
      section21Tracker: false,
      section8Tracker: false,
      rentalBonding: false,
      rtiAct: false,
      fairHousing: false,
      rentControl: true,
    },
    legalDisclaimer:
      "Diese Informationen beziehen sich auf das deutsche Mietrecht. Holen Sie rechtlichen Rat von einem zugelassenen deutschen Rechtsanwalt ein. (This relates to German tenancy law. Seek advice from a qualified German lawyer.)",
  },

  AE: {
    code: "AE",
    name: "UAE (Dubai / Abu Dhabi)",
    currency: "AED",
    currencySymbol: "AED",
    locale: "en-AE",
    dateFormat: "DD/MM/YYYY",
    legalFramework: "UAE Tenancy Law No. 26 of 2007 (Dubai), Law No. 4 of 2011",
    reviewStatus: "generic",
    terms: {
      tenant: "tenant",
      landlord: "landlord",
      tenancy: "tenancy contract",
      lettingAgent: "real estate agent",
      notice: "notice to vacate",
      deposit: "security deposit",
      section21: null,
      section8: null,
    },
    propertyTypes: [
      { key: "apartment", label: "Apartment" },
      { key: "villa", label: "Villa" },
      { key: "townhouse", label: "Townhouse" },
      { key: "studio", label: "Studio" },
      { key: "penthouse", label: "Penthouse" },
      { key: "commercial", label: "Commercial" },
      { key: "other", label: "Other" },
    ],
    complianceCategories: [
      {
        key: "ejari",
        label: "Ejari Registration",
        mandatory: true,
        description: "Tenancy contracts must be registered with Ejari (Dubai)",
      },
      {
        key: "dewa",
        label: "DEWA Connection",
        mandatory: true,
        description: "Dubai Electricity and Water Authority connection for tenant",
      },
      {
        key: "trakheesi",
        label: "Trakheesi Permit",
        mandatory: false,
        description: "Real estate agent licence (RERA)",
      },
    ],
    tabVisibility: {
      hmoLicensing: false,
      rightToRent: false,
      depositProtection: false,
      section21Tracker: false,
      section8Tracker: false,
      rentalBonding: false,
      rtiAct: false,
      fairHousing: false,
      rentControl: true,
    },
    legalDisclaimer:
      "UAE tenancy law differs between Emirates. Dubai follows Law No. 26 of 2007 as amended. Consult a RERA-registered agent or UAE lawyer for specific advice.",
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the pack for a country code, falling back to GB. */
export function getCountryPack(code: string | null | undefined): CountryPack {
  if (!code) return COUNTRY_PACKS["GB"]
  return COUNTRY_PACKS[code.toUpperCase()] ?? COUNTRY_PACKS["GB"]
}

/** Flat list of all packs (useful for pickers). */
export function getAllCountryPacks(): CountryPack[] {
  return Object.values(COUNTRY_PACKS)
}

/** Terminology for a given pack and key. Never returns undefined. */
export function getTerm(pack: CountryPack, key: keyof CountryPackTerms): string {
  return pack.terms[key] ?? key
}

/** Whether a tab should be shown for a given pack. Defaults to false for unknown keys. */
export function isTabVisible(
  pack: CountryPack,
  key: keyof CountryPackTabVisibility
): boolean {
  return pack.tabVisibility[key] ?? false
}

/**
 * Build the jurisdiction-terms clause for the AI system prompt.
 * For GB (reviewed) references Section 21/8 by name; for others uses generic
 * local-law terminology from the pack.
 */
export function aiPackTermsClause(pack: CountryPack): string {
  if (pack.code === "GB" && pack.reviewStatus === "reviewed") {
    return [
      `JURISDICTION TERMS (${pack.name}): Use UK landlord-tenant terminology.`,
      `Correct terms: tenant, landlord, tenancy, letting agent, notice, deposit.`,
      `UK-specific instruments: Section 21 notice (no-fault possession), Section 8 notice (breach-based possession), EPC, EICR, Gas Safety Certificate, HMO licence, Right to Rent.`,
      `These are reviewed for ${pack.legalFramework}. Reference them by name only as general information — never as definitive legal advice.`,
    ].join("\n")
  }

  const t = pack.terms
  const hasLocalTerms =
    t.section21 === null &&
    (t.tenant !== "tenant" || t.landlord !== "landlord" || t.deposit !== "deposit")

  const lines = [
    `JURISDICTION TERMS (${pack.name}): Use local landlord-tenant terminology for this jurisdiction.`,
    `Tenant = "${t.tenant}", Landlord = "${t.landlord}", Tenancy = "${t.tenancy}", Deposit = "${t.deposit}", Notice = "${t.notice}".`,
    t.section21
      ? `This jurisdiction uses "${t.section21}" and "${t.section8}" — reference only as general information.`
      : `This jurisdiction does NOT use UK Section 21/8 notices. Do not apply UK possession rules here.`,
  ]
  if (hasLocalTerms) {
    lines.push(
      `Legal framework: ${pack.legalFramework}. This is a generic/research-level jurisdiction — provide no specific legal/tax claims, only general information with a strong disclaimer.`
    )
  }
  return lines.join("\n")
}
