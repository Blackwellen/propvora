"use client"

import React, { useMemo, useState } from "react"
import {
  Inbox, Table2, LayoutGrid, Map as MapIcon, Columns3, FileText, Building2,
  BadgeCheck, MapPin, CheckCircle2,
} from "lucide-react"
import {
  SupplierCard, SupplierKpiStrip, SupplierButton, SupplierStatusBadge, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher, SupplierKanban, type KanbanColumn } from "@/components/supplier-workspace/views"
import { formatPence } from "@/lib/marketplace/money"
import { shortDate, daysUntil } from "@/components/supplier-workspace/format"
import type { PipelineRequest, RequestsEnvelope } from "../data/types"
import { TabStateGate, SourceHint } from "./TabScaffold"
import {
  WinScoreRing, UrgencyBadge, RequestsPager, FitCheck, Th, Td, useStubAction,
} from "./primitives"
import { QuoteBuilderWizard } from "./QuoteBuilderWizard"

type ViewId = "cards" | "table" | "map" | "kanban"
const PAGE_SIZE = 8

const KANBAN_COLS: KanbanColumn[] = [
  { key: "high", label: "High urgency", accent: "text-red-600", dot: "bg-red-500" },
  { key: "standard", label: "Standard", accent: "text-sky-600", dot: "bg-sky-500" },
  { key: "low", label: "Low", accent: "text-slate-600", dot: "bg-slate-400" },
]

function budgetRange(r: PipelineRequest): string {
  if (r.budgetMinPence == null && r.budgetMaxPence == null) return "—"
  return `${formatPence(r.budgetMinPence)} – ${formatPence(r.budgetMaxPence)}`
}

