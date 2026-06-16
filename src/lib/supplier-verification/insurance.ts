import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { maskNumber } from "./documents"
import type { InsuranceType, SupplierInsurancePolicyRow } from "./types"

/**
 * Supplier insurance policy recording + expiry / minimum-cover logic.
 *
 * Policy numbers are stored MASKED only. A policy never auto-"accepts" — an admin
 * reviews the uploaded evidence (review.ts). `minimum_cover_met` is computed from
 * the declared cover vs the platform minimum for the insurance type, but it is a
 * SIGNAL for the reviewer, not an approval.
 */

/** Platform minimum cover (pence) per insurance type. £1m public liability, etc. */
export const MINIMUM_COVER_PENCE: Record<InsuranceType, number> = {
  public_liability: 1_000_000_00, // £1,000,000
  employers_liability: 5_000_000_00, // £5,000,000 (statutory UK minimum)
  professional_indemnity: 250_000_00, // £250,000
  contractors_all_risk: 0, // no fixed minimum — reviewer judges
  other: 0,
}

export interface RecordInsuranceArgs {
  verificationId: string
  supplierWorkspaceId: string
  insuranceType: InsuranceType
  provider?: string | null
  /** RAW policy number — masked here before storage. */
  policyNumber?: string | null
  coverageAmountPence?: number | null
  validFrom?: string | null
  validTo?: string | null
  r2Key?: string | null
}

/** Whether declared cover meets the platform minimum for its type. */
export function meetsMinimumCover(
  insuranceType: InsuranceType,
  coverageAmountPence: number | null | undefined
): boolean {
  const min = MINIMUM_COVER_PENCE[insuranceType] ?? 0
  if (min <= 0) return true
  return (coverageAmountPence ?? 0) >= min
}

/** True if the policy is expired (valid_to in the past). */
export function isInsuranceExpired(policy: { valid_to: string | null }): boolean {
  if (!policy.valid_to) return false
  return new Date(policy.valid_to).getTime() < Date.now()
}

/**
 * A job must be BLOCKED if it depends on insurance and the supplier's relevant
 * policy is expired. Returns true when the policy is expired (so blocks the job).
 */
export function blocksJobIfExpired(policy: { valid_to: string | null; status: string }): boolean {
  if (policy.status === "expired") return true
  return isInsuranceExpired(policy)
}

/** Record an insurance policy (status 'uploaded' — awaiting admin review). */
export async function recordInsurance(
  args: RecordInsuranceArgs
): Promise<{ id: string } | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_insurance_policies")
      .insert({
        verification_id: args.verificationId,
        supplier_workspace_id: args.supplierWorkspaceId,
        insurance_type: args.insuranceType,
        provider: args.provider ?? null,
        policy_number_masked: maskNumber(args.policyNumber),
        coverage_amount_pence: args.coverageAmountPence ?? null,
        valid_from: args.validFrom ?? null,
        valid_to: args.validTo ?? null,
        r2_key: args.r2Key ?? null,
        minimum_cover_met: meetsMinimumCover(args.insuranceType, args.coverageAmountPence),
        status: "uploaded",
      })
      .select("id")
      .maybeSingle()
    if (error || !data) return null
    return { id: data.id as string }
  } catch {
    return null
  }
}

/** List insurance policies for a verification (service-role). */
export async function listInsurance(
  verificationId: string
): Promise<SupplierInsurancePolicyRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_insurance_policies")
      .select("*")
      .eq("verification_id", verificationId)
      .order("created_at", { ascending: false })
    if (error) return []
    return (data ?? []) as SupplierInsurancePolicyRow[]
  } catch {
    return []
  }
}

/** True if the supplier has at least one ACCEPTED, non-expired policy. */
export function hasValidInsurance(policies: SupplierInsurancePolicyRow[]): boolean {
  return policies.some((p) => p.status === "accepted" && !isInsuranceExpired(p))
}

/**
 * Mark any accepted-but-now-past-valid_to policies as 'expired'. Idempotent;
 * intended for a scheduled sweep. Returns the count flipped.
 */
export async function expireStalePolicies(supplierWorkspaceId?: string): Promise<number> {
  try {
    const admin = createAdminClient()
    let query = admin
      .from("supplier_insurance_policies")
      .update({ status: "expired" })
      .eq("status", "accepted")
      .lt("valid_to", new Date().toISOString().slice(0, 10))
    if (supplierWorkspaceId) query = query.eq("supplier_workspace_id", supplierWorkspaceId)
    const { data, error } = await query.select("id")
    if (error) return 0
    return (data ?? []).length
  } catch {
    return 0
  }
}
