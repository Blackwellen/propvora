"use client"

import { createClient } from "@/lib/supabase/client"

// ============================================================
// Landlord / Owner portal — live context resolver
//
// External landlord auth (magic-link / portal session) is NOT built yet.
// Like the supplier portal, this resolves the landlord *contact* the
// portal should show data for, from the signed-in Supabase user:
//
//   1. `contact_portal_access` row linked by user_id with an owner-type
//      access_type ('landlord' | 'owner' | 'investor') — the intended
//      production link once external auth lands, OR
//   2. fallback — a `contacts` row of an owner type
//      (type IN ('landlord','owner','investor')) whose email matches the
//      signed-in user's email (single-tenant / demo).
//
// Both paths return the landlord contact id + workspace id, which every
// page uses to query LIVE data scoped strictly to this landlord. Every
// query is 42P01-safe.
//
// PRODUCTION GAP: replace this with a real external portal session
// (signed token → contact) + RLS for non-workspace users, so landlords
// authenticate without a full Supabase user account inside the workspace.
// ============================================================

export const OWNER_CONTACT_TYPES = ["landlord", "owner", "investor"] as const

export interface LandlordContext {
  contactId: string
  workspaceId: string | null
  displayName: string
  email: string | null
  source: "portal_access" | "email_match" | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

/** Resolve the live landlord contact for the current session. Returns null if none. */
export async function resolveLandlordContext(): Promise<LandlordContext | null> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  // 1. contact_portal_access (intended production link — unified grants table)
  try {
    const { data: access, error } = await supabase
      .from("contact_portal_access")
      .select("contact_id, workspace_id, access_type")
      .eq("user_id", user.id)
      .in("access_type", OWNER_CONTACT_TYPES as unknown as string[])
      .eq("status", "active")
      .limit(1)
      .maybeSingle()

    if (error && code(error) !== "42P01") {
      // non-fatal — fall through to email match
    }
    if (access?.contact_id) {
      const c = await loadContact(access.contact_id as string)
      return {
        contactId: access.contact_id as string,
        workspaceId: (access.workspace_id as string) ?? c?.workspace_id ?? null,
        displayName: c?.displayName ?? "Landlord",
        email: c?.email ?? user.email ?? null,
        source: "portal_access",
      }
    }
  } catch {
    /* tolerate */
  }

  // 2. Email-match fallback against live owner-type contacts
  if (user.email) {
    try {
      const { data: contact, error } = await supabase
        .from("contacts")
        .select("id, workspace_id, display_name, email")
        .in("type", OWNER_CONTACT_TYPES as unknown as string[])
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
          displayName: (contact.display_name as string) ?? "Landlord",
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

async function loadContact(
  contactId: string
): Promise<{ workspace_id: string | null; displayName: string; email: string | null } | null> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("workspace_id, display_name, email")
      .eq("id", contactId)
      .maybeSingle()
    if (error) return null
    return {
      workspace_id: (data?.workspace_id as string) ?? null,
      displayName: (data?.display_name as string) ?? "Landlord",
      email: (data?.email as string) ?? null,
    }
  } catch {
    return null
  }
}

// ============================================================
// Landlord → property linking
//
// There is NO direct owner column on the live `properties` table. The
// landlord↔property relationship is expressed through link tables, in
// priority order:
//
//   1. `contact_portal_access` rows for this landlord contact where
//      linked_type='property' (a grant scoped to a specific property), OR
//   2. `contact_links` rows where contact_id=<landlord>,
//      linked_type='property' (the general ownership/association link).
//
// We resolve the set of property ids this landlord is linked to and scope
// EVERY downstream query to that set. If neither table yields any property
// ids we return an EMPTY set — we never fall back to "all workspace
// properties", which would leak other landlords' data. 42P01-safe.
// ============================================================

/** Resolve the distinct property ids this landlord contact is linked to. */
export async function resolveLandlordPropertyIds(
  contactId: string,
  workspaceId: string | null
): Promise<string[]> {
  const supabase = createClient()
  const ids = new Set<string>()

  // 1. property-scoped portal grants
  try {
    let q = supabase
      .from("contact_portal_access")
      .select("linked_id, linked_type")
      .eq("contact_id", contactId)
      .eq("linked_type", "property")
    if (workspaceId) q = q.eq("workspace_id", workspaceId)
    const { data, error } = await q
    if (!error && data) {
      for (const r of data as Record<string, unknown>[]) {
        if (r.linked_id) ids.add(r.linked_id as string)
      }
    }
  } catch {
    /* tolerate */
  }

  // 2. contact_links (general ownership / association)
  try {
    let q = supabase
      .from("contact_links")
      .select("linked_id, linked_type")
      .eq("contact_id", contactId)
      .eq("linked_type", "property")
    if (workspaceId) q = q.eq("workspace_id", workspaceId)
    const { data, error } = await q
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

// ============================================================
// Money formatting — Intl, GBP default
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
  template: string | null
  bedrooms: number | null
  bathrooms: number | null
  target_rent_pcm: number | null
  cover_image_url: string | null
}

export function propertyLabel(p: { nickname?: string | null; address_line1?: string | null; city?: string | null }): string {
  return (
    p.nickname ||
    [p.address_line1, p.city].filter(Boolean).join(", ") ||
    "Property"
  )
}

export const PROPERTY_STATUS_META: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "sky" }
> = {
  active: { label: "Occupied", variant: "success" },
  occupied: { label: "Occupied", variant: "success" },
  vacant: { label: "Vacant", variant: "warning" },
  under_works: { label: "Under Works", variant: "sky" },
  archived: { label: "Archived", variant: "default" },
  disposed: { label: "Disposed", variant: "default" },
}

export function propertyStatusMeta(status: string | null | undefined) {
  if (!status) return { label: "Unknown", variant: "default" as const }
  return PROPERTY_STATUS_META[status] ?? { label: status, variant: "default" as const }
}

/** A property is treated as occupied when status is active/occupied. */
export function isOccupied(status: string | null | undefined): boolean {
  return status === "active" || status === "occupied"
}

// ============================================================
// Work / jobs status (read-only summaries for the owner)
// ============================================================

export const JOB_STATUS_META: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "sky" | "ai" }
> = {
  new: { label: "New", variant: "sky" },
  scoped: { label: "Scoped", variant: "sky" },
  supplier_requested: { label: "Quote Requested", variant: "warning" },
  quote_received: { label: "Quote Received", variant: "ai" },
  approved: { label: "Approved", variant: "primary" },
  scheduled: { label: "Scheduled", variant: "primary" },
  in_progress: { label: "In Progress", variant: "primary" },
  complete: { label: "Complete", variant: "success" },
  invoiced: { label: "Invoiced", variant: "success" },
  closed: { label: "Closed", variant: "default" },
  disputed: { label: "Disputed", variant: "danger" },
}

export function jobStatusMeta(status: string) {
  return JOB_STATUS_META[status] ?? { label: status, variant: "default" as const }
}

/** Work the owner still has open on their properties. */
export function isOpenJob(status: string): boolean {
  return !["complete", "invoiced", "closed", "disputed"].includes(status)
}
