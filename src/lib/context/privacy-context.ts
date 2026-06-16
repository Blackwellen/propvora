import type { SupabaseClient } from "@supabase/supabase-js"
import { safeRow, normaliseCountry, toPackStatus, packAtLeast } from "./_safe"
import { getCountryProfile } from "@/lib/i18n/country-profiles"
import type { PrivacyContext } from "./intl-types"

/**
 * ============================================================================
 * PRIVACY context resolver.
 * ============================================================================
 * Reads `country_privacy_profiles` for a country; falls back to the static
 * country profile (GB → reviewed UK-GDPR posture). `reviewed` gates any
 * jurisdiction-specific privacy/DSAR/breach UI from running against a country
 * whose privacy pack has not been reviewed.
 * ============================================================================
 */

function toConsent(v: unknown): "opt_in" | "opt_out" | "mixed" {
  const s = String(v ?? "").toLowerCase().trim()
  if (s === "opt_in") return "opt_in"
  if (s === "opt_out") return "opt_out"
  return "mixed"
}

function fromProfile(code: string): PrivacyContext {
  const p = getCountryProfile(code)
  const status = code === "GB" ? "reviewed" : (p?.privacyReviewStatus ?? "research_only")
  return {
    countryCode: code,
    regime: p?.privacyRegime ?? (code === "GB" ? "uk_gdpr" : "research_only"),
    dsarResponseDays: p?.dsarResponseDays ?? (code === "GB" ? 30 : null),
    breachNotifyHours: p?.breachNotifyHours ?? (code === "GB" ? 72 : null),
    consentModel: p?.consentModel ?? "mixed",
    representativeRequired: p?.representativeRequired ?? false,
    dpoRequired: p?.dpoRequired ?? (code === "GB"),
    transferMechanism: p?.transferMechanism ?? (code === "GB" ? "uk_idta" : "none"),
    status,
    reviewed: packAtLeast(status, "reviewed"),
  }
}

export async function resolvePrivacyContext(
  supabase: SupabaseClient,
  rawCode: string
): Promise<PrivacyContext> {
  const code = normaliseCountry(rawCode) ?? (rawCode ?? "").toUpperCase()
  const fallback = fromProfile(code)

  const row = await safeRow<Record<string, unknown>>(() =>
    supabase.from("country_privacy_profiles").select("*").eq("country_code", code).maybeSingle()
  )
  if (!row) return fallback

  const status = toPackStatus(row.status, fallback.status)
  return {
    countryCode: code,
    regime: typeof row.regime === "string" && row.regime ? row.regime : fallback.regime,
    dsarResponseDays:
      row.dsar_response_days === null || row.dsar_response_days === undefined
        ? fallback.dsarResponseDays
        : Number(row.dsar_response_days),
    breachNotifyHours:
      row.breach_notify_hours === null || row.breach_notify_hours === undefined
        ? fallback.breachNotifyHours
        : Number(row.breach_notify_hours),
    consentModel: toConsent(row.consent_model ?? fallback.consentModel),
    representativeRequired: Boolean(row.representative_required),
    dpoRequired: Boolean(row.dpo_required),
    transferMechanism:
      typeof row.transfer_mechanism === "string" && row.transfer_mechanism
        ? row.transfer_mechanism
        : fallback.transferMechanism,
    status,
    reviewed: code === "GB" ? true : packAtLeast(status, "reviewed"),
  }
}
