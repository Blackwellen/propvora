/**
 * Supplier ID Verification — shared types.
 *
 * Mirrors migration 20260617030000_supplier_verification.sql. This module is
 * SUPPLIER-specific and SEPARATE from the P6 identity/KYC module
 * (src/lib/identity/*, public.identity_verifications). It is the verification
 * layer the marketplace job flow gates on.
 *
 * COMPLIANCE HONESTY: a level/badge here reflects ONLY evidence an admin
 * reviewed or a provider (Stripe Connect / OCR pre-fill) recorded. NOTHING
 * auto-approves ID, insurance, or a licence. Document/policy/licence numbers are
 * stored and surfaced MASKED only. Wording NEVER claims "government verified" or
 * "fully vetted" — only "evidence reviewed" forms.
 */

// ── Levels ───────────────────────────────────────────────────────────────────

/** Tiered verification levels. Each is strictly additive over the prior one. */
export type SupplierVerificationLevel = 0 | 1 | 2 | 3 | 4 | 5

/** Lifecycle status of the canonical supplier verification record. */
export type SupplierVerificationStatus =
  | "unverified"
  | "in_progress"
  | "pending_review"
  | "verified"
  | "rejected"
  | "expired"
  | "suspended"

/** Status of a sub-check that requires manual review (never auto-passes). */
export type CheckStatus =
  | "not_started"
  | "manual_required"
  | "in_review"
  | "passed"
  | "failed"

/** Manual-review (admin) decision state on the canonical record. */
export type ManualReviewStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected"
  | "more_info"

// ── Documents ────────────────────────────────────────────────────────────────

export type SupplierDocType =
  | "passport"
  | "driving_licence"
  | "national_id"
  | "proof_of_address"
  | "other"

export type OcrStatus = "not_run" | "queued" | "prefilled" | "manual_required" | "failed"

export type EvidenceStatus = "uploaded" | "in_review" | "accepted" | "rejected"

export type InsuranceType =
  | "public_liability"
  | "employers_liability"
  | "professional_indemnity"
  | "contractors_all_risk"
  | "other"

export type InsuranceStatus = EvidenceStatus | "expired"
export type LicenceStatus = EvidenceStatus | "expired"

export type BusinessType =
  | "sole_trader"
  | "limited_company"
  | "partnership"
  | "llp"
  | "other"

// ── Gating ───────────────────────────────────────────────────────────────────

/** Marketplace job risk tier the gating layer enforces against. */
export type JobRiskTier = "low" | "medium" | "high"

/** A discrete requirement the gating layer checks. */
export type RequirementKey =
  | "email"
  | "phone"
  | "payout"
  | "id_evidence"
  | "insurance"
  | "licence"
  | "admin_approval"

/** Admin decision verbs (review.ts). */
export type AdminDecision =
  | "approve"
  | "reject"
  | "more_info"
  | "expired"
  | "suspicious"
  | "blocked"

// ── Row DTOs ─────────────────────────────────────────────────────────────────

export interface SupplierVerificationRow {
  id: string
  supplier_workspace_id: string
  user_id: string | null
  verification_level: number
  status: SupplierVerificationStatus
  provider: string
  stripe_account_id: string | null
  document_check_status: CheckStatus
  selfie_check_status: CheckStatus
  manual_review_status: ManualReviewStatus
  risk_flags: unknown[]
  created_at: string
  verified_at: string | null
  expires_at: string | null
  updated_at: string
}

export interface SupplierIdentityDocumentRow {
  id: string
  verification_id: string
  supplier_workspace_id: string
  doc_type: SupplierDocType
  document_country: string | null
  document_number_masked: string | null
  expiry_date: string | null
  name_on_document: string | null
  r2_key_front: string | null
  r2_key_back: string | null
  r2_key_selfie: string | null
  ocr_status: OcrStatus
  status: EvidenceStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplierInsurancePolicyRow {
  id: string
  verification_id: string
  supplier_workspace_id: string
  insurance_type: InsuranceType
  provider: string | null
  policy_number_masked: string | null
  coverage_amount_pence: number | null
  valid_from: string | null
  valid_to: string | null
  r2_key: string | null
  minimum_cover_met: boolean
  status: InsuranceStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplierLicenceRow {
  id: string
  verification_id: string
  supplier_workspace_id: string
  licence_type: string
  issuing_body: string | null
  licence_number_masked: string | null
  country: string | null
  region: string | null
  valid_from: string | null
  valid_to: string | null
  required_for_categories: string[]
  r2_key: string | null
  status: LicenceStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplierVerificationEventRow {
  id: string
  verification_id: string
  supplier_workspace_id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  actor_user_id: string | null
  actor_role: string | null
  detail: Record<string, unknown>
  created_at: string
}

export interface SupplierVerificationBadgeRow {
  id: string
  verification_id: string
  supplier_workspace_id: string
  badge_key: BadgeKey
  label: string
  active: boolean
  granted_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

// ── Derived shapes ───────────────────────────────────────────────────────────

/** Badge identifiers. Wording lives in levels.ts BADGE_LABELS (honest forms). */
export type BadgeKey = "email" | "phone" | "payout" | "id_evidence" | "insurance" | "licence"

export interface SupplierBadge {
  key: BadgeKey
  /** Honest, evidence-reviewed wording — never "government verified". */
  label: string
  active: boolean
}

/** Summary the supplier-facing centre + admin queue both consume. */
export interface SupplierVerificationStatusSummary {
  exists: boolean
  verificationId: string | null
  supplierWorkspaceId: string
  level: SupplierVerificationLevel
  /** Short honest label for the achieved level, e.g. "Payout verified". */
  levelLabel: string
  status: SupplierVerificationStatus
  badges: SupplierBadge[]
  documentCheckStatus: CheckStatus
  selfieCheckStatus: CheckStatus
  manualReviewStatus: ManualReviewStatus
  hasValidInsurance: boolean
  hasValidLicence: boolean
  insuranceExpiringSoon: boolean
  licenceExpiringSoon: boolean
  expiresAt: string | null
  updatedAt: string | null
}

/** Result of a single gating decision (gating.ts). */
export interface GatingDecision {
  allowed: boolean
  /** Requirement keys that are NOT yet satisfied. */
  missing: RequirementKey[]
  /** Human-readable, honest reason. */
  reason: string
  riskTier: JobRiskTier
  category: string | null
}
