"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  CheckCircle2, Banknote, Timer, Star, Archive, Download, RotateCcw,
  Package, MessageSquarePlus, CalendarPlus,
} from "lucide-react"
import { useCompletedOrders, useCompletedKpis } from "../data/hooks"
import { KpiCard, StatusBadge, PagerFooter, SourcePill } from "./ui"
import type { CompletedOrderRow } from "../data/types"

export function CompletedTab() {
  const { data: rows, loading, source } = useCompletedOrders()
  const kpis = useCompletedKpis(rows)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }
  const selected = rows.find(r => r.id === selectedId) ?? null

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">{toast}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={kpis.completedThisMonth} label="Completed this month" />
        <KpiCard icon={Banknote} iconBg="bg-blue-50" iconColor="text-blue-600" value={formatPence(kpis.paidOutPence)} label="Paid out" />
        <KpiCard icon={Timer} iconBg="bg-violet-50" iconColor="text-violet-600" value={`${kpis.avgCompletionDays}d`} label="Avg completion time" />
        <KpiCard icon={Star} iconBg="bg-amber-50" iconColor="text-amber-600" value={kpis.ratedJobs} label="Rated jobs" />
      </div>

      <div className="flex justify-end"><SourcePill source={source} /></div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Property / Location</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Completed</th>
                  <th className="px-4 py-3 font-semibold">Final cost</th>
                  <th className="px-4 py-3 font-semibold">Payout</th>
                  <th className="px-4 py-3 font-semibold">Evidence</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={9} className="px-4 py-4"><div className="h-5 bg-slate-50 rounded animate-pulse" /></td></tr>)
                  : rows.map(r => (
                    <tr key={r.id} onClick={() => setSelectedId(r.id)} className={cn("border-b border-slate-50 cursor-pointer hover:bg-slate-50", selectedId === r.id && "bg-blue-50/40")}>
                      <td className="px-4 py-3 font-semibold text-slate-800">{r.orderRef}</td>
                      <td className="px-4 py-3"><p className="font-medium text-slate-800">{r.propertyLabel}</p><p className="text-xs text-slate-500">{r.location}</p></td>
                      <td className="px-4 py-3 text-slate-600">{r.orderType}</td>
                      <td className="px-4 py-3 text-slate-600">{r.supplierName}</td>
                      <td className="px-4 py-3 text-slate-600">{r.completedDate ? new Date(r.completedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatPence(r.finalCostPence)}</td>
                      <td className="px-4 py-3"><StatusBadge tone={r.payoutStatus === "paid" ? "emerald" : r.payoutStatus === "reversed" ? "red" : "amber"}>{r.payoutStatus}</StatusBadge></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.evidenceBundle}</td>
                      <td className="px-4 py-3"><RatingStars value={r.rating} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <PagerFooter shown={rows.length} total={rows.length} />
        </div>

        <div className="w-full xl:w-80 shrink-0">
          {selected ? (
            <CompletedDetail row={selected} onAction={showToast} />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">Select a completed order</p>
              <p className="text-xs text-slate-400 mt-1">See completion summary, evidence, invoice and follow-ups.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RatingStars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("w-3.5 h-3.5", i < value ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
      ))}
    </span>
  )
}

function CompletedDetail({ row, onAction }: { row: CompletedOrderRow; onAction: (m: string) => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{row.orderRef}</h3>
        <p className="text-xs text-slate-500 mt-1">{row.propertyLabel} · {row.location}</p>
      </div>
      <div className="p-5 border-b border-slate-100 space-y-2 text-sm">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">Completion summary</p>
        <Row label="Supplier" value={row.supplierName} />
        <Row label="Completed" value={row.completedDate ? new Date(row.completedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
        <Row label="Final cost" value={formatPence(row.finalCostPence)} />
        <Row label="Evidence" value={row.evidenceBundle} />
      </div>
      <div className="p-5 border-b border-slate-100">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Rating</p>
        <RatingStars value={row.rating} />
      </div>
      <div className="p-5">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-3">Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <Btn icon={Archive} label="Archive" onClick={() => onAction("Order archived")} />
          <Btn icon={Download} label="Download pack" onClick={() => onAction("Pack downloaded")} />
          <Btn icon={RotateCcw} label="Rebook" onClick={() => onAction("Rebook started")} />
          <Btn icon={Package} label="Export" onClick={() => onAction("Exported")} />
          <Btn icon={MessageSquarePlus} label="Leave review" onClick={() => onAction("Review saved")} />
          <Btn icon={CalendarPlus} label="Inspection" onClick={() => onAction("Inspection scheduled")} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-800">{value}</span></div>
}
function Btn({ icon: Icon, label, onClick }: { icon: typeof Archive; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  )
}
