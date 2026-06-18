import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Batch-3 cross-workspace read layer for the platform-admin console.
 *
 * Covers the lettings marketplace, supplier marketplace, automation usage caps,
 * and cron / scheduled-job oversight pages (manifest rows 23, 24, 29, 30).
 *
 * Cross-tenant BY DESIGN: a platform admin oversees these surfaces across EVERY
 * workspace. All reads use the service-role client and MUST only run behind the
 * (admin) layout guard + the page-level getAdminIdentity() check (fail-closed).
 * The service-role key never reaches the client.
 *
 * Every function is 42P01-safe: a missing table/column resolves to an empty /
 * zero / `available:false` result rather than throwing, so the console renders
 * an honest "not provisioned" / "no data yet" state. NO fabricated numbers.
 */

const MISSING_RELATION = "42P01"
const UNDEFINED_COLUMN = "42703"
const PGRST_MISSING_RELATION = "PGRST205"
const PGRST_MISSING_COLUMN = "PGRST204"

function isSchemaGap(code?: string): boolean {
  return (
    code === MISSING_RELATION ||
    code === UNDEFINED_COLUMN ||
    code === PGRST_MISSING_RELATION ||
    code === PGRST_MISSING_COLUMN
  )
}

/** Short, non-identifying display form of a UUID (first 8 chars). */
export function shortId(id: string | null | undefined): string {
  if (!id) return "—"
  return id.slice(0, 8)
}

/** Format integer pence → "£1,234.56" (GBP). Defensive against nulls. */
export function fmtPence(pence: number | null | undefined, currency = "GBP"): string {
  const n = typeof pence === "number" && Number.isFinite(pence) ? pence : 0
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(n / 100)
  } catch {
    return `£${(n / 100).toFixed(2)}`
  }
}

/** Map of workspace_id -> name. Best-effort, never throws. */
async function workspaceNamesFor(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return out
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("workspaces").select("id, name").in("id", unique)
    for (const w of data ?? []) out[w.id as string] = (w.name as string) ?? "Workspace"
  } catch { /* ignore */ }
  return out
}

// ── Lettings marketplace (img-23) ────────────────────────────────────────────
//
// Lettings listings are marketplace_listings whose transaction_type is a stay
// booking (stay_booking). Hosts are their owning workspaces.

const STAY_TRANSACTION_TYPES = ["stay_booking"] as const

export interface LettingsKpis {
  /** True once marketplace_listings is provisioned. */
  available: boolean
  activeListings: number | null
  pendingModeration: number | null
  /** Distinct host workspaces with at least one stay listing. */
  hosts: number | null
  /** Average review rating across stay listings (1-5), or null if none. */
  avgRating: number | null
  reviewCount: number | null
  /** Open guest complaints (job_complaints in open/acknowledged). */
  openComplaints: number | null
  /** Stay bookings (marketplace_transactions of a stay type). */
  bookings: number | null
}

export async function getLettingsKpis(): Promise<LettingsKpis> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return emptyLettingsKpis(false)
  }

  // Active + pending stay listings, and distinct hosts.
  let available = true
  let activeListings: number | null = null
  let pendingModeration: number | null = null
  let hosts: number | null = null
  try {
    const { data, error } = await admin
      .from("marketplace_listings")
      .select("workspace_id, status, transaction_type")
      .in("transaction_type", STAY_TRANSACTION_TYPES as unknown as string[])
      .limit(5000)
    if (error) {
      if (isSchemaGap(error.code)) return emptyLettingsKpis(false)
      activeListings = 0; pendingModeration = 0; hosts = 0
    } else {
      const rows = data ?? []
      const hostSet = new Set<string>()
      let active = 0, pending = 0
      for (const r of rows) {
        const st = (r.status as string) ?? ""
        if (st === "active") active++
        if (st === "pending_review" || st === "pending" || st === "in_review") pending++
        if (r.workspace_id) hostSet.add(r.workspace_id as string)
      }
      activeListings = active; pendingModeration = pending; hosts = hostSet.size
    }
  } catch {
    available = false
  }
  if (!available) return emptyLettingsKpis(false)

  const [rating, complaints, bookings] = await Promise.all([
    avgStayRating(),
    countOpenComplaints(),
    countStayBookings(),
  ])

  return {
    available: true,
    activeListings,
    pendingModeration,
    hosts,
    avgRating: rating.avg,
    reviewCount: rating.count,
    openComplaints: complaints,
    bookings,
  }
}

