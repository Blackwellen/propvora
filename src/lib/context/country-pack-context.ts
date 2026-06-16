import type { SupabaseClient } from "@supabase/supabase-js"
import { safeRow, normaliseCountry, toPackStatus, packAtLeast } from "./_safe"
import { getCountryProfile } from "@/lib/i18n/country-profiles"
import type { OfferStatus, PackStatus } from "./context-types"
import type {
  CountryGates,
  IntlCountryContext,
} from "./intl-types"
import { resolveSanctionsContext, isHardBlockedCode } from "./sanctions-context"
import { resolveReleaseGateContext } from "./release-gate-context"
import { resolveTaxContext } from "./tax-context"
import { resolvePrivacyContext } from "./privacy-context"
import { resolveLocaleContext } from "./locale-context"

/**
 * ============================================================================
 * COUNTRY-PACK context — the full intl bundle + the derived GATES block.
 * ============================================================================
 * `resolveCountryPackContext` composes locale/tax/privacy/sanctions/release-gate
 * for a country and derives the single GATES block every surface obeys:
 *
 *   canOfferSaas / canBill / canTakePayouts / canUsePropertyPack /
 *   canShowLegalPack / canShowCompliancePack / canShowTaxPack /
 *   requiresManualReview / blockedReason
 *
 * SAFETY:
 *   - GB resolves to the fully-enabled reviewed baseline (byte-identical).
 *   - Everything else is generic/research-only by default — never legal/tax
 *     claims for an unreviewed country, never UK property law for a non-GB one.
 *   - Sanctioned countries are hard-blocked from every gate.
 *   - No dependency on `@/lib/flags`. Country-pack status + the admin release
 *     gate + sanctions are the only switches.
 * ============================================================================
 */

function toOfferStatus(v: unknown, fallback: OfferStatus): OfferStatus {
  const s = String(v ?? "").toLowerCase().trim()
  if (s === "offer" || s === "restricted" || s === "banned" || s === "unknown") {
    return s as OfferStatus
  }
  return fallback
}

interface ProfileRow {
  display_name?: string
  offer_status?: string
  stripe_billing_supported?: boolean
  connect_payout_supported?: boolean
  offer_pack_status?: string
  property_features_status?: string
  legal_status?: string
  tax_status?: string
  privacy_status?: string
  consumer_status?: string
  legal_disclaimer?: string
  requires_local_review?: boolean
}

/**
 * Derive the gates from the resolved blocks. Pure function — easy to reason
 * about and to test. This is the heart of the architecture.
 */
export function deriveGates(input: {
  code: string
  offerStatus: OfferStatus
  releaseEnabled: boolean
  legalStatus: PackStatus
  taxStatus: PackStatus
  privacyStatus: PackStatus
  propertyStatus: PackStatus
  stripeBilling: boolean
  connectPayout: boolean
  sanctions: { isHardBlocked: boolean; blockOnboarding: boolean; blockBilling: boolean; blockPayout: boolean; requiresManualReview: boolean; classification: string; blockedReason: string | null }
}): CountryGates {
  const {
    code,
    offerStatus,
    releaseEnabled,
    legalStatus,
    taxStatus,
    privacyStatus,
    propertyStatus,
    stripeBilling,
    connectPayout,
    sanctions,
  } = input

  const isGB = code === "GB"
  const hardBlocked = sanctions.isHardBlocked || isHardBlockedCode(code)

  // Blocked reason precedence: sanctions → offer status → release gate.
  let blockedReason: string | null = null
  if (hardBlocked) {
    blockedReason = sanctions.blockedReason ?? "This country is sanctioned and unavailable."
  } else if (offerStatus === "banned") {
    blockedReason = "This country is not available."
  } else if (offerStatus === "restricted") {
    blockedReason = "This country requires manual review before it can be enabled."
  }

  // canOfferSaas: GB always; else must be 'offer', not sanctioned, onboarding
  // not blocked. The admin release gate being enabled is preferred but we do not
  // require it for the research candidate set (they are sellable as generic).
  const canOfferSaas = isGB
    ? true
    : offerStatus === "offer" && !hardBlocked && !sanctions.blockOnboarding

  const canBill = isGB
    ? true
    : canOfferSaas && stripeBilling && !sanctions.blockBilling && !hardBlocked

  const canTakePayouts = isGB
    ? true
    : canOfferSaas && connectPayout && !sanctions.blockPayout && !hardBlocked

  // Property pack runs at >= research_only (generic records, never UK rules).
  const canUsePropertyPack = isGB
    ? true
    : !hardBlocked && packAtLeast(propertyStatus, "research_only")

  // Jurisdiction-specific legal/compliance/tax packs ONLY when reviewed.
  const canShowLegalPack = isGB ? true : !hardBlocked && packAtLeast(legalStatus, "reviewed")
  const canShowCompliancePack = canShowLegalPack
  const canShowTaxPack = isGB ? true : !hardBlocked && packAtLeast(taxStatus, "reviewed")

  const requiresManualReview =
    !isGB && (sanctions.requiresManualReview || offerStatus === "restricted")

  return {
    countryCode: code,
    canOfferSaas,
    canBill,
    canTakePayouts,
    canUsePropertyPack,
    canShowLegalPack,
    canShowCompliancePack,
    canShowTaxPack,
    requiresManualReview,
    blockedReason,
  }
}

