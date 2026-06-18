"use client"

import React, { useState } from "react"
import Link from "next/link"
import { formatPence } from "@/lib/marketplace/money"
import { ArrowLeft, Plus, MessageSquare, RefreshCw, ShoppingCart, CheckCircle2 } from "lucide-react"
import { useQuoteRequestDetail } from "../data/hooks"
import { DetailTabs } from "./DetailTabs"
import { StatusBadge, ConfirmModal } from "./ui"
import type { QuoteRow } from "../data/types"

type Tab = "comparison" | "request" | "activity"
const TABS: { key: Tab; label: string }[] = [
  { key: "comparison", label: "Quote comparison" },
  { key: "request", label: "Request details" },
  { key: "activity", label: "Activity" },
]
const RECO: Record<string, { label: string; tone: string }> = {
  best_match: { label: "Best match", tone: "violet" },
  best_value: { label: "Best value", tone: "emerald" },
  lowest_price: { label: "Lowest price", tone: "blue" },
}

export function QuoteComparisonView({ quoteRequestId }: { quoteRequestId: string }) {
  const { rfq, quotes, activity, loading } = useQuoteRequestDetail(quoteRequestId)
  const [tab, setTab] = useState<Tab>("comparison")
  const [confirm, setConfirm] = useState<null | { kind: string; quote?: QuoteRow }>(null)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading comparison…</div>

  return (
    <div className="flex flex-col gap-5 px-4 md:px-6 py-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">{toast}</div>}

      <Link href="/app/work/orders?tab=quotes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to quotes
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-xl font-bold text-slate-900">{rfq.rfqRef}</h1><StatusBadge tone="violet">{rfq.status}</StatusBadge></div>
          <p className="text-sm text-slate-500 mt-1">{rfq.title} · {rfq.propertyLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => showToast("New RFQ started")} className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3 py-2 text-sm font-semibold"><Plus className="w-4 h-4" /> Create RFQ</button>
          <button onClick={() => setConfirm({ kind: "convert" })} className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold"><ShoppingCart className="w-4 h-4" /> Convert to order</button>
        </div>
      </div>

      <DetailTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "comparison" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Price ex VAT</th>
                  <th className="px-4 py-3 font-semibold">ETA</th>
                  <th className="px-4 py-3 font-semibold">Warranty</th>
                  <th className="px-4 py-3 font-semibold">Insurance</th>
                  <th className="px-4 py-3 font-semibold">Response</th>
                  <th className="px-4 py-3 font-semibold">Coverage</th>
                  <th className="px-4 py-3 font-semibold">Available</th>
                  <th className="px-4 py-3 font-semibold">Label</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => {
                  const reco = q.recommendation ? RECO[q.recommendation] : null
                  return (
                    <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{q.supplierName}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatPence(q.priceExVatPence)}</td>
                      <td className="px-4 py-3 text-slate-600">{q.leadTimeLabel}</td>
                      <td className="px-4 py-3 text-slate-600">{q.warrantyMonths}mo</td>
                      <td className="px-4 py-3 text-slate-600">{formatPence(q.insuranceCoverPence)}</td>
                      <td className="px-4 py-3 text-slate-600">{q.responseHours}h</td>
                      <td className="px-4 py-3 text-slate-600">{q.coverageArea}</td>
                      <td className="px-4 py-3">{q.available ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <span className="text-xs text-red-500">No</span>}</td>
                      <td className="px-4 py-3">{reco ? <StatusBadge tone={reco.tone}>{reco.label}</StatusBadge> : <span className="text-xs text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => setConfirm({ kind: "accept", quote: q })} disabled={!q.available} className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50">Accept</button>
                          <button onClick={() => showToast(`Revision requested from ${q.supplierName}`)} className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white" aria-label="Request revision"><RefreshCw className="w-3.5 h-3.5" /></button>
                          <button onClick={() => showToast(`Messaged ${q.supplierName}`)} className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white" aria-label="Message supplier"><MessageSquare className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "request" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 max-w-xl space-y-2 text-sm">
          <KV label="RFQ ref" value={rfq.rfqRef} />
          <KV label="Title" value={rfq.title} />
          <KV label="Property" value={rfq.propertyLabel} />
          <KV label="Order type" value={rfq.orderType} />
          <KV label="Quotes received" value={String(rfq.quoteCount)} />
          <KV label="Best price" value={formatPence(rfq.bestPricePence)} />
          <KV label="Estimated savings" value={formatPence(rfq.savingsPence)} />
          <KV label="Created" value={new Date(rfq.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
        </div>
      )}

      {tab === "activity" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex flex-col divide-y divide-slate-100">
            {activity.map(a => (
              <div key={a.id} className="py-2.5 flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" /><div><p className="text-sm text-slate-700">{a.text}</p><p className="text-xs text-slate-400">{a.actor} · {a.at}</p></div></div>
            ))}
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.kind === "accept" ? "Accept quote" : "Convert to order"}
          message={confirm.quote ? `Accept ${confirm.quote.supplierName} at ${formatPence(confirm.quote.priceExVatPence)} ex VAT and create an order with escrow?` : `Convert the recommended quote on ${rfq.rfqRef} into an order?`}
          confirmLabel="Confirm"
          tone="emerald"
          onConfirm={() => { setConfirm(null); showToast("Order created from quote") }}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-800">{value}</span></div>
}