function emptyLettingsKpis(available: boolean): LettingsKpis {
  return {
    available,
    activeListings: null,
    pendingModeration: null,
    hosts: null,
    avgRating: null,
    reviewCount: null,
    openComplaints: null,
    bookings: null,
  }
}

async function avgStayRating(): Promise<{ avg: number | null; count: number | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from("marketplace_reviews").select("rating").limit(10000)
    if (error) return { avg: null, count: isSchemaGap(error.code) ? null : 0 }
    const rows = (data ?? []).map((r) => Number(r.rating)).filter((n) => Number.isFinite(n))
    if (rows.length === 0) return { avg: null, count: 0 }
    const avg = rows.reduce((s, n) => s + n, 0) / rows.length
    return { avg: Math.round(avg * 10) / 10, count: rows.length }
  } catch {
    return { avg: null, count: null }
  }
}

async function countOpenComplaints(): Promise<number | null> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from("job_complaints")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "acknowledged"])
    if (error) return isSchemaGap(error.code) ? null : 0
    return count ?? 0
  } catch {
    return null
  }
}

async function countStayBookings(): Promise<number | null> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from("marketplace_transactions")
      .select("id", { count: "exact", head: true })
      .in("transaction_type", STAY_TRANSACTION_TYPES as unknown as string[])
    if (error) return isSchemaGap(error.code) ? null : 0
    return count ?? 0
  } catch {
    return null
  }
}

export interface LettingsListingRow {
  id: string
  title: string
  hostWorkspaceId: string | null
  hostName: string | null
  status: string
  category: string | null
  region: string | null
  pricePence: number | null
  currency: string
  createdAt: string | null
}

export interface LettingsListingResult {
  available: boolean
  rows: LettingsListingRow[]
}

/** Stay listings across the platform, newest first. 42P01-safe. */
export async function listLettingsListings(
  options: { q?: string; status?: string; limit?: number } = {},
): Promise<LettingsListingResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500)
  let q = admin
    .from("marketplace_listings")
    .select("id, workspace_id, title, status, category, region, base_price_pence, currency, transaction_type, created_at")
    .in("transaction_type", STAY_TRANSACTION_TYPES as unknown as string[])
    .order("created_at", { ascending: false })
    .limit(limit)

  if (options.status) q = q.eq("status", options.status)
  if (options.q) q = q.ilike("title", `%${options.q}%`)

  const { data, error } = await q
  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = data ?? []
  const names = await workspaceNamesFor(rows.map((r) => r.workspace_id as string))

  return {
    available: true,
    rows: rows.map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? "Untitled listing",
      hostWorkspaceId: (r.workspace_id as string) ?? null,
      hostName: names[r.workspace_id as string] ?? null,
      status: (r.status as string) ?? "draft",
      category: (r.category as string) ?? null,
      region: (r.region as string) ?? null,
      pricePence: r.base_price_pence == null ? null : Number(r.base_price_pence),
      currency: (r.currency as string) ?? "GBP",
      createdAt: (r.created_at as string) ?? null,
    })),
  }
}

// ── Supplier marketplace (img-24) ────────────────────────────────────────────
//
// Supplier listings are marketplace_listings whose transaction_type is NOT a
// stay (supplier_job / service_package / emergency_job). Offers/quotes come from
// supplier_marketplace_quotes; quote requests from supplier_requests.

