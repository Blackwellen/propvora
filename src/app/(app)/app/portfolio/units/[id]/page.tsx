"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/useUnits"
import { useTenancies, type Tenancy } from "@/hooks/useTenancies"
import { useContacts } from "@/hooks/useContacts"
import { useJobs } from "@/hooks/useJobs"
import { useTasks } from "@/hooks/useTasks"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import type { Contact } from "@/types/database"
import {
  Building2, Home, Users, PoundSterling, TrendingUp, AlertTriangle,
  Wrench, Calendar, FileText, Activity, ChevronRight, ChevronLeft,
  Plus, Download, Upload, Edit2, Check, X, MoreHorizontal, MapPin,
  Shield, CheckCircle2, Clock, Eye, Sparkles, Search, ArrowUpRight,
  ArrowDownRight, Wifi, Zap, Droplets, Package, Star, RefreshCw,
  Phone, Mail, User, Trash2, Archive,
} from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

/* ------------------------------------------------------------------ */
/* Mock Data                                                            */
/* ------------------------------------------------------------------ */
const MOCK_UNIT = {
  id: "u2",
  property_id: "p1",
  unit_name: "Room 2",
  unit_type: "Standard Room",
  floor: 0,
  bedrooms: 1,
  bathrooms: 1,
  floor_area_sqm: 14,
  target_rent: 475,
  status: "occupied",
  unit_ref: "BRUN-R2",
  max_occupancy: 1,
  furnished: true,
}

// Chart data types
interface IncomeChartPoint { month: string; income: number; expenses: number }
interface RentChartPoint { month: string; rent: number }

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "tenancy", label: "Tenancy" },
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "Timeline" },
  { id: "activity", label: "Activity" },
  { id: "finance", label: "Finance" },
  { id: "specifications", label: "Specifications" },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function avatarInitials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

interface ComplianceItemRow {
  id: string
  title: string | null
  type: string | null
  due_date: string | null
  status: string | null
}

/** Live compliance_items for a unit, 42P01-safe. */
function useUnitComplianceItems(workspaceId: string | undefined, unitId: string) {
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
          .select("id, title, type, due_date, status")
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

interface ActivityRow {
  id: string
  action: string | null
  entity_type: string | null
  entity_id: string | null
  description: string | null
  created_at: string
}

/** Live activity_log for a set of entity ids, 42P01-safe. */
function useActivityLog(workspaceId: string | undefined, entityIds: string[]) {
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
          .from("activity_log")
          .select("id, action, entity_type, entity_id, description, created_at")
          .eq("workspace_id", workspaceId)
          .in("entity_id", ids)
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

function StatusPill({ label, color }: { label: string; color: "emerald" | "amber" | "red" | "blue" | "violet" | "slate" }) {
  const cls = {
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    violet: "bg-violet-50 text-violet-700 border border-violet-200",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", cls[color])}>
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-emerald-500": color === "emerald",
        "bg-amber-500": color === "amber",
        "bg-red-500": color === "red",
        "bg-blue-500": color === "blue",
        "bg-violet-500": color === "violet",
        "bg-slate-400": color === "slate",
      })} />
      {label}
    </span>
  )
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string; icon?: React.ElementType; accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-300" />}
      </div>
      <div className={cn("text-xl font-bold tabular-nums", accent ?? "text-slate-900")}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  )
}

