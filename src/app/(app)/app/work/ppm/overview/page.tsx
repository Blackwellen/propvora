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
import { useProperties } from "@/hooks/useProperties"
import {
  usePpmPlans,
  useDeletePpmPlan,
  type PpmPlan,
} from "@/hooks/usePpm"
import { usePpmGenerateJob } from "@/hooks/usePpmGenerateJob"
import PpmGenerateToast from "@/components/work/PpmGenerateToast"

// ─── KPI data ─────────────────────────────────────────────────────────────────

const KPIS = [
  {
    icon: CalendarClock,
    iconBg: "bg-[var(--brand-soft)]",
    iconColor: "text-[var(--brand)]",
    value: 0,
    label: "Active Schedules",
    sub: "Across all properties",
    valueColor: "text-slate-900",
  },
  {
    icon: CalendarDays,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    value: 0,
    label: "Due This Month",
    sub: "This month",
    valueColor: "text-amber-700",
  },
  {
    icon: AlertCircle,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    value: 0,
    label: "Overdue",
    sub: "Require immediate attention",
    valueColor: "text-red-700",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-[var(--brand-soft)]",
    iconColor: "text-[var(--brand)]",
    value: 0,
    label: "Due Next 30 Days",
    sub: "Next 30 days",
    valueColor: "text-slate-900",
  },
  {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    value: 0,
    label: "Completed This Year",
    sub: "This year",
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

// ─── Compliance health donut ──────────────────────────────────────────────────
// Derived from live PPM rows; static fallback used only when no data loaded yet.

function deriveComplianceData(rows: UpcomingRow[]) {
  if (rows.length === 0) return null
  const compliant  = rows.filter(r => r.filterStatus === "scheduled" || r.filterStatus === "completed").length
  const atRisk     = rows.filter(r => r.filterStatus === "due-soon").length
  const nonCompliant = rows.filter(r => r.filterStatus === "overdue").length
  const total = rows.length
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0
  return [
    { name: "Compliant",     value: compliant,    pct: pct(compliant),    fill: "#10B981" },
    { name: "Due Soon",      value: atRisk,       pct: pct(atRisk),       fill: "#F59E0B" },
    { name: "Overdue",       value: nonCompliant, pct: pct(nonCompliant), fill: "#EF4444" },
  ]
}

const FALLBACK_COMPLIANCE_DATA = [
  { name: "Compliant",   value: 0, pct: 0, fill: "#10B981" },
  { name: "Due Soon",    value: 0, pct: 0, fill: "#F59E0B" },
  { name: "Overdue",     value: 0, pct: 0, fill: "#EF4444" },
]

const SERVICE_PALETTE = ["#F97316", "#3B82F6", "#EAB308", "#EF4444", "#14B8A6"]

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

function planToUpcoming(p: PpmPlan, propertyNameById?: Map<string, string>): UpcomingRow {
  const dueDays = (() => {
    if (!p.next_due_date) return "—"
    const diff = Math.ceil((new Date(p.next_due_date).getTime() - Date.now()) / 86_400_000)
    return diff < 0 ? `${Math.abs(diff)} days overdue` : `in ${diff} days`
  })()
  const propertyName = p.property_id
    ? (propertyNameById?.get(p.property_id) ?? "Property")
    : "—"
  return {
    id: p.id,
    icon: "🔧",
    serviceType: p.name,
    property: propertyName,
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
  const { data: properties = [] } = useProperties(workspaceId)
  const deletePlan = useDeletePpmPlan()
  const { generate, feedback, clearFeedback } = usePpmGenerateJob()
  const [statusFilter, setStatusFilter] = useState<"all" | "due-soon" | "overdue">("all")

  const hasLive = !!livePlans && livePlans.length > 0

  const propertyNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of properties) map.set(p.id, p.name)
    return map
  }, [properties])

  const allUpcoming: UpcomingRow[] = useMemo(
    () => (hasLive ? livePlans!.map((p) => planToUpcoming(p, propertyNameById)) : []),
    [hasLive, livePlans, propertyNameById]
  )

  const overdueRows = useMemo(
    () => allUpcoming.filter((r) => r.filterStatus === "overdue"),
    [allUpcoming]
  )

  // Top service types — derived from live plan categories (no fabricated counts)
  const serviceTypes = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of livePlans ?? []) {
      const key = p.category?.trim() || p.name?.trim() || "Other"
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({ name, count, color: SERVICE_PALETTE[i % SERVICE_PALETTE.length] }))
  }, [livePlans])
  const maxServiceCount = Math.max(1, ...serviceTypes.map((s) => s.count))

  // Insights — heuristic, derived from live counts (no fabricated figures)
  const insights = useMemo(() => {
    const overdue = allUpcoming.filter((r) => r.filterStatus === "overdue").length
    const dueSoon = allUpcoming.filter((r) => r.filterStatus === "due-soon").length
    const out: { tone: "blue" | "amber" | "emerald"; text: string }[] = []
    if (overdue > 0)
      out.push({ tone: "amber", text: `${overdue} schedule${overdue === 1 ? " is" : "s are"} overdue — generate a job or reschedule to stay compliant.` })
    if (dueSoon > 0)
      out.push({ tone: "blue", text: `${dueSoon} schedule${dueSoon === 1 ? "" : "s"} due soon — confirm supplier availability ahead of the deadline.` })
    if (out.length === 0)
      out.push({ tone: "emerald", text: "All planned maintenance is on schedule. No overdue or imminent items." })
    return out
  }, [allUpcoming])

  function exportCsv() {
    const headers = ["Service Type", "Property", "Due Date", "Priority", "Supplier", "Est. Cost", "Status"]
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [headers.join(",")]
    for (const r of allUpcoming) {
      lines.push([r.serviceType, r.property, r.dueDate, r.priority, r.supplier, r.estCost, r.status].map(escape).join(","))
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ppm-schedules-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const displayUpcomingDue = useMemo(() => {
    if (statusFilter === "all") return allUpcoming
    return allUpcoming.filter((r) => r.filterStatus === statusFilter)
  }, [allUpcoming, statusFilter])

  const complianceData = useMemo(
    () => deriveComplianceData(allUpcoming) ?? FALLBACK_COMPLIANCE_DATA,
    [allUpcoming]
  )
  const compliancePct = complianceData[0]?.pct ?? 0

  // Live KPI values overriding the static template.
  // "Due This Month" and "Due Next 30 Days" are distinct date-windowed counts
  // derived from each plan's next_due_date (previously both showed the same
  // due-soon count, which mislabelled two of the five cards).
  const kpiValues = useMemo(() => {
    const now = Date.now()
    const d = new Date()
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
    const in30 = now + 30 * 86_400_000
    const plans = livePlans ?? []
    const dueTs = (p: PpmPlan) => (p.next_due_date ? new Date(p.next_due_date).getTime() : null)

    const active = allUpcoming.length
    const overdue = allUpcoming.filter((r) => r.filterStatus === "overdue").length
    const completed = allUpcoming.filter((r) => r.filterStatus === "completed").length
    const dueThisMonth = plans.filter((p) => { const t = dueTs(p); return t != null && t >= now && t <= endOfMonth }).length
    const dueNext30 = plans.filter((p) => { const t = dueTs(p); return t != null && t >= now && t <= in30 }).length
    return [active, dueThisMonth, overdue, dueNext30, completed]
  }, [allUpcoming, livePlans])

  function goToPlan(row: UpcomingRow) {
    if (row.id) router.push(`/property-manager/work/ppm/${row.id}`)
  }

  async function handleDelete(row: UpcomingRow) {
    if (row.id && workspaceId) await deletePlan.mutateAsync({ id: row.id, workspaceId })
  }

  async function handleGenerate(row: UpcomingRow) {
    if (!row.id) return
    await generate(livePlans?.find((p) => p.id === row.id))
  }

  return (
    <div className="space-y-5">
      <PpmGenerateToast feedback={feedback} onClose={clearFeedback} />
      <MobileTopBar
        title="PPM Scheduler"
        subtitle="Planned maintenance"
        primaryAction={{ label: "New PPM schedule", icon: Plus, href: "/property-manager/work/ppm/schedules/new" }}
      />
      {/* Page header */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--brand-soft)] rounded-xl flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">PPM Scheduler</h1>
            <p className="text-sm text-slate-500">Planned preventive maintenance across your portfolio</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={allUpcoming.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link
            href="/property-manager/work/ppm/schedules/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors"
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
                        ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                <Link
                  href="/property-manager/work/ppm/schedules"
                  className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] flex items-center gap-0.5"
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
                href="/property-manager/work/ppm/schedules"
                className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)]"
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
              {overdueRows.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                  {overdueRows.length} overdue
                </span>
              )}
            </div>
            {overdueRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No overdue schedules</p>
                <p className="text-xs text-slate-400 mt-1">Everything is on track.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {overdueRows.map((item, i) => (
                  <div
                    key={item.id ?? i}
                    onClick={() => goToPlan(item)}
                    className={cn("flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors", item.id && "cursor-pointer")}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">
                          {item.icon} {item.serviceType}
                        </span>
                        <span className="text-[11px] text-slate-500">·</span>
                        <span className="text-xs text-slate-600">{item.property}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500">Due {item.dueDate}</span>
                        <span className="text-xs font-semibold text-red-600">{item.dueDaysLabel}</span>
                        {item.supplier !== "—" && <span className="text-xs text-slate-500">{item.supplier}</span>}
                        {item.estCost !== "—" && <span className="text-xs font-semibold text-slate-700">{item.estCost}</span>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); goToPlan(item) }}
                      disabled={!item.id}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                    data={complianceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} plans`]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold text-slate-900">{compliancePct}%</p>
                <p className="text-[11px] text-slate-500">On schedule</p>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {complianceData.map((d) => (
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
              <span className="text-[11px] text-slate-400">By plan count</span>
            </div>
            {serviceTypes.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-4 text-center">No PPM schedules yet.</p>
            ) : (
              <div className="space-y-3">
                {serviceTypes.map((st) => (
                  <div key={st.name} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-600 w-32 shrink-0 leading-tight truncate">{st.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(st.count / maxServiceCount) * 100}%`,
                          backgroundColor: st.color,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 w-6 text-right shrink-0">{st.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PPM Insights */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-slate-900">PPM Insights</h3>
              <span className="ml-auto text-[9px] font-medium text-slate-400 uppercase tracking-wide">Heuristic</span>
            </div>
            <div className="space-y-3">
              {insights.map((ins, i) => {
                const tone = {
                  blue: { wrap: "bg-[var(--brand-soft)] border-[var(--color-brand-100)]", icon: "text-[var(--brand)]", Icon: TrendingUp },
                  amber: { wrap: "bg-amber-50 border-amber-100", icon: "text-amber-600", Icon: AlertCircle },
                  emerald: { wrap: "bg-emerald-50 border-emerald-100", icon: "text-emerald-600", Icon: CheckCircle2 },
                }[ins.tone]
                const Icon = tone.Icon
                return (
                  <div key={i} className={cn("flex items-start gap-2.5 p-3 rounded-xl border", tone.wrap)}>
                    <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", tone.icon)} />
                    <p className="text-[12px] text-slate-700 leading-snug">{ins.text}</p>
                  </div>
                )
              })}
            </div>
            <Link
              href="/property-manager/work/reports"
              className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)]"
            >
              View work reports <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
