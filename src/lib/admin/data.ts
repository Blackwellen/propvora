import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Cross-workspace read helpers for the platform admin console.
 *
 * All reads use the service-role client. This is legitimate: platform admins
 * see across every workspace. The service-role key is NEVER sent to the client
 * — these functions run only in server components / actions, and callers are
 * gated by requireAdmin()/the (admin) layout guard before invoking them.
 *
 * Every function is 42P01-safe: a missing table/column resolves to an empty /
 * zero result rather than throwing, so the console renders honest empty states.
 */

const MISSING_RELATION = "42P01"
const UNDEFINED_COLUMN = "42703"
// PostgREST surfaces a missing table/view as PGRST205 (not the raw Postgres
// 42P01) and a missing column as PGRST204, because the request fails against the
// schema cache before it ever reaches Postgres. Treat all of these as schema
// gaps so a not-yet-provisioned table renders the honest "not provisioned"
// state rather than a misleading "no rows yet".
const PGRST_MISSING_RELATION = "PGRST205"
const PGRST_MISSING_COLUMN = "PGRST204"

function isSchemaGap(code?: string) {
  return (
    code === MISSING_RELATION ||
    code === UNDEFINED_COLUMN ||
    code === PGRST_MISSING_RELATION ||
    code === PGRST_MISSING_COLUMN
  )
}

/** Safe count of a table, optionally filtered by an equality. */
export async function safeCount(
  table: string,
  filter?: { column: string; value: string },
): Promise<number | null> {
  try {
    const admin = createAdminClient()
    let q = admin.from(table).select("*", { count: "exact", head: true })
    if (filter) q = q.eq(filter.column, filter.value)
    const { count, error } = await q
    if (error) return isSchemaGap(error.code) ? null : 0
    return count ?? 0
  } catch {
    return null
  }
}

export interface PlatformStats {
  workspaces: number | null
  workspacesActive: number | null
  workspacesSuspended: number | null
  users: number | null
  members: number | null
  properties: number | null
  contacts: number | null
  tasks: number | null
  auditEvents: number | null
}

/** Top-line platform counts for the command centre. */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    workspaces,
    workspacesActive,
    workspacesSuspended,
    users,
    members,
    properties,
    contacts,
    tasks,
    auditEvents,
  ] = await Promise.all([
    safeCount("workspaces"),
    safeCount("workspaces", { column: "plan_status", value: "active" }),
    safeCount("workspaces", { column: "plan_status", value: "suspended" }),
    safeCount("profiles"),
    safeCount("workspace_members"),
    safeCount("properties"),
    safeCount("contacts"),
    safeCount("tasks"),
    safeCount("audit_logs"),
  ])
  return {
    workspaces,
    workspacesActive,
    workspacesSuspended,
    users,
    members,
    properties,
    contacts,
    tasks,
    auditEvents,
  }
}

export interface AdminWorkspaceRow {
  id: string
  name: string
  plan: string
  planStatus: string
  ownerName: string | null
  ownerEmail: string | null
  memberCount: number
  createdAt: string | null
}

interface ProfileLite { id: string; full_name: string | null; email: string | null }

/**
 * Fetch a map of profile id -> profile for the given ids. Avoids fragile
 * PostgREST FK-embed hints (which break if constraint names differ) by
 * resolving relations explicitly in JS. 42P01-safe.
 */
async function profilesMap(ids: string[]): Promise<Record<string, ProfileLite>> {
  const out: Record<string, ProfileLite> = {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return out
  try {
    const admin = createAdminClient()
    // profiles has `display_name` (NOT full_name) and no email column — email
    // lives in auth.users. Select only existing columns to avoid a 42703 that
    // would wipe out every owner name in the admin console.
    const { data } = await admin.from("profiles").select("id, display_name").in("id", unique)
    for (const p of data ?? []) {
      out[p.id as string] = {
        id: p.id as string,
        full_name: (p.display_name as string) ?? null,
        email: null,
      }
    }
  } catch { /* ignore */ }
  return out
}

/** All workspaces with owner + member count, newest first. */
export async function listWorkspaces(limit = 500): Promise<AdminWorkspaceRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("workspaces")
      .select("id, name, plan, plan_status, created_at, owner_user_id")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error || !data) return []

    const ids = data.map((w) => w.id as string)
    const counts = await memberCountsFor(ids)
    const owners = await profilesMap(data.map((w) => w.owner_user_id as string))

    return data.map((w) => {
      const owner = owners[w.owner_user_id as string] ?? null
      return {
        id: w.id as string,
        name: (w.name as string) ?? "Unnamed workspace",
        plan: (w.plan as string) ?? "—",
        planStatus: (w.plan_status as string) ?? "active",
        ownerName: owner?.full_name ?? null,
        ownerEmail: owner?.email ?? null,
        memberCount: counts[w.id as string] ?? 0,
        createdAt: (w.created_at as string) ?? null,
      }
    })
  } catch {
    return []
  }
}

