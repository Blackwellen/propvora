// Pure formatting + status-meta helpers shared by portal pages.
// No DB / no client supabase — safe in both server and client components.

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "sky"
  | "ai"

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

export function formatDate(
  d: string | null | undefined,
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!d) return "—"
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(
    "en-GB",
    opts ?? { day: "numeric", month: "short", year: "numeric" }
  )
}

export const JOB_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
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

export function isOpenJob(status: string): boolean {
  return !["complete", "invoiced", "closed", "disputed"].includes(status)
}

export const INVOICE_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  submitted: { label: "Submitted", variant: "sky" },
  reviewing: { label: "Reviewing", variant: "warning" },
  approved: { label: "Approved", variant: "primary" },
  rejected: { label: "Rejected", variant: "danger" },
  paid: { label: "Paid", variant: "success" },
}

export function invoiceStatusMeta(status: string) {
  return INVOICE_STATUS_META[status] ?? { label: status, variant: "default" as const }
}

export const PROPERTY_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: "Occupied", variant: "success" },
  occupied: { label: "Occupied", variant: "success" },
  vacant: { label: "Vacant", variant: "warning" },
  under_works: { label: "Under Works", variant: "sky" },
  archived: { label: "Archived", variant: "default" },
}

export function propertyStatusMeta(status: string | null | undefined) {
  if (!status) return { label: "Unknown", variant: "default" as const }
  return PROPERTY_STATUS_META[status] ?? { label: status, variant: "default" as const }
}

export const TENANCY_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
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
