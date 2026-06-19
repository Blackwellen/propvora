"use client"

import { createClient } from "@/lib/supabase/client"

// ============================================================
// Tenant / Occupier portal — live context resolver
//
// External tenant auth (magic-link / portal session) is NOT built yet.
// Like the supplier and landlord portals, this resolves the tenant
// *contact* the portal should show data for, from the signed-in
// Supabase user:
//
//   1. `contact_portal_access` row linked by user_id with a tenant-type
//      access_type ('tenant' | 'occupier') and status='active' — the
//      intended production link once external auth lands, OR
//   2. fallback — a `contacts` row of a tenant-type
//      (type IN ('tenant','post_tenant','applicant')) whose email matches
//      the signed-in user's email (single-tenant / demo).
//
// Both paths return the tenant contact id + workspace id, which every
// page uses to query LIVE data scoped STRICTLY to this tenant's own
// tenancy. Every query is 42P01-safe.
//
// PRODUCTION GAP: replace this with a real external portal session
// (signed token → contact) + RLS for non-workspace users, so tenants
// authenticate without a full Supabase user account inside the workspace.
// ============================================================

/** access_type values that grant a tenant/occupier portal session. */
export const TENANT_ACCESS_TYPES = ["tenant", "occupier"] as const
/** contacts.type values that map to a tenant/occupier in the email fallback. */
export const TENANT_CONTACT_TYPES = ["tenant"] as const

export interface TenantContext {
  contactId: string
  workspaceId: string | null
  displayName: string
  email: string | null
  source: "portal_access" | "email_match" | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

/** Resolve the live tenant contact for the current session. Returns null if none. */
export async function resolveTenantContext(): Promise<TenantContext | null> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  // Email-match fallback against the live tenant contact enum. The unified
  // contact_portal_access table does not yet expose user_id in the live schema.
  if (user.email) {
    try {
      const { data: contact, error } = await supabase
        .from("contacts")
        .select("id, workspace_id, display_name, email")
        .in("type", TENANT_CONTACT_TYPES as unknown as string[])
        .ilike("email", user.email)
        .limit(1)
        .maybeSingle()

      if (error && code(error) !== "42P01") {
        return null
      }
      if (contact?.id) {
        return {
          contactId: contact.id as string,
          workspaceId: (contact.workspace_id as string) ?? null,
          displayName: (contact.display_name as string) ?? "Tenant",
          email: (contact.email as string) ?? user.email,
          source: "email_match",
        }
      }
    } catch {
      /* tolerate */
    }
  }

  return null
}

// ============================================================
// Tenant → tenancy linking
//
// A tenant links to their tenancy in priority order:
//
//   1. The live `tenancies` table where primary_contact_id = <tenant>.
//      The app's useTenancies adapter maps the live `primary_contact_id`
//      column to the logical `tenant_contact_id`, so we query the live
//      column name directly here. (We also tolerate `tenant_contact_id`
//      on lineages that expose it.)
//   2. `contact_portal_access` rows for this tenant contact where
//      linked_type='tenancy' (a grant scoped to a specific tenancy).
//
// We resolve the set of tenancy rows this tenant is linked to and scope
// EVERY downstream query to that set (and to the property/unit ids on
// those tenancies). If neither path yields a tenancy we return an EMPTY
// set — we NEVER fall back to all-workspace tenancies, which would leak
// other tenants' data. 42P01-safe.
// ============================================================

export interface TenancyLite {
  id: string
  workspace_id: string | null
  property_id: string | null
  unit_id: string | null
  start_date: string | null
  end_date: string | null
  rent_amount: number | null
  rent_frequency: string | null
  deposit_amount: number | null
  deposit_scheme: string | null
  deposit_reference: string | null
  status: string | null
  tenancy_type: string | null
  reference: string | null
}

/** Map a raw live `tenancies` row (primary_contact_id / rent_period / deposit_ref) to TenancyLite. */
function tenancyFromDb(r: Record<string, unknown>): TenancyLite {
  return {
    id: r.id as string,
    workspace_id: (r.workspace_id as string) ?? null,
    property_id: (r.property_id as string) ?? null,
    unit_id: (r.unit_id as string) ?? null,
    start_date: (r.start_date as string) ?? null,
    end_date: (r.end_date as string) ?? null,
    rent_amount: (r.rent_amount as number) ?? null,
    rent_frequency: (r.rent_period as string) ?? (r.rent_frequency as string) ?? null,
    deposit_amount: (r.deposit_amount as number) ?? null,
    deposit_scheme: (r.deposit_scheme as string) ?? null,
    deposit_reference: (r.deposit_ref as string) ?? (r.deposit_reference as string) ?? null,
    status: (r.status as string) ?? null,
    tenancy_type: (r.tenancy_type as string) ?? null,
    reference: (r.reference as string) ?? null,
  }
}

