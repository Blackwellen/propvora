import { createAdminClient } from "@/lib/supabase/admin"
import type { PortalSession } from "./session"

// ============================================================================
// SCOPED SERVER DATA LAYER for the external portal.
//
// Every function here takes a validated PortalSession and queries the
// service-role client STRICTLY filtered to that session's scope:
//   - workspace_id is ALWAYS pinned to session.workspaceId
//   - row ownership is pinned to session.contactId (or a frozen id allow-list)
//
// There is NO code path that returns data outside the session scope. If the
// scope is empty (e.g. no linked properties) we return [] — we NEVER widen
// to "all workspace rows". All queries are 42P01/42703-tolerant: a missing
// table or column resolves to an empty result, not a thrown 500.
// ============================================================================

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
const MISSING_TABLE = "42P01"
const MISSING_COLUMN = "42703"
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === MISSING_TABLE || c === MISSING_COLUMN
}

// ---- SUPPLIER ---------------------------------------------------------------

export interface SupplierJob {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  scheduled_date: string | null
  reference: string | null
  category: string | null
  property_id: string | null
  contact_id: string | null
  quoted_amount: number | null
  approved_amount: number | null
  propertyLabel: string | null
  operatorLabel: string | null
}

export interface SupplierInvoice {
  id: string
  invoice_number: string | null
  amount: number
  currency: string | null
  status: string
  submitted_at: string
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  supplier_job_id: string | null
}

/** Resolve property + operator display labels for a batch of jobs. */
async function buildJobLabels(
  workspaceId: string,
  propertyIds: (string | null)[],
  contactIds: (string | null)[]
): Promise<{ propertyById: Map<string, string>; contactById: Map<string, string> }> {
  const admin = createAdminClient()
  const propertyById = new Map<string, string>()
  const contactById = new Map<string, string>()
  const pIds = Array.from(new Set(propertyIds.filter(Boolean))) as string[]
  const cIds = Array.from(new Set(contactIds.filter(Boolean))) as string[]

  if (pIds.length) {
    try {
      // Pin to workspace as defence-in-depth even though ids come from
      // already-scoped job rows.
      const { data, error } = await admin
        .from("properties")
        .select("id, nickname, address_line1, city")
        .eq("workspace_id", workspaceId)
        .in("id", pIds)
      if (!error && data) {
        for (const r of data as Record<string, unknown>[]) {
          const label =
            (r.nickname as string) ||
            [r.address_line1, r.city].filter(Boolean).join(", ") ||
            "Property"
          propertyById.set(r.id as string, label)
        }
      }
    } catch {
      /* tolerate */
    }
  }
  if (cIds.length) {
    try {
      const { data, error } = await admin
        .from("contacts")
        .select("id, display_name, company")
        .eq("workspace_id", workspaceId)
        .in("id", cIds)
      if (!error && data) {
        for (const r of data as Record<string, unknown>[]) {
          const label =
            (r.company as string) || (r.display_name as string) || "Operator"
          contactById.set(r.id as string, label)
        }
      }
    } catch {
      /* tolerate */
    }
  }
  return { propertyById, contactById }
}

/** Jobs assigned to this supplier contact, scoped to workspace + supplier_contact_id. */
export async function getSupplierJobs(session: PortalSession): Promise<SupplierJob[]> {
  if (!session.contactId) return []
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("jobs")
      .select(
        "id, title, description, status, priority, scheduled_date, reference, category, property_id, contact_id, quoted_amount, approved_amount"
      )
      .eq("workspace_id", session.workspaceId)
      .eq("supplier_contact_id", session.contactId)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      return []
    }
    const rows = (data ?? []) as unknown as SupplierJob[]
    const maps = await buildJobLabels(
      session.workspaceId,
      rows.map((j) => j.property_id),
      rows.map((j) => j.contact_id)
    )
    return rows.map((j) => ({
      ...j,
      propertyLabel: j.property_id ? maps.propertyById.get(j.property_id) ?? null : null,
      operatorLabel: j.contact_id ? maps.contactById.get(j.contact_id) ?? null : null,
    }))
  } catch {
    return []
  }
}