/** Map of workspace_id -> member count. 42P01-safe. */
async function memberCountsFor(ids: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  if (ids.length === 0) return out
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .in("workspace_id", ids)
    if (error || !data) return out
    for (const row of data) {
      const wid = row.workspace_id as string
      out[wid] = (out[wid] ?? 0) + 1
    }
    return out
  } catch {
    return out
  }
}

export interface AdminWorkspaceDetail {
  id: string
  name: string
  plan: string
  planStatus: string
  createdAt: string | null
  stripeCustomerId: string | null
  demoDataLoaded: boolean
  owner: { id: string | null; name: string | null; email: string | null }
  members: Array<{ userId: string; name: string | null; email: string | null; role: string; joinedAt: string | null }>
  dataSummary: Record<string, number | null>
  recentAudit: AdminAuditRow[]
}

/** Full detail for one workspace. Returns null if the workspace is missing. */
export async function getWorkspaceDetail(id: string): Promise<AdminWorkspaceDetail | null> {
  try {
    const admin = createAdminClient()
    const { data: ws, error } = await admin
      .from("workspaces")
      .select("id, name, plan, plan_status, created_at, stripe_customer_id, demo_data_loaded, owner_user_id")
      .eq("id", id)
      .maybeSingle()
    if (error || !ws) return null

    const { data: memberRows } = await admin
      .from("workspace_members")
      .select("user_id, role, created_at")
      .eq("workspace_id", id)
      .order("created_at", { ascending: true })

    const profileIds = [ws.owner_user_id as string, ...(memberRows ?? []).map((m) => m.user_id as string)]
    const [profiles, emails] = await Promise.all([
      profilesMap(profileIds),
      emailsFor(profileIds),
    ])
    const owner = profiles[ws.owner_user_id as string] ?? null

    const members = (memberRows ?? []).map((m) => {
      const p = profiles[m.user_id as string] ?? null
      return {
        userId: m.user_id as string,
        name: p?.full_name ?? null,
        email: emails[m.user_id as string] ?? null,
        role: (m.role as string) ?? "member",
        joinedAt: (m.created_at as string) ?? null,
      }
    })

    const [properties, contacts, tasks, tenancies, documents, invoices] = await Promise.all([
      safeCount("properties", { column: "workspace_id", value: id }),
      safeCount("contacts", { column: "workspace_id", value: id }),
      safeCount("tasks", { column: "workspace_id", value: id }),
      safeCount("tenancies", { column: "workspace_id", value: id }),
      safeCount("documents", { column: "workspace_id", value: id }),
      safeCount("invoices", { column: "workspace_id", value: id }),
    ])

    const recentAudit = await listAudit({ workspaceId: id, limit: 15 })

    return {
      id: ws.id as string,
      name: (ws.name as string) ?? "Unnamed workspace",
      plan: (ws.plan as string) ?? "—",
      planStatus: (ws.plan_status as string) ?? "active",
      createdAt: (ws.created_at as string) ?? null,
      stripeCustomerId: (ws.stripe_customer_id as string) ?? null,
      demoDataLoaded: Boolean(ws.demo_data_loaded),
      owner: { id: owner?.id ?? (ws.owner_user_id as string) ?? null, name: owner?.full_name ?? null, email: emails[ws.owner_user_id as string] ?? null },
      members,
      dataSummary: { properties, contacts, tasks, tenancies, documents, invoices },
      recentAudit,
    }
  } catch {
    return null
  }
}

export interface AdminUserRow {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: string | null
  workspaceCount: number
}

/** All platform users (profiles) with their membership count. */
export async function listUsers(limit = 500): Promise<AdminUserRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name:display_name, role:platform_role, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error || !data) return []

    const ids = data.map((p) => p.id as string)
    const [memberships, emails] = await Promise.all([
      membershipCountsFor(ids),
      emailsFor(ids),
    ])

    return data.map((p) => ({
      id: p.id as string,
      name: (p.full_name as string) ?? null,
      email: emails[p.id as string] ?? null, // resolved from auth.users
      role: (p.role as string) ?? "user",
      createdAt: (p.created_at as string) ?? null,
      workspaceCount: memberships[p.id as string] ?? 0,
    }))
  } catch {
    return []
  }
}

async function membershipCountsFor(userIds: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  if (userIds.length === 0) return out
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("workspace_members")
      .select("user_id")
      .in("user_id", userIds)
    if (error || !data) return out
    for (const row of data) {
      const uid = row.user_id as string
      out[uid] = (out[uid] ?? 0) + 1
    }
    return out
  } catch {
    return out
  }
}

export interface AdminUserDetail {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  role: string
  phone: string | null
  country: string | null
  createdAt: string | null
  memberships: Array<{ workspaceId: string; workspaceName: string; role: string; joinedAt: string | null }>
  recentAudit: AdminAuditRow[]
  security: {
    emailConfirmed: boolean
    lastSignInAt: string | null
    banned: boolean
    mfaEnrolled: boolean
    provider: string | null
  }
}