/** Resolve the live tenancy rows this tenant contact is linked to (strictly scoped). */
export async function resolveTenantTenancies(
  contactId: string,
  workspaceId: string | null
): Promise<TenancyLite[]> {
  const supabase = createClient()
  const byId = new Map<string, TenancyLite>()

  // 1. Direct link via the live tenancies.primary_contact_id column
  try {
    let q = supabase
      .from("tenancies")
      .select("*")
      .eq("primary_contact_id", contactId)
    if (workspaceId) q = q.eq("workspace_id", workspaceId)
    const { data, error } = await q
    if (!error && data) {
      for (const r of data as Record<string, unknown>[]) {
        const t = tenancyFromDb(r)
        byId.set(t.id, t)
      }
    } else if (error && code(error) === "42703") {
      // Lineage doesn't expose primary_contact_id — retry the logical column.
      let q2 = supabase
        .from("tenancies")
        .select("*")
        .eq("tenant_contact_id", contactId)
      if (workspaceId) q2 = q2.eq("workspace_id", workspaceId)
      const { data: d2, error: e2 } = await q2
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

  // 2. tenancy-scoped portal grants (linked_type='tenancy')
  try {
    let q = supabase
      .from("contact_portal_access")
      .select("linked_id, linked_type")
      .eq("contact_id", contactId)
      .eq("linked_type", "tenancy")
    if (workspaceId) q = q.eq("workspace_id", workspaceId)
    const { data, error } = await q
    if (!error && data) {
      const grantedIds = (data as Record<string, unknown>[])
        .map((r) => r.linked_id as string)
        .filter((id) => id && !byId.has(id))
      if (grantedIds.length > 0) {
        const { data: trows, error: terr } = await supabase
          .from("tenancies")
          .select("*")
          .in("id", grantedIds)
        if (!terr && trows) {
          for (const r of trows as Record<string, unknown>[]) {
            const t = tenancyFromDb(r)
            byId.set(t.id, t)
          }
        }
      }
    }
  } catch {
    /* tolerate */
  }

  return Array.from(byId.values())
}

/** Distinct property ids across this tenant's tenancies. */
export function tenancyPropertyIds(tenancies: TenancyLite[]): string[] {
  return Array.from(new Set(tenancies.map((t) => t.property_id).filter(Boolean))) as string[]
}

/** Distinct tenancy ids. */
export function tenancyIds(tenancies: TenancyLite[]): string[] {
  return Array.from(new Set(tenancies.map((t) => t.id)))
}

// ============================================================
// Money / date formatting — Intl, GBP default
// ============================================================

export function formatMoney(amount: number | null | undefined, currency = "GBP"): string {
  const value = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }
}

export function formatDate(d: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return "—"
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(
    "en-GB",
    opts ?? { day: "numeric", month: "short", year: "numeric" }
  )
}

// ============================================================
// Property presentation
// ============================================================

export interface PropertyLite {
  id: string
  nickname: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postcode: string | null
  status: string | null
}

export function propertyLabel(p: {
  nickname?: string | null
  address_line1?: string | null
  city?: string | null
}): string {
  return (
    p.nickname ||
    [p.address_line1, p.city].filter(Boolean).join(", ") ||
    "Property"
  )
}

// ============================================================
// Tenancy presentation
// ============================================================

export const TENANCY_STATUS_META: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "sky" }
> = {
  pending: { label: "Pending", variant: "sky" },
  active: { label: "Active", variant: "success" },
  ended: { label: "Ended", variant: "default" },
  disputed: { label: "Disputed", variant: "danger" },
  surrendered: { label: "Surrendered", variant: "warning" },
}

export function tenancyStatusMeta(status: string | null | undefined) {
  if (!status) return { label: "Unknown", variant: "default" as const }
  return TENANCY_STATUS_META[status] ?? { label: status, variant: "default" as const }
}

export function rentFrequencyLabel(freq: string | null | undefined): string {
  switch (freq) {
    case "weekly":
      return "per week"
    case "monthly":
      return "per month"
    case "quarterly":
      return "per quarter"
    case "annually":
      return "per year"
    default:
      return "per month"
  }
}

// ============================================================
// Maintenance / jobs status (the tenant's own requests)
// ============================================================

export const JOB_STATUS_META: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "sky" | "ai" }
> = {
  new: { label: "Submitted", variant: "sky" },
  scoped: { label: "Reviewing", variant: "sky" },
  supplier_requested: { label: "Arranging", variant: "warning" },
  quote_received: { label: "Arranging", variant: "ai" },
  approved: { label: "Approved", variant: "primary" },
  scheduled: { label: "Scheduled", variant: "primary" },
  in_progress: { label: "In Progress", variant: "primary" },
  complete: { label: "Resolved", variant: "success" },
  invoiced: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "default" },
  disputed: { label: "Disputed", variant: "danger" },
}

export function jobStatusMeta(status: string) {
  return JOB_STATUS_META[status] ?? { label: status, variant: "default" as const }
}

/** A maintenance request still in progress. */
export function isOpenJob(status: string): boolean {
  return !["complete", "invoiced", "closed", "disputed"].includes(status)
}
