"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import type { PropertyCardData } from "./PropertyCard"
import {
  ChevronUp, ChevronDown, MoreHorizontal, Eye, Edit2, Archive, ArrowUpDown, Building2, Home,
} from "lucide-react"
import { getPropertyTypeOption } from "@/lib/constants/propertyTypes"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type SortKey = "name" | "type" | "units" | "tenants" | "monthlyRent" | "status" | "occupancy"
type SortDir = "asc" | "desc"

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
const TYPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  SA:          { label: "SA",      bg: "bg-violet-100",  text: "text-violet-700" },
  R2R:         { label: "R2R",     bg: "bg-orange-100",  text: "text-orange-700" },
  HMO:         { label: "HMO",     bg: "bg-blue-100",    text: "text-blue-700" },
  BTL:         { label: "BTL",     bg: "bg-emerald-100", text: "text-emerald-700" },
  Commercial:  { label: "Comm.",   bg: "bg-slate-100",   text: "text-slate-700" },
  Mixed:       { label: "Mixed",   bg: "bg-indigo-100",  text: "text-indigo-700" },
  "Holiday Let":{ label: "Holiday",bg: "bg-cyan-100",    text: "text-cyan-700" },
  Other:       { label: "Rental",  bg: "bg-teal-100",    text: "text-teal-700" },
}

