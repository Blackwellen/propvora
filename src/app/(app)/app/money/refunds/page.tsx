import { createClient } from "@/lib/supabase/server"
import { loadRefunds } from "@/lib/money/sections"
import { getMoneyWorkspace, fmtPence } from "../_shared"
import { MoneySectionShell, MoneyEmptyState } from "@/components/money/MoneySectionShell"

export const dynamic = "force-dynamic"

export default async function RefundsPage() {
  const { workspaceId } = await getMoneyWorkspace()
  const data = workspaceId
    ? await loadRefunds(await createClient(), workspaceId)
    : { provisioned: false, totalRefundedPence: 0, count: 0, rows: [] }

  return (
    <MoneySectionShell
      title="Refunds"
      subtitle="Confirmed refund reversals recorded against your payments (webhook-confirmed Stripe events)."
      notReady={!data.provisioned && workspaceId !== null}
      kpis={[
        { label: "Total refunded", value: fmtPence(data.totalRefundedPence), tone: "negative" },
        { label: "Refund events", value: String(data.count) },
      ]}
    >
      {data.rows.length === 0 ? (
        <MoneyEmptyState title="No refunds recorded" hint="Refunds are recorded only from verified Stripe charge.refunded events — none yet." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3 text-right">Amount refunded</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.rows.map((r, i) => (
                <tr key={`${r.paymentId}-${i}`} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.paymentId ? r.paymentId.slice(0, 8) : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.currency}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-600">{fmtPence(r.amountPence, r.currency)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString("en-GB") : "—"}
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
