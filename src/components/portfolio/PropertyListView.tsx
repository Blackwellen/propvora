"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown,
  TrendingUp, Eye, Edit2, Building2,
  Plus, Users, Archive,
} from "lucide-react"
import type { PropertyCardData } from "./PropertyCard"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { getPropertyTypeOption } from "@/lib/constants/propertyTypes"

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  Active:        { label: "Active",      dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-200" },
  Vacant:        { label: "Vacant",      dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border border-amber-200" },
  "Under Works": { label: "In Progress", dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50 border border-blue-200" },
  Archived:      { label: "Archived",    dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50 border border-slate-200" },
}

const PROFILE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  "Serviced Accommodation": { label: "SA",      bg: "bg-violet-100", text: "text-violet-700" },
  "Rent-to-Rent":           { label: "R2R",     bg: "bg-orange-100", text: "text-orange-700" },
  "HMO":                    { label: "HMO",     bg: "bg-blue-100",   text: "text-blue-700" },
  "Long-Term Let":          { label: "BTL",     bg: "bg-emerald-100",text: "text-emerald-700" },
  "Student Let":            { label: "Student", bg: "bg-teal-100",   text: "text-teal-700" },
  "Co-Living":              { label: "Co-Liv",  bg: "bg-purple-100", text: "text-purple-700" },
}

const TYPE_GRADIENTS: Record<string, string> = {
  HMO:          "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  BTL:          "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  SA:           "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  R2R:          "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  Other:        "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

type SortKey = "name" | "status" | "rent" | "units" | "occupancy"
type SortDir = "asc" | "desc"

/* ------------------------------------------------------------------ */
/* PropertyListView                                                     */
/* ------------------------------------------------------------------ */
export function PropertyListView({ properties }: { properties: PropertyCardData[] }) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  const sorted = [...properties].sort((a, b) => {
    let va: string | number = ""
    let vb: string | number = ""
    if (sortKey === "name") { va = a.name; vb = b.name }
    else if (sortKey === "rent") { va = a.monthlyRent; vb = b.monthlyRent }
    else if (sortKey === "units") { va = a.units; vb = b.units }
    else if (sortKey === "occupancy") {
      va = a.units > 0 ? ((a.occupied ?? a.tenants) / a.units) : 0
      vb = b.units > 0 ? ((b.occupied ?? b.tenants) / b.units) : 0
    }
    else if (sortKey === "status") { va = a.status; vb = b.status }
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
    return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-slate-300 ml-0.5" />
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-[#2563EB] ml-0.5" />
      : <ChevronDown className="w-3 h-3 text-[#2563EB] ml-0.5" />
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 cursor-pointer hover:text-slate-800 select-none"
        onClick={() => toggleSort(col)}
      >
        <span className="flex items-center gap-0.5">{label}<SortIcon col={col} /></span>
      </th>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <Th col="name" label="Property" />
              <Th col="status" label="Status" />
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type</th>
              <Th col="units" label="Units" />
              <Th col="occupancy" label="Occupancy" />
              <Th col="rent" label="Monthly Rent" />
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Yield</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((p) => {
              const status = STATUS_CFG[p.status] ?? STATUS_CFG.Active
              const badge = p.operationProfile
                ? PROFILE_BADGE[p.operationProfile]
                : null
              const cover = TYPE_GRADIENTS[p.type] ?? TYPE_GRADIENTS.Other
              const dwellingLabel = p.category
                ? (getPropertyTypeOption(p.category)?.label ?? p.category)
                : null
              const occ = p.units > 0 ? Math.round(((p.occupied ?? p.tenants) / p.units) * 100) : 0
              const yld = p.yield ?? (p.monthlyRent > 0 ? ((p.monthlyRent * 12 / 400000) * 100).toFixed(1) : null)

              return (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                  {/* Property */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: cover }}>
                        <Building2 size={14} className="text-white opacity-60" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/app/portfolio/properties/${p.id}`}
                          className="text-[13px] font-semibold text-slate-900 hover:text-[#2563EB] transition-colors truncate block">
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate">
                          {p.address}{p.postcode ? `, ${p.postcode}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", status.bg, status.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                      {status.label}
                    </span>
                  </td>
                  {/* Type */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {badge ? (
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-md", badge.bg, badge.text)}>
                          {badge.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">{p.type}</span>
                      )}
                      {dwellingLabel && (
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">{dwellingLabel}</span>
                      )}
                    </div>
                  </td>
                  {/* Units */}
                  <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">{p.units}</td>
                  {/* Occupancy */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", occ === 100 ? "bg-emerald-500" : occ >= 70 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${occ}%` }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-slate-700">{occ}%</span>
                    </div>
                  </td>
                  {/* Rent */}
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-bold text-slate-900">
                      {p.monthlyRent > 0 ? fmt(p.monthlyRent) : <span className="text-slate-300">—</span>}
                    </span>
                  </td>
                  {/* Yield */}
                  <td className="px-4 py-3">
                    {yld ? (
                      <span className="text-[12px] font-semibold text-emerald-700 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />{yld}%
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/app/portfolio/properties/${p.id}`}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#2563EB] hover:text-white flex items-center justify-center text-slate-500 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link href={`/app/portfolio/properties/${p.id}/edit`}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <ActionMenu
                        align="right"
                        items={[
                          { label: "View property", icon: Eye, onClick: () => router.push(`/app/portfolio/properties/${p.id}`) },
                          { label: "Add unit", icon: Plus, onClick: () => router.push(`/app/portfolio/units/new?propertyId=${p.id}`) },
                          { label: "Create tenancy", icon: Users, onClick: () => router.push(`/app/portfolio/tenancies/new?propertyId=${p.id}`) },
                          { label: "Archive", icon: Archive, onClick: () => {} },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">No properties found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
