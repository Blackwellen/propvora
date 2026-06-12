"use client"

import { createClient } from "@/lib/supabase/client"

// ============================================================
// Supplier portal — live context resolver
//
// External supplier auth (magic-link / portal session) is NOT built yet.
// The current context mechanism resolves the supplier *contact* the
// portal should show data for, from the signed-in Supabase user:
//
//   1. `supplier_portal_access` row linked by user_id (the intended
//      production link once external auth lands), OR
//   2. fallback — a `contacts` row of type='supplier' whose email
//      matches the signed-in user's email (single-tenant / demo).
//
// Both paths return the supplier contact id + workspace id, which every
// page uses to query LIVE jobs (jobs.supplier_contact_id) and invoices
// (supplier_invoices.contact_id). Every query is 42P01-safe.
//
// PRODUCTION GAP: replace this with a real external portal session
// (signed token → contact) so suppliers authenticate without a full
// Supabase user account.
// ============================================================

export interface SupplierContext {
  contactId: string
  workspaceId: string | null
  displayName: string
  email: string | null
  source: "portal_access" | "email_match" | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

/** Resolve the live supplier contact for the current session. Returns null if none. */
export async function resolveSupplierContext(): Promise<SupplierContext | null> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  // 1. supplier_portal_access (intended production link)
  try {
    const { data: access, error } = await supabase
      .from("supplier_portal_access")
      .select("contact_id, workspace_id")
      .eq("user_id", user.id)
      .eq("active", true)
      .limit(1)
      .maybeSingle()

    if (error && code(error) !== "42P01") {
      // non-fatal — fall through to email match
    }
    if (access?.contact_id) {
      const c = await loadContact(access.contact_id)
      return {
        contactId: access.contact_id,
        workspaceId: access.workspace_id ?? c?.workspace_id ?? null,
        displayName: c?.displayName ?? "Supplier",
        email: c?.email ?? user.email ?? null,
        source: "portal_access",
      }
    }
  } catch {
    /* tolerate */
  }

  // 2. Email-match fallback against live supplier contacts
  if (user.email) {
    try {
      const { data: contact, error } = await supabase
        .from("contacts")
        .select("id, workspace_id, display_name, email")
        .eq("type", "supplier")
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
          displayName: (contact.display_name as string) ?? "Supplier",
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
      displayName: (data?.display_name as string) ?? "Supplier",
      email: (data?.email as string) ?? null,
    }
  } catch {
    return null
  }
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
// Live `jobs` status model (matches the jobs.status CHECK enum)
// ============================================================

export type JobStatus =
  | "new"
  | "scoped"
  | "supplier_requested"
  | "quote_received"
  | "approved"
  | "scheduled"
  | "in_progress"
  | "complete"
  | "invoiced"
  | "closed"
  | "disputed"

export const JOB_STATUS_META: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "sky" | "ai" }
> = {
  new: { label: "New", variant: "sky" },
  scoped: { label: "Scoped", variant: "sky" },
  supplier_requested: { label: "Quote Requested", variant: "warning" },
  quote_received: { label: "Quote Sent", variant: "ai" },
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

/** Jobs the supplier still has open work on. */
export function isOpenJob(status: string): boolean {
  return !["complete", "invoiced", "closed", "disputed"].includes(status)
}

export const INVOICE_STATUS_META: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "sky" }
> = {
  submitted: { label: "Submitted", variant: "sky" },
  reviewing: { label: "Reviewing", variant: "warning" },
  approved: { label: "Approved", variant: "primary" },
  rejected: { label: "Rejected", variant: "danger" },
  paid: { label: "Paid", variant: "success" },
}

export function invoiceStatusMeta(status: string) {
  return INVOICE_STATUS_META[status] ?? { label: status, variant: "default" as const }
}

// ============================================================
// Job enrichment — resolve property + operator labels in batch.
//
// `jobs` has TWO FKs to `contacts` (contact_id + supplier_contact_id),
// so an embedded `contacts(...)` join is ambiguous in PostgREST.
// We instead resolve names with two batched `.in()` lookups against the
// live `properties` (nickname) and `contacts` (display_name/company)
// tables. 42P01-safe.
// ============================================================

export interface JobLabelMaps {
  propertyById: Map<string, string>
  contactById: Map<string, string>
}

export async function buildJobLabelMaps(
  propertyIds: (string | null | undefined)[],
  contactIds: (string | null | undefined)[]
): Promise<JobLabelMaps> {
  const supabase = createClient()
  const propertyById = new Map<string, string>()
  const contactById = new Map<string, string>()

  const pIds = Array.from(new Set(propertyIds.filter(Boolean))) as string[]
  const cIds = Array.from(new Set(contactIds.filter(Boolean))) as string[]

  if (pIds.length) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, nickname, address_line1, city")
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
      const { data, error } = await supabase
        .from("contacts")
        .select("id, display_name, company")
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
