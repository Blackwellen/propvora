"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users,
  Clock,
  FileText,
  CheckCircle2,
  Receipt,
  Zap,
  LayoutGrid,
  List,
  MapPin,
  BarChart3,
  Filter,
  BookmarkPlus,
  ChevronDown,
  ChevronRight,
  Plus,
  Download,
  Sparkles,
  Star,
  TrendingUp,
  Search,
  Shield,
  Award,
  Wrench,
  UserPlus,
  Mail,
  FilePlus,
  MessageSquare,
  Bot,
  Eye,
  Briefcase,
  ExternalLink,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { MobileTopBar, MobilePageHeader, MobileFilterSheet, ResponsiveTable, type FilterGroup } from "@/components/mobile"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useUpdateContact } from "@/hooks/useContacts"
import { useSuppliers, type SupplierView } from "@/features/suppliers/useSuppliers"
import { useWorkspaceSupplierPreferences } from "@/lib/suppliers/ratings"
import { Ban } from "lucide-react"

// ─── Static decorative data (charts / right-rail) ─────────────────────────────

const RFQS = [
  { priority: "High", title: "Office Fit Out — Manchester", quotes: 5, due: "Due in 2 days", priorColor: "text-red-600 bg-red-50" },
  { priority: "Medium", title: "Plumbing Maintenance — Q2", quotes: 3, due: "Due in 5 days", priorColor: "text-amber-600 bg-amber-50" },
  { priority: "Low", title: "Electrical Installation — Leeds", quotes: 2, due: "Due in 8 days", priorColor: "text-slate-600 bg-slate-100" },
]

const PERF_METRICS = [
  { label: "On-Time Response", value: 98, color: "bg-emerald-500" },
  { label: "Job Completion", value: 95, color: "bg-blue-500" },
  { label: "SLA Compliance", value: 96, color: "bg-violet-500" },
  { label: "Quality Score", value: 94, color: "bg-amber-500" },
]

const COMPLIANCE_DATA = [
  { name: "Compliant", value: 149, pct: 96, fill: "#10b981" },
  { name: "Expiring Soon", value: 4, pct: 2.5, fill: "#f59e0b" },
  { name: "Non-Compliant", value: 3, pct: 1.5, fill: "#ef4444" },
]

const QUICK_ACTIONS = [
  { icon: UserPlus, label: "Add Supplier", href: "/app/contacts/new?type=supplier" },
  { icon: Mail, label: "Invite Supplier", href: "/app/contacts/new?type=supplier" },
  { icon: FilePlus, label: "Create Job", href: "/app/work/jobs/new" },
  { icon: MessageSquare, label: "Create Task", href: "/app/work/tasks/new" },
  { icon: Users, label: "Preferred", href: "/app/work/suppliers/preferred" },
  { icon: Download, label: "Compliance", href: "/app/work/suppliers/compliance" },
  { icon: ExternalLink, label: "All Contacts", href: "/app/contacts" },
  { icon: Bot, label: "Work Hub", href: "/app/work" },
]

const VIEW_TOGGLES = [
  { key: "directory", label: "Directory", icon: Users },
  { key: "card", label: "Card", icon: LayoutGrid },
  { key: "list", label: "List", icon: List },
  { key: "map", label: "Map", icon: MapPin },
  { key: "performance", label: "Performance", icon: BarChart3 },
]

const MAP_PINS = [
  { x: 48, y: 35, size: 10, color: "bg-blue-400" },
  { x: 38, y: 42, size: 7, color: "bg-emerald-400" },
  { x: 55, y: 48, size: 8, color: "bg-amber-400" },
  { x: 62, y: 30, size: 6, color: "bg-violet-400" },
  { x: 30, y: 55, size: 9, color: "bg-blue-500" },
  { x: 70, y: 55, size: 5, color: "bg-red-400" },
  { x: 44, y: 60, size: 7, color: "bg-emerald-500" },
  { x: 58, y: 65, size: 6, color: "bg-amber-500" },
  { x: 25, y: 40, size: 5, color: "bg-blue-300" },
  { x: 75, y: 40, size: 8, color: "bg-slate-400" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={cn("text-[13px]", i < Math.floor(rating) ? "text-amber-400" : "text-slate-200")}>
          ★
        </span>
      ))}
    </div>
  )
}

