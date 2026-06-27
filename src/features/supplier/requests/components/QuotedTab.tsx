"use client"

import React, { useMemo, useState } from "react"
import {
  Table2, LayoutGrid, Columns3, CalendarClock, Send, Clock, Building2, History,
} from "lucide-react"
import {
  SupplierCard, SupplierKpiStrip, SupplierButton, SupplierStatusBadge, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher, SupplierKanban, type KanbanColumn } from "@/components/supplier-workspace/views"
import { formatPence } from "@/lib/marketplace/money"
import { shortDate, daysUntil } from "@/components/supplier-workspace/format"
import type { PipelineRequest, RequestsEnvelope, QuoteStatus } from "../data/types"
import { TabStateGate, SourceHint } from "./TabScaffold"
import { WinChanceBar, RequestsPager, Th, Td, useStubAction } from "./primitives"

type ViewId = "table" | "cards" | "kanban" | "timeline"
const PAGE_SIZE = 8

const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  awaiting: "Awaiting", revision_requested: "Revision", expiring: "Expiring",
  accepted: "Accepted", withdrawn: "Withdrawn", expired: "Expired",
}
const QUOTE_STATUS_TONE: Record<QuoteStatus, "blue" | "amber" | "red" | "emerald" | "slate"> = {
  awaiting: "blue", revision_requested: "amber", expiring: "red",
  accepted: "emerald", withdrawn: "slate", expired: "slate",
}

const KANBAN_COLS: KanbanColumn[] = [
  { key: "awaiting", label: "Awaiting decision", accent: "text-[var(--brand)]", dot: "bg-[var(--brand)]" },
  { key: "revision_requested", label: "Revision requested", accent: "text-amber-600", dot: "bg-amber-500" },
  { key: "expiring", label: "Expiring soon", accent: "text-red-600", dot: "bg-red-500" },
]

function expiryCountdown(iso: string | null): string {
  const d = daysUntil(iso)
  if (d == null) return "No expiry"
  if (d < 0) return `Expired ${Math.abs(d)}d ago`
  if (d === 0) return "Expires today"
  return `${d}d left`
}

