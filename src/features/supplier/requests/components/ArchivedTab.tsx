"use client"

import React, { useMemo, useState } from "react"
import { Archive, Table2, List, FileText, RotateCcw, Building2 } from "lucide-react"
import {
  SupplierCard, SupplierKpiStrip, SupplierButton, SupplierStatusBadge, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher } from "@/components/supplier-workspace/views"
import { formatPence } from "@/lib/marketplace/money"
import { shortDate, daysUntil } from "@/components/supplier-workspace/format"
import type { PipelineRequest, RequestsEnvelope, Outcome } from "../data/types"
import { TabStateGate, SourceHint } from "./TabScaffold"
import { RequestsPager, Th, Td, useStubAction } from "./primitives"

type ViewId = "table" | "list" | "detail"
const PAGE_SIZE = 8

const OUTCOME_TONE: Record<Outcome, "emerald" | "red"> = { won: "emerald", lost: "red" }

function reactivationLabel(r: PipelineRequest): { eligible: boolean; text: string; daysLeft: number | null } {
  const d = daysUntil(r.reactivationUntil)
  if (r.reactivationUntil && d != null && d > 0) return { eligible: true, text: `Eligible · ${d} days left`, daysLeft: d }
  return { eligible: false, text: "Not eligible", daysLeft: null }
}

