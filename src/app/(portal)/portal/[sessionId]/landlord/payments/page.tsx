import Link from "next/link"
import {
  PoundSterling, CheckCircle2, AlertTriangle, Wallet, Calendar, Download, Building2,
  ArrowDownLeft, ArrowUpRight, ChevronRight, TrendingUp, FileText, LifeBuoy,
} from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getLandlordTransactions, getLandlordOverdueAlerts, getLandlordProperties } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, PortalKpiStrip, StatusChip,
  PortalEmptyState, PortalButtonLink, type PortalKpi,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function LandlordPaymentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`
  const [txns, alerts, properties] = await Promise.all([
    getLandlordTransactions(session), getLandlordOverdueAlerts(session), getLandlordProperties(session),
  ])

  const expected = properties.reduce((s, p) => s + (p.target_rent_pcm ?? 0), 0)
  const collected = txns.filter((t) => t.direction === "in").reduce((s, t) => s + (t.amount ?? 0), 0)
  const fees = txns.filter((t) => t.direction === "out" && (t.category ?? "").toLowerCase().includes("fee")).reduce((s, t) => s + (t.amount ?? 0), 0)
  const rate = expected ? Math.min(100, Math.round((collected / expected) * 100)) : 0
  const netPayout = collected - fees

  const kpis: PortalKpi[] = [
    { label: "Expected this month", value: formatMoney(expected), icon: Calendar, tone: "blue" },
    { label: "Collected this month", value: formatMoney(collected), icon: CheckCircle2, tone: "emerald" },
    { label: "Outstanding (arrears)", value: String(alerts.length), sub: "tenancies", icon: AlertTriangle, tone: alerts.length ? "red" : "emerald" },
    { label: "Collection rate", value: `${rate}%`, icon: TrendingUp, tone: rate >= 95 ? "emerald" : "amber" },
    { label: "Next landlord payout", value: formatMoney(netPayout), icon: Wallet, tone: "violet" },
    { label: "Management fees", value: formatMoney(fees), icon: PoundSterling, tone: "slate" },
  ]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Payments" subtitle="Track rent collections, arrears, fees and landlord payouts." backHref={base}
        actions={<><PortalButtonLink href={`${base}/documents`} icon={Download}>Download statement</PortalButtonLink><PortalButtonLink href="#" variant="primary" icon={Download}>Export ledger</PortalButtonLink></>}
      />
      <PortalKpiStrip kpis={kpis} cols={6} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PortalSectionCard title="Payout method" icon={Building2}>
          <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center"><Building2 className="w-5 h-5" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Bank transfer (BACS)</p><p className="text-xs text-slate-400">Managed by {session.workspaceName}</p></div></div>
        </PortalSectionCard>
        <PortalSectionCard title="Next scheduled payout" icon={Wallet}>
          <div className="flex items-center justify-between"><div><p className="text-xs text-slate-400">Amount</p><p className="text-lg font-bold text-[#071B4D]">{formatMoney(netPayout)}</p></div><StatusChip tone="blue">Scheduled</StatusChip></div>
        </PortalSectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <PortalCard className="overflow-hidden min-w-0">
          <div className="px-5 py-3.5 border-b border-[#EEF3FB]"><h2 className="text-sm font-semibold text-[#071B4D]">Rent & payout ledger</h2></div>
          {txns.length === 0 ? <PortalEmptyState icon={Wallet} title="No payments yet" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-[#F1F5FB]">
                  {txns.slice(0, 30).map((t) => { const inc = t.direction === "in"; return (
                    <tr key={t.id} className="hover:bg-[#FAFCFF]">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${inc ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>{inc ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}</span><span className="font-medium text-[#071B4D] truncate max-w-[160px]">{t.description ?? (inc ? "Rent received" : "Payout / fee")}</span></div></td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{t.category?.replace(/_/g, " ") ?? "Rent"}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${inc ? "text-emerald-600" : "text-slate-900"}`}>{inc ? "+" : "−"}{formatMoney(t.amount, t.currency ?? "GBP")}</td>
                      <td className="px-4 py-3"><StatusChip tone={inc ? "emerald" : "slate"} dot>{inc ? "Received" : "Paid"}</StatusChip></td>
                      <td className="px-4 py-3 text-right"><Link href={`${base}/payments/${t.id}`} className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#2563EB]">View <ChevronRight className="w-3.5 h-3.5" /></Link></td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </PortalCard>

        <div className="space-y-4">
          <PortalSectionCard title="Arrears watchlist" icon={AlertTriangle}>
            {alerts.length === 0 ? <p className="text-sm text-emerald-600 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> No arrears</p> : (
              <ul className="space-y-2">{alerts.map((a) => <li key={a.tenancyId} className="flex items-center justify-between gap-2 rounded-xl bg-red-50/60 border border-red-100 px-3 py-2"><span className="text-sm font-medium text-[#071B4D] truncate">{a.propertyLabel}</span><StatusChip tone="red">Overdue</StatusChip></li>)}</ul>
            )}
          </PortalSectionCard>
          <PortalSectionCard title="Receipts & statements" icon={FileText} viewAllHref={`${base}/documents`}>
            <PortalButtonLink href={`${base}/documents`} variant="ghost" icon={Download} className="w-full justify-center">View statements</PortalButtonLink>
          </PortalSectionCard>
          <PortalSectionCard title="Payment support" icon={LifeBuoy}>
            <PortalButtonLink href={`${base}/messages`} variant="primary" className="w-full justify-center">Message manager</PortalButtonLink>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
