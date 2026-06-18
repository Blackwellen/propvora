import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Batch-2 cross-workspace read layer for the platform admin console
 * (Portals, Documents, Portfolios, Stays, Bookings, Work, Planning, and the
 * Marketplace oversight / moderation / transactions surfaces — images 11–20).
 *
 * Cross-tenant BY DESIGN: a platform admin oversees every workspace. All reads
 * use the service-role client and MUST only run behind the (admin) layout guard
 * + getAdminIdentity() (fail-closed). The service-role key never reaches the
 * client.
 *
 * Every function is schema-gap-safe: a not-yet-provisioned table/column resolves
 * to `{ available: false }` (or empty/zero) so the console renders an honest
 * "not provisioned" / empty state rather than throwing or fabricating numbers.
 *
 * Verified table shapes (live migrations in supabase/migrations):
 *   portal_sessions(id, workspace_id, portal_type, scope, expires_at, revoked,
 *     last_seen_at, ip, user_agent, contact_id, created_at)
 *   portal_access_tokens(... token_hash ...)
 *   documents(id, workspace_id, name, file_path, file_size, mime_type, category,
 *     property_id, contact_id, tenancy_id, is_demo, uploaded_by, created_at)
 *   bookings(id, listing_id, workspace_id, guest_name, guest_email, check_in,
 *     check_out, nights, guests_count, currency, subtotal_pence, fees_pence,
 *     total_pence, platform_fee_pence, status, hold_expires_at, source,
 *     created_at)
 *   marketplace_listings(id, workspace_id, title, status, transaction_type,
 *     category, location, base_price_pence, currency, created_at)
 *   marketplace_long_term_rentals(id, workspace_id, title, city, monthly_rent_pence,
 *     landlord_verified, agent_verified, status, created_at)
 *   marketplace_transactions / marketplace_disputes / payouts — see the
 *     marketplace data layer (reused read-only by the oversight pages).
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

/** Format integer pence → "£1,234.56" (GBP). Defensive against nulls. */
export function fmtPence(pence: number | null | undefined, currency = "GBP"): string {
  const n = typeof pence === "number" && Number.isFinite(pence) ? pence : 0
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(n / 100)
  } catch {
    return `£${(n / 100).toFixed(2)}`
  }
}

/** Short, non-identifying display form of a UUID (first 8 chars). */
export function shortId(id: string | null | undefined): string {
  if (!id) return "—"
  return id.slice(0, 8)
}

// ── Shared workspace name resolution ─────────────────────────────────────────

