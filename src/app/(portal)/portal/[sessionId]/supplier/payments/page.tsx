import Link from "next/link"
import {
  Wallet, CheckCircle2, PoundSterling, AlertTriangle, Calendar, Download, Building2,
  ChevronRight, FileText, LifeBuoy,
} from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getSupplierInvoices } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, PortalKpiStrip, StatusChip,
  PortalEmptyState, PortalButtonLink, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function SupplierPaymentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`
  const invoices = await getSupplierInvoices(session)

  // Payouts derive from approved/paid invoices.
  const payouts = invoices.filter((i) => ["approved", "paid"].includes(i.status))
  const awaiting = invoices.filter((i) => i.status === "approved").reduce((s, i) => s + (i.amount ?? 0), 0)
  const paid = invoices.filter((i) => i.status === "paid")
  const paidTotal = paid.reduce((s, i) => s + (i.amount ?? 0), 0)
  const paidMonth = paid.filter((i) => i.paid_at && Date.now() - new Date(i.paid_at).getTime() < 30 * 86_400_000).reduce((s, i) => s + (i.amount ?? 0), 0)

  const kpis: PortalKpi[] = [
    { label: "Awaiting payout", value: formatMoney(awaiting), icon: Wallet, tone: awaiting ? "amber" : "emerald" },
    { label: "Paid this month", value: formatMoney(paidMonth), icon: CheckCircle2, tone: "emerald" },
    { label: "Paid YTD", value: formatMoney(paidTotal), icon: PoundSterling, tone: "emerald" },
    { label: "Overdue", value: formatMoney(0), icon: AlertTriangle, tone: "emerald" },
    { label: "Next payout date", value: awaiting ? "On approval" : "—", icon: Calendar, tone: "violet" },
  ]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Payments" subtitle="Track your payouts, remittances and payment history." backHref={base}
        actions={<PortalButtonLink href={`${base}/documents`} variant="primary" icon={Download}>Statements</PortalButtonLink>}
      />
      <PortalKpiStrip kpis={kpis} cols={5} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PortalSectionCard title="Payout method" icon={Building2}><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center"><Building2 className="w-5 h-5" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Bank transfer (BACS)</p><p className="text-xs text-slate-400">Signed in via secure account</p></div></div></PortalSectionCard>
        <PortalSectionCard title="Next scheduled payout" icon={Wallet}><div className="flex items-center justify-between"><div><p className="text-xs text-slate-400">Amount</p><p className="text-lg font-bold text-[#071B4D]">{formatMoney(awaiting)}</p></div><StatusChip tone="blue">On approval</StatusChip></div></PortalSectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <PortalCard className="overflow-hidden min-w-0">
          <div className="px-5 py-3.5 border-b border-[#EEF3FB]"><h2 className="text-sm font-semibold text-[#071B4D]">Remittances</h2></div>
          {payouts.length === 0 ? <PortalEmptyState icon={Wallet} title="No payouts yet" description="Approved invoices become payouts here." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3 text-right">Gross</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-[#F1F5FB]">
                  {payouts.map((inv) => { const tone: PortalTone = inv.status === "paid" ? "emerald" : "blue"; return (
                    <tr key={inv.id} className="hover:bg-[#FAFCFF]">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(inv.paid_at ?? inv.submitted_at)}</td>
                      <td className="px-4 py-3 font-medium text-[#071B4D]">{inv.invoice_number || `PAY-${inv.id.slice(0, 6).toUpperCase()}`}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#071B4D]">{formatMoney(inv.amount, inv.currency ?? "GBP")}</td>
                      <td className="px-4 py-3"><StatusChip tone={tone} dot>{inv.status === "paid" ? "Paid" : "Scheduled"}</StatusChip></td>
                      <td className="px-4 py-3 text-right"><Link href={`${base}/payments/${inv.id}`} className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--brand)]">View <ChevronRight className="w-3.5 h-3.5" /></Link></td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </PortalCard>
        <div className="space-y-4">
          <PortalSectionCard title="Remittance statements" icon={FileText} viewAllHref={`${base}/documents`}><PortalButtonLink href={`${base}/documents`} variant="ghost" icon={Download} className="w-full justify-center">View statements</PortalButtonLink></PortalSectionCard>
          <PortalSectionCard title="Payment support" icon={LifeBuoy}><PortalButtonLink href={`${base}/messages`} variant="primary" className="w-full justify-center">Message accounts</PortalButtonLink></PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
