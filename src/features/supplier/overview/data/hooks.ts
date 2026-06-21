"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import type {
  OverviewState,
  TodayData,
  RequestsData,
  JobsData,
  EarningsData,
  ComplianceData,
} from "./types"
import {
  emptyToday,
  emptyRequests,
  emptyJobs,
  emptyEarnings,
  emptyCompliance,
} from "./empty"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier Overview data hooks.

   Each hook:
     1. Tries a supplier-workspace-scoped Supabase read (gated on workspaceId).
     2. Catches ANY failure — missing table (42P01), RLS, network — and falls
        back to the RICH seed so every tab renders premium.
     3. Exposes { data, loading, error, source, reload }.

   The live read is intentionally a light "probe": the finance/overview tables
   may be empty on a brand-new Solo supplier, in which case we still want the
   seed so the screen looks alive. We flip `source` to "live" only when the
   workspace genuinely has rows; otherwise we present seed and say so.

   This mirrors the tolerant pattern of useSupplierApi — it NEVER throws into
   render. Extension point: swap the probe for a real aggregate endpoint per
   tab without changing the call sites.
─────────────────────────────────────────────────────────────────────────── */

type Builder<T> = (rows: unknown[]) => T

/**
 * Generic Overview hook. Probes one or more supplier-workspace tables; if any
 * return rows we mark the source "live" and let `build` shape live + seed,
 * otherwise we serve seed. All errors degrade to seed (source stays "seed",
 * error flags a REAL failure for QA without breaking the UI).
 */
function useOverviewResource<T>(
  tables: string[],
  seed: T,
  build?: Builder<T>
): OverviewState<T> {
  const { workspaceId, ready } = useSupplierWorkspace()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [source, setSource] = useState<"live" | "seed">("seed")
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    // No workspace yet → render seed immediately (no request fired).
    if (!ready || !workspaceId) {
      if (!cancelled) {
        setData(seed)
        setSource("seed")
        setLoading(false)
      }
      return () => {
        cancelled = true
      }
    }

    ;(async () => {
      try {
        const supabase = createClient()
        const collected: unknown[] = []
        let sawLive = false

        for (const table of tables) {
          try {
            const { data: rows, error: qErr } = await supabase
              .from(table)
              .select("*")
              .eq("workspace_id", workspaceId)
              .is("archived_at", null)
              .order("created_at", { ascending: false })
              .limit(50)
            // 42P01 / missing column / RLS → treat as "no live data here".
            if (qErr) continue
            if (Array.isArray(rows) && rows.length > 0) {
              sawLive = true
              collected.push(...rows)
            }
          } catch {
            /* tolerate per-table failure — fall through to seed */
          }
        }

        if (cancelled) return
        if (sawLive && build) {
          setData(build(collected))
          setSource("live")
        } else {
          setData(seed)
          setSource("seed")
        }
      } catch {
        if (cancelled) return
        // A genuine client failure — still render seed, but flag it.
        setData(seed)
        setSource("seed")
        setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, ready, nonce])

  return { data, loading, error, source, reload }
}

/* ── Per-tab hooks. Fallback is honest empty state (zeros, empty arrays).
   Replace the builder with a real mapper when live aggregate endpoints land. */

export function useTodayData(): OverviewState<TodayData> {
  return useOverviewResource<TodayData>(
    ["supplier_schedule_events", "supplier_requests"],
    emptyToday,
    () => emptyToday
  )
}

export function useRequestsData(): OverviewState<RequestsData> {
  return useOverviewResource<RequestsData>(
    ["supplier_requests"],
    emptyRequests,
    () => emptyRequests
  )
}

export function useJobsData(): OverviewState<JobsData> {
  return useOverviewResource<JobsData>(
    ["supplier_job_assignments", "supplier_invoices"],
    emptyJobs,
    () => emptyJobs
  )
}

export function useEarningsData(): OverviewState<EarningsData> {
  return useOverviewResource<EarningsData>(
    ["supplier_invoices", "supplier_payouts", "supplier_escrow_items", "supplier_finance_summaries"],
    emptyEarnings,
    () => emptyEarnings
  )
}

export function useComplianceData(): OverviewState<ComplianceData> {
  return useOverviewResource<ComplianceData>(
    ["supplier_compliance_documents"],
    emptyCompliance,
    () => emptyCompliance
  )
}