async function workspaceNames(ids: string[]): Promise<Record<string, string>> {
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

// ════════════════════════════════════════════════════════════════════════════
// img-11 · PORTALS
// ════════════════════════════════════════════════════════════════════════════

export interface PortalKpis {
  available: boolean
  total: number
  active: number
  expired: number
  revoked: number
  landlord: number
  tenant: number
  supplier: number
  other: number
}

export interface PortalSessionRow {
  id: string
  workspaceId: string | null
  workspaceName: string | null
  portalType: string
  recipient: string | null
  status: "active" | "expired" | "revoked"
  createdAt: string | null
  expiresAt: string | null
  lastSeenAt: string | null
  ip: string | null
}

function portalStatus(row: { revoked?: boolean; expires_at?: string | null }): "active" | "expired" | "revoked" {
  if (row.revoked) return "revoked"
  if (row.expires_at && new Date(row.expires_at as string) < new Date()) return "expired"
  return "active"
}

export interface PortalsData {
  available: boolean
  kpis: PortalKpis
  rows: PortalSessionRow[]
}

const EMPTY_PORTAL_KPIS: PortalKpis = {
  available: false, total: 0, active: 0, expired: 0, revoked: 0,
  landlord: 0, tenant: 0, supplier: 0, other: 0,
}

/** Portal sessions + access grants across every workspace. Read-only. */
export async function getPortalsData(opts: { type?: string; q?: string; limit?: number } = {}): Promise<PortalsData> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("portal_sessions")
      .select("id, workspace_id, portal_type, scope, expires_at, revoked, last_seen_at, ip, contact_id, created_at")
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 500)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, kpis: EMPTY_PORTAL_KPIS, rows: [] }
      return { available: true, kpis: { ...EMPTY_PORTAL_KPIS, available: true }, rows: [] }
    }

    const all = data ?? []
    const names = await workspaceNames(all.map((r) => r.workspace_id as string))

    // Resolve recipient contact display names (best-effort).
    const contactIds = Array.from(new Set(all.map((r) => r.contact_id as string).filter(Boolean)))
    const contactNames: Record<string, string> = {}
    if (contactIds.length) {
      try {
        const { data: cs } = await admin.from("contacts").select("id, display_name, email").in("id", contactIds)
        for (const c of cs ?? []) contactNames[c.id as string] = (c.display_name as string) || (c.email as string) || ""
      } catch { /* ignore */ }
    }

    const rows: PortalSessionRow[] = all.map((r) => {
      const scope = (r.scope as Record<string, unknown>) ?? {}
      const recipient =
        contactNames[r.contact_id as string] ||
        (scope.recipient_name as string) ||
        (scope.email as string) ||
        null
      return {
        id: r.id as string,
        workspaceId: (r.workspace_id as string) ?? null,
        workspaceName: names[r.workspace_id as string] ?? null,
        portalType: (r.portal_type as string) ?? "other",
        recipient,
        status: portalStatus(r as { revoked?: boolean; expires_at?: string | null }),
        createdAt: (r.created_at as string) ?? null,
        expiresAt: (r.expires_at as string) ?? null,
        lastSeenAt: (r.last_seen_at as string) ?? null,
        ip: (r.ip as string) ?? null,
      }
    })

    const kpis: PortalKpis = {
      available: true,
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      expired: rows.filter((r) => r.status === "expired").length,
      revoked: rows.filter((r) => r.status === "revoked").length,
      landlord: rows.filter((r) => r.portalType === "landlord").length,
      tenant: rows.filter((r) => r.portalType === "tenant").length,
      supplier: rows.filter((r) => r.portalType === "supplier").length,
      other: rows.filter((r) => !["landlord", "tenant", "supplier"].includes(r.portalType)).length,
    }

    // Apply filters AFTER KPI computation (KPIs reflect the whole population).
    let filtered = rows
    if (opts.type && opts.type !== "all") {
      if (["landlord", "tenant", "supplier"].includes(opts.type)) {
        filtered = filtered.filter((r) => r.portalType === opts.type)
      } else if (opts.type === "active" || opts.type === "expired" || opts.type === "revoked") {
        filtered = filtered.filter((r) => r.status === opts.type)
      }
    }
    if (opts.q) {
      const q = opts.q.toLowerCase()
      filtered = filtered.filter((r) =>
        `${r.recipient ?? ""} ${r.workspaceName ?? ""} ${r.portalType} ${r.ip ?? ""}`.toLowerCase().includes(q),
      )
    }

    return { available: true, kpis, rows: filtered }
  } catch {
    return { available: false, kpis: EMPTY_PORTAL_KPIS, rows: [] }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// img-18 · MARKETPLACE OVERSIGHT — real GMV trend + top sellers
// ════════════════════════════════════════════════════════════════════════════

export interface MarketplaceTrend {
  available: boolean
  /** Last-6-months GMV (gross pence) series. */
  gmvByMonth: Array<{ label: string; value: number }>
  /** Conversion proxy: captured-or-better / total transactions, as a %. */
  conversionPct: number | null
  /** Top sellers by gross pence. */
  topSellers: Array<{ workspaceId: string; name: string | null; grossPence: number; txns: number }>
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "short" })
}

