/**
 * ============================================================================
 * Propvora INTERNATIONALISATION — context block types.
 * ============================================================================
 * The internationalisation context blocks layered on top of the core Context
 * Engine (context-types.ts). These describe the COUNTRY-PACK posture of a
 * situation and the derived GATES that every surface (signup, billing, payout,
 * legal pack, compliance pack, AI) must obey.
 *
 * DESIGN RULE — DEGRADE, NEVER THROW + GB IS BYTE-IDENTICAL.
 * Every resolver tolerates a missing intl table/column (42P01/42703) and falls
 * back to a posture that:
 *   - keeps GB fully enabled (the reviewed V1 baseline), and
 *   - keeps every other country generic/research-only (never legal/tax claims),
 *   - hard-blocks the sanctioned set.
 * Nothing here imports `@/lib/flags`. Country-pack status + the admin release
 * gate are the ONLY switches.
 * ============================================================================
 */

import type { OfferStatus, PackStatus } from "./context-types"

/** Release-gate lifecycle (mirrors intl_release_state in the DB). */
export type ReleaseState = "locked" | "in_review" | "staged" | "enabled" | "suspended"

/** Sanctions classification (mirrors sanctions_country_rules.classification). */
export type SanctionsClassification = "allowed" | "restricted" | "comprehensive_block"

/** Tax scheme family (mirrors intl_tax_scheme). */
export type TaxScheme = "vat" | "vat_oss" | "gst" | "sales_tax" | "consumption_tax" | "none"

// ── Sanctions block ─────────────────────────────────────────────────────────

export interface SanctionsContext {
  countryCode: string
  classification: SanctionsClassification
  blockOnboarding: boolean
  blockBilling: boolean
  blockPayout: boolean
  requiresManualReview: boolean
  programmes: string[]
  /** True when comprehensively embargoed (hard block everywhere). */
  isHardBlocked: boolean
  /** Human reason shown when blocked, else null. */
  blockedReason: string | null
}

// ── Release-gate block ──────────────────────────────────────────────────────

export interface ReleaseGateContext {
  countryCode: string
  state: ReleaseState
  /** Domains that must be 'approved' before the country can be enabled. */
  requiredReviews: string[]
  /** Domains with an 'approved' review on record. */
  approvedReviews: string[]
  /** True only when every required review is approved AND not sanctioned. */
  releaseReady: boolean
  /** True when the gate is live (state === 'enabled'). */
  isEnabled: boolean
  /** Why the country isn't enabled, if it isn't. */
  blockedReason: string | null
}

// ── Tax block ───────────────────────────────────────────────────────────────

export interface TaxContext {
  countryCode: string
  scheme: TaxScheme
  taxName: string
  standardRate: number | null
  taxIdLabel: string | null
  b2bReverseCharge: boolean
  status: PackStatus
  /** True only when the tax pack is reviewed/enabled — gates tax-specific UI. */
  reviewed: boolean
}

// ── Privacy block ───────────────────────────────────────────────────────────

export interface PrivacyContext {
  countryCode: string
  regime: string
  dsarResponseDays: number | null
  breachNotifyHours: number | null
  consentModel: "opt_in" | "opt_out" | "mixed"
  representativeRequired: boolean
  dpoRequired: boolean
  transferMechanism: string
  status: PackStatus
  reviewed: boolean
}

// ── Locale block ────────────────────────────────────────────────────────────

export interface LocaleContext {
  countryCode: string
  locale: string
  currency: string
  supportedLocales: string[]
  measurementSystem: "metric" | "imperial"
  areaUnit: "sqm" | "sqft"
  dateFormat: string
  phoneCountryCode: string | null
  addressModelId: string
}

// ── The derived GATES block ─────────────────────────────────────────────────
/**
 * The single source of truth every surface reads to decide what it may do for a
 * country. Pure function of country-pack status + release gate + sanctions.
 */
export interface CountryGates {
  countryCode: string
  /** Self-serve SaaS onboarding allowed (offer + not sanctioned + not blocked). */
  canOfferSaas: boolean
  /** Stripe billing may run for this country. */
  canBill: boolean
  /** Connect payouts may run for this country. */
  canTakePayouts: boolean
  /** Property/tenancy/compliance pack features may run (>= research_only). */
  canUsePropertyPack: boolean
  /** Jurisdiction-specific LEGAL pack may be shown (>= reviewed). */
  canShowLegalPack: boolean
  /** Jurisdiction-specific COMPLIANCE pack may be shown (>= reviewed). */
  canShowCompliancePack: boolean
  /** Tax pack may be shown with jurisdiction depth (>= reviewed). */
  canShowTaxPack: boolean
  /** Manual human review required before this country can transact. */
  requiresManualReview: boolean
  /** Populated when the country is blocked/restricted; null when clear. */
  blockedReason: string | null
}

/** The full intl context bundle for a country in scope. */
export interface IntlCountryContext {
  countryCode: string
  displayName: string
  offerStatus: OfferStatus
  locale: LocaleContext
  tax: TaxContext
  privacy: PrivacyContext
  sanctions: SanctionsContext
  releaseGate: ReleaseGateContext
  gates: CountryGates
  /** Disclaimer strings the surface must render. */
  disclaimers: string[]
  /** True when no live profile row backed this (safe defaults used). */
  isFallback: boolean
}