export async function resolveCountryPackContext(
  supabase: SupabaseClient,
  rawCode: string
): Promise<IntlCountryContext> {
  const code = normaliseCountry(rawCode) ?? (rawCode ?? "GB").toUpperCase()
  const profile = getCountryProfile(code)

  // Resolve sub-blocks in parallel; each is independently fault-tolerant.
  const [row, sanctions, releaseGate, tax, privacy, locale] = await Promise.all([
    safeRow<ProfileRow>(() =>
      supabase.from("country_profiles").select("*").eq("country_code", code).maybeSingle()
    ),
    resolveSanctionsContext(supabase, code),
    resolveReleaseGateContext(supabase, code),
    resolveTaxContext(supabase, code),
    resolvePrivacyContext(supabase, code),
    resolveLocaleContext(supabase, code),
  ])

  const isGB = code === "GB"
  const isFallback = !row

  const offerStatus: OfferStatus = isGB
    ? "offer"
    : toOfferStatus(row?.offer_status, profile?.offerStatus ?? "unknown")

  const legalStatus = isGB
    ? "reviewed"
    : toPackStatus(row?.legal_status, profile?.legalPackStatus ?? "research_only")
  const taxStatus = isGB ? "reviewed" : tax.status
  const privacyStatus = isGB ? "reviewed" : privacy.status
  const propertyStatus = isGB
    ? "enabled"
    : toPackStatus(row?.property_features_status, profile?.propertyFeaturesStatus ?? "research_only")

  const stripeBilling = isGB ? true : Boolean(row?.stripe_billing_supported ?? profile?.stripeBillingSupported)
  const connectPayout = isGB ? true : Boolean(row?.connect_payout_supported ?? profile?.connectPayoutSupported)

  const gates = deriveGates({
    code,
    offerStatus,
    releaseEnabled: releaseGate.isEnabled,
    legalStatus,
    taxStatus,
    privacyStatus,
    propertyStatus,
    stripeBilling,
    connectPayout,
    sanctions,
  })

  // Disclaimers — pull the profile/legal disclaimer; sanctioned/blocked add a hard line.
  const disclaimers: string[] = []
  const profileDisclaimer = (row?.legal_disclaimer ?? profile?.legalDisclaimer ?? "").trim()
  if (profileDisclaimer) disclaimers.push(profileDisclaimer)
  if (gates.blockedReason && !isGB) disclaimers.push(gates.blockedReason)
  if (!isGB && !gates.canShowLegalPack && !sanctions.isHardBlocked) {
    disclaimers.push(
      "Legal, tax and compliance content for this country is GENERAL INFORMATION ONLY and is not reviewed for local law. Consult a qualified local professional before acting."
    )
  }

  return {
    countryCode: code,
    displayName: row?.display_name ?? profile?.displayName ?? code,
    offerStatus,
    locale,
    tax,
    privacy,
    sanctions,
    releaseGate,
    gates,
    disclaimers: Array.from(new Set(disclaimers)),
    isFallback,
  }
}
