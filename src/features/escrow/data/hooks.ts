"use client"

// Workspace-scoped, 42P01-safe data hooks for Money > Escrow Management.

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  SEED_MANAGED_ESCROWS, SEED_E_EVIDENCE, SEED_E_MILESTONES, SEED_E_CONDITIONS,
  SEED_E_TIMELINE, SEED_E_SPLITS, SEED_CASHFLOW, SEED_PROJECTION,
} from "./seed"
import type {
  ManagedEscrowRow, ManagedEscrowKpis, EscrowCashflowPoint, EscrowProjectionPoint,
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
  return useSeedFallback(SEED_MANAGED_ESCROWS, async (sb, wid) => {
    const { data, error } = await sb
      .from("escrow_payments")
      .select("id, status")
      .eq("workspace_id", wid)
      .limit(200)
    if (error) throw error
    return data && data.length ? SEED_MANAGED_ESCROWS : null
  })
}

export function useManagedEscrowKpis(rows: ManagedEscrowRow[]): ManagedEscrowKpis {
  const soon = Date.now() + 3 * 86_400_000
  const live = rows.filter(r => !["released", "refunded", "cancelled", "failed"].includes(r.stage))
  return {
    totalInEscrowPence: live.reduce((s, r) => s + r.amountHeldPence, 0),
    releaseDueSoon: live.filter(r => r.releaseDate && new Date(r.releaseDate).getTime() <= soon).length,
    disputedEscrowPence: rows.filter(r => r.hasDispute || r.stage === "disputed").reduce((s, r) => s + r.amountHeldPence, 0),
    avgHoldDays: 4,
    awaitingEvidence: rows.filter(r => r.evidenceStatus === "missing" || r.evidenceStatus === "partial").length,
  }
}

export function useEscrowCashflow(): HookState<EscrowCashflowPoint[]> {
  return useSeedFallback(SEED_CASHFLOW, async () => SEED_CASHFLOW)
}

export function useEscrowProjection(): HookState<EscrowProjectionPoint[]> {
  return useSeedFallback(SEED_PROJECTION, async () => SEED_PROJECTION)
}

export function useManagedEscrowDetail(escrowId: string) {
  const escrows = useManagedEscrows()
  const escrow = escrows.data.find(e => e.id === escrowId || e.escrowId === escrowId)
    ?? SEED_MANAGED_ESCROWS.find(e => e.id === escrowId || e.escrowId === escrowId)
    ?? SEED_MANAGED_ESCROWS[0]
  return {
    escrow,
    evidence: SEED_E_EVIDENCE,
    milestones: SEED_E_MILESTONES,
    conditions: SEED_E_CONDITIONS,
    timeline: SEED_E_TIMELINE,
    splits: SEED_E_SPLITS,
    loading: escrows.loading,
    source: escrows.source,
  }
}
