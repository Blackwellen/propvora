"use client"

/* ──────────────────────────────────────────────────────────────────────────
   TeamQuoteApprovalQueue — manifest image 5 (Team Quote Approval Queue).

   Quotes awaiting commercial approval: owner, estimator, margin, discount, risk
   flags, customer deadline + a quote preview / margin / risk rail. Approve /
   request-changes / reject are typed stubs (toast + audit TODO) gated on the
   `respond_review`-class permission. Reached via
   /supplier/requests?tab=quotes&view=approvals (team/enterprise only).
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  FileCheck2, AlertTriangle, Clock, CheckCircle2, XCircle, RotateCcw, ChevronRight, PoundSterling, Percent,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"
import { QUOTES_FOR_APPROVAL, type QuoteForApproval } from "@/features/supplier/team/data/approvals"

export function TeamQuoteApprovalQueue() {
  const [toast, setToast] = useState<string | null>(null)
  const [queue, setQueue] = useState<QuoteForApproval[]>(QUOTES_FOR_APPROVAL)
  const [selectedId, setSelectedId] = useState<string>(QUOTES_FOR_APPROVAL[0]?.id ?? "")

  const selected = useMemo(() => queue.find((q) => q.id === selectedId) ?? queue[0], [queue, selectedId])

  function resolve(q: QuoteForApproval, verb: string, msg: string) {
    // STUB: TODO POST approval decision + audit `quote.${verb}`. Optimistic.
    setQueue((qs) => {
      const next = qs.filter((x) => x.id !== q.id)
      if (next.length && selectedId === q.id) setSelectedId(next[0].id)
      return next
    })
    setToast(msg)
  }

  const totalPence = queue.reduce((s, q) => s + q.valuePence, 0)
  const lowMargin = queue.filter((q) => q.marginPct < 25).length

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}

      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/supplier/requests" className="text-xs font-semibold text-slate-400 hover:text-slate-600">Requests</Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-xs font-semibold text-slate-600">Quote approvals</span>
      </div>
      <h1 className="text-xl font-semibold text-slate-900">Quote Approval Queue</h1>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Awaiting approval" value={String(queue.length)} tone="amber" icon={FileCheck2} />
        <Mini label="Total value" value={moneyPence(totalPence)} tone="blue" icon={PoundSterling} />
        <Mini label="Low margin (<25%)" value={String(lowMargin)} tone="red" icon={Percent} />
        <Mini label="Due within 48h" value={String(queue.filter((q) => new Date(q.customerDeadline).getTime() - Date.now() < 2 * 86_400_000).length)} tone="amber" icon={Clock} />
      </div>

      {queue.length === 0 ? (
        <SupplierCard className="p-10 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">All caught up</p><p className="text-xs text-slate-400">No quotes awaiting approval.</p></SupplierCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
          {/* Queue table */}
          <SupplierCard className="p-0 overflow-hidden min-w-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><Th>Quote</Th><Th>Estimator</Th><Th>Value</Th><Th>Margin</Th><Th>Risk</Th><Th>Deadline</Th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {queue.map((q) => (
                    <tr key={q.id} onClick={() => setSelectedId(q.id)} className={cn("hover:bg-slate-50/60 cursor-pointer", selected?.id === q.id && "bg-[var(--brand-soft)]/40")}>
                      <td className="px-4 py-3"><p className="font-semibold text-slate-800">{q.customer}</p><p className="text-[11px] text-slate-400">{q.ref}</p></td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 flex items-center justify-center">{q.estimatorInitials}</span><span className="text-xs text-slate-600">{q.estimator.split(" ")[0]}</span></span></td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{moneyPence(q.valuePence)}</td>
                      <td className="px-4 py-3"><span className={cn("font-semibold", q.marginPct < 25 ? "text-red-600" : "text-emerald-600")}>{q.marginPct}%</span>{q.discountPct > 0 && <span className="text-[11px] text-slate-400 block">−{q.discountPct}% disc</span>}</td>
                      <td className="px-4 py-3">{q.riskFlags.length > 0 ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600"><AlertTriangle className="w-3 h-3" />{q.riskFlags.length}</span> : <span className="text-[11px] text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{shortDate(q.customerDeadline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SupplierCard>

          {/* Preview + margin/risk + decision */}
          {selected && (
            <SupplierCard className="p-5">
              <div className="flex items-center justify-between mb-1"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Quote preview</p><Link href={`/supplier/quotes/${selected.ref}`} className="text-xs font-semibold text-[var(--brand)]">Open</Link></div>
              <h2 className="text-base font-semibold text-slate-900">{selected.customer}</h2>
              <p className="text-xs text-slate-400">{selected.ref} · {selected.estimator}</p>

              <ul className="mt-3 divide-y divide-slate-50">
                {selected.lineItems.map((li, i) => (
                  <li key={i} className="flex items-center justify-between py-1.5 text-sm"><span className="text-slate-600 truncate pr-2">{li.description}</span><span className="font-semibold text-slate-800 shrink-0">{moneyPence(li.pricePence)}</span></li>
                ))}
                <li className="flex items-center justify-between py-2"><span className="text-sm font-medium text-slate-600">Total</span><span className="text-base font-bold text-slate-900">{moneyPence(selected.valuePence)}</span></li>
              </ul>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-400">Margin</p><p className={cn("text-lg font-bold", selected.marginPct < 25 ? "text-red-600" : "text-emerald-600")}>{selected.marginPct}%</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-400">Discount</p><p className="text-lg font-bold text-slate-900">{selected.discountPct}%</p></div>
              </div>

              {selected.riskFlags.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selected.riskFlags.map((f) => <p key={f} className="flex items-center gap-1.5 text-xs text-amber-700"><AlertTriangle className="w-3.5 h-3.5" />{f}</p>)}
                </div>
              )}
              {selected.revisionNote && <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{selected.revisionNote}</p>}

              <div className="mt-4 space-y-1.5">
                <SupplierButton className="w-full justify-center" onClick={() => resolve(selected, "approved", `${selected.ref} approved and sent to ${selected.customer}.`)}><CheckCircle2 className="w-4 h-4" /> Approve &amp; send</SupplierButton>
                <SupplierButton variant="outline" className="w-full justify-center" onClick={() => resolve(selected, "changes_requested", `Changes requested on ${selected.ref}.`)}><RotateCcw className="w-4 h-4" /> Request changes</SupplierButton>
                <SupplierButton variant="ghost" className="w-full justify-center" onClick={() => resolve(selected, "rejected", `${selected.ref} rejected.`)}><XCircle className="w-4 h-4" /> Reject</SupplierButton>
              </div>
            </SupplierCard>
          )}
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</th>
}
function Mini({ label, value, tone, icon: Icon }: { label: string; value: string; tone: "blue" | "emerald" | "red" | "amber"; icon: typeof FileCheck2 }) {
  const c = tone === "blue" ? "text-[var(--brand)]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-amber-600"
  return (
    <SupplierCard className="p-3.5">
      <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><Icon className="w-3.5 h-3.5 text-slate-300" /></div>
      <p className={cn("text-xl font-bold mt-1", c)}>{value}</p>
    </SupplierCard>
  )
}