export function QuotedTab({ env, rows }: { env: RequestsEnvelope<PipelineRequest[]>; rows: PipelineRequest[] }) {
  const [view, setView] = useState<ViewId>("table")
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null)
  const [draft, setDraft] = useState("")
  const act = useStubAction()

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? rows[0] ?? null, [rows, selectedId])

  const kpis: SupplierKpi[] = useMemo(() => {
    const awaiting = rows.filter((r) => r.quoteStatus === "awaiting").length
    const expiring = rows.filter((r) => { const d = daysUntil(r.quoteExpiresAt); return d != null && d >= 0 && d <= 2 }).length
    const revision = rows.filter((r) => r.quoteStatus === "revision_requested").length
    const total = rows.reduce((s, r) => s + (r.quoteIncVatPence ?? 0), 0)
    return [
      { label: "Quotes sent", value: String(rows.length), icon: Send },
      { label: "Awaiting decision", value: String(awaiting) },
      { label: "Expiring soon", value: String(expiring), sub: "≤ 2 days" },
      { label: "Revision requested", value: String(revision) },
      { label: "Total quoted value", value: formatPence(total) },
    ]
  }, [rows])

  const paged = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function sendMessage() {
    if (!draft.trim()) return
    act("Message sent to customer", "success")
    setDraft("")
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Quotes awaiting decision</h2>
          <SourceHint source={env.source} />
        </div>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "table", label: "Table", icon: Table2 },
            { key: "cards", label: "Cards", icon: LayoutGrid },
            { key: "kanban", label: "Kanban", icon: Columns3 },
            { key: "timeline", label: "Timeline", icon: CalendarClock },
          ]}
        />
      </div>

      <SupplierKpiStrip kpis={kpis} />

      <TabStateGate
        env={env}
        isEmpty={rows.length === 0}
        emptyIcon={Send}
        emptyTitle="No quotes sent yet"
        emptyDescription="Quotes you send to property managers appear here while awaiting their decision. Respond to new requests to build your pipeline."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {view === "kanban" ? (
              <SupplierKanban<PipelineRequest>
                columns={KANBAN_COLS}
                items={rows}
                getColumn={(r) => r.quoteStatus ?? "awaiting"}
                getKey={(r) => r.id}
                renderCard={(r) => (
                  <button onClick={() => setSelectedId(r.id)} className="block w-full text-left">
                    <p className="text-sm font-semibold text-slate-800">{r.customerName}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{r.serviceTitle}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold text-slate-700">{formatPence(r.quoteIncVatPence)}</span>
                      <span className="text-[11px] text-red-500">{expiryCountdown(r.quoteExpiresAt)}</span>
                    </div>
                  </button>
                )}
              />
            ) : view === "timeline" ? (
              <SupplierCard className="p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500">By expiry</p>
                {[...rows].sort((a, b) => (daysUntil(a.quoteExpiresAt) ?? 999) - (daysUntil(b.quoteExpiresAt) ?? 999)).map((r) => {
                  const d = daysUntil(r.quoteExpiresAt)
                  return (
                    <button key={r.id} onClick={() => setSelectedId(r.id)} className="flex items-center gap-3 w-full text-left">
                      <div className={`w-1.5 h-10 rounded-full ${d != null && d <= 1 ? "bg-red-500" : d != null && d <= 3 ? "bg-amber-500" : "bg-slate-300"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.customerName} · {r.serviceTitle}</p>
                        <p className="text-xs text-slate-400">{expiryCountdown(r.quoteExpiresAt)} · {formatPence(r.quoteIncVatPence)}</p>
                      </div>
                      <Clock className="w-4 h-4 text-slate-300" />
                    </button>
                  )
                })}
              </SupplierCard>
            ) : view === "cards" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paged.map((r) => (
                  <SupplierCard key={r.id} className={`p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id === r.id ? "border-[var(--color-brand-300)] ring-1 ring-[var(--color-brand-100)]" : ""}`}>
                    <button onClick={() => setSelectedId(r.id)} className="block w-full text-left">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-slate-900">{r.customerName}</p>
                        {r.quoteStatus && <SupplierStatusBadge tone={QUOTE_STATUS_TONE[r.quoteStatus]}>{QUOTE_STATUS_LABEL[r.quoteStatus]}</SupplierStatusBadge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{r.serviceTitle}</p>
                      <p className="text-lg font-bold text-slate-900 mt-2">{formatPence(r.quoteIncVatPence)}<span className="text-xs font-normal text-slate-400"> inc VAT</span></p>
                      <div className="mt-2"><WinChanceBar pct={r.winChance} /></div>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                        <span>Sent {shortDate(r.quoteSentAt)}</span>
                        <span className="text-red-500 font-medium">{expiryCountdown(r.quoteExpiresAt)}</span>
                      </div>
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
                      <Th>Customer</Th><Th>Quote (inc VAT)</Th><Th>Sent</Th><Th>Expiry</Th><Th>Status</Th><Th>Win chance</Th><Th>Follow-up</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.map((r) => (
                      <tr key={r.id} onClick={() => setSelectedId(r.id)} className={`cursor-pointer hover:bg-slate-50/60 ${selected?.id === r.id ? "bg-[var(--brand-soft)]/40" : ""}`}>
                        <Td>
                          <p className="font-semibold text-slate-800">{r.customerName}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[180px]">{r.serviceTitle}</p>
                        </Td>
                        <Td className="font-semibold text-slate-800 whitespace-nowrap">{formatPence(r.quoteIncVatPence)}</Td>
                        <Td className="text-slate-500 whitespace-nowrap">{shortDate(r.quoteSentAt)}</Td>
                        <Td className="text-red-500 whitespace-nowrap text-xs font-medium">{expiryCountdown(r.quoteExpiresAt)}</Td>
                        <Td>{r.quoteStatus && <SupplierStatusBadge tone={QUOTE_STATUS_TONE[r.quoteStatus]}>{QUOTE_STATUS_LABEL[r.quoteStatus]}</SupplierStatusBadge>}</Td>
                        <Td><WinChanceBar pct={r.winChance} /></Td>
                        <Td className="text-slate-500 whitespace-nowrap text-xs">{r.followUpAt ? shortDate(r.followUpAt) : "—"}</Td>
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

          {/* Selected quote panel */}
          <div className="lg:col-span-1">
            {selected && (
              <SupplierCard className="p-5 lg:sticky lg:top-4 space-y-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{selected.ref}</span>
                  <h3 className="text-base font-semibold text-slate-900 mt-1">{selected.serviceTitle}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5"><Building2 className="w-3.5 h-3.5" />{selected.customerName}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{formatPence(selected.quoteIncVatPence)}<span className="text-xs font-normal text-slate-400"> inc VAT</span></p>
                </div>

                {/* Version history */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><History className="w-3.5 h-3.5" />Version history</p>
                  <div className="space-y-1.5">
                    {selected.versions.length === 0 ? (
                      <p className="text-xs text-slate-400">No revisions.</p>
                    ) : selected.versions.map((v) => (
                      <div key={v.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5">
                        <div>
                          <p className="text-xs font-medium text-slate-700">v{v.version} · {v.label}</p>
                          {v.note && <p className="text-[11px] text-slate-400">{v.note}</p>}
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{formatPence(v.totalIncVatPence)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer thread */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Customer thread</p>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {selected.messages.length === 0 ? (
                      <p className="text-xs text-slate-400">No messages yet.</p>
                    ) : selected.messages.map((m) => (
                      <div key={m.id} className={`rounded-lg px-3 py-2 text-xs ${m.authorRole === "supplier" ? "bg-[var(--brand-soft)] text-slate-700" : "bg-slate-100 text-slate-700"}`}>
                        <p className="font-semibold text-[11px] text-slate-500 mb-0.5">{m.authorName} · {shortDate(m.createdAt)}</p>
                        {m.body}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendMessage() }}
                      placeholder="Reply to customer…"
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    />
                    <SupplierButton size="sm" onClick={sendMessage}>Send</SupplierButton>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <SupplierButton variant="outline" onClick={() => act("Opening quote…", "info")}>View quote</SupplierButton>
                    <SupplierButton variant="outline" onClick={() => act("Opening quote editor…", "info")}>Edit quote</SupplierButton>
                  </div>
                  <SupplierButton className="w-full" onClick={() => act("Follow-up sent", "success")}>Send follow-up</SupplierButton>
                  {selected.quoteStatus === "accepted" ? (
                    <SupplierButton className="w-full" onClick={() => act("Converting to job…", "success")}>Convert to job</SupplierButton>
                  ) : (
                    <SupplierButton variant="ghost" className="w-full" onClick={() => act("Quote withdrawn", "warning")}>Withdraw quote</SupplierButton>
                  )}
                </div>
              </SupplierCard>
            )}
          </div>
        </div>
      </TabStateGate>
    </div>
  )
}
