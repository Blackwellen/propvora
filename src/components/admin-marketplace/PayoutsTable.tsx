import React from "react"
import { PayoutStatusBadge } from "./badges"
import { fmtPence, shortId, type AdminPayoutRow } from "./data"

function fmtDate(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—"
}

/**
 * Read-only platform-wide payout monitor. Desktop table + mobile cards. Shows
 * status, amount (integer pence), the receiving workspace and the Stripe
 * transfer reference. No actions this wave.
 */
export default function PayoutsTable({ rows }: { rows: AdminPayoutRow[] }) {
  return (
    <>
      {/* Mobile card list */}
      <ul className="lg:hidden space-y-2.5" role="list">
        {rows.map((p) => (
          <li key={p.id} className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-[11px] text-slate-400">{shortId(p.id)}</span>
              <PayoutStatusBadge status={p.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800 truncate">
                {p.workspaceName ?? shortId(p.workspaceId)}
              </span>
              <span className="text-sm font-bold text-slate-900">{fmtPence(p.amountPence, p.currency)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono truncate max-w-[160px]">{p.stripeTransferId ?? "no transfer ref"}</span>
              <span>{fmtDate(p.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-slate-50">
              {["Payout", "Workspace", "Amount", "Status", "Stripe transfer", "Date"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-semibold text-slate-400 px-4 py-2.5 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">{shortId(p.id)}</td>
                <td className="px-4 py-2.5 text-xs font-medium text-slate-800">
                  {p.workspaceName ?? shortId(p.workspaceId)}
                </td>
                <td className="px-4 py-2.5 text-xs font-semibold text-slate-900 whitespace-nowrap">
                  {fmtPence(p.amountPence, p.currency)}
                </td>
                <td className="px-4 py-2.5"><PayoutStatusBadge status={p.status} /></td>
                <td className="px-4 py-2.5 text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
                  {p.stripeTransferId ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
