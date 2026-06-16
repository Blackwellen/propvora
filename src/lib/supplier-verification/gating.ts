import "server-only"
import { loadVerification, isPayoutVerified, deriveLevel } from "./levels"
import { hasValidInsurance } from "./insurance"
import { hasValidLicence, hasValidLicenceForCategory } from "./licences"
import type {
  JobRiskTier,
  RequirementKey,
  GatingDecision,
} from "./types"

/**
 * Marketplace job gating.
 *
 * Maps a job's RISK TIER (low / medium / high) onto the verification
 * requirements a supplier must satisfy before they can accept it. The
 * marketplace / supplier job-acceptance flow calls `canAcceptJob`.
 *
 * Policy (additive by tier):
 *   low:    email + phone confirmed
 *   medium: email + phone + payout verified
 *   high:   email + phone + payout + insurance evidence reviewed
 *           + licence evidence reviewed + admin approval (L4 ID review)
 *
 * HONESTY: a TRUE decision means "the required evidence has been reviewed",
 * NOT a guarantee about the supplier. Nothing here auto-approves; it only reads
 * the evidence state produced by admin decisions (review.ts).
 */

/** Ordered requirement set per risk tier. */
export function requirementsForRisk(risk: JobRiskTier): RequirementKey[] {
  switch (risk) {
    case "low":
      return ["email", "phone"]
    case "medium":
      return ["email", "phone", "payout"]
    case "high":
      return ["email", "phone", "payout", "insurance", "licence", "admin_approval"]
    default:
      return ["email", "phone"]
  }
}

/**
 * Evaluate which requirements a supplier currently satisfies and whether they can
 * accept a job of the given risk tier (optionally category-scoped for licences).
 */
export async function canAcceptJob(
  supplierWorkspaceId: string,
  risk: JobRiskTier,
  category?: string | null
): Promise<GatingDecision> {
  const required = requirementsForRisk(risk)
  const cat = category ?? null

  const { row, insurance, licences, available } = await loadVerification(supplierWorkspaceId)

  // Subsystem missing or no record → nothing satisfied.
  if (!available || !row) {
    return {
      allowed: false,
      missing: required,
      reason: available
        ? "This supplier has not started verification."
        : "Verification is not available.",
      riskTier: risk,
      category: cat,
    }
  }

  const payoutVerified = await isPayoutVerified(supplierWorkspaceId)
  const insuranceOk = hasValidInsurance(insurance)
  const licenceOk = cat
    ? hasValidLicenceForCategory(licences, cat)
    : hasValidLicence(licences)

  const level = deriveLevel(row, {
    payoutVerified,
    hasAcceptedInsurance: insuranceOk,
    hasAcceptedLicence: cat ? hasValidLicenceForCategory(licences, cat) : hasValidLicence(licences),
  })

  // email/phone are persisted as the record's level floor (L1/L2) via the submit
  // flow; we treat verification_level >= 1 / >= 2 as those steps being done.
  // The manual L4 identity review being approved (both checks passed).
  const idReviewed =
    row.manual_review_status === "approved" &&
    row.document_check_status === "passed" &&
    row.selfie_check_status === "passed"

  const satisfied: Record<RequirementKey, boolean> = {
    email: row.verification_level >= 1,
    phone: row.verification_level >= 2,
    payout: payoutVerified,
    insurance: insuranceOk,
    licence: licenceOk,
    id_evidence: idReviewed,
    // admin_approval == the manual L4 identity review approved.
    admin_approval: idReviewed,
  }

  const missing = required.filter((k) => !satisfied[k])
  const allowed = missing.length === 0 && row.status !== "suspended" && row.status !== "rejected"

  return {
    allowed,
    missing,
    reason: buildReason(allowed, missing, row.status, level, cat),
    riskTier: risk,
    category: cat,
  }
}

function buildReason(
  allowed: boolean,
  missing: RequirementKey[],
  status: string,
  level: number,
  category: string | null
): string {
  if (status === "suspended") return "This supplier's verification is suspended."
  if (status === "rejected") return "This supplier's verification was rejected."
  if (allowed) {
    return `Verification requirements met (level ${level} — evidence reviewed).`
  }
  const labels: Record<RequirementKey, string> = {
    email: "email confirmation",
    phone: "phone confirmation",
    payout: "payout verification",
    insurance: "insurance evidence reviewed",
    licence: category
      ? `licence evidence reviewed for ${category}`
      : "licence evidence reviewed",
    id_evidence: "ID evidence reviewed",
    admin_approval: "ID evidence reviewed (admin approval)",
  }
  const list = missing.map((k) => labels[k]).join(", ")
  return `Not yet eligible — still required: ${list}.`
}
