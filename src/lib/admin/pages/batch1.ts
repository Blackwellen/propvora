import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Batch-1 page data helpers for the Platform Admin console (img-01…img-10).
 *
 * These are ADDITIVE to src/lib/admin/data.ts (which is imported read-only).
 * Every function follows the same 42P01-safe pattern: a missing table/column
 * resolves to an empty / null result so pages render honest empty / not-
 * provisioned states rather than throwing or fabricating numbers.
 *
 * All reads use the service-role client and only run server-side behind the
 * (admin) layout guard.
 */

const MISSING_RELATION = "42P01"
const UNDEFINED_COLUMN = "42703"
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

// ── Customers page KPIs (img-02) ─────────────────────────────────────────────

export interface CustomerKpis {
  total: number
  active: number
  trialing: number
  churnRisk: number
  workspaces: number
  enterprise: number
  /** id->count of plan distribution across owner workspaces (derived). */
  planMix: Array<{ label: string; value: number }>
  newThisMonth: number
}

/**
 * Derive customer-level KPIs from workspaces + their owners. Honest: derived
 * data, not a fabricated CRM. Mirrors listCustomers() grouping (one owner = one
 * customer).
 */
export async function getCustomerKpis(): Promise<CustomerKpis> {
  const empty: CustomerKpis = {
    total: 0, active: 0, trialing: 0, churnRisk: 0, workspaces: 0, enterprise: 0,
    planMix: [], newThisMonth: 0,
  }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("workspaces")
      .select("owner_user_id, plan, plan_status, created_at")
      .limit(5000)
    if (error || !data) return empty

    const owners = new Map<string, { plan: string; status: string; createdAt: string | null }>()
    const planMix: Record<string, number> = {}
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    for (const w of data) {
      const oid = w.owner_user_id as string
      if (!oid) continue
      const plan = (w.plan as string) ?? "starter"
      const status = (w.plan_status as string) ?? "active"
      planMix[plan] = (planMix[plan] ?? 0) + 1
      // Each owner counts once for the customer-level rollup.
      if (!owners.has(oid)) {
        owners.set(oid, { plan, status, createdAt: (w.created_at as string) ?? null })
      }
    }

    let active = 0, trialing = 0, churnRisk = 0, enterprise = 0, newThisMonth = 0
    for (const c of owners.values()) {
      if (c.status === "active") active++
      if (c.status === "trial" || c.status === "trialing") trialing++
      if (c.status === "past_due" || c.status === "suspended" || c.status === "canceled") churnRisk++
      if (c.plan === "enterprise") enterprise++
      if (c.createdAt && new Date(c.createdAt) >= monthStart) newThisMonth++
    }

    return {
      total: owners.size,
      active,
      trialing,
      churnRisk,
      workspaces: data.length,
      enterprise,
      planMix: Object.entries(planMix).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      newThisMonth,
    }
  } catch {
    return empty
  }
}

// ── Users page KPIs (img-04) ─────────────────────────────────────────────────

export interface UserKpis {
  total: number
  activeLast30: number | null
  admins: number
  suspended: number | null
  unassigned: number
  mfaEnabled: number | null
  roleMix: Array<{ label: string; value: number }>
}

/**
 * User-level KPIs. Counts derived from profiles + workspace_members; auth-layer
 * facts (active-in-30d / suspended / MFA) come from auth.users (best-effort,
 * null if unavailable).
 */
