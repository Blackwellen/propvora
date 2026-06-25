import { Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getLandlordTransactions } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, StatusChip, PortalEmptyState,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function AccountantTransactionsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "accountant")
  const base = `/portal/${session.id}/accountant`
  const txns = await getLandlordTransactions(session)

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Transactions"
        subtitle="Full income and expenditure ledger across the linked properties."
        backHref={base}
      />
      <PortalCard className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#EEF3FB] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#071B4D]">Transaction ledger</h2>
          <span className="text-xs text-slate-400">{txns.length} record{txns.length === 1 ? "" : "s"}</span>
        </div>
        {txns.length === 0 ? (
          <PortalEmptyState icon={Wallet} title="No transactions" description="There are no recorded transactions for the linked properties yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Direction</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-[#F1F5FB]">
                {txns.map((t) => { const inc = t.direction === "in"; return (
                  <tr key={t.id} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-[#071B4D] truncate max-w-[220px]">{t.description ?? (inc ? "Income" : "Expense")}</td>
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
  )
}
