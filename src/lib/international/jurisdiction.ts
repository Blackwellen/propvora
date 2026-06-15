import type { SupabaseClient } from "@supabase/supabase-js"
import {
  DEFAULT_COUNTRY_CODE,
  getCountryProfile,
  getDefaultCountryProfile,
  isCountrySanctioned,
  normaliseCountryCode,
} from "./countries"
import type {
  CountryProfile,
  Jurisdiction,
  JurisdictionCapabilities,
  JurisdictionStatus,
} from "./types"

/**
 * Jurisdiction resolution: maps a workspace (or a bare country code) to its
 * country profile, operational status, and the set of country-sensitive
 * capabilities that may run. Defaults to GB and is 42P01-tolerant.
 *
 * Capabilities follow the country-legal-profile spec:
 *   reviewed      → full legal/compliance workflows, definitive tax labels
 *   offer         → marketed but not legally reviewed → generic/degraded mode
 *   research_only → informational scaffolding only; AI refuses country advice
 *   banned        → no onboarding, no transacting (sanctioned)
 */

/** Derive jurisdiction status from a profile's country_packs fields. */
export function deriveStatus(profile: CountryProfile): JurisdictionStatus {
  if (profile.sanctioned || profile.offerStatus === "banned") return "banned"
  if (profile.legalStatus === "reviewed" && profile.propertyFeaturesStatus === "enabled") {
    return "reviewed"
  }
  if (profile.offerStatus === "offer") return "offer"
  return "research_only"
}

/** Capabilities implied by a status + profile. Right to Rent is GB-only. */
export function capabilitiesFor(
  profile: CountryProfile,
  status: JurisdictionStatus
): JurisdictionCapabilities {
  const reviewed = status === "reviewed"
  const banned = status === "banned"
  return {
    legalWorkflows: reviewed,
    complianceModules: reviewed,
    definitiveTax: reviewed && profile.taxStatus === "reviewed",
    // UK Right to Rent only applies where the regime is set (GB) AND reviewed.
    rightToRent: reviewed && profile.rightToRentRegime === "uk_right_to_rent",
    canOnboard: !banned,
    // Anything below "reviewed" runs in universal/generic mode (no tenancy logic).
    genericOnly: !reviewed && !banned,
  }
}

/** Build a Jurisdiction from a resolved profile. */
function toJurisdiction(profile: CountryProfile): Jurisdiction {
  const status = deriveStatus(profile)
  return {
    countryCode: profile.code,
    profile,
    status,
    supported: status !== "banned",
    capabilities: capabilitiesFor(profile, status),
  }
}

/** The GB default jurisdiction (no DB) — safe cold-path fallback. */
export function getDefaultJurisdiction(): Jurisdiction {
  return toJurisdiction(getDefaultCountryProfile())
}

/**
 * Resolve a jurisdiction for a country code directly. Returns the GB default for
 * GB/empty and a research_only-style profile for an unknown code.
 */
export async function resolveJurisdiction(
  supabase: SupabaseClient,
  code: string | null | undefined
): Promise<Jurisdiction> {
  const cc = normaliseCountryCode(code) || DEFAULT_COUNTRY_CODE
  const profile = await getCountryProfile(supabase, cc)
  if (!profile) {
    // Unknown country with no pack → GB default profile shape but flagged generic.
    const fallback = { ...getDefaultCountryProfile(), code: cc, legalStatus: "none", propertyFeaturesStatus: "generic_only", offerStatus: "none" }
    return toJurisdiction(fallback)
  }
  return toJurisdiction(profile)
}

/**
 * Resolve the jurisdiction for a workspace. Reads `workspaces.business_country_code`
 * (falling back to tax_country_code, then GB). 42P01-tolerant: any error → GB.
 */
export async function resolveWorkspaceJurisdiction(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Jurisdiction> {
  if (!workspaceId || workspaceId === "demo-workspace") {
    return getDefaultJurisdiction()
  }
  let code = DEFAULT_COUNTRY_CODE
  try {
    const { data, error } = await supabase
      .from("workspaces")
      .select("business_country_code, tax_country_code")
      .eq("id", workspaceId)
      .maybeSingle()
    if (!error && data) {
      const row = data as { business_country_code?: string | null; tax_country_code?: string | null }
      code =
        normaliseCountryCode(row.business_country_code) ||
        normaliseCountryCode(row.tax_country_code) ||
        DEFAULT_COUNTRY_CODE
    }
  } catch {
    return getDefaultJurisdiction()
  }
  return resolveJurisdiction(supabase, code)
}

/**
 * Can a country be onboarded? False for sanctioned/banned countries. Synchronous
 * hard-block (does not depend on the DB) for the sanctions list; the broader
 * "is there a pack" check is `isCountrySupported` in countries.ts.
 */
export function canOnboardJurisdiction(code: string | null | undefined): boolean {
  const cc = normaliseCountryCode(code)
  if (!cc) return false
  return !isCountrySanctioned(cc)
}

/**
 * DB-backed capabilities for a country code (which sections/features apply).
 * GB → full; banned → none; everything else → generic mode. 42P01-tolerant.
 */
export async function jurisdictionCapabilities(
  supabase: SupabaseClient,
  code: string | null | undefined
): Promise<JurisdictionCapabilities> {
  const j = await resolveJurisdiction(supabase, code)
  return j.capabilities
}
