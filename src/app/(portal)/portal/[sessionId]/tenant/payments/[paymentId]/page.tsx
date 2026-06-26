import {
  Download, MessageSquare, PoundSterling, CalendarClock, CheckCircle2, Building2, Hash,
  CreditCard, Home, FileText, Circle, LifeBuoy,
} from "lucide-react"
import { requirePortalSession } from "../../../_guard"
import { getTenantPayments } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function TenantPaymentDetail({ params }: { params: Promise<{ sessionId: string; paymentId: string }> }) {
  const { sessionId, paymentId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`
  const payments = await getTenantPayments(session)
  const p = payments.find((x) => x.id === paymentId) ?? null

  if (!p) {
    return (
      <div className="space-y-5">
        <PortalPageHeader title="Payment detail" backHref={`${base}/payments`} backLabel="Back to payments" />
        <PortalCard><PortalEmptyState icon={CreditCard} title="Payment not found" description="This payment isn't on your ledger." /></PortalCard>
      </div>
    )
  }
  const incoming = p.direction === "in"
  const monthLabel = p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "Rent"

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Payment detail" subtitle={`${monthLabel} rent payment`} backHref={`${base}/payments`} backLabel="Back to payments"
        actions={<PortalButtonLink href={`${base}/documents`} icon={Download}>Statements</PortalButtonLink>}
      />

      {/* Summary */}
      <PortalCard className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <p className="text-3xl font-bold text-[#071B4D]">{formatMoney(p.amount, p.currency ?? "GBP")}</p>
          <StatusChip tone={incoming ? "emerald" : "slate"} dot>{incoming ? "Received" : "Charged"}</StatusChip>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <PortalFact icon={CalendarClock} label={incoming ? "Received on" : "Date"} value={formatDate(p.created_at)} />
          <PortalFact icon={CheckCircle2} label="Status" value={incoming ? "Received" : "Charged"} />
          <PortalFact icon={Building2} label="Property" value="Your home" />
          <PortalFact icon={Hash} label="Reference" value={p.id.slice(0, 12).toUpperCase()} />
        </div>
      </PortalCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Payment breakdown" icon={PoundSterling}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">{p.description ?? "Monthly rent"}</dt><dd className="font-semibold text-[#071B4D]">{formatMoney(p.amount, p.currency ?? "GBP")}</dd></div>
              <div className="flex justify-between border-t border-[#EEF3FB] pt-2"><dt className="font-medium text-slate-600">Total</dt><dd className="font-bold text-[#071B4D]">{formatMoney(p.amount, p.currency ?? "GBP")}</dd></div>
            </dl>
          </PortalSectionCard>
          <PortalSectionCard title="Payment timeline" icon={CalendarClock}>
            <ol className="space-y-3">
              {[["Payment created", true], ["Payment due", true], [incoming ? "Payment received" : "Charge applied", incoming], ["Receipt issued", incoming]].map(([label, done], i) => (
                <li key={i} className="flex gap-3">{done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}<div><p className="text-sm text-slate-700">{label as string}</p><p className="text-[11px] text-slate-400">{formatDate(p.created_at)}</p></div></li>
              ))}
            </ol>
          </PortalSectionCard>
          <PortalSectionCard title="Notes" icon={FileText}>
            <p className="text-sm text-slate-600">No notes on this payment.</p>
          </PortalSectionCard>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Payment method" icon={CreditCard}>
            <p className="text-sm font-semibold text-[#071B4D]">Bank transfer</p>
            <p className="text-xs text-slate-400">Standing order</p>
          </PortalSectionCard>
          <PortalSectionCard title="Linked tenancy" icon={Home} viewAllHref={`${base}/tenancy`} viewAllLabel="View tenancy">
            <p className="text-sm font-semibold text-[#071B4D]">Your home</p>
            <p className="text-xs text-slate-400">{session.workspaceName}</p>
          </PortalSectionCard>
          <PortalSectionCard title="Statements" icon={FileText}>
            <PortalButtonLink href={`${base}/documents`} variant="primary" icon={Download} className="w-full justify-center">View statements</PortalButtonLink>
          </PortalSectionCard>
          <PortalSectionCard title="Payment support" icon={LifeBuoy}>
            <PortalButtonLink href={`${base}/messages`} icon={MessageSquare} className="w-full justify-center">Message manager</PortalButtonLink>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
