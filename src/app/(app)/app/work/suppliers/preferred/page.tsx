"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  MapPin,
  Star,
  CheckCircle2,
  ChevronDown,
  Search,
  Plus,
  Eye,
  Mail,
  Phone,
  Users,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { SuppliersTabNav } from "@/components/work/SuppliersTabNav"
import { MobileTopBar, MobilePageHeader, MobileFilterSheet, type FilterGroup } from "@/components/mobile"
import { SupplierAccreditationChip } from "@/features/suppliers/components/SupplierAccreditationChip"
import { SupplierComplianceStatus } from "@/features/suppliers/components/SupplierComplianceStatus"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useUpdateContact } from "@/hooks/useContacts"
import { useSuppliers, type SupplierView } from "@/features/suppliers/useSuppliers"
import { useWorkspaceSupplierRatings } from "@/lib/suppliers/ratings"

// ─── KPIs ─────────────────────────────────────────────────────────────────────

function buildKpis(total: number, preferred: number, tradesCount: number) {
  return [
    { label: "Preferred Suppliers", value: String(preferred), sub: "Marked preferred", trend: `${total} total`, trendColor: "text-[var(--brand)]" },
    { label: "Total Suppliers", value: String(total), sub: "In your network", trend: "", trendColor: "text-slate-400" },
    { label: "Active Trades", value: String(tradesCount), sub: "Covered by your network", trend: "trades", trendColor: "text-[var(--brand)]" },
    { label: "Avg Response Time", value: "—", sub: "Builds up as jobs complete", trend: "", trendColor: "text-slate-400" },
  ]
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("w-3.5 h-3.5", s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")}
        />
      ))}
      <span className="text-[12.5px] font-semibold text-slate-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

// ─── Supplier card ────────────────────────────────────────────────────────────

