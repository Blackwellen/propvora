"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Edit2, ArrowUpRight, ArrowDownRight } from "lucide-react"

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

/* ─────────────────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────────────────── */

/** Live compliance_items for a property, 42P01-safe. */
export function useComplianceItems(workspaceId: string | undefined, propertyId: string) {
  const [items, setItems] = useState<ComplianceItemRow[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!workspaceId || !propertyId) return
    const supabase = createClient()
    let active = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("compliance_items")
          .select("id, title, type:kind, due_date, status")
          .eq("workspace_id", workspaceId)
          .eq("property_id", propertyId)
          .order("due_date", { ascending: true })
        if (error) { if (active) setLoaded(true); return }
        if (active) { setItems((data as ComplianceItemRow[]) ?? []); setLoaded(true) }
      } catch { if (active) setLoaded(true) }
    })()
    return () => { active = false }
  }, [workspaceId, propertyId])
  return { items, loaded }
}

/** Live activity_log scoped to a property + its child entity ids, 42P01-safe. */
export function useActivityLog(workspaceId: string | undefined, entityIds: string[]) {
  const [events, setEvents] = useState<ActivityRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const key = entityIds.join(",")
  useEffect(() => {
    if (!workspaceId || entityIds.length === 0) { setLoaded(true); return }
    const supabase = createClient()
    let active = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("id, action, entity_type:resource_type, entity_id:resource_id, description, created_at")
          .eq("workspace_id", workspaceId)
          // Filter on the REAL column, not the select alias (PostgREST 400s on aliases).
          .in("resource_id", entityIds)
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
   CONSTANTS
───────────────────────────────────────────────────────────────────── */
export const COMPLIANCE_OK = new Set(["compliant", "valid", "passed", "ok", "active", "current"])
export const COMPLIANCE_OVERDUE = new Set(["overdue", "expired", "failed", "non_compliant"])
export const COMPLIANCE_DUE = new Set(["due_soon", "due", "expiring", "expiring_soon", "pending", "scheduled"])

export const STATUS_DISPLAY: Record<string, string> = {
  occupied: "Occupied",
  vacant: "Vacant",
  under_works: "Under Works",
  reserved: "Reserved",
  active: "Active",
  Active: "Active",
  pending: "Pending",
  ended: "Ended",
  disputed: "Disputed",
  surrendered: "Surrendered",
}

/* ─────────────────────────────────────────────────────────────────────
   HELPER FUNCTIONS
───────────────────────────────────────────────────────────────────── */
export const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n)

/** Returns a CSS gradient keyed by property type */
export function getPropertyGradient(propertyType: string | null | undefined): string {
  const t = (propertyType ?? "").toLowerCase()
  if (t === "hmo") return "linear-gradient(135deg, var(--brand-strong) 0%, var(--brand) 100%)"
  if (t === "btl" || t === "long-term let" || t === "long_term_let") return "linear-gradient(135deg, #059669 0%, #10B981 100%)"
  if (t === "sa" || t === "serviced" || t === "serviced_accommodation") return "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)"
  if (t === "r2r" || t === "rent_to_rent" || t === "rent-to-rent") return "linear-gradient(135deg, #EA580C 0%, #F97316 100%)"
  if (t === "student") return "linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)"
  if (t === "co_living" || t === "co-living") return "linear-gradient(135deg, #DB2777 0%, #EC4899 100%)"
  return "linear-gradient(135deg, #475569 0%, #64748B 100%)"
}

/** Color from name string for avatar */
export function getAvatarColor(name: string): string {
  const palette = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#0891B2", "#DB2777", "#D97706", "#374151"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export const fmtNum = (n: number) =>
  new Intl.NumberFormat("en-GB").format(n)

export const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function complianceCounts(items: ComplianceItemRow[]) {
  let compliant = 0, dueSoon = 0, overdue = 0
  const now = Date.now()
  const soon = now + 30 * 86400000
  for (const c of items) {
    const s = (c.status ?? "").toLowerCase()
    if (COMPLIANCE_OVERDUE.has(s)) { overdue++; continue }
    if (COMPLIANCE_DUE.has(s)) { dueSoon++; continue }
    if (COMPLIANCE_OK.has(s)) {
      if (c.due_date) {
        const t = new Date(c.due_date).getTime()
        if (!isNaN(t)) {
          if (t < now) { overdue++; continue }
          if (t <= soon) { dueSoon++; continue }
        }
      }
      compliant++; continue
    }
    if (c.due_date) {
      const t = new Date(c.due_date).getTime()
      if (!isNaN(t)) {
        if (t < now) { overdue++; continue }
        if (t <= soon) { dueSoon++; continue }
      }
    }
    compliant++
  }
  const total = items.length
  const pct = total > 0 ? Math.round((compliant / total) * 100) : null
  return { total, compliant, dueSoon, overdue, pct }
}

export function complianceStatusLabel(c: ComplianceItemRow): "Compliant" | "Due Soon" | "Overdue" {
  const s = (c.status ?? "").toLowerCase()
  if (COMPLIANCE_OVERDUE.has(s)) return "Overdue"
  if (COMPLIANCE_DUE.has(s)) return "Due Soon"
  const now = Date.now()
  if (c.due_date) {
    const t = new Date(c.due_date).getTime()
    if (!isNaN(t)) {
      if (t < now) return "Overdue"
      if (t <= now + 30 * 86400000) return "Due Soon"
    }
  }
  return "Compliant"
}

/* ─────────────────────────────────────────────────────────────────────
   SMALL UI COMPONENTS
───────────────────────────────────────────────────────────────────── */

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    occupied: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    vacant: "bg-slate-100 text-slate-600 border border-slate-200",
    under_works: "bg-amber-50 text-amber-700 border border-amber-200",
    reserved: "bg-violet-50 text-violet-700 border border-violet-200",
    active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending: "bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]",
    ended: "bg-slate-100 text-slate-600 border border-slate-200",
    disputed: "bg-red-50 text-red-700 border border-red-200",
    surrendered: "bg-slate-100 text-slate-600 border border-slate-200",
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Occupied: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Compliant: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Scheduled: "bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]",
    Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Prospect: "bg-violet-50 text-violet-700 border border-violet-200",
    Available: "bg-slate-100 text-slate-600 border border-slate-200",
    "Due Soon": "bg-amber-50 text-amber-700 border border-amber-200",
    Overdue: "bg-red-50 text-red-700 border border-red-200",
    "In Progress": "bg-amber-50 text-amber-700 border border-amber-200",
    Expiring: "bg-amber-50 text-amber-700 border border-amber-200",
    Low: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border border-amber-200",
    High: "bg-red-50 text-red-700 border border-red-200",
  }
  const label = STATUS_DISPLAY[status] ?? status
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", map[status] ?? "bg-slate-100 text-slate-600")}>
      {label}
    </span>
  )
}

export function EditPen({ className }: { className?: string }) {
  return (
    <button aria-label="Edit field" className={cn("opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]", className)}>
      <Edit2 size={12} className="text-slate-400" />
    </button>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[14px] font-bold text-slate-900">{title}</p>
      {action}
    </div>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm", className)}>
      {children}
    </div>
  )
}

export function KpiCard({
  icon: Icon,
  iconColor,
  value,
  label,
  sub,
  change,
  positive,
}: {
  icon: React.ElementType
  iconColor: string
  value: string
  label: string
  sub?: string
  change?: string
  positive?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-shrink-0 min-w-[148px]">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2")} style={{ backgroundColor: `${iconColor}18` }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <p className="text-[20px] font-bold text-slate-900 tabular-nums leading-tight">{value}</p>
      <p className="text-[12px] font-medium text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      {change && (
        <div className={cn("flex items-center gap-0.5 mt-1 text-[11px] font-semibold", positive ? "text-emerald-600" : "text-red-500")}>
          {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {change}
        </div>
      )}
    </div>
  )
}