export function ArchivedTab({ env, rows }: { env: RequestsEnvelope<PipelineRequest[]>; rows: PipelineRequest[] }) {
  const [view, setView] = useState<ViewId>("table")
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null)
  const act = useStubAction()

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? rows[0] ?? null, [rows, selectedId])

  const kpis: SupplierKpi[] = useMemo(() => {
    const thisMonth = rows.filter((r) => { const d = daysUntil(r.archivedAt); return d != null && d >= -30 }).length
    const reopenEligible = rows.filter((r) => reactivationLabel(r).eligible).length
    const totalValue = rows.reduce((s, r) => s + (r.wonValuePence ?? r.lostValuePence ?? 0), 0)
    return [
      { label: "Archived requests", value: String(rows.length), icon: Archive },
      { label: "Archived this month", value: String(thisMonth) },
      { label: "Reopen eligible", value: String(reopenEligible) },
      { label: "Total historical value", value: formatPence(totalValue) },
    ]
  }, [rows])

  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Archive</h2>
          <SourceHint source={env.source} />
        </div>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "table", label: "Table", icon: Table2 },
            { key: "list", label: "List", icon: List },
            { key: "detail", label: "Detail", icon: FileText },
          ]}
        />
      </div>

      <SupplierKpiStrip kpis={kpis} />

      <TabStateGate
        env={env}
        isEmpty={rows.length === 0}
        emptyIcon={Archive}
        emptyTitle="Nothing archived"
        emptyDescription="Completed and closed requests are archived here for your records. Eligible ones can be restored within the reactivation window."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {view === "list" ? (
              <div className="space-y-2">
                {paged.map((r) => {
                  const ra = reactivationLabel(r)
                  return (
                    <SupplierCard key={r.id} className={`p-3 cursor-pointer hover:shadow-sm transition-all ${selected?.id === r.id ? "border-slate-300 ring-1 ring-slate-200" : ""}`}>
                      <button onClick={() => setSelectedId(r.id)} className="flex items-center gap-3 w-full text-left">
                        <Archive className="w-4 h-4 text-slate-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{r.serviceTitle}</p>
                          <p className="text-xs text-slate-400">{r.customerName} · Archived {shortDate(r.archivedAt)}</p>
                        </div>
                        {r.outcome && <SupplierStatusBadge tone={OUTCOME_TONE[r.outcome]}>{r.outcome === "won" ? "Won" : "Lost"}</SupplierStatusBadge>}
                        <span className={`text-[11px] font-medium ${ra.eligible ? "text-emerald-600" : "text-slate-400"}`}>{ra.eligible ? `${ra.daysLeft}d` : "—"}</span>
                      </button>
                    </SupplierCard>
                  )
                })}
              </div>
            ) : view === "detail" ? (
              <div className="space-y-3">
                {paged.map((r) => {
                  const ra = reactivationLabel(r)
                  return (
                    <SupplierCard key={r.id} className={`p-4 cursor-pointer ${selected?.id === r.id ? "border-slate-300 ring-1 ring-slate-200" : ""}`}>
                      <button onClick={() => setSelectedId(r.id)} className="block w-full text-left">
                        <div className="flex items-start justify-between">
                          <p className="font-semibold text-slate-900">{r.serviceTitle}</p>
                          {r.outcome && <SupplierStatusBadge tone={OUTCOME_TONE[r.outcome]}>{r.outcome === "won" ? "Won" : "Lost"}</SupplierStatusBadge>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{r.customerName} · {r.property.address}</p>
                        <p className="text-xs text-slate-400 mt-1">{r.archiveReason}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-500">{formatPence(r.wonValuePence ?? r.lostValuePence)}</span>
                          <span className={ra.eligible ? "text-emerald-600 font-medium" : "text-slate-400"}>{ra.text}</span>
                        </div>
                      </button>
                    </SupplierCard>
                  )
                })}
              </div>
            ) : (
              <SupplierCard className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60">
                      <Th>Request</Th><Th>Customer</Th><Th>Archived</Th><Th>Value</Th><Th>Outcome</Th><Th>Reason</Th><Th>Reactivation</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.map((r) => {
                      const ra = reactivationLabel(r)
                      return (
                        <tr key={r.id} onClick={() => setSelectedId(r.id)} className={`cursor-pointer hover:bg-slate-50/60 ${selected?.id === r.id ? "bg-slate-100/60" : ""}`}>
                          <Td><p className="font-semibold text-slate-800 max-w-[170px] truncate">{r.serviceTitle}</p><p className="text-xs text-slate-400">{r.ref}</p></Td>
                          <Td className="text-slate-600">{r.customerName}</Td>
                          <Td className="text-slate-500 whitespace-nowrap">{shortDate(r.archivedAt)}</Td>
                          <Td className="font-semibold text-slate-700 whitespace-nowrap">{formatPence(r.wonValuePence ?? r.lostValuePence)}</Td>
                          <Td>{r.outcome && <SupplierStatusBadge tone={OUTCOME_TONE[r.outcome]}>{r.outcome === "won" ? "Won" : "Lost"}</SupplierStatusBadge>}</Td>
                          <Td className="text-slate-500 text-xs max-w-[160px] truncate">{r.archiveReason}</Td>
                          <Td className={`text-xs font-medium ${ra.eligible ? "text-emerald-600" : "text-slate-400"}`}>{ra.text}</Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </SupplierCard>
            )}
            {(view === "table" || view === "detail") && (
              <RequestsPager page={page} pageSize={PAGE_SIZE} total={rows.length} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} />
            )}
          </div>

          {/* Bottom detail panel */}
          <div className="lg:col-span-1">
            {selected && (() => {
              const ra = reactivationLabel(selected)
              const progress = ra.daysLeft != null ? Math.max(0, Math.min(100, Math.round((ra.daysLeft / 30) * 100))) : 0
              return (
                <SupplierCard className="p-5 lg:sticky lg:top-4 space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{selected.ref}</span>
                    <h3 className="text-base font-semibold text-slate-900 mt-1">{selected.serviceTitle}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5"><Building2 className="w-3.5 h-3.5" />{selected.customerName}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Archived summary</p>
                    <p className="text-sm text-slate-700">{selected.archiveReason}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Original summary</p>
                    <p className="text-sm text-slate-600">{selected.scopeSummary}</p>
                  </div>

                  {/* Reactivation status */}
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-500">Reactivation</span>
                      <span className={`text-xs font-medium ${ra.eligible ? "text-emerald-600" : "text-slate-400"}`}>{ra.text}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${ra.eligible ? "bg-emerald-500" : "bg-slate-300"}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {selected.notes && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
                      <p className="text-xs text-slate-500">{selected.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    <SupplierButton variant="outline" className="w-full" onClick={() => act("Opening request…", "info")}>View request</SupplierButton>
                    <SupplierButton
                      className="w-full"
                      disabled={!ra.eligible}
                      onClick={() => act(ra.eligible ? "Restoring…" : "Not eligible to restore", ra.eligible ? "success" : "warning")}
                    >
                      <RotateCcw className="w-4 h-4" /> Restore
                    </SupplierButton>
                    <div className="grid grid-cols-2 gap-2">
                      <SupplierButton variant="ghost" onClick={() => act("Exporting data…", "info")}>Export data</SupplierButton>
                      <SupplierButton variant="ghost" onClick={() => act("Note added", "info")}>Add note</SupplierButton>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <SupplierButton variant="ghost" onClick={() => act("Opening original request…", "info")}>Orig. request</SupplierButton>
                      <SupplierButton variant="ghost" disabled={selected.outcome !== "won"} onClick={() => act("Opening original job…", "info")}>Orig. job</SupplierButton>
                    </div>
                  </div>
                </SupplierCard>
              )
            })()}
          </div>
        </div>
      </TabStateGate>
    </div>
  )
}
