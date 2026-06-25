"use client"

/**
 * Shared live-data layer for the Compliance section.
 *
 * The authoritative live table is `compliance_items` (~12 real rows). Its
 * lineage differs from the `compliance_certificates` app tables, so we read it
 * directly and map its real columns:
 *   id, workspace_id, property_id, unit_id, title, type:kind, due_date, status
 *
 * Everything is 42P01-safe: if a table is missing we fall back to empty data
 * so pages render honest empty states instead of crashing.
 */

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

// ── Real row shape of the live `compliance_items` table ──────────────────────
export interface ComplianceItem {
  id: string
  workspace_id: string
  property_id: string | null
  unit_id: string | null
  title: string | null
  type: string | null
  due_date: string | null
  status: string | null
}

// Derived view-model used by the UI.
export type DerivedStatus = "valid" | "expiring_soon" | "expired" | "missing" | "pending"

export interface ComplianceItemVM extends ComplianceItem {
  /** Normalised status derived from raw status + due_date. */
  derivedStatus: DerivedStatus
  /** Whole days until due_date (negative = overdue). null when no date. */
  daysUntilDue: number | null
  /** Human label for the requirement type. */
  typeLabel: string
}

const EXPIRING_WINDOW_DAYS = 30

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  const t = new Date(date).getTime()
  if (isNaN(t)) return null
  return Math.round((t - Date.now()) / (1000 * 60 * 60 * 24))
}

/** Pretty-print a requirement/type key like "gas_safety" -> "Gas Safety". */
export function humaniseType(type: string | null | undefined): string {
  if (!type) return "Compliance Item"
  return type
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  const parsed = new Date(d)
  if (isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/** Derive a normalised status from the raw status + due date. */
export function deriveStatus(item: ComplianceItem): DerivedStatus {
  const raw = (item.status ?? "").toLowerCase()
  // Date-independent states first: "missing" and in-progress work are not
  // governed by an expiry date.
  if (["missing", "not_started", "none"].includes(raw)) return "missing"
  if (["pending", "in_progress", "scheduled", "needs_data"].includes(raw)) return "pending"

  const d = daysUntil(item.due_date)

  // An explicit terminal "expired" always wins.
  if (["expired", "overdue", "failed"].includes(raw)) return "expired"

  // For renewal-style statuses (valid / compliant / expiring_soon / due_soon /
  // warning / unknown) the DUE DATE is the source of truth — a stale
  // "expiring_soon" flag must still escalate to "expired" once the date passes,
  // otherwise overdue items wrongly surface in the "Expiring soon" list.
  if (d == null) {
    if (["valid", "compliant", "complete"].includes(raw)) return "valid"
    if (["expiring_soon", "due_soon", "warning"].includes(raw)) return "expiring_soon"
    return "pending"
  }
  if (d < 0) return "expired"
  if (d <= EXPIRING_WINDOW_DAYS) return "expiring_soon"
  return "valid"
}

export function toVM(item: ComplianceItem): ComplianceItemVM {
  return {
    ...item,
    derivedStatus: deriveStatus(item),
    daysUntilDue: daysUntil(item.due_date),
    typeLabel: humaniseType(item.type),
  }
}

export interface UseComplianceItemsResult {
  items: ComplianceItemVM[]
  loading: boolean
  /** True when the underlying table doesn't exist yet (42P01). */
  tableMissing: boolean
  workspaceId: string | undefined
}

/**
 * Loads the live `compliance_items` for the current workspace, 42P01-safe.
 * Returns derived view-models the whole section can render.
 */
export function useComplianceItems(): UseComplianceItemsResult {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [rows, setRows] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)

  useEffect(() => {
    if (!workspaceId) {
      // Wait for workspace; keep loading until we have one.
      return
    }
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, workspace_id, property_id, unit_id, title, type:kind, due_date, status")
          .eq("workspace_id", workspaceId)
          .order("due_date", { ascending: true })
        if (!active) return
        if (error) {
          if (error.code === "42P01") setTableMissing(true)
          setRows([])
        } else {
          setRows((data as ComplianceItem[]) ?? [])
        }
      } catch {
        if (active) setRows([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [workspaceId])

  const items = useMemo(() => rows.map(toVM), [rows])

  return { items, loading: loading || !workspaceId, tableMissing, workspaceId }
}

// ── CSV export helper (real Blob download) ───────────────────────────────────

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
