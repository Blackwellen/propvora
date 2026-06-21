"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Tenancy } from "@/hooks/useTenancies"
import type { Unit } from "@/hooks/useUnits"
import type { Property } from "@/types/database"
import { ArrowUpRight, PoundSterling } from "lucide-react"
import { fmt, fmtDate, Card } from "./shared"

export function FinancesTab({ tenanciesList, unitsList, prop }: { tenanciesList: Tenancy[]; unitsList: Unit[]; prop: Property }) {
  const activeTenancies = tenanciesList.filter((t) => t.status === "active")
  const monthlyRent = activeTenancies.reduce((s, t) => s + (t.rent_amount ?? 0), 0)
  const totalDeposit = tenanciesList.reduce((s, t) => s + (t.deposit_amount ?? 0), 0)
  const targetRent = unitsList.reduce((s, u) => s + (u.target_rent ?? 0), 0) || (prop.target_rent ?? 0)
  const occupancyPct = unitsList.length > 0
    ? Math.round((unitsList.filter((u) => u.status === "occupied").length / unitsList.length) * 100)
    : null
  const unitMap = Object.fromEntries(unitsList.map((u) => [u.id, u.unit_name]))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">Rent roll derived from live tenancies. Full transactions, arrears and reports live in Money.</p>
        <Link href="/property-manager/money" className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
          Open Money <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* KPI cards — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Monthly Rent", value: monthlyRent > 0 ? fmt(monthlyRent) : "—", sub: `${activeTenancies.length} active tenancies`, color: "#10B981" },
          { label: "Annualised", value: monthlyRent > 0 ? fmt(monthlyRent * 12) : "—", sub: "Active rent × 12", color: "#2563EB" },
          { label: "Target Rent", value: targetRent > 0 ? fmt(targetRent) : "—", sub: "Combined unit targets", color: "#7C3AED" },
          { label: "Occupancy", value: occupancyPct != null ? `${occupancyPct}%` : "—", sub: "Of units", color: "#F59E0B" },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[11px] text-slate-500 mb-1">{k.label}</p>
            <p className="text-[20px] font-bold text-slate-900 tabular-nums">{k.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* Rent roll table — live tenancies */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[14px] font-bold text-slate-900">Rent Roll</p>
        </div>
        {activeTenancies.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <PoundSterling size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-semibold text-slate-500">No active tenancies</p>
            <p className="text-[12px] text-slate-500 mt-1">Add a tenancy to start tracking rent for this property.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Reference", "Unit", "Lease Period", "Monthly Rent", "Deposit"].map((h, i) => (
                    <th key={h} className={cn("text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap", i >= 3 ? "text-right" : "text-left")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeTenancies.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/property-manager/portfolio/tenancies/${t.id}`} className="font-medium text-blue-600 hover:underline">
                        {t.reference ?? t.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{unitMap[t.unit_id ?? ""] ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums text-[12px]">{t.start_date}{t.end_date ? ` → ${t.end_date}` : ""}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">{fmt(t.rent_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{t.deposit_amount ? fmt(t.deposit_amount) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 border-t border-slate-200">
                  <td className="px-4 py-3 text-[12px] font-semibold text-slate-600" colSpan={3}>Total — {activeTenancies.length} active</td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-800 tabular-nums">{fmt(monthlyRent)}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-800 tabular-nums">{fmt(totalDeposit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
