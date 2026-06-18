import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Batch-4 platform-admin read layer (maintenance, data-requests, bug-reports,
 * stripe-events, ai-usage, ai-models, changelog, announcements,
 * announcement-bar, global settings).
 *
 * Every function uses the service-role client (server-only; callers are gated by
 * the (admin) layout guard) and is schema-gap-safe: a missing table/column
 * resolves to a `notConfigured`/empty result so the console renders an honest
 * "not provisioned" state rather than fabricating numbers. No secrets, payloads
 * or card data are ever surfaced.
 */

const SCHEMA_GAP = new Set(["42P01", "42703", "PGRST205", "PGRST204"])
function isGap(code?: string | null): boolean {
  return !!code && SCHEMA_GAP.has(code)
}

function envReady(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
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
  } catch {
    /* ignore */
  }
  return out
}

/** Read a JSON blob from platform_settings by key. notConfigured => table missing. */
export async function readPlatformSetting(
  key: string,
): Promise<{ notConfigured: boolean; value: Record<string, unknown> | null; updatedAt: string | null }> {
  if (!envReady()) return { notConfigured: true, value: null, updatedAt: null }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("platform_settings")
      .select("value, updated_at")
      .eq("key", key)
      .maybeSingle()
    if (error) {
      if (isGap(error.code)) return { notConfigured: true, value: null, updatedAt: null }
      return { notConfigured: false, value: null, updatedAt: null }
    }
    return {
      notConfigured: false,
      value: (data?.value as Record<string, unknown>) ?? null,
      updatedAt: (data?.updated_at as string) ?? null,
    }
  } catch {
    return { notConfigured: true, value: null, updatedAt: null }
  }
}

// ── img-31 · Maintenance mode ────────────────────────────────────────────────

export interface MaintenanceConfig {
  enabled: boolean
  mode: "full" | "restricted" | "degraded"
  message: string
  allowlist: string[]
  allowAdmins: boolean
  scheduledFor: string | null
}

export interface MaintenanceWindow {
  id: string
  title: string
  startsAt: string | null
  endsAt: string | null
  scope: string | null
  status: string
}

export interface MaintenanceData {
  notConfigured: boolean
  config: MaintenanceConfig
  updatedAt: string | null
  windows: MaintenanceWindow[]
  /** Live, derived health signals (real counts) — not fabricated. */
  health: { db: boolean; auth: boolean; storage: boolean; workspaces: number | null }
}

const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  mode: "full",
  message: "",
  allowlist: [],
  allowAdmins: true,
  scheduledFor: null,
}

export async function getMaintenanceData(): Promise<MaintenanceData> {
  const setting = await readPlatformSetting("maintenance")
  const v = setting.value ?? {}
  const config: MaintenanceConfig = {
    enabled: !!v.enabled,
    mode: (["full", "restricted", "degraded"].includes(v.mode as string) ? v.mode : "full") as MaintenanceConfig["mode"],
    message: (v.message as string) ?? "",
    allowlist: Array.isArray(v.allowlist) ? (v.allowlist as string[]) : Array.isArray(v.allow_list) ? (v.allow_list as string[]) : [],
    allowAdmins: v.allow_admins !== false,
    scheduledFor: (v.scheduled_for as string) ?? null,
  }

  // Real, derived health signals: can we reach core relations?
  let dbOk = false
  let workspaces: number | null = null
  const windows: MaintenanceWindow[] = []
  if (envReady()) {
    try {
      const admin = createAdminClient()
      const { count, error } = await admin.from("workspaces").select("*", { count: "exact", head: true })
      dbOk = !error
      workspaces = error ? null : count ?? 0
    } catch {
      dbOk = false
    }
    // Scheduled windows (optional table).
    try {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from("maintenance_windows")
        .select("id, title, starts_at, ends_at, scope, status")
        .order("starts_at", { ascending: true })
        .limit(50)
      if (!error) {
        for (const r of data ?? []) {
          windows.push({
            id: r.id as string,
            title: (r.title as string) ?? "Maintenance window",
            startsAt: (r.starts_at as string) ?? null,
            endsAt: (r.ends_at as string) ?? null,
            scope: (r.scope as string) ?? null,
            status: (r.status as string) ?? "scheduled",
          })
        }
      }
    } catch {
      /* optional */
    }
  }

  return {
    notConfigured: setting.notConfigured,
    config,
    updatedAt: setting.updatedAt,
    windows,
    health: { db: dbOk, auth: envReady(), storage: envReady(), workspaces },
  }
}