function EditPen({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 p-0.5 rounded hover:bg-slate-100"
    >
      <Edit2 className="w-3 h-3 text-slate-400" />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Overview (2A)                                                   */
/* ------------------------------------------------------------------ */
function TabOverview({ unit, tenancy, tenant, onSave }: {
  unit: typeof MOCK_UNIT
  tenancy: Tenancy | null
  tenant: Contact | null
  onSave: (field: string, value: any) => Promise<void>
}) {
  const isOccupied = unit.status === "occupied"
  const rent = tenancy?.rent_amount ?? unit.target_rent ?? null
  const deposit = tenancy?.deposit_amount ?? null
  return (
    <div className="grid grid-cols-5 gap-5">
      {/* LEFT ~60% */}
      <div className="col-span-3 space-y-4">
        {/* Photo placeholder — replace with real uploads from Documents tab */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative h-[260px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)" }}>
            <div className="flex flex-col items-center gap-3 opacity-30">
              <Home size={52} className="text-white" />
            </div>
            <button className="absolute top-3 right-3 bg-white/90 hover:bg-white text-[12px] font-semibold text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all">
              <Upload size={12} />
              Add Photos
            </button>
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-white/70 text-[11px]">No photos uploaded yet</span>
            </div>
          </div>
          <div className="flex gap-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                className="w-[60px] h-[48px] rounded-lg overflow-hidden border-2 border-transparent flex-shrink-0 bg-slate-100 flex items-center justify-center"
              >
                <Home size={14} className="text-slate-300" />
              </button>
            ))}
            <div className="w-[60px] h-[48px] rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-500 flex-shrink-0">
              +
            </div>
          </div>
        </div>

        {/* Unit Name & Location */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <InlineEditField
                value={unit.unit_name}
                onSave={(v) => onSave("unit_name", v)}
                displayClassName="text-xl font-bold text-slate-900"
              />
              <InlineEditField
                value={unit.status}
                onSave={(v) => onSave("status", v)}
                type="select"
                options={[
                  { value: "occupied", label: "Occupied" },
                  { value: "vacant", label: "Vacant" },
                  { value: "under_works", label: "Under Works" },
                  { value: "reserved", label: "Reserved" },
                ]}
                displayClassName="hidden"
              />
              {unit.status === "occupied" && <StatusPill label="Occupied" color="emerald" />}
              {unit.status === "vacant" && <StatusPill label="Vacant" color="amber" />}
              {unit.status === "reserved" && <StatusPill label="Reserved" color="blue" />}
              {unit.status === "under_works" && <StatusPill label="Under Works" color="slate" />}
            </div>
          </div>

          {/* Spec Row */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-3 pt-2 border-t border-slate-100">
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Unit Type</div>
              <InlineEditField
                value={unit.unit_type ?? ""}
                onSave={(v) => onSave("unit_type", v)}
                type="select"
                options={[
                  { value: "Room", label: "Room" },
                  { value: "flat", label: "Flat" },
                  { value: "studio", label: "Studio" },
                  { value: "suite", label: "Suite" },
                  { value: "apartment", label: "Apartment" },
                  { value: "other", label: "Other" },
                ]}
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Floor</div>
              <InlineEditField
                value={unit.floor ?? ""}
                onSave={(v) => onSave("floor", v ? Number(v) : null)}
                type="number"
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Bedrooms</div>
              <InlineEditField
                value={unit.bedrooms ?? ""}
                onSave={(v) => onSave("bedrooms", v ? Number(v) : null)}
                type="number"
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Floor Area (m²)</div>
              <InlineEditField
                value={unit.floor_area_sqm ?? ""}
                onSave={(v) => onSave("floor_area_sqm", v ? Number(v) : null)}
                type="number"
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Target Rent (£)</div>
              <InlineEditField
                value={unit.target_rent ?? ""}
                onSave={(v) => onSave("target_rent", v ? Number(v) : null)}
                type="number"
                prefix="£"
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Room features */}
          <div className="flex items-center gap-3 pt-1">
            {[
              { icon: Home, label: unit.unit_type ?? "Unit" },
              { icon: Package, label: `${unit.bathrooms ?? 0} bath` },
              { icon: Zap, label: `Floor ${unit.floor ?? "—"}` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                <Icon className="w-3 h-3 text-blue-500" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions — wired to real routes */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/app/portfolio/tenancies/new?unitId=${unit.id}`} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">
            New Tenancy
          </Link>
          <Link href={`/app/work/jobs/new?unitId=${unit.id}`} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">
            Raise Job
          </Link>
          {unit.property_id && (
            <Link href={`/app/portfolio/properties/${unit.property_id}`} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">
              View Property
            </Link>
          )}
          <Link href={`/app/compliance?unit=${unit.id}`} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1">
            Compliance <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* RIGHT ~40% */}
      <div className="col-span-2 space-y-4">
        {/* KPI Cards — live */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Occupancy" value={isOccupied ? "Occupied" : "Vacant"} sub={isOccupied ? "Tenanted" : "Available"} icon={Users} accent={isOccupied ? "text-emerald-600" : "text-amber-600"} />
          <KpiCard label="Monthly Rent" value={rent != null ? fmtGBP(rent) : "—"} sub={tenancy ? "From tenancy" : "Target"} icon={PoundSterling} />
          <KpiCard label="Deposit" value={deposit != null ? fmtGBP(deposit) : "—"} sub={tenancy?.deposit_scheme ?? "—"} icon={Shield} accent={deposit != null ? "text-emerald-600" : undefined} />
          <KpiCard label="Lease Ends" value={tenancy?.end_date ? fmtDate(tenancy.end_date) : "—"} sub={tenancy ? "Current tenancy" : "No tenancy"} icon={Calendar} />
          <KpiCard label="Floor Area" value={unit.floor_area_sqm != null ? `${unit.floor_area_sqm} m²` : "—"} sub="Net" icon={Home} />
          <KpiCard label="Bedrooms" value={unit.bedrooms != null ? String(unit.bedrooms) : "—"} sub="In unit" icon={Star} />
        </div>

        {/* Current Tenant — live */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Current Tenant</div>
          {tenancy && tenant ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {avatarInitials(tenant.full_name)}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900">{tenant.full_name}</div>
                  <div className="text-[11px] text-slate-500">Since {fmtDate(tenancy.start_date)}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-[12px] text-slate-600 mb-3">
                {tenant.phone && <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 hover:text-blue-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {tenant.phone}</a>}
                {tenant.email && <a href={`mailto:${tenant.email}`} className="flex items-center gap-2 hover:text-blue-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> {tenant.email}</a>}
              </div>
              <Link href={`/app/portfolio/tenancies/${tenancy.id}`} className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
                View tenancy details <ChevronRight className="w-3 h-3" />
              </Link>
            </>
          ) : tenancy ? (
            <>
              <p className="text-[12px] text-slate-500 mb-3">A tenancy is linked but no tenant contact is recorded.</p>
              <Link href={`/app/portfolio/tenancies/${tenancy.id}`} className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
                View tenancy details <ChevronRight className="w-3 h-3" />
              </Link>
            </>
          ) : (
            <div className="text-center py-2">
              <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-[12px] text-slate-500 mb-2">No active tenancy</p>
              <Link href={`/app/portfolio/tenancies/new?unitId=${unit.id}`} className="text-[12px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
                <Plus className="w-3 h-3" /> Create tenancy
              </Link>
            </div>
          )}
        </div>

        {/* Income Summary — live */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Income Summary</div>
            <Link href="/app/money" className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-0.5">
              Money <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Monthly Rent</span>
              <span className="tabular-nums font-medium text-slate-800">{rent != null ? fmtGBP(rent) : "—"}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Deposit Held</span>
              <span className="tabular-nums font-medium text-slate-800">{deposit != null ? fmtGBP(deposit) : "—"}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between text-[13px] font-bold">
              <span className="text-slate-700">Annualised Rent</span>
              <span className="tabular-nums text-emerald-600">{rent != null ? fmtGBP(rent * 12) : "—"}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Detailed transactions live in the Money section.</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Tenancy (2B)                                                    */
/* ------------------------------------------------------------------ */
function TabTenancy({ unitId, tenancy, tenant }: { unitId: string; tenancy: Tenancy | null; tenant: Contact | null }) {
  if (!tenancy) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Users className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">No tenancy for this unit</p>
          <p className="text-[12px] text-slate-400 mt-1">Create a tenancy to track the tenant, rent and deposit.</p>
        </div>
        <Link href={`/app/portfolio/tenancies/new?unitId=${unitId}`} className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-blue-600 rounded-xl px-4 py-2 hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> New Tenancy
        </Link>
      </div>
    )
  }
  const statusColor: "emerald" | "amber" | "slate" | "red" =
    tenancy.status === "active" ? "emerald" : tenancy.status === "pending" ? "amber" : tenancy.status === "disputed" ? "red" : "slate"
  return (
    <div className="grid grid-cols-5 gap-5">
      {/* LEFT */}
      <div className="col-span-3 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-slate-900">Tenancy Overview</h3>
            <Link href={`/app/portfolio/tenancies/${tenancy.id}`} className="flex items-center gap-1.5 text-[12px] text-blue-600 font-semibold hover:underline border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
              <ArrowUpRight className="w-3 h-3" /> Open
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Tenant</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">{tenant ? avatarInitials(tenant.full_name) : "—"}</div>
                <span className="text-[13px] font-semibold text-slate-800">{tenant?.full_name ?? "Unassigned"}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Tenancy Type</div>
              <div className="text-[13px] font-semibold text-slate-800 capitalize">{(tenancy.tenancy_type ?? "—").replace(/_/g, " ")}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Tenancy Start</div>
              <div className="text-[13px] font-semibold text-slate-800">{fmtDate(tenancy.start_date)}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Tenancy End</div>
              <div className="text-[13px] font-semibold text-slate-800">{tenancy.end_date ? fmtDate(tenancy.end_date) : "Periodic"}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Rent</div>
              <div className="text-[13px] font-semibold text-slate-800 tabular-nums">{fmtGBP(tenancy.rent_amount)}/{tenancy.rent_frequency === "monthly" ? "month" : tenancy.rent_frequency}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Reference</div>
              <div className="text-[13px] font-semibold text-slate-800">{tenancy.reference ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Status</div>
              <StatusPill label={tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)} color={statusColor} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[14px] font-bold text-slate-900 mb-4">Deposit</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Deposit Held</div>
              <div className="text-[16px] font-bold tabular-nums text-slate-900">{tenancy.deposit_amount != null ? fmtGBP(tenancy.deposit_amount) : "—"}</div>
              {tenancy.deposit_scheme && <div className="text-[10px] text-emerald-600 font-medium">Protected ({tenancy.deposit_scheme})</div>}
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Scheme</div>
              <div className="text-[13px] font-semibold text-slate-800">{tenancy.deposit_scheme ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Reference</div>
              <div className="text-[13px] font-semibold text-slate-800">{tenancy.deposit_reference ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-[13px] font-bold text-slate-900 mb-3">Contact</h3>
          {tenant ? (
            <div className="space-y-3">
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 hover:text-blue-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[12px] font-semibold text-slate-800">{tenant.phone}</div>
                    <div className="text-[10px] text-slate-400">Phone</div>
                  </div>
                </a>
              )}
              {tenant.email && (
                <a href={`mailto:${tenant.email}`} className="flex items-center gap-2 hover:text-blue-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[12px] font-semibold text-slate-800">{tenant.email}</div>
                    <div className="text-[10px] text-slate-400">Email</div>
                  </div>
                </a>
              )}
              {!tenant.phone && !tenant.email && <p className="text-[12px] text-slate-400">No contact details recorded.</p>}
            </div>
          ) : (
            <p className="text-[12px] text-slate-400">No tenant contact linked.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-[13px] font-bold text-slate-900 mb-3">Tenancy Actions</h3>
          <div className="space-y-2">
            <Link href={`/app/portfolio/tenancies/${tenancy.id}`} className="block text-left text-[12px] text-slate-700 font-medium px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              Manage tenancy
            </Link>
            <Link href={`/app/portfolio/tenancies/${tenancy.id}?tab=deposit`} className="block text-left text-[12px] text-slate-700 font-medium px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              Deposit & release
            </Link>
            <Link href={`/app/portfolio/tenancies/${tenancy.id}?tab=payments`} className="block text-left text-[12px] text-blue-600 font-semibold px-3 py-2 rounded-xl border border-blue-200 hover:bg-blue-50 flex items-center gap-1 transition-colors">
              View payments <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Documents (2C)                                                  */
/* ------------------------------------------------------------------ */
function TabDocuments({ unitId }: { unitId: string }) {
  const { workspace } = useWorkspace()
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">Unit Documents</h3>
        <EvidenceUpload
          workspaceId={workspace?.id}
          folder="unit-documents"
          table="property_documents"
          extra={{ unit_id: unitId }}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        />
        <p className="text-[11px] text-slate-400 mt-3">Photos, floorplans, certificates and reports for this unit. Files are stored securely.</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Timeline (2D)                                                   */
/* ------------------------------------------------------------------ */
function TabTimeline({ events, loaded }: { events: ActivityRow[]; loaded: boolean }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Activity className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">{loaded ? "No timeline events yet" : "Loading timeline…"}</p>
          <p className="text-[12px] text-slate-400 mt-1">Events for this unit and its tenancy will appear here.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="relative">
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-200" />
          <div className="space-y-0">
            {events.map((item) => (
              <div key={item.id} className="flex gap-4 pb-6 last:pb-0 relative">
                <div className="flex-shrink-0 w-10 flex items-start pt-0.5 justify-center relative z-10">
                  <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-blue-500" />
                </div>
                <div className="flex-1 min-w-0 pt-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[13px] font-bold text-slate-900">{item.action ?? "Activity"}</span>
                    {item.entity_type && (
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{item.entity_type}</span>
                    )}
                  </div>
                  {item.description && <div className="text-[12px] text-slate-500">{item.description}</div>}
                  <div className="text-[11px] text-slate-400 mt-0.5">{fmtDate(item.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Activity (2E)                                                   */
/* ------------------------------------------------------------------ */
function TabActivity({ events, loaded }: { events: ActivityRow[]; loaded: boolean }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Activity className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">{loaded ? "No activity yet" : "Loading activity…"}</p>
          <p className="text-[12px] text-slate-400 mt-1">Actions on this unit and its tenancy will appear here.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {events.map((a) => (
          <div key={a.id} className="flex gap-3 p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white bg-blue-500">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-slate-900">{a.action ?? "Activity"}</span>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-[11px] text-slate-400">{fmtDate(a.created_at)}</span>
              </div>
              {a.description && <div className="text-[12px] text-slate-500 mt-0.5">{a.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Finance & Performance (2F)                                      */
/* ------------------------------------------------------------------ */
function TabFinance({ incomeChart, tenancy, unit }: { incomeChart: IncomeChartPoint[]; tenancy: Tenancy | null; unit: typeof MOCK_UNIT }) {
  const rent = tenancy?.rent_amount ?? unit.target_rent ?? null
  const deposit = tenancy?.deposit_amount ?? null
  const hasIncomeData = incomeChart.length > 0
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">Rent derived from the active tenancy. Full transactions live in Money.</p>
        <Link href="/app/money" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-semibold hover:bg-blue-700 transition-colors shadow-sm">
          Open Money <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Strip — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Monthly Rent", value: rent != null ? fmtGBP(rent) : "—", sub: tenancy ? "Active tenancy" : "No tenancy" },
          { label: "Annualised", value: rent != null ? fmtGBP(rent * 12) : "—", sub: "Rent × 12" },
          { label: "Deposit Held", value: deposit != null ? fmtGBP(deposit) : "—", sub: tenancy?.deposit_scheme ?? "—" },
          { label: "Status", value: tenancy ? (tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)) : "Vacant", sub: "Tenancy" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{k.label}</div>
            <div className="text-[20px] font-bold tabular-nums text-slate-900 mt-1">{k.value}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Income trend — only if live data exists */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[13px] font-bold text-slate-900 mb-3">Income Trend</h3>
        {hasIncomeData ? (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Line type="monotone" dataKey="income" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-[13px] font-semibold text-slate-500">No income recorded yet</p>
            <p className="text-[12px] text-slate-400 mt-1">Logged payments will chart here. Track income in the Money section.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab: Specifications & Services (2G)                                  */
/* ------------------------------------------------------------------ */
function TabSpecifications({ unit, complianceItems, complianceLoaded, onSave }: {
  unit: typeof MOCK_UNIT
  complianceItems: ComplianceItemRow[]
  complianceLoaded: boolean
  onSave: (field: string, value: any) => Promise<void>
}) {
  const specs: { label: string; field: string; type?: "number" | "select"; options?: { value: string; label: string }[]; prefix?: string }[] = [
    { label: "Unit Type", field: "unit_type", type: "select", options: [
      { value: "Room", label: "Room" }, { value: "flat", label: "Flat" }, { value: "studio", label: "Studio" },
      { value: "suite", label: "Suite" }, { value: "apartment", label: "Apartment" }, { value: "other", label: "Other" },
    ] },
    { label: "Floor", field: "floor", type: "number" },
    { label: "Bedrooms", field: "bedrooms", type: "number" },
    { label: "Bathrooms", field: "bathrooms", type: "number" },
    { label: "Floor Area (m²)", field: "floor_area_sqm", type: "number" },
    { label: "Target Rent", field: "target_rent", type: "number", prefix: "£" },
    { label: "Status", field: "status", type: "select", options: [
      { value: "occupied", label: "Occupied" }, { value: "vacant", label: "Vacant" },
      { value: "under_works", label: "Under Works" }, { value: "reserved", label: "Reserved" },
    ] },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Specifications — live, inline-editable */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-4 h-4 text-blue-500" />
          <span className="text-[13px] font-bold text-slate-900">Specifications</span>
        </div>
        <div className="space-y-2.5">
          {specs.map((s) => (
            <div key={s.field} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
              <span className="text-[12px] text-slate-500">{s.label}</span>
              <InlineEditField
                value={(unit as any)[s.field] ?? ""}
                onSave={(v) => onSave(s.field, s.type === "number" ? (v ? Number(v) : null) : v)}
                type={s.type}
                options={s.options}
                prefix={s.prefix}
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Certificates & Compliance — live from compliance_items */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-[13px] font-bold text-slate-900">Certificates & Compliance</span>
          </div>
          <Link href={`/app/compliance?unit=${unit.id}`} className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-0.5">
            Open <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {complianceItems.length === 0 ? (
          <div className="py-8 text-center">
            <Shield className="w-7 h-7 text-slate-200 mx-auto mb-2" />
            <p className="text-[12px] text-slate-500">{complianceLoaded ? "No compliance items tracked for this unit" : "Loading…"}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {complianceItems.map((c) => {
              const overdue = c.due_date ? new Date(c.due_date).getTime() < Date.now() : false
              return (
                <div key={c.id} className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-600">{c.title ?? c.type ?? "Item"}</span>
                  <span className={cn("text-[12px] font-semibold", overdue ? "text-red-600" : "text-slate-800")}>{c.due_date ? `Due ${fmtDate(c.due_date)}` : (c.status ?? "—")}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main Page                                                            */
/* ------------------------------------------------------------------ */
export default function UnitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.id as string
  const { workspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState("overview")

  const { data: unit, isLoading } = useUnit(workspace?.id, unitId)
  const { data: tenancies = [] } = useTenancies(workspace?.id)
  const { data: contacts = [] } = useContacts(workspace?.id)
  const { items: complianceItems, loaded: complianceLoaded } = useUnitComplianceItems(workspace?.id, unitId)
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()

  // The unit's current tenancy: prefer active, else most recent
  const unitTenancies = tenancies.filter((t) => t.unit_id === unitId)
  const tenancy = unitTenancies.find((t) => t.status === "active") ?? unitTenancies[0] ?? null
  const tenant = tenancy?.tenant_contact_id
    ? contacts.find((c) => c.id === tenancy.tenant_contact_id) ?? null
    : null

  // Activity scoped to the unit + its tenancy
  const activityIds = [unitId, ...(tenancy ? [tenancy.id] : [])]
  const { events: activityEvents, loaded: activityLoaded } = useActivityLog(workspace?.id, activityIds)

  async function save(field: string, value: any) {
    if (!workspace?.id || !unit) return
    await updateUnit.mutateAsync({ id: unitId, workspaceId: workspace.id, payload: { [field]: value } })
  }

  // Live chart data
  const [incomeChart, setIncomeChart] = useState<IncomeChartPoint[]>([])
  const [rentChart, setRentChart] = useState<RentChartPoint[]>([])

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient();
    (async () => {
      try {
        // Try money_income filtered by unit_id first, then property_id
        const { data: incomeData, error: incomeErr } = await supabase
          .from("money_income")
          .select("amount, expected_date, income_type")
          .eq("workspace_id", workspace.id)
          .order("expected_date", { ascending: true })
        if (!incomeErr && incomeData && incomeData.length > 0) {
          // Group by month
          const byMonth: Record<string, { income: number; expenses: number }> = {}
          for (const row of incomeData as Array<{ amount: number; expected_date: string; income_type: string }>) {
            const d = new Date(row.expected_date)
            const key = d.toLocaleString("en-GB", { month: "short" })
            if (!byMonth[key]) byMonth[key] = { income: 0, expenses: 0 }
            byMonth[key].income += row.amount
          }
          setIncomeChart(Object.entries(byMonth).slice(-6).map(([month, v]) => ({ month, income: v.income, expenses: v.expenses })))
          setRentChart(Object.entries(byMonth).slice(-6).map(([month, v]) => ({ month, rent: v.income })))
        }
      } catch { /* table may not exist — leave empty arrays */ }
    })()
  }, [workspace?.id, unitId])

  // Use mock when no real data
  const displayUnit = unit ?? MOCK_UNIT

  const tabContent: Record<string, React.ReactNode> = {
    overview: <TabOverview unit={displayUnit as any} tenancy={tenancy} tenant={tenant} onSave={save} />,
    tenancy: <TabTenancy unitId={unitId} tenancy={tenancy} tenant={tenant} />,
    documents: <TabDocuments unitId={unitId} />,
    timeline: <TabTimeline events={activityEvents} loaded={activityLoaded} />,
    activity: <TabActivity events={activityEvents} loaded={activityLoaded} />,
    finance: <TabFinance incomeChart={incomeChart} tenancy={tenancy} unit={displayUnit as any} />,
    specifications: <TabSpecifications unit={displayUnit as any} complianceItems={complianceItems} complianceLoaded={complianceLoaded} onSave={save} />,
  }

  return (
    <div className="min-h-screen bg-slate-50/40">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <Link href="/app/portfolio" className="hover:text-blue-600 font-medium">Portfolio</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/app/portfolio/properties" className="hover:text-blue-600 font-medium">Properties</Link>
            {displayUnit.property_id && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <Link href={`/app/portfolio/properties/${displayUnit.property_id}`} className="hover:text-blue-600 font-medium">Property</Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-800 font-semibold">{displayUnit.unit_name}</span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <Link href={`/app/portfolio/tenancies/new?unitId=${unitId}`} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" /> New Tenancy
            </Link>
            <button
              onClick={() => setActiveTab("activity")}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              title="View activity"
            >
              <Activity className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Entity Hero Row */}
        <div className="flex items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <InlineEditField
                value={displayUnit.unit_name}
                onSave={(v) => save("unit_name", v)}
                displayClassName="text-[20px] font-bold text-slate-900"
              />
              {displayUnit.status === "occupied" && <StatusPill label="Occupied" color="emerald" />}
              {displayUnit.status === "vacant" && <StatusPill label="Vacant" color="amber" />}
              {displayUnit.status === "reserved" && <StatusPill label="Reserved" color="blue" />}
              {displayUnit.status === "under_works" && <StatusPill label="Under Works" color="slate" />}
            </div>
            <div className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3" />
              {displayUnit.unit_type ?? "Unit"}{displayUnit.property_id ? (
                <Link href={`/app/portfolio/properties/${displayUnit.property_id}`} className="text-blue-600 hover:underline ml-1">
                  · View Property
                </Link>
              ) : ""}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ConfirmDialog
              title="Delete this unit?"
              description="This will permanently delete the unit and all linked data. This cannot be undone."
              confirmLabel="Delete unit"
              onConfirm={async () => {
                const u = unit ?? MOCK_UNIT
                await deleteUnit.mutateAsync({ id: unitId, workspaceId: workspace!.id, propertyId: u.property_id })
                router.push("/app/portfolio/units")
              }}
            >
              {(openDelete) => (
                <ActionMenu
                  items={[
                    { label: "View parent property", icon: Building2, onClick: () => router.push(`/app/portfolio/properties/${(unit ?? MOCK_UNIT).property_id}`) },
                    { label: "Create tenancy", icon: Users, onClick: () => router.push(`/app/portfolio/tenancies/new?unitId=${unitId}`) },
                    { label: "View work", icon: Wrench, onClick: () => router.push(`/app/work?unitId=${unitId}`) },
                    { label: "Archive unit", icon: Archive, onClick: () => save("status", "reserved") },
                    { label: "Delete unit", icon: Trash2, variant: "danger", onClick: openDelete },
                  ]}
                />
              )}
            </ConfirmDialog>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-0 border-b border-slate-200 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  )
}
