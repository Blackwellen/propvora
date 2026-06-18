import {
  PoundSterling, TrendingUp, TrendingDown, Wallet, AlertTriangle, Download, FileText,
  ArrowDownLeft, ArrowUpRight, Calendar,
} from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getLandlordTransactions, getLandlordOverdueAlerts } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, PortalKpiStrip, StatusChip,
  PortalEmptyState, PortalButtonLink, type PortalKpi,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function monthKey(iso: string | null) { if (!iso) return "—"; const d = new Date(iso); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }) }

export default async function LandlordFinancialsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`
  const [txns, alerts] = await Promise.all([getLandlordTransactions(session), getLandlordOverdueAlerts(session)])

  const income = txns.filter((t) => t.direction === "in").reduce((s, t) => s + (t.amount ?? 0), 0)
  const expenditure = txns.filter((t) => t.direction === "out").reduce((s, t) => s + (t.amount ?? 0), 0)
  const net = income - expenditure
  const months = new Set(txns.map((t) => monthKey(t.created_at)).filter((m) => m !== "—")).size || 1
  const avgMonthly = income / months

  const byMonth = new Map<string, { in: number; out: number; order: string }>()
  for (const t of txns) {
    const k = monthKey(t.created_at); if (k === "—") continue
    const e = byMonth.get(k) ?? { in: 0, out: 0, order: t.created_at ?? "" }
    if (t.direction === "in") e.in += t.amount ?? 0; else e.out += t.amount ?? 0
    if ((t.created_at ?? "") > e.order) e.order = t.created_at ?? ""
    byMonth.set(k, e)
  }
  const monthly = [...byMonth.entries()].sort((a, b) => b[1].order.localeCompare(a[1].order)).slice(0, 6)
  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m[1].in, m[1].out)))

  const kpis: PortalKpi[] = [
    { label: "Total income YTD", value: formatMoney(income), icon: TrendingUp, tone: "emerald" },
    { label: "Total expenditure YTD", value: formatMoney(expenditure), icon: TrendingDown, tone: "red" },
    { label: "Net P&L YTD", value: formatMoney(net), icon: PoundSterling, tone: net >= 0 ? "emerald" : "red" },
    { label: "Arrears outstanding", value: String(alerts.length), sub: "tenancies", icon: AlertTriangle, tone: alerts.length ? "amber" : "emerald" },
    { label: "Avg monthly income", value: formatMoney(avgMonthly), icon: Wallet, tone: "blue" },
    { label: "Next projected payout", value: formatMoney(avgMonthly), icon: Calendar, tone: "violet" },
  ]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Financials" subtitle="Income, expenditure and net performance across your portfolio." backHref={base}
        actions={<><PortalButtonLink href="#" icon={Download}>Export CSV</PortalButtonLink><PortalButtonLink href={`${base}/documents`} variant="primary" icon={FileText}>Download statement</PortalButtonLink></>}
      />
      <PortalKpiStrip kpis={kpis} cols={6} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <PortalSectionCard title="Income vs expenditure" icon={TrendingUp}>
            {monthly.length === 0 ? <PortalEmptyState icon={TrendingUp} title="No data yet" /> : (
              <div className="space-y-2.5">
                {monthly.map(([m, v]) => (
                  <div key={m} className="flex items-center gap-3"><span className="text-xs text-slate-500 w-16 shrink-0">{m}</span>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 rounded-full bg-emerald-100 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(v.in / maxBar) * 100}%` }} /></div>
                      <div className="h-3 rounded-full bg-rose-100 overflow-hidden"><div className="h-full bg-rose-400 rounded-full" style={{ width: `${(v.out / maxBar) * 100}%` }} /></div>
                    </div>
                    <span className="text-xs font-semibold text-[#071B4D] w-20 text-right shrink-0">{formatMoney(v.in - v.out)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400"><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income</span><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Expenditure</span></div>
              </div>
            )}
          </PortalSectionCard>

          <PortalCard className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#EEF3FB]"><h2 className="text-sm font-semibold text-[#071B4D]">Transaction ledger</h2></div>
            {txns.length === 0 ? <PortalEmptyState icon={Wallet} title="No transactions" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Direction</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
                  <tbody className="divide-y divide-[#F1F5FB]">
                    {txns.slice(0, 30).map((t) => { const inc = t.direction === "in"; return (
                      <tr key={t.id} className="hover:bg-[#FAFCFF]">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                        <td className="px-4 py-3 font-medium text-[#071B4D] truncate max-w-[200px]">{t.description ?? (inc ? "Rent received" : "Expense")}</td>
                        <td className="px-4 py-3 text-slate-500 capitalize">{t.category?.replace(/_/g, " ") ?? "—"}</td>
                        <td className="px-4 py-3"><StatusChip tone={inc ? "emerald" : "slate"}>{inc ? <><ArrowDownLeft className="w-3 h-3 inline" /> In</> : <><ArrowUpRight className="w-3 h-3 inline" /> Out</>}</StatusChip></td>
                        <td className={`px-4 py-3 text-right font-semibold ${inc ? "text-emerald-600" : "text-slate-900"}`}>{inc ? "+" : "−"}{formatMoney(t.amount, t.currency ?? "GBP")}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </PortalCard>
        </div>

        <div className="space-y-4">
          <PortalSectionCard title="Arrears watchlist" icon={AlertTriangle}>
            {alerts.length === 0 ? <p className="text-sm text-emerald-600 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> No arrears</p> : (
              <ul className="space-y-2">{alerts.map((a) => (
                <li key={a.tenancyId} className="flex items-center justify-between gap-2 rounded-xl bg-red-50/60 border border-red-100 px-3 py-2"><span className="text-sm font-medium text-[#071B4D] truncate">{a.propertyLabel}</span><StatusChip tone="red">Overdue</StatusChip></li>
              ))}</ul>
            )}
          </PortalSectionCard>
          <PortalSectionCard title="Downloadable statements" icon={FileText} viewAllHref={`${base}/documents`}>
            <PortalButtonLink href={`${base}/documents`} variant="ghost" icon={Download} className="w-full justify-center">View statements</PortalButtonLink>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