// ── img-32 · Data requests (GDPR) ────────────────────────────────────────────

export interface DataRequestRow {
  id: string
  kind: "export" | "deletion"
  userId: string
  workspaceId: string | null
  workspaceName: string | null
  requestType: string
  status: string
  requestedAt: string | null
  scheduledFor: string | null
  readyAt: string | null
  expiresAt: string | null
  completedAt: string | null
}

export interface DataRequestsData {
  deletionsConfigured: boolean
  exportsConfigured: boolean
  rows: DataRequestRow[]
  kpis: { total: number; openDeletions: number; openExports: number; completed: number }
  /** Monthly request volume for the SLA chart (last 6 months, real). */
  byMonth: Array<{ label: string; value: number }>
}

function lastNMonthKeys(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return out
}
function monthLabel(key: string): string {
  const [, m] = key.split("-")
  return new Date(2000, Number(m) - 1, 1).toLocaleDateString("en-GB", { month: "short" })
}

export async function getDataRequestsData(limit = 200): Promise<DataRequestsData> {
  const empty: DataRequestsData = {
    deletionsConfigured: false,
    exportsConfigured: false,
    rows: [],
    kpis: { total: 0, openDeletions: 0, openExports: 0, completed: 0 },
    byMonth: lastNMonthKeys(6).map((k) => ({ label: monthLabel(k), value: 0 })),
  }
  if (!envReady()) return empty

  const admin = createAdminClient()
  const rows: DataRequestRow[] = []
  let deletionsConfigured = false
  let exportsConfigured = false

  try {
    const { data, error } = await admin
      .from("account_deletion_requests")
      .select("id, user_id, workspace_id, request_type, status, requested_at, scheduled_for, completed_at")
      .order("requested_at", { ascending: false })
      .limit(limit)
    if (!error) {
      deletionsConfigured = true
      for (const r of data ?? []) {
        rows.push({
          id: r.id as string,
          kind: "deletion",
          userId: r.user_id as string,
          workspaceId: (r.workspace_id as string) ?? null,
          workspaceName: null,
          requestType: (r.request_type as string) ?? "user_account",
          status: (r.status as string) ?? "pending",
          requestedAt: (r.requested_at as string) ?? null,
          scheduledFor: (r.scheduled_for as string) ?? null,
          readyAt: null,
          expiresAt: null,
          completedAt: (r.completed_at as string) ?? null,
        })
      }
    } else if (!isGap(error.code)) {
      deletionsConfigured = true
    }
  } catch {
    /* ignore */
  }

  try {
    const { data, error } = await admin
      .from("data_export_requests")
      .select("id, user_id, workspace_id, status, requested_at, ready_at, expires_at, completed_at")
      .order("requested_at", { ascending: false })
      .limit(limit)
    if (!error) {
      exportsConfigured = true
      for (const r of data ?? []) {
        rows.push({
          id: r.id as string,
          kind: "export",
          userId: r.user_id as string,
          workspaceId: (r.workspace_id as string) ?? null,
          workspaceName: null,
          requestType: "subject_access",
          status: (r.status as string) ?? "pending",
          requestedAt: (r.requested_at as string) ?? null,
          scheduledFor: null,
          readyAt: (r.ready_at as string) ?? null,
          expiresAt: (r.expires_at as string) ?? null,
          completedAt: (r.completed_at as string) ?? null,
        })
      }
    } else if (!isGap(error.code)) {
      exportsConfigured = true
    }
  } catch {
    /* ignore */
  }

  // Resolve names + sort newest first.
  const names = await workspaceNamesFor(rows.map((r) => r.workspaceId ?? ""))
  for (const r of rows) r.workspaceName = r.workspaceId ? names[r.workspaceId] ?? null : null
  rows.sort((a, b) => (a.requestedAt ?? "") < (b.requestedAt ?? "") ? 1 : -1)

  const openDeletions = rows.filter((r) => r.kind === "deletion" && (r.status === "pending" || r.status === "scheduled")).length
  const openExports = rows.filter((r) => r.kind === "export" && ["pending", "processing", "ready"].includes(r.status)).length
  const completed = rows.filter((r) => r.status === "completed").length

  // Monthly volume (real).
  const keys = lastNMonthKeys(6)
  const counts: Record<string, number> = {}
  for (const r of rows) {
    if (!r.requestedAt) continue
    const d = new Date(r.requestedAt)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    counts[k] = (counts[k] ?? 0) + 1
  }

  return {
    deletionsConfigured,
    exportsConfigured,
    rows,
    kpis: { total: rows.length, openDeletions, openExports, completed },
    byMonth: keys.map((k) => ({ label: monthLabel(k), value: counts[k] ?? 0 })),
  }
}

