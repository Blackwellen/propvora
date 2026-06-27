import { createClient } from "@/lib/supabase/server"
import { loadHolds } from "@/lib/money/sections"
import { getMoneyWorkspace, fmtPence } from "../_shared"
import { MoneySectionShell, MoneyEmptyState } from "@/components/money/MoneySectionShell"

export const dynamic = "force-dynamic"

const HOLD_TONE: Record<string, string> = {
  held: "bg-amber-50 text-amber-700",
  released: "bg-emerald-50 text-emerald-700",
  refunded: "bg-[var(--brand-soft)] text-[var(--brand)]",
  cancelled: "bg-slate-100 text-slate-600",
}

export default async function HoldsPage() {
  const { workspaceId } = await getMoneyWorkspace()
  const data = workspaceId
    ? await loadHolds(await createClient(), workspaceId)
    : { provisioned: false, totalHeldPence: 0, totalDeductedPence: 0, activeCount: 0, rows: [] }

  return (
    <MoneySectionShell
      title="Deposit & Damage Holds"
      subtitle="Security deposits and damage holds taken from guests and tenants, with deductions and releases."
      notReady={!data.provisioned && workspaceId !== null}
      kpis={[
        { label: "Currently held", value: fmtPence(data.totalHeldPence), tone: "warning", hint: `${data.activeCount} active hold(s)` },
        { label: "Total deducted", value: fmtPence(data.totalDeductedPence), tone: "negative" },
        { label: "Active holds", value: String(data.activeCount) },
      ]}
    >
      {data.rows.length === 0 ? (
        <MoneyEmptyState title="No holds recorded" hint="Damage and security holds opened on bookings will appear here." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Held</th>
                <th className="px-4 py-3 text-right">Deducted</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.rows.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 capitalize font-medium text-slate-800">{h.holdType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${HOLD_TONE[h.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtPence(h.amountPence)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-600">{h.deductedPence > 0 ? fmtPence(h.deductedPence) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmtPence(h.remainingPence)}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{h.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-GB") : "—"}
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
