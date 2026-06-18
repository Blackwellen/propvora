"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { SEED_REQUESTS } from "./seed"
import type {
  PipelineRequest,
  RequestTab,
  RequestsEnvelope,
  Urgency,
  QuoteStatus,
  EscrowStatus,
  LossReason,
  Outcome,
} from "./types"

/* ──────────────────────────────────────────────────────────────────────────
   Data layer for the supplier Requests pipeline.

   Reads supplier_requests (+ joined supplier_quotes) scoped to the current
   supplier workspace. Tolerant by design: any missing table / column / RLS
   denial (42P01 etc.) degrades to the rich seed so every tab always renders.

   Returns `{ data, loading, error, source, permissionDenied, reload }`.
─────────────────────────────────────────────────────────────────────────── */

function classifyTab(row: Record<string, unknown>): RequestTab {
  const status = String(row.status ?? "").toLowerCase()
  if (row.archived_at) return "archived"
  if (status === "won" || status === "accepted") return "won"
  if (status === "lost" || status === "declined" || status === "expired") return "lost"
  if (row.quote_id || status === "quoted") return "quoted"
  return "new"
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function str(v: unknown): string | null {
  return v == null ? null : String(v)
}

/** Map a raw supplier_requests row (with optional joined quote) to PipelineRequest. */
function mapRow(row: Record<string, unknown>): PipelineRequest {
  const id = String(row.id ?? "")
  const tab = classifyTab(row)
  const urgency = (str(row.urgency) ?? "standard") as Urgency
  return {
    id,
    ref: str(row.ref) ?? `RFQ-${id.slice(0, 6).toUpperCase()}`,
    tab,
    requesterCompany: str(row.requester_company) ?? "Property manager",
    requesterVerified: Boolean(row.requester_verified),
    customerName: str(row.requester_company),
    customerReturning: false,
    serviceTitle: str(row.service_title) ?? str(row.title) ?? "Service request",
    scopeSummary: str(row.description) ?? "",
    scopeBullets: [],
    property: {
      type: str(row.property_type),
      year: num(row.property_year),
      tenure: str(row.property_tenure),
      heating: str(row.property_heating),
      bedrooms: num(row.property_bedrooms),
      units: num(row.property_units),
      address: str(row.property_address) ?? str(row.property_ref),
    },
    urgency,
    budgetMinPence: num(row.budget_min_pence),
    budgetMaxPence: num(row.budget_max_pence),
    withinCoverage: Boolean(row.within_coverage),
    winScore: num(row.win_score) ?? 0,
    createdAt: str(row.created_at),
    dueAt: str(row.due_at),
    files: [],
    docsRequired: 0,
    quoteId: str(row.quote_id),
    quoteStatus: (str(row.quote_status) as QuoteStatus | null) ?? null,
    quoteAmountPence: num(row.amount_pence),
    quoteIncVatPence: num(row.total_inc_vat_pence),
    quoteSentAt: str(row.sent_at),
    quoteExpiresAt: str(row.expires_at),
    winChance: num(row.win_chance),
    followUpAt: str(row.follow_up_at),
    versions: [],
    lineItems: [],
    messages: [],
    recommendation: { suggestedPricePence: null, marginEstPct: null, winProbabilityPct: null, fitChecks: [] },
    wonValuePence: num(row.amount_pence),
    acceptedAt: str(row.accepted_at),
    escrow: (str(row.escrow_status) as EscrowStatus | null) ?? "none",
    nextStep: null,
    scheduleReady: false,
    lostAt: tab === "lost" ? str(row.updated_at) : null,
    lostValuePence: num(row.amount_pence),
    lossReason: (str(row.lost_reason) as LossReason | null) ?? null,
    recoverable: Boolean(row.recoverable),
    notes: str(row.notes),
    archivedAt: str(row.archived_at),
    archiveReason: str(row.archive_reason),
    outcome: (str(row.outcome) as Outcome | null) ?? null,
    reactivationUntil: str(row.reactivation_until),
  }
}

export function useSupplierRequests(): RequestsEnvelope<PipelineRequest[]> {
  const { workspaceId, ready } = useSupplierWorkspace()
  const [data, setData] = useState<PipelineRequest[]>(SEED_REQUESTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"live" | "seed">("seed")
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      // No workspace resolved yet → seed, but not an error.
      if (!workspaceId) {
        if (!cancelled) {
          setData(SEED_REQUESTS)
          setSource("seed")
          setPermissionDenied(false)
          setLoading(false)
        }
        return
      }
      try {
        const supabase = createClient()
        const { data: rows, error: err } = await supabase
          .from("supplier_requests")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(500)

        if (cancelled) return

        if (err) {
          // 42P01 (relation missing) / 42703 (column missing) / RLS → seed.
          const code = (err as { code?: string }).code
          const denied = code === "42501" || /permission|rls/i.test(err.message ?? "")
          setData(SEED_REQUESTS)
          setSource("seed")
          setPermissionDenied(denied)
          setError(null)
          setLoading(false)
          return
        }

        if (!rows || rows.length === 0) {
          // Table exists but empty — show seed so the pipeline isn't a blank shell.
          setData(SEED_REQUESTS)
          setSource("seed")
          setPermissionDenied(false)
          setLoading(false)
          return
        }

        setData((rows as Record<string, unknown>[]).map(mapRow))
        setSource("live")
        setPermissionDenied(false)
        setLoading(false)
      } catch {
        if (!cancelled) {
          setData(SEED_REQUESTS)
          setSource("seed")
          setPermissionDenied(false)
          setError(null)
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId, ready, nonce])

  return { data, loading, error, source, permissionDenied, reload }
}

/** Slice the pipeline to a single tab, memoised. */
export function useRequestsForTab(
  all: PipelineRequest[],
  tab: RequestTab
): PipelineRequest[] {
  return useMemo(() => all.filter((r) => r.tab === tab), [all, tab])
}