export async function getUserDetail(id: string): Promise<AdminUserDetail | null> {
  try {
    const admin = createAdminClient()
    const { data: p, error } = await admin
      .from("profiles")
      .select("id, full_name:display_name, first_name, last_name, role:platform_role, phone, country_code, created_at")
      .eq("id", id)
      .maybeSingle()
    if (error || !p) return null

    const { data: memberRows } = await admin
      .from("workspace_members")
      .select("workspace_id, role, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: true })

    const wsNames = await workspaceNameMap()

    const memberships = (memberRows ?? []).map((m) => {
      return {
        workspaceId: m.workspace_id as string,
        workspaceName: wsNames[m.workspace_id as string] ?? "Workspace",
        role: (m.role as string) ?? "member",
        joinedAt: (m.created_at as string) ?? null,
      }
    })

    const recentAudit = await listAudit({ userId: id, limit: 15 })

    // Auth-layer security facts (email, sign-in, ban, MFA) from auth.users.
    let email: string | null = null
    const security = {
      emailConfirmed: false,
      lastSignInAt: null as string | null,
      banned: false,
      mfaEnrolled: false,
      provider: null as string | null,
    }
    try {
      const { data: au } = await admin.auth.admin.getUserById(id)
      const u = au?.user
      if (u) {
        email = u.email ?? null
        security.emailConfirmed = !!u.email_confirmed_at
        security.lastSignInAt = u.last_sign_in_at ?? null
        // banned_until is exposed on the admin user object at runtime.
        const bannedUntil = (u as unknown as { banned_until?: string }).banned_until
        security.banned = !!bannedUntil && new Date(bannedUntil) > new Date()
        security.mfaEnrolled = (u.factors ?? []).some((f) => f.status === "verified")
        security.provider = (u.app_metadata?.provider as string) ?? null
      }
    } catch { /* non-fatal */ }

    return {
      id: p.id as string,
      name: (p.full_name as string) ?? null,
      firstName: (p.first_name as string) ?? null,
      lastName: (p.last_name as string) ?? null,
      email,
      role: (p.role as string) ?? "user",
      phone: (p.phone as string) ?? null,
      country: (p.country_code as string) ?? null,
      createdAt: (p.created_at as string) ?? null,
      memberships,
      recentAudit,
      security,
    }
  } catch {
    return null
  }
}

export interface AdminAuditRow {
  id: string
  createdAt: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  workspaceId: string | null
  workspaceName: string | null
  actorId: string | null
  actorName: string | null
  actorEmail: string | null
  ip: string | null
  before: unknown
  after: unknown
}

export interface AuditFilter {
  workspaceId?: string
  userId?: string
  action?: string
  since?: string
  limit?: number
}

/**
 * Read audit_logs with optional filters, newest first. 42P01-safe.
 * Resolves actor + workspace names with explicit follow-up queries rather than
 * PostgREST FK embeds (robust to constraint-name differences).
 */
export async function listAudit(filter: AuditFilter = {}): Promise<AdminAuditRow[]> {
  try {
    const admin = createAdminClient()
    let q = admin
      .from("audit_logs")
      .select("id, created_at, action, resource_type, resource_id, workspace_id, user_id, old_data, new_data, ip_address")
      .order("created_at", { ascending: false })
      .limit(filter.limit ?? 200)
    if (filter.workspaceId) q = q.eq("workspace_id", filter.workspaceId)
    if (filter.userId) q = q.eq("user_id", filter.userId)
    if (filter.action) q = q.eq("action", filter.action)
    if (filter.since) q = q.gte("created_at", filter.since)

    const { data, error } = await q
    if (error || !data) return []

    const actors = await profilesMap(data.map((r) => r.user_id as string).filter(Boolean) as string[])
    const wsNames = await workspaceNameMap()

    return data.map((r) => {
      const actor = actors[r.user_id as string] ?? null
      return {
        id: r.id as string,
        createdAt: (r.created_at as string) ?? null,
        action: (r.action as string) ?? "",
        resourceType: (r.resource_type as string) ?? null,
        resourceId: (r.resource_id as string) ?? null,
        workspaceId: (r.workspace_id as string) ?? null,
        workspaceName: r.workspace_id ? wsNames[r.workspace_id as string] ?? null : null,
        actorId: (r.user_id as string) ?? null,
        actorName: actor?.full_name ?? null,
        actorEmail: actor?.email ?? null,
        ip: (r.ip_address as string) ?? null,
        before: r.old_data ?? null,
        after: r.new_data ?? null,
      }
    })
  } catch {
    return []
  }
}

/** Distinct action values present in audit_logs (for filter dropdown). */
export async function distinctAuditActions(): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("audit_logs")
      .select("action")
      .limit(1000)
    if (error || !data) return []
    return Array.from(new Set(data.map((r) => r.action as string).filter(Boolean))).sort()
  } catch {
    return []
  }
}

// ── Cross-workspace diagnostics (admin/support read-only views) ─────────────

export interface DiagnosticRow {
  id: string
  workspaceId: string
  workspaceName: string
  primary: string
  secondary: string | null
  status: string | null
  meta: string | null
}

async function workspaceNameMap(): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("workspaces").select("id, name").limit(1000)
    for (const w of data ?? []) out[w.id as string] = (w.name as string) ?? "Workspace"
  } catch { /* ignore */ }
  return out
}

