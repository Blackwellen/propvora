import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import type {
  SupplierVerificationLevel,
  SupplierVerificationRow,
  SupplierBadge,
  BadgeKey,
  SupplierVerificationStatusSummary,
  SupplierInsurancePolicyRow,
  SupplierLicenceRow,
} from "./types"

/**
 * Tiered supplier verification levels + badge derivation.
 *
 * Level ladder (strictly additive):
 *   L0 unverified
 *   L1 email confirmed
 *   L2 phone confirmed
 *   L3 Stripe payout verified  (charges & payouts enabled on the Connect acct)
 *   L4 ID evidence reviewed    (documents + selfie reviewed by an admin — MANUAL)
 *   L5 insurance + licence evidence reviewed
 *
 * HONESTY: labels reflect EVIDENCE REVIEWED only. We NEVER say "government
 * verified", "fully vetted", "background checked", or imply a guarantee. The
 * approved wording set is below and is the single source of truth used by every
 * badge, the supplier centre, and the marketplace.
 */

const MISSING_RELATION = "42P01"
const UNDEFINED_COLUMN = "42703"
const PGRST_MISSING_RELATION = "PGRST205"
const PGRST_MISSING_COLUMN = "PGRST204"

export function isSchemaGap(code?: string): boolean {
  return (
    code === MISSING_RELATION ||
    code === UNDEFINED_COLUMN ||
    code === PGRST_MISSING_RELATION ||
    code === PGRST_MISSING_COLUMN
  )
}

/** Short, honest label per achieved level. */
export const LEVEL_LABELS: Record<SupplierVerificationLevel, string> = {
  0: "Unverified",
  1: "Email confirmed",
  2: "Phone confirmed",
  3: "Payout verified",
  4: "ID evidence reviewed",
  5: "Insurance & licence evidence reviewed",
}

/** One-line honest description per level (supplier-facing copy). */
export const LEVEL_DESCRIPTIONS: Record<SupplierVerificationLevel, string> = {
  0: "No verification steps completed yet.",
  1: "Email address confirmed.",
  2: "Phone number confirmed.",
  3: "Payout details verified through Stripe — this supplier can be paid out.",
  4: "Identity evidence (documents and a selfie) has been reviewed by our team.",
  5: "Insurance and trade-licence evidence has been reviewed by our team.",
}

/**
 * Honest badge wording. NEVER "government verified" / "fully vetted" — these are
 * evidence-reviewed statements only.
 */
export const BADGE_LABELS: Record<BadgeKey, string> = {
  email: "Email confirmed",
  phone: "Phone confirmed",
  payout: "Payout verified",
  id_evidence: "ID evidence reviewed",
  insurance: "Insurance evidence reviewed",
  licence: "Licence evidence reviewed",
}

/** Map a badge key to the minimum level at which it is granted. */
const BADGE_MIN_LEVEL: Record<BadgeKey, SupplierVerificationLevel> = {
  email: 1,
  phone: 2,
  payout: 3,
  id_evidence: 4,
  insurance: 5,
  licence: 5,
}

const DAYS_30 = 30 * 24 * 60 * 60 * 1000

function isAcceptedAndCurrent(
  row: { status: string; valid_to: string | null }
): boolean {
  if (row.status !== "accepted") return false
  if (!row.valid_to) return true // open-ended evidence still counts once accepted
  return new Date(row.valid_to).getTime() >= Date.now()
}

function expiringSoon(validTo: string | null): boolean {
  if (!validTo) return false
  const t = new Date(validTo).getTime()
  return t >= Date.now() && t - Date.now() <= DAYS_30
}

/**
 * Derive the achieved level PURELY from the canonical row + accepted insurance/
 * licence evidence. This is the authoritative computation — it does NOT trust a
 * possibly-stale `verification_level` column; instead it recomputes from facts.
 *
 *  - L1: email_confirmed flag (recorded as an event / requirement) → represented
 *        here by document_check_status not being the gate; email/phone are tracked
 *        via the requirements/badges tables, but for the canonical record we treat
 *        the persisted `verification_level` as the floor for L1/L2 (set by the
 *        submit flow) and only ELEVATE to L3+ when the harder evidence exists.
 */
