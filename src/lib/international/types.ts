/**
 * International / jurisdiction DTOs.
 *
 * The data layer underneath these types defaults to GB and gates every other
 * jurisdiction by the live `country_packs` status. Anything the tax engine
 * produces is an OPERATIONAL ESTIMATE to assist a user — never tax advice and
 * never a claim that tax has been filed or paid.
 */

/** ISO 3166-1 alpha-2 (uppercased) — e.g. "GB", "AU", "US". */
export type CountryCode = string

/** Tax system family a country runs. */
export type TaxSystem = "vat" | "gst" | "sales_tax" | "none"

/** Which slice of a tax system a rate row applies to. */
export type TaxAppliesTo =
  | "standard"
  | "reduced"
  | "zero"
  | "exempt"
  | "services"
  | "accommodation"

export type MeasurementSystem = "metric" | "imperial"

/**
 * Jurisdiction operational status, mirrored from country_packs into
 * jurisdiction_profiles. Drives what the app may do for that country.
 *   reviewed      — country-reviewed packs; full workflows (GB / V1)
 *   offer         — marketed but not legally reviewed; degraded/generic mode
 *   research_only — informational scaffolding only; AI must refuse advice
 *   banned        — sanctioned / hard-blocked; no onboarding or transacting
 */
export type JurisdictionStatus = "reviewed" | "offer" | "research_only" | "banned"

/** Per-country address rendering hints (from country_packs.address_format). */
export interface AddressFormat {
  /** Ordered field keys to render, e.g. ["address_line1","city","postcode"]. */
  order?: string[]
  postcode_label?: string
  region_label?: string
  region_required?: boolean
  [key: string]: unknown
}

/** A resolved country profile (country_packs row, GB-safe). */
export interface CountryProfile {
  code: CountryCode
  name: string
  currencyCode: string
  currencySymbol: string
  localeDefault: string
  dateFormat: string
  measurementSystem: MeasurementSystem
  addressFormat: AddressFormat
  taxSystem: TaxSystem
  /** Headline standard rate as a percent, e.g. 20 for 20% VAT. May be null. */
  standardTaxRate: number | null
  /** Display label for the tax, e.g. "VAT" / "GST" / "Sales Tax". */
  taxLabel: string | null
  legalFramework: Record<string, unknown>
  /** e.g. "uk_right_to_rent" for GB; null where the regime does not apply. */
  rightToRentRegime: string | null
  offerStatus: string
  legalStatus: string
  taxStatus: string
  propertyFeaturesStatus: string
  /** True only when this country is sanctioned / hard-blocked. */
  sanctioned: boolean
}

/** A single tax rate row from country_tax_rules. */
export interface TaxRule {
  countryCode: CountryCode
  taxType: TaxSystem
  name: string
  /** Percent, e.g. 20 = 20%. */
  rate: number
  appliesTo: TaxAppliesTo
  validFrom: string | null
  validTo: string | null
  notes: string | null
}

/**
 * Result of a tax calculation. All money is integer pence (or the minor unit of
 * the country's currency). `isEstimate` is always true — these numbers help a
 * user reason about price, they are not advice or a filing.
 */
export interface TaxCalculation {
  countryCode: CountryCode
  netPence: number
  taxPence: number
  grossPence: number
  /** Percent applied, e.g. 20. */
  rate: number
  taxLabel: string
  appliesTo: TaxAppliesTo
  /** Always true — output is an operational estimate, not tax advice. */
  isEstimate: true
  /** True when a GB-VAT fallback was used because no DB rule was found. */
  usedFallback: boolean
}

/** Capabilities map: which country-sensitive features apply for a jurisdiction. */
export interface JurisdictionCapabilities {
  /** Country-reviewed legal/compliance workflows may run. */
  legalWorkflows: boolean
  /** Country-specific compliance (gas/electrical/EPC etc.) calendar applies. */
  complianceModules: boolean
  /** Tax labels/codes are definitive (vs generic estimate-only). */
  definitiveTax: boolean
  /** UK Right to Rent checks apply (GB only). */
  rightToRent: boolean
  /** Onboarding/transacting is permitted at all (false for banned). */
  canOnboard: boolean
  /** Only universal features (documents/tasks/evidence) — no tenancy logic. */
  genericOnly: boolean
}

/** Full jurisdiction resolution for a workspace. */
export interface Jurisdiction {
  countryCode: CountryCode
  profile: CountryProfile
  status: JurisdictionStatus
  supported: boolean
  capabilities: JurisdictionCapabilities
}

/** Minimal Supabase-like client surface this module needs (avoids a hard dep). */
export interface MinimalSupabase {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>
        order?: (column: string, opts?: { ascending?: boolean }) => unknown
      }
      order?: (column: string, opts?: { ascending?: boolean }) => unknown
    }
  }
}
