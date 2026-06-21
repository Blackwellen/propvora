import React from "react"
import Link from "next/link"
import { CreditCard, Building2 } from "lucide-react"
import {
  AdminCard, AdminTable, AdminStatusChip, AdminEmptyState,
} from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"

type SubscriptionRow = {
  id: string
  workspaceId: string
  workspaceName: string | null
  plan: string
  status: string
  periodEnd: string | null
  stripeSubscriptionId: string | null
}

function statusTone(status: string): AdminTone {
  if (status === "active") return "emerald"
  if (status === "trialing") return "amber"
  if (status === "past_due") return "red"
  if (status === "canceled" || status === "cancelled") return "slate"
  return "slate"
}
function shortDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}

interface Props {
  rows: SubscriptionRow[]
  allCount: number
}

export function SubscriptionsTable({ rows, allCount }: Props) {
  return (
    <AdminCard padded={false}>
      {rows.length === 0 ? (
        <AdminEmptyState
          icon={CreditCard}
          title="No subscriptions match"
          description={allCount === 0
            ? "Subscription records appear here once customers start billing via Stripe."
            : "Try clearing your search or filter."}
        />
      ) : (
        <>
          <AdminTable head={[
            { label: "Workspace" }, { label: "Plan" }, { label: "Status" },
            { label: "Renews" }, { label: "Stripe subscription" },
          ]} minWidth={760}>
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-[#FAFCFF]">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/workspaces/${s.workspaceId}`} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0B1B3F] hover:text-[#2563EB]">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />{s.workspaceName}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <AdminStatusChip tone="blue">{s.plan}</AdminStatusChip>
                </td>
                <td className="px-4 py-2.5">
                  <AdminStatusChip tone={statusTone(s.status)} dot>{s.status.replace("_", " ")}</AdminStatusChip>
                </td>
                <td className="px-4 py-2.5 text-[12px] text-slate-400 whitespace-nowrap">{shortDate(s.periodEnd)}</td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">{s.stripeSubscriptionId ?? "—"}</td>
              </tr>
            ))}
          </AdminTable>
          <div className="px-4 py-2.5 border-t border-[#EEF3FB] text-[12px] text-slate-500">
            Showing {rows.length} of {allCount} subscription{allCount === 1 ? "" : "s"}
          </div>
        </>
      )}
    </AdminCard>
  )
}