const SUPPLIER_TRANSACTION_TYPES = ["supplier_job", "service_package", "emergency_job"] as const
const EMERGENCY_TRANSACTION_TYPES = ["emergency_job"] as const

export interface SupplierMarketKpis {
  available: boolean
  activeListings: number | null
  emergencyListings: number | null
  activeSuppliers: number | null
  openQuoteRequests: number | null
  activeQuotes: number | null
  openDisputes: number | null
}

export async function getSupplierMarketKpis(): Promise<SupplierMarketKpis> {
  const [listings, suppliers, requests, quotes, disputes] = await Promise.all([
    supplierListingCounts(),
    countActiveSuppliers(),
    countOpenQuoteRequests(),
    countActiveQuotes(),
    countSupplierDisputes(),
  ])
  return {
    available: listings.available,
    activeListings: listings.active,
    emergencyListings: listings.emergency,
    activeSuppliers: suppliers,
    openQuoteRequests: requests,
    activeQuotes: quotes,
    openDisputes: disputes,
  }
}

async function supplierListingCounts(): Promise<{ available: boolean; active: number | null; emergency: number | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("marketplace_listings")
      .select("status, transaction_type")
      .in("transaction_type", SUPPLIER_TRANSACTION_TYPES as unknown as string[])
      .limit(5000)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, active: null, emergency: null }
      return { available: true, active: 0, emergency: 0 }
    }
    let active = 0, emergency = 0
    for (const r of data ?? []) {
      if ((r.status as string) === "active") {
        active++
        if (EMERGENCY_TRANSACTION_TYPES.includes(r.transaction_type as never)) emergency++
      }
    }
    return { available: true, active, emergency }
  } catch {
    return { available: false, active: null, emergency: null }
  }
}

async function countActiveSuppliers(): Promise<number | null> {
  try {
    const admin = createAdminClient()
    // supplier_workspace_profiles.status ∈ (draft, active, paused). 'active' is
    // the honest "live supplier" signal; there is no 'verified' status value.
    const { count, error } = await admin
      .from("supplier_workspace_profiles")
      .select("workspace_id", { count: "exact", head: true })
      .eq("status", "active")
    if (error) return isSchemaGap(error.code) ? null : 0
    return count ?? 0
  } catch {
    return null
  }
}

async function countOpenQuoteRequests(): Promise<number | null> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from("supplier_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "open", "in_review"])
    if (error) return isSchemaGap(error.code) ? null : 0
    return count ?? 0
  } catch {
    return null
  }
}

async function countActiveQuotes(): Promise<number | null> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from("supplier_marketplace_quotes")
      .select("id", { count: "exact", head: true })
      .in("status", ["requested", "quoted"])
    if (error) return isSchemaGap(error.code) ? null : 0
    return count ?? 0
  } catch {
    return null
  }
}

async function countSupplierDisputes(): Promise<number | null> {
  try {
    const admin = createAdminClient()
    // Supplier disputes ride the shared marketplace_disputes table; filter to
    // transactions whose type is a supplier type is not directly possible here,
    // so we surface all open disputes (the supplier dispute queue is the same
    // governance surface as the marketplace dispute queue).
    const { count, error } = await admin
      .from("marketplace_disputes")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "under_review", "escalated"])
    if (error) return isSchemaGap(error.code) ? null : 0
    return count ?? 0
  } catch {
    return null
  }
}

export interface SupplierListingRow {
  id: string
  title: string
  supplierWorkspaceId: string | null
  supplierName: string | null
  status: string
  category: string | null
  transactionType: string | null
  region: string | null
  pricePence: number | null
  currency: string
  createdAt: string | null
}

export interface SupplierListingResult {
  available: boolean
  rows: SupplierListingRow[]
}

