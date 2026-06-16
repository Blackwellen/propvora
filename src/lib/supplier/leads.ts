import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier LEADS / REQUESTS data layer (P3 deep).
//
// A "lead" is an inbound opportunity for the supplier workspace. There are two
// real sources in the live schema, unified into one shape:
//
//   1. quote_request — an operator asked THIS supplier to quote, i.e. a
//      `supplier_marketplace_quotes` row still in 'requested' (no price yet).
//      The supplier responds by submitting a priced quote (handled by quotes.ts).
//
//   2. enquiry — a buyer enquired on a `marketplace_listing` owned by this
//      workspace (`marketplace_enquiries.listing_id → marketplace_listings
//      where workspace_id = supplier`). The supplier follows up off-platform or
//      converts it into a quote.
//
// Read-only aggregation here; responding is a write on the underlying table
// (quotes.submitQuote for #1). 42P01/PGRST205-tolerant.
// ============================================================================

export type LeadSource = "quote_request" | "enquiry"

export interface SupplierLead {
  id: string
  source: LeadSource
  title: string
  detail: string | null
  status: string
  counterpartyName: string | null
  amountPence: number | null
  currency: string | null
  createdAt: string
  /** For quote_request leads, the underlying quote id the supplier can price. */
  quoteId: string | null
  /** For enquiry leads, the listing the enquiry was made against. */
  listingId: string | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703" || c === "PGRST205"
}

/** Inbound quote requests (operator → this supplier, still awaiting a price). */
async function listQuoteRequestLeads(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierLead[]> {
  try {
    const { data, error } = await supabase
      .from("supplier_marketplace_quotes")
      .select("id, title, description, status, amount_pence, currency, created_at, operator_workspace_id")
      .eq("supplier_workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    const rows = (data as Array<{
      id: string; title: string; description: string | null; status: string
      amount_pence: number | null; currency: string | null; created_at: string
    }>) ?? []
    return rows.map((r) => ({
      id: `quote:${r.id}`,
      source: "quote_request" as const,
      title: r.title || "Quote request",
      detail: r.description,
      status: r.status,
      counterpartyName: null,
      amountPence: r.amount_pence,
      currency: r.currency ?? "GBP",
      createdAt: r.created_at,
      quoteId: r.id,
      listingId: null,
    }))
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Buyer enquiries on listings owned by this supplier workspace. */
async function listEnquiryLeads(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierLead[]> {
  try {
    // Listings owned by this workspace.
    const { data: listings, error: lErr } = await supabase
      .from("marketplace_listings")
      .select("id, title")
      .eq("workspace_id", workspaceId)
    if (lErr) {
      if (tolerable(lErr)) return []
      throw lErr
    }
    const listingRows = (listings as Array<{ id: string; title: string | null }>) ?? []
    if (listingRows.length === 0) return []
    const titleById = new Map(listingRows.map((l) => [l.id, l.title]))
    const ids = listingRows.map((l) => l.id)

    const { data: enq, error: eErr } = await supabase
      .from("marketplace_enquiries")
      .select("id, listing_id, buyer_name, message, status, created_at")
      .in("listing_id", ids)
      .order("created_at", { ascending: false })
    if (eErr) {
      if (tolerable(eErr)) return []
      throw eErr
    }
    const rows = (enq as Array<{
      id: string; listing_id: string; buyer_name: string | null
      message: string | null; status: string | null; created_at: string
    }>) ?? []
    return rows.map((r) => ({
      id: `enquiry:${r.id}`,
      source: "enquiry" as const,
      title: titleById.get(r.listing_id) || "Listing enquiry",
      detail: r.message,
      status: r.status ?? "new",
      counterpartyName: r.buyer_name,
      amountPence: null,
      currency: null,
      createdAt: r.created_at,
      quoteId: null,
      listingId: r.listing_id,
    }))
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Unified, time-ordered lead feed for a supplier workspace. */
export async function listLeads(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierLead[]> {
  if (!workspaceId) return []
  const [requests, enquiries] = await Promise.all([
    listQuoteRequestLeads(supabase, workspaceId),
    listEnquiryLeads(supabase, workspaceId),
  ])
  return [...requests, ...enquiries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/** Count of "open" leads (requested quotes + new/unhandled enquiries). */
export function countOpenLeads(leads: SupplierLead[]): number {
  return leads.filter((l) => {
    const s = (l.status ?? "").toLowerCase()
    if (l.source === "quote_request") return s === "requested"
    return s === "new" || s === "open" || s === "received" || s === "pending"
  }).length
}