export async function getMarketplaceTrend(): Promise<MarketplaceTrend> {
  const empty: MarketplaceTrend = { available: false, gmvByMonth: [], conversionPct: null, topSellers: [] }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("marketplace_transactions")
      .select("gross_pence, status, seller_workspace_id, created_at")
      .limit(10000)
    if (error) {
      if (isSchemaGap(error.code)) return empty
      return { available: true, gmvByMonth: emptyMonths(), conversionPct: null, topSellers: [] }
    }

    const rows = data ?? []

    // 6-month GMV series.
    const buckets: Record<string, number> = {}
    const order: string[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      buckets[k] = 0
      order.push(k)
    }
    let captured = 0
    const sellerGross: Record<string, { gross: number; txns: number }> = {}
    for (const r of rows) {
      const gross = Number(r.gross_pence) || 0
      if (r.created_at) {
        const d = new Date(r.created_at as string)
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        if (k in buckets) buckets[k] += gross
      }
      const status = (r.status as string) ?? ""
      if (["captured", "released", "completed", "refunded"].includes(status)) captured++
      const sid = r.seller_workspace_id as string
      if (sid) {
        if (!sellerGross[sid]) sellerGross[sid] = { gross: 0, txns: 0 }
        sellerGross[sid].gross += gross
        sellerGross[sid].txns += 1
      }
    }

    const gmvByMonth = order.map((k) => {
      const [, m] = k.split("-")
      return { label: monthLabel(new Date(2000, Number(m) - 1, 1)), value: buckets[k] }
    })

    const topSellerIds = Object.entries(sellerGross)
      .sort((a, b) => b[1].gross - a[1].gross)
      .slice(0, 5)
    const names = await workspaceNames(topSellerIds.map(([id]) => id))
    const topSellers = topSellerIds.map(([id, v]) => ({
      workspaceId: id,
      name: names[id] ?? null,
      grossPence: v.gross,
      txns: v.txns,
    }))

    const conversionPct = rows.length ? Math.round((captured / rows.length) * 1000) / 10 : null

    return { available: true, gmvByMonth, conversionPct, topSellers }
  } catch {
    return empty
  }
}

function emptyMonths(): Array<{ label: string; value: number }> {
  const out: Array<{ label: string; value: number }> = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ label: monthLabel(d), value: 0 })
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// img-12 · DOCUMENTS
// ════════════════════════════════════════════════════════════════════════════

export interface DocumentKpis {
  available: boolean
  total: number
  withRetention: number
  demo: number
  categories: number
  totalBytes: number
}

export interface DocumentRow {
  id: string
  workspaceId: string | null
  workspaceName: string | null
  name: string
  category: string | null
  mimeType: string | null
  sizeBytes: number | null
  isDemo: boolean
  hasFile: boolean
  createdAt: string | null
}

export interface DocumentsData {
  available: boolean
  kpis: DocumentKpis
  rows: DocumentRow[]
  categoryMix: Array<{ label: string; value: number }>
}

const EMPTY_DOC_KPIS: DocumentKpis = { available: false, total: 0, withRetention: 0, demo: 0, categories: 0, totalBytes: 0 }

/**
 * Document METADATA only across every workspace. NEVER exposes file contents,
 * file_path, or file_url — only name, category, type, size, and retention/audit
 * facts. Read-only.
 */
export async function getDocumentsData(opts: { category?: string; q?: string; limit?: number } = {}): Promise<DocumentsData> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("documents")
      // Metadata only — file_url excluded (presign on demand; never bulk-expose).
      .select("id, workspace_id, name, category, mime_type, size_bytes, r2_key, demo, created_at")
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 500)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, kpis: EMPTY_DOC_KPIS, rows: [], categoryMix: [] }
      return { available: true, kpis: { ...EMPTY_DOC_KPIS, available: true }, rows: [], categoryMix: [] }
    }

    const all = data ?? []
    const names = await workspaceNames(all.map((r) => r.workspace_id as string))

    const rows: DocumentRow[] = all.map((r) => ({
      id: r.id as string,
      workspaceId: (r.workspace_id as string) ?? null,
      workspaceName: names[r.workspace_id as string] ?? null,
      name: (r.name as string) ?? "Untitled document",
      category: (r.category as string) ?? null,
      mimeType: (r.mime_type as string) ?? null,
      sizeBytes: typeof r.size_bytes === "number" ? (r.size_bytes as number) : null,
      isDemo: Boolean(r.demo),
      hasFile: Boolean(r.r2_key),
      createdAt: (r.created_at as string) ?? null,
    }))

    const catCounts: Record<string, number> = {}
    let totalBytes = 0
    for (const r of rows) {
      const c = r.category ?? "Uncategorised"
      catCounts[c] = (catCounts[c] ?? 0) + 1
      totalBytes += r.sizeBytes ?? 0
    }

    const kpis: DocumentKpis = {
      available: true,
      total: rows.length,
      withRetention: rows.filter((r) => r.hasFile).length,
      demo: rows.filter((r) => r.isDemo).length,
      categories: Object.keys(catCounts).length,
      totalBytes,
    }

    const categoryMix = Object.entries(catCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    let filtered = rows
    if (opts.category && opts.category !== "all") {
      filtered = filtered.filter((r) => (r.category ?? "Uncategorised") === opts.category)
    }
    if (opts.q) {
      const q = opts.q.toLowerCase()
      filtered = filtered.filter((r) =>
        `${r.name} ${r.category ?? ""} ${r.workspaceName ?? ""} ${r.mimeType ?? ""}`.toLowerCase().includes(q),
      )
    }

    return { available: true, kpis, rows: filtered, categoryMix }
  } catch {
    return { available: false, kpis: EMPTY_DOC_KPIS, rows: [], categoryMix: [] }
  }
}

