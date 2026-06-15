import type { SupabaseClient } from "@supabase/supabase-js"
import { normalisePackStatus, type CountryPackStatus, type OfferStatus } from "./guardrails"

// ============================================================================
// Resolve a workspace's jurisdiction + its country-pack status, tolerantly.
//
// Reads `workspaces.business_country_code` (defaulting to GB) and the matching
// `country_packs` row. Every query is 42P01/42703-safe — a missing table or
// column simply yields the GB-reviewed defaults, so the app behaves exactly as
// today when the international schema isn't present. Nothing here ever throws.
//
// We intentionally derive a single "effective" legal status as the WORST-of the
// legal/tax/privacy statuses so the AI/legal/tax disclaimer is never weaker than
// the least-reviewed domain.
// ============================================================================

export interface WorkspaceJurisdiction {
  countryCode: string
  countryName: string | null
  currency: string | null
  locale: string | null
  /** Worst-of legal/tax/privacy status — drives AI depth + disclaimers. */
  effectiveStatus: CountryPackStatus
  legalStatus: CountryPackStatus
  taxStatus: CountryPackStatus
  offerStatus: OfferStatus | null
  /** True when no pack row was found (treated as GB defaults / cautious). */
  packMissing: boolean
}

const GB_DEFAULT: WorkspaceJurisdiction = {
  countryCode: "GB",
  countryName: "United Kingdom",
  currency: "GBP",
  locale: "en-GB",
  effectiveStatus: "reviewed",
  legalStatus: "reviewed",
  taxStatus: "reviewed",
  offerStatus: "offer",
  packMissing: false,
}

const STATUS_RANK: Record<CountryPackStatus, number> = {
  reviewed: 2,
  offer: 1,
  research_only: 0,
}

function worstOf(...statuses: CountryPackStatus[]): CountryPackStatus {
  return statuses.reduce((worst, s) => (STATUS_RANK[s] < STATUS_RANK[worst] ? s : worst), "reviewed")
}

/** Fetch the active workspace's jurisdiction. Never throws; GB-safe defaults. */
export async function getWorkspaceJurisdiction(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined
): Promise<WorkspaceJurisdiction> {
  if (!workspaceId || workspaceId === "demo-workspace") return { ...GB_DEFAULT }

  let code = "GB"
  let wsCurrency: string | null = null
  let wsLocale: string | null = null
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("business_country_code, default_currency, currency, default_language")
      .eq("id", workspaceId)
      .maybeSingle()
    if (ws) {
      code = (ws.business_country_code as string | null)?.toUpperCase() || "GB"
      wsCurrency = (ws.default_currency as string | null) ?? (ws.currency as string | null) ?? null
      wsLocale = (ws.default_language as string | null) ?? null
    }
  } catch {
    /* 42P01 / 42703 — fall back to GB defaults */
  }

  if (code === "GB") {
    return {
      ...GB_DEFAULT,
      currency: wsCurrency ?? GB_DEFAULT.currency,
      locale: wsLocale ?? GB_DEFAULT.locale,
    }
  }

  // Non-GB: load the country pack for status/metadata.
  try {
    const { data: pack } = await supabase
      .from("country_packs")
      .select(
        "code, name, default_currency, default_locale, legal_status, tax_status, privacy_status, offer_status"
      )
      .eq("code", code)
      .maybeSingle()

    if (!pack) {
      // Unknown country with no pack — treat cautiously (research_only).
      return {
        countryCode: code,
        countryName: null,
        currency: wsCurrency,
        locale: wsLocale,
        effectiveStatus: "research_only",
        legalStatus: "research_only",
        taxStatus: "research_only",
        offerStatus: null,
        packMissing: true,
      }
    }

    const legal = normalisePackStatus(pack.legal_status as string | null)
    const tax = normalisePackStatus(pack.tax_status as string | null)
    const privacy = normalisePackStatus(pack.privacy_status as string | null)
    const offerRaw = String(pack.offer_status ?? "").toLowerCase().trim()
    const offerStatus: OfferStatus | null =
      offerRaw === "offer" || offerRaw === "restricted" || offerRaw === "banned"
        ? (offerRaw as OfferStatus)
        : null

    return {
      countryCode: code,
      countryName: (pack.name as string | null) ?? null,
      currency: wsCurrency ?? (pack.default_currency as string | null) ?? null,
      locale: wsLocale ?? (pack.default_locale as string | null) ?? null,
      effectiveStatus: worstOf(legal, tax, privacy),
      legalStatus: legal,
      taxStatus: tax,
      offerStatus,
      packMissing: false,
    }
  } catch {
    // country_packs table absent — cautious non-GB defaults.
    return {
      countryCode: code,
      countryName: null,
      currency: wsCurrency,
      locale: wsLocale,
      effectiveStatus: "research_only",
      legalStatus: "research_only",
      taxStatus: "research_only",
      offerStatus: null,
      packMissing: true,
    }
  }
}

/** List selectable countries from country_packs (offer status only, non-sanctioned). */
export interface SelectableCountry {
  code: string
  name: string
  defaultCurrency: string | null
  defaultLocale: string | null
  legalStatus: CountryPackStatus
  taxStatus: CountryPackStatus
  offerStatus: OfferStatus
}

export async function listSelectableCountries(
  supabase: SupabaseClient
): Promise<SelectableCountry[]> {
  try {
    const { data } = await supabase
      .from("country_packs")
      .select(
        "code, name, default_currency, default_locale, legal_status, tax_status, offer_status"
      )
      .order("name", { ascending: true })

    const rows = (data ?? []) as Record<string, unknown>[]
    const out = rows
      .map((r) => ({
        code: String(r.code ?? "").toUpperCase(),
        name: String(r.name ?? r.code ?? ""),
        defaultCurrency: (r.default_currency as string | null) ?? null,
        defaultLocale: (r.default_locale as string | null) ?? null,
        legalStatus: normalisePackStatus(r.legal_status as string | null),
        taxStatus: normalisePackStatus(r.tax_status as string | null),
        offerStatus: String(r.offer_status ?? "").toLowerCase().trim() as OfferStatus,
      }))
      .filter((c) => c.code.length === 2 && c.offerStatus === "offer")
    return out
  } catch {
    // No country_packs table → only GB is available (today's behaviour).
    return [
      {
        code: "GB",
        name: "United Kingdom",
        defaultCurrency: "GBP",
        defaultLocale: "en-GB",
        legalStatus: "reviewed",
        taxStatus: "reviewed",
        offerStatus: "offer",
      },
    ]
  }
}