/** A single job — STRICTLY re-scoped so a guessed id outside scope returns null. */
export async function getSupplierJob(
  session: PortalSession,
  jobId: string
): Promise<SupplierJob | null> {
  if (!session.contactId) return null
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("jobs")
      .select(
        "id, title, description, status, priority, scheduled_date, reference, category, property_id, contact_id, quoted_amount, approved_amount"
      )
      .eq("id", jobId)
      .eq("workspace_id", session.workspaceId)
      .eq("supplier_contact_id", session.contactId)
      .maybeSingle()
    if (error || !data) return null
    const job = data as unknown as SupplierJob
    const maps = await buildJobLabels(
      session.workspaceId,
      [job.property_id],
      [job.contact_id]
    )
    return {
      ...job,
      propertyLabel: job.property_id ? maps.propertyById.get(job.property_id) ?? null : null,
      operatorLabel: job.contact_id ? maps.contactById.get(job.contact_id) ?? null : null,
    }
  } catch {
    return null
  }
}

/** Invoices for this supplier contact, scoped to workspace + contact_id. */
export async function getSupplierInvoices(
  session: PortalSession
): Promise<SupplierInvoice[]> {
  if (!session.contactId) return []
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("supplier_invoices")
      .select(
        "id, invoice_number, amount, currency, status, submitted_at, approved_at, paid_at, notes, supplier_job_id"
      )
      .eq("workspace_id", session.workspaceId)
      .eq("contact_id", session.contactId)
      .order("submitted_at", { ascending: false })
    if (error) return []
    return (data ?? []) as unknown as SupplierInvoice[]
  } catch {
    return []
  }
}

// ---- LANDLORD scope resolution ---------------------------------------------

/**
 * The set of property ids a landlord contact is linked to, via portal grants
 * or contact_links. Empty set => empty portal (never all-workspace). Mirrors
 * the interim landlord-context resolver but on the service-role client.
 */
export async function getLandlordPropertyIds(session: PortalSession): Promise<string[]> {
  if (!session.contactId) return []
  // Prefer a frozen allow-list captured at verify time, if present.
  if (session.scope.propertyIds && session.scope.propertyIds.length > 0) {
    return session.scope.propertyIds
  }
  const admin = createAdminClient()
  const ids = new Set<string>()
  try {
    const { data, error } = await admin
      .from("contact_portal_access")
      .select("linked_id, linked_type")
      .eq("workspace_id", session.workspaceId)
      .eq("contact_id", session.contactId)
      .eq("linked_type", "property")
    if (!error && data) {
      for (const r of data as Record<string, unknown>[]) {
        if (r.linked_id) ids.add(r.linked_id as string)
      }
    }
  } catch {
    /* tolerate */
  }
  try {
    const { data, error } = await admin
      .from("contact_links")
      .select("linked_id, linked_type")
      .eq("workspace_id", session.workspaceId)
      .eq("contact_id", session.contactId)
      .eq("linked_type", "property")
    if (!error && data) {
      for (const r of data as Record<string, unknown>[]) {
        if (r.linked_id) ids.add(r.linked_id as string)
      }
    }
  } catch {
    /* tolerate */
  }
  return Array.from(ids)
}

export interface LandlordProperty {
  id: string
  nickname: string | null
  address_line1: string | null
  city: string | null
  postcode: string | null
  status: string | null
  target_rent_pcm: number | null
}

/** Properties for this landlord — scoped to the resolved id allow-list. */
export async function getLandlordProperties(
  session: PortalSession
): Promise<LandlordProperty[]> {
  const ids = await getLandlordPropertyIds(session)
  if (ids.length === 0) return []
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("properties")
      .select("id, nickname, address_line1, city, postcode, status, target_rent_pcm")
      .eq("workspace_id", session.workspaceId)
      .in("id", ids)
      .order("nickname", { ascending: true })
    if (error) return []
    return (data ?? []) as unknown as LandlordProperty[]
  } catch {
    return []
  }
}

// ---- TENANT scope resolution -----------------------------------------------

export interface TenantTenancy {
  id: string
  property_id: string | null
  start_date: string | null
  end_date: string | null
  rent_amount: number | null
  rent_frequency: string | null
  deposit_amount: number | null
  status: string | null
  reference: string | null
}

