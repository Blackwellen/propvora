import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import type {
  SupplierDocType,
  SupplierIdentityDocumentRow,
} from "./types"

/**
 * Supplier ID document recording.
 *
 * Documents are uploaded via /api/upload (R2) — this layer records the resulting
 * R2 KEYS plus a MASKED document number (never the full number) and metadata.
 * The actual file bytes are served only through the app's authed file URL.
 *
 * OCR is a PRE-FILL hook ONLY: when wired, a worker reads the document image to
 * pre-fill name/number for the supplier to confirm, then sets ocr_status to
 * 'manual_required'. It NEVER sets status to 'accepted' — identity is approved
 * exclusively by an explicit admin decision (review.ts).
 */

/**
 * Mask a raw document/policy/licence number, keeping only the last `keep` chars.
 * NEVER store or surface the full number — call this before persisting.
 *
 *   maskNumber("X1234567A")        -> "•••• 567A"
 *   maskNumber("AB12")             -> "•••• AB12"  (short — keep what we have)
 *   maskNumber("")                 -> null
 */
export function maskNumber(raw: string | null | undefined, keep = 4): string | null {
  if (!raw) return null
  const cleaned = String(raw).replace(/\s+/g, "").trim()
  if (!cleaned) return null
  const tail = cleaned.slice(-keep)
  return `•••• ${tail}`
}

export interface RecordDocumentArgs {
  verificationId: string
  supplierWorkspaceId: string
  docType: SupplierDocType
  documentCountry?: string | null
  /** RAW number — masked here before storage; the raw value is never persisted. */
  documentNumber?: string | null
  expiryDate?: string | null
  nameOnDocument?: string | null
  r2KeyFront?: string | null
  r2KeyBack?: string | null
  r2KeySelfie?: string | null
}

/**
 * Record an uploaded identity document. Status is always 'uploaded' (awaiting
 * review); OCR is left 'manual_required' so nothing auto-approves.
 * Returns the new row id, or null on failure (best-effort, never throws).
 */
export async function recordDocument(
  args: RecordDocumentArgs
): Promise<{ id: string } | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_identity_documents")
      .insert({
        verification_id: args.verificationId,
        supplier_workspace_id: args.supplierWorkspaceId,
        doc_type: args.docType,
        document_country: args.documentCountry ?? null,
        document_number_masked: maskNumber(args.documentNumber),
        expiry_date: args.expiryDate ?? null,
        name_on_document: args.nameOnDocument ?? null,
        r2_key_front: args.r2KeyFront ?? null,
        r2_key_back: args.r2KeyBack ?? null,
        r2_key_selfie: args.r2KeySelfie ?? null,
        ocr_status: "manual_required",
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

/** List documents for a verification (service-role). */
export async function listDocuments(
  verificationId: string
): Promise<SupplierIdentityDocumentRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_identity_documents")
      .select("*")
      .eq("verification_id", verificationId)
      .order("created_at", { ascending: true })
    if (error) return []
    return (data ?? []) as SupplierIdentityDocumentRow[]
  } catch {
    return []
  }
}

/** True if a document is expired (expiry_date in the past). */
export function isDocumentExpired(doc: { expiry_date: string | null }): boolean {
  if (!doc.expiry_date) return false
  return new Date(doc.expiry_date).getTime() < Date.now()
}

/**
 * OCR pre-fill hook. Records pre-filled values for human confirmation and marks
 * ocr_status 'prefilled'; it NEVER changes `status` (which only an admin moves to
 * accepted/rejected). Returns true if the row was updated.
 */
export async function applyOcrPrefill(
  documentId: string,
  prefill: { nameOnDocument?: string | null; documentNumber?: string | null; expiryDate?: string | null }
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const patch: Record<string, unknown> = { ocr_status: "prefilled" }
    if (prefill.nameOnDocument !== undefined) patch.name_on_document = prefill.nameOnDocument
    if (prefill.documentNumber !== undefined)
      patch.document_number_masked = maskNumber(prefill.documentNumber)
    if (prefill.expiryDate !== undefined) patch.expiry_date = prefill.expiryDate
    const { error } = await admin
      .from("supplier_identity_documents")
      .update(patch)
      .eq("id", documentId)
    return !error
  } catch {
    return false
  }
}
