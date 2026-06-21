import React from "react"
import Link from "next/link"
import { Building2 } from "lucide-react"
import {
  AdminCard, AdminTable, AdminStatusChip, AdminActionMenu, AdminEmptyState,
} from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"

type WorkspaceRow = {
  id: string
  name: string
  ownerName: string | null
  ownerEmail: string | null
  plan: string
  planStatus: string
  memberCount: number
  createdAt: string | null
}

function planTone(plan: string): AdminTone {
  if (plan === "enterprise") return "violet"
  if (plan === "business" || plan === "pro") return "blue"
  if (plan === "basic") return "sky"
  if (plan === "trial") return "amber"
  return "slate"
}
function statusTone(status: string): AdminTone {
  if (status === "active") return "emerald"
  if (status === "trialing" || status === "trial") return "amber"
  if (status === "suspended" || status === "past_due") return "red"
  return "slate"
}
function shortDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}
function fmt(n: number | null) { return n === null ? "—" : n.toLocaleString("en-GB") }

interface Props {
  rows: WorkspaceRow[]
  allCount: number
  filteredCount: number
  searchParams: { q?: string; status?: string; plan?: string }
  pagination: { current: number; total: number }
}

export function WorkspacesTable({ rows, allCount, filteredCount, searchParams: sp, pagination }: Props) {
  const { current: clamped, total: totalPages } = pagination

  return (
    <AdminCard padded={false}>
      {rows.length === 0 ? (
        <AdminEmptyState
          icon={Building2}
          title="No workspaces match"
          description={allCount === 0 ? "Workspaces appear here as customers sign up." : "Try clearing your search or filters."}
        />
      ) : (
        <>
          <AdminTable head={[
            { label: "Workspace" }, { label: "Owner" }, { label: "Plan" },
            { label: "Status" }, { label: "Members", align: "center" }, { label: "Created" }, { label: "", align: "right" },
          ]} minWidth={860}>
            {rows.map((w) => (
              <tr key={w.id} className="hover:bg-[#FAFCFF]">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/workspaces/${w.id}`} className="flex items-center gap-2.5 group">
                    <span className="w-8 h-8 rounded-lg bg-[#0D1B2A] flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-white" />
                    </span>
                    <span className="block text-[13px] font-semibold text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{w.name}</span>
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-[12.5px] text-slate-600 truncate">{w.ownerName ?? "—"}</p>
                  <p className="text-[11px] text-slate-400 truncate">{w.ownerEmail ?? ""}</p>
                </td>
                <td className="px-4 py-2.5">
                  <AdminStatusChip tone={planTone(w.plan)}>{w.plan}</AdminStatusChip>
                </td>
                <td className="px-4 py-2.5">
                  <AdminStatusChip tone={statusTone(w.planStatus)} dot>{w.planStatus}</AdminStatusChip>
                </td>
                <td className="px-4 py-2.5 text-center text-[13px] text-slate-600">{w.memberCount}</td>
                <td className="px-4 py-2.5 text-[12px] text-slate-400 whitespace-nowrap">{shortDate(w.createdAt)}</td>
                <td className="px-4 py-2.5 text-right">
                  <AdminActionMenu actions={[
                    { label: "View workspace", href: `/admin/workspaces/${w.id}` },
                    { label: "Subscriptions", href: `/admin/subscriptions?workspace=${w.id}` },
                    { label: "Audit log", href: `/admin/audit-log?workspace=${w.id}` },
                  ]} />
                </td>
              </tr>
            ))}
          </AdminTable>
          <div className="px-4 py-2.5 border-t border-[#EEF3FB] flex items-center justify-between">
            <span className="text-[12px] text-slate-500">Showing {rows.length} of {filteredCount}</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <PageLink sp={sp} page={clamped - 1} disabled={clamped <= 1}>Prev</PageLink>
                <span className="text-[12px] text-slate-500 px-2">{clamped} / {totalPages}</span>
                <PageLink sp={sp} page={clamped + 1} disabled={clamped >= totalPages}>Next</PageLink>
              </div>
            )}
          </div>
        </>
      )}
    </AdminCard>
  )
}

function PageLink({
  sp, page, disabled, children,
}: {
  sp: { q?: string; status?: string; plan?: string }
  page: number
  disabled: boolean
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <span className="h-8 px-3 inline-flex items-center rounded-lg text-[12px] font-semibold text-slate-300">
        {children}
      </span>
    )
  }
  const params = new URLSearchParams()
  if (sp.q) params.set("q", sp.q)
  if (sp.status) params.set("status", sp.status)
  if (sp.plan) params.set("plan", sp.plan)
  params.set("page", String(page))
  return (
    <Link
      href={`/admin/workspaces?${params.toString()}`}
      className="h-8 px-3 inline-flex items-center rounded-lg border border-[#E2EAF6] text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  )
}
