"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  Download,
  Plus,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Eye,
  Pencil,
  Wrench,
  Trash2,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { cn } from "@/lib/utils"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { PpmTabNav } from "@/components/work/PpmTabNav"
import { MobileTopBar } from "@/components/mobile"
import { PpmScheduleStatusBadge } from "@/features/work/ppm/components/PpmScheduleStatusBadge"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import {
  usePpmPlans,
  useDeletePpmPlan,
  useGenerateJobFromPpm,
  type PpmPlan,
} from "@/hooks/usePpm"

// ─── KPI data ─────────────────────────────────────────────────────────────────

const KPIS = [
  {
    icon: CalendarClock,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    value: 34,
    label: "Active Schedules",
    sub: "Across all properties",
    valueColor: "text-slate-900",
  },
  {
    icon: CalendarDays,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    value: 8,
    label: "Due This Month",
    sub: "June 2026",
    valueColor: "text-amber-700",
  },
  {
    icon: AlertCircle,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    value: 2,
    label: "Overdue",
    sub: "Require immediate attention",
    valueColor: "text-red-700",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    value: 14,
    label: "Due Next 30 Days",
    sub: "Jul 1–30, 2026",
    valueColor: "text-slate-900",
  },
  {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    value: 67,
    label: "Completed This Year",
    sub: "Jan–Jun 2026",
    valueColor: "text-emerald-700",
  },
]

// ─── Upcoming due ─────────────────────────────────────────────────────────────

interface UpcomingRow {
  id: string | null
  icon: string
  serviceType: string
  property: string
  dueDate: string
  dueDaysLabel: string
  priority: "high" | "medium" | "low"
  supplier: string
  estCost: string
  status: "scheduled" | "due-soon" | "overdue" | "completed"
  filterStatus: "due-soon" | "overdue" | "scheduled" | "completed"
}

const UPCOMING_DUE: UpcomingRow[] = [
  { id: null, icon: "🔥", serviceType: "Boiler Annual Service", property: "7 Oak Ave", dueDate: "12 Jun 2026", dueDaysLabel: "in 5 days", priority: "high", supplier: "HeatPro Ltd", estCost: "£850", status: "due-soon", filterStatus: "due-soon" },
  { id: null, icon: "⚡", serviceType: "EICR Inspection", property: "22 Mill Lane", dueDate: "14 Jun 2026", dueDaysLabel: "in 7 days", priority: "high", supplier: "ElecSure Ltd", estCost: "£620", status: "due-soon", filterStatus: "due-soon" },
  { id: null, icon: "🛡", serviceType: "Gas Safety Certificate", property: "14 Park Rd", dueDate: "18 Jun 2026", dueDaysLabel: "in 11 days", priority: "medium", supplier: "British Gas Homecare", estCost: "£120", status: "scheduled", filterStatus: "scheduled" },
  { id: null, icon: "💧", serviceType: "Legionella Risk Assessment", property: "3 River View", dueDate: "24 Jun 2026", dueDaysLabel: "in 17 days", priority: "medium", supplier: "AquaSafe Ltd", estCost: "£300", status: "scheduled", filterStatus: "scheduled" },
  { id: null, icon: "🔴", serviceType: "Fire Alarm Test", property: "Beech House", dueDate: "26 Jun 2026", dueDaysLabel: "in 19 days", priority: "medium", supplier: "FireSafe Services", estCost: "£180", status: "scheduled", filterStatus: "scheduled" },
  { id: null, icon: "❄", serviceType: "HVAC Maintenance", property: "41 Station Rd", dueDate: "29 Jun 2026", dueDaysLabel: "in 22 days", priority: "low", supplier: "ClimaCare Ltd", estCost: "£250", status: "scheduled", filterStatus: "scheduled" },
]

// ─── Overdue actions ──────────────────────────────────────────────────────────

const OVERDUE_ACTIONS = [
  {
    icon: "🔥",
    serviceType: "Boiler Annual Service",
    property: "Beech House",
    ref: "FIRE-0021",
    dueDate: "02 Jun 2026",
    daysOverdue: 8,
    supplier: "FireSafe Services",
    estCost: "£850",
  },
  {
    icon: "⚡",
    serviceType: "EICR Inspection",
    property: "Elm Court",
    ref: "ELEC-0153",
    dueDate: "05 Jun 2026",
    daysOverdue: 5,
    supplier: "ElecSure Ltd",
    estCost: "£620",
  },
]

// ─── Compliance health donut ──────────────────────────────────────────────────

const COMPLIANCE_DATA = [
  { name: "Compliant",       value: 158, pct: 86, fill: "#10B981" },
  { name: "At Risk",         value: 18,  pct: 10, fill: "#F59E0B" },
  { name: "Non-Compliant",   value: 7,   pct: 4,  fill: "#EF4444" },
]

