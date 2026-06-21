"use client"

// Workspace-scoped, 42P01-safe data hooks for Money > Escrow Management.

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import type {
  ManagedEscrowRow, ManagedEscrowKpis, EscrowCashflowPoint, EscrowProjectionPoint,
  EscrowEvidenceItem, EscrowMilestoneItem, EscrowReleaseConditionItem,
  EscrowTimelineItem, EscrowSplitItem,
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

export function useManagedEscrows(): HookState<ManagedEscrowRow[]> {
  // escrow_payments live schema is minimal (id, status only). Full ManagedEscrowRow
  // shape requires a richer schema not yet migrated. Return empty list until V2 migration.
  return useSeedFallback([] as ManagedEscrowRow[], async (sb, wid) => {
    const { data, error } = await sb
      .from("escrow_payments")
      .select("id, status")
      .eq("workspace_id", wid)
      .limit(1)
    if (error) return null
    void data
    return null
  })
}

export function useManagedEscrowKpis(rows: ManagedEscrowRow[]): ManagedEscrowKpis {
  const soon = Date.now() + 3 * 86_400_000
  const live = rows.filter(r => !["released", "refunded", "cancelled", "failed"].includes(r.stage))
  return {
    totalInEscrowPence: live.reduce((s, r) => s + r.amountHeldPence, 0),
    releaseDueSoon: live.filter(r => r.releaseDate && new Date(r.releaseDate).getTime() <= soon).length,
    disputedEscrowPence: rows.filter(r => r.hasDispute || r.stage === "disputed").reduce((s, r) => s + r.amountHeldPence, 0),
    avgHoldDays: 0, // calculated when escrow schema migrated (escrow_payments full schema deferred to V2)
    awaitingEvidence: rows.filter(r => r.evidenceStatus === "missing" || r.evidenceStatus === "partial").length,
  }
}

export function useEscrowCashflow(): HookState<EscrowCashflowPoint[]> {
  // No live cashflow table — return empty so charts show honest empty state.
  return useSeedFallback([], async () => [])
}

export function useEscrowProjection(): HookState<EscrowProjectionPoint[]> {
  // No live projection table — return empty so charts show honest empty state.
  return useSeedFallback([], async () => [])
}

export function useManagedEscrowDetail(escrowId: string) {
  const escrows = useManagedEscrows()
  const escrow = escrows.data.find(e => e.id === escrowId || e.escrowId === escrowId)
  return {
    escrow,
    evidence: [] as EscrowEvidenceItem[],
    milestones: [] as EscrowMilestoneItem[],
    conditions: [] as EscrowReleaseConditionItem[],
    timeline: [] as EscrowTimelineItem[],
    splits: [] as EscrowSplitItem[],
    loading: escrows.loading,
    source: escrows.source,
  }
}
