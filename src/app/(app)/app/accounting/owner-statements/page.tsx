import { createClient } from "@/lib/supabase/server"
import { buildOwnerStatement } from "@/lib/accounting/owner-statements"
import { getMoneyWorkspace, fmtPence } from "../../money/_shared"

export const dynamic = "force-dynamic"

function monthBounds(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
  return { from, to }
}

const KIND_TONE: Record<string, string> = {
  income: "text-emerald-600",
  fee: "text-amber-600",
  expense: "text-red-600",
  deposit: "text-blue-600",
  net: "text-slate-900 font-bold",
}

export default async function OwnerStatementsPage() {
  const { workspaceId } = await getMoneyWorkspace()
  const { from, to } = monthBounds()
  const statement = workspaceId
    ? await buildOwnerStatement(await createClient(), { workspaceId, fromDate: from, toDate: to })
    : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Owner Statement</h2>
        <p className="text-sm text-slate-500">
          Money collected on the owner&apos;s behalf, fees and expenses, and the net due — derived from posted journal
          entries for {from} to {to}.
        </p>
      </div>

      {!statement || !statement.provisioned ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No posted journal entries for this period yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Kpi label="Gross collected" value={fmtPence(statement.grossCollectedPence)} tone="text-emerald-600" />
            <Kpi label="Fees & commission" value={fmtPence(statement.feesPence)} tone="text-amber-600" />
            <Kpi label="Expenses paid" value={fmtPence(statement.expensesPence)} tone="text-red-600" />
            <Kpi label="Net due to owner" value={fmtPence(statement.netDuePence)} tone="text-slate-900" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Kind</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {statement.lines.map((l) => (
                  <tr key={`${l.code}-${l.label}`} className={l.kind === "net" ? "bg-slate-50" : "hover:bg-slate-50/50"}>
                    <td className="px-4 py-3 text-slate-800">{l.label}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{l.code}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">{l.kind}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${KIND_TONE[l.kind] ?? ""}`}>{fmtPence(l.amountPence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}
