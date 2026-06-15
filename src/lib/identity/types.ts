/**
 * P6 — Identity / KYC shared types.
 *
 * These DTOs mirror the `20260616110000_identity_kyc.sql` schema. The identity
 * layer LAYERS ON TOP OF Stripe Connect (which already proves seller identity
 * for payouts) — it records an additional / standalone KYC trail and a
 * sanctions SCREENING SIGNAL. A status here reflects ONLY what the provider
 * (Stripe Identity) or an admin recorded; nothing auto-approves KYC.
 */

/** Subject a verification belongs to. */
export type VerificationSubjectType = "workspace" | "user"

/** What is being verified. */
export type VerificationKind = "individual" | "business" | "document"

/**
 * Lifecycle of an identity verification. Mirrors the Stripe Identity
 * VerificationSession status, plus our local pre-provider states:
 *  - not_started: row exists, no session created
 *  - pending:     session created, awaiting the subject to submit
 *  - processing:  Stripe is running checks
 *  - verified:    provider/admin recorded a successful result
 *  - requires_input: provider needs the subject to retry/supply more
 *  - rejected:    failed / declined
 *  - cancelled:   abandoned / cancelled
 */
export type VerificationStatus =
  | "not_started"
  | "pending"
  | "processing"
  | "verified"
  | "requires_input"
  | "rejected"
  | "cancelled"

/** Type of an individual check recorded against a verification. */
export type VerificationCheckType =
  | "document"
  | "selfie"
  | "address"
  | "business"
  | "sanctions"
  | "pep"

/** Result of an individual check. Defaults to manual_review — never auto-pass. */
export type VerificationCheckResult = "pass" | "fail" | "manual_review" | "unavailable"

/** Document categories we accept for upload. */
export type VerificationDocType =
  | "passport"
  | "driving_licence"
  | "national_id"
  | "proof_of_address"
  | "business_registration"
  | "other"

/** Status of an uploaded document. */
export type VerificationDocStatus = "uploaded" | "accepted" | "rejected"

/** Provider that produced (or will produce) the result. */
export type VerificationProvider = "stripe_identity" | string

// ── Row DTOs ────────────────────────────────────────────────────────────────

export interface IdentityVerification {
  id: string
  subject_type: VerificationSubjectType
  subject_id: string
  workspace_id: string | null
  kind: VerificationKind
  provider: VerificationProvider
  provider_ref: string | null
  status: VerificationStatus
  risk_level: string | null
  verified_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface VerificationDocument {
  id: string
  verification_id: string
  doc_type: VerificationDocType
  r2_key: string | null
  status: VerificationDocStatus
  notes: string | null
  created_at: string
}

export interface VerificationCheck {
  id: string
  verification_id: string
  check_type: VerificationCheckType
  result: VerificationCheckResult
  detail: Record<string, unknown>
  created_at: string
}

export interface SanctionsScreening {
  id: string
  workspace_id: string | null
  subject_name: string
  country_code: string | null
  matched: boolean
  match_detail: Record<string, unknown>
  screened_at: string
  screened_by: string | null
}

// ── Args / result shapes ─────────────────────────────────────────────────────

/** Identify the subject of a verification lookup/start. */
export interface VerificationSubject {
  subjectType: VerificationSubjectType
  subjectId: string
}

export interface StartVerificationArgs extends VerificationSubject {
  workspaceId?: string | null
  kind?: VerificationKind
  provider?: VerificationProvider
  createdBy?: string | null
}

/**
 * Pure params for a Stripe Identity VerificationSession. We BUILD these; we do
 * NOT call Stripe here (the live key must never be exercised from this layer).
 * Shape matches Stripe's `identity.verificationSessions.create` input subset.
 */
export interface VerificationSessionParams {
  type: "document" | "id_number"
  metadata: Record<string, string>
  options?: {
    document?: {
      require_matching_selfie?: boolean
      require_live_capture?: boolean
      allowed_types?: Array<"driving_license" | "passport" | "id_card">
    }
  }
  provided_details?: { email?: string }
}

/** Result of the selling gate. */
export interface SellingGateResult {
  allowed: boolean
  reason: string
}

/** Result of a sanctions screening run (a SIGNAL, not a determination). */
export interface ScreeningResult {
  matched: boolean
  detail: Record<string, unknown>
}

/** A minimal country_packs row used by the sanctions screener. */
export interface CountryPack {
  code: string
  name?: string | null
  offer_status?: string | null
  legal_status?: string | null
}
