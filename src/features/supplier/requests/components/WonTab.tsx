"use client"

import React, { useMemo, useState } from "react"
import {
  Trophy, Table2, LayoutGrid, GitBranch, Building2, BadgeCheck, ShieldCheck, CheckCircle2, Circle,
} from "lucide-react"
import {
  SupplierCard, SupplierKpiStrip, SupplierButton, SupplierStatusBadge, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher } from "@/components/supplier-workspace/views"
import { formatPence } from "@/lib/marketplace/money"
import { shortDate } from "@/components/supplier-workspace/format"
import type { PipelineRequest, RequestsEnvelope, EscrowStatus } from "../data/types"
import { TabStateGate, SourceHint } from "./TabScaffold"
import { RequestsPager, Th, Td, useStubAction } from "./primitives"

type ViewId = "table" | "cards" | "pipeline"
const PAGE_SIZE = 8

const ESCROW_TONE: Record<EscrowStatus, "emerald" | "amber" | "slate"> = {
  funded: "emerald", pending: "amber", none: "slate",
}
const ESCROW_LABEL: Record<EscrowStatus, string> = { funded: "Funded", pending: "Pending", none: "—" }

const ONBOARDING_STEPS = ["Review scope", "Upload pre-job docs", "Convert to job", "Schedule", "Notify customer"]

const PIPELINE_COLS = [
  { key: "accepted", label: "Accepted" },
  { key: "ready", label: "Ready to start" },
  { key: "scheduled", label: "Scheduled" },
]

