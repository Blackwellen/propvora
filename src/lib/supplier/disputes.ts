import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier DISPUTES data layer (P3 deep).
//
// Backed by the new `supplier_disputes` table. A dispute is raised on a job
// assignment by either side and moves open → under_review → resolved/rejected,
// or is withdrawn by the raiser. RLS scopes rows to members of either side.
// 42P01/PGRST205-tolerant.
// ============================================================================

export type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "rejected"
  | "withdrawn"

export type DisputeCategory = "payment" | "scope" | "quality" | "access" | "other"

export interface SupplierDispute {
  id: string
  assignment_id: string
  operator_workspace_id: string
  supplier_workspace_id: string
  raised_by_side: string
  raised_by: string | null
  category: string
  subject: string
  detail: string | null
  status: DisputeStatus
  resolution: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

const DISP_COLS =
  "id, assignment_id, operator_workspace_id, supplier_workspace_id, " +
  "raised_by_side, raised_by, category, subject, detail, status, resolution, " +
  "resolved_at, created_at, updated_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703" || c === "PGRST205"
}

/** List disputes for a supplier workspace (newest first). */
export async function listDisputes(
  supabase: SupabaseClient,
  supplierWorkspaceId: string,
  opts: { status?: DisputeStatus; assignmentId?: string } = {}
): Promise<SupplierDispute[]> {
  if (!supplierWorkspaceId) return []
  try {
    let q = supabase
      .from("supplier_disputes")
      .select(DISP_COLS)
      .eq("supplier_workspace_id", supplierWorkspaceId)
    if (opts.status) q = q.eq("status", opts.status)
    if (opts.assignmentId) q = q.eq("assignment_id", opts.assignmentId)
    const { data, error } = await q.order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as SupplierDispute[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Raise a dispute on an assignment. */
export async function createDispute(
  supabase: SupabaseClient,
  params: {
    assignmentId: string
    operatorWorkspaceId: string
    supplierWorkspaceId: string
    raisedBySide: "operator" | "supplier"
    raisedBy?: string | null
    category?: DisputeCategory
    subject: string
    detail?: string | null
  }
): Promise<SupplierDispute | null> {
  try {
    const { data, error } = await supabase
      .from("supplier_disputes")
      .insert({
        assignment_id: params.assignmentId,
        operator_workspace_id: params.operatorWorkspaceId,
        supplier_workspace_id: params.supplierWorkspaceId,
        raised_by_side: params.raisedBySide,
        raised_by: params.raisedBy ?? null,
        category: params.category ?? "other",
        subject: params.subject,
        detail: params.detail ?? null,
        status: "open",
      })
      .select(DISP_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierDispute | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/**
 * The raiser withdraws their own dispute (open|under_review → withdrawn).
 * Scoped to the supplier workspace; status-guarded.
 */
export async function withdrawDispute(
  supabase: SupabaseClient,
  supplierWorkspaceId: string,
  disputeId: string
): Promise<SupplierDispute | null> {
  if (!supplierWorkspaceId || !disputeId) return null
  try {
    const { data, error } = await supabase
      .from("supplier_disputes")
      .update({ status: "withdrawn" })
      .eq("id", disputeId)
      .eq("supplier_workspace_id", supplierWorkspaceId)
      .in("status", ["open", "under_review"])
      .select(DISP_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierDispute | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}
