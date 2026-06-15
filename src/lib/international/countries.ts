import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  AddressFormat,
  CountryCode,
  CountryProfile,
  MeasurementSystem,
  TaxSystem,
} from "./types"

/**
 * Country profile data access. Reads the live `country_packs` control plane and
 * normalises rows into {@link CountryProfile}. Defaults to GB and is tolerant of
 * a cold/erroring DB (42P01 etc.) — GB always resolves via a hard-coded fallback
 * so core UK behaviour never breaks.
 */

/** Default jurisdiction for the whole platform (Blackwellen Ltd t/a Propvora). */
export const DEFAULT_COUNTRY_CODE: CountryCode = "GB"

/**
 * Hard-coded sanctions / hard-block list. Independent of the DB so onboarding
 * can never be tricked into a sanctioned jurisdiction even if `country_packs`
 * is unavailable. Mirrors the `banned` rows but is the source of truth in code.
 */
export const SANCTIONED_COUNTRY_CODES: readonly CountryCode[] = [
  "RU", // Russia
  "IR", // Iran
  "KP", // North Korea
  "SY", // Syria
] as const

/** Hard-coded GB profile — the reviewed/enabled reference, used as cold fallback. */
const GB_PROFILE: CountryProfile = {
  code: "GB",
  name: "United Kingdom",
  currencyCode: "GBP",
  currencySymbol: "£",
  localeDefault: "en-GB",
  dateFormat: "dd/MM/yyyy",
  measurementSystem: "metric",
  addressFormat: {
    order: ["address_line1", "address_line2", "city", "county", "postcode"],
    postcode_label: "Postcode",
    region_label: "County",
    region_required: false,
  },
  taxSystem: "vat",
  standardTaxRate: 20,
  taxLabel: "VAT",
  legalFramework: {
    tenancy_act: "Renters' Rights Act 2026",
    licensing: "HMO",
    level: "national",
  },
  rightToRentRegime: "uk_right_to_rent",
  offerStatus: "offer",
  legalStatus: "reviewed",
  taxStatus: "reviewed",
  propertyFeaturesStatus: "enabled",
  sanctioned: false,
}

/** Normalise an ISO code: uppercase, trimmed. Empty/invalid → "". */
export function normaliseCountryCode(code: string | null | undefined): CountryCode {
  return (code ?? "").trim().toUpperCase()
}

/** True if the country is on the hard-coded sanctions list (cannot transact). */
export function isCountrySanctioned(code: string | null | undefined): boolean {
  return SANCTIONED_COUNTRY_CODES.includes(normaliseCountryCode(code))
}

const COUNTRY_PACK_COLUMNS =
  "code, name, currency_code, currency_symbol, locale_default, default_currency, default_locale, " +
  "date_format, measurement_system, address_format, tax_system, standard_tax_rate, tax_label, " +
  "legal_framework, right_to_rent_regime, offer_status, legal_status, tax_status, property_features_status"

function toMeasurement(v: unknown): MeasurementSystem {
  return v === "imperial" ? "imperial" : "metric"
}

function toTaxSystem(v: unknown): TaxSystem {
  if (v === "vat" || v === "gst" || v === "sales_tax" || v === "none") return v
  return "none"
}

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function toAddressFormat(v: unknown): AddressFormat {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as AddressFormat
  return {}
}

/** Map a raw country_packs row → CountryProfile (with sensible coalescing). */
function rowToProfile(row: Record<string, unknown>): CountryProfile {
  const code = normaliseCountryCode(row.code as string)
  return {
    code,
    name: (row.name as string) ?? code,
    currencyCode:
      (row.currency_code as string) || (row.default_currency as string) || "GBP",
    currencySymbol: (row.currency_symbol as string) || "",
    localeDefault:
      (row.locale_default as string) || (row.default_locale as string) || "en-GB",
    dateFormat: (row.date_format as string) || "dd/MM/yyyy",
    measurementSystem: toMeasurement(row.measurement_system),
    addressFormat: toAddressFormat(row.address_format),
    taxSystem: toTaxSystem(row.tax_system),
    standardTaxRate: toNumberOrNull(row.standard_tax_rate),
    taxLabel: (row.tax_label as string) ?? null,
    legalFramework:
      row.legal_framework && typeof row.legal_framework === "object"
        ? (row.legal_framework as Record<string, unknown>)
        : {},
    rightToRentRegime: (row.right_to_rent_regime as string) ?? null,
    offerStatus: (row.offer_status as string) ?? "research_only",
    legalStatus: (row.legal_status as string) ?? "research_only",
    taxStatus: (row.tax_status as string) ?? "research_only",
    propertyFeaturesStatus: (row.property_features_status as string) ?? "disabled",
    sanctioned: isCountrySanctioned(code),
  }
}

