// ============================================================================
// Supplier marketplace QUOTES data layer (P3).
//
// Two-sided quote between an operator workspace and a supplier workspace, stored
// in `supplier_marketplace_quotes` (distinct from the V1 single-workspace,
// contact-based `supplier_quotes`). Lifecycle:
//
//   operator requestQuote → 'requested'
//   supplier submitQuote   → 'quoted'   (sets amount)
//   operator acceptQuote   → 'accepted' (may spawn a job assignment)
//   operator declineQuote  → 'declined'
//   supplier withdrawQuote → 'withdrawn'
//
// Money is integer pence. RLS is the real boundary; the API enforces which SIDE
// the caller belongs to before each write. 42P01/PGRST205-tolerant.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export const NOT_PROVISIONED = new Set(["42P01", "PGRST205"])

export type QuoteStatus =
  | "requested"
  | "quoted"
  | "accepted"
  | "declined"
  | "expired"
  | "withdrawn"

export interface SupplierQuote {
  id: string
  operator_workspace_id: string
  supplier_workspace_id: string
  property_id: string | null
  job_id: string | null
  service_id: string | null
  title: string
  description: string | null
  status: QuoteStatus
  amount_pence: number | null
  currency: string
  valid_until: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

function isMissingTable(err: { code?: string } | null | undefined): boolean {
  return Boolean(err?.code && NOT_PROVISIONED.has(err.code))
}

/**
 * List quotes touching `workspaceId` on the chosen side. RLS additionally caps
 * visibility to workspaces the caller belongs to.
 */
export async function listQuotes(
  supabase: SupabaseClient,
  workspaceId: string,
  side: "operator" | "supplier",
  opts?: { status?: QuoteStatus }
): Promise<SupplierQuote[]> {
  const column =
    side === "operator" ? "operator_workspace_id" : "supplier_workspace_id"
  let query = supabase
    .from("supplier_marketplace_quotes")
    .select("*")
    .eq(column, workspaceId)
  if (opts?.status) query = query.eq("status", opts.status)

  const { data, error } = await query.order("created_at", { ascending: false })
  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data as SupplierQuote[]) ?? []
}

/** Load one quote by id (RLS-scoped). */
export async function getQuote(
  supabase: SupabaseClient,
  quoteId: string
): Promise<SupplierQuote | null> {
  const { data, error } = await supabase
    .from("supplier_marketplace_quotes")
    .select("*")
    .eq("id", quoteId)
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return (data as SupplierQuote) ?? null
}

/**
 * Operator requests a quote from a connected supplier workspace. Status starts
 * 'requested'; amount is left null for the supplier to fill. The API gates this
 * with `gateSupplierWorkspace` + operator membership.
 */
export async function requestQuote(
  supabase: SupabaseClient,
  params: {
    operatorWorkspaceId: string
    supplierWorkspaceId: string
    title: string
    description?: string | null
    propertyId?: string | null
    jobId?: string | null
    serviceId?: string | null
    currency?: string
    validUntil?: string | null
    createdBy: string
  }
): Promise<SupplierQuote> {
  const { data, error } = await supabase
    .from("supplier_marketplace_quotes")
    .insert({
      operator_workspace_id: params.operatorWorkspaceId,
      supplier_workspace_id: params.supplierWorkspaceId,
      title: params.title,
      description: params.description ?? null,
      property_id: params.propertyId ?? null,
      job_id: params.jobId ?? null,
      service_id: params.serviceId ?? null,
      currency: params.currency ?? "GBP",
      valid_until: params.validUntil ?? null,
      status: "requested",
      created_by: params.createdBy,
    })
    .select("*")
    .single()
  if (error) throw error
  return data as SupplierQuote
}

/**
 * Supplier submits a priced quote (→ 'quoted'). Only valid from 'requested' or
 * a prior 'quoted' (re-quote). The API verifies SUPPLIER-side membership.
 */
export async function submitQuote(
  supabase: SupabaseClient,
  quoteId: string,
  params: { amountPence: number; validUntil?: string | null; description?: string | null }
): Promise<SupplierQuote | null> {
  const patch: Record<string, unknown> = {
    amount_pence: params.amountPence,
    status: "quoted",
  }
  if (params.validUntil !== undefined) patch.valid_until = params.validUntil
  if (params.description !== undefined) patch.description = params.description

  const { data, error } = await supabase
    .from("supplier_marketplace_quotes")
    .update(patch)
    .eq("id", quoteId)
    .in("status", ["requested", "quoted"])
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return (data as SupplierQuote) ?? null
}

/**
 * Operator accepts a 'quoted' quote (→ 'accepted') and spawns a
 * `supplier_job_assignment`. The assignment carries the quote's job_id link if
 * present. Returns the updated quote plus the created assignment id (or null if
 * the quote wasn't in an acceptable state or the table is unprovisioned).
 */
export async function acceptQuote(
  supabase: SupabaseClient,
  quoteId: string
): Promise<{ quote: SupplierQuote; assignmentId: string | null } | null> {
  const { data, error } = await supabase
    .from("supplier_marketplace_quotes")
    .update({ status: "accepted" })
    .eq("id", quoteId)
    .eq("status", "quoted")
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  const quote = (data as SupplierQuote) ?? null
  if (!quote) return null

  // Spawn a job assignment from the accepted quote. Best-effort: a missing
  // assignments table must not undo the acceptance.
  let assignmentId: string | null = null
  try {
    const { data: asg, error: asgErr } = await supabase
      .from("supplier_job_assignments")
      .insert({
        quote_id: quote.id,
        operator_workspace_id: quote.operator_workspace_id,
        supplier_workspace_id: quote.supplier_workspace_id,
        job_id: quote.job_id,
        status: "assigned",
      })
      .select("id")
      .single()
    if (asgErr) {
      if (!isMissingTable(asgErr)) throw asgErr
    } else {
      assignmentId = (asg as { id: string }).id
    }
  } catch (err) {
    if (!isMissingTable(err as { code?: string })) throw err
  }

  return { quote, assignmentId }
}

/** Operator declines a quote (→ 'declined'). Valid from 'requested'/'quoted'. */
export async function declineQuote(
  supabase: SupabaseClient,
  quoteId: string
): Promise<SupplierQuote | null> {
  const { data, error } = await supabase
    .from("supplier_marketplace_quotes")
    .update({ status: "declined" })
    .eq("id", quoteId)
    .in("status", ["requested", "quoted"])
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return (data as SupplierQuote) ?? null
}

/** Supplier withdraws a quote (→ 'withdrawn'). Valid from 'requested'/'quoted'. */
export async function withdrawQuote(
  supabase: SupabaseClient,
  quoteId: string
): Promise<SupplierQuote | null> {
  const { data, error } = await supabase
    .from("supplier_marketplace_quotes")
    .update({ status: "withdrawn" })
    .eq("id", quoteId)
    .in("status", ["requested", "quoted"])
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return (data as SupplierQuote) ?? null
}
