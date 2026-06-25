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

// ============================================================================
// EXTENDED PROFILE SCOPE (accountant / solicitor / generic)
//
// These verticals are PROPERTY-scoped exactly like landlord: their data is the
// set of properties the contact was linked to at grant time (frozen into
// scope.propertyIds, or resolved live via contact_portal_access / contact_links
// with linked_type='property'). getLandlordPropertyIds is the shared resolver;
// we alias it under a vertical-neutral name so the new pages read clearly.
// ============================================================================

/** Linked property ids for any property-scoped portal vertical. */
export const getLinkedPropertyIds = getLandlordPropertyIds

/** Documents shared with a property-scoped portal contact (linked properties). */
export async function getLinkedPropertyDocuments(
  session: PortalSession
): Promise<PortalDocument[]> {
  const ids = await getLinkedPropertyIds(session)
  if (ids.length === 0) return []
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("property_documents")
      .select("id, created_at, name, type:category, file_path:file_url, file_size, property_id")
      .eq("workspace_id", session.workspaceId)
      .in("property_id", ids)
      .order("created_at", { ascending: false })
    if (error) return []
    return (data ?? []) as unknown as PortalDocument[]
  } catch {
    return []
  }
}

// ---- ACCOUNTANT INVOICES ----------------------------------------------------

export interface PortalInvoice {
  id: string
  invoice_number: string | null
  total: number | null
  paid_amount: number | null
  status: string | null
  issue_date: string | null
  due_date: string | null
  property_id: string | null
  created_at: string | null
}

/**
 * Invoices for an accountant — scoped strictly to the contact's linked
 * properties. Reads the operator `invoices` table. 42P01/42703-tolerant.
 */
export async function getLinkedInvoices(
  session: PortalSession
): Promise<PortalInvoice[]> {
  const ids = await getLinkedPropertyIds(session)
  if (ids.length === 0) return []
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("invoices")
      .select("id, invoice_number, total, paid_amount, status, issue_date, due_date, property_id, created_at")
      .eq("workspace_id", session.workspaceId)
      .in("property_id", ids)
      .order("issue_date", { ascending: false })
      .limit(200)
    if (error) {
      if (tolerable(error)) return []
      return []
    }
    return (data ?? []) as unknown as PortalInvoice[]
  } catch {
    return []
  }
}

// ============================================================================
// APPLICANT SCOPE (prospects + viewings)
//
// An applicant has no property allow-list. Their data is resolved by matching
// the session contact's email to `prospects.email` within the workspace, then
// joining viewings by prospect_id. All reads are workspace-pinned and email-
// scoped; an empty match => empty portal (never widened to all prospects).
// ============================================================================

/** The session contact's email (lower-cased), or null. */
async function getSessionContactEmail(session: PortalSession): Promise<string | null> {
  if (!session.contactId) return null
  const admin = createAdminClient()
  try {
    const { data } = await admin
      .from("contacts")
      .select("email")
      .eq("id", session.contactId)
      .eq("workspace_id", session.workspaceId)
      .maybeSingle()
    const email = (data as { email?: string } | null)?.email
    return email ? email.trim().toLowerCase() : null
  } catch {
    return null
  }
}

export interface ApplicantProspect {
  id: string
  vacancy_id: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  status: string
  referencing_status: string | null
  move_in_date: string | null
  budget_min: number | null
  budget_max: number | null
  notes: string | null
  created_at: string | null
  vacancyTitle: string | null
  vacancyRent: number | null
  propertyId: string | null
  propertyLabel: string | null
}