export function fmtBytes(bytes: number | null | undefined): string {
  const n = typeof bytes === "number" && Number.isFinite(bytes) ? bytes : 0
  if (n <= 0) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

// ════════════════════════════════════════════════════════════════════════════
// img-14 · STAYS  (short-stay marketplace_listings + long-term rentals)
// ════════════════════════════════════════════════════════════════════════════

export interface StayRow {
  id: string
  workspaceId: string | null
  workspaceName: string | null
  title: string
  kind: "short" | "long"
  location: string | null
  status: string
  pricePence: number | null
  priceUnit: string
  verified: boolean
  createdAt: string | null
}

export interface StaysKpis {
  shortStays: number | null
  longTerm: number | null
  published: number
  pendingReview: number
  verifiedHosts: number
}

export interface StaysData {
  shortAvailable: boolean
  longAvailable: boolean
  kpis: StaysKpis
  rows: StayRow[]
}

export async function getStaysData(opts: { kind?: string; status?: string; q?: string; limit?: number } = {}): Promise<StaysData> {
  const limit = opts.limit ?? 300
  let shortAvailable = false
  let longAvailable = false
  const rows: StayRow[] = []

  const admin = createAdminClient()

  // Short-stay listings (transaction_type = 'stay_booking').
  try {
    const { data, error } = await admin
      .from("marketplace_listings")
      .select("id, workspace_id, title, status, transaction_type, location, base_price_pence, currency, created_at")
      .eq("transaction_type", "stay_booking")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (!error) {
      shortAvailable = true
      const names = await workspaceNames((data ?? []).map((r) => r.workspace_id as string))
      for (const r of data ?? []) {
        rows.push({
          id: r.id as string,
          workspaceId: (r.workspace_id as string) ?? null,
          workspaceName: names[r.workspace_id as string] ?? null,
          title: (r.title as string) ?? "Untitled stay",
          kind: "short",
          location: (r.location as string) ?? null,
          status: (r.status as string) ?? "draft",
          pricePence: typeof r.base_price_pence === "number" ? (r.base_price_pence as number) : null,
          priceUnit: "/night",
          verified: (r.status as string) === "published",
          createdAt: (r.created_at as string) ?? null,
        })
      }
    }
  } catch { /* ignore */ }

  // Long-term rentals.
  try {
    const { data, error } = await admin
      .from("marketplace_long_term_rentals")
      .select("id, workspace_id, title, city, status, monthly_rent_pence, landlord_verified, agent_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (!error) {
      longAvailable = true
      const names = await workspaceNames((data ?? []).map((r) => r.workspace_id as string))
      for (const r of data ?? []) {
        rows.push({
          id: r.id as string,
          workspaceId: (r.workspace_id as string) ?? null,
          workspaceName: names[r.workspace_id as string] ?? null,
          title: (r.title as string) ?? "Untitled rental",
          kind: "long",
          location: (r.city as string) ?? null,
          status: (r.status as string) ?? "active",
          pricePence: typeof r.monthly_rent_pence === "number" ? (r.monthly_rent_pence as number) : null,
          priceUnit: "/mo",
          verified: Boolean(r.landlord_verified) || Boolean(r.agent_verified),
          createdAt: (r.created_at as string) ?? null,
        })
      }
    }
  } catch { /* ignore */ }

  rows.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))

  const kpis: StaysKpis = {
    shortStays: shortAvailable ? rows.filter((r) => r.kind === "short").length : null,
    longTerm: longAvailable ? rows.filter((r) => r.kind === "long").length : null,
    published: rows.filter((r) => r.status === "published" || r.status === "active").length,
    pendingReview: rows.filter((r) => r.status === "pending_review" || r.status === "pending").length,
    verifiedHosts: rows.filter((r) => r.verified).length,
  }

  let filtered = rows
  if (opts.kind === "short" || opts.kind === "long") filtered = filtered.filter((r) => r.kind === opts.kind)
  if (opts.status && opts.status !== "all") filtered = filtered.filter((r) => r.status === opts.status)
  if (opts.q) {
    const q = opts.q.toLowerCase()
    filtered = filtered.filter((r) => `${r.title} ${r.location ?? ""} ${r.workspaceName ?? ""}`.toLowerCase().includes(q))
  }

  return { shortAvailable, longAvailable, kpis, rows: filtered }
}