export async function getUserKpis(): Promise<UserKpis> {
  const empty: UserKpis = {
    total: 0, activeLast30: null, admins: 0, suspended: null, unassigned: 0,
    mfaEnabled: null, roleMix: [],
  }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("profiles")
      .select("id, platform_role")
      .limit(10000)
    if (error || !data) return empty

    const roleMix: Record<string, number> = {}
    let admins = 0
    for (const p of data) {
      const role = (p.platform_role as string) ?? "user"
      roleMix[role] = (roleMix[role] ?? 0) + 1
      if (role === "platform_admin" || role === "admin") admins++
    }

    // Membership presence → users with no workspace membership.
    const memberIds = new Set<string>()
    try {
      const { data: m } = await admin.from("workspace_members").select("user_id").limit(20000)
      for (const row of m ?? []) memberIds.add(row.user_id as string)
    } catch { /* ignore */ }
    const unassigned = data.filter((p) => !memberIds.has(p.id as string)).length

    // Auth-layer aggregates (active-30d / suspended / mfa). Best-effort, capped.
    let activeLast30: number | null = null
    let suspended: number | null = null
    let mfaEnabled: number | null = null
    try {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
      let a = 0, s = 0, mf = 0, scanned = 0
      for (let page = 1; page <= 10; page++) {
        const { data: au, error: aErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
        if (aErr || !au?.users?.length) break
        for (const u of au.users) {
          scanned++
          if (u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() >= cutoff) a++
          const bannedUntil = (u as unknown as { banned_until?: string }).banned_until
          if (bannedUntil && new Date(bannedUntil) > new Date()) s++
          if ((u.factors ?? []).some((f) => f.status === "verified")) mf++
        }
        if (au.users.length < 1000) break
      }
      if (scanned > 0) { activeLast30 = a; suspended = s; mfaEnabled = mf }
    } catch { /* non-fatal */ }

    return {
      total: data.length,
      activeLast30,
      admins,
      suspended,
      unassigned,
      mfaEnabled,
      roleMix: Object.entries(roleMix).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    }
  } catch {
    return empty
  }
}

// ── Suppliers page (img-06 / img-07) ─────────────────────────────────────────

export interface SupplierRow {
  workspaceId: string
  businessName: string | null
  workspaceName: string | null
  trades: string[]
  baseLocation: string | null
  serviceRadiusKm: number | null
  status: string
  insuranceVerified: boolean
  acceptsEmergency: boolean
  responseTimeHours: number | null
  yearsExperience: number | null
  createdAt: string | null
}

export interface SupplierKpis {
  total: number
  verified: number
  pending: number
  insuranceVerified: number
  emergency: number
  avgResponseHours: number | null
}

/** All supplier workspace profiles. `available:false` ⇒ table not provisioned. */
export async function listSuppliers(limit = 500): Promise<{ available: boolean; rows: SupplierRow[] }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("supplier_workspace_profiles")
      .select("workspace_id, display_name, trades, base_location, service_radius_km, status, insurance_verified, accepts_emergency, response_time_hours, years_experience, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, rows: [] }
      return { available: true, rows: [] }
    }
    const rows = data ?? []
    const wsIds = rows.map((r) => r.workspace_id as string)
    const names: Record<string, string> = {}
    if (wsIds.length) {
      try {
        const { data: ws } = await admin.from("workspaces").select("id, name").in("id", wsIds)
        for (const w of ws ?? []) names[w.id as string] = (w.name as string) ?? ""
      } catch { /* ignore */ }
    }
    return {
      available: true,
      rows: rows.map((r) => ({
        workspaceId: r.workspace_id as string,
        businessName: (r.display_name as string) ?? null,
        workspaceName: names[r.workspace_id as string] ?? null,
        trades: Array.isArray(r.trades) ? (r.trades as string[]) : [],
        baseLocation: (r.base_location as string) ?? null,
        serviceRadiusKm: (r.service_radius_km as number) ?? null,
        status: (r.status as string) ?? "draft",
        insuranceVerified: Boolean(r.insurance_verified),
        acceptsEmergency: Boolean(r.accepts_emergency),
        responseTimeHours: (r.response_time_hours as number) ?? null,
        yearsExperience: (r.years_experience as number) ?? null,
        createdAt: (r.created_at as string) ?? null,
      })),
    }
  } catch {
    return { available: false, rows: [] }
  }
}

