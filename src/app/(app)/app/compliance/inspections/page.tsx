"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  CalendarClock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Eye,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import { ComplianceKpiCard } from "@/components/compliance/ComplianceKpiCard"
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import {
  MobilePageHeader,
  MobileFilterSheet,
  ResponsiveTable,
  type FilterGroup,
} from "@/components/mobile"
import { createClient } from "@/lib/supabase/client"
import { useComplianceInspections, type ComplianceInspection } from "@/hooks/useComplianceData"
import { fmtDate, humaniseType, downloadCsv } from "../_lib/useComplianceItems"

const STATUS_FILTERS = ["", "upcoming", "scheduled", "completed", "overdue", "cancelled"]

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-slate-300 text-xs">—</span>
  const cls =
    outcome === "passed" ? "bg-emerald-50 text-emerald-700" : outcome === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{humaniseType(outcome)}</span>
}

export default function InspectionsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: inspections = [], isLoading, refetch } = useComplianceInspections()

  const activeFilterCount = statusFilter ? 1 : 0
  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: STATUS_FILTERS.map((s) => ({ value: s, label: s ? humaniseType(s) : "All statuses" })),
    },
  ]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return inspections.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false
      if (q) {
        const hay = `${humaniseType(row.inspection_type)} ${row.inspector_name ?? ""} ${row.property_name ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [inspections, search, statusFilter])

  const kpis = useMemo(() => {
    const total = inspections.length
    const upcoming = inspections.filter((i) => i.status === "upcoming" || i.status === "scheduled").length
    const overdue = inspections.filter((i) => i.status === "overdue").length
    const completed = inspections.filter((i) => i.status === "completed")
    const passed = completed.filter((i) => i.outcome === "passed").length
    const passRate = completed.length ? Math.round((passed / completed.length) * 100) : null
    return { total, upcoming, overdue, completed: completed.length, passRate }
  }, [inspections])

  function exportCsv() {
    downloadCsv(
      "compliance-inspections.csv",
      ["Type", "Property", "Scheduled", "Inspector", "Status", "Outcome", "Findings"],
      filtered.map((i) => [
        humaniseType(i.inspection_type),
        i.property_name ?? "",
        i.scheduled_date ?? "",
        i.inspector_name ?? "",
        i.status,
        i.outcome ?? "",
        i.findings_count ?? 0,
      ])
    )
  }

  async function archiveInspection(id: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("property_inspections")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error && error.code !== "42P01") throw new Error(error.message)
    } finally {
      qc.invalidateQueries({ queryKey: ["compliance-inspections"] })
    }
  }

  return (
    <DashboardContainer>
      {/* Header — desktop / tablet */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-4 sm:px-6 py-4 items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspections</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule, track and manage property inspections.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/property-manager/compliance/inspections/new")} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <CalendarDays className="w-4 h-4" />
            Schedule inspection
          </button>
          <button onClick={exportCsv} disabled={filtered.length === 0} className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
            <Download className="w-4 h-4" />
            Export
          </button>
          <ActionMenu
            items={[
              { label: "Refresh", icon: RefreshCw, onClick: () => refetch() },
              { label: "Open Overview", icon: CheckCircle, onClick: () => router.push("/property-manager/compliance/overview") },
              { label: "Open Coverage", icon: CheckCircle, onClick: () => router.push("/property-manager/compliance/coverage") },
            ]}
          />
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden px-4 pt-4">
        <MobilePageHeader
          title="Inspections"
          count={`${filtered.length} of ${inspections.length}`}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search inspections…"
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 px-4 sm:px-6 py-4">
        <ComplianceKpiCard label="Total Scheduled" value={isLoading ? "—" : kpis.total} subtitle="All inspections" icon={CalendarDays} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <ComplianceKpiCard label="Upcoming" value={isLoading ? "—" : kpis.upcoming} subtitle="Awaiting inspection" icon={CalendarClock} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <ComplianceKpiCard label="Overdue" value={isLoading ? "—" : kpis.overdue} subtitle="Require action" icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" />
        <ComplianceKpiCard label="Completed" value={isLoading ? "—" : kpis.completed} subtitle="Finished" icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <ComplianceKpiCard label="Pass Rate" value={isLoading ? "—" : kpis.passRate == null ? "—" : `${kpis.passRate}%`} subtitle="Of completed" icon={XCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      {/* Filter bar — desktop / tablet */}
      <div className="hidden md:flex px-6 py-3 items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search inspections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-56"
          />
        </div>
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s ? humaniseType(s) : "All statuses"}</option>
          ))}
        </select>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(""); setStatusFilter("") }} className="text-xs text-slate-400 hover:text-slate-600 px-1">Clear</button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {inspections.length}</span>
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-16 text-center text-sm text-slate-400">Loading inspections…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">{inspections.length === 0 ? "No inspections scheduled" : "No inspections match your filters"}</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">{inspections.length === 0 ? "Schedule your first inspection to start tracking." : "Try adjusting your search or filters."}</p>
              {inspections.length === 0 && (
                <button onClick={() => router.push("/property-manager/compliance/inspections/new")} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700">
                  <Plus className="w-3.5 h-3.5" /> Schedule inspection
                </button>
              )}
            </div>
          ) : (
            <ResponsiveTable
              rows={filtered}
              mobile={{
                getKey: (r) => r.id,
                title: (r) => r.property_name ?? "Unassigned property",
                subtitle: (r) => humaniseType(r.inspection_type),
                badge: (r) => <ComplianceStatusBadge status={r.status} />,
                onRowClick: (r) => router.push(`/property-manager/compliance/inspections/${r.id}`),
                fields: [
                  { label: "Scheduled", render: (r) => fmtDate(r.scheduled_date) },
                  { label: "Inspector", render: (r) => r.inspector_name ?? "—" },
                  { label: "Outcome", render: (r) => <OutcomeBadge outcome={r.outcome} /> },
                  { label: "Findings", render: (r) => r.findings_count ?? 0 },
                ],
              }}
            >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Property", "Inspection Type", "Scheduled Date", "Inspector", "Status", "Outcome", "Findings", "Actions"].map((h) => (
                      <th key={h} className={`px-3 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${h === "Actions" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((row: ComplianceInspection) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/property-manager/compliance/inspections/${row.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-3">
                        <p className="text-sm font-semibold text-slate-900 leading-tight">{row.property_name ?? "Unassigned property"}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{humaniseType(row.inspection_type)}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{fmtDate(row.scheduled_date)}</td>
                      <td className="px-3 py-3">
                        <p className="text-sm text-slate-800 font-medium">{row.inspector_name ?? "—"}</p>
                        {row.inspector_company && <p className="text-xs text-slate-400">{row.inspector_company}</p>}
                      </td>
                      <td className="px-3 py-3"><ComplianceStatusBadge status={row.status} /></td>
                      <td className="px-3 py-3"><OutcomeBadge outcome={row.outcome} /></td>
                      <td className="px-3 py-3 text-slate-700 font-medium">{row.findings_count ?? 0}</td>
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <ActionMenu
                            items={[
                              { label: "View", icon: Eye, onClick: () => router.push(`/property-manager/compliance/inspections/${row.id}`) },
                              { label: "Edit", icon: Pencil, onClick: () => router.push(`/property-manager/compliance/inspections/${row.id}/edit`) },
                              { label: "Reschedule", icon: RefreshCw, onClick: () => router.push(`/property-manager/compliance/inspections/${row.id}/edit`) },
                            ]}
                          />
                          <ConfirmDialog
                            title="Archive inspection?"
                            description="This inspection will be removed from active lists."
                            confirmLabel="Archive"
                            onConfirm={() => archiveInspection(row.id)}
                          >
                            {(open) => (
                              <button onClick={open} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Archive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </ConfirmDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </ResponsiveTable>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        groups={mobileFilterGroups}
        activeCount={activeFilterCount}
        onClear={() => setStatusFilter("")}
      />
    </DashboardContainer>
  )
}
