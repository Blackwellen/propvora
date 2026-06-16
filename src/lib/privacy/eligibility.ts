import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveSanctionsContext, isHardBlockedCode } from "@/lib/context/sanctions-context"
import { resolveCountryPackContext } from "@/lib/context/country-pack-context"

/**
 * ============================================================================
 * ELIGIBILITY GATE — signup / billing / payout.
 * ============================================================================
 * A single server-side gate the signup, billing and payout seams call to decide
 * whether a country may proceed. Combines the sanctions backstop (code + DB)
 * with the resolved country-pack gates. Fails CLOSED for the hard-blocked set
 * regardless of DB state.
 * ============================================================================
 */

export type EligibilityAction = "onboard" | "bill" | "payout"

export interface EligibilityVerdict {
  allowed: boolean
  countryCode: string
  action: EligibilityAction
  reason: string | null
  requiresManualReview: boolean
}

export async function checkEligibility(
  supabase: SupabaseClient,
  countryCode: string,
  action: EligibilityAction
): Promise<EligibilityVerdict> {
  const code = (countryCode ?? "").toUpperCase().trim()

  // Code backstop first — non-negotiable.
  if (isHardBlockedCode(code)) {
    return {
      allowed: false,
      countryCode: code,
      action,
      reason: "This country is comprehensively sanctioned and cannot transact.",
      requiresManualReview: false,
    }
  }
  if (code.length !== 2) {
    return {
      allowed: false,
      countryCode: code,
      action,
      reason: "A valid country must be selected.",
      requiresManualReview: false,
    }
  }

  const [sanctions, intl] = await Promise.all([
    resolveSanctionsContext(supabase, code),
    resolveCountryPackContext(supabase, code),
  ])

  const g = intl.gates

  if (action === "onboard") {
    if (sanctions.blockOnboarding || !g.canOfferSaas) {
      return {
        allowed: false,
        countryCode: code,
        action,
        reason: g.blockedReason ?? sanctions.blockedReason ?? "Onboarding is not available for this country.",
        requiresManualReview: g.requiresManualReview,
      }
    }
  }
  if (action === "bill") {
    if (sanctions.blockBilling || !g.canBill) {
      return {
        allowed: false,
        countryCode: code,
        action,
        reason: g.blockedReason ?? sanctions.blockedReason ?? "Billing is not available for this country.",
        requiresManualReview: g.requiresManualReview,
      }
    }
  }
  if (action === "payout") {
    if (sanctions.blockPayout || !g.canTakePayouts) {
      return {
        allowed: false,
        countryCode: code,
        action,
        reason: g.blockedReason ?? sanctions.blockedReason ?? "Payouts are not available for this country.",
        requiresManualReview: g.requiresManualReview,
      }
    }
  }

  return {
    allowed: true,
    countryCode: code,
    action,
    reason: null,
    requiresManualReview: g.requiresManualReview,
  }
}