export async function getSupplierKpis(): Promise<{ available: boolean; kpis: SupplierKpis }> {
  const empty: SupplierKpis = { total: 0, verified: 0, pending: 0, insuranceVerified: 0, emergency: 0, avgResponseHours: null }
  const { available, rows } = await listSuppliers(2000)
  if (!available) return { available: false, kpis: empty }
  let verified = 0, pending = 0, ins = 0, emerg = 0, respSum = 0, respN = 0
  for (const r of rows) {
    if (r.status === "active" || r.status === "verified" || r.status === "published") verified++
    if (r.status === "pending" || r.status === "submitted" || r.status === "draft") pending++
    if (r.insuranceVerified) ins++
    if (r.acceptsEmergency) emerg++
    if (r.responseTimeHours != null) { respSum += r.responseTimeHours; respN++ }
  }
  return {
    available: true,
    kpis: {
      total: rows.length,
      verified,
      pending,
      insuranceVerified: ins,
      emergency: emerg,
      avgResponseHours: respN ? Math.round((respSum / respN) * 10) / 10 : null,
    },
  }
}

export interface SupplierDetail extends SupplierRow {
  bio: string | null
  services: Array<{ id: string; name: string; category: string | null; pricingModel: string; active: boolean }>
  coverage: Array<{ id: string; areaType: string; value: string | null; radiusKm: number | null }>
}

export async function getSupplierDetail(workspaceId: string): Promise<SupplierDetail | null> {
  try {
    const admin = createAdminClient()
    const { data: p, error } = await admin
      .from("supplier_workspace_profiles")
      .select("workspace_id, display_name, bio, trades, base_location, service_radius_km, status, insurance_verified, accepts_emergency, response_time_hours, years_experience, created_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error || !p) return null

    let workspaceName: string | null = null
    try {
      const { data: ws } = await admin.from("workspaces").select("name").eq("id", workspaceId).maybeSingle()
      workspaceName = (ws?.name as string) ?? null
    } catch { /* ignore */ }

    const services: SupplierDetail["services"] = []
    try {
      const { data: svc } = await admin
        .from("supplier_services")
        .select("id, name, service_name, price_from, price_to, price_unit")
        .eq("workspace_id", workspaceId)
        .limit(100)
      for (const s of svc ?? []) {
        services.push({
          id: s.id as string,
          name: (s.name as string) ?? (s.service_name as string) ?? "Service",
          category: null,
          pricingModel: "quote_required",
          active: true,
        })
      }
    } catch { /* ignore */ }

    const coverage: SupplierDetail["coverage"] = []
    try {
      const { data: cov } = await admin
        .from("supplier_coverage_areas")
        .select("id, area_type, value, radius_km")
        .eq("workspace_id", workspaceId)
        .limit(100)
      for (const c of cov ?? []) {
        coverage.push({
          id: c.id as string,
          areaType: (c.area_type as string) ?? "area",
          value: (c.value as string) ?? null,
          radiusKm: (c.radius_km as number) ?? null,
        })
      }
    } catch { /* ignore */ }

    return {
      workspaceId,
      businessName: (p.display_name as string) ?? null,
      workspaceName,
      bio: (p.bio as string) ?? null,
      trades: Array.isArray(p.trades) ? (p.trades as string[]) : [],
      baseLocation: (p.base_location as string) ?? null,
      serviceRadiusKm: (p.service_radius_km as number) ?? null,
      status: (p.status as string) ?? "draft",
      insuranceVerified: Boolean(p.insurance_verified),
      acceptsEmergency: Boolean(p.accepts_emergency),
      responseTimeHours: (p.response_time_hours as number) ?? null,
      yearsExperience: (p.years_experience as number) ?? null,
      createdAt: (p.created_at as string) ?? null,
      services,
      coverage,
    }
  } catch {
    return null
  }
}

// ── Subscriptions page KPIs (img-09) ─────────────────────────────────────────

export interface SubscriptionKpis {
  available: boolean
  total: number
  active: number
  trialing: number
  pastDue: number
  canceled: number
  /** Sum of amount_pence for active subs (real, from billing). null if no data. */
  mrrPence: number | null
  planMix: Array<{ label: string; value: number }>
  /** Whether any subscription carries a stripe id (i.e. Stripe is wired). */
  stripeLinked: boolean
}

export async function getSubscriptionKpis(): Promise<SubscriptionKpis> {
  const empty: SubscriptionKpis = {
    available: false, total: 0, active: 0, trialing: 0, pastDue: 0, canceled: 0,
    mrrPence: null, planMix: [], stripeLinked: false,
  }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("subscriptions")
      .select("plan, status, amount_pence, stripe_subscription_id")
      .limit(10000)
    if (error) {
      if (isSchemaGap(error.code)) return await deriveSubKpisFromWorkspaces(admin)
      return { ...empty, available: true }
    }
    const rows = data ?? []
    // Pre-Stripe: no dedicated subscription rows yet → derive plan KPIs from workspaces.
    if (rows.length === 0) return await deriveSubKpisFromWorkspaces(admin)
    const planMix: Record<string, number> = {}
    let active = 0, trialing = 0, pastDue = 0, canceled = 0, mrr = 0, stripeLinked = false, hasAmount = false
    for (const s of rows) {
      const plan = (s.plan as string) ?? "—"
      const status = (s.status as string) ?? "—"
      planMix[plan] = (planMix[plan] ?? 0) + 1
      if (status === "active") active++
      if (status === "trialing") trialing++
      if (status === "past_due") pastDue++
      if (status === "canceled" || status === "cancelled") canceled++
      if (s.stripe_subscription_id) stripeLinked = true
      if (s.amount_pence != null) { hasAmount = true; if (status === "active") mrr += Number(s.amount_pence) || 0 }
    }
    return {
      available: true,
      total: rows.length,
      active,
      trialing,
      pastDue,
      canceled,
      mrrPence: hasAmount ? mrr : null,
      planMix: Object.entries(planMix).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      stripeLinked,
    }
  } catch {
    return empty
  }
}

