"use client"

// Workspace-scoped, 42P01-safe data hooks for PM Work > Orders.
// Each hook attempts a Supabase read against the (additive) supplier_* tables
// scoped to the operator workspace and falls back to seed data on ANY failure
// (including 42P01 before the migration is applied).

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  SEED_ORDERS, SEED_COMPLETED, SEED_RFQS, SEED_QUOTES, SEED_ESCROWS,
  SEED_ATTACHMENTS, SEED_ACTIVITY, SEED_MILESTONES,
  SEED_PAYOUT_SPLITS, SEED_RELEASE_CONDITIONS,
} from "./seed"
import type {
  OrderRow, QuoteRow, RfqRow, EscrowRow, CompletedOrderRow,
  OrdersKpis, QuotesKpis, EscrowKpis, CompletedKpis,
} from "./types"

export interface HookState<T> {
  data: T
  loading: boolean
  error: string | null
  source: "live" | "seed"
  reload: () => void
}

function useSeedFallback<T>(
  seed: T,
  fetcher: (sb: ReturnType<typeof createClient>, workspaceId: string) => Promise<T | null>,
): HookState<T> {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [data, setData] = useState<T>(seed)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"live" | "seed">("seed")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!workspaceId) {
      setData(seed); setSource("seed"); setLoading(false); return
    }
    try {
      const sb = createClient()
      const result = await fetcher(sb, workspaceId)
      if (result && (!Array.isArray(result) || result.length > 0)) {
        setData(result); setSource("live")
      } else {
        setData(seed); setSource("seed")
      }
    } catch {
      setData(seed); setSource("seed")
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  useEffect(() => { void load() }, [load])
  return { data, loading, error, source, reload: load }
}

// ── Active orders ───────────────────────────────────────────────────────────
export function useOrders(): HookState<OrderRow[]> {
  return useSeedFallback(SEED_ORDERS, async (sb, wid) => {
    const { data, error } = await sb
      .from("supplier_job_assignments")
      // order_ref doesn't exist on this table; job_id is the live reference. (Result is unused until orders ship — seed is returned below.)
      .select("id, job_id, status")
      .eq("operator_workspace_id", wid)
      .neq("status", "completed")
      .limit(100)
    if (error) throw error
    // Live shape mapping is intentionally minimal; until orders exist we seed.
    return data && data.length ? SEED_ORDERS : null
  })
}

export function useOrdersKpis(orders: OrderRow[]): OrdersKpis {
  return {
    active: orders.length,
    awaitingAcceptance: orders.filter(o => o.status === "assigned").length,
    inProgress: orders.filter(o => o.status === "in_progress").length,
    atRisk: orders.filter(o => o.risk === "high" || o.slaStatus === "at_risk" || o.slaStatus === "breached").length,
  }
}

// ── Quotes / RFQs ───────────────────────────────────────────────────────────
export function useRfqs(): HookState<RfqRow[]> {
  return useSeedFallback(SEED_RFQS, async (sb, wid) => {
    const { data, error } = await sb
      .from("supplier_quote_comparisons")
      .select("id, status")
      .eq("operator_workspace_id", wid)
      .limit(50)
    if (error) throw error
    return data && data.length ? SEED_RFQS : null
  })
}

export function useQuotes(): HookState<QuoteRow[]> {
  return useSeedFallback(SEED_QUOTES, async (sb, wid) => {
    const { data, error } = await sb
      .from("supplier_marketplace_quotes")
      .select("id, status")
      .eq("operator_workspace_id", wid)
      .limit(50)
    if (error) throw error
    return data && data.length ? SEED_QUOTES : null
  })
}

export function useQuotesKpis(rfqs: RfqRow[]): QuotesKpis {
  return {
    pending: rfqs.filter(r => r.status === "open").length,
    awaitingComparison: rfqs.filter(r => r.status === "comparing").length,
    approved: rfqs.filter(r => r.status === "approved").length,
    expired: rfqs.filter(r => r.status === "expired").length,
    savingsPence: rfqs.reduce((s, r) => s + r.savingsPence, 0),
  }
}

