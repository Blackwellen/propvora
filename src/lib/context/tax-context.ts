import type { SupabaseClient } from "@supabase/supabase-js"
import { safeRow, normaliseCountry, toPackStatus, packAtLeast } from "./_safe"
import { getCountryProfile } from "@/lib/i18n/country-profiles"
import type { TaxContext, TaxScheme } from "./intl-types"

/**
 * ============================================================================
 * TAX context resolver.
 * ============================================================================
 * Reads `country_tax_profiles` for a country; falls back to the static country
 * profile (and GB's reviewed VAT posture) when the table is absent. `reviewed`
 * is true only when the tax pack is reviewed/enabled — surfaces use it to gate
 * any jurisdiction-specific tax UI/copy. For everything else tax is generic.
 * ============================================================================
 */

const VALID_SCHEMES: TaxScheme[] = ["vat", "vat_oss", "gst", "sales_tax", "consumption_tax", "none"]

function toScheme(v: unknown): TaxScheme {
  const s = String(v ?? "").toLowerCase().trim()
  return (VALID_SCHEMES as string[]).includes(s) ? (s as TaxScheme) : "none"
}

function fromProfile(code: string): TaxContext {
  const p = getCountryProfile(code)
  const status = code === "GB" ? "reviewed" : (p?.taxReviewStatus ?? "research_only")
  return {
    countryCode: code,
    scheme: (p?.taxScheme as TaxScheme) ?? (code === "GB" ? "vat" : "none"),
    taxName: p?.taxName ?? (code === "GB" ? "VAT" : "Tax"),
    standardRate: p?.standardTaxRate ?? (code === "GB" ? 20 : null),
    taxIdLabel: p?.taxIdLabel ?? (code === "GB" ? "VAT number" : null),
    b2bReverseCharge: p?.b2bReverseCharge ?? false,
    status,
    reviewed: packAtLeast(status, "reviewed"),
  }
}

export async function resolveTaxContext(
  supabase: SupabaseClient,
  rawCode: string
): Promise<TaxContext> {
  const code = normaliseCountry(rawCode) ?? (rawCode ?? "").toUpperCase()
  const fallback = fromProfile(code)

  const row = await safeRow<Record<string, unknown>>(() =>
    supabase.from("country_tax_profiles").select("*").eq("country_code", code).maybeSingle()
  )
  if (!row) return fallback

  const status = toPackStatus(row.status, fallback.status)
  return {
    countryCode: code,
    scheme: toScheme(row.scheme ?? fallback.scheme),
    taxName: typeof row.tax_name === "string" && row.tax_name ? row.tax_name : fallback.taxName,
    standardRate:
      row.standard_rate === null || row.standard_rate === undefined
        ? fallback.standardRate
        : Number(row.standard_rate),
    taxIdLabel:
      typeof row.tax_id_label === "string" && row.tax_id_label
        ? row.tax_id_label
        : fallback.taxIdLabel,
    b2bReverseCharge: Boolean(row.b2b_reverse_charge),
    status,
    // GB stays reviewed even if a stale row says otherwise.
    reviewed: code === "GB" ? true : packAtLeast(status, "reviewed"),
  }
}