function SupplierCard({
  supplier,
  rating,
  onTogglePreferred,
}: {
  supplier: SupplierView
  rating: number | null
  onTogglePreferred: (s: SupplierView) => void
}) {
  const router = useRouter()
  const href = `/property-manager/work/suppliers/${supplier.id}`

  return (
    <div
      onClick={() => router.push(href)}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Avatar — generated initials, no external image */}
        <div className="relative shrink-0">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold", supplier.avatarBg)}>
            {supplier.initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-[13.5px] font-semibold text-slate-900">{supplier.name}</h3>
            {supplier.preferred && <BadgeCheck className="w-4 h-4 text-[var(--brand)] shrink-0" />}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]">
              {supplier.trade}
            </span>
          </div>

          <div className="flex items-center gap-1 mb-2">
            {rating != null ? (
              <StarRating rating={rating} />
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Unrated</span>
            )}
            <span className="text-[11px] text-slate-400">· {supplier.category}</span>
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[12px] text-slate-600">{supplier.location}</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {supplier.tags
              .filter((t) => t !== "preferred")
              .slice(0, 4)
              .map((t) => (
                <SupplierAccreditationChip key={t} label={t} />
              ))}
            {supplier.tags.filter((t) => t !== "preferred").length === 0 && (
              <SupplierAccreditationChip label="Verified" />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Contact</p>
              <div className="space-y-0.5">
                {supplier.email && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-600">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    {supplier.phone}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 capitalize">
                {supplier.status}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Compliance</p>
              <SupplierComplianceStatus status="unknown" label="Add documents" />
            </div>
          </div>

          {/* Mobile action row */}
          <div className="flex sm:hidden items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
            <Link
              href={href}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              View Profile
            </Link>
            <Link
              href={`/property-manager/work/jobs/new?supplierId=${supplier.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[12.5px] font-semibold hover:bg-[var(--brand-strong)] transition-colors text-center"
            >
              <Wrench className="w-3.5 h-3.5" /> Generate Job
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="hidden sm:flex flex-col items-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            items={[
              { label: "View Profile", icon: Eye, onClick: () => router.push(href) },
              { label: "Generate Job", icon: Wrench, onClick: () => router.push(`/property-manager/work/jobs/new?supplierId=${supplier.id}`) },
              {
                label: supplier.preferred ? "Remove from Preferred" : "Mark Preferred",
                icon: Star,
                onClick: () => onTogglePreferred(supplier),
              },
            ]}
          />
          <div className="flex flex-col gap-2 mt-2">
            <Link
              href={href}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap text-center"
            >
              View Profile
            </Link>
            <Link
              href={`/property-manager/work/jobs/new?supplierId=${supplier.id}`}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--brand)] text-white text-[12px] font-semibold hover:bg-[var(--brand-strong)] transition-colors whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5" /> Generate Job
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-3.5 w-1/3 bg-slate-200 rounded" />
          <div className="h-3 w-1/4 bg-slate-100 rounded" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreferredSuppliersPage() {
  const workspaceId = useWorkspaceId()
  const { suppliers, isSeed, loading } = useSuppliers(workspaceId)
  const { data: ratings } = useWorkspaceSupplierRatings(workspaceId)
  const updateContact = useUpdateContact()

  const [search, setSearch] = useState("")
  const [tradeFilter, setTradeFilter] = useState("All Trades")
  const [preferredOnly, setPreferredOnly] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const trades = useMemo(() => {
    const set = new Set(suppliers.map((s) => s.trade))
    return ["All Trades", ...Array.from(set).sort()]
  }, [suppliers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return suppliers.filter((s) => {
      if (preferredOnly && !s.preferred) return false
      if (tradeFilter !== "All Trades" && s.trade !== tradeFilter) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.trade.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
      )
    })
  }, [suppliers, search, tradeFilter, preferredOnly])

  const preferredCount = suppliers.filter((s) => s.preferred).length
  const kpis = buildKpis(suppliers.length, preferredCount, Math.max(trades.length - 1, 0))

  function handleTogglePreferred(s: SupplierView) {
    if (s.isSeed || !workspaceId) return // seed rows are not persisted
    const nextTags = s.preferred
      ? s.tags.filter((t) => t !== "preferred")
      : [...s.tags, "preferred"]
    updateContact.mutate({ id: s.id, workspaceId, payload: { tags: nextTags } })
  }

  function clearFilters() {
    setSearch("")
    setTradeFilter("All Trades")
    setPreferredOnly(false)
  }

  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "trade", label: "Trade", value: tradeFilter, onChange: setTradeFilter,
      options: trades.map((t) => ({ value: t, label: t })),
    },
    {
      key: "preferred", label: "Preferred", value: preferredOnly ? "yes" : "", onChange: (v) => setPreferredOnly(v === "yes"),
      options: [{ value: "", label: "All suppliers" }, { value: "yes", label: "Preferred only" }],
    },
  ]
  const activeFilterCount = (tradeFilter !== "All Trades" ? 1 : 0) + (preferredOnly ? 1 : 0)

  return (
    <div className="space-y-5">
      {/* Mobile top bar + header */}
      <MobileTopBar
        title="Suppliers"
        subtitle="Preferred network"
        primaryAction={{ label: "Add supplier", icon: Plus, href: "/property-manager/contacts/new?type=supplier" }}
      />
      <MobilePageHeader hideTitle
        title="Preferred Suppliers"
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
        onClear={clearFilters}
        activeCount={activeFilterCount}
      />

      {/* Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Preferred Suppliers</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <CheckCircle2 className="w-3 h-3" /> verified
            </span>
            {isSeed && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-semibold">
                Demo data
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Manage trusted contractors, compliance and response performance</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">{k.label}</p>
            <p className="text-3xl font-bold text-slate-900">{k.value}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[11px] text-slate-500">{k.sub}</span>
              {k.trend && <span className={cn("text-[11px] font-semibold ml-1", k.trendColor)}>{k.trend}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Tab navs */}
      <WorkTabNav />
      <SuppliersTabNav />

      {/* Filter bar */}
      <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap bg-white border border-slate-200 rounded-2xl px-4 py-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name, trade or service..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 bg-white"
          />
        </div>

        <div className="relative">
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="appearance-none border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
          >
            {trades.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          onClick={() => setPreferredOnly((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-colors",
            preferredOnly
              ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Star className={cn("w-3.5 h-3.5", preferredOnly && "fill-[var(--brand)]")} /> Preferred only
        </button>

        <button onClick={clearFilters} className="text-[12px] font-medium text-slate-500 hover:text-slate-700 px-1">
          Clear
        </button>
      </div>

      <div className="hidden md:flex items-center justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold">{filtered.length}</span> supplier{filtered.length === 1 ? "" : "s"} found
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* LEFT — Supplier cards */}
        <div className="space-y-4">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">No suppliers match your filters</h3>
              <p className="text-sm text-slate-500 max-w-xs mb-4">
                Try clearing the search or filters, or add a new supplier contact.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map((s) => (
              <SupplierCard key={s.id} supplier={s} rating={ratings?.get(s.id)?.avg ?? null} onTogglePreferred={handleTogglePreferred} />
            ))
          )}

          {!loading && filtered.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-slate-500">
                Showing all {filtered.length} of {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT RAIL */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-start gap-2 mb-3">
              <Wrench className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
              <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <Link
                href="/property-manager/work/jobs/new"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-strong)] transition-colors"
              >
                <Wrench className="w-4 h-4" /> Generate Job
              </Link>
              <Link
                href="/property-manager/contacts/new?type=supplier"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Supplier
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
