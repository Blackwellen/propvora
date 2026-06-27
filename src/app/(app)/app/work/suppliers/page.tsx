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
  BarChart3,
  Plus,
  Download,
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
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { MobileTopBar, MobilePageHeader, MobileFilterSheet, ResponsiveTable, type FilterGroup } from "@/components/mobile"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useUpdateContact } from "@/hooks/useContacts"
import { useSuppliers, type SupplierView } from "@/features/suppliers/useSuppliers"
import { useWorkspaceSupplierPreferences, useWorkspaceSupplierRatings } from "@/lib/suppliers/ratings"
import { Ban } from "lucide-react"

// ─── Quick actions (right-rail) ───────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: UserPlus, label: "Add Supplier", href: "/property-manager/contacts/new?type=supplier" },
  { icon: Mail, label: "Invite Supplier", href: "/property-manager/contacts/new?type=supplier" },
  { icon: FilePlus, label: "Create Job", href: "/property-manager/work/jobs/new" },
  { icon: MessageSquare, label: "Create Task", href: "/property-manager/work/tasks/new" },
  { icon: Users, label: "Preferred", href: "/property-manager/work/suppliers/preferred" },
  { icon: BarChart3, label: "Reports", href: "/property-manager/work/reports" },
  { icon: ExternalLink, label: "All Contacts", href: "/property-manager/contacts" },
  { icon: Bot, label: "Work Hub", href: "/property-manager/work" },
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { suppliers, isSeed, loading } = useSuppliers(workspaceId)
  const { data: preferences } = useWorkspaceSupplierPreferences(workspaceId)
  const { data: ratings } = useWorkspaceSupplierRatings(workspaceId)
  const updateContact = useUpdateContact()
  const ratingOf = (id: string) => ratings?.get(id)?.avg ?? null

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
      if (sortBy === "rating") return (ratings?.get(b.id)?.avg ?? -1) - (ratings?.get(a.id)?.avg ?? -1)
      if (sortBy === "trade") return a.trade.localeCompare(b.trade)
      return a.name.localeCompare(b.name)
    })
  }, [suppliers, search, tradeFilter, sortBy, ratings])

  const preferred = useMemo(() => suppliers.filter((s) => s.preferred).slice(0, 3), [suppliers])

  const tradeBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of suppliers) counts.set(s.trade, (counts.get(s.trade) ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([trade, count]) => ({ trade, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [suppliers])

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

  // Supplier/preferred counts are live. The rest have no live source yet — show
  // an honest "—" rather than fabricated numbers.
  const KPIS = [
    { label: "Suppliers", value: String(suppliers.length), sub: `${preferred.length} preferred`, icon: Users, bg: "bg-[var(--brand-soft)]", color: "text-[var(--brand)]" },
    { label: "Pending Requests", value: "—", sub: "No requests yet", icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Quotes Received", value: "—", sub: "No quotes yet", icon: FileText, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Supplier SLA", value: "—", sub: "Awaiting data", icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Outstanding Invoices", value: "—", sub: "No invoices yet", icon: Receipt, bg: "bg-violet-50", color: "text-violet-600" },
    { label: "Avg Response Time", value: "—", sub: "Awaiting data", icon: Zap, bg: "bg-[var(--brand-soft)]", color: "text-[var(--brand)]" },
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
        primaryAction={{ label: "Create job", icon: Plus, href: "/property-manager/work/jobs/new" }}
        overflowActions={[
          { label: "Add supplier", icon: UserPlus, href: "/property-manager/contacts/new?type=supplier" },
          { label: "Export", icon: Download, onClick: exportCsv },
          { label: "Preferred", icon: Star, href: "/property-manager/work/suppliers/preferred" },
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
              href="/property-manager/work/jobs/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--brand)] text-white rounded-lg text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Job
            </Link>
            <Link
              href="/property-manager/contacts/new?type=supplier"
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
              href="/property-manager/work/suppliers/preferred"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
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

      {/* Search + filter row */}
      <div className="hidden md:flex items-center gap-2 flex-wrap bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 bg-white"
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
          className="text-[12px] font-medium text-[var(--brand)] hover:underline px-2"
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
                  <Link href="/property-manager/contacts/new?type=supplier" className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold">Add Supplier</Link>
                </div>
              }
              mobile={{
                getKey: (s) => s.id,
                title: (s) => s.name,
                subtitle: (s) => s.email ?? s.company ?? "—",
                leading: (s) => (
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0", s.avatarBg)}>{s.initials}</div>
                ),
                badge: (s) => {
                  const r = ratingOf(s.id)
                  return <span className="text-[12px] font-semibold text-slate-700">{r != null ? `${r.toFixed(1)}★` : "Unrated"}</span>
                },
                onRowClick: (s) => router.push(`/property-manager/work/suppliers/${s.id}`),
                fields: [
                  { label: "Trade", render: (s) => s.trade },
                  { label: "Category", render: (s) => s.category, hideWhenEmpty: true },
                  { label: "Location", render: (s) => s.location, hideWhenEmpty: true },
                  { label: "Response", render: () => "—" },
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
                            href="/property-manager/contacts/new?type=supplier"
                            className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors"
                          >
                            Add Supplier
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => {
                      const rating = ratingOf(s.id)
                      const pref = preferences?.get(s.id)
                      const showPreferred = (pref?.preferred ?? s.preferred) && !pref?.blocked
                      const showBlocked = pref?.blocked ?? false
                      return (
                        <tr
                          key={s.id}
                          onClick={() => router.push(`/property-manager/work/suppliers/${s.id}`)}
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
                            <p className="text-[12.5px] font-semibold text-slate-400">—</p>
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            <span className="text-[12px] text-slate-400">—</span>
                          </td>
                          <td className="px-4 py-3.5">
                            {rating != null ? (
                              <div className="flex items-center gap-1">
                                <StarRating rating={rating} />
                                <span className="text-[11px] font-semibold text-slate-700 ml-1">{rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Unrated</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex justify-end">
                              <ActionMenu
                                items={[
                                  { label: "View Profile", icon: Eye, onClick: () => router.push(`/property-manager/work/suppliers/${s.id}`) },
                                  { label: "Assign to Job", icon: Briefcase, onClick: () => router.push(`/property-manager/work/jobs/new?supplierId=${s.id}`) },
                                  {
                                    label: s.preferred ? "Remove from Preferred" : "Mark Preferred",
                                    icon: Star,
                                    onClick: () => handleTogglePreferred(s),
                                  },
                                  { label: "View Contact", icon: ExternalLink, onClick: () => router.push(`/property-manager/contacts/${s.id}`) },
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
              <div className="hidden md:block px-5 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Showing all {filtered.length} of {suppliers.length} suppliers</p>
              </div>
            )}
          </div>

          {/* Bottom panels — 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Network by Trade — live breakdown of supplier contacts */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Network by Trade</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
                    {suppliers.length} Active
                  </span>
                </div>
              </div>
              <div className="px-4 py-4">
                {tradeBreakdown.length === 0 ? (
                  <p className="text-[12px] text-slate-400 text-center py-4">No suppliers yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {tradeBreakdown.map((t) => (
                      <div key={t.trade} className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-600 w-28 shrink-0 truncate">{t.trade}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${(t.count / tradeBreakdown[0].count) * 100}%` }} />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 w-5 text-right shrink-0">{t.count}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                  <Link href="/property-manager/work/suppliers/preferred" className="text-[12px] text-[var(--brand)] hover:underline">
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
                      href={`/property-manager/work/suppliers/${s.id}`}
                      className="flex items-center gap-2.5 border border-slate-200 rounded-xl p-2.5 hover:border-amber-200 hover:bg-amber-50/30 transition-colors"
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0", s.avatarBg)}>
                        {s.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-slate-800 truncate">{s.name}</p>
                        <p className="text-[11px] text-slate-500">{s.trade}</p>
                      </div>
                      {ratingOf(s.id) != null
                        ? <span className="text-[11px] font-bold text-amber-500">★ {ratingOf(s.id)!.toFixed(1)}</span>
                        : <span className="text-[11px] text-slate-400">Unrated</span>}
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
                  <Link href="/property-manager/work/suppliers/compliance" className="text-[12px] text-[var(--brand)] hover:underline">
                    Details
                  </Link>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Shield className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-[12.5px] font-semibold text-slate-600">No compliance data yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Add supplier documents to track compliance.</p>
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
              <Link href="/property-manager/work/jobs" className="text-[12px] text-[var(--brand)] hover:underline">
                View All
              </Link>
            </div>
            <p className="text-[12px] text-slate-400 text-center py-4">No open requests. Create one to source quotes from suppliers.</p>
            <Link href="/property-manager/work/jobs/new" className="w-full mt-2 text-[12px] font-semibold text-[var(--brand)] hover:underline block text-center">
              Create New Request →
            </Link>
          </div>

          {/* Supplier Performance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--brand)]" />
                <h3 className="text-sm font-semibold text-slate-900">Supplier Performance</h3>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <TrendingUp className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-[12px] font-semibold text-slate-600">No performance data yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Builds up as jobs complete.</p>
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
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-slate-200 hover:border-[var(--color-brand-100)] hover:bg-[var(--brand-soft)]/40 transition-colors text-center"
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