/** Cross-workspace properties for diagnostics. 42P01-safe. */
export async function listAllProperties(limit = 300): Promise<DiagnosticRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("properties")
      .select("id, workspace_id, name:nickname, address_line1, city, postcode, template, status")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error || !data) return []
    const names = await workspaceNameMap()
    return data.map((p) => ({
      id: p.id as string,
      workspaceId: p.workspace_id as string,
      workspaceName: names[p.workspace_id as string] ?? "—",
      primary: (p.name as string) || (p.address_line1 as string) || "Untitled property",
      secondary: [p.city, p.postcode].filter(Boolean).join(", ") || null,
      status: (p.status as string) ?? null,
      meta: (p.template as string) ?? null,
    }))
  } catch {
    return []
  }
}

/** Cross-workspace contacts for diagnostics. */
export async function listAllContacts(limit = 300): Promise<DiagnosticRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("contacts")
      .select("id, workspace_id, full_name:display_name, email, contact_type:type, status")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error || !data) return []
    const names = await workspaceNameMap()
    return data.map((c) => ({
      id: c.id as string,
      workspaceId: c.workspace_id as string,
      workspaceName: names[c.workspace_id as string] ?? "—",
      primary: (c.full_name as string) || "Unnamed contact",
      secondary: (c.email as string) ?? null,
      status: (c.status as string) ?? null,
      meta: (c.contact_type as string) ?? null,
    }))
  } catch {
    return []
  }
}

/** Cross-workspace tasks for diagnostics. */
export async function listAllTasks(limit = 300): Promise<DiagnosticRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("tasks")
      .select("id, workspace_id, title, status, priority, due_date:due_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error || !data) return []
    const names = await workspaceNameMap()
    return data.map((t) => ({
      id: t.id as string,
      workspaceId: t.workspace_id as string,
      workspaceName: names[t.workspace_id as string] ?? "—",
      primary: (t.title as string) || "Untitled task",
      secondary: t.due_date ? `Due ${new Date(t.due_date as string).toLocaleDateString("en-GB")}` : null,
      status: (t.status as string) ?? null,
      meta: (t.priority as string) ?? null,
    }))
  } catch {
    return []
  }
}

/** Cross-workspace planning sets for diagnostics. */
export async function listAllPlanningSets(limit = 300): Promise<DiagnosticRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("planning_sets")
      .select("id, workspace_id, title, operation_profile, status, postcode")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error || !data) return []
    const names = await workspaceNameMap()
    return data.map((p) => ({
      id: p.id as string,
      workspaceId: p.workspace_id as string,
      workspaceName: names[p.workspace_id as string] ?? "—",
      primary: (p.title as string) || "Untitled plan",
      secondary: (p.postcode as string) ?? null,
      status: (p.status as string) ?? null,
      meta: (p.operation_profile as string) ?? null,
    }))
  } catch {
    return []
  }
}

// ── Customers ────────────────────────────────────────────────────────────────

export interface AdminCustomerRow {
  ownerId: string
  name: string | null
  email: string | null
  workspaceCount: number
  primaryWorkspaceId: string
  primaryWorkspaceName: string
  plan: string
  planStatus: string
  createdAt: string | null
}

/**
 * Customers view. If a dedicated `platform_customers` table exists we'd use it,
 * but absent that we DERIVE customers from workspaces + their owners (each owner
 * = one customer account). This is honest: it's real data, clearly labelled as
 * derived, not a fabricated CRM.
 */
export async function listCustomers(): Promise<{ derived: boolean; rows: AdminCustomerRow[] }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("workspaces")
      .select("id, name, plan, plan_status, created_at, owner_user_id")
      .order("created_at", { ascending: false })
      .limit(1000)
    if (error || !data) return { derived: true, rows: [] }

    const owners = await profilesMap(data.map((w) => w.owner_user_id as string))

    // Group by owner.
    const byOwner: Record<string, AdminCustomerRow> = {}
    for (const w of data) {
      const oid = w.owner_user_id as string
      if (!oid) continue
      if (!byOwner[oid]) {
        const o = owners[oid] ?? null
        byOwner[oid] = {
          ownerId: oid,
          name: o?.full_name ?? null,
          email: o?.email ?? null,
          workspaceCount: 0,
          primaryWorkspaceId: w.id as string,
          primaryWorkspaceName: (w.name as string) ?? "Workspace",
          plan: (w.plan as string) ?? "—",
          planStatus: (w.plan_status as string) ?? "active",
          createdAt: (w.created_at as string) ?? null,
        }
      }
      byOwner[oid].workspaceCount += 1
    }

    return { derived: true, rows: Object.values(byOwner) }
  } catch {
    return { derived: true, rows: [] }
  }
}

// ── Subscriptions (billing) ─────────────────────────────────────────────────

export interface AdminSubscriptionRow {
  id: string
  workspaceId: string
  workspaceName: string
  plan: string
  status: string
  stripeSubscriptionId: string | null
  periodEnd: string | null
}

