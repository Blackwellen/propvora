import type { SupabaseClient } from "@supabase/supabase-js"
import { safeRow, normaliseCountry } from "./_safe"
import { getCountryProfile } from "@/lib/i18n/country-profiles"
import type { LocaleContext } from "./intl-types"

/**
 * ============================================================================
 * LOCALE context resolver.
 * ============================================================================
 * Resolves the formatting posture (locale, currency, measurement, area unit,
 * date format, phone code, address model) for a country from
 * `country_profiles`, degrading to the static profile catalogue and finally to
 * GB defaults. Drives the dynamic address/phone engine and all Intl formatting.
 * ============================================================================
 */

function fromProfile(code: string): LocaleContext {
  const p = getCountryProfile(code)
  if (p) {
    return {
      countryCode: code,
      locale: p.defaultLocale,
      currency: p.defaultCurrency,
      supportedLocales: p.supportedLocales,
      measurementSystem: p.measurementSystem,
      areaUnit: p.areaUnit,
      dateFormat: p.dateFormat,
      phoneCountryCode: p.phoneCountryCode,
      addressModelId: p.addressModelId,
    }
  }
  // Unknown country → GB-safe generic posture.
  return {
    countryCode: code,
    locale: "en-GB",
    currency: "GBP",
    supportedLocales: ["en-GB"],
    measurementSystem: "metric",
    areaUnit: "sqm",
    dateFormat: "dd/MM/yyyy",
    phoneCountryCode: null,
    addressModelId: "generic",
  }
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback
}

export async function resolveLocaleContext(
  supabase: SupabaseClient,
  rawCode: string
): Promise<LocaleContext> {
  const code = normaliseCountry(rawCode) ?? (rawCode ?? "").toUpperCase()
  const fallback = fromProfile(code)

  const row = await safeRow<Record<string, unknown>>(() =>
    supabase.from("country_profiles").select("*").eq("country_code", code).maybeSingle()
  )
  if (!row) return fallback

  let supportedLocales = fallback.supportedLocales
  if (Array.isArray(row.supported_locales)) {
    const arr = row.supported_locales.filter((x): x is string => typeof x === "string")
    if (arr.length) supportedLocales = arr
  }

  const measurement = str(row.measurement_system, fallback.measurementSystem)
  return {
    countryCode: code,
    locale: str(row.default_locale, fallback.locale),
    currency: str(row.default_currency, fallback.currency),
    supportedLocales,
    measurementSystem: measurement === "imperial" ? "imperial" : "metric",
    areaUnit: str(row.area_unit, fallback.areaUnit) === "sqft" ? "sqft" : "sqm",
    dateFormat: str(row.date_format, fallback.dateFormat),
    phoneCountryCode:
      typeof row.phone_country_code === "string" && row.phone_country_code
        ? row.phone_country_code
        : fallback.phoneCountryCode,
    addressModelId: str(row.address_model_id, fallback.addressModelId),
  }
}
