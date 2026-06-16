import { createClient } from "@/lib/supabase/server"
import { loadCommissions } from "@/lib/money/sections"
import { getMoneyWorkspace, fmtPence } from "../_shared"
import { MoneySectionShell, MoneyEmptyState } from "@/components/money/MoneySectionShell"

export const dynamic = "force-dynamic"

export default async function CommissionsPage() {
  const { workspaceId } = await getMoneyWorkspace()
  const data = workspaceId
    ? await loadCommissions(await createClient(), workspaceId)
    : { provisioned: false, grossCommissionPence: 0, refundedCommissionPence: 0, netCommissionPence: 0, txnCount: 0, rows: [] }

  return (
    <MoneySectionShell
      title="Commissions"
      subtitle="Platform commission and provider fees on marketplace and booking transactions you sell."
      notReady={!data.provisioned && workspaceId !== null}
      kpis={[
        { label: "Net commission", value: fmtPence(data.netCommissionPence), tone: "positive" },
        { label: "Gross commission", value: fmtPence(data.grossCommissionPence) },
        { label: "Refunded", value: fmtPence(data.refundedCommissionPence), tone: "negative" },
        { label: "Transactions", value: String(data.txnCount) },
      ]}
    >
      {data.rows.length === 0 ? (
        <MoneyEmptyState title="No commission activity yet" hint="Marketplace and booking transactions you sell will appear here." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Platform fee</th>
                <th className="px-4 py-3 text-right">Provider fee</th>
                <th className="px-4 py-3 text-right">Seller payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.rows.map((r) => (
                <tr key={r.transactionId} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 capitalize font-medium text-slate-800">{r.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{r.status}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPence(r.grossPence)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-600">{fmtPence(r.platformFeePence)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">{fmtPence(r.providerFeePence)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPence(r.sellerPayoutPence)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MoneySectionShell>
  )
}
