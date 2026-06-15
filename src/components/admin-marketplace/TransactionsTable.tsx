import React from "react"
import { ArrowRight } from "lucide-react"
import { TransactionStatusBadge } from "./badges"
import { fmtPence, shortId, type AdminTransactionRow } from "./data"

function fmtDate(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—"
}

/**
 * Read-only cross-workspace transaction monitor. Desktop table + mobile card
 * list. Shows the buyer→seller flow and the full fee breakdown (all integer
 * pence). No actions — this is monitoring only.
 */
export default function TransactionsTable({ rows }: { rows: AdminTransactionRow[] }) {
  return (
    <>
      {/* Mobile card list */}
      <ul className="lg:hidden space-y-2.5" role="list">
        {rows.map((t) => (
          <li
            key={t.id}
            className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-[11px] text-slate-400">{shortId(t.id)}</span>
              <TransactionStatusBadge status={t.status} />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-2">
              <span className="truncate">{t.buyerWorkspaceName ?? shortId(t.buyerWorkspaceId)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="truncate">{t.sellerWorkspaceName ?? shortId(t.sellerWorkspaceId)}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <Field label="Gross" value={fmtPence(t.grossPence, t.currency)} strong />
              <Field label="Platform fee" value={fmtPence(t.platformFeePence, t.currency)} />
              <Field label="Provider fee" value={fmtPence(t.providerFeePence, t.currency)} />
              <Field label="Seller payout" value={fmtPence(t.sellerPayoutPence, t.currency)} />
            </div>
            <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-slate-400">
              <span className="capitalize">{(t.transactionType ?? "—").replace(/_/g, " ")}</span>
              <span>{fmtDate(t.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-sm min-w-[920px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-slate-50">
              {[
                "Transaction",
                "Buyer → Seller",
                "Type",
                "Gross",
                "Platform fee",
                "Provider fee",
                "Seller payout",
                "Status",
                "Date",
              ].map((h) => (
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
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">{shortId(t.id)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-slate-800 truncate max-w-[140px]">
                      {t.buyerWorkspaceName ?? shortId(t.buyerWorkspaceId)}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                    <span className="font-medium text-slate-800 truncate max-w-[140px]">
                      {t.sellerWorkspaceName ?? shortId(t.sellerWorkspaceId)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500 capitalize whitespace-nowrap">
                  {(t.transactionType ?? "—").replace(/_/g, " ")}
                </td>
                <td className="px-4 py-2.5 text-xs font-semibold text-slate-900 whitespace-nowrap">
                  {fmtPence(t.grossPence, t.currency)}
                </td>
                <td className="px-4 py-2.5 text-xs text-[#2563EB] whitespace-nowrap">
                  {fmtPence(t.platformFeePence, t.currency)}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                  {fmtPence(t.providerFeePence, t.currency)}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-700 whitespace-nowrap">
                  {fmtPence(t.sellerPayoutPence, t.currency)}
                </td>
                <td className="px-4 py-2.5"><TransactionStatusBadge status={t.status} /></td>
                <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                  {fmtDate(t.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>{value}</span>
    </div>
  )
}
