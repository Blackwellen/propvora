import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Cross-workspace read layer for the platform-admin MARKETPLACE CONTROL PLANE.
 *
 * Cross-tenant BY DESIGN: a platform admin oversees marketplace commerce across
 * EVERY workspace. These reads use the service-role client and MUST only ever
 * run behind the (admin) layout guard + an explicit getAdminIdentity() check on
 * each page/route (fail-closed). The service-role key never reaches the client.
 *
 * Schema (verified live 2026-06-15 via the Management API):
 *   marketplace_transactions(id, buyer_workspace_id, seller_workspace_id,
 *     listing_id, transaction_type, gross_pence, platform_fee_pence,
 *     provider_fee_pence, seller_payout_pence, net_platform_revenue_pence,
 *     platform_fee_percent, applied_fee_rule_id, currency, status, metadata,
 *     created_at, updated_at)  — all money is integer pence (bigint).
 *   marketplace_disputes(id, transaction_id, raised_by_workspace_id,
 *     against_workspace_id, reason, detail, status, resolution, assigned_admin,
 *     resolved_at, created_at, updated_at)
 *   payouts(id, workspace_id, connect_account_id, amount_pence, currency,
 *     stripe_transfer_id, status, payment_id, created_at, updated_at)
 *   marketplace_listings(id, workspace_id, status, ... )  — active = status 'active'.
 *   workspaces(id, name, plan, plan_status, owner_user_id, type, workspace_type,
 *     created_at, ...)
 *
 * Every read is schema-gap-safe: a not-yet-provisioned table resolves to an
 * empty/zero/null result so the console renders an honest state rather than
 * throwing. NO mock data — empty tables render empty states.
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

/** Short, non-identifying display form of a UUID (first 8 chars). */
export function shortId(id: string | null | undefined): string {
  if (!id) return "—"
  return id.slice(0, 8)
}

/** Format integer pence → "£1,234.56" (GBP). Defensive against nulls. */
export function fmtPence(pence: number | null | undefined, currency = "GBP"): string {
  const n = typeof pence === "number" && Number.isFinite(pence) ? pence : 0
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
    }).format(n / 100)
  } catch {
    return `£${(n / 100).toFixed(2)}`
  }
}

// ── Workspace name resolution ───────────────────────────────────────────────

export interface WorkspaceLite {
  id: string
  name: string
  plan: string | null
  planStatus: string | null
  type: string | null
}

/** Map of workspace_id -> lite info. Best-effort, never throws. */
export async function workspaceLiteFor(ids: string[]): Promise<Record<string, WorkspaceLite>> {
  const out: Record<string, WorkspaceLite> = {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return out
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("workspaces")
      .select("id, name, plan, plan_status, type, workspace_type")
      .in("id", unique)
    for (const w of (data as unknown as Array<Record<string, unknown>>) ?? []) {
      out[w.id as string] = {
        id: w.id as string,
        name: (w.name as string) ?? "Workspace",
        plan: (w.plan as string) ?? null,
        planStatus: (w.plan_status as string) ?? null,
        type: (w.type as string) ?? (w.workspace_type as string) ?? null,
      }
    }
  } catch {
    /* ignore */
  }
  return out
}

// ── Oversight KPIs ──────────────────────────────────────────────────────────

export interface MarketplaceOverview {
  /** True once the core marketplace tables are provisioned. */
  available: boolean
  /** Sum of gross_pence across all transactions (integer pence). */
  gmvPence: number
  /** Sum of platform_fee_pence across all transactions (integer pence). */
  platformRevenuePence: number
  /** Count of marketplace_listings with status 'active'. */
  activeListings: number | null
  /** Count of disputes in an open/under_review/escalated state. */
  openDisputes: number | null
  /** Count of payouts with status 'pending'. */
  pendingPayouts: number | null
  /** Sum of pending payout amounts (integer pence). */
  pendingPayoutPence: number
  /** Total transactions on the platform. */
  totalTransactions: number | null
}

/** Sum a bigint column over a table, schema-gap-safe. */
async function sumPence(
  table: string,
  column: string,
  filter?: { column: string; values: string[] },
): Promise<{ available: boolean; total: number; rows: number }> {
  try {
    const admin = createAdminClient()
    let q = admin.from(table).select(column)
    if (filter) q = q.in(filter.column, filter.values)
    const { data, error } = await q
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, total: 0, rows: 0 }
      return { available: true, total: 0, rows: 0 }
    }
    let total = 0
    for (const r of (data as unknown as Array<Record<string, unknown>>) ?? []) {
      const v = Number(r[column])
      if (Number.isFinite(v)) total += v
    }
    return { available: true, total, rows: (data ?? []).length }
  } catch {
    return { available: false, total: 0, rows: 0 }
  }
}