// ── img-33 · Bug reports ─────────────────────────────────────────────────────

export interface AdminBugRow {
  id: string
  kind: string
  status: string
  severity: string
  route: string | null
  message: string | null
  digest: string | null
  workspaceId: string | null
  workspaceName: string | null
  createdAt: string | null
}

export interface BugReportsData {
  notConfigured: boolean
  rows: AdminBugRow[]
  kpis: { total: number; open: number; inProgress: number; critical: number; resolved: number }
  bySeverity: Array<{ label: string; value: number }>
  byStatus: Array<{ label: string; value: number }>
}

function severityOf(r: { severity?: unknown; kind?: unknown }): string {
  const s = (r.severity as string) ?? ""
  if (["critical", "high", "medium", "low"].includes(s)) return s
  return r.kind === "error" ? "high" : "medium"
}

export async function getBugReportsData(limit = 200): Promise<BugReportsData> {
  const empty: BugReportsData = {
    notConfigured: true,
    rows: [],
    kpis: { total: 0, open: 0, inProgress: 0, critical: 0, resolved: 0 },
    bySeverity: [],
    byStatus: [],
  }
  if (!envReady()) return empty

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("bug_reports")
      .select("id, kind, status, severity, route, message, digest, workspace_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isGap(error.code)) return empty
      return { ...empty, notConfigured: false }
    }

    const names = await workspaceNamesFor((data ?? []).map((r) => r.workspace_id as string))
    const rows: AdminBugRow[] = (data ?? []).map((r) => ({
      id: r.id as string,
      kind: (r.kind as string) ?? "error",
      status: (r.status as string) ?? "new",
      severity: severityOf(r),
      route: (r.route as string) ?? null,
      message: (r.message as string) ?? null,
      digest: (r.digest as string) ?? null,
      workspaceId: (r.workspace_id as string) ?? null,
      workspaceName: r.workspace_id ? names[r.workspace_id as string] ?? null : null,
      createdAt: (r.created_at as string) ?? null,
    }))

    const open = rows.filter((r) => r.status === "new").length
    const inProgress = rows.filter((r) => r.status === "triaged").length
    const critical = rows.filter((r) => r.severity === "critical").length
    const resolved = rows.filter((r) => r.status === "resolved").length

    const sevCounts: Record<string, number> = {}
    const statusCounts: Record<string, number> = {}
    for (const r of rows) {
      sevCounts[r.severity] = (sevCounts[r.severity] ?? 0) + 1
      statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1
    }

    return {
      notConfigured: false,
      rows,
      kpis: { total: rows.length, open, inProgress, critical, resolved },
      bySeverity: ["critical", "high", "medium", "low"].map((s) => ({ label: s, value: sevCounts[s] ?? 0 })).filter((d) => d.value > 0),
      byStatus: Object.entries(statusCounts).map(([label, value]) => ({ label, value })),
    }
  } catch {
    return empty
  }
}

// ── img-34 · Stripe events ───────────────────────────────────────────────────

export interface StripeEventRow {
  id: string
  stripeEventId: string | null
  type: string
  status: string
  processedAt: string | null
  failed: boolean
}

export interface StripeEventsData {
  notConfigured: boolean
  /** True when Stripe env keys are present (webhook signing secret etc). */
  stripeConfigured: boolean
  rows: StripeEventRow[]
  total: number
  kpis: { total: number; delivered: number; pending: number; failed: number; deadLetter: number }
  topTypes: Array<{ type: string; count: number }>
  deadLetter: StripeEventRow[]
}