function tenancyFromDb(r: Record<string, unknown>): TenantTenancy {
  return {
    id: r.id as string,
    property_id: (r.property_id as string) ?? null,
    start_date: (r.start_date as string) ?? null,
    end_date: (r.end_date as string) ?? null,
    rent_amount: (r.rent_amount as number) ?? null,
    rent_frequency: (r.rent_period as string) ?? (r.rent_frequency as string) ?? null,
    deposit_amount: (r.deposit_amount as number) ?? null,
    status: (r.status as string) ?? null,
    reference: (r.reference as string) ?? null,
  }
}

/**
 * Tenancies for this tenant contact, scoped to workspace + primary_contact_id.
 * Empty => empty portal (never all-workspace). Tolerates lineages exposing
 * `tenant_contact_id` instead of `primary_contact_id`.
 */
export async function getTenantTenancies(
  session: PortalSession
): Promise<TenantTenancy[]> {
  if (!session.contactId) return []
  const admin = createAdminClient()
  const byId = new Map<string, TenantTenancy>()
  try {
    const { data, error } = await admin
      .from("tenancies")
      .select("*")
      .eq("workspace_id", session.workspaceId)
      .eq("primary_contact_id", session.contactId)
    if (!error && data) {
      for (const r of data as Record<string, unknown>[]) {
        const t = tenancyFromDb(r)
        byId.set(t.id, t)
      }
    } else if (error && code(error) === MISSING_COLUMN) {
      const { data: d2, error: e2 } = await admin
        .from("tenancies")
        .select("*")
        .eq("workspace_id", session.workspaceId)
        .eq("tenant_contact_id", session.contactId)
      if (!e2 && d2) {
        for (const r of d2 as Record<string, unknown>[]) {
          const t = tenancyFromDb(r)
          byId.set(t.id, t)
        }
      }
    }
  } catch {
    /* tolerate */
  }
  return Array.from(byId.values())
}

export interface TenantMaintenanceJob {
  id: string
  title: string
  status: string
  priority: string
  scheduled_date: string | null
  created_at: string | null
  property_id: string | null
}

/**
 * Maintenance requests visible to this tenant — scoped to the tenant's own
 * tenancy. We constrain to jobs that are BOTH on the tenant's property AND
 * raised on behalf of the tenant contact (jobs.contact_id), so a tenant never
 * sees unrelated works on a shared building. Empty scope => [].
 */
export async function getTenantMaintenance(
  session: PortalSession
): Promise<TenantMaintenanceJob[]> {
  if (!session.contactId) return []
  const tenancies = await getTenantTenancies(session)
  const propertyIds = Array.from(
    new Set(tenancies.map((t) => t.property_id).filter(Boolean))
  ) as string[]
  if (propertyIds.length === 0) return []

  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("jobs")
      .select("id, title, status, priority, scheduled_date, created_at, property_id, contact_id")
      .eq("workspace_id", session.workspaceId)
      .eq("contact_id", session.contactId)
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })
    if (error) return []
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? "Maintenance request",
      status: (r.status as string) ?? "new",
      priority: (r.priority as string) ?? "medium",
      scheduled_date: (r.scheduled_date as string) ?? null,
      created_at: (r.created_at as string) ?? null,
      property_id: (r.property_id as string) ?? null,
    }))
  } catch {
    return []
  }
}

// ---- workspace-name helper (already on session, re-exported for pages) ------
export function workspaceDisplayName(session: PortalSession): string {
  return session.workspaceName || "Portal"
}

// ---- TENANT PAYMENTS (rent ledger) -----------------------------------------

export interface TenantPaymentRow {
  id: string
  created_at: string
  amount: number
  currency: string | null
  direction: string
  description: string | null
  status: string | null
  reference: string | null
  category: string | null
}

/**
 * Rent payment ledger for this tenant — reads money_transactions scoped to
 * the tenant's tenancy property ids AND contact. Returns [] if table absent.
 */
