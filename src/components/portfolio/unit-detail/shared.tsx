"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Edit2 } from "lucide-react"

/* ─────────────────────────────────────────────────────────────────────
   INTERFACES
───────────────────────────────────────────────────────────────────── */
export interface ComplianceItemRow {
  id: string
  title: string | null
  type: string | null
  due_date: string | null
  status: string | null
}

export interface ActivityRow {
  id: string
  action: string | null
  entity_type: string | null
  entity_id: string | null
  description: string | null
  created_at: string
}

export interface IncomeChartPoint { month: string; income: number; expenses: number }
export interface RentChartPoint { month: string; rent: number }

/* ─────────────────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────────────────── */

/** Live compliance_items for a unit, 42P01-safe. */
export function useUnitComplianceItems(workspaceId: string | undefined, unitId: string) {
  const [items, setItems] = useState<ComplianceItemRow[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!workspaceId || !unitId) return
    const supabase = createClient()
    let active = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, title, type:kind, due_date, status")
          .eq("workspace_id", workspaceId)
          .eq("unit_id", unitId)
          .order("due_date", { ascending: true })
        if (error) { if (active) setLoaded(true); return }
        if (active) { setItems((data as ComplianceItemRow[]) ?? []); setLoaded(true) }
      } catch { if (active) setLoaded(true) }
    })()
    return () => { active = false }
  }, [workspaceId, unitId])
  return { items, loaded }
}

/** Live activity_log for a set of entity ids, 42P01-safe. */
export function useActivityLog(workspaceId: string | undefined, entityIds: string[]) {
  const [events, setEvents] = useState<ActivityRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const key = entityIds.filter(Boolean).join(",")
  useEffect(() => {
    const ids = key.split(",").filter(Boolean)
    if (!workspaceId || ids.length === 0) { setLoaded(true); return }
    const supabase = createClient()
    let active = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("id, action, entity_type:resource_type, entity_id:resource_id, description, created_at")
          .eq("workspace_id", workspaceId)
          .in("resource_id", ids)
          .order("created_at", { ascending: false })
          .limit(40)
        if (error) { if (active) setLoaded(true); return }
        if (active) { setEvents((data as ActivityRow[]) ?? []); setLoaded(true) }
      } catch { if (active) setLoaded(true) }
    })()
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, key])
  return { events, loaded }
}

/* ─────────────────────────────────────────────────────────────────────
   HELPER FUNCTIONS
───────────────────────────────────────────────────────────────────── */
export const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n)

export const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function avatarInitials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

/* ─────────────────────────────────────────────────────────────────────
   SMALL UI COMPONENTS
───────────────────────────────────────────────────────────────────── */

export function StatusPill({ label, color }: { label: string; color: "emerald" | "amber" | "red" | "blue" | "violet" | "slate" }) {
  const cls = {
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]",
    violet: "bg-violet-50 text-violet-700 border border-violet-200",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", cls[color])}>
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-emerald-500": color === "emerald",
        "bg-amber-500": color === "amber",
        "bg-red-500": color === "red",
        "bg-[var(--brand)]": color === "blue",
        "bg-violet-500": color === "violet",
        "bg-slate-400": color === "slate",
      })} />
      {label}
    </span>
  )
}

export function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string; icon?: React.ElementType; accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-300" />}
      </div>
      <div className={cn("text-xl font-bold tabular-nums", accent ?? "text-slate-900")}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  )
}

export function EditPen({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Edit field"
      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ml-1.5 p-0.5 rounded hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
    >
      <Edit2 className="w-3 h-3 text-slate-400" />
    </button>
  )
}