async function safeCount(
  table: string,
  filter?: { column: string; values: string[] },
): Promise<number | null> {
  try {
    const admin = createAdminClient()
    let q = admin.from(table).select("id", { count: "exact", head: true })
    if (filter) q = q.in(filter.column, filter.values)
    const { count, error } = await q
    if (error) return isSchemaGap(error.code) ? null : 0
    return count ?? 0
  } catch {
    return null
  }
}

export async function getMarketplaceOverview(): Promise<MarketplaceOverview> {
  const [gmv, platformRev, activeListings, openDisputes, pendingPayouts, totalTxns] =
    await Promise.all([
      sumPence("marketplace_transactions", "gross_pence"),
      sumPence("marketplace_transactions", "platform_fee_pence"),
      safeCount("marketplace_listings", { column: "status", values: ["active"] }),
      safeCount("marketplace_disputes", {
        column: "status",
        values: ["open", "under_review", "escalated"],
      }),
      safeCount("payouts", { column: "status", values: ["pending"] }),
      safeCount("marketplace_transactions"),
    ])

  const pendingPayoutSum = await sumPence("payouts", "amount_pence", {
    column: "status",
    values: ["pending"],
  })

  return {
    available: gmv.available || platformRev.available,
    gmvPence: gmv.total,
    platformRevenuePence: platformRev.total,
    activeListings,
    openDisputes,
    pendingPayouts,
    pendingPayoutPence: pendingPayoutSum.total,
    totalTransactions: totalTxns,
  }
}

// ── Transaction monitor ─────────────────────────────────────────────────────

export interface AdminTransactionRow {
  id: string
  buyerWorkspaceId: string | null
  buyerWorkspaceName: string | null
  sellerWorkspaceId: string | null
  sellerWorkspaceName: string | null
  transactionType: string | null
  grossPence: number
  platformFeePence: number
  providerFeePence: number
  sellerPayoutPence: number
  currency: string
  status: string
  createdAt: string | null
}

export interface TransactionListResult {
  available: boolean
  rows: AdminTransactionRow[]
}

export interface ListTransactionsOptions {
  status?: string
  type?: string
  limit?: number
}

export async function listTransactions(
  options: ListTransactionsOptions = {},
): Promise<TransactionListResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500)
  let q = admin
    .from("marketplace_transactions")
    .select(
      "id, buyer_workspace_id, seller_workspace_id, transaction_type, gross_pence, " +
        "platform_fee_pence, provider_fee_pence, seller_payout_pence, currency, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (options.status) q = q.eq("status", options.status)
  if (options.type) q = q.eq("transaction_type", options.type)

  const { data, error } = await q
  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = (data as unknown as Array<Record<string, unknown>>) ?? []
  const wsIds = rows.flatMap((r) => [
    r.buyer_workspace_id as string,
    r.seller_workspace_id as string,
  ])
  const ws = await workspaceLiteFor(wsIds)

  return {
    available: true,
    rows: rows.map((r) => ({
      id: r.id as string,
      buyerWorkspaceId: (r.buyer_workspace_id as string) ?? null,
      buyerWorkspaceName: ws[r.buyer_workspace_id as string]?.name ?? null,
      sellerWorkspaceId: (r.seller_workspace_id as string) ?? null,
      sellerWorkspaceName: ws[r.seller_workspace_id as string]?.name ?? null,
      transactionType: (r.transaction_type as string) ?? null,
      grossPence: Number(r.gross_pence) || 0,
      platformFeePence: Number(r.platform_fee_pence) || 0,
      providerFeePence: Number(r.provider_fee_pence) || 0,
      sellerPayoutPence: Number(r.seller_payout_pence) || 0,
      currency: (r.currency as string) ?? "GBP",
      status: (r.status as string) ?? "pending",
      createdAt: (r.created_at as string) ?? null,
    })),
  }
}

// ── Dispute queue ───────────────────────────────────────────────────────────

export interface AdminDisputeRow {
  id: string
  transactionId: string | null
  raisedByWorkspaceId: string | null
  raisedByWorkspaceName: string | null
  againstWorkspaceId: string | null
  againstWorkspaceName: string | null
  reason: string | null
  detail: string | null
  status: string
  resolution: string | null
  assignedAdmin: string | null
  resolvedAt: string | null
  createdAt: string | null
}

export interface DisputeListResult {
  available: boolean
  rows: AdminDisputeRow[]
}

