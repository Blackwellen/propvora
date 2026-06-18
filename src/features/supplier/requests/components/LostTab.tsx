"use client"

import React, { useMemo, useState } from "react"
import {
  XCircle, Table2, LayoutGrid, PieChart as PieIcon, BarChart3, Lightbulb,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import {
  SupplierCard, SupplierKpiStrip, SupplierButton, SupplierStatusBadge, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher } from "@/components/supplier-workspace/views"
import { formatPence } from "@/lib/marketplace/money"
import { shortDate } from "@/components/supplier-workspace/format"
import type { PipelineRequest, RequestsEnvelope, LossReason } from "../data/types"
import { TabStateGate, SourceHint } from "./TabScaffold"
import { RequestsPager, Th, Td, useStubAction, MiniDonut, LOSS_REASON_LABEL, type DonutSlice } from "./primitives"

type ViewId = "table" | "cards" | "reasons" | "byservice"
const PAGE_SIZE = 8

const REASON_COLOUR: Record<LossReason, string> = {
  price_too_high: "#dc2626",
  competitor_chosen: "#d97706",
  no_response: "#7c3aed",
  no_coverage: "#0ea5e9",
  other: "#64748b",
}

export function LostTab({ env, rows }: { env: RequestsEnvelope<PipelineRequest[]>; rows: PipelineRequest[] }) {
  const [view, setView] = useState<ViewId>("table")
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null)
  const act = useStubAction()

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? rows[0] ?? null, [rows, selectedId])

  const kpis: SupplierKpi[] = useMemo(() => {
    const lostValue = rows.reduce((s, r) => s + (r.lostValuePence ?? 0), 0)
    const priceLosses = rows.filter((r) => r.lossReason === "price_too_high").length
    const expired = rows.filter((r) => r.quoteStatus === "expired" || r.lossReason === "no_response").length
    const recoverable = rows.filter((r) => r.recoverable).length
    return [
      { label: "Lost this month", value: String(rows.length), icon: XCircle },
      { label: "Lost value", value: formatPence(lostValue) },
      { label: "Price losses", value: String(priceLosses) },
      { label: "Expired responses", value: String(expired) },
      { label: "Recoverable leads", value: String(recoverable) },
    ]
  }, [rows])

  const reasonSlices: DonutSlice[] = useMemo(() => {
    const map = new Map<LossReason, number>()
    for (const r of rows) {
      if (!r.lossReason) continue
      map.set(r.lossReason, (map.get(r.lossReason) ?? 0) + 1)
    }
    return [...map.entries()].map(([reason, count]) => ({
      label: LOSS_REASON_LABEL[reason], value: count, colour: REASON_COLOUR[reason],
    }))
  }, [rows])

  const lostTotalValue = rows.reduce((s, r) => s + (r.lostValuePence ?? 0), 0)

  const byService = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) {
      const key = r.serviceTitle.split(" ").slice(0, 2).join(" ")
      map.set(key, (map.get(key) ?? 0) + (r.lostValuePence ?? 0))
    }
    return [...map.entries()].map(([name, value]) => ({ name, value: Math.round(value / 100) }))
  }, [rows])

  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Lost opportunities</h2>
          <SourceHint source={env.source} />
        </div>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "table", label: "Table", icon: Table2 },
            { key: "cards", label: "Cards", icon: LayoutGrid },
            { key: "reasons", label: "Reasons", icon: PieIcon },
            { key: "byservice", label: "By service", icon: BarChart3 },
          ]}
        />
      </div>

      <SupplierKpiStrip kpis={kpis.slice(0, 4)} />
      <div className="-mt-2"><SupplierKpiStrip kpis={kpis.slice(4)} /></div>

      <TabStateGate
        env={env}
        isEmpty={rows.length === 0}
        emptyIcon={XCircle}
        emptyTitle="No lost opportunities"
        emptyDescription="Quotes that didn't convert appear here with the reason, so you can refine pricing and follow up on recoverable leads."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {view === "reasons" ? (
              <SupplierCard className="p-5">
                <p className="text-sm font-semibold text-slate-700 mb-3">Loss reasons</p>
                <MiniDonut
                  slices={reasonSlices}
                  centerLabel={formatPence(lostTotalValue)}
                  centerSub="total lost"
                />
              </SupplierCard>
            ) : view === "byservice" ? (
              <SupplierCard className="p-5">
                <p className="text-sm font-semibold text-slate-700 mb-3">Lost value by service (£)</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byService} layout="vertical" margin={{ left: 12, right: 12 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip formatter={(v) => `£${Number(v).toLocaleString()}`} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {byService.map((_, i) => <Cell key={i} fill="#dc2626" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SupplierCard>
            ) : view === "cards" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paged.map((r) => (
                  <SupplierCard key={r.id} className={`p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id === r.id ? "border-red-300 ring-1 ring-red-200" : ""}`}>
                    <button onClick={() => setSelectedId(r.id)} className="block w-full text-left">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-slate-900">{r.customerName}</p>
                        {r.lossReason && <SupplierStatusBadge tone="red">{LOSS_REASON_LABEL[r.lossReason]}</SupplierStatusBadge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{r.serviceTitle}</p>
                      <p className="text-sm font-bold text-slate-700 mt-2">{formatPence(r.lostValuePence)}</p>
                      <p className="text-xs text-slate-400 mt-1">Lost {shortDate(r.lostAt)} · {r.recoverable ? "Recoverable" : "Closed"}</p>
                    </button>
                  </SupplierCard>
                ))}
              </div>
            ) : (
              <SupplierCard className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60">
                      <Th>Request</Th><Th>Customer</Th><Th>Lost date</Th><Th>Value</Th><Th>Reason</Th><Th>Recoverable</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.map((r) => (
                      <tr key={r.id} onClick={() => setSelectedId(r.id)} className={`cursor-pointer hover:bg-slate-50/60 ${selected?.id === r.id ? "bg-red-50/40" : ""}`}>
                        <Td><p className="font-semibold text-slate-800 max-w-[180px] truncate">{r.serviceTitle}</p><p className="text-xs text-slate-400">{r.ref}</p></Td>
                        <Td className="text-slate-600">{r.customerName}</Td>
                        <Td className="text-slate-500 whitespace-nowrap">{shortDate(r.lostAt)}</Td>
                        <Td className="font-semibold text-slate-700 whitespace-nowrap">{formatPence(r.lostValuePence)}</Td>
                        <Td>{r.lossReason && <SupplierStatusBadge tone="red">{LOSS_REASON_LABEL[r.lossReason]}</SupplierStatusBadge>}</Td>
                        <Td>{r.recoverable ? <SupplierStatusBadge tone="emerald">Yes</SupplierStatusBadge> : <SupplierStatusBadge tone="slate">No</SupplierStatusBadge>}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SupplierCard>
            )}
            {(view === "table" || view === "cards") && (
              <RequestsPager page={page} pageSize={PAGE_SIZE} total={rows.length} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} />
            )}
          </div>

          {/* Right rail */}
          <div className="lg:col-span-1 space-y-4">
            <SupplierCard className="p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">Loss reasons</p>
              <MiniDonut slices={reasonSlices} centerLabel={formatPence(lostTotalValue)} centerSub="total" />
            </SupplierCard>

            <SupplierCard className="p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5 text-amber-500" />Insights</p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>• {kpis[2].value} losses were on price — consider a tighter margin band.</li>
                <li>• {kpis[4].value} leads are recoverable with a follow-up.</li>
                <li>• Expand coverage to recover no-coverage losses.</li>
              </ul>
            </SupplierCard>

            {selected && (
              <SupplierCard className="p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{selected.ref}</p>
                  <p className="text-sm font-semibold text-slate-900">{selected.serviceTitle}</p>
                  {selected.notes && <p className="text-xs text-slate-500 mt-1">{selected.notes}</p>}
                </div>
                <div className="space-y-2">
                  <SupplierButton variant="outline" className="w-full" onClick={() => act("Opening request…", "info")}>View request</SupplierButton>
                  {selected.recoverable && <SupplierButton className="w-full" onClick={() => act("Reopening lead…", "success")}>Reopen lead</SupplierButton>}
                  <div className="grid grid-cols-2 gap-2">
                    <SupplierButton variant="ghost" onClick={() => act("Duplicating quote template…", "info")}>Duplicate</SupplierButton>
                    <SupplierButton variant="ghost" onClick={() => act("Note added", "info")}>Add note</SupplierButton>
                  </div>
                  <SupplierButton variant="ghost" className="w-full" onClick={() => act("Archived", "warning")}>Archive</SupplierButton>
                </div>
              </SupplierCard>
            )}
          </div>
        </div>
      </TabStateGate>
    </div>
  )
}