/** Pre-Stripe fallback: derive subscription KPIs from `workspaces.plan/plan_status`.
 * MRR/ARR stay null (no real billing amounts) so the honesty banner still shows. */
async function deriveSubKpisFromWorkspaces(admin: ReturnType<typeof createAdminClient>): Promise<SubscriptionKpis> {
  const empty: SubscriptionKpis = {
    available: false, total: 0, active: 0, trialing: 0, pastDue: 0, canceled: 0,
    mrrPence: null, planMix: [], stripeLinked: false,
  }
  try {
    const { data, error } = await admin.from("workspaces").select("plan, plan_status").limit(10000)
    if (error || !data) return empty
    const planMix: Record<string, number> = {}
    let active = 0, trialing = 0, pastDue = 0, canceled = 0
    for (const w of data) {
      const plan = (w.plan as string) ?? "—"
      const ps = ((w.plan_status as string) ?? "").toLowerCase()
      const status = ps === "trial" ? "trialing"
        : ps === "suspended" ? "past_due"
        : ps || (plan.toLowerCase() === "trial" ? "trialing" : "active")
      planMix[plan] = (planMix[plan] ?? 0) + 1
      if (status === "active") active++
      else if (status === "trialing") trialing++
      else if (status === "past_due") pastDue++
      else if (status === "canceled" || status === "cancelled") canceled++
    }
    return {
      available: true,
      total: data.length,
      active, trialing, pastDue, canceled,
      mrrPence: null,
      planMix: Object.entries(planMix).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      stripeLinked: false,
    }
  } catch {
    return empty
  }
}

// ── Affiliates page KPIs (img-10) ────────────────────────────────────────────

export interface AffiliateKpis {
  applications: number
  pendingApplications: number
  activeAffiliates: number
  pendingPayoutPence: number
  clearedPence: number
  paidPence: number
  totalReferrals: number
  /** Weighted average commission rate across active affiliates (fraction). */
  avgCommissionRate: number | null
}