function ComplianceBar({ value }: { value: number }) {
  const barColor = value >= 95 ? "bg-emerald-500" : value >= 85 ? "bg-amber-400" : "bg-red-400"
  const textColor = value >= 95 ? "text-emerald-600" : "text-amber-600"
  const badgeClass = value >= 95 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-slate-200">
        <div className={cn("h-1.5 rounded-full", barColor)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-[11px] font-semibold", textColor)}>{value}%</span>
      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", badgeClass)}>
        {value >= 95 ? "Compliant" : "At Risk"}
      </span>
    </div>
  )
}

// Deterministic seeded numbers so the premium UI stays populated without external data.
function seededRating(id: string) {
  return 4.3 + ((id.charCodeAt(0) % 7) / 10)
}
function seededResponse(id: string) {
  return (1 + (id.charCodeAt(Math.min(1, id.length - 1)) % 30) / 10).toFixed(1) + " hrs"
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { suppliers, isSeed, loading } = useSuppliers(workspaceId)
  const { data: preferences } = useWorkspaceSupplierPreferences(workspaceId)
  const updateContact = useUpdateContact()

  const [activeView, setActiveView] = useState("directory")
  const [search, setSearch] = useState("")
  const [tradeFilter, setTradeFilter] = useState("All Trades")
  const [sortBy, setSortBy] = useState<"name" | "rating" | "trade">("name")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const trades = useMemo(() => {
    const set = new Set(suppliers.map((s) => s.trade))
    return ["All Trades", ...Array.from(set).sort()]
  }, [suppliers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = suppliers.filter((s) => {
      if (tradeFilter !== "All Trades" && s.trade !== tradeFilter) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.trade.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
      )
    })
    return [...rows].sort((a, b) => {
      if (sortBy === "rating") return seededRating(b.id) - seededRating(a.id)
      if (sortBy === "trade") return a.trade.localeCompare(b.trade)
      return a.name.localeCompare(b.name)
    })
  }, [suppliers, search, tradeFilter, sortBy])

  const preferred = useMemo(() => suppliers.filter((s) => s.preferred).slice(0, 3), [suppliers])

  function handleTogglePreferred(s: SupplierView) {
    if (s.isSeed || !workspaceId) return
    const nextTags = s.preferred ? s.tags.filter((t) => t !== "preferred") : [...s.tags, "preferred"]
    updateContact.mutate({ id: s.id, workspaceId, payload: { tags: nextTags } })
  }

  function exportCsv() {
    const rows = filtered.map((s) => [s.id, s.name, s.trade, s.location].map((v) => `"${v}"`).join(","))
    const csv = ["ID,Name,Trade,Location", ...rows].join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "suppliers.csv"
    a.click()
  }

  const KPIS = [
    { label: "Suppliers", value: String(suppliers.length), sub: `${preferred.length} preferred`, icon: Users, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Pending Requests", value: "18", sub: "5 urgent", icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Quotes Received", value: "64", sub: "+12 this week", icon: FileText, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Supplier SLA", value: "96%", sub: "+4% vs last month", icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Outstanding Invoices", value: "£42,560", sub: "12 invoices", icon: Receipt, bg: "bg-violet-50", color: "text-violet-600" },
    { label: "Avg Response Time", value: "2.4 hrs", sub: "+18% vs last month", icon: Zap, bg: "bg-blue-50", color: "text-blue-600" },
  ]

  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "trade", label: "Trade", value: tradeFilter, onChange: setTradeFilter,
      options: trades.map((t) => ({ value: t, label: t })),
    },
    {
      key: "sort", label: "Sort by", value: sortBy, onChange: (v) => setSortBy(v as "name" | "rating" | "trade"),
      options: [
        { value: "name", label: "Name" },
        { value: "rating", label: "Rating" },
        { value: "trade", label: "Trade" },
      ],
    },
  ]
  const activeFilterCount = (tradeFilter !== "All Trades" ? 1 : 0)

  return (
    <div className="space-y-5">
      {/* Mobile top bar + header */}
      <MobileTopBar
        title="Suppliers"
        subtitle="Service partners"
        primaryAction={{ label: "Create job", icon: Plus, href: "/app/work/jobs/new" }}
        overflowActions={[
          { label: "Add supplier", icon: UserPlus, href: "/app/contacts/new?type=supplier" },
          { label: "Export", icon: Download, onClick: exportCsv },
          { label: "Preferred", icon: Star, href: "/app/work/suppliers/preferred" },
        ]}
      />
      <MobilePageHeader
        title="Suppliers"
        count={`${filtered.length} supplier${filtered.length === 1 ? "" : "s"}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search suppliers…"
        onOpenFilters={() => setMobileFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
      />
      <MobileFilterSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        groups={mobileFilterGroups}
        onClear={() => { setTradeFilter("All Trades"); setSortBy("name") }}
        activeCount={activeFilterCount}
      />

      <div className="hidden md:block">
      <PageHeader
        title="Suppliers"
        description="Supplier network and service partners"
        actions={
          <>
            <Link
              href="/app/work/jobs/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Job
            </Link>
            <Link
              href="/app/contacts/new?type=supplier"
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Supplier
            </Link>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <Link
              href="/app/work/suppliers/preferred"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white rounded-lg text-[13px] font-semibold hover:bg-violet-700 transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
              Preferred
            </Link>
          </>
        }
      />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">{kpi.label}</p>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", kpi.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", kpi.color)} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 leading-none mb-1">{kpi.value}</p>
              <p className="text-[11px] text-slate-500">{kpi.sub}</p>
            </div>
          )
        })}
      </div>

      <WorkTabNav />

      {/* View toggle + actions bar */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
          {VIEW_TOGGLES.map((v) => {
            const Icon = v.icon
            return (
              <button
                key={v.key}
                onClick={() => setActiveView(v.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                  activeView === v.key ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            )
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] text-slate-600 hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] text-slate-600 hover:bg-slate-50">
            <BookmarkPlus className="w-3.5 h-3.5" /> Saved Views <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="hidden md:flex items-center gap-2 flex-wrap bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
          />
        </div>
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-[12px] text-slate-700 bg-white"
        >
          {trades.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "rating" | "trade")}
          className="border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-[12px] text-slate-700 bg-white"
        >
          <option value="name">Sort: Name</option>
          <option value="rating">Sort: Rating</option>
          <option value="trade">Sort: Trade</option>
        </select>
        <button
          onClick={() => {
            setSearch("")
            setTradeFilter("All Trades")
            setSortBy("name")
          }}
          className="text-[12px] font-medium text-[#2563EB] hover:underline px-2"
        >
          Clear Filters
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Supplier Directory Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                Supplier Directory <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
              </p>
              {isSeed && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-semibold">
                  Demo data
                </span>
              )}
            </div>
            <ResponsiveTable
              rows={loading ? [] : filtered}
              emptyState={
                <div className="flex flex-col items-center py-16 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <Users className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-base font-semibold text-slate-900 mb-1">No suppliers found</p>
                  <p className="text-sm text-slate-500 mb-4">Add a supplier contact or adjust your filters.</p>
                  <Link href="/app/contacts/new?type=supplier" className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold">Add Supplier</Link>
                </div>
              }
              mobile={{
                getKey: (s) => s.id,
                title: (s) => s.name,
                subtitle: (s) => s.email ?? s.company ?? "—",
                leading: (s) => (
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0", s.avatarBg)}>{s.initials}</div>
                ),
                badge: (s) => <span className="text-[12px] font-semibold text-slate-700">{seededRating(s.id).toFixed(1)}★</span>,
                onRowClick: (s) => router.push(`/app/work/suppliers/${s.id}`),
                fields: [
                  { label: "Trade", render: (s) => s.trade },
                  { label: "Category", render: (s) => s.category, hideWhenEmpty: true },
                  { label: "Location", render: (s) => s.location, hideWhenEmpty: true },
                  { label: "Response", render: (s) => seededResponse(s.id) },
                ],
              }}
              className="px-3 pb-3"
            >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Trade / Category</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Location</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Response</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Compliance</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-100 animate-pulse">
                        <td className="px-4 py-3.5" colSpan={7}>
                          <div className="h-9 bg-slate-100 rounded-lg" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                            <Users className="w-7 h-7 text-slate-400" />
                          </div>
                          <p className="text-base font-semibold text-slate-900 mb-1">No suppliers found</p>
                          <p className="text-sm text-slate-500 mb-4">Add a supplier contact or adjust your filters.</p>
                          <Link
                            href="/app/contacts/new?type=supplier"
                            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
                          >
                            Add Supplier
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => {
                      const rating = seededRating(s.id)
                      const pref = preferences?.get(s.id)
                      const showPreferred = (pref?.preferred ?? s.preferred) && !pref?.blocked
                      const showBlocked = pref?.blocked ?? false
                      return (
                        <tr
                          key={s.id}
                          onClick={() => router.push(`/app/work/suppliers/${s.id}`)}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0", s.avatarBg)}>
                                {s.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">
                                  {s.name}
                                  {showPreferred && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Preferred
                                    </span>
                                  )}
                                  {showBlocked && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[9px] font-bold text-red-700">
                                      <Ban className="w-2.5 h-2.5" /> Blocked
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">{s.email ?? s.company ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            <p className="text-[12.5px] font-medium text-slate-700">{s.trade}</p>
                            <p className="text-[11px] text-slate-400">{s.category}</p>
                          </td>
                          <td className="px-4 py-3.5 hidden xl:table-cell">
                            <span className="text-[12px] text-slate-600">{s.location}</span>
                          </td>
                          <td className="px-4 py-3.5 hidden xl:table-cell">
                            <p className="text-[12.5px] font-semibold text-slate-800">{seededResponse(s.id)}</p>
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            <ComplianceBar value={96} />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <StarRating rating={rating} />
                              <span className="text-[11px] font-semibold text-slate-700 ml-1">{rating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex justify-end">
                              <ActionMenu
                                items={[
                                  { label: "View Profile", icon: Eye, onClick: () => router.push(`/app/work/suppliers/${s.id}`) },
                                  { label: "Assign to Job", icon: Briefcase, onClick: () => router.push(`/app/work/jobs/new?supplierId=${s.id}`) },
                                  {
                                    label: s.preferred ? "Remove from Preferred" : "Mark Preferred",
                                    icon: Star,
                                    onClick: () => handleTogglePreferred(s),
                                  },
                                  { label: "View Contact", icon: ExternalLink, onClick: () => router.push(`/app/contacts/${s.id}`) },
                                ]}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            </ResponsiveTable>

            {!loading && filtered.length > 0 && (
              <div className="hidden md:flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Showing {filtered.length} of {suppliers.length} suppliers</p>
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 rounded text-[12px] font-medium bg-[#2563EB] text-white">1</button>
                  <button className="p-1.5 rounded hover:bg-slate-100" aria-label="Next">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom panels — 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Supplier Coverage Map */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Supplier Coverage</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {suppliers.length} Active
                  </span>
                </div>
              </div>
              <div className="relative h-48 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  {[20, 40, 60, 80].map((y) => (
                    <div key={y} className="absolute w-full border-t border-slate-400" style={{ top: `${y}%` }} />
                  ))}
                  {[20, 40, 60, 80].map((x) => (
                    <div key={x} className="absolute h-full border-l border-slate-400" style={{ left: `${x}%` }} />
                  ))}
                </div>
                {MAP_PINS.map((pin, i) => (
                  <div
                    key={i}
                    className={cn("absolute rounded-full opacity-80", pin.color)}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%`, width: pin.size, height: pin.size }}
                  />
                ))}
                <div className="absolute bottom-2 left-3">
                  <p className="text-[10px] text-slate-400">UK Coverage · 12 Regions</p>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { region: "London", count: 48, color: "text-blue-600" },
                    { region: "Midlands", count: 34, color: "text-emerald-600" },
                    { region: "North", count: 29, color: "text-amber-600" },
                  ].map((r) => (
                    <div key={r.region} className="text-center">
                      <p className={cn("text-sm font-bold", r.color)}>{r.count}</p>
                      <p className="text-[10px] text-slate-500">{r.region}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preferred Suppliers (live subset) */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-900">Preferred Suppliers</h3>
                  </div>
                  <Link href="/app/work/suppliers/preferred" className="text-[12px] text-[#2563EB] hover:underline">
                    Manage
                  </Link>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {preferred.length === 0 ? (
                  <p className="text-[12px] text-slate-500 py-4 text-center">No preferred suppliers yet.</p>
                ) : (
                  preferred.map((s) => (
                    <Link
                      key={s.id}
                      href={`/app/work/suppliers/${s.id}`}
                      className="flex items-center gap-2.5 border border-slate-200 rounded-xl p-2.5 hover:border-amber-200 hover:bg-amber-50/30 transition-colors"
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0", s.avatarBg)}>
                        {s.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-slate-800 truncate">{s.name}</p>
                        <p className="text-[11px] text-slate-500">{s.trade}</p>
                      </div>
                      <span className="text-[11px] font-bold text-amber-500">★ {seededRating(s.id).toFixed(1)}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Compliance Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Compliance Overview</h3>
                  </div>
                  <Link href="/app/work/suppliers/compliance" className="text-[12px] text-[#2563EB] hover:underline">
                    Details
                  </Link>
                </div>
              </div>
              <div className="p-4">
                <div className="relative h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={COMPLIANCE_DATA} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={2} dataKey="value">
                        {COMPLIANCE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} suppliers`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-slate-900">96%</p>
                    <p className="text-[10px] text-slate-500">Compliant</p>
                  </div>
                </div>
                <div className="space-y-2 mt-1">
                  {COMPLIANCE_DATA.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="text-[12px] text-slate-600">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-800">{d.value}</span>
                        <span className="text-[11px] text-slate-400">({d.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panels */}
        <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0">
          {/* Supplier Requests / RFQs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Supplier Requests / RFQs</h3>
              <Link href="/app/work/jobs" className="text-[12px] text-[#2563EB] hover:underline">
                View All
              </Link>
            </div>
            {RFQS.map((rfq, i) => (
              <div key={i} className="flex items-start gap-2.5 mb-3 pb-3 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5", rfq.priorColor)}>{rfq.priority}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-slate-800 truncate">{rfq.title}</p>
                  <p className="text-[11px] text-slate-500">{rfq.quotes} quotes received</p>
                  <p className="text-[11px] text-slate-400">{rfq.due}</p>
                </div>
              </div>
            ))}
            <Link href="/app/work/jobs/new" className="w-full mt-2 text-[12px] font-semibold text-[#2563EB] hover:underline block text-center">
              Create New Request →
            </Link>
          </div>

          {/* Supplier Performance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Supplier Performance</h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">96% Overall</span>
            </div>
            <div className="space-y-3">
              {PERF_METRICS.map((m) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-600">{m.label}</span>
                    <span className="text-[11px] font-semibold text-slate-800">{m.value}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100">
                    <div className={cn("h-1.5 rounded-full", m.color)} style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/40 transition-colors text-center"
                  >
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-[10.5px] font-medium text-slate-600 leading-tight">{a.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