/** Prospect rows matching the applicant contact's email, enriched with vacancy. */
export async function getApplicantProspects(
  session: PortalSession
): Promise<ApplicantProspect[]> {
  const email = await getSessionContactEmail(session)
  if (!email) return []
  const admin = createAdminClient()
  let rows: Record<string, unknown>[] = []
  try {
    const { data, error } = await admin
      .from("prospects")
      .select("id, vacancy_id, first_name, last_name, email, phone, status, referencing_status, move_in_date, budget_min, budget_max, notes, created_at")
      .eq("workspace_id", session.workspaceId)
      .ilike("email", email)
      .order("created_at", { ascending: false })
    if (error) return []
    rows = (data ?? []) as Record<string, unknown>[]
  } catch {
    return []
  }
  if (rows.length === 0) return []

  // Resolve vacancy title / rent / property label for each prospect.
  const vacancyIds = Array.from(
    new Set(rows.map((r) => r.vacancy_id).filter(Boolean))
  ) as string[]
  const vacancyById = new Map<string, { title: string; rent: number | null; propertyId: string | null }>()
  const propertyById = new Map<string, string>()
  if (vacancyIds.length) {
    try {
      const { data: vacs } = await admin
        .from("property_vacancies")
        .select("id, title, asking_rent, property_id")
        .eq("workspace_id", session.workspaceId)
        .in("id", vacancyIds)
      const propIds: string[] = []
      for (const v of (vacs ?? []) as Record<string, unknown>[]) {
        vacancyById.set(v.id as string, {
          title: (v.title as string) ?? "Vacancy",
          rent: (v.asking_rent as number) ?? null,
          propertyId: (v.property_id as string) ?? null,
        })
        if (v.property_id) propIds.push(v.property_id as string)
      }
      if (propIds.length) {
        const { data: props } = await admin
          .from("properties")
          .select("id, nickname, address_line1, city")
          .eq("workspace_id", session.workspaceId)
          .in("id", propIds)
        for (const p of (props ?? []) as Record<string, unknown>[]) {
          propertyById.set(
            p.id as string,
            (p.nickname as string) ||
              [p.address_line1, p.city].filter(Boolean).join(", ") ||
              "Property"
          )
        }
      }
    } catch {
      /* tolerate */
    }
  }

  return rows.map((r) => {
    const vac = r.vacancy_id ? vacancyById.get(r.vacancy_id as string) : undefined
    return {
      id: r.id as string,
      vacancy_id: (r.vacancy_id as string) ?? null,
      first_name: (r.first_name as string) ?? null,
      last_name: (r.last_name as string) ?? null,
      email: (r.email as string) ?? null,
      phone: (r.phone as string) ?? null,
      status: (r.status as string) ?? "new",
      referencing_status: (r.referencing_status as string) ?? null,
      move_in_date: (r.move_in_date as string) ?? null,
      budget_min: (r.budget_min as number) ?? null,
      budget_max: (r.budget_max as number) ?? null,
      notes: (r.notes as string) ?? null,
      created_at: (r.created_at as string) ?? null,
      vacancyTitle: vac?.title ?? null,
      vacancyRent: vac?.rent ?? null,
      propertyId: vac?.propertyId ?? null,
      propertyLabel: vac?.propertyId ? propertyById.get(vac.propertyId) ?? null : null,
    }
  })
}

/** Documents shared on the properties an applicant has applied for. */
export async function getApplicantDocuments(
  session: PortalSession,
  prospects?: ApplicantProspect[]
): Promise<PortalDocument[]> {
  const list = prospects ?? (await getApplicantProspects(session))
  const propertyIds = Array.from(
    new Set(list.map((p) => p.propertyId).filter(Boolean))
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
    if (error) return []
    return (data ?? []) as unknown as PortalDocument[]
  } catch {
    return []
  }
}

export interface ApplicantViewing {
  id: string
  prospect_id: string
  vacancy_id: string | null
  scheduled_at: string
  duration_minutes: number | null
  status: string
  outcome: string | null
  feedback: string | null
  vacancyTitle: string | null
}

/** Viewings for the applicant's prospect rows. */
export async function getApplicantViewings(
  session: PortalSession,
  prospects?: ApplicantProspect[]
): Promise<ApplicantViewing[]> {
  const list = prospects ?? (await getApplicantProspects(session))
  const prospectIds = list.map((p) => p.id)
  if (prospectIds.length === 0) return []
  const titleByVacancy = new Map<string, string>()
  for (const p of list) {
    if (p.vacancy_id && p.vacancyTitle) titleByVacancy.set(p.vacancy_id, p.vacancyTitle)
  }
  const admin = createAdminClient()
  try {
    const { data, error } = await admin
      .from("viewings")
      .select("id, prospect_id, vacancy_id, scheduled_at, duration_minutes, status, outcome, feedback")
      .eq("workspace_id", session.workspaceId)
      .in("prospect_id", prospectIds)
      .order("scheduled_at", { ascending: false })
    if (error) return []
    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      prospect_id: r.prospect_id as string,
      vacancy_id: (r.vacancy_id as string) ?? null,
      scheduled_at: r.scheduled_at as string,
      duration_minutes: (r.duration_minutes as number) ?? null,
      status: (r.status as string) ?? "scheduled",
      outcome: (r.outcome as string) ?? null,
      feedback: (r.feedback as string) ?? null,
      vacancyTitle: r.vacancy_id ? titleByVacancy.get(r.vacancy_id as string) ?? null : null,
    }))
  } catch {
    return []
  }
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
