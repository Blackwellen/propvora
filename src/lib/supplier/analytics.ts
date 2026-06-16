import type { SupabaseClient } from "@supabase/supabase-js"
import { listSupplierJobs } from "./jobs"
import { listInvoices } from "./invoices"

// ============================================================================
// Supplier ANALYTICS — derives chart-ready series from REAL workspace records
// (no invented figures). Every series is computed from supplier_job_assignments
// + supplier_workspace_invoices, both 42P01-tolerant, so an unprovisioned table
// contributes an empty/zeroed series rather than a 500.
// ============================================================================

export interface TimePoint {
  /** ISO date (YYYY-MM-DD), bucketed to a week start (Monday). */
  date: string
  /** Short human label, e.g. "9 Jun". */
  label: string
  value: number
}

export interface StatusSlice {
  name: string
  value: number
  color: string
}

export interface SupplierAnalytics {
  jobsOverTime: TimePoint[]
  earningsOverTime: TimePoint[]
  statusMix: StatusSlice[]
  completionRatePct: number
  totalJobs: number
  weeksCovered: number
}

const STATUS_COLOURS: Record<string, string> = {
  assigned: "#94A3B8",
  accepted: "#2563EB",
  in_progress: "#0EA5E9",
  completed: "#10B981",
  cancelled: "#EF4444",
}

function weekStart(iso: string): Date {
  const d = new Date(iso)
  const day = (d.getUTCDay() + 6) % 7 // Monday=0
  d.setUTCDate(d.getUTCDate() - day)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function shortLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
}

/** Build N consecutive week buckets ending on the current week. */
function buildWeekBuckets(weeks: number): { key: string; date: Date }[] {
  const out: { key: string; date: Date }[] = []
  const start = weekStart(new Date().toISOString())
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() - i * 7)
    out.push({ key: d.toISOString().slice(0, 10), date: d })
  }
  return out
}

export async function getSupplierAnalytics(
  supabase: SupabaseClient,
  workspaceId: string,
  opts?: { weeks?: number }
): Promise<SupplierAnalytics> {
  const weeks = opts?.weeks ?? 8
  const [jobs, invoices] = await Promise.all([
    listSupplierJobs(supabase, workspaceId, "supplier"),
    listInvoices(supabase, workspaceId),
  ])

  const buckets = buildWeekBuckets(weeks)
  const jobsByWeek = new Map(buckets.map((b) => [b.key, 0]))
  const earnByWeek = new Map(buckets.map((b) => [b.key, 0]))

  for (const j of jobs) {
    const k = weekStart(j.created_at).toISOString().slice(0, 10)
    if (jobsByWeek.has(k)) jobsByWeek.set(k, (jobsByWeek.get(k) ?? 0) + 1)
  }
  // Earnings = paid invoices, bucketed by paid_at (real cash), pence.
  for (const inv of invoices) {
    if (inv.status !== "paid" || !inv.paid_at || inv.amount_pence == null) continue
    const k = weekStart(inv.paid_at).toISOString().slice(0, 10)
    if (earnByWeek.has(k)) earnByWeek.set(k, (earnByWeek.get(k) ?? 0) + inv.amount_pence)
  }

  const jobsOverTime: TimePoint[] = buckets.map((b) => ({
    date: b.key,
    label: shortLabel(b.date),
    value: jobsByWeek.get(b.key) ?? 0,
  }))
  const earningsOverTime: TimePoint[] = buckets.map((b) => ({
    date: b.key,
    label: shortLabel(b.date),
    value: earnByWeek.get(b.key) ?? 0,
  }))

  const statusCounts = new Map<string, number>()
  for (const j of jobs) statusCounts.set(j.status, (statusCounts.get(j.status) ?? 0) + 1)
  const statusMix: StatusSlice[] = [...statusCounts.entries()].map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
    color: STATUS_COLOURS[name] ?? "#CBD5E1",
  }))

  const completed = jobs.filter((j) => j.status === "completed").length
  const decided = jobs.filter((j) => j.status === "completed" || j.status === "cancelled").length
  const completionRatePct = decided > 0 ? Math.round((completed / decided) * 100) : 0

  return {
    jobsOverTime,
    earningsOverTime,
    statusMix,
    completionRatePct,
    totalJobs: jobs.length,
    weeksCovered: weeks,
  }
}