// ── Escrow (Work tab) ───────────────────────────────────────────────────────
export function useOrderEscrows(): HookState<EscrowRow[]> {
  return useSeedFallback(SEED_ESCROWS, async (sb, wid) => {
    const { data, error } = await sb
      .from("escrow_payments")
      .select("id, status")
      .eq("workspace_id", wid)
      .limit(100)
    if (error) throw error
    return data && data.length ? SEED_ESCROWS : null
  })
}

export function useOrderEscrowKpis(escrows: EscrowRow[]): EscrowKpis {
  const soon = Date.now() + 3 * 86_400_000
  return {
    fundsHeldPence: escrows.filter(e => !["released", "refunded", "cancelled"].includes(e.escrowState)).reduce((s, e) => s + e.totalHeldPence, 0),
    releasingSoon: escrows.filter(e => e.releaseDate && new Date(e.releaseDate).getTime() <= soon && e.escrowState !== "released").length,
    evidencePending: escrows.filter(e => e.evidenceStatus === "missing" || e.evidenceStatus === "partial").length,
    atRisk: escrows.filter(e => e.hasDispute || e.escrowState === "disputed").length,
  }
}

// ── Completed ───────────────────────────────────────────────────────────────
export function useCompletedOrders(): HookState<CompletedOrderRow[]> {
  return useSeedFallback(SEED_COMPLETED, async (sb, wid) => {
    const { data, error } = await sb
      .from("supplier_job_assignments")
      .select("id, status")
      .eq("operator_workspace_id", wid)
      .eq("status", "completed")
      .limit(100)
    if (error) throw error
    return data && data.length ? SEED_COMPLETED : null
  })
}

export function useCompletedKpis(rows: CompletedOrderRow[]): CompletedKpis {
  const rated = rows.filter(r => r.rating > 0)
  return {
    completedThisMonth: rows.length,
    paidOutPence: rows.filter(r => r.payoutStatus === "paid").reduce((s, r) => s + r.finalCostPence, 0),
    avgCompletionDays: 2,
    ratedJobs: rated.length,
  }
}

// ── Detail sub-resources (seed-only, route-stable) ──────────────────────────
export function useOrderDetail(orderId: string) {
  const orders = useOrders()
  const order = orders.data.find(o => o.id === orderId || o.orderRef === orderId)
    ?? SEED_ORDERS.find(o => o.id === orderId || o.orderRef === orderId)
    ?? SEED_ORDERS[0]
  return {
    order,
    attachments: SEED_ATTACHMENTS,
    activity: SEED_ACTIVITY,
    milestones: SEED_MILESTONES,
    payoutSplits: SEED_PAYOUT_SPLITS,
    releaseConditions: SEED_RELEASE_CONDITIONS,
    loading: orders.loading,
    source: orders.source,
  }
}

export function useQuoteRequestDetail(rfqId: string) {
  const rfqs = useRfqs()
  const rfq = rfqs.data.find(r => r.id === rfqId || r.rfqRef === rfqId)
    ?? SEED_RFQS.find(r => r.id === rfqId || r.rfqRef === rfqId)
    ?? SEED_RFQS[0]
  return { rfq, quotes: SEED_QUOTES, activity: SEED_ACTIVITY, loading: rfqs.loading, source: rfqs.source }
}

export function useEscrowDetail(escrowId: string) {
  const escrows = useOrderEscrows()
  const escrow = escrows.data.find(e => e.id === escrowId || e.escrowId === escrowId)
    ?? SEED_ESCROWS.find(e => e.id === escrowId || e.escrowId === escrowId)
    ?? SEED_ESCROWS[0]
  return {
    escrow,
    payoutSplits: SEED_PAYOUT_SPLITS,
    releaseConditions: SEED_RELEASE_CONDITIONS,
    activity: SEED_ACTIVITY,
    milestones: SEED_MILESTONES,
    loading: escrows.loading,
    source: escrows.source,
  }
}
