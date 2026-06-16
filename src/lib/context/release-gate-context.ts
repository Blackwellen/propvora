import type { SupabaseClient } from "@supabase/supabase-js"
import { safeRow, normaliseCountry } from "./_safe"
import { isHardBlockedCode } from "./sanctions-context"
import type { ReleaseGateContext, ReleaseState } from "./intl-types"

/**
 * ============================================================================
 * RELEASE-GATE context resolver.
 * ============================================================================
 * A country pack can only be ENABLED once every required review is recorded as
 * 'approved' AND it is not sanctioned. This resolver computes release-readiness
 * in code, mirroring the DB `country_release_ready()` function + the BEFORE
 * UPDATE trigger that physically refuses an illegal enable.
 *
 * GB defaults to enabled/ready (the reviewed baseline). Any country with no
 * gate row defaults to LOCKED (cannot be enabled) — the safe posture.
 * ============================================================================
 */

const DEFAULT_REQUIRED = ["legal", "tax", "privacy", "sanctions", "commercial"]

const VALID_STATES: ReleaseState[] = ["locked", "in_review", "staged", "enabled", "suspended"]

function toState(v: unknown): ReleaseState {
  const s = String(v ?? "").toLowerCase().trim()
  return (VALID_STATES as string[]).includes(s) ? (s as ReleaseState) : "locked"
}

function toStringArray(v: unknown, fallback: string[]): string[] {
  if (Array.isArray(v)) {
    const out = v.filter((x): x is string => typeof x === "string")
    return out.length ? out : fallback
  }
  return fallback
}

function gbDefault(): ReleaseGateContext {
  return {
    countryCode: "GB",
    state: "enabled",
    requiredReviews: DEFAULT_REQUIRED,
    approvedReviews: DEFAULT_REQUIRED,
    releaseReady: true,
    isEnabled: true,
    blockedReason: null,
  }
}

function lockedDefault(code: string): ReleaseGateContext {
  return {
    countryCode: code,
    state: code === "GB" ? "enabled" : "locked",
    requiredReviews: DEFAULT_REQUIRED,
    approvedReviews: code === "GB" ? DEFAULT_REQUIRED : [],
    releaseReady: code === "GB",
    isEnabled: code === "GB",
    blockedReason:
      code === "GB" ? null : "Country pack is locked: required reviews are not yet approved.",
  }
}

/**
 * Resolve the release-gate posture for a country. Reads the gate row + the
 * approved reviews, and computes release-readiness identically to the DB.
 */
export async function resolveReleaseGateContext(
  supabase: SupabaseClient,
  rawCode: string
): Promise<ReleaseGateContext> {
  const code = normaliseCountry(rawCode) ?? (rawCode ?? "").toUpperCase()
  if (code === "GB") {
    // Still attempt a live read so an admin who changed GB sees it, but default
    // to the enabled baseline if the table is absent.
    const gbRow = await safeRow<Record<string, unknown>>(() =>
      supabase.from("country_release_gates").select("*").eq("country_code", "GB").maybeSingle()
    )
    if (!gbRow) return gbDefault()
  }

  const gate = await safeRow<Record<string, unknown>>(() =>
    supabase.from("country_release_gates").select("*").eq("country_code", code).maybeSingle()
  )
  if (!gate) return lockedDefault(code)

  const requiredReviews = toStringArray(gate.required_reviews, DEFAULT_REQUIRED)
  const state = toState(gate.state)

  // Approved reviews on record.
  let approvedReviews: string[] = []
  const reviews = await safeRow<{ rows: Array<{ domain: string }> }>(async () => {
    const res = await supabase
      .from("country_pack_reviews")
      .select("domain, verdict")
      .eq("country_code", code)
      .eq("verdict", "approved")
    return { data: { rows: (res.data as Array<{ domain: string }>) ?? [] }, error: res.error }
  })
  if (reviews?.rows) approvedReviews = reviews.rows.map((r) => r.domain)

  const allApproved = requiredReviews.every((d) => approvedReviews.includes(d))
  const sanctioned = isHardBlockedCode(code)
  const releaseReady = allApproved && !sanctioned
  const isEnabled = state === "enabled"

  let blockedReason: string | null = null
  if (sanctioned) {
    blockedReason = "Country is sanctioned and can never be released."
  } else if (!allApproved) {
    const missing = requiredReviews.filter((d) => !approvedReviews.includes(d))
    blockedReason = `Required reviews not yet approved: ${missing.join(", ")}.`
  } else if (state === "suspended") {
    blockedReason = "Country pack is suspended."
  }

  return {
    countryCode: code,
    state,
    requiredReviews,
    approvedReviews,
    releaseReady,
    isEnabled,
    blockedReason,
  }
}
