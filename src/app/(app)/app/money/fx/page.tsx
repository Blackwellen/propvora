import { createClient } from "@/lib/supabase/server"
import { listFxRates } from "@/lib/money/fx"
import { getMoneyWorkspace } from "../_shared"
import { MoneySectionShell, MoneyEmptyState } from "@/components/money/MoneySectionShell"

export const dynamic = "force-dynamic"

export default async function FxPage() {
  const { workspaceId } = await getMoneyWorkspace()
  const { rates, provisioned } = await listFxRates(await createClient(), workspaceId)

  return (
    <MoneySectionShell
      title="FX Rates"
      subtitle="Foreign-exchange rates used to convert multi-currency money for reporting. Rates are stored as integer micros to avoid float drift."
      notReady={!provisioned}
      kpis={[{ label: "Pairs configured", value: String(rates.length) }]}
    >
      {rates.length === 0 ? (
        <MoneyEmptyState title="No FX rates configured" hint="Default GBP/EUR/USD rates seed automatically when payments are provisioned." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3">As of</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {r.base_currency} → {r.quote_currency}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{(r.rate_micros / 1_000_000).toFixed(6)}</td>
                  <td className="px-4 py-3 text-slate-500">{r.as_of}</td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{r.source}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.workspace_id ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                      {r.workspace_id ? "Workspace" : "Global"}
                    </span>
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
