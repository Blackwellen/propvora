import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ShareGrant } from "./share"

// ============================================================================
// Scoped resource loaders for /p/[token]. EVERY query here is filtered by BOTH
// the grant's workspace_id AND its resource id allow-list, so a recipient can
// never read anything outside the grant — even if a row for another workspace
// happened to share an id. The service-role client is used (the recipient has
// no Supabase auth), which is exactly why these filters are mandatory.
// ============================================================================

export interface ShareDocument {
  id: string
  name: string
  category: string | null
  mimeType: string | null
  sizeBytes: number | null
  r2Key: string | null
  createdAt: string | null
}

export interface ShareInvoice {
  id: string
  invoiceNumber: string | null
  status: string | null
  issueDate: string | null
  dueDate: string | null
  total: number | null
  currency: string | null
  paidAmount: number | null
  notes: string | null
}

export interface ShareJob {
  id: string
  reference: string | null
  title: string | null
  description: string | null
  status: string | null
  priority: string | null
  category: string | null
  scheduledDate: string | null
  quotedAmount: number | null
}

/** Documents within scope. Empty allow-list => no documents (fail closed). */
export async function loadShareDocuments(grant: ShareGrant): Promise<ShareDocument[]> {
  if (grant.resourceIds.length === 0) return []
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("documents")
      .select("id, name, category, mime_type, size_bytes, r2_key, created_at")
      .eq("workspace_id", grant.workspaceId) // workspace gate
      .in("id", grant.resourceIds) // resource-id gate
      .is("archived_at", null)
    if (error || !data) return []
    return (data as Record<string, unknown>[]).map((d) => ({
      id: String(d.id),
      name: String(d.name ?? "Document"),
      category: (d.category as string | null) ?? null,
      mimeType: (d.mime_type as string | null) ?? null,
      sizeBytes: (d.size_bytes as number | null) ?? null,
      r2Key: (d.r2_key as string | null) ?? null,
      createdAt: (d.created_at as string | null) ?? null,
    }))
  } catch {
    return []
  }
}

/** A single invoice, only if it is inside the grant's scope. */
export async function loadShareInvoice(grant: ShareGrant): Promise<ShareInvoice | null> {
  if (grant.resourceIds.length === 0) return null
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("invoices")
      .select(
        "id, invoice_number, status, issue_date, due_date, total, currency, paid_amount, notes"
      )
      .eq("workspace_id", grant.workspaceId)
      .in("id", grant.resourceIds)
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    const d = data as Record<string, unknown>
    return {
      id: String(d.id),
      invoiceNumber: (d.invoice_number as string | null) ?? null,
      status: (d.status as string | null) ?? null,
      issueDate: (d.issue_date as string | null) ?? null,
      dueDate: (d.due_date as string | null) ?? null,
      total: (d.total as number | null) ?? null,
      currency: (d.currency as string | null) ?? "GBP",
      paidAmount: (d.paid_amount as number | null) ?? null,
      notes: (d.notes as string | null) ?? null,
    }
  } catch {
    return null
  }
}

/** A single job / work order, only if it is inside the grant's scope. */
export async function loadShareJob(grant: ShareGrant): Promise<ShareJob | null> {
  if (grant.resourceIds.length === 0) return null
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("jobs")
      .select(
        "id, reference, title, description, status, priority, category, scheduled_date, quoted_amount"
      )
      .eq("workspace_id", grant.workspaceId)
      .in("id", grant.resourceIds)
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    const d = data as Record<string, unknown>
    return {
      id: String(d.id),
      reference: (d.reference as string | null) ?? null,
      title: (d.title as string | null) ?? null,
      description: (d.description as string | null) ?? null,
      status: (d.status as string | null) ?? null,
      priority: (d.priority as string | null) ?? null,
      category: (d.category as string | null) ?? null,
      scheduledDate: (d.scheduled_date as string | null) ?? null,
      quotedAmount: (d.quoted_amount as number | null) ?? null,
    }
  } catch {
    return null
  }
}

/** Files the recipient has already uploaded against this share. */
export interface ShareUpload {
  id: string
  fileName: string | null
  sizeBytes: number | null
  uploadedAt: string
}

export async function loadShareUploads(grant: ShareGrant): Promise<ShareUpload[]> {
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("portal_share_uploads")
      .select("id, file_name, size_bytes, uploaded_at")
      .eq("share_link_id", grant.id)
      .eq("workspace_id", grant.workspaceId)
      .order("uploaded_at", { ascending: false })
    if (error || !data) return []
    return (data as Record<string, unknown>[]).map((u) => ({
      id: String(u.id),
      fileName: (u.file_name as string | null) ?? null,
      sizeBytes: (u.size_bytes as number | null) ?? null,
      uploadedAt: String(u.uploaded_at),
    }))
  } catch {
    return []
  }
}
