import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { loadDisputesSection } from "@/lib/money/sections"
import { getMoneyWorkspace, fmtPence } from "../_shared"
import { MoneySectionShell, MoneyEmptyState } from "@/components/money/MoneySectionShell"

export const dynamic = "force-dynamic"

const TYPE_TONE: Record<string, string> = {
  stay: "bg-blue-50 text-blue-700",
  supplier: "bg-violet-50 text-violet-700",
  marketplace: "bg-amber-50 text-amber-700",
}
const PRIORITY_TONE: Record<string, string> = {
  low: "text-slate-500",
  normal: "text-slate-600",
  high: "text-amber-600",
  urgent: "text-red-600 font-semibold",
}

export default async function DisputesPage() {
  const { workspaceId } = await getMoneyWorkspace()
  const data = workspaceId
    ? await loadDisputesSection(await createClient(), workspaceId)
    : { provisioned: false, openCount: 0, payoutHeldCount: 0, disputedPence: 0, rows: [] }

  return (
    <MoneySectionShell
      title="Disputes"
      subtitle="Unified disputes across stay bookings, supplier jobs and the marketplace, with payout holds and resolution."
      notReady={!data.provisioned && workspaceId !== null}
      kpis={[
        { label: "Open disputes", value: String(data.openCount), tone: data.openCount > 0 ? "warning" : "default" },
        { label: "Payouts held", value: String(data.payoutHeldCount), tone: data.payoutHeldCount > 0 ? "negative" : "default" },
        { label: "Amount disputed", value: fmtPence(data.disputedPence) },
      ]}
    >
      {data.rows.length === 0 ? (
        <MoneyEmptyState title="No disputes" hint="Disputes raised on bookings, supplier jobs or marketplace transactions will appear here." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-right">Disputed</th>
                <th className="px-4 py-3 text-right">Refunded</th>
                <th className="px-4 py-3">Payout</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${TYPE_TONE[d.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {d.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-[220px] truncate">{d.reason ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{d.status.replace(/_/g, " ")}</td>
                  <td className={`px-4 py-3 capitalize ${PRIORITY_TONE[d.priority] ?? ""}`}>{d.priority}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPence(d.amountDisputedPence)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-600">{d.amountRefundedPence > 0 ? fmtPence(d.amountRefundedPence) : "—"}</td>
                  <td className="px-4 py-3">
                    {d.payoutHeld ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700">Held</span>
                    ) : (
                      <span className="text-slate-400 text-xs">Open</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/property-manager/money/disputes/${d.id}`} className="text-xs font-semibold text-[#2563EB] hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MoneySectionShell>
  )
}