/**
 * Live subscriptions. Returns `available: false` only if the table is missing.
 * Empty array with available:true => honest "no billing data yet" state.
 */
export async function listSubscriptions(limit = 500): Promise<{ available: boolean; rows: AdminSubscriptionRow[] }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("subscriptions")
      .select("id, workspace_id, plan, status, stripe_subscription_id, current_period_end")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, rows: [] }
      return { available: true, rows: [] }
    }
    const names = await workspaceNameMap()
    return {
      available: true,
      rows: (data ?? []).map((s) => ({
        id: s.id as string,
        workspaceId: s.workspace_id as string,
        workspaceName: names[s.workspace_id as string] ?? "—",
        plan: (s.plan as string) ?? "—",
        status: (s.status as string) ?? "—",
        stripeSubscriptionId: (s.stripe_subscription_id as string) ?? null,
        periodEnd: (s.current_period_end as string) ?? null,
      })),
    }
  } catch {
    return { available: false, rows: [] }
  }
}

// ── Affiliates ───────────────────────────────────────────────────────────────

export interface AdminAffiliateRow {
  id: string            // workspace_id (PK of affiliates)
  name: string | null   // workspace name
  email: string | null  // payout_email
  code: string          // referral_code
  status: string        // derived: active | pending | none
  origin: string
  commissionRate: number
  referrals: number
  pendingPence: number
  clearedPence: number
  paidPence: number
  createdAt: string | null
}

export async function listAffiliates(limit = 500): Promise<{ available: boolean; rows: AdminAffiliateRow[] }> {
  try {
    const admin = createAdminClient()
    // Live affiliates table is workspace-keyed (no `id`/`user_id`/`code` columns).
    const { data, error } = await admin
      .from("affiliates")
      .select("workspace_id, enrolled, approved, origin, band, referral_code, payout_email, active_referrals_count, pending_pence, cleared_pence, paid_pence, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, rows: [] }
      return { available: true, rows: [] }
    }

    const rows = data ?? []
    const wsIds = rows.map((a) => a.workspace_id as string)

    // Workspace names (best-effort).
    const names: Record<string, string> = {}
    if (wsIds.length) {
      try {
        const { data: ws } = await admin.from("workspaces").select("id, name").in("id", wsIds)
        for (const w of ws ?? []) names[w.id as string] = (w.name as string) ?? ""
      } catch { /* non-fatal */ }
    }

    const { levelByBand } = await import("@/lib/affiliate/levels")

    return {
      available: true,
      rows: rows.map((a) => {
        const enrolled = !!a.enrolled
        const approved = !!a.approved
        const status = !enrolled ? "none" : approved ? "active" : "pending"
        return {
          id: a.workspace_id as string,
          name: names[a.workspace_id as string] ?? null,
          email: (a.payout_email as string) ?? null,
          code: (a.referral_code as string) ?? "—",
          status,
          origin: (a.origin as string) ?? "internal",
          commissionRate: levelByBand(a.band as number | null).rate,
          referrals: Number(a.active_referrals_count ?? 0),
          pendingPence: Number(a.pending_pence ?? 0),
          clearedPence: Number(a.cleared_pence ?? 0),
          paidPence: Number(a.paid_pence ?? 0),
          createdAt: (a.created_at as string) ?? null,
        }
      }),
    }
  } catch {
    return { available: false, rows: [] }
  }
}

export interface AdminAffiliateApplication {
  id: string
  fullName: string
  email: string
  company: string | null
  website: string | null
  audienceType: string | null
  promotionPlan: string | null
  country: string | null
  existingCustomer: boolean
  referralCode: string | null
  status: string
  createdAt: string | null
}

export async function listAffiliateApplications(
  limit = 500
): Promise<{ available: boolean; rows: AdminAffiliateApplication[] }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("affiliate_applications")
      .select("id, full_name, email, company, website, audience_type, promotion_plan, country, existing_customer, referral_code, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, rows: [] }
      return { available: true, rows: [] }
    }
    return {
      available: true,
      rows: (data ?? []).map((a) => ({
        id: a.id as string,
        fullName: (a.full_name as string) ?? "—",
        email: (a.email as string) ?? "—",
        company: (a.company as string) ?? null,
        website: (a.website as string) ?? null,
        audienceType: (a.audience_type as string) ?? null,
        promotionPlan: (a.promotion_plan as string) ?? null,
        country: (a.country as string) ?? null,
        existingCustomer: !!a.existing_customer,
        referralCode: (a.referral_code as string) ?? null,
        status: (a.status as string) ?? "pending_review",
        createdAt: (a.created_at as string) ?? null,
      })),
    }
  } catch {
    return { available: false, rows: [] }
  }
}

export interface AdminAffiliateDetail {
  workspaceId: string
  workspaceName: string | null
  enrolled: boolean
  approved: boolean
  origin: string
  band: string
  referralCode: string | null
  payoutEmail: string | null
  commissionRate: number
  referrals: number
  pendingPence: number
  clearedPence: number
  paidPence: number
  createdAt: string | null
  appliedAt: string | null
  recentAudit: AdminAuditRow[]
}

