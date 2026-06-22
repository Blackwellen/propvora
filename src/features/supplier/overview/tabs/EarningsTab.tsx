"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Wallet, Lock, Clock, FileText, TrendingUp, PieChart, Landmark,
  Download, FilePlus2, ArrowRight, AlertTriangle,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import {
  KpiRow, Panel, ScoreRing, CheckRow, ViewToggle, Pill, OverviewLink, useToast,
  OverviewSkeleton, OverviewError,
  type OverviewKpi, type Accent, type ViewOption,
} from "../ui/primitives"
import { SupplierAreaChart, Donut, type DonutSlice } from "@/components/supplier-workspace/charts"
import { shortDate } from "../ui/util"
import { useEarningsData } from "../data/hooks"

const TREND_VIEWS: ViewOption[] = [
  { key: "month", label: "This month", icon: TrendingUp },
  { key: "daily", label: "Daily", icon: TrendingUp },
]

const INVOICE_ACCENT: Record<string, Accent> = { draft: "amber", sent: "blue", paid: "emerald", overdue: "red", void: "slate" }
const PAYOUT_ACCENT: Record<string, Accent> = { awaiting: "amber", scheduled: "blue", paid: "emerald" }

export function EarningsTab() {
  const { data, loading, error, reload } = useEarningsData()
  const { toast } = useToast()
  const [trend, setTrend] = useState("month")

  if (loading) return <OverviewSkeleton />
  if (error && !data) return <OverviewError onRetry={reload} />
  if (!data) return null

  const k = data.kpis
  const cur = data.currency
  const kpis: OverviewKpi[] = [
    { id: "month", label: "This month earnings", value: formatPence(k.thisMonthPence, cur), icon: Wallet, accent: "emerald" },
    { id: "escrow", label: "In escrow", value: formatPence(k.inEscrowPence, cur), icon: Lock, accent: "amber" },
    { id: "await", label: "Awaiting payout", value: formatPence(k.awaitingPayoutPence, cur), icon: Clock, accent: "violet" },
    { id: "paid", label: "Paid out", value: formatPence(k.paidOutPence, cur), icon: Landmark, accent: "blue" },
    { id: "unpaid", label: "Unpaid invoices", value: formatPence(k.unpaidInvoicesPence, cur), icon: FileText, accent: "red" },
  ]

  const trendData = trend === "daily" ? data.trendDaily : data.trendMonthly
  const donutSlices: DonutSlice[] = data.revenueByService.map((s) => ({ name: s.name, value: s.value, color: s.color }))

  return (
    <div className="space-y-5">
      <KpiRow kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          {/* Earnings trend */}
          <Panel title="Earnings trend" icon={TrendingUp} action={<ViewToggle options={TREND_VIEWS} active={trend} onChange={setTrend} />}>
            <div className="flex items-end gap-3 mb-3">
              <p className="text-2xl font-bold text-slate-900 leading-none">{formatPence(k.thisMonthPence, cur)}</p>
              <span className="text-[12px] font-medium text-slate-400 pb-0.5">This month</span>
            </div>
            {trendData.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-8 text-center">No earnings data yet — completed, paid jobs will chart here.</p>
            ) : (
              <SupplierAreaChart data={trendData} height={220} color="#2563EB" format={(v) => formatPence(v, cur)} />
            )}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <OverviewLink href="/supplier?tab=earnings" label="View full earnings report" />
              <button onClick={() => toast("CSV export coming soon", "info")} className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-slate-700"><Download className="w-3.5 h-3.5" /> Export earnings</button>
            </div>
          </Panel>

          {/* Payout timeline */}
          <Panel title="Payout timeline" icon={Clock}>
            {data.payoutTimeline.length === 0 && (
              <p className="text-[12px] text-slate-400 py-2">No payouts yet.</p>
            )}
            <ol className="relative pl-5">
              <span className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-100" aria-hidden />
              {data.payoutTimeline.map((p) => (
                <li key={p.id} className="relative pb-3.5 last:pb-0">
                  <span className={`absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${p.state === "paid" ? "bg-emerald-500" : p.state === "scheduled" ? "bg-blue-500" : "bg-amber-500"}`} />
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{p.label}</p>
                      <p className="text-[11px] text-slate-400">{shortDate(p.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill accent={PAYOUT_ACCENT[p.state]}>{p.state}</Pill>
                      <span className="text-sm font-bold text-slate-900">{formatPence(p.amountPence, p.currency)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          {/* Invoice summary */}
          <Panel title="Invoice summary" icon={FileText} action={<OverviewLink href="/supplier/invoices" label="All invoices" />} pad={false}>
            {data.invoices.length === 0 ? (
              <p className="text-[12px] text-slate-400 px-5 py-4">No invoices yet.</p>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">Invoice</th><th className="px-5 py-3 font-semibold">Service</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Due</th><th className="px-5 py-3 font-semibold text-right">Amount</th>
                </tr></thead>
                <tbody>
                  {data.invoices.map((iv) => (
                    <tr key={iv.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3"><span className="font-semibold text-slate-800">{iv.number}</span><span className="block text-[11px] text-slate-400">{iv.customer}</span></td>
                      <td className="px-5 py-3 text-slate-600">{iv.service}</td>
                      <td className="px-5 py-3"><Pill accent={INVOICE_ACCENT[iv.status]}>{iv.status}</Pill></td>
                      <td className="px-5 py-3 text-slate-500">{iv.dueAt ? shortDate(iv.dueAt) : "—"}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{formatPence(iv.amountPence, iv.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </Panel>

          {/* Revenue by service + blocked payouts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel title="Revenue by service" icon={PieChart}>
              {data.revenueByService.length === 0 ? (
                <p className="text-[12px] text-slate-400 py-6 text-center">No revenue recorded yet.</p>
              ) : (
              <div className="flex items-center gap-4">
                <div className="w-[120px] h-[120px] shrink-0"><Donut data={donutSlices} /></div>
                <ul className="flex-1 min-w-0 space-y-1.5">
                  {data.revenueByService.map((s) => (
                    <li key={s.name} className="flex items-center gap-2 text-[12px]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-slate-600 truncate">{s.name}</span>
                      <span className="ml-auto font-semibold text-slate-800">{formatPence(s.value, cur)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              )}
            </Panel>

            <Panel title="Blocked payouts" icon={AlertTriangle}>
              {data.blockedPayouts.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No blocked payouts — nice work.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.blockedPayouts.map((b) => (
                    <li key={b.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{b.customer}</p>
                        <span className="text-sm font-bold text-slate-900">{formatPence(b.amountPence, b.currency)}</span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-0.5">{b.reason} · evidence {b.evidenceProvided}/{b.evidenceRequired}</p>
                      <Link href={b.jobHref} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700">Resolve now <ArrowRight className="w-3 h-3" /></Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          <Panel>
            <p className="text-[12px] font-medium text-slate-500">Available balance</p>
            <p className="text-3xl font-bold text-emerald-600 mt-0.5 leading-none">{formatPence(data.availableBalancePence, cur)}</p>
            <p className="text-[12px] text-slate-400 mt-1">Ready to be paid out</p>
            <Link href="/supplier/payouts" className="mt-3 inline-flex items-center justify-center gap-1.5 w-full bg-[#2563EB] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#1d4ed8]">
              <Wallet className="w-4 h-4" /> View payouts
            </Link>
          </Panel>

          <Panel title="Quick actions">
            <div className="grid grid-cols-2 gap-2.5">
              <RailBtn label="Create invoice" icon={FilePlus2} onClick={() => toast("Invoice composer coming soon", "info")} />
              <RailBtn label="Download statement" icon={Download} onClick={() => toast("Statement export coming soon", "info")} />
              <RailBtn label="Export CSV" icon={Download} onClick={() => toast("CSV export coming soon", "info")} />
              <Link href="/supplier/payouts" className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-center"><span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Wallet className="w-4 h-4 text-blue-600" /></span><span className="text-[11px] font-medium text-slate-700">View payouts</span></Link>
            </div>
          </Panel>

          <Panel title="Blocked payouts" action={<span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold inline-flex items-center justify-center">{data.blockedPayouts.length}</span>}>
            <p className="text-2xl font-bold text-red-600 leading-none">{formatPence(data.blockedPayouts.reduce((s, b) => s + b.amountPence, 0), cur)}</p>
            <p className="text-[12px] text-slate-400 mt-1">Across {data.blockedPayouts.length} jobs</p>
            <p className="text-[12px] text-slate-500 mt-2">We&apos;re holding payment for jobs below due to missing evidence.</p>
            <button onClick={() => toast("Resolve blocked payouts — coming soon", "info")} className="mt-3 inline-flex items-center justify-center gap-1.5 w-full bg-white border border-slate-200 text-[#2563EB] rounded-lg px-4 py-2.5 text-[13px] font-semibold hover:bg-slate-50">
              Resolve blocked payouts
            </button>
          </Panel>

          <Panel title="Finance health" action={data.financeHealthPct > 0 ? <Pill accent={data.financeHealthPct >= 85 ? "emerald" : data.financeHealthPct >= 60 ? "blue" : "amber"}>{data.financeHealthPct >= 85 ? "Excellent" : data.financeHealthPct >= 60 ? "Strong" : "Building"}</Pill> : undefined}>
            {data.financeHealthPct > 0 ? (
              <>
                <div className="flex items-center gap-4">
                  <ScoreRing pct={data.financeHealthPct} size={86} stroke={9} accent={data.financeHealthPct >= 85 ? "emerald" : "blue"} sub={undefined} />
                  <p className="text-[12px] text-slate-500 min-w-0">Based on invoicing, payouts, unpaid balance and evidence compliance.</p>
                </div>
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  <CheckRow label="Invoices up to date" done={k.unpaidInvoicesPence === 0} />
                  <CheckRow label="Payouts on track" done={data.blockedPayouts.length === 0} />
                  <CheckRow label="Low unpaid balance" done={k.unpaidInvoicesPence === 0} />
                  <CheckRow label="No blocked payouts" done={data.blockedPayouts.length === 0} />
                </div>
              </>
            ) : (
              <p className="text-[12px] text-slate-400 py-2">Your finance health score builds as you invoice and get paid.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function RailBtn({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-center">
      <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Icon className="w-4 h-4 text-blue-600" /></span>
      <span className="text-[11px] font-medium text-slate-700">{label}</span>
    </button>
  )
}