/** Supplier listings across the platform, newest first. 42P01-safe. */
export async function listSupplierListings(
  options: { q?: string; status?: string; limit?: number } = {},
): Promise<SupplierListingResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500)
  let q = admin
    .from("marketplace_listings")
    .select("id, workspace_id, title, status, category, region, base_price_pence, currency, transaction_type, created_at")
    .in("transaction_type", SUPPLIER_TRANSACTION_TYPES as unknown as string[])
    .order("created_at", { ascending: false })
    .limit(limit)

  if (options.status) q = q.eq("status", options.status)
  if (options.q) q = q.ilike("title", `%${options.q}%`)

  const { data, error } = await q
  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = data ?? []
  const names = await workspaceNamesFor(rows.map((r) => r.workspace_id as string))

  return {
    available: true,
    rows: rows.map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? "Untitled listing",
      supplierWorkspaceId: (r.workspace_id as string) ?? null,
      supplierName: names[r.workspace_id as string] ?? null,
      status: (r.status as string) ?? "draft",
      category: (r.category as string) ?? null,
      transactionType: (r.transaction_type as string) ?? null,
      region: (r.region as string) ?? null,
      pricePence: r.base_price_pence == null ? null : Number(r.base_price_pence),
      currency: (r.currency as string) ?? "GBP",
      createdAt: (r.created_at as string) ?? null,
    })),
  }
}

export interface SupplierQuoteRequestRow {
  id: string
  title: string | null
  workspaceId: string | null
  workspaceName: string | null
  status: string
  source: string | null
  amountPence: number | null
  currency: string
  createdAt: string | null
}

export interface SupplierQuoteRequestResult {
  available: boolean
  rows: SupplierQuoteRequestRow[]
}

/** Open supplier quote requests across the platform. 42P01-safe. */
export async function listSupplierQuoteRequests(limit = 100): Promise<SupplierQuoteRequestResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  const { data, error } = await admin
    .from("supplier_requests")
    .select("id, workspace_id, title, status, source, amount_pence, currency, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 300))

  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = data ?? []
  const names = await workspaceNamesFor(rows.map((r) => r.workspace_id as string))

  return {
    available: true,
    rows: rows.map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? null,
      workspaceId: (r.workspace_id as string) ?? null,
      workspaceName: names[r.workspace_id as string] ?? null,
      status: (r.status as string) ?? "new",
      source: (r.source as string) ?? null,
      amountPence: r.amount_pence == null ? null : Number(r.amount_pence),
      currency: (r.currency as string) ?? "GBP",
      createdAt: (r.created_at as string) ?? null,
    })),
  }
}

// ── Automation usage caps (img-29) ───────────────────────────────────────────

export interface AutomationUsageKpis {
  available: boolean
  /** Workspaces with a configured automation_usage_limits row. */
  trackedWorkspaces: number | null
  /** Total runs recorded across automation_usage_daily (current rows). */
  totalRuns: number | null
  totalAiCredits: number | null
  totalWebhooks: number | null
  /** Workspaces flagged as over / at limit (status != 'Healthy'). */
  overageWorkspaces: number | null
}

export async function getAutomationUsageKpis(): Promise<AutomationUsageKpis> {
  const empty: AutomationUsageKpis = {
    available: false,
    trackedWorkspaces: null,
    totalRuns: null,
    totalAiCredits: null,
    totalWebhooks: null,
    overageWorkspaces: null,
  }
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return empty
  }

  // Limits table drives availability + tracked/overage counts.
  const { data: limits, error: limErr } = await admin
    .from("automation_usage_limits")
    .select("workspace_id, status")
    .limit(5000)
  if (limErr) {
    if (isSchemaGap(limErr.code)) return empty
    return { ...empty, available: true, trackedWorkspaces: 0, overageWorkspaces: 0, totalRuns: 0, totalAiCredits: 0, totalWebhooks: 0 }
  }

  const tracked = new Set<string>()
  let overage = 0
  for (const r of limits ?? []) {
    if (r.workspace_id) tracked.add(r.workspace_id as string)
    const st = ((r.status as string) ?? "Healthy").toLowerCase()
    if (st !== "healthy") overage++
  }

  let totalRuns = 0, totalAi = 0, totalWebhooks = 0
  try {
    const { data: daily, error: dErr } = await admin
      .from("automation_usage_daily")
      .select("runs, ai_credits, webhook_volume")
      .limit(20000)
    if (!dErr) {
      for (const r of daily ?? []) {
        totalRuns += Number(r.runs) || 0
        totalAi += Number(r.ai_credits) || 0
        totalWebhooks += Number(r.webhook_volume) || 0
      }
    }
  } catch { /* ignore */ }

  return {
    available: true,
    trackedWorkspaces: tracked.size,
    totalRuns,
    totalAiCredits: totalAi,
    totalWebhooks,
    overageWorkspaces: overage,
  }
}