/** Full detail for one enrolled affiliate (keyed by workspace_id). */
export async function getAffiliateDetail(workspaceId: string): Promise<AdminAffiliateDetail | null> {
  try {
    const admin = createAdminClient()
    const { data: a, error } = await admin
      .from("affiliates")
      .select("workspace_id, enrolled, approved, origin, band, referral_code, payout_email, active_referrals_count, pending_pence, cleared_pence, paid_pence, created_at, applied_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error || !a) return null

    let workspaceName: string | null = null
    try {
      const { data: ws } = await admin.from("workspaces").select("name").eq("id", workspaceId).maybeSingle()
      workspaceName = (ws?.name as string) ?? null
    } catch { /* ignore */ }

    const { levelByBand } = await import("@/lib/affiliate/levels")
    const recentAudit = await listAudit({ workspaceId, limit: 15 })

    return {
      workspaceId,
      workspaceName,
      enrolled: !!a.enrolled,
      approved: !!a.approved,
      origin: (a.origin as string) ?? "internal",
      band: (a.band as string) ?? "starter",
      referralCode: (a.referral_code as string) ?? null,
      payoutEmail: (a.payout_email as string) ?? null,
      commissionRate: levelByBand(a.band as unknown as number | null).rate,
      referrals: Number(a.active_referrals_count ?? 0),
      pendingPence: Number(a.pending_pence ?? 0),
      clearedPence: Number(a.cleared_pence ?? 0),
      paidPence: Number(a.paid_pence ?? 0),
      createdAt: (a.created_at as string) ?? null,
      appliedAt: (a.applied_at as string) ?? null,
      recentAudit,
    }
  } catch {
    return null
  }
}

// ── Feature flags & platform settings ──────────────────────────────────────

export interface PlatformFlag {
  key: string
  enabled: boolean
  description: string | null
  workspaceAllowlist: string[]
  planGate: string | null
}

/**
 * Read platform feature flags. Returns `{ available: false }` if the
 * platform_feature_flags table has not been created yet (migration pending).
 */
export async function getPlatformFlags(): Promise<{ available: boolean; flags: PlatformFlag[] }> {
  try {
    const admin = createAdminClient()
    // Live schema: flag_key / name / enabled / description / enabled_for_plans.
    const { data, error } = await admin
      .from("platform_feature_flags")
      .select("flag_key, name, enabled, description, enabled_for_plans")
      .order("flag_key", { ascending: true })
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, flags: [] }
      return { available: true, flags: [] }
    }
    return {
      available: true,
      flags: (data ?? []).map((f) => {
        const plans = f.enabled_for_plans
        const planGate = Array.isArray(plans)
          ? (plans as string[]).join(", ") || null
          : (plans as string | null) ?? null
        return {
          key: f.flag_key as string,
          enabled: Boolean(f.enabled),
          description: (f.description as string) ?? (f.name as string) ?? null,
          workspaceAllowlist: [], // not modelled in the live schema
          planGate,
        }
      }),
    }
  } catch {
    return { available: false, flags: [] }
  }
}

// ── Email resolution (auth.users) ───────────────────────────────────────────

/**
 * Resolve emails for a set of user ids from auth.users via the admin API.
 * profiles has no email column, so this is the authoritative source. Paginates
 * the admin list (capped) and returns a sparse id->email map. Never throws.
 */
export async function emailsFor(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const want = new Set(ids.filter(Boolean))
  if (want.size === 0) return out
  try {
    const admin = createAdminClient()
    // The admin API lists users page-by-page; for the admin console scale this
    // is fine. Cap at 10 pages (10k users) to bound work.
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error || !data?.users?.length) break
      for (const u of data.users) {
        if (want.has(u.id) && u.email) out[u.id] = u.email
      }
      if (data.users.length < 1000) break
      if (Object.keys(out).length >= want.size) break
    }
  } catch { /* ignore */ }
  return out
}

/** Resolve a single user's email (auth.users). */
export async function emailForUser(id: string): Promise<string | null> {
  if (!id) return null
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.getUserById(id)
    if (error || !data?.user) return null
    return data.user.email ?? null
  } catch {
    return null
  }
}

// ── User picker (for create-workspace / create-affiliate selectors) ──────────

export interface UserPick { id: string; name: string | null; email: string | null }

/** Lightweight list of users for owner/assignment pickers. */
export async function listUserPicks(limit = 200): Promise<UserPick[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("profiles")
      .select("id, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    const ids = (data ?? []).map((p) => p.id as string)
    const emails = await emailsFor(ids)
    return (data ?? []).map((p) => ({
      id: p.id as string,
      name: (p.display_name as string) ?? null,
      email: emails[p.id as string] ?? null,
    }))
  } catch {
    return []
  }
}

