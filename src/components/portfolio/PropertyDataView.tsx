"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ChevronUp, ChevronDown, TrendingUp, AlertTriangle, Eye,
} from "lucide-react"
import type { PropertyCardData } from "./PropertyCard"

/* ------------------------------------------------------------------ */
/* PropertyDataView — analytics register table                         */
/* ------------------------------------------------------------------ */
function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

type Col = "name" | "occupancy" | "rent" | "noi" | "arrears" | "yield" | "openWork"
type SortDir = "asc" | "desc"

const HEALTH_COLOR: Record<string, string> = {
  healthy:  "text-emerald-700 bg-emerald-50",
  watch:    "text-amber-700 bg-amber-50",
  at_risk:  "text-orange-700 bg-orange-50",
  critical: "text-red-700 bg-red-50",
}

export function PropertyDataView({ properties }: { properties: PropertyCardData[] }) {
  const [sortCol, setSortCol] = useState<Col>("rent")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function toggle(col: Col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortCol(col); setSortDir("desc") }
  }

  const rows = [...properties].sort((a, b) => {
    const getVal = (p: PropertyCardData): number => {
      if (sortCol === "occupancy") return p.units > 0 ? ((p.occupied ?? p.tenants) / p.units) * 100 : 0
      if (sortCol === "rent") return p.monthlyRent
      if (sortCol === "noi") return p.monthlyRent * 0.65
      if (sortCol === "arrears") return p.arrears ?? 0
      if (sortCol === "yield") return p.yield ?? 0
      if (sortCol === "openWork") return p.openWork ?? 0
      return 0
    }
    if (sortCol === "name") {
      return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }
    return sortDir === "asc" ? getVal(a) - getVal(b) : getVal(b) - getVal(a)
  })

  function Th({ col, label, right }: { col: Col; label: string; right?: boolean }) {
    const active = sortCol === col
    return (
      <th
        className={cn(
          "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 cursor-pointer select-none",
          "hover:text-slate-800 transition-colors",
          right ? "text-right" : "text-left"
        )}
        onClick={() => toggle(col)}
      >
        <span className={cn("inline-flex items-center gap-0.5", right ? "justify-end" : "justify-start")}>
          {label}
          {active
            ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#2563EB]" /> : <ChevronDown className="w-3 h-3 text-[#2563EB]" />)
            : <ChevronUp className="w-3 h-3 text-slate-200" />
          }
        </span>
      </th>
    )
  }

  /* Summary totals */
  const totals = {
    rent: rows.reduce((s, p) => s + p.monthlyRent, 0),
    noi: rows.reduce((s, p) => s + p.monthlyRent * 0.65, 0),
    arrears: rows.reduce((s, p) => s + (p.arrears ?? 0), 0),
    units: rows.reduce((s, p) => s + p.units, 0),
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Summary strip */}
      <div className="flex items-center gap-6 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 text-[12px]">
        <div>
          <span className="text-slate-500 mr-1.5">Total Properties</span>
          <span className="font-bold text-slate-900">{rows.length}</span>
        </div>
        <div>
          <span className="text-slate-500 mr-1.5">Total Units</span>
          <span className="font-bold text-slate-900">{totals.units}</span>
        </div>
        <div>
          <span className="text-slate-500 mr-1.5">Monthly Rent</span>
          <span className="font-bold text-slate-900">{fmt(totals.rent)}</span>
        </div>
        <div>
          <span className="text-slate-500 mr-1.5">Est. NOI</span>
          <span className="font-bold text-emerald-700">{fmt(totals.noi)}</span>
        </div>
        {totals.arrears > 0 && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-semibold">Arrears: {fmt(totals.arrears)}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <Th col="name" label="Property" />
              <Th col="occupancy" label="Occupancy" right />
              <Th col="rent" label="Monthly Rent" right />
              <Th col="noi" label="Est. NOI" right />
              <Th col="arrears" label="Arrears" right />
              <Th col="yield" label="Yield" right />
              <Th col="openWork" label="Open Work" right />
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 text-left">Health</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((p) => {
              const occ = p.units > 0 ? Math.round(((p.occupied ?? p.tenants) / p.units) * 100) : 0
              const noi = p.monthlyRent * 0.65
              const yld = p.yield ?? (p.monthlyRent > 0 ? ((p.monthlyRent * 12 / 400000) * 100).toFixed(1) : null)
              const healthClass = HEALTH_COLOR[p.healthScore ?? "healthy"] ?? HEALTH_COLOR.healthy
              const healthLabel = p.healthScore
                ? p.healthScore.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())
                : "Healthy"

              return (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-3">
                    <Link href={`/app/portfolio/properties/${p.id}`}
                      className="text-[13px] font-semibold text-slate-900 hover:text-[#2563EB] transition-colors block truncate max-w-[200px]">
                      {p.name}
                    </Link>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{p.address}</p>
                  </td>
                  {/* Occupancy */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", occ === 100 ? "bg-emerald-500" : occ >= 70 ? "bg-amber-500" : "bg-red-500")}
                          style={{ width: `${occ}%` }} />
                      </div>
                      <span className="text-[12px] font-bold text-slate-800 tabular-nums">{occ}%</span>
                    </div>
                  </td>
                  {/* Monthly rent */}
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900 tabular-nums">
                    {p.monthlyRent > 0 ? fmt(p.monthlyRent) : <span className="text-slate-300">—</span>}
                  </td>
                  {/* NOI */}
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-emerald-700 tabular-nums">
                    {p.monthlyRent > 0 ? fmt(noi) : <span className="text-slate-300">—</span>}
                  </td>
                  {/* Arrears */}
                  <td className="px-4 py-3 text-right">
                    {(p.arrears ?? 0) > 0
                      ? <span className="text-[13px] font-bold text-red-600 tabular-nums">{fmt(p.arrears!)}</span>
                      : <span className="text-[12px] text-emerald-600 font-semibold">Clear</span>
                    }
                  </td>
                  {/* Yield */}
                  <td className="px-4 py-3 text-right">
                    {yld
                      ? <span className="text-[13px] font-semibold text-slate-800 tabular-nums flex items-center justify-end gap-0.5">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />{yld}%
                        </span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  {/* Open work */}
                  <td className="px-4 py-3 text-right">
                    <span className={cn("text-[13px] font-bold tabular-nums",
                      (p.openWork ?? 0) > 3 ? "text-amber-600" : "text-slate-800"
                    )}>
                      {p.openWork ?? 0}
                    </span>
                  </td>
                  {/* Health */}
                  <td className="px-4 py-3">
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", healthClass)}>
                      {healthLabel}
                    </span>
                  </td>
                  {/* View */}
                  <td className="px-4 py-3">
                    <Link href={`/app/portfolio/properties/${p.id}`}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#2563EB] hover:text-white flex items-center justify-center text-slate-500 transition-all">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