/** Statuses that constitute the active admin dispute queue. */
export const DISPUTE_QUEUE_STATUSES = ["open", "under_review", "escalated"] as const

export async function listDisputesForAdmin(
  options: { status?: string; limit?: number } = {},
): Promise<DisputeListResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500)
  let q = admin
    .from("marketplace_disputes")
    .select(
      "id, transaction_id, raised_by_workspace_id, against_workspace_id, reason, " +
        "detail, status, resolution, assigned_admin, resolved_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (options.status) {
    q = q.eq("status", options.status)
  } else {
    q = q.in("status", DISPUTE_QUEUE_STATUSES as unknown as string[])
  }

  const { data, error } = await q
  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = (data as unknown as Array<Record<string, unknown>>) ?? []
  const wsIds = rows.flatMap((r) => [
    r.raised_by_workspace_id as string,
    r.against_workspace_id as string,
  ])
  const ws = await workspaceLiteFor(wsIds)

  return {
    available: true,
    rows: rows.map((r) => ({
      id: r.id as string,
      transactionId: (r.transaction_id as string) ?? null,
      raisedByWorkspaceId: (r.raised_by_workspace_id as string) ?? null,
      raisedByWorkspaceName: ws[r.raised_by_workspace_id as string]?.name ?? null,
      againstWorkspaceId: (r.against_workspace_id as string) ?? null,
      againstWorkspaceName: ws[r.against_workspace_id as string]?.name ?? null,
      reason: (r.reason as string) ?? null,
      detail: (r.detail as string) ?? null,
      status: (r.status as string) ?? "open",
      resolution: (r.resolution as string) ?? null,
      assignedAdmin: (r.assigned_admin as string) ?? null,
      resolvedAt: (r.resolved_at as string) ?? null,
      createdAt: (r.created_at as string) ?? null,
    })),
  }
}

// ── Payout monitor ──────────────────────────────────────────────────────────

export interface AdminPayoutRow {
  id: string
  workspaceId: string | null
  workspaceName: string | null
  amountPence: number
  currency: string
  status: string
  stripeTransferId: string | null
  connectAccountId: string | null
  createdAt: string | null
}

export interface PayoutListResult {
  available: boolean
  rows: AdminPayoutRow[]
}

export async function listPayouts(
  options: { status?: string; limit?: number } = {},
): Promise<PayoutListResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500)
  let q = admin
    .from("payouts")
    .select(
      "id, workspace_id, amount_pence, currency, status, stripe_transfer_id, connect_account_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (options.status) q = q.eq("status", options.status)

  const { data, error } = await q
  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = (data as unknown as Array<Record<string, unknown>>) ?? []
  const ws = await workspaceLiteFor(rows.map((r) => r.workspace_id as string))

  return {
    available: true,
    rows: rows.map((r) => ({
      id: r.id as string,
      workspaceId: (r.workspace_id as string) ?? null,
      workspaceName: ws[r.workspace_id as string]?.name ?? null,
      amountPence: Number(r.amount_pence) || 0,
      currency: (r.currency as string) ?? "GBP",
      status: (r.status as string) ?? "pending",
      stripeTransferId: (r.stripe_transfer_id as string) ?? null,
      connectAccountId: (r.connect_account_id as string) ?? null,
      createdAt: (r.created_at as string) ?? null,
    })),
  }
}

// ── Workspace marketplace footprint (for the workspace detail oversight) ─────

export interface WorkspaceMarketplaceFootprint {
  available: boolean
  asBuyer: number
  asSeller: number
  grossAsSellerPence: number
  platformFeeFromSellerPence: number
  activeListings: number | null
  openDisputes: number | null
  pendingPayoutPence: number
}

