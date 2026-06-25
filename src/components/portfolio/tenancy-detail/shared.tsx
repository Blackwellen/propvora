"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Edit2 } from "lucide-react"

/* ─────────────────────────────────────────────────────────────────────
   INTERFACES
───────────────────────────────────────────────────────────────────── */

export interface TenancyDisplay {
  id: string
  tenantName: string
  tenantRole: string
  tenantPhone: string
  tenantEmail: string
  tenantAvatarInitials: string
  address: string
  property: string
  propertyId?: string | null
  unit: string
  unitId?: string | null
  unitSize: string
  leaseStart: string
  leaseEnd: string
  leaseTerm: string
  rent: number
  deposit: number
  depositScheme: string
  depositCertNo: string
  depositProtectedOn: string
  depositExpiry: string
  paymentDay: string
  paymentMethod: string
  tenancyType: string
  tenancyTypeRaw: string | null
  rentFrequency: string
  depositHeldBy: string | null
  notes: string | null
  status: string
  rawStatus?: string
  arrears: number
  onTimeRate: number
  totalPaid6m: number
  totalDue6m: number
}

export interface TenancyActivityRow {
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

/** Live activity_log for a tenancy, 42P01-safe. */
export function useTenancyActivity(workspaceId: string | undefined, tenancyId: string) {
  const [events, setEvents] = useState<TenancyActivityRow[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!workspaceId || !tenancyId) return
    const supabase = createClient()
    let active = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("id, action, entity_type:resource_type, entity_id:resource_id, description, created_at")
          .eq("workspace_id", workspaceId)
          .eq("resource_id", tenancyId)
          .order("created_at", { ascending: false })
          .limit(40)
        if (error) { if (active) setLoaded(true); return }
        if (active) { setEvents((data as TenancyActivityRow[]) ?? []); setLoaded(true) }
      } catch { if (active) setLoaded(true) }
    })()
    return () => { active = false }
  }, [workspaceId, tenancyId])
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

export const fmtTime = (d: string | null | undefined) => {
  if (!d) return ""
  const date = new Date(d)
  if (isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export const dayLabel = (d: string) => {
  const date = new Date(d)
  if (isNaN(date.getTime())) return ""
  const today = new Date()
  const y = new Date(); y.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (same(date, today)) return "Today"
  if (same(date, y)) return "Yesterday"
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
}

export const nameInitials = (name: string) => {
  const p = name.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return "?"
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

/* ─────────────────────────────────────────────────────────────────────
   SMALL UI COMPONENTS
───────────────────────────────────────────────────────────────────── */

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    paid_on_time: { label: "Paid on time", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    paid_late: { label: "Paid late", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    overdue: { label: "Overdue", cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
    upcoming: { label: "Upcoming", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
    current: { label: "Current", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    due_renewal: { label: "Due renewal", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    expired: { label: "Expired", cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
    Protected: { label: "Protected", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    Resolved: { label: "Resolved", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    High: { label: "High", cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
    Medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    Low: { label: "Low", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  }
  const cfg = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.cls)}>
      {cfg.label}
    </span>
  )
}

export function EditPen({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Edit field"
      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
    </button>
  )
}

export function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm", className)}>
      {children}
    </div>
  )
}

export function KpiCard({
  label,
  value,
  sub,
  subColor,
  icon: Icon,
  iconBg,
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
  icon?: React.ElementType
  iconBg?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1 min-w-0">
      {Icon && (
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1", iconBg ?? "bg-slate-100")}>
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
      )}
      <span className="text-xs text-slate-500 font-medium truncate">{label}</span>
      <span className="text-xl font-bold text-slate-900 tabular-nums">{value}</span>
      {sub && <span className={cn("text-xs font-medium", subColor ?? "text-slate-500")}>{sub}</span>}
    </div>
  )
}
