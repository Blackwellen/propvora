"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FolderOpen,
  Eye,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  Search,
  Table2,
  LayoutGrid,
  List,
  Trash2,
  Sparkles,
  Plus,
  Pencil,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard, RiskPill, StatusPill, ProfileTag } from "@/components/planning/shared"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { MobilePageHeader, MobileFilterSheet, type FilterGroup } from "@/components/mobile"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePlanningSets, useDeletePlanningSet, useCreatePlanningSet } from "@/hooks/usePlanningsets"
import { PLANNING_PROFILES } from "@/lib/planning/profiles"
import type { PlanningSet } from "@/types/database"
import { cn } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskLevel(score: number): "Low" | "Medium" | "High" {
  if (score < 30) return "Low"
  if (score < 60) return "Medium"
  return "High"
}

function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function money(n: number): string {
  return `£${Math.round(n).toLocaleString()}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanningSetsPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: sets = [], isLoading } = usePlanningSets(workspace?.id)
  const deleteSet = useDeletePlanningSet()
  const createSet = useCreatePlanningSet()

  const [search, setSearch] = useState("")
  const [profileFilter, setProfileFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"table" | "cards" | "compact">("table")
  const [selected, setSelected] = useState<string[]>([])
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  const activeFilterCount =
    (profileFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (riskFilter !== "all" ? 1 : 0)
  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "profile",
      label: "Profile",
      value: profileFilter,
      onChange: setProfileFilter,
      options: [{ value: "all", label: "All profiles" }, ...PLANNING_PROFILES.map((p) => ({ value: p.key, label: p.label }))],
    },
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "all", label: "All" }, { value: "draft", label: "Draft" }, { value: "active", label: "Active" },
        { value: "paused", label: "Paused" }, { value: "converted", label: "Converted" }, { value: "archived", label: "Archived" },
      ],
    },
    {
      key: "risk",
      label: "Risk level",
      value: riskFilter,
      onChange: setRiskFilter,
      options: [
        { value: "all", label: "All" }, { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" },
      ],
    },
    {
      key: "sort",
      label: "Sort by",
      value: sortBy,
      onChange: setSortBy,
      options: [
        { value: "newest", label: "Newest" }, { value: "target_high", label: "Highest net/mo" },
        { value: "risk_high", label: "Highest risk" }, { value: "yield", label: "Highest yield" },
      ],
    },
  ]

  async function handleDelete(id: string) {
    if (!workspace?.id) return
    try {
      await deleteSet.mutateAsync({ id, workspaceId: workspace.id })
      showToast("Planning set deleted")
    } catch {
      showToast("Could not delete planning set")
    }
  }

  async function handleDuplicate(set: PlanningSet) {
    if (!workspace?.id) return
    try {
      const { id, created_at, updated_at, ...rest } = set
      void id; void created_at; void updated_at
      const created = await createSet.mutateAsync({
        ...rest,
        workspace_id: workspace.id,
        title: `${set.title} (copy)`,
        status: "draft",
        is_demo: false,
      })
      showToast("Planning set duplicated")
      router.push(`/property-manager/planning/sets/${created.id}/overview`)
    } catch {
      showToast("Could not duplicate planning set")
    }
  }

  // Live KPIs derived from real rows
  const kpiTotal = sets.length
  const kpiReview = sets.filter((s) => s.status === "active").length
  const kpiConversion = sets.filter((s) => s.status === "converted").length
  const netTargets = sets.filter((s) => s.net_monthly_income > 0)
  const kpiAvgNet = netTargets.length
    ? Math.round(netTargets.reduce((sum, s) => sum + s.net_monthly_income, 0) / netTargets.length)
    : 0
  const kpiMaxYield = sets.reduce((max, s) => (s.net_yield > max ? s.net_yield : max), 0)
  const kpiRiskAlerts = sets.filter((s) => s.risk_score >= 60).length

  const filtered = useMemo(() => {
    let result = sets.filter((s) => {
      const matchSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.address ?? "").toLowerCase().includes(search.toLowerCase())
      const matchProfile = profileFilter === "all" || s.operation_profile === profileFilter
      const matchStatus = statusFilter === "all" || s.status === statusFilter
      const matchRisk = riskFilter === "all" || riskLevel(s.risk_score).toLowerCase() === riskFilter
      return matchSearch && matchProfile && matchStatus && matchRisk
    })
    if (sortBy === "newest") result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at))
    if (sortBy === "target_high") result = [...result].sort((a, b) => b.net_monthly_income - a.net_monthly_income)
    if (sortBy === "risk_high") result = [...result].sort((a, b) => b.risk_score - a.risk_score)
    if (sortBy === "yield") result = [...result].sort((a, b) => b.net_yield - a.net_yield)
    return result
  }, [sets, search, profileFilter, statusFilter, riskFilter, sortBy])

  // Right-rail queues from live data
  const needsData = sets.filter((s) => s.gross_monthly_income === 0 || s.upfront_cash_required === 0).slice(0, 5)
  const highMargin = [...sets].filter((s) => s.net_yield > 0).sort((a, b) => b.net_yield - a.net_yield).slice(0, 4)
  const atRisk = sets.filter((s) => s.risk_score >= 60).slice(0, 4)

  const actions = (
    <button
      onClick={() => router.push("/property-manager/planning/wizard")}
      className="h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-[12.5px] font-semibold hover:bg-violet-700 flex items-center gap-1.5 transition-colors"
    >
      <Plus className="w-4 h-4" />
      New Planning Set
    </button>
  )

  return (
    <PlanningPageShell
      title="Planning Sets"
      subtitle="Live planning records for properties and opportunities."
      actions={actions}
    >
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Mobile header: search + filters */}
      <MobilePageHeader
        title="Planning Sets"
        count={`${filtered.length} of ${sets.length}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search planning sets…"
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* KPI Cards — derived from live data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Total Planning Sets" value={isLoading ? "—" : String(kpiTotal)} icon={FolderOpen} iconColour="#7C3AED" />
        <KpiCard label="Active" value={isLoading ? "—" : String(kpiReview)} icon={Eye} iconColour="#2563EB" />
        <KpiCard label="Converted" value={isLoading ? "—" : String(kpiConversion)} icon={CheckCircle2} iconColour="#10B981" />
        <KpiCard label="Avg Net per Month" value={isLoading ? "—" : kpiAvgNet > 0 ? money(kpiAvgNet) : "—"} icon={TrendingUp} iconColour="#10B981" />
        <KpiCard label="Best Net Yield" value={isLoading ? "—" : kpiMaxYield > 0 ? `${kpiMaxYield.toFixed(1)}%` : "—"} icon={BarChart2} iconColour="#7C3AED" />
        <KpiCard label="Risk Alerts" value={isLoading ? "—" : String(kpiRiskAlerts)} icon={AlertTriangle} iconColour="#EF4444" />
      </div>

      {/* Filters + view toggles — desktop / tablet */}
      <div className="hidden md:flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search planning sets..."
            className="h-9 w-60 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"
          />
        </div>

        <select
          value={profileFilter}
          onChange={(e) => setProfileFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none focus:border-[#7C3AED]"
        >
          <option value="all">All profiles</option>
          {PLANNING_PROFILES.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none focus:border-[#7C3AED]"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="converted">Converted</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none focus:border-[#7C3AED]"
        >
          <option value="all">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort planning sets"
          className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 ml-auto focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
        >
          <option value="newest">Sort: Newest first</option>
          <option value="target_high">Sort: Highest net/mo</option>
          <option value="risk_high">Sort: Highest risk</option>
          <option value="yield">Sort: Highest net yield</option>
        </select>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {([
            { key: "table", icon: Table2 },
            { key: "cards", icon: LayoutGrid },
            { key: "compact", icon: List },
          ] as const).map((v) => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === v.key ? "bg-white shadow-sm" : "hover:bg-white/50"
              )}
            >
              <v.icon className="w-4 h-4 text-slate-600" />
            </button>
          ))}
        </div>
      </div>

      {/* 2/3 + 1/3 layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main list */}
        <div className="lg:col-span-2">
          {/* Mobile always uses cards — the dense table is desktop-only */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {!isLoading && filtered.map((set) => (
              <div
                key={set.id}
                onClick={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)}
                className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[14px] font-bold text-slate-900">{set.title}</p>
                  <div onClick={(e) => e.stopPropagation()}>
                    <SetMenu set={set} onView={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)} onEdit={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)} onDuplicate={() => handleDuplicate(set)} onDelete={() => handleDelete(set.id)} />
                  </div>
                </div>
                <ProfileTag profileKey={set.operation_profile} size="sm" />
                <div className="flex items-center gap-2 mt-3">
                  <StatusPill status={set.status} size="sm" />
                  <RiskPill level={riskLevel(set.risk_score)} size="sm" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-[10.5px] text-slate-400 uppercase tracking-wide">Net / mo</p>
                    <p className="text-[15px] font-bold text-slate-900">{set.net_monthly_income > 0 ? money(set.net_monthly_income) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] text-slate-400 uppercase tracking-wide">Net yield</p>
                    <p className="text-[15px] font-bold text-slate-900">{set.net_yield > 0 ? `${set.net_yield.toFixed(1)}%` : "—"}</p>
                  </div>
                </div>
              </div>
            ))}
            {!isLoading && filtered.length === 0 && <EmptyState hasSets={sets.length > 0} />}
          </div>

          {/* Desktop / tablet: full table + card / compact view toggle */}
          <div className="hidden md:block">
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isLoading && filtered.map((set) => (
                <div
                  key={set.id}
                  onClick={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[14px] font-bold text-slate-900">{set.title}</p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <SetMenu set={set} onView={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)} onEdit={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)} onDuplicate={() => handleDuplicate(set)} onDelete={() => handleDelete(set.id)} />
                    </div>
                  </div>
                  <ProfileTag profileKey={set.operation_profile} size="sm" />
                  <div className="flex items-center gap-2 mt-3">
                    <StatusPill status={set.status} size="sm" />
                    <RiskPill level={riskLevel(set.risk_score)} size="sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-[10.5px] text-slate-400 uppercase tracking-wide">Net / mo</p>
                      <p className="text-[15px] font-bold text-slate-900">{set.net_monthly_income > 0 ? money(set.net_monthly_income) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-slate-400 uppercase tracking-wide">Net yield</p>
                      <p className="text-[15px] font-bold text-slate-900">{set.net_yield > 0 ? `${set.net_yield.toFixed(1)}%` : "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
              {!isLoading && filtered.length === 0 && (
                <div className="sm:col-span-2"><EmptyState hasSets={sets.length > 0} /></div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded"
                          checked={selected.length === filtered.length && filtered.length > 0}
                          onChange={(e) => setSelected(e.target.checked ? filtered.map((s) => s.id) : [])}
                        />
                      </th>
                      {["NAME", "PROFILE", "STATUS", "NET/MO", "GROSS/MO", "UPFRONT", "RISK", "NET YIELD", "ROI", "UPDATED", ""].map((h) => (
                        <th key={h} className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr><td colSpan={12} className="px-5 py-12 text-center text-[13px] text-slate-400">Loading planning sets…</td></tr>
                    )}
                    {!isLoading && filtered.length === 0 && (
                      <tr><td colSpan={12} className="px-5 py-16"><EmptyState hasSets={sets.length > 0} /></td></tr>
                    )}
                    {!isLoading && filtered.map((set) => (
                      <tr
                        key={set.id}
                        onClick={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)}
                        className={cn(
                          "border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors cursor-pointer group",
                          selected.includes(set.id) && "bg-blue-50/50"
                        )}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded"
                            checked={selected.includes(set.id)}
                            onChange={(e) =>
                              setSelected((prev) => (e.target.checked ? [...prev, set.id] : prev.filter((id) => id !== set.id)))
                            }
                          />
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="text-[13px] font-semibold text-slate-800">{set.title}</p>
                          {set.address && <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{set.address}</p>}
                        </td>
                        <td className="px-3 py-3.5"><ProfileTag profileKey={set.operation_profile} size="sm" /></td>
                        <td className="px-3 py-3.5"><StatusPill status={set.status} size="sm" /></td>
                        <td className="px-3 py-3.5 text-[13px] font-bold text-slate-900">{set.net_monthly_income > 0 ? money(set.net_monthly_income) : "—"}</td>
                        <td className="px-3 py-3.5 text-[13px] text-slate-600">{set.gross_monthly_income > 0 ? money(set.gross_monthly_income) : "—"}</td>
                        <td className="px-3 py-3.5 text-[13px] text-slate-600">{set.upfront_cash_required > 0 ? money(set.upfront_cash_required) : "—"}</td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <RiskPill level={riskLevel(set.risk_score)} size="sm" />
                            {set.risk_score > 0 && <span className="text-[11px] text-slate-400">{set.risk_score}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-[13px] text-slate-600">{set.net_yield > 0 ? `${set.net_yield.toFixed(1)}%` : "—"}</td>
                        <td className="px-3 py-3.5 text-[13px] text-slate-600">{set.roi > 0 ? `${set.roi.toFixed(1)}%` : "—"}</td>
                        <td className="px-3 py-3.5 text-[12px] text-slate-400 whitespace-nowrap">{timeAgo(set.updated_at)}</td>
                        <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <SetMenu set={set} onView={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)} onEdit={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)} onDuplicate={() => handleDuplicate(set)} onDelete={() => handleDelete(set.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
                <p className="text-[12.5px] text-slate-500">
                  Showing {filtered.length} of {sets.length} planning set{sets.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Right panel — live derived queues */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3">High-Priority Queue</h3>
            {[
              { icon: AlertTriangle, colour: "#EF4444", label: "Risk alerts", sub: "Risk score ≥ 60", count: kpiRiskAlerts },
              { icon: Eye, colour: "#2563EB", label: "Active sets", sub: "Currently being modelled", count: kpiReview },
              { icon: CheckCircle2, colour: "#10B981", label: "Converted", sub: "Now live properties", count: kpiConversion },
              { icon: BarChart2, colour: "#7C3AED", label: "Needs data", sub: "Missing income or upfront", count: needsData.length },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                <div style={{ background: item.colour + "15" }} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                  <div style={{ color: item.colour }}><item.icon className="w-4 h-4" /></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-400">{item.sub}</p>
                </div>
                <span className="text-[13px] font-bold text-slate-700 shrink-0">{item.count}</span>
              </div>
            ))}
          </div>

          {highMargin.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-[14px] font-bold text-slate-900 mb-3">Top Net Yield</h3>
              {highMargin.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/property-manager/planning/sets/${s.id}/overview`)}
                  className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 w-full text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate">{s.title}</p>
                    <ProfileTag profileKey={s.operation_profile} size="sm" />
                  </div>
                  <span className="text-[12.5px] font-bold text-emerald-600 shrink-0">{s.net_yield.toFixed(1)}%</span>
                </button>
              ))}
            </div>
          )}

          {needsData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-[14px] font-bold text-slate-900 mb-3">Needs Data</h3>
              {needsData.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/property-manager/planning/sets/${s.id}/overview`)}
                  className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 w-full text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-[11px] font-bold text-amber-700 shrink-0">
                    {s.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate">{s.title}</p>
                    <p className="text-[11px] text-slate-400">{s.gross_monthly_income === 0 ? "No income modelled" : "No upfront costs"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {atRisk.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-[14px] font-bold text-slate-900 mb-3">At Risk</h3>
              {atRisk.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/property-manager/planning/sets/${s.id}/overview`)}
                  className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 w-full text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[12.5px] font-semibold text-slate-800 truncate flex-1">{s.title}</p>
                  <span className="text-[11.5px] font-bold text-red-600 shrink-0">{s.risk_score}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        groups={mobileFilterGroups}
        activeCount={activeFilterCount}
        onClear={() => { setProfileFilter("all"); setStatusFilter("all"); setRiskFilter("all"); setSortBy("newest") }}
      />
    </PlanningPageShell>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SetMenu({ set, onView, onEdit, onDuplicate, onDelete }: {
  set: PlanningSet
  onView: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => Promise<void> | void
}) {
  return (
    <ConfirmDialog
      title="Delete planning set?"
      description={`Remove ${set.title}? This cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={async () => { await onDelete() }}
    >
      {(open) => (
        <ActionMenu
          items={[
            { label: "View", icon: Eye, onClick: onView },
            { label: "Edit", icon: Pencil, onClick: onEdit },
            { label: "Landlord Offer", icon: Sparkles, onClick: onView },
            { label: "Duplicate", icon: LayoutGrid, onClick: onDuplicate },
            { label: "Delete", icon: Trash2, onClick: open, variant: "danger" },
          ]}
        />
      )}
    </ConfirmDialog>
  )
}

function EmptyState({ hasSets }: { hasSets: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
        <FolderOpen className="w-6 h-6 text-violet-400" />
      </div>
      <p className="text-[14px] font-semibold text-slate-700">
        {hasSets ? "No results match your filters" : "No planning sets yet"}
      </p>
      <p className="text-[12.5px] text-slate-400 max-w-xs text-center">
        {hasSets
          ? "Try adjusting your search or filter criteria."
          : "Create your first planning set to model a deal, analyse an opportunity, or build a landlord offer."}
      </p>
      {!hasSets && (
        <Link
          href="/property-manager/planning/wizard"
          className="mt-1 h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Planning Set
        </Link>
      )}
    </div>
  )
}