export async function getStripeEventsData(limit = 200): Promise<StripeEventsData> {
  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_WEBHOOK_SECRET)
  const empty: StripeEventsData = {
    notConfigured: true,
    stripeConfigured,
    rows: [],
    total: 0,
    kpis: { total: 0, delivered: 0, pending: 0, failed: 0, deadLetter: 0 },
    topTypes: [],
    deadLetter: [],
  }
  if (!envReady()) return empty

  try {
    const admin = createAdminClient()
    // NEVER select `payload`.
    const { data, error, count } = await admin
      .from("stripe_webhook_events")
      .select("id, stripe_event_id, type, status, processed_at, error", { count: "exact" })
      .order("processed_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isGap(error.code)) return empty
      return { ...empty, notConfigured: false }
    }

    const rows: StripeEventRow[] = (data ?? []).map((r) => {
      const status = (r.status as string) ?? (r.error ? "failed" : "processed")
      const failed = status === "failed" || status === "dead_letter" || !!r.error
      return {
        id: r.id as string,
        stripeEventId: (r.stripe_event_id as string) ?? null,
        type: (r.type as string) ?? "—",
        status,
        processedAt: (r.processed_at as string) ?? null,
        failed,
      }
    })

    const byType: Record<string, number> = {}
    for (const r of rows) byType[r.type] = (byType[r.type] ?? 0) + 1
    const topTypes = Object.entries(byType).map(([type, c]) => ({ type, count: c })).sort((a, b) => b.count - a.count).slice(0, 6)

    const failed = rows.filter((r) => r.failed).length
    const pending = rows.filter((r) => r.status === "pending" || r.status === "processing").length
    const delivered = rows.filter((r) => !r.failed && (r.status === "processed" || r.status === "succeeded")).length
    const deadLetter = rows.filter((r) => r.status === "dead_letter")

    return {
      notConfigured: false,
      stripeConfigured,
      rows,
      total: count ?? rows.length,
      kpis: { total: count ?? rows.length, delivered, pending, failed, deadLetter: deadLetter.length },
      topTypes,
      deadLetter,
    }
  } catch {
    return empty
  }
}

// ── img-35 · AI usage (reuses ops.listAiUsage shape, enriched) ───────────────

export interface AiUsageData {
  notConfigured: boolean
  source: "rollup" | "metering" | null
  rows: Array<{ workspaceId: string; workspaceName: string; day: string; tokensIn: number; tokensOut: number; costPence: number }>
  totals: { tokensIn: number; tokensOut: number; costPence: number; requests: number }
  byDay: Array<{ label: string; value: number }>
  byWorkspace: Array<{ workspaceId: string; workspaceName: string; tokensIn: number; tokensOut: number; costPence: number }>
}

export async function getAiUsageData(limit = 500): Promise<AiUsageData> {
  const empty: AiUsageData = {
    notConfigured: true,
    source: null,
    rows: [],
    totals: { tokensIn: 0, tokensOut: 0, costPence: 0, requests: 0 },
    byDay: [],
    byWorkspace: [],
  }
  if (!envReady()) return empty

  const { listAiUsage } = await import("@/lib/admin/ops")
  const usage = await listAiUsage(limit)
  if (!usage.available) return empty

  // Per-day totals (last 14 days present in data).
  const dayMap: Record<string, number> = {}
  for (const r of usage.rows) {
    if (!r.day) continue
    dayMap[r.day] = (dayMap[r.day] ?? 0) + r.tokensIn + r.tokensOut
  }
  const byDay = Object.entries(dayMap)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-14)
    .map(([day, value]) => ({ label: day.slice(5), value }))

  // Per-workspace rollup.
  const wsMap: Record<string, { workspaceId: string; workspaceName: string; tokensIn: number; tokensOut: number; costPence: number }> = {}
  for (const r of usage.rows) {
    if (!wsMap[r.workspaceId]) {
      wsMap[r.workspaceId] = { workspaceId: r.workspaceId, workspaceName: r.workspaceName, tokensIn: 0, tokensOut: 0, costPence: 0 }
    }
    wsMap[r.workspaceId].tokensIn += r.tokensIn
    wsMap[r.workspaceId].tokensOut += r.tokensOut
    wsMap[r.workspaceId].costPence += r.costPence
  }
  const byWorkspace = Object.values(wsMap).sort((a, b) => b.tokensIn + b.tokensOut - (a.tokensIn + a.tokensOut)).slice(0, 8)

  return {
    notConfigured: false,
    source: usage.source,
    rows: usage.rows,
    totals: { ...usage.totals, requests: usage.rows.length },
    byDay,
    byWorkspace,
  }
}

