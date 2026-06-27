import React from "react"
import Link from "next/link"
import { Sparkles, Building2 } from "lucide-react"
import {
  AdminSectionCard, AdminTable, AdminEmptyState,
} from "@/components/admin/ui"

type AiUsageRow = {
  workspaceId: string
  workspaceName: string | null
  day: string | null
  tokensIn: number
  tokensOut: number
  costPence: number
}

type WorkspaceSummary = {
  workspaceId: string
  workspaceName: string | null
  tokensIn: number
  tokensOut: number
}

function fmtTokens(n: number) { return n.toLocaleString("en-GB") }
function fmtCost(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Props {
  rows: AiUsageRow[]
  byWorkspace: WorkspaceSummary[]
}

export function AiUsageByWorkspaceTable({ rows, byWorkspace }: Props) {
  return (
    <div className="space-y-4">
      <AdminSectionCard title="Top workspaces" icon={Building2}>
        {byWorkspace.length === 0 ? (
          <p className="text-[13px] text-slate-400 py-8 text-center">No workspace usage yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {byWorkspace.map((w) => (
              <li key={w.workspaceId} className="flex items-center justify-between gap-2">
                <Link href={`/admin/workspaces/${w.workspaceId}`} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700 hover:text-[var(--brand)] min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{w.workspaceName}</span>
                </Link>
                <span className="text-[12px] font-semibold text-[#0B1B3F] tabular-nums shrink-0">
                  {fmtTokens(w.tokensIn + w.tokensOut)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Usage by workspace / day">
        {rows.length === 0 ? (
          <AdminEmptyState icon={Sparkles} title="No AI usage recorded yet" description="Usage is metered as workspaces use AI features." />
        ) : (
          <AdminTable
            head={[
              { label: "Workspace" }, { label: "Day" }, { label: "Tokens in", align: "right" },
              { label: "Tokens out", align: "right" }, { label: "Est. cost", align: "right" },
            ]}
            minWidth={680}
          >
            {rows.slice(0, 100).map((r) => (
              <tr key={`${r.workspaceId}-${r.day}`} className="hover:bg-slate-50/60">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/workspaces/${r.workspaceId}`} className="flex items-center gap-1.5 text-[12px] font-medium text-slate-800 hover:text-[var(--brand)]">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{r.workspaceName}</span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-slate-500 whitespace-nowrap">{r.day || "—"}</td>
                <td className="px-4 py-2.5 text-right text-[12px] text-slate-700 tabular-nums">{fmtTokens(r.tokensIn)}</td>
                <td className="px-4 py-2.5 text-right text-[12px] text-slate-700 tabular-nums">{fmtTokens(r.tokensOut)}</td>
                <td className="px-4 py-2.5 text-right text-[12px] font-medium text-[#0B1B3F] tabular-nums">{fmtCost(r.costPence)}</td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminSectionCard>
    </div>
  )
}