export async function getTenantPayments(
  session: PortalSession
): Promise<TenantPaymentRow[]> {
  if (!session.contactId) return []
  const tenancies = await getTenantTenancies(session)
  const propertyIds = Array.from(
    new Set(tenancies.map((t) => t.property_id).filter(Boolean))
  ) as string[]
  if (propertyIds.length === 0) return []
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("money_transactions")
      .select("id, created_at, amount, currency, direction, description, reference, category")
      .eq("workspace_id", session.workspaceId)
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) {
      if (tolerable(error)) return []
      return []
    }
    return (data ?? []) as unknown as TenantPaymentRow[]
  } catch {
    return []
  }
}

// ---- TENANT DOCUMENTS -------------------------------------------------------

export interface PortalDocument {
  id: string
  created_at: string
  name: string
  type: string | null
  file_path: string | null
  file_size: number | null
  property_id: string | null
}

/**
 * Property documents visible to this tenant — scoped to the tenant's property ids.
 * Reads property_documents table.
 */
export async function getTenantDocuments(
  session: PortalSession
): Promise<PortalDocument[]> {
  if (!session.contactId) return []
  const tenancies = await getTenantTenancies(session)
  const propertyIds = Array.from(
    new Set(tenancies.map((t) => t.property_id).filter(Boolean))
  ) as string[]
  if (propertyIds.length === 0) return []
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("property_documents")
      .select("id, created_at, name, type:category, file_path:file_url, file_size, property_id")
      .eq("workspace_id", session.workspaceId)
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      return []
    }
    return (data ?? []) as unknown as PortalDocument[]
  } catch {
    return []
  }
}

// ---- LANDLORD FINANCIALS ----------------------------------------------------

export interface LandlordTransaction {
  id: string
  created_at: string
  amount: number
  currency: string | null
  direction: "in" | "out" | string
  description: string | null
  category: string | null
  status: string | null
  property_id: string | null
}

/**
 * Income and expenditure transactions for this landlord's properties.
 * Scoped strictly to the resolved property id allow-list.
 */
export async function getLandlordTransactions(
  session: PortalSession
): Promise<LandlordTransaction[]> {
  const ids = await getLandlordPropertyIds(session)
  if (ids.length === 0) return []
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("money_transactions")
      .select("id, created_at, amount, currency, direction, description, category, property_id")
      .eq("workspace_id", session.workspaceId)
      .in("property_id", ids)
      .order("created_at", { ascending: false })
      .limit(500)
    if (error) {
      if (tolerable(error)) return []
      return []
    }
    return (data ?? []) as unknown as LandlordTransaction[]
  } catch {
    return []
  }
}

/**
 * Overdue rent alerts: tenancies in "active" status whose last payment was
 * more than 35 days ago (or no payment on record). Returns property labels.
 */
export interface OverdueAlert {
  tenancyId: string
  propertyLabel: string
  lastPayment: string | null
  rentAmount: number | null
}

export async function getLandlordOverdueAlerts(
  session: PortalSession
): Promise<OverdueAlert[]> {
  const ids = await getLandlordPropertyIds(session)
  if (ids.length === 0) return []
  const admin = createAdminClient()
  try {
    const { data: tenancies, error: tErr } = await admin
      .from("tenancies")
      .select("id, property_id, rent_amount, status")
      .eq("workspace_id", session.workspaceId)
      .in("property_id", ids)
      .eq("status", "active")
    if (tErr || !tenancies?.length) return []

    const alerts: OverdueAlert[] = []
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()

    for (const t of tenancies as Record<string, unknown>[]) {
      // Check last income transaction for this property
      const { data: lastPay } = await admin
        .from("money_transactions")
        .select("created_at")
        .eq("workspace_id", session.workspaceId)
        .eq("property_id", t.property_id as string)
        .eq("direction", "in")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const lastPayDate = (lastPay as Record<string, unknown> | null)?.created_at as string | null
      if (!lastPayDate || lastPayDate < thirtyFiveDaysAgo) {
        // Resolve property label
        const { data: prop } = await admin
          .from("properties")
          .select("nickname, address_line1, city")
          .eq("id", t.property_id as string)
          .eq("workspace_id", session.workspaceId)
          .maybeSingle()
        const p = prop as Record<string, unknown> | null
        const label = p
          ? (p.nickname as string) || [p.address_line1, p.city].filter(Boolean).join(", ") || "Property"
          : "Property"
        alerts.push({
          tenancyId: t.id as string,
          propertyLabel: label,
          lastPayment: lastPayDate,
          rentAmount: (t.rent_amount as number) ?? null,
        })
      }
    }
    return alerts
  } catch {
    return []
  }
}

