import type { SupabaseClient } from "@supabase/supabase-js"
import { safeRow, normaliseCountry } from "./_safe"
import type { SanctionsClassification, SanctionsContext } from "./intl-types"

/**
 * ============================================================================
 * SANCTIONS context resolver.
 * ============================================================================
 * Resolves the live `sanctions_country_rules` row for a country, with a
 * hard-coded defence-in-depth backstop list so a sanctioned country can NEVER
 * slip through even if the table is missing or stale. The block is enforced in
 * BOTH code (this list + resolver) and DB (sanctions_country_rules +
 * country_release_ready()).
 * ============================================================================
 */

/**
 * Comprehensively-embargoed country codes (master plan §banned). Mirrors the
 * `sanctions_country_rules` seed with classification='comprehensive_block'.
 * ISO 3166-1 alpha-2.
 */
export const HARD_BLOCKED_COUNTRY_CODES: readonly string[] = [
  "CU", // Cuba
  "IR", // Iran
  "KP", // North Korea (DPRK)
  "SY", // Syria
  "RU", // Russia
  "BY", // Belarus
  "VE", // Venezuela
  "NI", // Nicaragua
  "SD", // Sudan
  "SS", // South Sudan
  "SO", // Somalia
  "YE", // Yemen
  "AF", // Afghanistan
  "MM", // Myanmar
] as const

export function isHardBlockedCode(code: string | null | undefined): boolean {
  const c = (code ?? "").toUpperCase().trim()
  return HARD_BLOCKED_COUNTRY_CODES.includes(c)
}

function blockedDefault(code: string): SanctionsContext {
  return {
    countryCode: code,
    classification: "comprehensive_block",
    blockOnboarding: true,
    blockBilling: true,
    blockPayout: true,
    requiresManualReview: false,
    programmes: [],
    isHardBlocked: true,
    blockedReason:
      "This country is comprehensively sanctioned and cannot be onboarded, billed or paid out.",
  }
}

function allowedDefault(code: string): SanctionsContext {
  return {
    countryCode: code,
    classification: "allowed",
    blockOnboarding: false,
    blockBilling: false,
    blockPayout: false,
    requiresManualReview: false,
    programmes: [],
    isHardBlocked: false,
    blockedReason: null,
  }
}

function toClassification(v: unknown): SanctionsClassification {
  const s = String(v ?? "").toLowerCase().trim()
  if (s === "comprehensive_block") return "comprehensive_block"
  if (s === "restricted") return "restricted"
  return "allowed"
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string")
  return []
}

/**
 * Resolve the sanctions posture for a country. Code backstop always wins for
 * the hard-blocked set, regardless of what the table says.
 */
export async function resolveSanctionsContext(
  supabase: SupabaseClient,
  rawCode: string
): Promise<SanctionsContext> {
  const code = normaliseCountry(rawCode) ?? (rawCode ?? "").toUpperCase()

  // Defence in depth: hard-blocked set is non-negotiable.
  if (isHardBlockedCode(code)) return blockedDefault(code)

  const row = await safeRow<Record<string, unknown>>(() =>
    supabase.from("sanctions_country_rules").select("*").eq("country_code", code).maybeSingle()
  )

  if (!row) return allowedDefault(code)

  const classification = toClassification(row.classification)
  const isHard = classification === "comprehensive_block"
  const blockOnboarding = Boolean(row.block_onboarding) || isHard
  const blockBilling = Boolean(row.block_billing) || isHard
  const blockPayout = Boolean(row.block_payout) || isHard

  return {
    countryCode: code,
    classification,
    blockOnboarding,
    blockBilling,
    blockPayout,
    requiresManualReview: Boolean(row.requires_manual_review),
    programmes: toStringArray(row.programmes),
    isHardBlocked: isHard,
    blockedReason: isHard
      ? "This country is comprehensively sanctioned and cannot be onboarded, billed or paid out."
      : classification === "restricted"
        ? "This country is restricted and requires manual compliance review before transacting."
        : null,
  }
}