export interface AutomationUsageRow {
  id: string
  workspaceId: string
  workspaceName: string | null
  plan: string | null
  runsLimit: number | null
  aiCreditsLimit: number | null
  webhooksLimit: number | null
  storageLimitGb: number | null
  concurrentLimit: number | null
  status: string
  updatedAt: string | null
}

export interface AutomationUsageRowsResult {
  available: boolean
  rows: AutomationUsageRow[]
}

/** Per-workspace automation usage caps. 42P01-safe. */
export async function listAutomationUsageLimits(
  options: { q?: string; status?: string; limit?: number } = {},
): Promise<AutomationUsageRowsResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  let q = admin
    .from("automation_usage_limits")
    .select("id, workspace_id, plan, runs_limit, ai_credits_limit, webhooks_limit, storage_limit_gb, concurrent_limit, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(Math.min(Math.max(options.limit ?? 200, 1), 500))

  if (options.status) q = q.eq("status", options.status)

  const { data, error } = await q
  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = data ?? []
  const names = await workspaceNamesFor(rows.map((r) => r.workspace_id as string))
  const filtered = options.q
    ? rows.filter((r) => (names[r.workspace_id as string] ?? "").toLowerCase().includes(options.q!.toLowerCase()))
    : rows

  return {
    available: true,
    rows: filtered.map((r) => ({
      id: r.id as string,
      workspaceId: r.workspace_id as string,
      workspaceName: names[r.workspace_id as string] ?? null,
      plan: (r.plan as string) ?? null,
      runsLimit: r.runs_limit == null ? null : Number(r.runs_limit),
      aiCreditsLimit: r.ai_credits_limit == null ? null : Number(r.ai_credits_limit),
      webhooksLimit: r.webhooks_limit == null ? null : Number(r.webhooks_limit),
      storageLimitGb: r.storage_limit_gb == null ? null : Number(r.storage_limit_gb),
      concurrentLimit: r.concurrent_limit == null ? null : Number(r.concurrent_limit),
      status: (r.status as string) ?? "Healthy",
      updatedAt: (r.updated_at as string) ?? null,
    })),
  }
}

export interface AutomationLimitAuditRow {
  id: string
  workspaceId: string | null
  workspaceName: string | null
  actor: string | null
  action: string
  target: string | null
  createdAt: string | null
}

/** Recent automation cap / policy audit events. 42P01-safe. */
export async function listAutomationLimitAudit(limit = 20): Promise<{ available: boolean; rows: AutomationLimitAuditRow[] }> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }
  const { data, error } = await admin
    .from("automation_audit_events")
    .select("id, workspace_id, actor, action, target, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100))
  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }
  const rows = data ?? []
  const names = await workspaceNamesFor(rows.map((r) => r.workspace_id as string))
  return {
    available: true,
    rows: rows.map((r) => ({
      id: r.id as string,
      workspaceId: (r.workspace_id as string) ?? null,
      workspaceName: names[r.workspace_id as string] ?? null,
      actor: (r.actor as string) ?? null,
      action: (r.action as string) ?? "",
      target: (r.target as string) ?? null,
      createdAt: (r.created_at as string) ?? null,
    })),
  }
}

