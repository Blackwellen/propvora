import React from "react"
import Link from "next/link"
import { UserCheck } from "lucide-react"
import {
  AdminCard, AdminTable, AdminStatusChip, AdminActionMenu, AdminEmptyState, AdminNotConfigured,
} from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"

type AffiliateRow = {
  id: string
  name: string | null
  email: string | null
  code: string
  origin: string
  status: string
  commissionRate: number
  referrals: number
  pendingPence: number
  paidPence: number
}

function statusTone(status: string): AdminTone {
  if (status === "active") return "emerald"
  if (status === "pending") return "amber"
  return "slate"
}

interface Props {
  rows: AffiliateRow[]
  allCount: number
  available: boolean
  formatPence: (pence: number) => string
}

export function AffiliatesTable({ rows, allCount, available, formatPence }: Props) {
  if (!available) {
    return (
      <AdminNotConfigured
        title="Affiliates table not provisioned"
        description="The affiliates table is not present in this database yet. Enrolled affiliates and their commission balances will appear here once the programme is live."
      />
    )
  }

  return (
    <AdminCard padded={false}>
      {rows.length === 0 ? (
        <AdminEmptyState
          icon={UserCheck}
          title="No affiliates match"
          description={allCount === 0
            ? "Affiliate accounts appear here as people join the programme."
            : "Try clearing your search or filter."}
        />
      ) : (
        <>
          <AdminTable head={[
            { label: "Affiliate" }, { label: "Code" }, { label: "Status" },
            { label: "Rate", align: "center" }, { label: "Refs", align: "center" },
            { label: "Pending", align: "right" }, { label: "Paid", align: "right" }, { label: "", align: "right" },
          ]} minWidth={900}>
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-[#FAFCFF]">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/affiliates/${a.id}`} className="group block">
                    <span className="block text-[13px] font-semibold text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{a.name ?? "—"}</span>
                    <span className="block text-[11px] text-slate-400 truncate">{a.email ?? ""} · {a.origin}</span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">{a.code}</td>
                <td className="px-4 py-2.5">
                  <AdminStatusChip tone={statusTone(a.status)} dot>
                    {a.status === "none" ? "Not enrolled" : a.status}
                  </AdminStatusChip>
                </td>
                <td className="px-4 py-2.5 text-center text-[12px] text-slate-600">{Math.round(a.commissionRate * 100)}%</td>
                <td className="px-4 py-2.5 text-center text-[12px] text-slate-600">{a.referrals}</td>
                <td className="px-4 py-2.5 text-right text-[12px] text-amber-600 tabular-nums">{formatPence(a.pendingPence)}</td>
                <td className="px-4 py-2.5 text-right text-[12px] text-emerald-600 tabular-nums">{formatPence(a.paidPence)}</td>
                <td className="px-4 py-2.5 text-right">
                  <AdminActionMenu actions={[
                    { label: "View affiliate", href: `/admin/affiliates/${a.id}` },
                    { label: "Workspace", href: `/admin/workspaces/${a.id}` },
                  ]} />
                </td>
              </tr>
            ))}
          </AdminTable>
          <div className="px-4 py-2.5 border-t border-[#EEF3FB] text-[12px] text-slate-500">
            Showing {rows.length} of {allCount} affiliate{allCount === 1 ? "" : "s"}
          </div>
        </>
      )}
    </AdminCard>
  )
}
