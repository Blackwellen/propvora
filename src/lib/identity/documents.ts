/**
 * P6 — Identity / KYC document recorders.
 *
 * DB-only helpers for the `verification_documents` table. Document binaries live
 * in private R2 storage; we store only the object key (`r2_key`) and serve via
 * short-lived signed URLs (sibling UI agent owns the upload + preview surfaces).
 * A document status here is an admin/provider record — never auto-accepted.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { VerificationDocStatus, VerificationDocType, VerificationDocument } from "./types"

/** Postgres / PostgREST codes meaning the table/column is not provisioned yet. */
const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703"])

function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/** Record an uploaded document against a verification (status defaults uploaded). */
export async function addVerificationDocument(
  supabase: SupabaseClient,
  args: {
    verificationId: string
    docType: VerificationDocType
    r2Key?: string | null
    notes?: string | null
  }
): Promise<VerificationDocument> {
  const { data, error } = await supabase
    .from("verification_documents")
    .insert({
      verification_id: args.verificationId,
      doc_type: args.docType,
      r2_key: args.r2Key ?? null,
      notes: args.notes ?? null,
    })
    .select("*")
    .single()
  if (error) throw error
  return data as VerificationDocument
}

/** List documents for a verification (newest first). 42P01-tolerant → []. */
export async function listDocuments(
  supabase: SupabaseClient,
  verificationId: string
): Promise<VerificationDocument[]> {
  const { data, error } = await supabase
    .from("verification_documents")
    .select("*")
    .eq("verification_id", verificationId)
    .order("created_at", { ascending: false })
  if (error) {
    if (isNotProvisioned(error)) return []
    throw error
  }
  return (data as VerificationDocument[] | null) ?? []
}

/**
 * Set a document's review status. Called by an authenticated admin decision —
 * a document is never auto-accepted. `notes` records the reviewer's rationale.
 */
export async function setDocumentStatus(
  supabase: SupabaseClient,
  documentId: string,
  status: VerificationDocStatus,
  notes?: string | null
): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (notes !== undefined) patch.notes = notes
  const { error } = await supabase
    .from("verification_documents")
    .update(patch)
    .eq("id", documentId)
  if (error) throw error
}