const STATUS_BADGE: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  Active:        { label: "Occupied",    dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  Vacant:        { label: "Vacant",      dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50" },
  "Under Works": { label: "In Progress", dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50" },
  Archived:      { label: "Archived",    dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50" },
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

/* ------------------------------------------------------------------ */
/* Manager pool (no avatar images)                                      */
/* ------------------------------------------------------------------ */
const MANAGERS = [
  { name: "Lerato M." },
  { name: "Sipho N." },
  { name: "Thandi D." },
  { name: "Marco P." },
  { name: "Kezia B." },
]

const AVATAR_PALETTE = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#0891B2"]
function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}
function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

/* ------------------------------------------------------------------ */
/* Fallback gradients per type                                          */
/* ------------------------------------------------------------------ */
const TYPE_GRADIENTS: Record<string, string> = {
  HMO:          "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  BTL:          "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  SA:           "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  R2R:          "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  Commercial:   "linear-gradient(135deg, #475569 0%, #64748B 100%)",
  Mixed:        "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)",
  "Holiday Let":"linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)",
  Other:        "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
}

/* ------------------------------------------------------------------ */
/* PropertyTable — matches reference sections 7 & 8                   */
/* ------------------------------------------------------------------ */
export function PropertyTable({
  properties,
  onRowClick,
}: {
  properties: PropertyCardData[]
  onRowClick?: (id: string) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  const sorted = [...properties].sort((a, b) => {
    let av: string | number = a.name
    let bv: string | number = b.name
    if (sortKey === "monthlyRent") { av = a.monthlyRent; bv = b.monthlyRent }
    else if (sortKey === "units") { av = a.units; bv = b.units }
    else if (sortKey === "tenants") { av = a.tenants; bv = b.tenants }
    else if (sortKey === "type") { av = a.type; bv = b.type }
    else if (sortKey === "status") { av = a.status; bv = b.status }
    else if (sortKey === "occupancy") {
      av = a.units > 0 ? ((a.occupied ?? a.tenants) / a.units) : 0
      bv = b.units > 0 ? ((b.occupied ?? b.tenants) / b.units) : 0
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1
    if (av > bv) return sortDir === "asc" ? 1 : -1
    return 0
  })

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-slate-300 inline ml-1" />
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-[#2563EB] inline ml-1" />
      : <ChevronDown className="w-3 h-3 text-[#2563EB] inline ml-1" />
  }

  function Th({ k, children }: { k: SortKey; children: React.ReactNode }) {
    return (
      <th
        onClick={() => toggleSort(k)}
        className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-600 whitespace-nowrap select-none"
      >
        {children}<SortIcon k={k} />
      </th>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <Th k="name">Property</Th>
              <Th k="type">Type</Th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Dwelling</th>
              <Th k="units">Units</Th>
              <Th k="occupancy">Occupancy</Th>
              <Th k="monthlyRent">Rent / mo</Th>
              <Th k="status">Status</Th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Manager</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {sorted.map((p, i) => {
              const typeBadge = TYPE_BADGE[p.type] ?? TYPE_BADGE.Other
              const statusBadge = STATUS_BADGE[p.status] ?? STATUS_BADGE.Active
              const occupancyPct = p.units > 0 ? Math.round(((p.occupied ?? p.tenants) / p.units) * 100) : 0
              const coverGradient = TYPE_GRADIENTS[p.type] ?? TYPE_GRADIENTS.Other
              const manager = MANAGERS[i % MANAGERS.length]
              const dwellingLabel = p.category
                ? (getPropertyTypeOption(p.category)?.label ?? p.category)
                : null

              return (
                <tr
                  key={p.id}
                  onClick={() => onRowClick?.(p.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Property thumbnail + name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: coverGradient }}>
                        <Building2 size={16} className="text-white opacity-60" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 truncate group-hover:text-[#2563EB] transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {p.address}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Type badge */}
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md", typeBadge.bg, typeBadge.text)}>
                      {typeBadge.label}
                    </span>
                  </td>

                  {/* Dwelling type (category) */}
                  <td className="px-4 py-3">
                    {dwellingLabel ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                        <Home className="w-3 h-3 text-slate-400" />
                        {dwellingLabel}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-300">—</span>
                    )}
                  </td>

                  {/* Units */}
                  <td className="px-4 py-3 text-[13px] font-semibold text-slate-900 tabular-nums">
                    {p.units}
                  </td>

                  {/* Occupancy */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", occupancyPct === 100 ? "bg-emerald-500" : occupancyPct >= 70 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                      <span className={cn("text-[12px] font-bold tabular-nums", occupancyPct === 100 ? "text-emerald-700" : occupancyPct >= 70 ? "text-amber-700" : "text-red-700")}>
                        {occupancyPct}%
                      </span>
                    </div>
                  </td>

                  {/* Rent */}
                  <td className="px-4 py-3">
                    <span className={cn("text-[13px] font-bold tabular-nums", p.monthlyRent > 0 ? "text-slate-900" : "text-slate-300")}>
                      {p.monthlyRent > 0 ? formatCurrency(p.monthlyRent) : "—"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", statusBadge.bg, statusBadge.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", statusBadge.dot)} />
                      {statusBadge.label}
                    </span>
                  </td>

                  {/* Manager */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-bold select-none"
                        style={{ background: getAvatarColor(manager.name) }}>{getInitials(manager.name)}</div>
                      <span className="text-[12px] text-slate-600 font-medium whitespace-nowrap">{manager.name}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {menuOpen === p.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-full mt-1 z-40 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1 max-h-[min(60vh,360px)] overflow-y-auto overscroll-contain">
                            {[
                              { label: "View",    icon: Eye,     href: `/app/portfolio/properties/${p.id}` },
                              { label: "Edit",    icon: Edit2,   href: `/app/portfolio/properties/${p.id}/edit` },
                              { label: "Archive", icon: Archive, href: undefined },
                            ].map(({ label, icon: Icon, href }) => (
                              href ? (
                                <Link
                                  key={label}
                                  href={href}
                                  onClick={() => setMenuOpen(null)}
                                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <Icon className="w-3.5 h-3.5 text-slate-400" />{label}
                                </Link>
                              ) : (
                                <button key={label} onClick={() => setMenuOpen(null)} className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                                  <Icon className="w-3.5 h-3.5" />{label}
                                </button>
                              )
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-sm text-slate-500">
                  No properties found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