// ── Cron / scheduled-job management (img-30) ─────────────────────────────────
//
// There is no dedicated platform cron registry table in the live schema. The
// honest source of recurring/scheduled job state is `automation_runs` (the
// engine's run ledger) plus `ppm_schedules` / `money_scheduled_reports` for
// workspace-defined schedules. We surface real run/failure counts; when the
// run ledger is absent the page renders the "not provisioned" state.

export interface CronKpis {
  available: boolean
  /** Distinct scheduled definitions (workspace schedules) seen. */
  scheduledJobs: number | null
  /** Engine runs in the recent window. */
  recentRuns: number | null
  /** Runs that ended in an error/failed state. */
  failedRuns: number | null
  /** Runs currently running (potentially stuck). */
  runningJobs: number | null
}

const RUN_FAILED_STATUSES = ["error", "failed", "errored"] as const
const RUN_ACTIVE_STATUSES = ["running", "in_progress", "queued"] as const

export async function getCronKpis(): Promise<CronKpis> {
  const empty: CronKpis = { available: false, scheduledJobs: null, recentRuns: null, failedRuns: null, runningJobs: null }
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return empty
  }

  const { data, error } = await admin
    .from("automation_runs")
    .select("status")
    .order("created_at", { ascending: false })
    .limit(5000)
  if (error) {
    if (isSchemaGap(error.code)) return empty
    return { available: true, scheduledJobs: 0, recentRuns: 0, failedRuns: 0, runningJobs: 0 }
  }

  const rows = data ?? []
  let failed = 0, running = 0
  for (const r of rows) {
    const st = ((r.status as string) ?? "").toLowerCase()
    if (RUN_FAILED_STATUSES.includes(st as never)) failed++
    if (RUN_ACTIVE_STATUSES.includes(st as never)) running++
  }

  const scheduledJobs = await countScheduledDefinitions()

  return {
    available: true,
    scheduledJobs,
    recentRuns: rows.length,
    failedRuns: failed,
    runningJobs: running,
  }
}

async function countScheduledDefinitions(): Promise<number | null> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin.from("ppm_schedules").select("id", { count: "exact", head: true })
    if (error) return isSchemaGap(error.code) ? null : 0
    return count ?? 0
  } catch {
    return null
  }
}

export interface CronRunRow {
  id: string
  workspaceId: string | null
  workspaceName: string | null
  ref: string | null
  automation: string | null
  status: string
  startedAt: string | null
  durationMs: number | null
  initiatedBy: string | null
}

export interface CronRunResult {
  available: boolean
  rows: CronRunRow[]
}

/** Recent engine runs (the closest honest signal to "cron run history"). */
export async function listCronRuns(
  options: { status?: string; limit?: number } = {},
): Promise<CronRunResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  let q = admin
    .from("automation_runs")
    .select("id, workspace_id, ref, automation, status, started_at, duration_ms, initiated_by, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(options.limit ?? 100, 1), 300))

  if (options.status === "failed") {
    q = q.in("status", RUN_FAILED_STATUSES as unknown as string[])
  } else if (options.status === "running") {
    q = q.in("status", RUN_ACTIVE_STATUSES as unknown as string[])
  } else if (options.status) {
    q = q.eq("status", options.status)
  }

  const { data, error } = await q
  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = data ?? []
  const names = await workspaceNamesFor(rows.map((r) => r.workspace_id as string))

  return {
    available: true,
    rows: rows.map((r) => ({
      id: r.id as string,
      workspaceId: (r.workspace_id as string) ?? null,
      workspaceName: names[r.workspace_id as string] ?? null,
      ref: (r.ref as string) ?? null,
      automation: (r.automation as string) ?? null,
      status: (r.status as string) ?? "unknown",
      startedAt: (r.started_at as string) ?? (r.created_at as string) ?? null,
      durationMs: r.duration_ms == null ? null : Number(r.duration_ms),
      initiatedBy: (r.initiated_by as string) ?? null,
    })),
  }
}