export function NewTab({ env, rows }: { env: RequestsEnvelope<PipelineRequest[]>; rows: PipelineRequest[] }) {
  const [view, setView] = useState<ViewId>("cards")
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null)
  const [quoteFor, setQuoteFor] = useState<PipelineRequest | null>(null)
  const act = useStubAction()

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId]
  )

  const kpis: SupplierKpi[] = useMemo(() => {
    const dueToday = rows.filter((r) => daysUntil(r.dueAt) === 0).length
    const potential = rows.reduce((s, r) => s + (r.budgetMaxPence ?? 0), 0)
    const withinCov = rows.filter((r) => r.withinCoverage).length
    const covPct = rows.length > 0 ? Math.round((withinCov / rows.length) * 100) : 0
    const highUrg = rows.filter((r) => r.urgency === "high" || r.urgency === "emergency").length
    return [
      { label: "New requests", value: String(rows.length), sub: "+3 vs yesterday", icon: Inbox },
      { label: "Due today", value: String(dueToday), sub: "vs yesterday" },
      { label: "Potential value", value: formatPence(potential), sub: "+£2,120 vs yesterday" },
      { label: "Within coverage", value: `${covPct}%`, sub: `${withinCov} of ${rows.length} requests` },
      { label: "High urgency", value: String(highUrg), sub: "vs yesterday" },
    ]
  }, [rows])

  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Incoming requests</h2>
          <SourceHint source={env.source} />
        </div>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "cards", label: "Cards", icon: LayoutGrid },
            { key: "table", label: "Table", icon: Table2 },
            { key: "map", label: "Map", icon: MapIcon },
            { key: "kanban", label: "Kanban", icon: Columns3 },
          ]}
        />
      </div>

      <SupplierKpiStrip kpis={kpis} />

      <TabStateGate
        env={env}
        isEmpty={rows.length === 0}
        emptyIcon={Inbox}
        emptyTitle="No new requests"
        emptyDescription="Incoming RFQs from property managers appear here. Keep your services and coverage areas up to date to receive more leads."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: list */}
          <div className="lg:col-span-2 space-y-4">
            {view === "kanban" ? (
              <SupplierKanban<PipelineRequest>
                columns={KANBAN_COLS}
                items={rows}
                getColumn={(r) => (r.urgency === "emergency" ? "high" : r.urgency)}
                getKey={(r) => r.id}
                renderCard={(r) => (
                  <button onClick={() => setSelectedId(r.id)} className="block w-full text-left">
                    <p className="text-sm font-semibold text-slate-800">{r.serviceTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.requesterCompany}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-slate-400">{budgetRange(r)}</span>
                      <WinScoreRing score={r.winScore} size={30} />
                    </div>
                  </button>
                )}
              />
            ) : view === "map" ? (
              <SupplierCard className="p-0 overflow-hidden">
                <div className="relative h-[280px] bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #475569 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
                  <div className="text-center">
                    <MapIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Map view</p>
                    <p className="text-xs text-slate-400 max-w-xs">Requests plotted by property location. Pins reflect coverage match.</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {rows.slice(0, 5).map((r) => (
                    <button key={r.id} onClick={() => setSelectedId(r.id)} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-slate-50">
                      <MapPin className={r.withinCoverage ? "w-4 h-4 text-emerald-500" : "w-4 h-4 text-slate-300"} />
                      <span className="text-sm text-slate-700 flex-1 truncate">{r.property.address ?? "—"}</span>
                      <span className="text-xs text-slate-400">{r.requesterCompany}</span>
                    </button>
                  ))}
                </div>
              </SupplierCard>
            ) : view === "table" ? (
              <SupplierCard className="overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60">
                      <Th>Requester</Th><Th>Service</Th><Th>Urgency</Th><Th>Budget</Th><Th>Due</Th><Th>Score</Th><Th>Docs</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.map((r) => (
                      <tr key={r.id} onClick={() => setSelectedId(r.id)} className={`cursor-pointer hover:bg-slate-50/60 ${selected?.id === r.id ? "bg-blue-50/40" : ""}`}>
                        <Td>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{r.requesterCompany}</span>
                            {r.requesterVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                          </div>
                          <p className="text-xs text-slate-400">{r.property.address}</p>
                        </Td>
                        <Td className="text-slate-600">{r.serviceTitle}</Td>
                        <Td><UrgencyBadge urgency={r.urgency} /></Td>
                        <Td className="text-slate-600 whitespace-nowrap">{budgetRange(r)}</Td>
                        <Td className="text-slate-600 whitespace-nowrap">{shortDate(r.dueAt)}</Td>
                        <Td><WinScoreRing score={r.winScore} size={34} /></Td>
                        <Td className="text-slate-500">{r.files.length}/{r.docsRequired}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </SupplierCard>
            ) : (
              <div className="space-y-3">
                {paged.map((r) => (
                  <SupplierCard
                    key={r.id}
                    className={`p-4 cursor-pointer transition-all hover:border-slate-300 hover:shadow-md ${selected?.id === r.id ? "border-blue-300 ring-1 ring-blue-200" : ""}`}
                  >
                    <button onClick={() => setSelectedId(r.id)} className="block w-full text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 truncate">{r.requesterCompany}</span>
                            {r.requesterVerified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">{r.serviceTitle}</p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{r.property.address}</p>
                        </div>
                        <WinScoreRing score={r.winScore} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                        <UrgencyBadge urgency={r.urgency} />
                        <span className="text-slate-500">{budgetRange(r)}</span>
                        <span className="text-slate-400">Due {shortDate(r.dueAt)}</span>
                        <span className="flex items-center gap-1 text-slate-400"><FileText className="w-3 h-3" />{r.files.length}/{r.docsRequired}</span>
                        {r.withinCoverage && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />In coverage</span>}
                      </div>
                    </button>
                  </SupplierCard>
                ))}
              </div>
            )}
            {(view === "cards" || view === "table") && (
              <RequestsPager
                page={page} pageSize={PAGE_SIZE} total={rows.length}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            )}
          </div>

          {/* Right: detail panel */}
          <div className="lg:col-span-1">
            {selected && <NewDetailPanel r={selected} act={act} onSendQuote={() => setQuoteFor(selected)} />}
          </div>
        </div>
      </TabStateGate>

      {quoteFor && (
        <QuoteBuilderWizard
          request={quoteFor}
          onClose={() => setQuoteFor(null)}
          onSubmitted={env.reload}
        />
      )}
    </div>
  )
}

function NewDetailPanel({ r, act, onSendQuote }: { r: PipelineRequest; act: (l: string, t?: "success" | "error" | "info" | "warning") => void; onSendQuote: () => void }) {
  const rec = r.recommendation
  return (
    <SupplierCard className="p-5 lg:sticky lg:top-4 space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{r.ref}</span>
          <UrgencyBadge urgency={r.urgency} />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mt-1">{r.serviceTitle}</h3>
        <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
          <Building2 className="w-3.5 h-3.5" />{r.requesterCompany}
          {r.requesterVerified && <SupplierStatusBadge tone="blue">Verified</SupplierStatusBadge>}
        </div>
      </div>

      {/* Scope */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1">Scope summary</p>
        <p className="text-sm text-slate-700">{r.scopeSummary}</p>
        {r.scopeBullets.length > 0 && (
          <ul className="mt-2 space-y-1">
            {r.scopeBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />{b}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Photos / files */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">Photos &amp; files ({r.files.length})</p>
        {r.files.length === 0 ? (
          <p className="text-xs text-slate-400">No files attached.</p>
        ) : (
          <div className="space-y-1.5">
            {r.files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-700 flex-1 truncate">{f.fileName}</span>
                <SupplierStatusBadge status={f.status} />
              </div>
            ))}
          </div>
        )}
        <button onClick={() => act("Add file — opening uploader", "info")} className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700">+ Add file</button>
      </div>

      {/* Property details */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1.5">Property details</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <PropRow k="Type" v={r.property.type} />
          <PropRow k="Year" v={r.property.year} />
          <PropRow k="Tenure" v={r.property.tenure} />
          <PropRow k="Heating" v={r.property.heating} />
          <PropRow k="Bedrooms" v={r.property.bedrooms} />
          <PropRow k="Units" v={r.property.units} />
        </dl>
      </div>

      {/* Quote recommendation */}
      <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-3">
        <p className="text-xs font-semibold text-blue-700 mb-2">Quote recommendation</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Stat label="Suggested" value={formatPence(rec.suggestedPricePence)} />
          <Stat label="Margin est." value={rec.marginEstPct == null ? "—" : `${rec.marginEstPct}%`} />
          <Stat label="Win prob." value={rec.winProbabilityPct == null ? "—" : `${rec.winProbabilityPct}%`} />
        </div>
        {rec.fitChecks.length > 0 && (
          <>
            <p className="text-[11px] font-semibold text-slate-500 mb-1">Why it's a good fit</p>
            <ul className="space-y-1">
              {rec.fitChecks.map((c, i) => <FitCheck key={i} label={c.label} ok={c.ok} />)}
            </ul>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <SupplierButton className="w-full" onClick={onSendQuote}>Send Quote</SupplierButton>
        <div className="grid grid-cols-2 gap-2">
          <SupplierButton variant="outline" onClick={() => act("Question sent to requester", "info")}>Ask Question</SupplierButton>
          <SupplierButton variant="outline" onClick={() => act("Marked as reviewing", "info")}>Mark Reviewing</SupplierButton>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SupplierButton variant="ghost" onClick={() => act("Opening full scope…", "info")}>View full scope</SupplierButton>
          <SupplierButton variant="ghost" onClick={() => act("Request declined", "warning")}>Decline</SupplierButton>
        </div>
      </div>
    </SupplierCard>
  )
}

function PropRow({ k, v }: { k: string; v: string | number | null }) {
  return (
    <div className="flex flex-col">
      <dt className="text-slate-400">{k}</dt>
      <dd className="font-medium text-slate-700">{v ?? "—"}</dd>
    </div>
  )
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center rounded-lg bg-white border border-slate-200 py-1.5">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-xs font-bold text-slate-900">{value}</p>
    </div>
  )
}