/** Workspaces NOT yet enrolled as affiliates (for the create-affiliate picker). */
export async function listWorkspacePicks(limit = 300): Promise<Array<{ id: string; name: string }>> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("workspaces")
      .select("id, name")
      .order("created_at", { ascending: false })
      .limit(limit)
    let enrolled = new Set<string>()
    try {
      const { data: aff } = await admin.from("affiliates").select("workspace_id")
      enrolled = new Set((aff ?? []).map((a) => a.workspace_id as string))
    } catch { /* ignore */ }
    return (data ?? [])
      .map((w) => ({ id: w.id as string, name: (w.name as string) ?? "Workspace" }))
      .filter((w) => !enrolled.has(w.id))
  } catch {
    return []
  }
}

// ── Dashboard KPI time-series (real, from created_at) ────────────────────────

export interface TrendPoint { label: string; value: number }
export interface DashboardTrends {
  workspacesByMonth: TrendPoint[]
  usersByMonth: TrendPoint[]
  planMix: Array<{ label: string; value: number }>
  statusMix: Array<{ label: string; value: number }>
}

function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function lastNMonths(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return out
}

/** Real growth + composition series for the dashboard charts. 42P01-safe. */
export async function getDashboardTrends(): Promise<DashboardTrends> {
  const admin = createAdminClient()
  const months = lastNMonths(6)
  const labelFor = (k: string) => {
    const [, m] = k.split("-")
    return new Date(2000, Number(m) - 1, 1).toLocaleDateString("en-GB", { month: "short" })
  }

  const empty: DashboardTrends = {
    workspacesByMonth: months.map((k) => ({ label: labelFor(k), value: 0 })),
    usersByMonth: months.map((k) => ({ label: labelFor(k), value: 0 })),
    planMix: [],
    statusMix: [],
  }

  try {
    const [wsRes, profRes] = await Promise.all([
      admin.from("workspaces").select("created_at, plan, plan_status").limit(5000),
      admin.from("profiles").select("created_at").limit(5000),
    ])

    const wsCounts: Record<string, number> = {}
    const planMix: Record<string, number> = {}
    const statusMix: Record<string, number> = {}
    for (const w of wsRes.data ?? []) {
      if (w.created_at) {
        const k = monthKey(w.created_at as string)
        wsCounts[k] = (wsCounts[k] ?? 0) + 1
      }
      const plan = (w.plan as string) ?? "starter"
      planMix[plan] = (planMix[plan] ?? 0) + 1
      const st = (w.plan_status as string) ?? "active"
      statusMix[st] = (statusMix[st] ?? 0) + 1
    }

    const userCounts: Record<string, number> = {}
    for (const p of profRes.data ?? []) {
      if (p.created_at) {
        const k = monthKey(p.created_at as string)
        userCounts[k] = (userCounts[k] ?? 0) + 1
      }
    }

    return {
      workspacesByMonth: months.map((k) => ({ label: labelFor(k), value: wsCounts[k] ?? 0 })),
      usersByMonth: months.map((k) => ({ label: labelFor(k), value: userCounts[k] ?? 0 })),
      planMix: Object.entries(planMix).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      statusMix: Object.entries(statusMix).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    }
  } catch {
    return empty
  }
}

/**
 * Read a platform setting blob by key.
 * Returns `{ available: false }` if the platform_settings table is missing.
 */
export async function getPlatformSetting(
  key: string,
): Promise<{ available: boolean; value: Record<string, unknown> | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle()
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, value: null }
      return { available: true, value: null }
    }
    return { available: true, value: (data?.value as Record<string, unknown>) ?? null }
  } catch {
    return { available: false, value: null }
  }
}

// ── Extended platform stats for deepened command centre ──────────────────────

export interface ExtendedPlatformStats {
  /** Count of workspaces with workspace_type / type = 'operator' and plan_status active. */
  activeOperators: number | null
  /** Count of workspaces with workspace_type / type = 'supplier' and plan_status active. */
  activeSuppliers: number | null
  /** Count of workspace_members where role = 'customer' (or customer-type workspaces). */
  activeCustomers: number | null
  /** Platform gross GMV from marketplace_transactions (sum gross_pence, status != failed). */
  platformGmvPence: number | null
  /** Open / unresolved disputes count. */
  openDisputes: number | null
  /** Pending supplier verifications. */
  pendingVerifications: number | null
  /** MRR from subscriptions table (sum of amount_pence for active subscriptions). */
  mrrPence: number | null
}