// ─── Top service types ────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { name: "Gas Safety Certificate", count: 28, color: "#F97316" },
  { name: "Boiler Service",         count: 21, color: "#3B82F6" },
  { name: "EICR Inspection",        count: 18, color: "#EAB308" },
  { name: "Fire Alarm Test",        count: 15, color: "#EF4444" },
  { name: "Legionella Assessment",  count: 11, color: "#14B8A6" },
]

const MAX_COUNT = 28

// ─── Priority badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  if (priority === "high")
    return <span className="text-[11px] font-semibold text-amber-700">↑ High</span>
  if (priority === "medium")
    return <span className="text-[11px] font-semibold text-slate-500">⬧ Medium</span>
  return <span className="text-[11px] font-semibold text-slate-400">+ Low</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function badgeStatus(s: string): "scheduled" | "due-soon" | "overdue" | "completed" {
  if (s === "due_soon" || s === "due-soon") return "due-soon"
  if (s === "overdue") return "overdue"
  if (s === "completed") return "completed"
  return "scheduled"
}

function planToUpcoming(p: PpmPlan): UpcomingRow {
  const dueDays = (() => {
    if (!p.next_due_date) return "—"
    const diff = Math.ceil((new Date(p.next_due_date).getTime() - Date.now()) / 86_400_000)
    return diff < 0 ? `${Math.abs(diff)} days overdue` : `in ${diff} days`
  })()
  return {
    id: p.id,
    icon: "🔧",
    serviceType: p.name,
    property: p.property_id ? "Linked Property" : "—",
    dueDate: p.next_due_date ? new Date(p.next_due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
    dueDaysLabel: dueDays,
    priority: (p.priority === "high" || p.priority === "low" ? p.priority : "medium") as "high" | "medium" | "low",
    supplier: p.supplier_name ?? "—",
    estCost: p.estimated_cost ? `£${Number(p.estimated_cost).toLocaleString()}` : "—",
    status: badgeStatus(p.status),
    filterStatus: badgeStatus(p.status),
  }
}

export default function PpmOverviewPage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { data: livePlans, isLoading } = usePpmPlans(workspaceId)
  const deletePlan = useDeletePpmPlan()
  const generateJob = useGenerateJobFromPpm()
  const [statusFilter, setStatusFilter] = useState<"all" | "due-soon" | "overdue">("all")

  const hasLive = !!livePlans && livePlans.length > 0

  const allUpcoming: UpcomingRow[] = useMemo(
    () => (hasLive ? livePlans!.map(planToUpcoming) : UPCOMING_DUE),
    [hasLive, livePlans]
  )

  const displayUpcomingDue = useMemo(() => {
    if (statusFilter === "all") return allUpcoming
    return allUpcoming.filter((r) => r.filterStatus === statusFilter)
  }, [allUpcoming, statusFilter])

  // Live KPI values overriding the static template
  const kpiValues = useMemo(() => {
    const active = allUpcoming.length
    const overdue = allUpcoming.filter((r) => r.filterStatus === "overdue").length
    const dueSoon = allUpcoming.filter((r) => r.filterStatus === "due-soon").length
    const completed = allUpcoming.filter((r) => r.filterStatus === "completed").length
    return [active, dueSoon, overdue, dueSoon, completed]
  }, [allUpcoming])

  function goToPlan(row: UpcomingRow) {
    if (row.id) router.push(`/app/work/ppm/${row.id}`)
  }

  async function handleDelete(row: UpcomingRow) {
    if (row.id && workspaceId) await deletePlan.mutateAsync({ id: row.id, workspaceId })
  }

  async function handleGenerate(row: UpcomingRow) {
    if (!row.id || !livePlans) return
    const plan = livePlans.find((p) => p.id === row.id)
    if (!plan) return
    const res = await generateJob.mutateAsync({ plan })
    if (res.ok && res.jobId) router.push(`/app/work/jobs/${res.jobId}`)
  }

  return (
    <div className="space-y-5">
      <MobileTopBar
        title="PPM Scheduler"
        subtitle="Planned maintenance"
        primaryAction={{ label: "New PPM schedule", icon: Plus, href: "/app/work/ppm/schedules/new" }}
      />
      {/* Page header */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">PPM Scheduler</h1>
            <p className="text-sm text-slate-500">Planned preventive maintenance across your portfolio</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Export ▾
          </button>
          <Link
            href="/app/work/ppm/schedules/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
          >
            <Plus className="w-4 h-4" /> New PPM Schedule
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k, idx) => {
          const Icon = k.icon
          const value = hasLive ? kpiValues[idx] : k.value
          return (
            <div key={k.label} className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">
                  {k.label}
                </span>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", k.iconBg)}>
                  <Icon className={cn("w-4 h-4", k.iconColor)} />
                </div>
              </div>
              <p className={cn("text-3xl font-bold leading-none", k.valueColor)}>{value}</p>
              <p className="text-[11px] text-slate-500 mt-1.5">{k.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Work tab nav */}
      <WorkTabNav />

      {/* PPM internal tab nav */}
      <PpmTabNav />

      {/* Two-column main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* LEFT column */}
        <div className="space-y-5">
          {/* Upcoming Due */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Upcoming Due (Next 30 Days)</h2>
              </div>
              <div className="flex items-center gap-2">
                {([
                  { key: "all", label: "All" },
                  { key: "due-soon", label: "Due Soon" },
                  { key: "overdue", label: "Overdue" },
                ] as const).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors",
                      statusFilter === f.key
                        ? "bg-[#2563EB] text-white border-[#2563EB]"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                <Link
                  href="/app/work/ppm/schedules"
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["SERVICE TYPE", "PROPERTY", "DUE DATE", "PRIORITY", "SUPPLIER", "EST. COST", "STATUS", ""].map((h, hi) => (
                      <th key={hi} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="h-6 bg-slate-100 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : displayUpcomingDue.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <CalendarDays className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Nothing due in this view</p>
                        <p className="text-xs text-slate-400 mt-1">Adjust the filter or create a new PPM schedule.</p>
                      </td>
                    </tr>
                  ) : (
                    displayUpcomingDue.map((row, i) => (
                      <tr
                        key={row.id ?? i}
                        onClick={() => goToPlan(row)}
                        className={cn("border-b border-slate-50 hover:bg-slate-50 transition-colors", row.id && "cursor-pointer")}
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-800 whitespace-nowrap">
                            {row.icon} {row.serviceType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{row.property}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs font-semibold text-slate-800">{row.dueDate}</p>
                          <p className="text-[10px] text-slate-400">{row.dueDaysLabel}</p>
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={row.priority} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{row.supplier}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{row.estCost}</td>
                        <td className="px-4 py-3">
                          <PpmScheduleStatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <ConfirmDialog
                            title="Delete this PPM schedule?"
                            description="This action cannot be undone."
                            confirmLabel="Delete"
                            onConfirm={() => handleDelete(row)}
                          >
                            {(openConfirm) => (
                              <ActionMenu
                                items={[
                                  { label: "View", icon: Eye, onClick: () => goToPlan(row), disabled: !row.id },
                                  { label: "Edit", icon: Pencil, onClick: () => goToPlan(row), disabled: !row.id },
                                  { label: "Generate Job", icon: Wrench, onClick: () => handleGenerate(row), disabled: !row.id },
                                  { label: "Delete", icon: Trash2, variant: "danger", onClick: openConfirm, disabled: !row.id },
                                ]}
                              />
                            )}
                          </ConfirmDialog>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">Showing {displayUpcomingDue.length} of {allUpcoming.length} schedules</p>
              <Link
                href="/app/work/ppm/schedules"
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
              >
                View all →
              </Link>
            </div>
          </div>

          {/* Overdue Actions */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-semibold text-slate-900">Overdue Actions</h2>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                2 overdue
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {OVERDUE_ACTIONS.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {item.icon} {item.serviceType}
                      </span>
                      <span className="text-[11px] text-slate-500">·</span>
                      <span className="text-xs text-slate-600">{item.property}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {item.ref}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500">Due {item.dueDate}</span>
                      <span className="text-xs font-semibold text-red-600">
                        {item.daysOverdue} days overdue
                      </span>
                      <span className="text-xs text-slate-500">{item.supplier}</span>
                      <span className="text-xs font-semibold text-slate-700">{item.estCost}</span>
                    </div>
                  </div>
                  <button className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <div className="space-y-4">
          {/* Compliance Health */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Compliance Health</h3>
            <div className="relative h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={COMPLIANCE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {COMPLIANCE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} properties`]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold text-slate-900">86%</p>
                <p className="text-[11px] text-slate-500">Compliant</p>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {COMPLIANCE_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{d.pct}%</span>
                    <span className="text-slate-400">({d.value})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Service Types */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Top Service Types</h3>
              <select className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white">
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="space-y-3">
              {SERVICE_TYPES.map((st) => (
                <div key={st.name} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-600 w-32 shrink-0 leading-tight truncate">{st.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(st.count / MAX_COUNT) * 100}%`,
                        backgroundColor: st.color,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 w-6 text-right shrink-0">{st.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PPM Insights */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-slate-900">PPM Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-700 leading-snug">
                  Gas Safety Certificates peak in June. Consider staggering schedules to balance supplier capacity.
                </p>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-700 leading-snug">
                  2 properties have repeat overdue items. Review maintenance execution.
                </p>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-700 leading-snug">
                  Potential savings of £1,420 by consolidating HVAC maintenance this quarter.
                </p>
              </div>
            </div>
            <Link
              href="/app/work/ppm/reports"
              className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
            >
              View all insights <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
