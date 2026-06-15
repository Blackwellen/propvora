"use client"
import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import nextDynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperty, useUpdateProperty, useDeleteProperty } from "@/hooks/useProperties"
import { useUnits, useUpdateUnit, useDeleteUnit, type Unit } from "@/hooks/useUnits"
import { useTenancies, useUpdateTenancy, type Tenancy } from "@/hooks/useTenancies"
import { useJobs } from "@/hooks/useJobs"
import { useTasks } from "@/hooks/useTasks"
import { useContacts } from "@/hooks/useContacts"
import { createClient } from "@/lib/supabase/client"
import type { Property, Job, Task } from "@/types/database"
import { cn } from "@/lib/utils"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { uploadFile } from "@/lib/upload"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import MobileTabs from "@/components/mobile/MobileTabs"
import { getPropertyTypeOption, PROPERTY_TYPE_OPTIONS } from "@/lib/constants/propertyTypes"
import { openCopilot } from "@/lib/copilot/open"
import {
  Building2, Home, Users, PoundSterling, TrendingUp,
  Wrench, Calendar, FileText, Activity, ChevronRight, ChevronLeft,
  Plus, Download, Upload, Edit2, MoreHorizontal, MapPin, Copy, Archive, Trash2,
  Shield, BarChart2, Clock, Eye, Star, Sparkles, Search,
  SlidersHorizontal, ArrowUpRight, ArrowDownRight, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Truck,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"

// OpenStreetMap (Leaflet) — client-only, premium-styled.
const LocationMap = nextDynamic(() => import("@/components/maps/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-slate-100 animate-pulse" />,
})

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n)

/** Returns a CSS gradient keyed by property type */
function getPropertyGradient(propertyType: string | null | undefined): string {
  const t = (propertyType ?? "").toLowerCase()
  if (t === "hmo") return "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)"
  if (t === "btl" || t === "long-term let" || t === "long_term_let") return "linear-gradient(135deg, #059669 0%, #10B981 100%)"
  if (t === "sa" || t === "serviced" || t === "serviced_accommodation") return "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)"
  if (t === "r2r" || t === "rent_to_rent" || t === "rent-to-rent") return "linear-gradient(135deg, #EA580C 0%, #F97316 100%)"
  if (t === "student") return "linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)"
  if (t === "co_living" || t === "co-living") return "linear-gradient(135deg, #DB2777 0%, #EC4899 100%)"
  return "linear-gradient(135deg, #475569 0%, #64748B 100%)"
}

