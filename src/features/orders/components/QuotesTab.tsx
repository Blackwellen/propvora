"use client"

import React, { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import {
  FileText, Scale, CheckCircle2, XCircle, PiggyBank, Plus, Download,
  Star, ShieldCheck, Clock, MapPin, ExternalLink,
} from "lucide-react"
import { useRfqs, useQuotes, useQuotesKpis } from "../data/hooks"
import { KpiCard, StatusBadge, ConfirmModal, SourcePill } from "./ui"
import type { QuoteRow } from "../data/types"

const RECO_LABEL: Record<string, { label: string; tone: string }> = {
  best_match: { label: "Best match", tone: "violet" },
  best_value: { label: "Best value", tone: "emerald" },
  lowest_price: { label: "Lowest price", tone: "blue" },
}

export function QuotesTab() {
  const { data: rfqs, source } = useRfqs()
  const { data: quotes } = useQuotes()
  const kpis = useQuotesKpis(rfqs)
  const [selectedRfq, setSelectedRfq] = useState(rfqs[0]?.id ?? null)
  const [confirm, setConfirm] = useState<null | { kind: string; quote?: QuoteRow }>(null)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  const active = rfqs.find(r => r.id === selectedRfq) ?? rfqs[0]

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">{toast}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={FileText} iconBg="bg-[var(--brand-soft)]" iconColor="text-[var(--brand)]" value={kpis.pending} label="Pending quotes" />
        <KpiCard icon={Scale} iconBg="bg-violet-50" iconColor="text-violet-600" value={kpis.awaitingComparison} label="Awaiting comparison" />
        <KpiCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={kpis.approved} label="Approved" />
        <KpiCard icon={XCircle} iconBg="bg-slate-100" iconColor="text-slate-500" value={kpis.expired} label="Expired" />
        <KpiCard icon={PiggyBank} iconBg="bg-amber-50" iconColor="text-amber-600" value={formatPence(kpis.savingsPence)} label="Savings achieved" sub="vs highest quote" subColor="text-emerald-600" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <SourcePill source={source} />
        <div className="flex items-center gap-2">
          <button onClick={() => showToast("Create RFQ — opened")} className="inline-flex items-center gap-1.5 bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white rounded-xl px-3.5 py-2 text-sm font-semibold">
            <Plus className="w-4 h-4" /> Create RFQ
          </button>
          <button onClick={() => showToast("Comparison exported")} className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* RFQ list */}
        <div className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Quote requests</div>
          <div className="divide-y divide-slate-50">
            {rfqs.map(r => (
              <button key={r.id} onClick={() => setSelectedRfq(r.id)}
                className={cn("w-full text-left px-4 py-3 hover:bg-slate-50", selectedRfq === r.id && "bg-[var(--brand-soft)]/40")}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{r.rfqRef}</span>
                  <StatusBadge tone={r.status === "approved" ? "emerald" : r.status === "comparing" ? "violet" : r.status === "expired" ? "slate" : "blue"}>{r.status}</StatusBadge>
                </div>
                <p className="text-sm font-medium text-slate-700 mt-1 leading-tight">{r.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.propertyLabel} · {r.quoteCount} quotes</p>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="flex-1 min-w-0 space-y-4">
          {active && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{active.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{active.rfqRef} · {active.propertyLabel} · {active.orderType}</p>
                </div>
                <Link href={`/property-manager/work/orders/quotes/${active.rfqRef}`} className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] inline-flex items-center gap-1">
                  Full comparison <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map(q => {
              const reco = q.recommendation ? RECO_LABEL[q.recommendation] : null
              return (
                <div key={q.id} className={cn("bg-white border rounded-2xl shadow-sm p-5", reco ? "border-[var(--color-brand-100)] ring-1 ring-[var(--color-brand-100)]" : "border-slate-200")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-bold">{q.supplierInitials}</div>
                      <span className="text-sm font-semibold text-slate-800">{q.supplierName}</span>
                    </div>
                    {reco && <StatusBadge tone={reco.tone}>{reco.label}</StatusBadge>}
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-3">{formatPence(q.priceExVatPence)}<span className="text-xs font-medium text-slate-400"> ex VAT</span></p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 mt-3 text-xs text-slate-600">
                    <Spec icon={Clock} label={`${q.leadTimeLabel}`} />
                    <Spec icon={ShieldCheck} label={`${q.warrantyMonths}mo warranty`} />
                    <Spec icon={ShieldCheck} label={`${formatPence(q.insuranceCoverPence)} cover`} />
                    <Spec icon={Clock} label={`${q.responseHours}h response`} />
                    <Spec icon={MapPin} label={q.coverageArea} />
                    <Spec icon={q.available ? CheckCircle2 : XCircle} label={q.available ? "Available" : "At capacity"} ok={q.available} />
                  </div>
                  <p className="text-xs text-slate-500 mt-3 leading-snug">{q.notes}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={() => setConfirm({ kind: "accept", quote: q })} disabled={q.status === "expired"}
                      className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50">Accept</button>
                    <button onClick={() => showToast(`Revision requested from ${q.supplierName}`)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Revise</button>
                    <button onClick={() => showToast(`Messaged ${q.supplierName}`)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Message</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {confirm?.quote && (
        <ConfirmModal
          title={confirm.kind === "accept" ? "Accept quote" : "Convert to order"}
          message={`Accept the quote from ${confirm.quote.supplierName} at ${formatPence(confirm.quote.priceExVatPence)} ex VAT? This will create an order and fund escrow.`}
          confirmLabel="Accept & convert"
          tone="emerald"
          onConfirm={() => { setConfirm(null); showToast("Quote accepted — order created") }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function Spec({ icon: Icon, label, ok }: { icon: typeof Clock; label: string; ok?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className={cn("w-3.5 h-3.5", ok === false ? "text-red-400" : ok ? "text-emerald-500" : "text-slate-400")} />
      <span className="truncate">{label}</span>
    </span>
  )
}
