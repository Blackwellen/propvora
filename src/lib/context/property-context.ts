import type { SupabaseClient } from "@supabase/supabase-js"
import type { PropertyContext } from "./context-types"
import { firstString, normaliseCountry, safeRow } from "./_safe"

/**
 * Resolve the PROPERTY block — only when a propertyId is supplied.
 *
 * Returns null when no propertyId is given. When the property row exists but the
 * v2 jurisdiction columns don't, the country falls back to the supplied
 * `fallbackCountry` (the workspace business country) so downstream country/legal
 * resolution still has something sensible to work with.
 */
export async function resolvePropertyContext(
  supabase: SupabaseClient,
  propertyId: string | null | undefined,
  fallbackCountry: string
): Promise<PropertyContext | null> {
  if (!propertyId) return null

  const row = await safeRow<Record<string, unknown>>(() =>
    supabase.from("properties").select("*").eq("id", propertyId).maybeSingle()
  )

  const country =
    normaliseCountry(row?.country_code) ??
    normaliseCountry(row?.country) ??
    fallbackCountry

  const areaUnit =
    firstString(row?.area_unit) ?? (country === "US" ? "sqft" : "sqm")

  return {
    id: propertyId,
    countryCode: country,
    legalJurisdiction:
      firstString(row?.legal_jurisdiction, row?.jurisdiction) ?? country,
    currency: firstString(row?.currency) ?? "",
    areaUnit,
    isFallback: !row,
  }
}