// ── img-37 · Changelog KPIs (derive from comms changelog list) ───────────────

export interface ChangelogKpis {
  releasesPublished: number
  draftCount: number
  thisMonth: number
  latestVersion: string | null
}

export async function getChangelogKpis(): Promise<ChangelogKpis> {
  if (!envReady()) return { releasesPublished: 0, draftCount: 0, thisMonth: 0, latestVersion: null }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("changelog_entries")
      .select("version, published, published_at, created_at")
      .order("published_at", { ascending: false })
      .limit(500)
    if (error || !data) return { releasesPublished: 0, draftCount: 0, thisMonth: 0, latestVersion: null }
    const now = new Date()
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    let published = 0
    let drafts = 0
    let thisMonth = 0
    let latestVersion: string | null = null
    for (const r of data) {
      if (r.published) {
        published += 1
        if (!latestVersion && r.version) latestVersion = r.version as string
        const pa = (r.published_at as string) ?? (r.created_at as string)
        if (pa && pa.slice(0, 7) === thisMonthKey) thisMonth += 1
      } else {
        drafts += 1
      }
    }
    return { releasesPublished: published, draftCount: drafts, thisMonth, latestVersion }
  } catch {
    return { releasesPublished: 0, draftCount: 0, thisMonth: 0, latestVersion: null }
  }
}

// ── img-38 · Announcement KPIs ───────────────────────────────────────────────

export interface AnnouncementKpis {
  live: number
  scheduled: number
  draft: number
  total: number
}

export async function getAnnouncementKpis(): Promise<AnnouncementKpis> {
  if (!envReady()) return { live: 0, scheduled: 0, draft: 0, total: 0 }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("announcements")
      .select("starts_at, ends_at, published")
      .limit(500)
    if (error || !data) return { live: 0, scheduled: 0, draft: 0, total: 0 }
    const now = Date.now()
    let live = 0
    let scheduled = 0
    let draft = 0
    for (const r of data) {
      const starts = r.starts_at ? new Date(r.starts_at as string).getTime() : null
      const ends = r.ends_at ? new Date(r.ends_at as string).getTime() : null
      if (!r.published) {
        draft += 1
      } else if (starts && starts > now) {
        scheduled += 1
      } else if (ends && ends < now) {
        /* expired — counts toward total only */
      } else {
        live += 1
      }
    }
    return { live, scheduled, draft, total: data.length }
  } catch {
    return { live: 0, scheduled: 0, draft: 0, total: 0 }
  }
}

// ── img-39 · Announcement bar ────────────────────────────────────────────────

export interface AnnouncementBarConfig {
  enabled: boolean
  message: string
  severity: "info" | "success" | "warning" | "critical"
  ctaLabel: string
  ctaHref: string
  dismissible: boolean
  audience: "all" | "operators" | "suppliers" | "customers" | "workspace"
  workspaceId: string | null
  startsAt: string | null
  endsAt: string | null
}

export interface AnnouncementBarData {
  notConfigured: boolean
  config: AnnouncementBarConfig
  updatedAt: string | null
}

const DEFAULT_BAR: AnnouncementBarConfig = {
  enabled: false,
  message: "",
  severity: "info",
  ctaLabel: "",
  ctaHref: "",
  dismissible: true,
  audience: "all",
  workspaceId: null,
  startsAt: null,
  endsAt: null,
}