// ════════════════════════════════════════════════════════════════════════════
// img-15 · BOOKINGS
// ════════════════════════════════════════════════════════════════════════════

export interface BookingRow {
  id: string
  workspaceId: string | null
  workspaceName: string | null
  guestName: string
  guestEmail: string | null
  checkIn: string | null
  checkOut: string | null
  nights: number
  status: string
  totalPence: number
  platformFeePence: number
  currency: string
  source: string
  createdAt: string | null
}

export interface BookingsKpis {
  available: boolean
  total: number
  confirmed: number
  holds: number
  pendingPayment: number
  cancelled: number
  completed: number
  grossPence: number
}

export interface BookingsData {
  available: boolean
  kpis: BookingsKpis
  rows: BookingRow[]
}

const EMPTY_BOOKING_KPIS: BookingsKpis = {
  available: false, total: 0, confirmed: 0, holds: 0, pendingPayment: 0, cancelled: 0, completed: 0, grossPence: 0,
}

export async function getBookingsData(opts: { status?: string; q?: string; limit?: number } = {}): Promise<BookingsData> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("bookings")
      .select("id, workspace_id, guest_name, guest_email, check_in, check_out, nights, status, total_pence, platform_fee_pence, currency, source, created_at")
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 400)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, kpis: EMPTY_BOOKING_KPIS, rows: [] }
      return { available: true, kpis: { ...EMPTY_BOOKING_KPIS, available: true }, rows: [] }
    }

    const all = data ?? []
    const names = await workspaceNames(all.map((r) => r.workspace_id as string))

    const rows: BookingRow[] = all.map((r) => ({
      id: r.id as string,
      workspaceId: (r.workspace_id as string) ?? null,
      workspaceName: names[r.workspace_id as string] ?? null,
      guestName: (r.guest_name as string) ?? "Guest",
      guestEmail: (r.guest_email as string) ?? null,
      checkIn: (r.check_in as string) ?? null,
      checkOut: (r.check_out as string) ?? null,
      nights: Number(r.nights) || 0,
      status: (r.status as string) ?? "hold",
      totalPence: Number(r.total_pence) || 0,
      platformFeePence: Number(r.platform_fee_pence) || 0,
      currency: (r.currency as string) ?? "GBP",
      source: (r.source as string) ?? "direct",
      createdAt: (r.created_at as string) ?? null,
    }))

    const kpis: BookingsKpis = {
      available: true,
      total: rows.length,
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      holds: rows.filter((r) => r.status === "hold").length,
      pendingPayment: rows.filter((r) => r.status === "pending_payment").length,
      cancelled: rows.filter((r) => r.status === "cancelled" || r.status === "no_show").length,
      completed: rows.filter((r) => r.status === "completed").length,
      grossPence: rows.filter((r) => r.status !== "cancelled" && r.status !== "no_show").reduce((s, r) => s + r.totalPence, 0),
    }

    let filtered = rows
    if (opts.status && opts.status !== "all") filtered = filtered.filter((r) => r.status === opts.status)
    if (opts.q) {
      const q = opts.q.toLowerCase()
      filtered = filtered.filter((r) => `${r.guestName} ${r.guestEmail ?? ""} ${r.workspaceName ?? ""}`.toLowerCase().includes(q))
    }

    return { available: true, kpis, rows: filtered }
  } catch {
    return { available: false, kpis: EMPTY_BOOKING_KPIS, rows: [] }
  }
}