/** Aggregate affiliate KPIs from the affiliate data (read via data.ts callers). */
export async function getAffiliateKpis(): Promise<AffiliateKpis> {
  const empty: AffiliateKpis = {
    applications: 0, pendingApplications: 0, activeAffiliates: 0, pendingPayoutPence: 0,
    clearedPence: 0, paidPence: 0, totalReferrals: 0, avgCommissionRate: null,
  }
  try {
    const admin = createAdminClient()
    const { levelByBand } = await import("@/lib/affiliate/levels")

    let applications = 0, pendingApplications = 0
    try {
      const { data: apps } = await admin.from("affiliate_applications").select("status").limit(5000)
      for (const a of apps ?? []) {
        applications++
        const st = (a.status as string) ?? "pending_review"
        if (st === "pending_review" || st === "submitted") pendingApplications++
      }
    } catch { /* ignore */ }

    let activeAffiliates = 0, pendingPayoutPence = 0, clearedPence = 0, paidPence = 0, totalReferrals = 0
    let rateSum = 0, rateN = 0
    try {
      const { data: affs } = await admin
        .from("affiliates")
        .select("enrolled, approved, band, active_referrals_count, pending_pence, cleared_pence, paid_pence")
        .limit(5000)
      for (const a of affs ?? []) {
        if (a.enrolled && a.approved) {
          activeAffiliates++
          const rate = levelByBand(a.band as number | null).rate
          rateSum += rate; rateN++
        }
        pendingPayoutPence += Number(a.pending_pence ?? 0)
        clearedPence += Number(a.cleared_pence ?? 0)
        paidPence += Number(a.paid_pence ?? 0)
        totalReferrals += Number(a.active_referrals_count ?? 0)
      }
    } catch { /* ignore */ }

    return {
      applications,
      pendingApplications,
      activeAffiliates,
      pendingPayoutPence,
      clearedPence,
      paidPence,
      totalReferrals,
      avgCommissionRate: rateN ? rateSum / rateN : null,
    }
  } catch {
    return empty
  }
}

// ── Workspaces page KPIs (img-08) ────────────────────────────────────────────

export interface WorkspaceKpis {
  total: number
  active: number
  trialing: number
  suspended: number
  newThisMonth: number
  planMix: Array<{ label: string; value: number }>
}

export async function getWorkspaceKpis(): Promise<WorkspaceKpis> {
  const empty: WorkspaceKpis = { total: 0, active: 0, trialing: 0, suspended: 0, newThisMonth: 0, planMix: [] }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("workspaces")
      .select("plan, plan_status, created_at")
      .limit(10000)
    if (error || !data) return empty
    const planMix: Record<string, number> = {}
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    let active = 0, trialing = 0, suspended = 0, newThisMonth = 0
    for (const w of data) {
      const plan = (w.plan as string) ?? "starter"
      const status = (w.plan_status as string) ?? "active"
      planMix[plan] = (planMix[plan] ?? 0) + 1
      if (status === "active") active++
      if (status === "trial" || status === "trialing") trialing++
      if (status === "suspended") suspended++
      if (w.created_at && new Date(w.created_at as string) >= monthStart) newThisMonth++
    }
    return {
      total: data.length,
      active,
      trialing,
      suspended,
      newThisMonth,
      planMix: Object.entries(planMix).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    }
  } catch {
    return empty
  }
}

// ── Customer detail (img-03) — wraps workspace detail w/ owner's other ws ─────

export interface CustomerWorkspaceLite {
  id: string
  name: string
  plan: string
  planStatus: string
  memberCount: number
  createdAt: string | null
}

/** All workspaces owned by a given user (for the customer-account detail page). */
export async function listWorkspacesByOwner(ownerId: string): Promise<CustomerWorkspaceLite[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("workspaces")
      .select("id, name, plan, plan_status, created_at")
      .eq("owner_user_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(200)
    if (error || !data) return []
    const ids = data.map((w) => w.id as string)
    const counts: Record<string, number> = {}
    if (ids.length) {
      try {
        const { data: m } = await admin.from("workspace_members").select("workspace_id").in("workspace_id", ids)
        for (const row of m ?? []) {
          const wid = row.workspace_id as string
          counts[wid] = (counts[wid] ?? 0) + 1
        }
      } catch { /* ignore */ }
    }
    return data.map((w) => ({
      id: w.id as string,
      name: (w.name as string) ?? "Workspace",
      plan: (w.plan as string) ?? "—",
      planStatus: (w.plan_status as string) ?? "active",
      memberCount: counts[w.id as string] ?? 0,
      createdAt: (w.created_at as string) ?? null,
    }))
  } catch {
    return []
  }
}
