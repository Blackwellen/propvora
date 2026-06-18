"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  BadgeCheck,
  MapPin,
  Star,
  ChevronDown,
  ChevronRight,
  Store,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { MobileTopBar, MobilePageHeader, MobileFilterSheet, type FilterGroup } from "@/components/mobile"
import { SuppliersHubTabNav } from "@/components/suppliers/SuppliersHubTabNav"
import { SupplierAccreditationChip } from "@/features/suppliers/components/SupplierAccreditationChip"
import { SupplierComplianceStatus } from "@/features/suppliers/components/SupplierComplianceStatus"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useUpdateContact } from "@/hooks/useContacts"
import { useSuppliers, type SupplierView } from "@/features/suppliers/useSuppliers"
import { useWorkspaceSupplierPreferences } from "@/lib/suppliers/ratings"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seededRating(id: string) {
  return 4.3 + ((id.charCodeAt(0) % 7) / 10)
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("w-3 h-3", s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")}
        />
      ))}
      <span className="text-[11px] font-semibold text-slate-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SuppliersDirectoryPage() {
  const workspaceId = useWorkspaceId()
  const { suppliers, isSeed } = useSuppliers(workspaceId)
  const { data: preferences } = useWorkspaceSupplierPreferences(workspaceId)
  const updateContact = useUpdateContact()

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
    return [...suppliers]
      .filter((s) => {
        if (tradeFilter !== "All Trades" && s.trade !== tradeFilter) return false
        if (!q) return true
        return (
          s.name.toLowerCase().includes(q) ||
          s.trade.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.email ?? "").toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (sortBy === "rating") return seededRating(b.id) - seededRating(a.id)
        if (sortBy === "trade") return a.trade.localeCompare(b.trade)
        return a.name.localeCompare(b.name)
      })
  }, [suppliers, search, tradeFilter, sortBy])

  function handleTogglePreferred(s: SupplierView) {
    if (s.isSeed || !workspaceId) return
    const nextTags = s.preferred
      ? s.tags.filter((t) => t !== "preferred")
      : [...s.tags, "preferred"]
    updateContact.mutate({ id: s.id, workspaceId, payload: { tags: nextTags } })
  }

  function exportCsv() {
    const rows = filtered.map((s) => [s.id, s.name, s.trade, s.location].map((v) => `"${v}"`).join(","))
    const csv = ["ID,Name,Trade,Location", ...rows].join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "suppliers-directory.csv"
    a.click()
  }

  const activeFilterCount = tradeFilter !== "All Trades" ? 1 : 0
  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "trade", label: "Trade", value: tradeFilter, onChange: setTradeFilter,
      options: trades.map((t) => ({ value: t, label: t })),
    },
    {
      key: "sort", label: "Sort by", value: sortBy,
      onChange: (v) => setSortBy(v as "name" | "rating" | "trade"),
      options: [
        { value: "name",   label: "Name"   },
        { value: "rating", label: "Rating" },
        { value: "trade",  label: "Trade"  },
      ],
    },
  ]

  return (
    <div className="space-y-5">
      <MobileTopBar
        title="Directory"
        subtitle="All suppliers"
        primaryAction={{ label: "Add supplier", icon: UserPlus, href: "/app/contacts/new?type=supplier" }}
        overflowActions={[
          { label: "Marketplace", icon: Store,    href: "/app/marketplace/suppliers" },
          { label: "Export",      icon: Download, onClick: exportCsv                },
        ]}
      />
      <MobilePageHeader
        title="Directory"
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
          title="Supplier Directory"
          description={`${suppliers.length} suppliers in your network`}
          actions={
            <>
              <Link
                href="/app/contacts/new?type=supplier"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Supplier
              </Link>
              <Link
                href="/app/marketplace/suppliers"
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                Marketplace
              </Link>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </>
          }
        />
      </div>

      <SuppliersHubTabNav />

      {/* Toolbar */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        {/* Trade filter */}
        <div className="relative">
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
          >
            {trades.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "rating" | "trade")}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
          >
            <option value="name">Sort: Name</option>
            <option value="rating">Sort: Rating</option>
            <option value="trade">Sort: Trade</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <span className="text-[12.5px] text-slate-500 ml-auto">
          {filtered.length} of {suppliers.length}
        </span>
      </div>

      {/* Supplier list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-slate-700 mb-1">No suppliers found</p>
          <p className="text-[12.5px] text-slate-500 mb-4">
            {suppliers.length === 0
              ? "Add your first supplier to build your network."
              : "Try adjusting your search or filters."}
          </p>
          {suppliers.length === 0 && (
            <Link
              href="/app/contacts/new?type=supplier"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Supplier
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const rating = seededRating(s.id)
            return (
              <div
                key={s.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold", s.avatarBg)}>
                      {s.initials}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        href={`/app/work/suppliers/${s.id}`}
                        className="text-[13.5px] font-semibold text-slate-900 hover:text-[#2563EB] transition-colors"
                      >
                        {s.name}
                      </Link>
                      {s.preferred && <BadgeCheck className="w-4 h-4 text-[#2563EB] shrink-0" />}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {s.trade}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={rating} />
                      <span className="text-[11px] text-slate-400">· {s.category}</span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[12px] text-slate-600">{s.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {s.tags
                        .filter((t) => t !== "preferred")
                        .slice(0, 4)
                        .map((t) => (
                          <SupplierAccreditationChip key={t} label={t} />
                        ))}
                      {s.tags.filter((t) => t !== "preferred").length === 0 && (
                        <SupplierAccreditationChip label="Verified" />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePreferred(s)}
                      className={cn(
                        "p-2 rounded-lg border transition-colors",
                        s.preferred
                          ? "bg-amber-50 border-amber-200 text-amber-500"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:text-amber-400"
                      )}
                      title={s.preferred ? "Remove from preferred" : "Add to preferred"}
                    >
                      <Star className={cn("w-3.5 h-3.5", s.preferred ? "fill-amber-400" : "")} />
                    </button>
                    <ActionMenu
                      items={[
                        { label: "View profile",       onClick: () => window.location.assign(`/app/work/suppliers/${s.id}`) },
                        { label: "View in marketplace",onClick: () => window.location.assign(`/app/marketplace/suppliers/${s.id}`) },
                        { label: "Create job",         onClick: () => window.location.assign("/app/work/jobs/new") },
                        { label: s.preferred ? "Remove from preferred" : "Mark as preferred", onClick: () => handleTogglePreferred(s) },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