export async function getWorkspaceMarketplaceFootprint(
  workspaceId: string,
): Promise<WorkspaceMarketplaceFootprint> {
  const empty: WorkspaceMarketplaceFootprint = {
    available: false,
    asBuyer: 0,
    asSeller: 0,
    grossAsSellerPence: 0,
    platformFeeFromSellerPence: 0,
    activeListings: null,
    openDisputes: null,
    pendingPayoutPence: 0,
  }
  if (!workspaceId) return empty

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return empty
  }

  try {
    const [buyer, seller, listings, disputes, payouts] = await Promise.all([
      admin
        .from("marketplace_transactions")
        .select("id", { count: "exact", head: true })
        .eq("buyer_workspace_id", workspaceId),
      admin
        .from("marketplace_transactions")
        .select("gross_pence, platform_fee_pence")
        .eq("seller_workspace_id", workspaceId),
      admin
        .from("marketplace_listings")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "active"),
      admin
        .from("marketplace_disputes")
        .select("id", { count: "exact", head: true })
        .or(
          `raised_by_workspace_id.eq.${workspaceId},against_workspace_id.eq.${workspaceId}`,
        )
        .in("status", DISPUTE_QUEUE_STATUSES as unknown as string[]),
      admin
        .from("payouts")
        .select("amount_pence")
        .eq("workspace_id", workspaceId)
        .eq("status", "pending"),
    ])

    if (buyer.error && isSchemaGap(buyer.error.code)) return empty

    let grossAsSeller = 0
    let platformFeeFromSeller = 0
    for (const r of (seller.data as unknown as Array<Record<string, unknown>>) ?? []) {
      grossAsSeller += Number(r.gross_pence) || 0
      platformFeeFromSeller += Number(r.platform_fee_pence) || 0
    }
    let pendingPayout = 0
    for (const r of (payouts.data as unknown as Array<Record<string, unknown>>) ?? []) {
      pendingPayout += Number(r.amount_pence) || 0
    }

    return {
      available: true,
      asBuyer: buyer.count ?? 0,
      asSeller: (seller.data ?? []).length,
      grossAsSellerPence: grossAsSeller,
      platformFeeFromSellerPence: platformFeeFromSeller,
      activeListings: listings.error ? null : (listings.count ?? 0),
      openDisputes: disputes.error ? null : (disputes.count ?? 0),
      pendingPayoutPence: pendingPayout,
    }
  } catch {
    return empty
  }
}

// ── Workspace directory (platform oversight) ────────────────────────────────

export interface AdminWorkspaceDirectoryRow {
  id: string
  name: string
  plan: string | null
  planStatus: string | null
  type: string | null
  ownerName: string | null
  createdAt: string | null
  marketplaceTxns: number
}

export interface WorkspaceDirectoryResult {
  available: boolean
  rows: AdminWorkspaceDirectoryRow[]
}

/**
 * Workspace directory enriched with a marketplace transaction count (as buyer or
 * seller). Read-only oversight. Schema-gap-safe.
 */
export async function listWorkspaceDirectory(limit = 300): Promise<WorkspaceDirectoryResult> {
  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { available: false, rows: [] }
  }

  const { data, error } = await admin
    .from("workspaces")
    .select("id, name, plan, plan_status, type, workspace_type, owner_user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    if (isSchemaGap(error.code)) return { available: false, rows: [] }
    return { available: true, rows: [] }
  }

  const rows = (data as unknown as Array<Record<string, unknown>>) ?? []

  // Owner display names (profiles.display_name; no email column on profiles).
  const ownerIds = Array.from(
    new Set(rows.map((r) => r.owner_user_id as string).filter(Boolean)),
  )
  const ownerNames: Record<string, string> = {}
  if (ownerIds.length > 0) {
    try {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", ownerIds)
      for (const p of (profs as unknown as Array<Record<string, unknown>>) ?? []) {
        if (p.display_name) ownerNames[p.id as string] = p.display_name as string
      }
    } catch {
      /* ignore */
    }
  }

  // Per-workspace marketplace transaction counts (buyer + seller). Best-effort.
  const txnCounts: Record<string, number> = {}
  try {
    const { data: txns } = await admin
      .from("marketplace_transactions")
      .select("buyer_workspace_id, seller_workspace_id")
      .limit(5000)
    for (const t of (txns as unknown as Array<Record<string, unknown>>) ?? []) {
      const b = t.buyer_workspace_id as string
      const s = t.seller_workspace_id as string
      if (b) txnCounts[b] = (txnCounts[b] ?? 0) + 1
      if (s) txnCounts[s] = (txnCounts[s] ?? 0) + 1
    }
  } catch {
    /* ignore — marketplace not provisioned */
  }

  return {
    available: true,
    rows: rows.map((w) => ({
      id: w.id as string,
      name: (w.name as string) ?? "Unnamed workspace",
      plan: (w.plan as string) ?? null,
      planStatus: (w.plan_status as string) ?? null,
      type: (w.type as string) ?? (w.workspace_type as string) ?? null,
      ownerName: ownerNames[w.owner_user_id as string] ?? null,
      createdAt: (w.created_at as string) ?? null,
      marketplaceTxns: txnCounts[w.id as string] ?? 0,
    })),
  }
}

/** Load a single workspace's identity for the oversight detail header. */
export async function getWorkspaceLite(id: string): Promise<WorkspaceLite | null> {
  if (!id) return null
  const map = await workspaceLiteFor([id])
  return map[id] ?? null
}
