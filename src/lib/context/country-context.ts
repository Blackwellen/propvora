import type { SupabaseClient } from "@supabase/supabase-js"
import type { CountryContext, OfferStatus, PackStatus } from "./context-types"
import { safeRow, toPackStatus } from "./_safe"

/**
 * Resolve the COUNTRY PACK block.
 *
 * Reads the `country_packs` table (the v2 foundation table) for the country in
 * scope — the property's country when a property is given, otherwise the
 * workspace's business country.
 *
 * SAFE DEFAULTS when the pack row/table is absent:
 *   - GB  → fully-enabled posture (V1 is UK-reviewed): every status `enabled`,
 *           offer `offer`. This preserves existing UK behaviour.
 *   - any other country → `generic_only` posture: universal features only, no
 *           jurisdiction-specific legal/tax/compliance logic, offer `unknown`.
 * This guarantees we never run UK rules against a non-UK property and never
 * break a v1 environment that has no `country_packs` table.
 */

const GB_DEFAULT: Omit<CountryContext, "code" | "source" | "isFallback"> = {
  offerStatus: "offer",
  propertyFeaturesStatus: "enabled",
  currency: "GBP",
  locale: "en-GB",
  legalStatus: "enabled",
  taxStatus: "enabled",
  privacyStatus: "enabled",
  disclaimers: [],
}

function genericDefault(
  code: string
): Omit<CountryContext, "code" | "source" | "isFallback"> {
  return {
    offerStatus: "unknown",
    propertyFeaturesStatus: "generic_only",
    currency: code === "US" ? "USD" : "GBP",
    locale: code === "US" ? "en-US" : "en-GB",
    legalStatus: "generic_only",
    taxStatus: "generic_only",
    privacyStatus: "generic_only",
    disclaimers: [
      `No reviewed country pack for ${code}. Generic mode only — jurisdiction-specific legal, tax and compliance features are disabled until a reviewed pack is available.`,
    ],
  }
}

function toOfferStatus(v: unknown): OfferStatus {
  const known: OfferStatus[] = ["offer", "restricted", "banned", "unknown"]
  return typeof v === "string" && (known as string[]).includes(v)
    ? (v as OfferStatus)
    : "unknown"
}

function toDisclaimers(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string")
  if (typeof v === "string" && v.trim()) return [v.trim()]
  return []
}

export async function resolveCountryContext(
  supabase: SupabaseClient,
  args: { code: string; source: "property" | "workspace" | "default" }
): Promise<CountryContext> {
  const code = args.code
  const fallback = code === "GB" ? GB_DEFAULT : genericDefault(code)

  const row = await safeRow<Record<string, unknown>>(() =>
    supabase.from("country_packs").select("*").eq("country_code", code).maybeSingle()
  )

  if (!row) {
    return { code, source: args.source, ...fallback, isFallback: true }
  }

  // The pack exists — read what's there, defaulting per-column to the safe
  // fallback so partially-populated rows still resolve cleanly.
  const propertyFeatures: PackStatus = toPackStatus(
    row.property_features_status,
    fallback.propertyFeaturesStatus
  )
  const legalStatus: PackStatus = toPackStatus(
    row.legal_pack_status ?? row.legal_status,
    fallback.legalStatus
  )
  const taxStatus: PackStatus = toPackStatus(
    row.tax_review_status ?? row.tax_status,
    fallback.taxStatus
  )
  const privacyStatus: PackStatus = toPackStatus(
    row.privacy_review_status ?? row.privacy_status,
    fallback.privacyStatus
  )

  return {
    code,
    source: args.source,
    offerStatus:
      row.offer_status !== undefined ? toOfferStatus(row.offer_status) : fallback.offerStatus,
    propertyFeaturesStatus: propertyFeatures,
    currency:
      typeof row.default_currency === "string" && row.default_currency
        ? row.default_currency
        : fallback.currency,
    locale:
      typeof row.default_locale === "string" && row.default_locale
        ? row.default_locale
        : fallback.locale,
    legalStatus,
    taxStatus,
    privacyStatus,
    disclaimers: toDisclaimers(row.disclaimers ?? row.disclaimer),
    isFallback: false,
  }
}