/** Extended platform stats — each field independently 42P01-safe. */
export async function getExtendedPlatformStats(): Promise<ExtendedPlatformStats> {
  const admin = createAdminClient()

  async function countWorkspacesByType(type: string): Promise<number | null> {
    try {
      // Try workspace_type first, then type column.
      let { count, error } = await admin
        .from("workspaces")
        .select("*", { count: "exact", head: true })
        .eq("plan_status", "active")
        .eq("workspace_type", type)
      if (!error && count != null) return count
      // Fallback to `type` column.
      const res2 = await admin
        .from("workspaces")
        .select("*", { count: "exact", head: true })
        .eq("plan_status", "active")
        .eq("type", type)
      if (res2.error) return isSchemaGap(res2.error.code) ? null : 0
      return res2.count ?? 0
    } catch {
      return null
    }
  }

  async function sumGmvPence(): Promise<number | null> {
    try {
      const { data, error } = await admin
        .from("marketplace_transactions")
        .select("gross_pence")
        .neq("status", "failed")
        .limit(10000)
      if (error) return isSchemaGap(error.code) ? null : 0
      return (data ?? []).reduce((s, r) => s + (Number(r.gross_pence) || 0), 0)
    } catch {
      return null
    }
  }

  async function countOpenDisputes(): Promise<number | null> {
    try {
      const { count, error } = await admin
        .from("marketplace_disputes")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "under_review"])
      if (error) return isSchemaGap(error.code) ? null : 0
      return count ?? 0
    } catch {
      return null
    }
  }

  async function countPendingVerifications(): Promise<number | null> {
    try {
      const { count, error } = await admin
        .from("supplier_workspace_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending")
      if (error) return isSchemaGap(error.code) ? null : 0
      return count ?? 0
    } catch {
      return null
    }
  }

  async function calcMrrPence(): Promise<number | null> {
    try {
      const { data, error } = await admin
        .from("subscriptions")
        .select("amount_pence")
        .eq("status", "active")
        .limit(10000)
      if (error) return isSchemaGap(error.code) ? null : 0
      return (data ?? []).reduce((s, r) => s + (Number(r.amount_pence) || 0), 0)
    } catch {
      return null
    }
  }

  async function countActiveCustomers(): Promise<number | null> {
    try {
      // Customers = workspace_members with role 'customer', or workspaces of type 'customer'.
      const { count, error } = await admin
        .from("workspace_members")
        .select("*", { count: "exact", head: true })
        .eq("role", "customer")
      if (error) return isSchemaGap(error.code) ? null : 0
      return count ?? 0
    } catch {
      return null
    }
  }

  const [
    activeOperators,
    activeSuppliers,
    activeCustomers,
    platformGmvPence,
    openDisputes,
    pendingVerifications,
    mrrPence,
  ] = await Promise.all([
    countWorkspacesByType("operator"),
    countWorkspacesByType("supplier"),
    countActiveCustomers(),
    sumGmvPence(),
    countOpenDisputes(),
    countPendingVerifications(),
    calcMrrPence(),
  ])

  return {
    activeOperators,
    activeSuppliers,
    activeCustomers,
    platformGmvPence,
    openDisputes,
    pendingVerifications,
    mrrPence,
  }
}

/** Pending supplier verifications with enough detail for a quick-action queue. */
export interface PendingVerificationRow {
  workspaceId: string
  workspaceName: string | null
  submittedAt: string | null
  verificationStatus: string
  contactEmail: string | null
  businessName: string | null
  verificationId: string | null
}

export async function listPendingVerifications(limit = 10): Promise<PendingVerificationRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_workspace_profiles")
      // live schema: status / display_name (aliased to the row shape the map reads). No contact_email column.
      .select("workspace_id, verification_status:status, created_at, business_name:display_name")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit)
    if (error || !data) return []

    const wsIds = data.map((r) => r.workspace_id as string).filter(Boolean)
    const names: Record<string, string> = {}
    if (wsIds.length) {
      try {
        const { data: ws } = await admin.from("workspaces").select("id, name").in("id", wsIds)
        for (const w of ws ?? []) names[w.id as string] = (w.name as string) ?? ""
      } catch { /* ignore */ }
    }

    return data.map((r) => ({
      workspaceId: r.workspace_id as string,
      workspaceName: names[r.workspace_id as string] ?? null,
      submittedAt: (r.created_at as string) ?? null,
      verificationStatus: (r.verification_status as string) ?? "pending",
      contactEmail: null, // no contact_email column on supplier_workspace_profiles (live schema)
      businessName: (r.business_name as string) ?? null,
      verificationId: null, // resolved per individual supplier_verification record if needed
    }))
  } catch {
    return []
  }
}

/** Open disputes with summary for the admin dashboard queue. */
export interface OpenDisputeRow {
  id: string
  transactionId: string | null
  reason: string | null
  status: string
  raisedByWorkspaceName: string | null
  createdAt: string | null
}

export async function listOpenDisputes(limit = 8): Promise<OpenDisputeRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("marketplace_disputes")
      .select("id, transaction_id, reason, status, raised_by_workspace_id, created_at")
      .in("status", ["open", "under_review"])
      .order("created_at", { ascending: true })
      .limit(limit)
    if (error || !data) return []

    const wsIds = data.map((r) => r.raised_by_workspace_id as string).filter(Boolean)
    const names: Record<string, string> = {}
    if (wsIds.length) {
      try {
        const { data: ws } = await admin.from("workspaces").select("id, name").in("id", wsIds)
        for (const w of ws ?? []) names[w.id as string] = (w.name as string) ?? ""
      } catch { /* ignore */ }
    }

    return data.map((r) => ({
      id: r.id as string,
      transactionId: (r.transaction_id as string) ?? null,
      reason: (r.reason as string) ?? null,
      status: (r.status as string) ?? "open",
      raisedByWorkspaceName: names[r.raised_by_workspace_id as string] ?? null,
      createdAt: (r.created_at as string) ?? null,
    }))
  } catch {
    return []
  }
}
