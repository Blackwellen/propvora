import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier WORKSPACE invoices data layer (P3 deep).
//
// Backed by `supplier_workspace_invoices` (workspace_id-scoped, RLS via
// is_supplier_workspace_member). DISTINCT from the legacy contact-based
// `supplier_invoices` (NOT NULL contact_id). An invoice moves
// draft → submitted → approved → paid (or void). Money is INTEGER PENCE.
// 42P01/42703-tolerant.
// ============================================================================

export type SupplierInvoiceStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "paid"
  | "void"

export interface SupplierInvoice {
  id: string
  workspace_id: string
  assignment_id: string | null
  invoice_number: string | null
  amount_pence: number | null
  currency: string
  status: SupplierInvoiceStatus
  submitted_at: string | null
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplierInvoiceInput {
  invoice_number?: string | null
  amount_pence?: number | null
  currency?: string
  assignment_id?: string | null
  notes?: string | null
}

const INV_COLS =
  "id, workspace_id, assignment_id, invoice_number, amount_pence, " +
  "currency, status, submitted_at, approved_at, paid_at, notes, created_at, updated_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703" || c === "PGRST205"
}

/** List a supplier workspace's invoices (newest first). */
export async function listInvoices(
  supabase: SupabaseClient,
  workspaceId: string,
  opts: { status?: SupplierInvoiceStatus } = {}
): Promise<SupplierInvoice[]> {
  if (!workspaceId) return []
  try {
    let q = supabase
      .from("supplier_workspace_invoices")
      .select(INV_COLS)
      .eq("workspace_id", workspaceId)
    if (opts.status) q = q.eq("status", opts.status)
    const { data, error } = await q.order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as SupplierInvoice[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Create a draft invoice. */
export async function createInvoice(
  supabase: SupabaseClient,
  workspaceId: string,
  input: SupplierInvoiceInput
): Promise<SupplierInvoice | null> {
  if (!workspaceId) return null
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_invoices")
      .insert({
        workspace_id: workspaceId,
        currency: input.currency ?? "GBP",
        status: "draft",
        invoice_number: input.invoice_number ?? null,
        amount_pence: input.amount_pence ?? null,
        assignment_id: input.assignment_id ?? null,
        notes: input.notes ?? null,
      })
      .select(INV_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierInvoice | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/**
 * Supplier submits a draft invoice (draft → submitted) and stamps submitted_at.
 * Status-guarded so a paid invoice can't be resubmitted.
 */
export async function submitInvoice(
  supabase: SupabaseClient,
  workspaceId: string,
  invoiceId: string
): Promise<SupplierInvoice | null> {
  if (!workspaceId || !invoiceId) return null
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_invoices")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", invoiceId)
      .eq("workspace_id", workspaceId)
      .eq("status", "draft")
      .select(INV_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierInvoice | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Void an invoice (any non-paid status → void). */
export async function voidInvoice(
  supabase: SupabaseClient,
  workspaceId: string,
  invoiceId: string
): Promise<SupplierInvoice | null> {
  if (!workspaceId || !invoiceId) return null
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_invoices")
      .update({ status: "void" })
      .eq("id", invoiceId)
      .eq("workspace_id", workspaceId)
      .neq("status", "paid")
      .select(INV_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierInvoice | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Aggregate totals across a workspace's invoices (integer pence). */
export function summariseInvoices(invoices: SupplierInvoice[]): {
  totalPence: number
  outstandingPence: number
  paidPence: number
  draftPence: number
  currency: string
} {
  let totalPence = 0
  let outstandingPence = 0
  let paidPence = 0
  let draftPence = 0
  const currency = invoices[0]?.currency ?? "GBP"
  for (const inv of invoices) {
    const amt = inv.amount_pence ?? 0
    totalPence += amt
    if (inv.status === "paid") paidPence += amt
    else if (inv.status === "submitted" || inv.status === "approved") outstandingPence += amt
    else if (inv.status === "draft") draftPence += amt
  }
  return { totalPence, outstandingPence, paidPence, draftPence, currency }
}
