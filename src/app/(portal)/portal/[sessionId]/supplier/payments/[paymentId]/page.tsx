import {
  Wallet, CalendarClock, CheckCircle2, Building2, Hash, Download, MessageSquare, Circle,
  FileText, Briefcase, PoundSterling, LifeBuoy,
} from "lucide-react"
import { requirePortalSession } from "../../../_guard"
import { getSupplierInvoice } from "@/lib/portal/data-extra"
import { getSupplierJob } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function SupplierPaymentDetail({ params }: { params: Promise<{ sessionId: string; paymentId: string }> }) {
  const { sessionId, paymentId } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`
  const inv = await getSupplierInvoice(session, paymentId)

  if (!inv) {
    return (
      <div className="space-y-5">
        <PortalPageHeader title="Remittance" backHref={`${base}/payments`} backLabel="Back to payments" />
        <PortalCard><PortalEmptyState icon={Wallet} title="Remittance not found" description="This payout isn't on your account." /></PortalCard>
      </div>
    )
  }
  const gross = inv.amount ?? 0
  const fee = Math.round(gross * 0.05)
  const net = gross - fee
  const ref = inv.invoice_number || `PAY-${inv.id.slice(0, 6).toUpperCase()}`
  const job = inv.supplier_job_id ? await getSupplierJob(session, inv.supplier_job_id) : null

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title={`Remittance ${ref}`} subtitle="Payment to your account" backHref={`${base}/payments`} backLabel="Back to payments"
        actions={<><PortalButtonLink href="#" icon={Download}>Download remittance</PortalButtonLink><PortalButtonLink href={`${base}/messages`} variant="primary" icon={MessageSquare}>Message accounts</PortalButtonLink></>}
      />

      <PortalCard className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4"><div><p className="text-3xl font-bold text-[#071B4D]">{formatMoney(net, inv.currency ?? "GBP")}</p><p className="text-xs text-slate-400 mt-0.5">Net paid</p></div><StatusChip tone={inv.status === "paid" ? "emerald" : "blue"} dot>{inv.status === "paid" ? "Paid" : "Scheduled"}</StatusChip></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <PortalFact icon={CalendarClock} label="Paid date" value={formatDate(inv.paid_at ?? inv.submitted_at)} />
          <PortalFact icon={PoundSterling} label="Gross paid" value={formatMoney(gross)} />
          <PortalFact icon={Building2} label="Bank account" value="BACS •••• 4821" />
          <PortalFact icon={Hash} label="Reference" value={ref} />
        </div>
      </PortalCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Deduction breakdown" icon={PoundSterling}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Invoice total</dt><dd className="font-semibold text-[#071B4D]">{formatMoney(gross)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Platform fee (5%)</dt><dd className="font-semibold text-rose-500">−{formatMoney(fee)}</dd></div>
              <div className="flex justify-between border-t border-[#EEF3FB] pt-2"><dt className="font-medium text-slate-600">Net paid</dt><dd className="font-bold text-emerald-600">{formatMoney(net)}</dd></div>
            </dl>
          </PortalSectionCard>
          <PortalSectionCard title="Payment timeline" icon={CalendarClock}>
            <ol className="space-y-3">{[["Invoice approved", true], ["Payout scheduled", true], ["Payment sent", inv.status === "paid"], ["Remittance issued", inv.status === "paid"]].map(([l, d], i) => (
              <li key={i} className="flex gap-3">{d ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}<div><p className="text-sm text-slate-700">{l as string}</p><p className="text-[11px] text-slate-400">{formatDate(inv.approved_at ?? inv.submitted_at)}</p></div></li>
            ))}</ol>
          </PortalSectionCard>
          {job && (
            <PortalSectionCard title="Linked job" icon={Briefcase} viewAllHref={`${base}/jobs/${job.id}`} viewAllLabel="Open job">
              <p className="text-sm font-semibold text-[#071B4D]">{job.title}</p>
            </PortalSectionCard>
          )}
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Payout account" icon={Building2}><p className="text-sm font-semibold text-[#071B4D]">Bank transfer (BACS)</p><p className="text-xs text-slate-400">•••• 4821</p></PortalSectionCard>
          <PortalSectionCard title="Remittance documents" icon={FileText}><PortalButtonLink href="#" icon={Download} className="w-full justify-center">Download statement</PortalButtonLink></PortalSectionCard>
          <PortalSectionCard title="Questions?" icon={LifeBuoy}><PortalButtonLink href={`${base}/messages`} variant="primary" className="w-full justify-center">Message accounts</PortalButtonLink></PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
