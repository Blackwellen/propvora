import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PortalSession } from "./session"
import {
  getLandlordPropertyIds,
  getTenantTenancies,
  type SupplierInvoice,
  type LandlordProperty,
  type LandlordTransaction,
} from "./data"

// ============================================================================
// Additional session-scoped portal getters + the tenant maintenance CREATE
// path (the one functional gap: tenants could view but not raise requests).
// Service-role client, STRICTLY re-scoped to the session on every call.
// 42P01/42703-tolerant.
// ============================================================================

/** A single supplier invoice — re-scoped to workspace + this supplier contact. */
export async function getSupplierInvoice(session: PortalSession, invoiceId: string): Promise<SupplierInvoice | null> {
  if (!session.contactId || !invoiceId) return null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_invoices")
      .select("id, invoice_number, amount, currency, status, submitted_at, approved_at, paid_at, notes, supplier_job_id")
      .eq("id", invoiceId)
      .eq("workspace_id", session.workspaceId)
      .eq("contact_id", session.contactId)
      .maybeSingle()
    if (error || !data) return null
    return data as unknown as SupplierInvoice
  } catch {
    return null
  }
}

/** A single landlord property — only when in the session's frozen allow-list. */
export async function getLandlordProperty(session: PortalSession, propertyId: string): Promise<LandlordProperty | null> {
  const ids = await getLandlordPropertyIds(session)
  if (!propertyId || !ids.includes(propertyId)) return null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("properties")
      .select("id, nickname, address_line1, city, postcode, status, target_rent_pcm")
      .eq("id", propertyId)
      .eq("workspace_id", session.workspaceId)
      .maybeSingle()
    if (error || !data) return null
    return data as unknown as LandlordProperty
  } catch {
    return null
  }
}

/** Recent transactions for one landlord property (re-scoped). */
export async function getLandlordPropertyTransactions(session: PortalSession, propertyId: string): Promise<LandlordTransaction[]> {
  const ids = await getLandlordPropertyIds(session)
  if (!propertyId || !ids.includes(propertyId)) return []
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("money_transactions")
      // money_transactions has no `status` column in the live schema (reconciled/reconciliation_source instead)
      .select("id, created_at, amount, currency, direction, description, category, property_id")
      .eq("workspace_id", session.workspaceId)
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) return []
    return (data ?? []) as unknown as LandlordTransaction[]
  } catch {
    return []
  }
}

export interface NewMaintenanceRequest {
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
}

/**
 * Tenant raises a maintenance request. Inserts a `jobs` row scoped to the
 * tenant's own tenancy property + contact, so it appears in their portal AND
 * the operator's work queue. Fails closed if the tenant has no property.
 */
export async function createTenantMaintenanceRequest(
  session: PortalSession,
  input: NewMaintenanceRequest
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (session.portalType !== "tenant" || !session.contactId) {
    return { ok: false, error: "Not a tenant portal session." }
  }
  const title = input.title?.trim()
  const description = input.description?.trim()
  if (!title) return { ok: false, error: "Please add a short title." }

  // Resolve the tenant's property (must be on one of their tenancies).
  const tenancies = await getTenantTenancies(session)
  const propertyId = (tenancies.find((t) => t.status === "active") ?? tenancies[0])?.property_id ?? null
  if (!propertyId) return { ok: false, error: "No property is linked to your tenancy yet." }

  const priority = ["low", "medium", "high", "urgent"].includes(input.priority) ? input.priority : "medium"

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("jobs")
      .insert({
        workspace_id: session.workspaceId,
        property_id: propertyId,
        contact_id: session.contactId,
        title,
        description: description || null,
        status: "new",
        priority,
        category: "maintenance",
      })
      .select("id")
      .single()
    if (error || !data) return { ok: false, error: "Could not submit your request. Please try again." }
    return { ok: true, id: data.id as string }
  } catch {
    return { ok: false, error: "Could not submit your request. Please try again." }
  }
}
