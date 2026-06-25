import { FileText } from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getLinkedInvoices } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, StatusChip, PortalEmptyState, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const STATUS_TONE: Record<string, PortalTone> = {
  paid: "emerald", approved: "blue", sent: "amber", viewed: "amber",
  due: "amber", overdue: "red", disputed: "red", draft: "slate", cancelled: "slate",
}

export default async function AccountantInvoicesPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "accountant")
  const base = `/portal/${session.id}/accountant`
  const invoices = await getLinkedInvoices(session)

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Invoices"
        subtitle="Invoices raised against the linked properties."
        backHref={base}
      />
      <PortalCard className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#EEF3FB] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#071B4D]">All invoices</h2>
          <span className="text-xs text-slate-400">{invoices.length} record{invoices.length === 1 ? "" : "s"}</span>
        </div>
        {invoices.length === 0 ? (
          <PortalEmptyState icon={FileText} title="No invoices" description="There are no invoices for the linked properties yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]"><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Paid</th></tr></thead>
              <tbody className="divide-y divide-[#F1F5FB]">
                {invoices.map((i) => {
                  const st = (i.status ?? "draft").toLowerCase()
                  return (
                    <tr key={i.id} className="hover:bg-[#FAFCFF]">
                      <td className="px-4 py-3 font-medium text-[#071B4D]">{i.invoice_number ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(i.issue_date)}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(i.due_date)}</td>
                      <td className="px-4 py-3"><StatusChip tone={STATUS_TONE[st] ?? "slate"}>{i.status ?? "—"}</StatusChip></td>
                      <td className="px-4 py-3 text-right font-semibold text-[#071B4D]">{formatMoney(i.total)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatMoney(i.paid_amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PortalCard>
    </div>
  )
}