/**
 * Resolve a country profile from the live DB. Returns the GB fallback when the
 * code is GB/empty or when the DB is unavailable. Returns null only for a
 * non-GB code that genuinely has no pack row.
 */
export async function getCountryProfile(
  supabase: SupabaseClient,
  code: string | null | undefined
): Promise<CountryProfile | null> {
  const cc = normaliseCountryCode(code) || DEFAULT_COUNTRY_CODE
  if (cc === "GB") {
    // Always answer for GB, but prefer live values if present.
    try {
      const { data, error } = await supabase
        .from("country_packs")
        .select(COUNTRY_PACK_COLUMNS)
        .eq("code", "GB")
        .maybeSingle()
      if (!error && data) return rowToProfile(data as unknown as Record<string, unknown>)
    } catch {
      /* fall through to hard-coded GB */
    }
    return { ...GB_PROFILE }
  }
  try {
    const { data, error } = await supabase
      .from("country_packs")
      .select(COUNTRY_PACK_COLUMNS)
      .eq("code", cc)
      .maybeSingle()
    if (error || !data) return null
    return rowToProfile(data as unknown as Record<string, unknown>)
  } catch {
    return null
  }
}

/** Synchronous GB profile (no DB) — for cold paths / SSR defaults. */
export function getDefaultCountryProfile(): CountryProfile {
  return { ...GB_PROFILE }
}

/**
 * List supported (non-banned) countries. Returns the GB-only fallback if the DB
 * is unavailable so the app always has at least its home jurisdiction.
 */
export async function listSupportedCountries(
  supabase: SupabaseClient
): Promise<CountryProfile[]> {
  try {
    const { data, error } = await supabase
      .from("country_packs")
      .select(COUNTRY_PACK_COLUMNS)
      .neq("offer_status", "banned")
      .order("name", { ascending: true })
    if (error || !data) return [{ ...GB_PROFILE }]
    const rows = (data as unknown as Record<string, unknown>[]).map(rowToProfile)
    return rows.length ? rows : [{ ...GB_PROFILE }]
  } catch {
    return [{ ...GB_PROFILE }]
  }
}

/**
 * True if a country is supported (a non-banned pack exists). GB is always
 * supported. Sanctioned countries are never supported.
 */
export async function isCountrySupported(
  supabase: SupabaseClient,
  code: string | null | undefined
): Promise<boolean> {
  const cc = normaliseCountryCode(code)
  if (!cc) return false
  if (cc === "GB") return true
  if (isCountrySanctioned(cc)) return false
  const profile = await getCountryProfile(supabase, cc)
  return !!profile && profile.offerStatus !== "banned"
}

/**
 * Format an address from its parts using the profile's address_format order.
 * Pure / DB-free. Falls back to a sensible UK-style order. Empty parts dropped.
 */
export function formatAddress(
  profile: Pick<CountryProfile, "addressFormat">,
  parts: Record<string, string | null | undefined>
): string {
  const order =
    profile.addressFormat.order && profile.addressFormat.order.length
      ? profile.addressFormat.order
      : ["address_line1", "address_line2", "city", "county", "postcode"]
  return order
    .map((key) => (parts[key] ?? "").trim())
    .filter((v) => v.length > 0)
    .join(", ")
}

/** Format a minor-unit (pence) amount in the profile's currency. */
export function formatCurrencyFromPence(
  profile: Pick<CountryProfile, "currencyCode" | "localeDefault">,
  pence: number
): string {
  const major = pence / 100
  try {
    return new Intl.NumberFormat(profile.localeDefault || "en-GB", {
      style: "currency",
      currency: profile.currencyCode || "GBP",
    }).format(major)
  } catch {
    return `${(profile.currencyCode || "GBP")} ${major.toFixed(2)}`
  }
}

/** Area unit implied by the measurement system. */
export function areaUnit(profile: Pick<CountryProfile, "measurementSystem">): "sqm" | "sqft" {
  return profile.measurementSystem === "imperial" ? "sqft" : "sqm"
}
