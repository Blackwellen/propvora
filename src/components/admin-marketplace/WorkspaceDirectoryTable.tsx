import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { PlanBadge } from "./badges"
import type { AdminWorkspaceDirectoryRow } from "./data"

function fmtDate(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—"
}

function statusLabel(s: string | null) {
  if (!s) return "—"
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")
}

/**
 * Workspace directory for platform oversight (type / plan / status / owner +
 * marketplace transaction count). Each row links to the marketplace footprint
 * detail. Desktop table + mobile cards. Read-only.
 */
export default function WorkspaceDirectoryTable({ rows }: { rows: AdminWorkspaceDirectoryRow[] }) {
  return (
    <>
      {/* Mobile card list */}
      <ul className="lg:hidden space-y-2.5" role="list">
        {rows.map((w) => (
          <li key={w.id}>
            <Link
              href={`/admin/marketplace/workspaces/${w.id}`}
              className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{w.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{w.ownerName ?? "—"}</p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                  <PlanBadge plan={w.plan} />
                  <span className="capitalize">{w.type ?? "—"}</span>
                  <span>· {w.marketplaceTxns} txns</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-slate-50">
              {["Workspace", "Owner", "Type", "Plan", "Status", "Mkt txns", "Created", ""].map((h) => (
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
            {rows.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/marketplace/workspaces/${w.id}`}
                    className="text-xs font-medium text-slate-800 hover:text-[#2563EB]"
                  >
                    {w.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{w.ownerName ?? "—"}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500 capitalize">{w.type ?? "—"}</td>
                <td className="px-4 py-2.5"><PlanBadge plan={w.plan} /></td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{statusLabel(w.planStatus)}</td>
                <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">{w.marketplaceTxns}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{fmtDate(w.createdAt)}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/marketplace/workspaces/${w.id}`} className="text-slate-300 hover:text-[#2563EB]">
                    <ChevronRight className="w-4 h-4 inline" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