export function WonTab({ env, rows }: { env: RequestsEnvelope<PipelineRequest[]>; rows: PipelineRequest[] }) {
  const [view, setView] = useState<ViewId>("table")
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null)
  const act = useStubAction()

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? rows[0] ?? null, [rows, selectedId])

  const kpis: SupplierKpi[] = useMemo(() => {
    const valueWon = rows.reduce((s, r) => s + (r.wonValuePence ?? 0), 0)
    const awaitingSched = rows.filter((r) => !r.scheduleReady).length
    const escrowFunded = rows.filter((r) => r.escrow === "funded").length
    const readyToStart = rows.filter((r) => r.scheduleReady && r.escrow === "funded").length
    return [
      { label: "Won this month", value: String(rows.length), icon: Trophy },
      { label: "Value won", value: formatPence(valueWon) },
      { label: "Awaiting scheduling", value: String(awaitingSched) },
      { label: "Escrow funded", value: String(escrowFunded) },
      { label: "Ready to start", value: String(readyToStart) },
    ]
  }, [rows])

  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function pipelineCol(r: PipelineRequest): string {
    if (r.scheduleReady && r.escrow === "funded") return "ready"
    return "accepted"
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Won — ready to convert</h2>
          <SourceHint source={env.source} />
        </div>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "table", label: "Table", icon: Table2 },
            { key: "cards", label: "Cards", icon: LayoutGrid },
            { key: "pipeline", label: "Pipeline", icon: GitBranch },
          ]}
        />
      </div>

      <SupplierKpiStrip kpis={kpis} />

      <TabStateGate
        env={env}
        isEmpty={rows.length === 0}
        emptyIcon={Trophy}
        emptyTitle="No won quotes yet"
        emptyDescription="Accepted quotes appear here ready to convert into scheduled jobs. Keep quoting to win more work."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {view === "pipeline" ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {PIPELINE_COLS.map((col) => {
                  const items = rows.filter((r) => pipelineCol(r) === col.key)
                  return (
                    <div key={col.key} className="w-[260px] shrink-0">
                      <div className="flex items-center gap-2 px-1 mb-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h3 className="text-[13px] font-semibold text-slate-700">{col.label}</h3>
                        <span className="ml-auto text-[11px] font-bold text-slate-400">{items.length}</span>
                      </div>
                      <div className="space-y-2.5 rounded-xl bg-slate-50/70 border border-slate-100 p-2 min-h-[120px]">
                        {items.length === 0 ? <p className="text-[12px] text-slate-400 text-center py-6">Nothing here</p> : items.map((r) => (
                          <button key={r.id} onClick={() => setSelectedId(r.id)} className="block w-full text-left bg-white border border-slate-200 rounded-xl shadow-sm p-3">
                            <p className="text-sm font-semibold text-slate-800">{r.customerName}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{r.serviceTitle}</p>
                            <p className="text-xs font-semibold text-emerald-600 mt-1">{formatPence(r.wonValuePence)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : view === "cards" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paged.map((r) => (
                  <SupplierCard key={r.id} className={`p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id === r.id ? "border-emerald-300 ring-1 ring-emerald-200" : ""}`}>
                    <button onClick={() => setSelectedId(r.id)} className="block w-full text-left">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-slate-900">{r.customerName}</p>
                        <SupplierStatusBadge tone={ESCROW_TONE[r.escrow]}>{ESCROW_LABEL[r.escrow]}</SupplierStatusBadge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{r.serviceTitle}</p>
                      <p className="text-lg font-bold text-emerald-600 mt-2">{formatPence(r.wonValuePence)}</p>
                      <p className="text-xs text-slate-400 mt-1">Accepted {shortDate(r.acceptedAt)} · {r.nextStep ?? "—"}</p>
                    </button>
                  </SupplierCard>
                ))}
              </div>
            ) : (
              <SupplierCard className="overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60">
                      <Th>Customer</Th><Th>Property</Th><Th>Service</Th><Th>Won value</Th><Th>Accepted</Th><Th>Escrow</Th><Th>Next step</Th><Th>Ready</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.map((r) => (
                      <tr key={r.id} onClick={() => setSelectedId(r.id)} className={`cursor-pointer hover:bg-slate-50/60 ${selected?.id === r.id ? "bg-emerald-50/40" : ""}`}>
                        <Td className="font-semibold text-slate-800">{r.customerName}</Td>
                        <Td className="text-slate-500 text-xs max-w-[160px] truncate">{r.property.address}</Td>
                        <Td className="text-slate-600 text-xs max-w-[160px] truncate">{r.serviceTitle}</Td>
                        <Td className="font-semibold text-emerald-600 whitespace-nowrap">{formatPence(r.wonValuePence)}</Td>
                        <Td className="text-slate-500 whitespace-nowrap">{shortDate(r.acceptedAt)}</Td>
                        <Td><SupplierStatusBadge tone={ESCROW_TONE[r.escrow]}>{ESCROW_LABEL[r.escrow]}</SupplierStatusBadge></Td>
                        <Td className="text-slate-600 text-xs">{r.nextStep ?? "—"}</Td>
                        <Td>{r.scheduleReady ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-300" />}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </SupplierCard>
            )}
            {(view === "table" || view === "cards") && (
              <RequestsPager page={page} pageSize={PAGE_SIZE} total={rows.length} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} />
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-1">
            {selected && (
              <SupplierCard className="p-5 lg:sticky lg:top-4 space-y-4">
                {/* Customer card */}
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{selected.customerName}</span>
                    {selected.requesterVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                    {selected.customerReturning && <SupplierStatusBadge tone="violet">Returning</SupplierStatusBadge>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Building2 className="w-3 h-3" />{selected.property.address}</p>
                </div>

                {/* Service + price */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">{selected.serviceTitle}</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatPence(selected.wonValuePence)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <ShieldCheck className={`w-4 h-4 ${selected.escrow === "funded" ? "text-emerald-500" : "text-amber-500"}`} />
                    <span className="text-xs text-slate-500">Escrow {ESCROW_LABEL[selected.escrow].toLowerCase()}</span>
                  </div>
                </div>

                {/* Onboarding checklist */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Job onboarding checklist</p>
                  <ul className="space-y-1.5">
                    {ONBOARDING_STEPS.map((step, i) => {
                      const done = selected.scheduleReady ? i < 2 : i < 1
                      return (
                        <li key={step} className="flex items-center gap-2 text-sm">
                          {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-300" />}
                          <span className={done ? "text-slate-400 line-through" : "text-slate-700"}>{step}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <SupplierButton className="w-full" onClick={() => act("Converting to job…", "success")}>Convert to Job</SupplierButton>
                  <div className="grid grid-cols-2 gap-2">
                    <SupplierButton variant="outline" onClick={() => act("Opening scheduler…", "info")}>Schedule Now</SupplierButton>
                    <SupplierButton variant="outline" onClick={() => act("Opening message thread…", "info")}>Message</SupplierButton>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <SupplierButton variant="ghost" onClick={() => act("Opening scope…", "info")}>Review Scope</SupplierButton>
                    <SupplierButton variant="ghost" onClick={() => act("Opening uploader…", "info")}>Upload Doc</SupplierButton>
                  </div>
                </div>
              </SupplierCard>
            )}
          </div>
        </div>
      </TabStateGate>
    </div>
  )
}
