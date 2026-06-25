import { TrendingUp, Wallet, FileText } from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getLandlordTransactions } from "@/lib/portal/data"
import { formatMoney } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, PortalKpiStrip,
  PortalEmptyState, PortalButtonLink, type PortalKpi,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function monthKey(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" })
}

export default async function AccountantStatementsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "accountant")
  const base = `/portal/${session.id}/accountant`
  const txns = await getLandlordTransactions(session)

  const income = txns.filter((t) => t.direction === "in").reduce((s, t) => s + (t.amount ?? 0), 0)
  const expenditure = txns.filter((t) => t.direction === "out").reduce((s, t) => s + (t.amount ?? 0), 0)
  const net = income - expenditure

  const byMonth = new Map<string, { in: number; out: number; order: string }>()
  for (const t of txns) {
    const k = monthKey(t.created_at); if (k === "—") continue
    const e = byMonth.get(k) ?? { in: 0, out: 0, order: t.created_at ?? "" }
    if (t.direction === "in") e.in += t.amount ?? 0; else e.out += t.amount ?? 0
    if ((t.created_at ?? "") > e.order) e.order = t.created_at ?? ""
    byMonth.set(k, e)
  }
  const monthly = [...byMonth.entries()].sort((a, b) => b[1].order.localeCompare(a[1].order))
  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m[1].in, m[1].out)))

  const kpis: PortalKpi[] = [
    { label: "Total income", value: formatMoney(income), icon: TrendingUp, tone: "emerald" },
    { label: "Total expenditure", value: formatMoney(expenditure), icon: Wallet, tone: "red" },
    { label: "Net position", value: formatMoney(net), icon: TrendingUp, tone: net >= 0 ? "emerald" : "red" },
  ]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Statements"
        subtitle="Monthly income and expenditure summary across the linked properties."
        backHref={base}
        actions={<PortalButtonLink href={`${base}/documents`} variant="primary" icon={FileText}>Statement files</PortalButtonLink>}
      />
      <PortalKpiStrip kpis={kpis} cols={4} />

      <PortalSectionCard title="Monthly breakdown" icon={TrendingUp}>
        {monthly.length === 0 ? (
          <PortalEmptyState icon={TrendingUp} title="No statement data yet" description="Once transactions are recorded against the linked properties, monthly statements appear here." />
        ) : (
          <div className="space-y-2.5">
            {monthly.map(([m, v]) => (
              <div key={m} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-16 shrink-0">{m}</span>
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
        <div className="px-5 py-3.5 border-b border-[#EEF3FB] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#071B4D]">Statement periods</h2>
        </div>
        {monthly.length === 0 ? <PortalEmptyState icon={Wallet} title="No periods" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]"><th className="px-4 py-3">Period</th><th className="px-4 py-3 text-right">Income</th><th className="px-4 py-3 text-right">Expenditure</th><th className="px-4 py-3 text-right">Net</th></tr></thead>
              <tbody className="divide-y divide-[#F1F5FB]">
                {monthly.map(([m, v]) => (
                  <tr key={m} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-3 font-medium text-[#071B4D]">{m}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatMoney(v.in)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatMoney(v.out)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${v.in - v.out >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatMoney(v.in - v.out)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PortalCard>
    </div>
  )
}
