import {
  PoundSterling, CalendarClock, CheckCircle2, Building2, Hash, Download, MessageSquare,
  Circle, FileText, Wallet, Home, LifeBuoy,
} from "lucide-react"
import { requirePortalSession } from "../../../_guard"
import { getLandlordTransactions } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function LandlordPaymentDetail({ params }: { params: Promise<{ sessionId: string; paymentId: string }> }) {
  const { sessionId, paymentId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`
  const txns = await getLandlordTransactions(session)
  const t = txns.find((x) => x.id === paymentId) ?? null

  if (!t) {
    return (
      <div className="space-y-5">
        <PortalPageHeader title="Payment detail" backHref={`${base}/payments`} backLabel="Back to payments" />
        <PortalCard><PortalEmptyState icon={Wallet} title="Payment not found" description="This payment isn't on your ledger." /></PortalCard>
      </div>
    )
  }
  const inc = t.direction === "in"
  const gross = t.amount ?? 0
  const fee = Math.round(gross * 0.1)
  const net = gross - fee
  const monthLabel = t.created_at ? new Date(t.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : ""

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Payment detail" subtitle={`${monthLabel} ${inc ? "rent receipt" : "payout"}`} backHref={`${base}/payments`} backLabel="Back to payments"
        actions={<><PortalButtonLink href={`${base}/documents`} icon={Download}>Statements</PortalButtonLink><PortalButtonLink href={`${base}/messages`} variant="primary" icon={MessageSquare}>Message manager</PortalButtonLink></>}
      />

      <PortalCard className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div><p className="text-3xl font-bold text-[#071B4D]">{formatMoney(gross, t.currency ?? "GBP")}</p><p className="text-xs text-slate-400 mt-0.5">Gross {inc ? "received" : "paid"}</p></div>
          <StatusChip tone={inc ? "emerald" : "slate"} dot>{inc ? "Received" : "Paid"}</StatusChip>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <PortalFact icon={CalendarClock} label="Date" value={formatDate(t.created_at)} />
          <PortalFact icon={Building2} label="Property" value="Your property" />
          <PortalFact icon={PoundSterling} label="Net to landlord" value={formatMoney(net)} />
          <PortalFact icon={Hash} label="Reference" value={t.id.slice(0, 12).toUpperCase()} />
        </div>
      </PortalCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Payment breakdown" icon={PoundSterling}>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Monthly rent</dt><dd className="font-semibold text-[#071B4D]">{formatMoney(gross)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Management fee (10%)</dt><dd className="font-semibold text-rose-500">−{formatMoney(fee)}</dd></div>
              <div className="flex justify-between border-t border-[#EEF3FB] pt-2"><dt className="font-medium text-slate-600">Landlord net payout</dt><dd className="font-bold text-emerald-600">{formatMoney(net)}</dd></div>
            </dl>
          </PortalSectionCard>
          <PortalSectionCard title="Payment timeline" icon={CalendarClock}>
            <ol className="space-y-3">{[["Payment created", true], ["Payment due", true], ["Payment received", inc], ["Receipt issued", inc], ["Payout to landlord", inc]].map(([l, d], i) => (
              <li key={i} className="flex gap-3">{d ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}<div><p className="text-sm text-slate-700">{l as string}</p><p className="text-[11px] text-slate-400">{formatDate(t.created_at)}</p></div></li>
            ))}</ol>
          </PortalSectionCard>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Linked property" icon={Home} viewAllHref={`${base}/properties`}>
            <p className="text-sm font-semibold text-[#071B4D]">Your property</p>
          </PortalSectionCard>
          <PortalSectionCard title="Payout account" icon={Building2}><p className="text-sm font-semibold text-[#071B4D]">Bank transfer (BACS)</p></PortalSectionCard>
          <PortalSectionCard title="Statements" icon={FileText}><PortalButtonLink href={`${base}/documents`} icon={Download} className="w-full justify-center">View statements</PortalButtonLink></PortalSectionCard>
          <PortalSectionCard title="Support" icon={LifeBuoy}><PortalButtonLink href={`${base}/messages`} variant="primary" icon={MessageSquare} className="w-full justify-center">Message accounts</PortalButtonLink></PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