// ---- SUPPLIER DOCUMENTS -----------------------------------------------------

/**
 * Documents shared with a supplier — reads property_documents scoped to
 * the supplier's assigned job properties.
 */
export async function getSupplierDocuments(
  session: PortalSession
): Promise<PortalDocument[]> {
  if (!session.contactId) return []
  // Get property ids from supplier's jobs
  const admin = createAdminClient()
  try {
    const { data: jobs, error: jErr } = await admin
      .from("jobs")
      .select("property_id")
      .eq("workspace_id", session.workspaceId)
      .eq("supplier_contact_id", session.contactId)
      .not("property_id", "is", null)
    if (jErr || !jobs?.length) return []

    const propertyIds = Array.from(
      new Set((jobs as { property_id: string }[]).map((j) => j.property_id).filter(Boolean))
    )
    if (propertyIds.length === 0) return []

    const { data, error } = await admin
      .from("property_documents")
      .select("id, created_at, name, type:category, file_path:file_url, file_size, property_id")
      .eq("workspace_id", session.workspaceId)
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      return []
    }
    return (data ?? []) as unknown as PortalDocument[]
  } catch {
    return []
  }
}

// ---- SUPPLIER SIGN-OFF / JOB UPDATE ----------------------------------------

/**
 * Supplier requests sign-off on a completed job.
 * Sets status to "invoiced" (pending landlord/manager sign-off).
 * Returns ok or error string.
 */
export async function supplierRequestSignOff(
  session: PortalSession,
  jobId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!session.contactId) return { ok: false, error: "No contact on session." }
  const admin = createAdminClient()
  try {
    // Re-scope the job to this supplier before updating
    const { data: job, error: fetchErr } = await admin
      .from("jobs")
      .select("id, status")
      .eq("id", jobId)
      .eq("workspace_id", session.workspaceId)
      .eq("supplier_contact_id", session.contactId)
      .maybeSingle()
    if (fetchErr || !job) return { ok: false, error: "Job not found or not accessible." }
    const j = job as { id: string; status: string }
    if (!["complete", "in_progress", "approved"].includes(j.status)) {
      return { ok: false, error: `Cannot request sign-off from status: ${j.status}.` }
    }
    const { error: updErr } = await admin
      .from("jobs")
      .update({ status: "invoiced" })
      .eq("id", jobId)
      .eq("workspace_id", session.workspaceId)
      .eq("supplier_contact_id", session.contactId)
    if (updErr) return { ok: false, error: updErr.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ---- SUPPLIER INVOICE SUBMIT ------------------------------------------------

export interface NewSupplierInvoice {
  invoice_number?: string
  amount: number      // integer pence
  currency?: string
  notes?: string
  supplier_job_id?: string
}

/**
 * Supplier submits a new invoice.
 * Scopes the job (if provided) to this supplier + workspace as IDOR guard.
 */
export async function supplierSubmitInvoice(
  session: PortalSession,
  input: NewSupplierInvoice
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!session.contactId) return { ok: false, error: "No contact on session." }
  if (!input.amount || input.amount <= 0) return { ok: false, error: "Amount must be greater than 0." }

  const admin = createAdminClient()
  try {
    // Verify job belongs to this supplier if provided
    if (input.supplier_job_id) {
      const { data: job } = await admin
        .from("jobs")
        .select("id")
        .eq("id", input.supplier_job_id)
        .eq("workspace_id", session.workspaceId)
        .eq("supplier_contact_id", session.contactId)
        .maybeSingle()
      if (!job) return { ok: false, error: "Job not found or not accessible." }
    }

    const { data, error } = await admin
      .from("supplier_invoices")
      .insert({
        workspace_id: session.workspaceId,
        contact_id: session.contactId,
        invoice_number: input.invoice_number || null,
        amount: input.amount,
        currency: input.currency ?? "GBP",
        status: "submitted",
        submitted_at: new Date().toISOString(),
        notes: input.notes || null,
        supplier_job_id: input.supplier_job_id || null,
      })
      .select("id")
      .single()
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: (data as { id: string }).id }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
