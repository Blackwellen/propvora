"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Download,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Eye,
  Pencil,
  Wrench,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { PpmTabNav } from "@/components/work/PpmTabNav"
import { PpmScheduleStatusBadge } from "@/features/work/ppm/components/PpmScheduleStatusBadge"
import { PpmCategoryBadge, type PpmCategory } from "@/features/work/ppm/components/PpmCategoryBadge"
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

// ─── Row view model ───────────────────────────────────────────────────────────

interface ScheduleRow {
  id: string | null
  property: string
  address: string
  taskType: string
  category: PpmCategory
  frequency: string
  lastCompleted: string
  lastCompletedBy: string
  nextDue: string
  nextDueDays: string
  supplier: string
  supplierInitials: string
  supplierBg: string
  estCost: string
  status: "scheduled" | "due-soon" | "overdue" | "completed"
  rawStatus: string
}


const FREQ_LABEL: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  bi_annual: "Bi-Annual",
  annual: "Annual",
  biennial: "Every 2 Years",
}

function badgeStatus(s: string): "scheduled" | "due-soon" | "overdue" | "completed" {
  if (s === "due_soon" || s === "due-soon") return "due-soon"
  if (s === "overdue") return "overdue"
  if (s === "completed") return "completed"
  return "scheduled"
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "—"
}

function fmtDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function dueLabel(d: string | null): string {
  if (!d) return "—"
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
  return diff < 0 ? `${Math.abs(diff)} days overdue` : `In ${diff} days`
}

function planToRow(p: PpmPlan, propertyById?: Map<string, { name: string; address: string }>): ScheduleRow {
  const prop = p.property_id ? propertyById?.get(p.property_id) : undefined
  return {
    id: p.id,
    property: prop?.name || (p.property_id ? "Linked property" : "—"),
    address: prop?.address ?? "",
    taskType: p.name,
    category: (p.category as PpmCategory) || "General",
    frequency: FREQ_LABEL[p.frequency ?? ""] ?? (p.frequency ?? "—"),
    lastCompleted: fmtDate(p.last_completed_date),
    lastCompletedBy: p.supplier_name ?? "—",
    nextDue: fmtDate(p.next_due_date),
    nextDueDays: dueLabel(p.next_due_date),
    supplier: p.supplier_name ?? "—",
    supplierInitials: initials(p.supplier_name ?? "—"),
    supplierBg: "bg-[var(--brand)]",
    estCost: p.estimated_cost ? `£${p.estimated_cost.toLocaleString()}` : "—",
    status: badgeStatus(p.status),
    rawStatus: p.status,
  }
}

// ─── KPIs (computed from live or seed) ──────────────────────────────────────────