export function deriveLevel(
  row: Pick<
    SupplierVerificationRow,
    "verification_level" | "stripe_account_id" | "document_check_status" | "selfie_check_status" | "manual_review_status"
  >,
  opts: { payoutVerified: boolean; hasAcceptedInsurance: boolean; hasAcceptedLicence: boolean }
): SupplierVerificationLevel {
  // L1/L2 are driven by the email/phone steps, persisted as the record's floor.
  let level: SupplierVerificationLevel = clampLevel(row.verification_level)
  if (level > 2) level = 2 // never trust >L2 from the column; recompute below.

  // L3 requires a payout-verified Connect account.
  if (level >= 2 && opts.payoutVerified) level = 3

  // L4 requires BOTH document and selfie checks to have PASSED via manual review,
  // and the manual review to be approved. Never auto-approve.
  const idReviewed =
    row.document_check_status === "passed" &&
    row.selfie_check_status === "passed" &&
    row.manual_review_status === "approved"
  if (level >= 3 && idReviewed) level = 4

  // L5 requires accepted insurance AND accepted licence evidence on top of L4.
  if (level >= 4 && opts.hasAcceptedInsurance && opts.hasAcceptedLicence) level = 5

  return level
}

function clampLevel(n: number): SupplierVerificationLevel {
  const v = Math.max(0, Math.min(5, Math.trunc(n || 0)))
  return v as SupplierVerificationLevel
}

/** Derive the active badge set from an achieved level + evidence currency. */
export function deriveBadges(
  level: SupplierVerificationLevel,
  opts: { hasCurrentInsurance: boolean; hasCurrentLicence: boolean }
): SupplierBadge[] {
  const out: SupplierBadge[] = []
  for (const key of Object.keys(BADGE_MIN_LEVEL) as BadgeKey[]) {
    const minLevel = BADGE_MIN_LEVEL[key]
    let active = level >= minLevel
    // Insurance / licence badges additionally require CURRENT (non-expired) evidence.
    if (key === "insurance") active = active && opts.hasCurrentInsurance
    if (key === "licence") active = active && opts.hasCurrentLicence
    out.push({ key, label: BADGE_LABELS[key], active })
  }
  return out
}

interface LoadedVerification {
  row: SupplierVerificationRow | null
  insurance: SupplierInsurancePolicyRow[]
  licences: SupplierLicenceRow[]
  available: boolean
}

/** Load the canonical record + evidence for a supplier workspace (service-role). */
export async function loadVerification(
  supplierWorkspaceId: string
): Promise<LoadedVerification> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { row: null, insurance: [], licences: [], available: false }
  }

  const { data: row, error } = await admin
    .from("supplier_identity_verifications")
    .select("*")
    .eq("supplier_workspace_id", supplierWorkspaceId)
    .maybeSingle()

  if (error) {
    if (isSchemaGap(error.code)) return { row: null, insurance: [], licences: [], available: false }
    return { row: null, insurance: [], licences: [], available: true }
  }
  if (!row) return { row: null, insurance: [], licences: [], available: true }

  const [ins, lic] = await Promise.all([
    admin.from("supplier_insurance_policies").select("*").eq("verification_id", row.id),
    admin.from("supplier_licence_verifications").select("*").eq("verification_id", row.id),
  ])

  return {
    row: row as SupplierVerificationRow,
    insurance: (ins.data ?? []) as SupplierInsurancePolicyRow[],
    licences: (lic.data ?? []) as SupplierLicenceRow[],
    available: true,
  }
}

/** Whether the Connect account for a workspace is payout-verified (L3 gate). */
export async function isPayoutVerified(supplierWorkspaceId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("stripe_connect_accounts")
      .select("charges_enabled, payouts_enabled")
      .eq("workspace_id", supplierWorkspaceId)
      .maybeSingle()
    if (error || !data) return false
    return Boolean(data.charges_enabled) && Boolean(data.payouts_enabled)
  } catch {
    return false
  }
}

/**
 * Authoritative achieved level for a supplier workspace. Returns 0 when no
 * record exists or the subsystem is not provisioned.
 */
export async function currentLevel(
  supplierWorkspaceId: string
): Promise<SupplierVerificationLevel> {
  const { row, insurance, licences } = await loadVerification(supplierWorkspaceId)
  if (!row) return 0
  const payoutVerified = await isPayoutVerified(supplierWorkspaceId)
  const hasAcceptedInsurance = insurance.some(isAcceptedAndCurrent)
  const hasAcceptedLicence = licences.some(isAcceptedAndCurrent)
  return deriveLevel(row, { payoutVerified, hasAcceptedInsurance, hasAcceptedLicence })
}

/**
 * Ensure a canonical verification record exists for a supplier workspace,
 * creating it at L0 if absent. Returns the row id, or null on failure.
 * Idempotent (unique index on supplier_workspace_id).
 */