/** Color from name string for avatar */
function getAvatarColor(name: string): string {
  const palette = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#0891B2", "#DB2777", "#D97706", "#374151"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

const fmtNum = (n: number) =>
  new Intl.NumberFormat("en-GB").format(n)

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

/* ─────────────────────────────────────────────────────────────────────
   LIVE DATA HOOKS (42P01-safe — fall back to empty so nothing crashes)
───────────────────────────────────────────────────────────────────── */
interface ComplianceItemRow {
  id: string
  title: string | null
  type: string | null
  due_date: string | null
  status: string | null
}

/** Live compliance_items for a property, 42P01-safe. */
function useComplianceItems(workspaceId: string | undefined, propertyId: string) {
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

const COMPLIANCE_OK = new Set(["compliant", "valid", "passed", "ok", "active", "current"])
const COMPLIANCE_OVERDUE = new Set(["overdue", "expired", "failed", "non_compliant"])
const COMPLIANCE_DUE = new Set(["due_soon", "due", "expiring", "expiring_soon", "pending", "scheduled"])

function complianceCounts(items: ComplianceItemRow[]) {
  let compliant = 0, dueSoon = 0, overdue = 0
  const now = Date.now()
  const soon = now + 30 * 86400000
  for (const c of items) {
    const s = (c.status ?? "").toLowerCase()
    if (COMPLIANCE_OVERDUE.has(s)) { overdue++; continue }
    if (COMPLIANCE_DUE.has(s)) { dueSoon++; continue }
    if (COMPLIANCE_OK.has(s)) {
      // even if "ok" by status, surface near-expiry from due_date
      if (c.due_date) {
        const t = new Date(c.due_date).getTime()
        if (!isNaN(t)) {
          if (t < now) { overdue++; continue }
          if (t <= soon) { dueSoon++; continue }
        }
      }
      compliant++; continue
    }
    // unknown status — fall back to due_date
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

interface ActivityRow {
  id: string
  action: string | null
  entity_type: string | null
  entity_id: string | null
  description: string | null
  created_at: string
}

/** Live activity_log scoped to a property + its child entity ids, 42P01-safe. */
function useActivityLog(workspaceId: string | undefined, entityIds: string[]) {
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
          .in("entity_id", entityIds)
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
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────── */

/* Status pill */
const STATUS_DISPLAY: Record<string, string> = {
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    // unit statuses (lowercase from DB)
    occupied: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    vacant: "bg-slate-100 text-slate-600 border border-slate-200",
    under_works: "bg-amber-50 text-amber-700 border border-amber-200",
    reserved: "bg-violet-50 text-violet-700 border border-violet-200",
    // tenancy statuses
    active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending: "bg-blue-50 text-blue-700 border border-blue-200",
    ended: "bg-slate-100 text-slate-600 border border-slate-200",
    disputed: "bg-red-50 text-red-700 border border-red-200",
    surrendered: "bg-slate-100 text-slate-600 border border-slate-200",
    // display labels used in mock tenant data
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Occupied: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Compliant: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
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

/* Edit pen */
function EditPen({ className }: { className?: string }) {
  return (
    <button aria-label="Edit field" className={cn("opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", className)}>
      <Edit2 size={12} className="text-slate-400" />
    </button>
  )
}

/* Section header */
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[14px] font-bold text-slate-900">{title}</p>
      {action}
    </div>
  )
}

/* Card wrapper */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm", className)}>
      {children}
    </div>
  )
}

/* KPI card */
function KpiCard({
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

/* ─────────────────────────────────────────────────────────────────────
   TAB: OVERVIEW (1A)
───────────────────────────────────────────────────────────────────── */
function TabOverview({ prop, unitsList, tenanciesList, complianceItems, complianceLoaded, activity, activityLoaded, jobs, tasks, coverImageUrl, onCoverUpload, uploadingCover, coverError, coverInputRef, onSave, onGoTab }: {
  prop: Property
  unitsList: Unit[]
  tenanciesList: Tenancy[]
  complianceItems: ComplianceItemRow[]
  complianceLoaded: boolean
  activity: ActivityRow[]
  activityLoaded: boolean
  jobs: { id: string; status: string }[]
  tasks: { id: string; status: string }[]
  coverImageUrl: string | null
  onCoverUpload: (file: File) => Promise<void>
  uploadingCover: boolean
  coverError: string | null
  coverInputRef: React.RefObject<HTMLInputElement | null>
  onSave: (field: string, value: any) => Promise<void>
  onGoTab: (tab: string) => void
}) {
  const [heroCoverError, setHeroCoverError] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const showCoverImage = !!coverImageUrl && !heroCoverError

  const occupied = unitsList.filter((u) => u.status === "occupied").length
  const totalUnits = unitsList.length
  const occupancyPct = totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : null
  // Monthly rent derived from active tenancies; fall back to target_rent
  const activeTenancyRent = tenanciesList
    .filter((t) => t.status === "active")
    .reduce((s, t) => s + (t.rent_amount ?? 0), 0)
  const monthlyRent = activeTenancyRent > 0 ? activeTenancyRent : (prop.target_rent ?? 0)
  const comp = complianceCounts(complianceItems)
  const jobDone = ["complete", "closed", "disputed"]
  const taskDone = ["done", "cancelled"]
  const openJobs = jobs.filter((j) => !jobDone.includes(j.status)).length
  const openTasks = tasks.filter((t) => !taskDone.includes(t.status)).length
  const openWork = openJobs + openTasks
  // Next compliance due date (soonest future)
  const nextDue = complianceItems
    .map((c) => c.due_date)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()) && d.getTime() >= Date.now())
    .sort((a, b) => a.getTime() - b.getTime())[0]

  // Dwelling type (free-text `category`) with a nice label; falls back to operation type.
  const dwellingLabel = prop.category
    ? (getPropertyTypeOption(prop.category)?.label ?? prop.category)
    : null

  return (
    <div className="space-y-5">
      {/* Hero + right col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Hero — uploaded photo or gradient fallback (half-height banner) */}
          <div
            className="relative h-[220px] shrink-0 rounded-2xl overflow-hidden group"
            style={!showCoverImage ? { background: getPropertyGradient(prop.property_type) } : undefined}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files?.[0]
              if (file && file.type.startsWith("image/")) onCoverUpload(file)
            }}
          >
            {showCoverImage ? (
              <Image
                src={coverImageUrl!}
                alt={prop.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 800px"
                onError={() => setHeroCoverError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-20">
                <Building2 size={64} className="text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {/* Property type label overlay — dwelling type if known, else operation type */}
            <div className="absolute bottom-4 left-4">
              <span className="text-white/90 text-[13px] font-semibold uppercase tracking-widest">{dwellingLabel ?? prop.property_type?.toUpperCase() ?? "PROPERTY"}</span>
            </div>
            {/* Hidden file input */}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onCoverUpload(file)
                e.target.value = ""
              }}
            />
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white text-[12px] font-semibold text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all disabled:opacity-60"
            >
              <Upload size={12} />
              {uploadingCover ? "Uploading…" : "Edit Cover"}
            </button>
            {coverError && (
              <div className="absolute top-14 right-3 max-w-[260px] bg-red-600 text-white text-[11px] font-medium px-3 py-2 rounded-lg shadow-lg">
                {coverError}
              </div>
            )}
            {/* Drag-over overlay */}
            {dragOver && (
              <div className="absolute inset-0 bg-blue-600/30 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl border-2 border-blue-400 border-dashed">
                <div className="text-center text-white">
                  <Upload size={32} className="mx-auto mb-2" />
                  <p className="text-[14px] font-semibold">Drop to upload cover</p>
                </div>
              </div>
            )}
          </div>

          {/* Financial & occupancy snapshot — live, fills remaining height */}
          <Card className="p-4 flex-1 flex flex-col justify-center">
            <SectionHeader title="Financial & Occupancy" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Monthly Rent", value: prop.target_rent != null ? `£${Number(prop.target_rent).toLocaleString()}` : "—", color: "text-slate-900" },
                { label: "Units", value: String(totalUnits), color: "text-slate-900" },
                { label: "Occupied", value: String(occupied), color: "text-emerald-600" },
                { label: "Occupancy", value: totalUnits > 0 ? `${Math.round((occupied / totalUnits) * 100)}%` : "—", color: "text-[#2563EB]" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <p className={cn("text-[18px] font-bold tabular-nums", item.color)}>{item.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right col – compliance + health */}
        <div className="space-y-4">
          <Card className="p-4">
            <SectionHeader
              title="Compliance Snapshot"
              action={
                <button onClick={() => onGoTab("compliance")} className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-0.5">
                  View <ArrowUpRight size={11} />
                </button>
              }
            />
            {comp.total === 0 ? (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Shield size={20} className="text-slate-300 mx-auto mb-1.5" />
                <p className="text-[12px] text-slate-500">{complianceLoaded ? "No compliance items tracked yet" : "Loading…"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Items", value: String(comp.total), color: "text-slate-900" },
                  { label: "Due Soon", value: String(comp.dueSoon), color: comp.dueSoon > 0 ? "text-amber-600" : "text-slate-400" },
                  { label: "Overdue", value: String(comp.overdue), color: comp.overdue > 0 ? "text-red-600" : "text-slate-400" },
                  { label: "Compliant", value: comp.pct != null ? `${comp.pct}%` : "—", color: "text-emerald-600" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className={cn("text-[18px] font-bold tabular-nums", item.color)}>{item.value}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <SectionHeader title="Quick Health" />
            <div className="space-y-2.5">
              {[
                { label: "Occupancy", value: occupancyPct != null ? `${occupancyPct}%` : "—", good: occupancyPct == null || occupancyPct >= 80 },
                { label: "Open Work", value: String(openWork), good: openWork === 0 },
                { label: "Overdue Compliance", value: comp.total === 0 ? "—" : String(comp.overdue), good: comp.overdue === 0 },
                { label: "Active Tenancies", value: String(tenanciesList.filter((t) => t.status === "active").length), good: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-600">{row.label}</span>
                  <span className={cn("text-[12px] font-semibold tabular-nums", row.good ? "text-emerald-600" : "text-amber-600")}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionHeader
              title="Recent Activity"
              action={
                <button onClick={() => onGoTab("activity")} className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-0.5">
                  View all <ArrowUpRight size={11} />
                </button>
              }
            />
            {activity.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Activity size={20} className="text-slate-300 mx-auto mb-1.5" />
                <p className="text-[12px] text-slate-500">{activityLoaded ? "No activity recorded yet" : "Loading…"}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activity.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex gap-2.5">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-500" />
                    <div>
                      <p className="text-[12px] text-slate-700 leading-snug">{item.description ?? item.action ?? "Activity"}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{fmtDate(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* KPI strip — live-derived */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        <KpiCard icon={Users} iconColor="#2563EB" value={occupancyPct != null ? `${occupancyPct}%` : "—"} label="Occupancy" sub={`${occupied} of ${totalUnits} units`} />
        <KpiCard icon={PoundSterling} iconColor="#10B981" value={monthlyRent > 0 ? fmt(monthlyRent) : "—"} label="Monthly Rent" sub="From active tenancies" />
        <KpiCard icon={Home} iconColor="#7C3AED" value={String(totalUnits)} label="Units" sub={`${occupied} occupied`} />
        <KpiCard icon={FileText} iconColor="#F59E0B" value={String(tenanciesList.filter((t) => t.status === "active").length)} label="Tenancies" sub="Active leases" />
        <KpiCard icon={Wrench} iconColor="#EF4444" value={String(openWork)} label="Open Work" sub={`${openJobs} jobs · ${openTasks} tasks`} />
        <KpiCard icon={Shield} iconColor="#10B981" value={comp.total === 0 ? "—" : (comp.pct != null ? `${comp.pct}%` : "—")} label="Compliant" sub={`${comp.overdue} overdue · ${comp.dueSoon} due soon`} />
        <KpiCard icon={Calendar} iconColor="#2563EB" value={nextDue ? fmtDate(nextDue.toISOString()) : "—"} label="Next Due" sub="Compliance item" />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Property summary */}
          <Card className="p-5">
            <SectionHeader title="Property Summary" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 md:gap-x-10 gap-y-3 text-[13px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Dwelling Type</span>
                {/* Saves the live free-text `category` column (NOT a non-existent
                    `property_type`). The `template` enum is derived server-side. */}
                <InlineEditField
                  value={prop.category ?? ""}
                  onSave={(v) => onSave("category", v)}
                  type="select"
                  options={PROPERTY_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Status</span>
                <InlineEditField
                  value={prop.status ?? "active"}
                  onSave={(v) => onSave("status", v)}
                  type="select"
                  options={[
                    { value: "active", label: "Active" },
                    { value: "vacant", label: "Void" },
                    { value: "under_works", label: "Off Market" },
                    { value: "archived", label: "Archived" },
                  ]}
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Target Rent</span>
                <InlineEditField
                  value={prop.target_rent ?? ""}
                  onSave={(v) => onSave("target_rent", v ? Number(v) : null)}
                  type="number"
                  prefix="£"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Bedrooms</span>
                <InlineEditField
                  value={prop.bedrooms ?? ""}
                  onSave={(v) => onSave("bedrooms", v ? Number(v) : null)}
                  type="number"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Floor Area</span>
                <InlineEditField
                  value={prop.floor_area_sqm ?? ""}
                  onSave={(v) => onSave("floor_area_sqm", v ? Number(v) : null)}
                  type="number"
                  displayClassName="font-medium text-slate-800"
                  placeholder="—"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Postcode</span>
                <InlineEditField
                  value={prop.postcode ?? ""}
                  onSave={(v) => onSave("postcode", v)}
                  displayClassName="font-medium text-slate-800"
                />
              </div>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <span className="text-[12px] text-slate-500 block mb-1">Notes</span>
              <InlineEditField
                value={prop.notes ?? ""}
                onSave={(v) => onSave("notes", v)}
                type="textarea"
                placeholder="Add notes…"
                displayClassName="text-[13px] text-slate-700"
              />
            </div>
          </Card>

          {/* Financial summary — contextual, routes to Money */}
          <Card className="p-5">
            <SectionHeader
              title="Financial Summary"
              action={
                <Link href="/app/money" className="text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
                  Open Money <ArrowUpRight size={12} />
                </Link>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Monthly Rent (active)", value: monthlyRent > 0 ? fmt(monthlyRent) : "—", color: "text-slate-900" },
                { label: "Target Rent", value: prop.target_rent != null ? fmt(prop.target_rent) : "—", color: "text-slate-900" },
                { label: "Annualised", value: monthlyRent > 0 ? fmt(monthlyRent * 12) : "—", color: "text-emerald-600" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <p className={cn("text-[18px] font-bold tabular-nums", item.color)}>{item.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Full income, expenses and yield tracking lives in the Money section.
            </p>
          </Card>
        </div>

        {/* Location */}
        <div>
          <Card className="p-5">
            <SectionHeader title="Location" />
            <div className="mb-3 overflow-hidden rounded-xl">
              <LocationMap
                height={160}
                zoom={15}
                markers={[
                  {
                    id: prop.id,
                    lat: prop.latitude,
                    lng: prop.longitude,
                    address: [prop.address_line1, prop.address_line2, prop.city, prop.postcode]
                      .filter(Boolean)
                      .join(", ") || null,
                    label: prop.name,
                    sublabel: [prop.city, prop.postcode].filter(Boolean).join(" ") || undefined,
                  },
                ]}
              />
            </div>
            <p className="text-[12px] text-slate-600 font-medium mb-2">
              {prop.address_line1 ?? "Address not set"}
              {[prop.city, prop.postcode].filter(Boolean).length > 0 && <><br />{[prop.city, prop.postcode].filter(Boolean).join(" ")}</>}
            </p>
            {prop.address_line1 || (Number.isFinite(prop.latitude) && Number.isFinite(prop.longitude)) ? (
              <a
                href={
                  Number.isFinite(prop.latitude) && Number.isFinite(prop.longitude)
                    ? `https://www.openstreetmap.org/?mlat=${prop.latitude}&mlon=${prop.longitude}#map=17/${prop.latitude}/${prop.longitude}`
                    : `https://www.openstreetmap.org/search?query=${encodeURIComponent([prop.address_line1, prop.city, prop.postcode].filter(Boolean).join(", "))}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-blue-600 font-medium flex items-center gap-1 hover:underline"
              >
                View on OpenStreetMap <ArrowUpRight size={12} />
              </a>
            ) : (
              <span className="text-[12px] text-slate-500">Add address to enable maps</span>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   TAB: UNITS (1B)
───────────────────────────────────────────────────────────────────── */
function TabUnits({ unitsList, propertyId }: { unitsList: Unit[]; propertyId: string }) {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const deleteUnit = useDeleteUnit()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const filtered = unitsList.filter((u) => {
    const matchSearch = u.unit_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "All" || u.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalRent = filtered.reduce((s, u) => s + (u.target_rent ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search units…"
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          {[
            { label: "All", value: "All" },
            { label: "Occupied", value: "occupied" },
            { label: "Vacant", value: "vacant" },
            { label: "Under Works", value: "under_works" },
            { label: "Reserved", value: "reserved" },
          ].map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className="flex items-center gap-1.5 text-[13px] text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
          <SlidersHorizontal size={13} /> More filters
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/app/portfolio/units/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> Add Unit
          </Link>
          <ActionMenu
            align="right"
            items={[
              { label: "Export units", icon: Download, onClick: () => {} },
              { label: "Import units", icon: Upload, onClick: () => {} },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Unit", "Status", "Occupancy", "Monthly Rent", "Deposit", "Area", "Type", "Rooms", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit) => (
                <tr
                  key={unit.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link href={`/app/portfolio/units/${unit.id}`} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Home size={15} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{unit.unit_name}</p>
                        <p className="text-[11px] text-slate-500">Floor {unit.floor}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={unit.status} /></td>
                  <td className="px-4 py-3 text-slate-700 tabular-nums">
                    {unit.status === "occupied" ? "1/1" : "0/1"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">{unit.target_rent != null ? fmt(unit.target_rent) : "—"}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{unit.target_rent != null ? fmt(unit.target_rent) : "—"}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{unit.floor_area_sqm != null ? `${unit.floor_area_sqm}m²` : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{unit.unit_type ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{unit.bedrooms ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        items={[
                          { label: "View unit", icon: Eye, onClick: () => router.push(`/app/portfolio/units/${unit.id}`) },
                          { label: "Create tenancy", icon: Users, onClick: () => router.push(`/app/portfolio/tenancies/new?unitId=${unit.id}`) },
                          { label: "Add work order", icon: Wrench, onClick: () => router.push(`/app/work/jobs/new?unitId=${unit.id}`) },
                          { label: "Delete unit", icon: Trash2, variant: "danger", onClick: () => {
                            if (workspace?.id && confirm("Delete this unit? This cannot be undone.")) {
                              deleteUnit.mutate({ id: unit.id, workspaceId: workspace.id, propertyId: unit.property_id })
                            }
                          }},
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80 border-t border-slate-200">
                <td className="px-4 py-3 text-[12px] font-semibold text-slate-600" colSpan={3}>
                  Total / Average — {filtered.length} units
                </td>
                <td className="px-4 py-3 text-[13px] font-bold text-slate-800 tabular-nums">{fmt(totalRent)}</td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   TAB: TENANCIES (1C)
───────────────────────────────────────────────────────────────────── */
function TabTenancies({ propertyId, tenanciesList, unitsList }: { propertyId: string; tenanciesList: Tenancy[]; unitsList: Unit[] }) {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const updateTenancy = useUpdateTenancy()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const unitMap = Object.fromEntries(unitsList.map((u) => [u.id, u.unit_name]))

  const filtered = tenanciesList.filter((t) => {
    const unitName = unitMap[t.unit_id ?? ""] ?? ""
    const matchSearch = unitName.toLowerCase().includes(search.toLowerCase()) || (t.reference ?? "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "All" || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalRent = filtered.reduce((s, t) => s + (t.rent_amount ?? 0), 0)
  const totalDeposit = filtered.reduce((s, t) => s + (t.deposit_amount ?? 0), 0)

  if (tenanciesList.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-slate-500">No tenancies yet for this property.</p>
          <Link href={`/app/portfolio/tenancies/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> New Tenancy
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenancies…"
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          {["All", "draft", "active", "ended", "terminated", "uncollectable"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className="flex items-center gap-1.5 text-[13px] text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
          <SlidersHorizontal size={13} /> More filters
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/app/portfolio/tenancies/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> New Tenancy
          </Link>
          <ActionMenu
            align="right"
            items={[
              { label: "Export tenancies", icon: Download, onClick: () => {} },
              { label: "Import tenancies", icon: Upload, onClick: () => {} },
            ]}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Reference", "Unit", "Lease Period", "Monthly Rent", "Status", "Deposit", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/app/portfolio/tenancies/${t.id}`} className="font-medium text-blue-600 hover:underline">
                      {t.reference ?? t.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{unitMap[t.unit_id ?? ""] ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums text-[12px]">
                    {t.start_date} {t.end_date ? `→ ${t.end_date}` : ""}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">{fmt(t.rent_amount ?? 0)}</td>
                  <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{t.deposit_amount ? fmt(t.deposit_amount) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        items={[
                          { label: "View tenancy", icon: Eye, onClick: () => router.push(`/app/portfolio/tenancies/${t.id}`) },
                          { label: "View property", icon: Building2, onClick: () => router.push(`/app/portfolio/properties/${t.property_id}`) },
                          { label: "Renew", icon: RefreshCw, onClick: () => router.push(`/app/portfolio/tenancies/${t.id}?tab=details`) },
                          { label: "End tenancy", icon: XCircle, variant: "danger", onClick: () => {
                            if (workspace?.id && confirm("End this tenancy?")) {
                              updateTenancy.mutate({ id: t.id, workspaceId: workspace.id, payload: { status: "ended" } })
                            }
                          }},
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80 border-t border-slate-200">
                <td className="px-4 py-3 text-[12px] font-semibold text-slate-600" colSpan={3}>
                  Total — {filtered.length} {filtered.length === 1 ? "tenancy" : "tenancies"}
                </td>
                <td className="px-4 py-3 text-[13px] font-bold text-slate-800 tabular-nums">{fmt(totalRent)}</td>
                <td />
                <td className="px-4 py-3 text-[13px] font-bold text-slate-800 tabular-nums">{fmt(totalDeposit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   TAB: FINANCES (1D)
───────────────────────────────────────────────────────────────────── */
function TabFinances({ tenanciesList, unitsList, prop }: { tenanciesList: Tenancy[]; unitsList: Unit[]; prop: Property }) {
  // Live rent roll derived from active tenancies
  const activeTenancies = tenanciesList.filter((t) => t.status === "active")
  const monthlyRent = activeTenancies.reduce((s, t) => s + (t.rent_amount ?? 0), 0)
  const totalDeposit = tenanciesList.reduce((s, t) => s + (t.deposit_amount ?? 0), 0)
  const targetRent = unitsList.reduce((s, u) => s + (u.target_rent ?? 0), 0) || (prop.target_rent ?? 0)
  const occupancyPct = unitsList.length > 0
    ? Math.round((unitsList.filter((u) => u.status === "occupied").length / unitsList.length) * 100)
    : null
  const unitMap = Object.fromEntries(unitsList.map((u) => [u.id, u.unit_name]))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">Rent roll derived from live tenancies. Full transactions, arrears and reports live in Money.</p>
        <Link href="/app/money" className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
          Open Money <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* KPI cards — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Monthly Rent", value: monthlyRent > 0 ? fmt(monthlyRent) : "—", sub: `${activeTenancies.length} active tenancies`, color: "#10B981" },
          { label: "Annualised", value: monthlyRent > 0 ? fmt(monthlyRent * 12) : "—", sub: "Active rent × 12", color: "#2563EB" },
          { label: "Target Rent", value: targetRent > 0 ? fmt(targetRent) : "—", sub: "Combined unit targets", color: "#7C3AED" },
          { label: "Occupancy", value: occupancyPct != null ? `${occupancyPct}%` : "—", sub: "Of units", color: "#F59E0B" },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] text-slate-500 mb-1">{k.label}</p>
            <p className="text-[20px] font-bold text-slate-900 tabular-nums">{k.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* Rent roll table — live tenancies */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[14px] font-bold text-slate-900">Rent Roll</p>
        </div>
        {activeTenancies.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <PoundSterling size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">No active tenancies</p>
            <p className="text-[12px] text-slate-500 mt-1">Add a tenancy to start tracking rent for this property.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Reference", "Unit", "Lease Period", "Monthly Rent", "Deposit"].map((h, i) => (
                    <th key={h} className={cn("text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap", i >= 3 ? "text-right" : "text-left")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeTenancies.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/portfolio/tenancies/${t.id}`} className="font-medium text-blue-600 hover:underline">
                        {t.reference ?? t.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{unitMap[t.unit_id ?? ""] ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums text-[12px]">{t.start_date}{t.end_date ? ` → ${t.end_date}` : ""}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">{fmt(t.rent_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{t.deposit_amount ? fmt(t.deposit_amount) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 border-t border-slate-200">
                  <td className="px-4 py-3 text-[12px] font-semibold text-slate-600" colSpan={3}>Total — {activeTenancies.length} active</td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-800 tabular-nums">{fmt(monthlyRent)}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-800 tabular-nums">{fmt(totalDeposit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   TAB: COMPLIANCE (1E)
───────────────────────────────────────────────────────────────────── */
function complianceStatusLabel(c: ComplianceItemRow): "Compliant" | "Due Soon" | "Overdue" {
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

function TabCompliance({ items, loaded, propertyId }: { items: ComplianceItemRow[]; loaded: boolean; propertyId: string }) {
  const comp = complianceCounts(items)

  const statusIcon = (s: string) => {
    if (s === "Compliant") return <CheckCircle2 size={15} className="text-emerald-500" />
    if (s === "Overdue") return <XCircle size={15} className="text-red-500" />
    return <AlertCircle size={15} className="text-amber-500" />
  }

  return (
    <div className="space-y-5">
      {/* Summary cards — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Items", value: String(comp.total), icon: Shield, color: "#2563EB", sub: "Tracked for this property" },
          { label: "Due Soon", value: String(comp.dueSoon), icon: AlertCircle, color: "#F59E0B", sub: "Within 30 days" },
          { label: "Overdue", value: String(comp.overdue), icon: XCircle, color: "#EF4444", sub: "Action required" },
          { label: "Compliant", value: comp.pct != null ? `${comp.pct}%` : "—", icon: CheckCircle2, color: "#10B981", sub: "Up to date" },
        ].map((k) => (
          <Card key={k.label} className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${k.color}18` }}>
              <k.icon size={18} style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900 tabular-nums leading-tight">{k.value}</p>
              <p className="text-[12px] font-medium text-slate-700">{k.label}</p>
              <p className="text-[11px] text-slate-500">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Compliance table — live */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[14px] font-bold text-slate-900">Compliance Register</p>
          <Link href={`/app/compliance?property=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={13} /> Add Item
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <Shield size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">{loaded ? "No compliance items yet" : "Loading…"}</p>
            <p className="text-[12px] text-slate-500 mt-1">Track certificates and inspections in the Compliance section.</p>
            <Link href={`/app/compliance?property=${propertyId}`} className="mt-3 text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
              Open Compliance <ArrowUpRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Certificate / Inspection", "Type", "Due Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const label = complianceStatusLabel(item)
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {statusIcon(label)}
                          <span className="font-medium text-slate-800">{item.title ?? item.type ?? "Compliance item"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.type ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">{fmtDate(item.due_date)}</td>
                      <td className="px-4 py-3"><StatusPill status={label} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ActionMenu align="right" items={[
                            { label: "View in Compliance", icon: Eye, onClick: () => { window.location.href = `/app/compliance?property=${propertyId}` } },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-slate-100">
          <Link href={`/app/compliance?property=${propertyId}`} className="text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
            View all compliance items <ArrowUpRight size={12} />
          </Link>
        </div>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   TAB: DOCUMENTS (1F)
───────────────────────────────────────────────────────────────────── */
function TabDocuments() {
  const params = useParams()
  const propertyId = params.id as string
  const { workspace } = useWorkspace()

  const [docCat, setDocCat] = useState("All")
  const catTabs = ["All", "Documents", "Images", "Videos", "Plans"]
  const [docDragOver, setDocDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<{
    name: string; url: string; size: string; category: string;
    uploaded: string; uploadedBy: string; expiry: string; status: string
  }[]>([])
  const docInputRef = useRef<HTMLInputElement>(null)

  const statusColor = (s: string) =>
    s === "Active" ? "text-emerald-600" : s === "Expiring" ? "text-amber-600" : "text-slate-500"

  async function handleDocUpload(file: File) {
    if (!workspace?.id) return
    setUploading(true)
    try {
      // 1. Server-proxied upload to R2 → authed view URL
      const { url: publicUrl } = await uploadFile(file, workspace.id, "property-documents")

      // 2. Save to Supabase (property_documents table, 42P01 fallback)
      try {
        const supabase = createClient()
        await supabase.from("property_documents").insert({
          workspace_id: workspace.id,
          property_id: propertyId,
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          category: "Documents",
          uploaded_by: "You",
        })
      } catch (e: any) {
        if (e?.code !== "42P01") console.error("Doc save error:", e)
        // 42P01 = table doesn't exist yet — still add to local state
      }

      // 5. Optimistic UI
      setUploadedDocs((prev) => [{
        name: file.name,
        url: publicUrl,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        category: "Documents",
        uploaded: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        uploadedBy: "You",
        expiry: "—",
        status: "Active",
      }, ...prev])
    } catch (err) {
      console.error("Doc upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {catTabs.map((t) => (
            <button
              key={t}
              onClick={() => setDocCat(t)}
              className={cn(
                "text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all",
                docCat === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => docInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            <Upload size={13} /> {uploading ? "Uploading…" : "Upload"}
          </button>
          <button className="flex items-center gap-1.5 text-[13px] text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
            <Plus size={13} /> New Folder
          </button>
          <ActionMenu
            align="right"
            items={[
              { label: "Export all", icon: Download, onClick: () => {} },
              { label: "Share folder", icon: Copy, onClick: () => {} },
            ]}
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDocDragOver(true) }}
        onDragLeave={() => setDocDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDocDragOver(false)
          const files = Array.from(e.dataTransfer.files)
          files.forEach(handleDocUpload)
        }}
        onClick={() => docInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
          docDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        <input
          ref={docInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            files.forEach(handleDocUpload)
            e.target.value = ""
          }}
        />
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          {uploading ? (
            <span className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <Upload size={22} className="text-slate-400" />
          )}
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-slate-700">
            {uploading ? "Uploading…" : "Drop files here or click to browse"}
          </p>
          <p className="text-[12px] text-slate-500 mt-0.5">PDF, images, Word, Excel — up to 10MB each</p>
        </div>
      </div>

      {/* Documents table — live uploads only */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[14px] font-bold text-slate-900">Documents</p>
        </div>
        {uploadedDocs.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <FileText size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">No documents uploaded yet</p>
            <p className="text-[12px] text-slate-500 mt-1">Upload certificates, plans and reports above. Files are stored securely.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Name", "Category", "Uploaded", "Uploaded By", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadedDocs.map((doc) => (
                  <tr key={doc.url} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText size={15} className="text-slate-400 flex-shrink-0" />
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                          {doc.name}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{doc.category}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{doc.uploaded}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.uploadedBy}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[12px] font-semibold", statusColor(doc.status))}>{doc.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100 inline-flex"><Eye size={13} className="text-slate-400" /></a>
                        <a href={doc.url} download={doc.name} className="p-1.5 rounded hover:bg-slate-100 inline-flex">
                          <Download size={13} className="text-slate-400" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   TAB: ACTIVITY (1G)
───────────────────────────────────────────────────────────────────── */
function TabActivity({ events, loaded }: { events: ActivityRow[]; loaded: boolean }) {
  // Group by calendar day
  const grouped: Record<string, ActivityRow[]> = {}
  for (const e of events) {
    const key = fmtDate(e.created_at)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  }

  const typeIcon = (type: string | null) => {
    const t = (type ?? "").toLowerCase()
    if (t.includes("payment") || t.includes("money") || t.includes("invoice")) return <PoundSterling size={13} />
    if (t.includes("job") || t.includes("task") || t.includes("work") || t.includes("maintenance")) return <Wrench size={13} />
    if (t.includes("document") || t.includes("file")) return <FileText size={13} />
    if (t.includes("note")) return <Star size={13} />
    return <Activity size={13} />
  }

  if (events.length === 0) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Activity size={26} className="text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">{loaded ? "No activity yet" : "Loading activity…"}</p>
          <p className="text-[12px] text-slate-500 mt-1">Actions taken on this property and its units, tenancies and work will appear here.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">{date}</p>
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white bg-blue-500">
                  {typeIcon(item.entity_type ?? item.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-800">{item.description ?? item.action ?? "Activity"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500">{new Date(item.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                    {item.entity_type && (<><span className="text-slate-300">·</span><span className="text-[11px] text-slate-500 font-medium capitalize">{item.entity_type}</span></>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   TAB: SUPPLIERS (1H)
───────────────────────────────────────────────────────────────────── */
function TabWork({ jobs, tasks, propertyId }: { jobs: Job[]; tasks: Task[]; propertyId: string }) {
  const router = useRouter()
  const JOB_DONE: string[] = ["complete", "closed", "disputed"]
  const TASK_DONE: string[] = ["done", "cancelled"]
  const openJobs = jobs.filter((j) => !JOB_DONE.includes(j.status))
  const openTasks = tasks.filter((t) => !TASK_DONE.includes(t.status))
  const completedJobs = jobs.filter((j) => j.status === "complete" || j.status === "closed")

  const jobStatusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")

  return (
    <div className="space-y-4">
      {/* KPI strip — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Open Jobs", value: String(openJobs.length), sub: "In progress", icon: Wrench, color: "#2563EB" },
          { label: "Open Tasks", value: String(openTasks.length), sub: "To do", icon: Clock, color: "#F59E0B" },
          { label: "Completed Jobs", value: String(completedJobs.length), sub: "All time", icon: CheckCircle2, color: "#10B981" },
          { label: "Total Work Items", value: String(jobs.length + tasks.length), sub: "Jobs + tasks", icon: Activity, color: "#7C3AED" },
        ].map((k) => (
          <Card key={k.label} className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${k.color}18` }}>
              <k.icon size={18} style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900 tabular-nums leading-tight">{k.value}</p>
              <p className="text-[12px] font-medium text-slate-700">{k.label}</p>
              <p className="text-[11px] text-slate-500">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Jobs */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[14px] font-bold text-slate-900">Jobs</p>
          <div className="flex items-center gap-2">
            <Link href={`/app/work/jobs/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} /> New Job
            </Link>
            <Link href={`/app/work?property=${propertyId}`} className="text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
              Open Work <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
        {jobs.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <Wrench size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">No jobs for this property</p>
            <p className="text-[12px] text-slate-500 mt-1">Raise a job to track maintenance and works.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Job", "Reference", "Scheduled", "Status", "Quoted", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Wrench size={13} className="text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-800">{job.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{job.reference ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{fmtDate(job.scheduled_date)}</td>
                    <td className="px-4 py-3"><StatusPill status={jobStatusLabel(job.status)} /></td>
                    <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">{job.quoted_amount != null ? fmt(job.quoted_amount) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionMenu align="right" items={[
                          { label: "Open in Work", icon: Eye, onClick: () => router.push(`/app/work?property=${propertyId}`) },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tasks */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[14px] font-bold text-slate-900">Tasks</p>
          <Link href={`/app/work?property=${propertyId}`} className="text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
            Open Work <ArrowUpRight size={12} />
          </Link>
        </div>
        {tasks.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <Clock size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">No tasks for this property</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Task", "Priority", "Due", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{task.title}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{task.priority}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{fmtDate(task.due_date)}</td>
                    <td className="px-4 py-3"><StatusPill status={task.status.charAt(0).toUpperCase() + task.status.slice(1)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   TAB: CONTACTS
───────────────────────────────────────────────────────────────────── */
function TabContacts({ contacts }: { contacts: import("@/types/database").Contact[] }) {
  const [search, setSearch] = useState("")
  const filtered = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company_name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/app/contacts/new" className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> Add Contact
          </Link>
          <Link href="/app/contacts" className="flex items-center gap-1.5 text-[13px] text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
            Open Contacts <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {contacts.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Users size={26} className="text-slate-300" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-600">No contacts yet</p>
            <p className="text-[12px] text-slate-500 mt-1">Add tenants, suppliers and owners in the Contacts section.</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Name", "Type", "Company", "Email", "Phone", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/app/contacts/${c.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: getAvatarColor(c.full_name) }}>
                          {c.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <span className="font-medium text-blue-600 group-hover:underline">{c.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{c.contact_type?.replace(/_/g, " ") ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.company_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email ? <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">{c.email}</a> : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone ? <a href={`tel:${c.phone}`} className="text-blue-600 hover:underline">{c.phone}</a> : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionMenu align="right" items={[
                          { label: "View contact", icon: Eye, onClick: () => { window.location.href = `/app/contacts/${c.id}` } },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "units", label: "Units" },
  { id: "tenancies", label: "Tenancies" },
  { id: "finances", label: "Finances" },
  { id: "compliance", label: "Compliance" },
  { id: "documents", label: "Documents" },
  { id: "contacts", label: "Contacts" },
  { id: "work", label: "Work" },
  { id: "activity", label: "Activity" },
  { id: "map", label: "Map" },
]

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string
  const { workspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState("overview")
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const { data: property, isLoading: propLoading } = useProperty(workspace?.id, propertyId)
  const { data: units = [], isLoading: unitsLoading } = useUnits(workspace?.id, propertyId)
  const { data: tenancies = [], isLoading: tenLoading } = useTenancies(workspace?.id, propertyId)
  const { data: jobs = [] } = useJobs(workspace?.id, { property_id: propertyId })
  const { data: tasks = [] } = useTasks(workspace?.id, { property_id: propertyId })
  const { data: contacts = [] } = useContacts(workspace?.id)
  const { items: complianceItems, loaded: complianceLoaded } = useComplianceItems(workspace?.id, propertyId)
  const updateProperty = useUpdateProperty()
  const deleteProperty = useDeleteProperty()

  // Live data only — no mock fallback. Empty arrays render honest empty states.
  const unitsList = units
  const tenanciesList = tenancies

  // Activity scoped to the property + its child units/tenancies
  const activityIds = React.useMemo(
    () => [propertyId, ...units.map((u) => u.id), ...tenancies.map((t) => t.id)],
    [propertyId, units, tenancies]
  )
  const { events: activityEvents, loaded: activityLoaded } = useActivityLog(workspace?.id, activityIds)

  // Initialise coverImageUrl from the property data once loaded
  const effectiveCoverUrl = coverImageUrl ?? property?.cover_image_url ?? null

  const isLoading = propLoading || unitsLoading || tenLoading

  async function save(field: string, value: any) {
    if (!workspace?.id) return
    await updateProperty.mutateAsync({ id: propertyId, workspaceId: workspace.id, payload: { [field]: value } })
  }

  async function handleCoverUpload(file: File) {
    if (!workspace?.id || !propertyId) return
    setUploadingCover(true)
    setCoverError(null)
    try {
      // 1. Server-proxied upload to R2 → authed view URL
      const { url: publicUrl } = await uploadFile(file, workspace.id, "property-covers")

      // 2. Persist the cover URL — surface a real error rather than silently
      //    "uploading forever" if the write is rejected.
      const supabase = createClient()
      const { error } = await supabase
        .from("properties")
        .update({ cover_image_url: publicUrl })
        .eq("id", propertyId)
        .eq("workspace_id", workspace.id)
      if (error) throw new Error(error.message)

      // 3. Optimistic update
      setCoverImageUrl(publicUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cover upload failed"
      console.error("Cover upload failed:", err)
      setCoverError(msg)
    } finally {
      setUploadingCover(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-blue-600 animate-spin" />
          <p className="text-[13px] text-slate-500">Loading property…</p>
        </div>
      </div>
    )
  }

  // Honest not-found state — never render fabricated demo data.
  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Building2 size={28} className="text-slate-300" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-700">Property not found</p>
            <p className="text-[13px] text-slate-500 mt-1">This property doesn’t exist or you don’t have access to it.</p>
          </div>
          <Link href="/app/portfolio/properties" className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
            <ChevronLeft size={14} /> Back to Properties
          </Link>
        </div>
      </div>
    )
  }

  const prop = property

  return (
    <div className="min-h-screen bg-slate-50/40">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-3">
          <Link href="/app/portfolio" className="hover:text-slate-700 transition-colors">Portfolio</Link>
          <ChevronRight size={12} className="text-slate-300" />
          <Link href="/app/portfolio/properties" className="hover:text-slate-700 transition-colors">Properties</Link>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-slate-800 font-medium">{prop.name}</span>
        </div>

        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Property name */}
            <div className="flex items-center gap-2.5 group mb-1">
              <button
                onClick={() => router.back()}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors mr-1"
              >
                <ChevronLeft size={18} className="text-slate-500" />
              </button>
              <InlineEditField
                value={prop.name}
                onSave={(v) => save("name", v)}
                displayClassName="text-[22px] font-bold text-slate-900 leading-tight"
              />
              <InlineEditField
                value={prop.status ?? "active"}
                onSave={(v) => save("status", v)}
                type="select"
                options={[
                  { value: "active", label: "Active" },
                  { value: "vacant", label: "Void" },
                  { value: "under_works", label: "Off Market" },
                  { value: "archived", label: "Archived" },
                ]}
                displayClassName="hidden"
              />
              <StatusPill status={prop.status} />
            </div>

            {/* Address + ID */}
            <div className="flex items-center gap-3 ml-10 flex-wrap">
              <div className="flex items-center gap-1.5 text-[13px] text-slate-500 flex-wrap">
                <MapPin size={13} className="text-slate-400" />
                <InlineEditField
                  value={prop.address_line1 ?? ""}
                  onSave={(v) => save("address_line1", v)}
                  placeholder="Add address"
                  displayClassName="text-[13px] text-slate-500"
                />
                {prop.city && <span className="text-slate-400">,</span>}
                <InlineEditField
                  value={prop.city ?? ""}
                  onSave={(v) => save("city", v)}
                  placeholder="City"
                  displayClassName="text-[13px] text-slate-500"
                />
                <InlineEditField
                  value={prop.postcode ?? ""}
                  onSave={(v) => save("postcode", v)}
                  placeholder="Postcode"
                  displayClassName="text-[13px] text-slate-500"
                />
              </div>
              <span className="text-slate-300">·</span>
              <span className="text-[12px] text-slate-500 font-mono">{prop.id}</span>
            </div>

            {/* Tags — derived from the real property record (operation + dwelling). */}
            <div className="flex items-center gap-2 ml-10 mt-2">
              {prop.operation_profile && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize">
                  <Building2 size={9} /> {String(prop.operation_profile).replace(/_/g, " ")}
                </span>
              )}
              {prop.category && (
                <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  <Home size={9} /> {getPropertyTypeOption(prop.category)?.label ?? prop.category}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap ml-10 md:ml-0">
            <ConfirmDialog
              title="Delete this property?"
              description="This will permanently delete the property and all linked data. This cannot be undone."
              confirmLabel="Delete property"
              onConfirm={async () => {
                await deleteProperty.mutateAsync({ id: propertyId, workspaceId: workspace!.id })
                router.push("/app/portfolio/properties")
              }}
            >
              {(openDelete) => (
                <ActionMenu
                  items={[
                    { label: "View work", icon: Wrench, onClick: () => router.push(`/app/work?property=${propertyId}`) },
                    { label: "View compliance", icon: Shield, onClick: () => router.push(`/app/compliance?property=${propertyId}`) },
                    { label: "View on map", icon: MapPin, onClick: () => router.push(`/app/portfolio/map?property=${propertyId}`) },
                    { label: "Archive property", icon: Archive, onClick: () => save("status", "archived") },
                    { label: "Delete property", icon: Trash2, variant: "danger", onClick: openDelete },
                  ]}
                />
              )}
            </ConfirmDialog>

            {/* AI Portfolio Review — opens the live Copilot seeded with this property's context */}
            <button
              onClick={() =>
                openCopilot({
                  prompt: `Review this property and flag risks, voids, compliance gaps and rent/cashflow concerns: "${prop.name}"${prop.address_line1 ? ` (${prop.address_line1})` : ""}.`,
                })
              }
              className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-700 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors"
            >
              <Sparkles size={13} /> AI Portfolio Review
            </button>
            {/* New tenancy */}
            <Link href={`/app/portfolio/tenancies/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors">
              <Users size={13} /> New Tenancy
            </Link>
            {/* Add unit */}
            <Link href={`/app/portfolio/units/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
              <Plus size={13} /> Add Unit
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tabs + content ──────────────────────────────────────────── */}
      <div className="px-6 pb-8">
        {/* Tab bar — desktop strip (md+) */}
        <div className="hidden md:flex items-center gap-0 border-b border-slate-200 mb-5 bg-white -mx-6 px-6 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-[13px] font-medium px-4 py-3.5 border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile — same tab state, scrollable segmented pills */}
        <div className="md:hidden mb-4">
          <MobileTabs
            tabs={TABS}
            value={activeTab}
            onChange={setActiveTab}
            aria-label="Property sections"
          />
        </div>

        {/* Tab content */}
        <div className="mt-1">
          {activeTab === "overview" && (
            <TabOverview
              prop={prop}
              unitsList={unitsList}
              tenanciesList={tenanciesList}
              complianceItems={complianceItems}
              complianceLoaded={complianceLoaded}
              activity={activityEvents}
              activityLoaded={activityLoaded}
              jobs={jobs}
              tasks={tasks}
              coverImageUrl={effectiveCoverUrl}
              onCoverUpload={handleCoverUpload}
              uploadingCover={uploadingCover}
              coverError={coverError}
              coverInputRef={coverInputRef}
              onSave={save}
              onGoTab={setActiveTab}
            />
          )}
          {activeTab === "units" && (
            <TabUnits unitsList={unitsList} propertyId={propertyId} />
          )}
          {activeTab === "tenancies" && (
            <TabTenancies propertyId={propertyId} tenanciesList={tenanciesList} unitsList={unitsList} />
          )}
          {activeTab === "finances" && (
            <TabFinances tenanciesList={tenanciesList} unitsList={unitsList} prop={prop} />
          )}
          {activeTab === "compliance" && (
            <TabCompliance items={complianceItems} loaded={complianceLoaded} propertyId={propertyId} />
          )}
          {activeTab === "documents" && (
            <TabDocuments />
          )}
          {activeTab === "contacts" && (
            <TabContacts contacts={contacts} />
          )}
          {activeTab === "activity" && (
            <TabActivity events={activityEvents} loaded={activityLoaded} />
          )}
          {activeTab === "work" && (
            <TabWork jobs={jobs} tasks={tasks} propertyId={propertyId} />
          )}
          {activeTab === "map" && (
            <Card className="p-3 sm:p-4">
              <LocationMap
                height={560}
                zoom={16}
                title={prop.name}
                caption={[prop.address_line1, prop.city, prop.postcode].filter(Boolean).join(", ") || undefined}
                markers={[
                  {
                    id: prop.id,
                    lat: prop.latitude,
                    lng: prop.longitude,
                    address: [prop.address_line1, prop.address_line2, prop.city, prop.postcode]
                      .filter(Boolean)
                      .join(", ") || null,
                    label: prop.name,
                    sublabel: [prop.city, prop.postcode].filter(Boolean).join(" ") || undefined,
                    href: `/app/portfolio/properties/${prop.id}`,
                  },
                ]}
              />
              {(prop.address_line1 || (Number.isFinite(prop.latitude) && Number.isFinite(prop.longitude))) && (
                <div className="flex items-center justify-end px-1 pt-3">
                  <a
                    href={
                      Number.isFinite(prop.latitude) && Number.isFinite(prop.longitude)
                        ? `https://www.openstreetmap.org/?mlat=${prop.latitude}&mlon=${prop.longitude}#map=17/${prop.latitude}/${prop.longitude}`
                        : `https://www.openstreetmap.org/search?query=${encodeURIComponent([prop.address_line1, prop.city, prop.postcode].filter(Boolean).join(", "))}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <MapPin size={14} /> Open in OpenStreetMap
                  </a>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

    </div>
  )
}