function buildKpis(rows: ScheduleRow[]) {
  const total = rows.length
  const dueSoon = rows.filter((r) => r.status === "due-soon").length
  const overdue = rows.filter((r) => r.status === "overdue").length
  const suppliers = new Set(rows.map((r) => r.supplier).filter((s) => s && s !== "—")).size
  return [
    { label: "Total Schedules", value: String(total), sub: "Across all properties" },
    { label: "Due Soon", value: String(dueSoon), sub: "Next 30 days" },
    { label: "Overdue", value: String(overdue), sub: "Require attention" },
    { label: "Active Suppliers", value: String(suppliers), sub: "Assigned to schedules" },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PpmSchedulesPage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { data: livePlans, isLoading } = usePpmPlans(workspaceId)
  const { data: properties = [] } = useProperties(workspaceId)
  const deletePlan = useDeletePpmPlan()
  const { generate, feedback, clearFeedback } = usePpmGenerateJob()

  const [search, setSearch] = useState("")
  const [propertyFilter, setPropertyFilter] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [frequencyFilter, setFrequencyFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const propertyById = useMemo(() => {
    const map = new Map<string, { name: string; address: string }>()
    for (const p of properties) {
      const address = [p.address_line1, p.city, p.postcode].filter(Boolean).join(", ")
      map.set(p.id, { name: p.name || "Unnamed property", address })
    }
    return map
  }, [properties])

  const hasLive = !!livePlans && livePlans.length > 0
  const allRows: ScheduleRow[] = useMemo(
    () => (hasLive ? livePlans!.map((p) => planToRow(p, propertyById)) : []),
    [hasLive, livePlans, propertyById]
  )

  // Distinct filter option values from the active dataset
  const propertyOpts = useMemo(() => Array.from(new Set(allRows.map((r) => r.property).filter((p) => p && p !== "—"))), [allRows])
  const supplierOpts = useMemo(() => Array.from(new Set(allRows.map((r) => r.supplier).filter((s) => s && s !== "—"))), [allRows])
  const freqOpts = useMemo(() => Array.from(new Set(allRows.map((r) => r.frequency).filter((f) => f && f !== "—"))), [allRows])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allRows.filter((r) => {
      if (q && !(`${r.property} ${r.taskType} ${r.category} ${r.supplier}`.toLowerCase().includes(q))) return false
      if (propertyFilter && r.property !== propertyFilter) return false
      if (supplierFilter && r.supplier !== supplierFilter) return false
      if (frequencyFilter && r.frequency !== frequencyFilter) return false
      if (statusFilter && r.status !== statusFilter) return false
      return true
    })
  }, [allRows, search, propertyFilter, supplierFilter, frequencyFilter, statusFilter])

  const kpis = useMemo(() => buildKpis(allRows), [allRows])
  const activeFilters = [propertyFilter, supplierFilter, frequencyFilter, statusFilter].filter(Boolean).length

  // Pagination — reset to first page whenever the filtered set changes
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  React.useEffect(() => {
    setPage(1)
  }, [search, propertyFilter, supplierFilter, frequencyFilter, statusFilter, pageSize])
  const safePage = Math.min(page, pageCount)
  const pagedRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize]
  )

  function clearAll() {
    setSearch("")
    setPropertyFilter("")
    setSupplierFilter("")
    setFrequencyFilter("")
    setStatusFilter("")
  }

  function exportCsv() {
    const headers = ["Property", "Address", "Task Type", "Category", "Frequency", "Last Completed", "Next Due", "Supplier", "Est. Cost", "Status"]
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [headers.join(",")]
    for (const r of rows) {
      lines.push(
        [r.property, r.address, r.taskType, r.category, r.frequency, r.lastCompleted, r.nextDue, r.supplier, r.estCost, r.status]
          .map(escape)
          .join(",")
      )
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ppm-schedules-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function goToRow(row: ScheduleRow) {
    if (row.id) router.push(`/property-manager/work/ppm/${row.id}`)
  }

  async function handleDelete(row: ScheduleRow) {
    if (row.id && workspaceId) {
      await deletePlan.mutateAsync({ id: row.id, workspaceId })
    }
  }

  async function handleGenerate(row: ScheduleRow) {
    if (!row.id) return
    await generate(livePlans?.find((p) => p.id === row.id))
  }

  return (
    <div className="space-y-5">
      <PpmGenerateToast feedback={feedback} onClose={clearFeedback} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">PPM Schedules</h1>
          <p className="text-sm text-slate-500">Manage all recurring maintenance schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={rows.length === 0}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{k.label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{k.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* WorkTabNav + PpmTabNav */}
      <WorkTabNav />
      <PpmTabNav />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schedules, assets, or task types..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 bg-white"
          />
        </div>

        <FilterSelect value={propertyFilter} onChange={setPropertyFilter} allLabel="All Properties" options={propertyOpts} />
        <FilterSelect value={supplierFilter} onChange={setSupplierFilter} allLabel="All Suppliers" options={supplierOpts} />
        <FilterSelect value={frequencyFilter} onChange={setFrequencyFilter} allLabel="All Frequencies" options={freqOpts} />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="due-soon">Due Soon</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {activeFilters > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand-soft)] border border-[var(--color-brand-100)] text-[12px] font-semibold text-[var(--brand)]">
            Filters {activeFilters}
          </span>
        )}
        {(activeFilters > 0 || search) && (
          <button onClick={clearAll} className="text-[12px] font-medium text-slate-500 hover:text-slate-700 px-1">
            ✕ Clear all
          </button>
        )}
      </div>

      {/* Schedules table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">All PPM Schedules</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
              {rows.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["PROPERTY / ASSET", "TASK TYPE", "CATEGORY", "FREQUENCY", "LAST COMPLETED", "NEXT DUE ↑", "SUPPLIER", "EST. COST", "STATUS", "ACTIONS"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td colSpan={10} className="px-4 py-3.5">
                      <div className="h-6 bg-slate-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      {activeFilters > 0 ? "No schedules match your filters" : "No PPM schedules yet"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeFilters > 0
                        ? "Try clearing your filters or create a new PPM schedule."
                        : "Create your first recurring maintenance schedule to track compliance due dates."}
                    </p>
                    {activeFilters === 0 && (
                      <Link
                        href="/property-manager/work/ppm/schedules/new"
                        className="inline-flex items-center gap-1.5 mt-4 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add PPM Schedule
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                pagedRows.map((s, i) => (
                  <tr
                    key={s.id ?? i}
                    onClick={() => goToRow(s)}
                    className={cn("border-b border-slate-50 hover:bg-slate-50 transition-colors", s.id && "cursor-pointer")}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-slate-800 whitespace-nowrap">{s.property}</p>
                          {s.address && <p className="text-[11px] text-slate-400 whitespace-nowrap">{s.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12.5px] font-medium text-slate-700 whitespace-nowrap">{s.taskType}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <PpmCategoryBadge category={s.category} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                        {s.frequency}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-[12px] text-slate-700">{s.lastCompleted}</p>
                      <p className="text-[10px] text-slate-400">By {s.lastCompletedBy}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-[12px] font-semibold text-slate-800">{s.nextDue}</p>
                      <p className="text-[10px] text-[var(--brand)]">{s.nextDueDays}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white text-[8px] font-bold shrink-0", s.supplierBg)}>
                          {s.supplierInitials}
                        </div>
                        <span className="text-[12px] text-slate-700 whitespace-nowrap">{s.supplier}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12.5px] font-semibold text-slate-800 whitespace-nowrap">{s.estCost}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <PpmScheduleStatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <ConfirmDialog
                        title="Delete this PPM schedule?"
                        description="This action cannot be undone."
                        confirmLabel="Delete"
                        onConfirm={() => handleDelete(s)}
                      >
                        {(openConfirm) => (
                          <ActionMenu
                            items={[
                              { label: "View", icon: Eye, onClick: () => goToRow(s), disabled: !s.id },
                              { label: "Edit", icon: Pencil, onClick: () => goToRow(s), disabled: !s.id },
                              { label: "Generate Job", icon: Wrench, onClick: () => handleGenerate(s), disabled: !s.id },
                              { label: "Delete", icon: Trash2, variant: "danger", onClick: openConfirm, disabled: !s.id },
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

        {/* Pagination */}
        {rows.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 flex-wrap gap-3">
            <p className="text-xs text-slate-500">
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, rows.length)} of {rows.length}
              {rows.length !== allRows.length && ` (filtered from ${allRows.length})`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[12px] font-medium text-slate-700">
                Page {safePage} of {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-2 py-1 text-[12px] text-slate-700 bg-white"
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Filter select ────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string
  onChange: (v: string) => void
  allLabel: string
  options: string[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer max-w-[180px]"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}
