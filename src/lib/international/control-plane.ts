import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * ============================================================================
 * INTERNATIONAL CONTROL PLANE — admin read helpers (service-role).
 * ============================================================================
 * Cross-country reads for the admin global console. Service-role is legitimate:
 * platform admins manage every country pack. Callers MUST be gated by the
 * (admin) layout / requireAdmin() first. Every read is 42P01/PGRST205-safe and
 * resolves to an empty list rather than throwing, so the console renders honest
 * empty states when the intl migration is not present.
 * ============================================================================
 */

function isSchemaGap(code?: string) {
  return code === "42P01" || code === "42703" || code === "PGRST205" || code === "PGRST204"
}

export interface CountryProfileRow {
  country_code: string
  display_name: string
  offer_status: string
  default_currency: string
  default_locale: string
  legal_status: string
  tax_status: string
  privacy_status: string
  consumer_status: string
  property_features_status: string
  requires_local_review: boolean
  address_model_id: string | null
}

export interface ReleaseGateRow {
  country_code: string
  state: string
  required_reviews: string[]
  enabled_at: string | null
}

export interface ReviewRow {
  country_code: string
  domain: string
  verdict: string
  reviewer_name: string | null
  reviewed_at: string | null
  notes: string | null
}

export interface SanctionsRow {
  country_code: string
  classification: string
  block_onboarding: boolean
  block_billing: boolean
  block_payout: boolean
  programmes: string[]
}

/** Full country-profile list for the admin grid. */
export async function listCountryProfiles(): Promise<CountryProfileRow[]> {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from("country_profiles")
      .select(
        "country_code, display_name, offer_status, default_currency, default_locale, legal_status, tax_status, privacy_status, consumer_status, property_features_status, requires_local_review, address_model_id"
      )
      .order("display_name", { ascending: true })
    if (error) {
      if (isSchemaGap(error.code)) return []
      return []
    }
    return (data as CountryProfileRow[]) ?? []
  } catch {
    return []
  }
}

export async function listReleaseGates(): Promise<ReleaseGateRow[]> {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from("country_release_gates")
      .select("country_code, state, required_reviews, enabled_at")
    if (error) return []
    return (data as ReleaseGateRow[]) ?? []
  } catch {
    return []
  }
}

export async function listReviews(countryCode?: string): Promise<ReviewRow[]> {
  const supabase = createAdminClient()
  try {
    let q = supabase
      .from("country_pack_reviews")
      .select("country_code, domain, verdict, reviewer_name, reviewed_at, notes")
    if (countryCode) q = q.eq("country_code", countryCode.toUpperCase())
    const { data, error } = await q
    if (error) return []
    return (data as ReviewRow[]) ?? []
  } catch {
    return []
  }
}

export async function listSanctionsRules(): Promise<SanctionsRow[]> {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from("sanctions_country_rules")
      .select("country_code, classification, block_onboarding, block_billing, block_payout, programmes")
      .order("country_code", { ascending: true })
    if (error) return []
    return (data as SanctionsRow[]) ?? []
  } catch {
    return []
  }
}

export interface SubprocessorRow {
  id: string
  name: string
  purpose: string | null
  country_code: string | null
  transfer_mechanism: string | null
  status: string
}

export async function listSubprocessors(): Promise<SubprocessorRow[]> {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from("subprocessor_register")
      .select("id, name, purpose, country_code, transfer_mechanism, status")
      .order("name", { ascending: true })
    if (error) return []
    return (data as SubprocessorRow[]) ?? []
  } catch {
    return []
  }
}

export interface TranslationNamespaceRow {
  id: string
  description: string | null
}

export async function listTranslationNamespaces(): Promise<TranslationNamespaceRow[]> {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from("intl_translation_namespaces")
      .select("id, description")
      .order("id", { ascending: true })
    if (error) return []
    return (data as TranslationNamespaceRow[]) ?? []
  } catch {
    return []
  }
}

/**
 * Compose the release readiness for a country: required vs approved reviews.
 * Mirrors the DB `country_release_ready()` exactly so the admin UI shows the
 * same verdict the enforcement trigger will apply.
 */
export interface CountryReleaseSummary {
  countryCode: string
  displayName: string
  state: string
  requiredReviews: string[]
  approvedReviews: string[]
  releaseReady: boolean
  isSanctioned: boolean
  blockedReason: string | null
}

const HARD_BLOCKED = [
  "CU","IR","KP","SY","RU","BY","VE","NI","SD","SS","SO","YE","AF","MM",
]

export async function getReleaseSummaries(): Promise<CountryReleaseSummary[]> {
  const [profiles, gates, reviews] = await Promise.all([
    listCountryProfiles(),
    listReleaseGates(),
    listReviews(),
  ])
  const gateByCode = new Map(gates.map((g) => [g.country_code, g]))
  const approvedByCode = new Map<string, string[]>()
  for (const r of reviews) {
    if (r.verdict !== "approved") continue
    const arr = approvedByCode.get(r.country_code) ?? []
    arr.push(r.domain)
    approvedByCode.set(r.country_code, arr)
  }

  return profiles.map((p) => {
    const gate = gateByCode.get(p.country_code)
    const required = gate?.required_reviews ?? ["legal", "tax", "privacy", "sanctions", "commercial"]
    const approved = approvedByCode.get(p.country_code) ?? []
    const isSanctioned = HARD_BLOCKED.includes(p.country_code)
    const allApproved = required.every((d) => approved.includes(d))
    const releaseReady = allApproved && !isSanctioned
    let blockedReason: string | null = null
    if (isSanctioned) blockedReason = "Sanctioned — can never be released."
    else if (!allApproved)
      blockedReason = `Missing approvals: ${required.filter((d) => !approved.includes(d)).join(", ")}.`
    return {
      countryCode: p.country_code,
      displayName: p.display_name,
      state: gate?.state ?? (p.country_code === "GB" ? "enabled" : "locked"),
      requiredReviews: required,
      approvedReviews: approved,
      releaseReady,
      isSanctioned,
      blockedReason,
    }
  })
}
