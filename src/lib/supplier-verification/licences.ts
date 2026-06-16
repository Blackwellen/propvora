import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { maskNumber } from "./documents"
import type { SupplierLicenceRow } from "./types"

/**
 * Supplier trade-licence / certification recording + expiry + category logic.
 *
 * Licence numbers are stored MASKED only. A licence never auto-"accepts" — an
 * admin reviews the uploaded evidence (review.ts). `required_for_categories`
 * scopes WHICH marketplace categories a licence is mandatory for (e.g. Gas Safe
 * for 'gas' / 'boiler' work), consumed by gating.ts.
 */

export interface RecordLicenceArgs {
  verificationId: string
  supplierWorkspaceId: string
  licenceType: string
  issuingBody?: string | null
  /** RAW licence number — masked here before storage. */
  licenceNumber?: string | null
  country?: string | null
  region?: string | null
  validFrom?: string | null
  validTo?: string | null
  requiredForCategories?: string[]
  r2Key?: string | null
}

/** True if the licence is expired (valid_to in the past). */
export function isLicenceExpired(licence: { valid_to: string | null }): boolean {
  if (!licence.valid_to) return false
  return new Date(licence.valid_to).getTime() < Date.now()
}

/** A job must be BLOCKED if a required licence is expired. */
export function blocksJobIfExpired(licence: { valid_to: string | null; status: string }): boolean {
  if (licence.status === "expired") return true
  return isLicenceExpired(licence)
}

/**
 * Whether a licence applies to (is required for) a given marketplace category.
 * Empty `required_for_categories` means the licence is general (applies to none
 * specifically as a gate).
 */
export function requiredForCategory(
  licence: { required_for_categories: string[] | null },
  category: string
): boolean {
  const cats = licence.required_for_categories ?? []
  return cats.map((c) => c.toLowerCase()).includes(category.toLowerCase())
}

/** Record a trade licence (status 'uploaded' — awaiting admin review). */
export async function recordLicence(
  args: RecordLicenceArgs
): Promise<{ id: string } | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_licence_verifications")
      .insert({
        verification_id: args.verificationId,
        supplier_workspace_id: args.supplierWorkspaceId,
        licence_type: args.licenceType,
        issuing_body: args.issuingBody ?? null,
        licence_number_masked: maskNumber(args.licenceNumber),
        country: args.country ?? null,
        region: args.region ?? null,
        valid_from: args.validFrom ?? null,
        valid_to: args.validTo ?? null,
        required_for_categories: args.requiredForCategories ?? [],
        r2_key: args.r2Key ?? null,
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

/** List licences for a verification (service-role). */
export async function listLicences(
  verificationId: string
): Promise<SupplierLicenceRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_licence_verifications")
      .select("*")
      .eq("verification_id", verificationId)
      .order("created_at", { ascending: false })
    if (error) return []
    return (data ?? []) as SupplierLicenceRow[]
  } catch {
    return []
  }
}

/** True if the supplier has at least one ACCEPTED, non-expired licence. */
export function hasValidLicence(licences: SupplierLicenceRow[]): boolean {
  return licences.some((l) => l.status === "accepted" && !isLicenceExpired(l))
}

/**
 * True if the supplier holds an accepted, non-expired licence covering `category`.
 * When no accepted licence specifically lists the category, this is false (the
 * category-scoped gate is unmet).
 */
export function hasValidLicenceForCategory(
  licences: SupplierLicenceRow[],
  category: string
): boolean {
  return licences.some(
    (l) => l.status === "accepted" && !isLicenceExpired(l) && requiredForCategory(l, category)
  )
}

/** Flip accepted-but-past-valid_to licences to 'expired'. Returns count flipped. */
export async function expireStaleLicences(supplierWorkspaceId?: string): Promise<number> {
  try {
    const admin = createAdminClient()
    let query = admin
      .from("supplier_licence_verifications")
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
