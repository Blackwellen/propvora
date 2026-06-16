import type { SupabaseClient } from "@supabase/supabase-js"
import { listSupplierJobs } from "./jobs"
import { listLeads } from "./leads"
import { listInvoices } from "./invoices"
import { listServices } from "./services"

// ============================================================================
// Supplier GLOBAL SEARCH — a single workspace-scoped query across the supplier's
// own records (jobs, leads, invoices, services). Each source is RLS-scoped and
// 42P01-tolerant; results are ranked by simple substring relevance and grouped.
// ============================================================================

export type SearchGroup = "Jobs" | "Leads" | "Invoices" | "Services"

export interface SearchResult {
  group: SearchGroup
  id: string
  title: string
  subtitle: string | null
  href: string
}

function matches(haystack: string | null | undefined, needle: string): boolean {
  return Boolean(haystack && haystack.toLowerCase().includes(needle))
}

export async function searchSupplierWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  rawQuery: string,
  opts?: { limitPerGroup?: number }
): Promise<SearchResult[]> {
  const q = rawQuery.trim().toLowerCase()
  if (q.length < 2) return []
  const cap = opts?.limitPerGroup ?? 5

  const [jobs, leads, invoices, services] = await Promise.all([
    listSupplierJobs(supabase, workspaceId, "supplier"),
    listLeads(supabase, workspaceId),
    listInvoices(supabase, workspaceId),
    listServices(supabase, workspaceId, { includeInactive: true }),
  ])

  const out: SearchResult[] = []

  for (const j of jobs) {
    const idShort = j.id.slice(0, 8)
    if (matches(idShort, q) || matches(j.status, q) || matches(j.job_id, q) || q === "jobs") {
      out.push({
        group: "Jobs",
        id: j.id,
        title: `Job ${idShort}`,
        subtitle: j.status.replace(/_/g, " "),
        href: `/supplier/jobs/${j.id}`,
      })
    }
  }

  for (const l of leads) {
    if (matches(l.title, q) || matches(l.detail, q) || matches(l.counterpartyName, q) || matches(l.status, q)) {
      out.push({
        group: "Leads",
        id: l.id,
        title: l.title,
        subtitle: l.counterpartyName ?? l.source.replace(/_/g, " "),
        href: `/supplier/leads`,
      })
    }
  }

  for (const inv of invoices) {
    if (matches(inv.invoice_number, q) || matches(inv.notes, q) || matches(inv.status, q) || matches(inv.id.slice(0, 8), q)) {
      out.push({
        group: "Invoices",
        id: inv.id,
        title: inv.invoice_number ?? `INV ${inv.id.slice(0, 8)}`,
        subtitle: inv.status,
        href: `/supplier/invoices`,
      })
    }
  }

  for (const s of services) {
    if (matches(s.name, q) || matches(s.category, q) || matches(s.description, q)) {
      out.push({
        group: "Services",
        id: s.id,
        title: s.name,
        subtitle: s.category ?? s.pricing_model,
        href: `/supplier/services/${s.id}`,
      })
    }
  }

  // Cap per group while preserving group order.
  const groups: SearchGroup[] = ["Jobs", "Leads", "Invoices", "Services"]
  const capped: SearchResult[] = []
  for (const g of groups) {
    capped.push(...out.filter((r) => r.group === g).slice(0, cap))
  }
  return capped
}