export async function ensureVerification(
  supplierWorkspaceId: string,
  userId?: string | null
): Promise<{ id: string } | null> {
  try {
    const admin = createAdminClient()
    const existing = await admin
      .from("supplier_identity_verifications")
      .select("id")
      .eq("supplier_workspace_id", supplierWorkspaceId)
      .maybeSingle()
    if (existing.data?.id) return { id: existing.data.id as string }

    const { data, error } = await admin
      .from("supplier_identity_verifications")
      .insert({
        supplier_workspace_id: supplierWorkspaceId,
        user_id: userId ?? null,
        verification_level: 0,
        status: "unverified",
        provider: "manual",
      })
      .select("id")
      .maybeSingle()
    if (error || !data) return null
    return { id: data.id as string }
  } catch {
    return null
  }
}

/**
 * Advance the email / phone steps. These are the only steps that move the record
 * level floor directly (to 1 or 2). Higher levels are RECOMPUTED from evidence by
 * deriveLevel and are never set by trusting client input.
 */
export async function markContactStep(
  supplierWorkspaceId: string,
  step: "email" | "phone"
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data: row } = await admin
      .from("supplier_identity_verifications")
      .select("id, verification_level, status")
      .eq("supplier_workspace_id", supplierWorkspaceId)
      .maybeSingle()
    if (!row) return false
    const floor = step === "email" ? 1 : 2
    const newLevel = Math.max(Number(row.verification_level) || 0, floor)
    const newStatus =
      row.status === "unverified" ? "in_progress" : (row.status as string)
    const { error } = await admin
      .from("supplier_identity_verifications")
      .update({ verification_level: newLevel, status: newStatus })
      .eq("id", row.id)
    return !error
  } catch {
    return false
  }
}

/**
 * Sync the payout-verified state from Stripe Connect onto the record (records the
 * stripe_account_id and bumps the level floor to 3 when email+phone already done).
 * Returns whether the account is payout-verified after sync.
 */
export async function syncPayoutVerified(supplierWorkspaceId: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data: acct } = await admin
      .from("stripe_connect_accounts")
      .select("stripe_account_id, charges_enabled, payouts_enabled")
      .eq("workspace_id", supplierWorkspaceId)
      .maybeSingle()
    const verified = Boolean(acct?.charges_enabled) && Boolean(acct?.payouts_enabled)

    const { data: row } = await admin
      .from("supplier_identity_verifications")
      .select("id, verification_level")
      .eq("supplier_workspace_id", supplierWorkspaceId)
      .maybeSingle()
    if (row) {
      const patch: Record<string, unknown> = {}
      if (acct?.stripe_account_id) patch.stripe_account_id = acct.stripe_account_id
      if (verified && Number(row.verification_level) >= 2) patch.verification_level = 3
      if (Object.keys(patch).length > 0) {
        await admin.from("supplier_identity_verifications").update(patch).eq("id", row.id)
      }
    }
    return verified
  } catch {
    return false
  }
}

/** Build the full status summary the supplier centre + admin consume. */
export async function getStatusSummary(
  supplierWorkspaceId: string
): Promise<SupplierVerificationStatusSummary> {
  const { row, insurance, licences } = await loadVerification(supplierWorkspaceId)

  if (!row) {
    return {
      exists: false,
      verificationId: null,
      supplierWorkspaceId,
      level: 0,
      levelLabel: LEVEL_LABELS[0],
      status: "unverified",
      badges: deriveBadges(0, { hasCurrentInsurance: false, hasCurrentLicence: false }),
      documentCheckStatus: "not_started",
      selfieCheckStatus: "not_started",
      manualReviewStatus: "not_required",
      hasValidInsurance: false,
      hasValidLicence: false,
      insuranceExpiringSoon: false,
      licenceExpiringSoon: false,
      expiresAt: null,
      updatedAt: null,
    }
  }

  const payoutVerified = await isPayoutVerified(supplierWorkspaceId)
  const hasCurrentInsurance = insurance.some(isAcceptedAndCurrent)
  const hasCurrentLicence = licences.some(isAcceptedAndCurrent)
  const level = deriveLevel(row, {
    payoutVerified,
    hasAcceptedInsurance: hasCurrentInsurance,
    hasAcceptedLicence: hasCurrentLicence,
  })

  return {
    exists: true,
    verificationId: row.id,
    supplierWorkspaceId,
    level,
    levelLabel: LEVEL_LABELS[level],
    status: row.status,
    badges: deriveBadges(level, { hasCurrentInsurance, hasCurrentLicence }),
    documentCheckStatus: row.document_check_status,
    selfieCheckStatus: row.selfie_check_status,
    manualReviewStatus: row.manual_review_status,
    hasValidInsurance: hasCurrentInsurance,
    hasValidLicence: hasCurrentLicence,
    insuranceExpiringSoon: insurance.some((p) => p.status === "accepted" && expiringSoon(p.valid_to)),
    licenceExpiringSoon: licences.some((l) => l.status === "accepted" && expiringSoon(l.valid_to)),
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  }
}