export async function getAnnouncementBarData(): Promise<AnnouncementBarData> {
  const setting = await readPlatformSetting("announcement_bar")
  const v = setting.value ?? {}
  const config: AnnouncementBarConfig = {
    enabled: !!v.enabled,
    message: (v.message as string) ?? "",
    severity: (["info", "success", "warning", "critical"].includes(v.severity as string) ? v.severity : "info") as AnnouncementBarConfig["severity"],
    ctaLabel: (v.cta_label as string) ?? "",
    ctaHref: (v.cta_href as string) ?? "",
    dismissible: v.dismissible !== false,
    audience: (["all", "operators", "suppliers", "customers", "workspace"].includes(v.audience as string) ? v.audience : "all") as AnnouncementBarConfig["audience"],
    workspaceId: (v.workspace_id as string) ?? null,
    startsAt: (v.starts_at as string) ?? null,
    endsAt: (v.ends_at as string) ?? null,
  }
  return { notConfigured: setting.notConfigured, config, updatedAt: setting.updatedAt }
}

// ── img-40 · Global settings ─────────────────────────────────────────────────

export interface GlobalSettings {
  // locale
  defaultTimezone: string
  defaultLocale: string
  defaultCurrency: string
  weekStart: string
  // branding
  productName: string
  supportEmail: string
  supportUrl: string
  // notifications
  systemFromEmail: string
  digestEnabled: boolean
  // security
  enforceMfaAdmins: boolean
  sessionTimeoutMins: number
  // compliance
  dataRegion: string
  retentionDays: number
  // integrations (presence flags only — never expose keys)
  stripeConfigured: boolean
  resendConfigured: boolean
  supabaseConfigured: boolean
}

export interface GlobalSettingsData {
  notConfigured: boolean
  settings: GlobalSettings
  updatedAt: string | null
}

const DEFAULT_GLOBAL: GlobalSettings = {
  defaultTimezone: "Europe/London",
  defaultLocale: "en-GB",
  defaultCurrency: "GBP",
  weekStart: "monday",
  productName: "Propvora",
  supportEmail: "support@propvora.com",
  supportUrl: "https://propvora.com/help",
  systemFromEmail: "noreply@propvora.com",
  digestEnabled: true,
  enforceMfaAdmins: true,
  sessionTimeoutMins: 120,
  dataRegion: "uk",
  retentionDays: 365,
  stripeConfigured: false,
  resendConfigured: false,
  supabaseConfigured: false,
}

export async function getGlobalSettingsData(): Promise<GlobalSettingsData> {
  const setting = await readPlatformSetting("global_defaults")
  const v = setting.value ?? {}
  const merged: GlobalSettings = {
    defaultTimezone: (v.default_timezone as string) ?? DEFAULT_GLOBAL.defaultTimezone,
    defaultLocale: (v.default_locale as string) ?? DEFAULT_GLOBAL.defaultLocale,
    defaultCurrency: (v.default_currency as string) ?? DEFAULT_GLOBAL.defaultCurrency,
    weekStart: (v.week_start as string) ?? DEFAULT_GLOBAL.weekStart,
    productName: (v.product_name as string) ?? DEFAULT_GLOBAL.productName,
    supportEmail: (v.support_email as string) ?? DEFAULT_GLOBAL.supportEmail,
    supportUrl: (v.support_url as string) ?? DEFAULT_GLOBAL.supportUrl,
    systemFromEmail: (v.system_from_email as string) ?? DEFAULT_GLOBAL.systemFromEmail,
    digestEnabled: v.digest_enabled !== false,
    enforceMfaAdmins: v.enforce_mfa_admins !== false,
    sessionTimeoutMins: Number(v.session_timeout_mins ?? DEFAULT_GLOBAL.sessionTimeoutMins),
    dataRegion: (v.data_region as string) ?? DEFAULT_GLOBAL.dataRegion,
    retentionDays: Number(v.retention_days ?? DEFAULT_GLOBAL.retentionDays),
    stripeConfigured: !!(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_WEBHOOK_SECRET),
    resendConfigured: !!process.env.RESEND_API_KEY,
    supabaseConfigured: envReady(),
  }
  return { notConfigured: setting.notConfigured, settings: merged, updatedAt: setting.updatedAt }
}

export { DEFAULT_MAINTENANCE, DEFAULT_BAR, DEFAULT_GLOBAL }
