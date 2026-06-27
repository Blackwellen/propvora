import React from "react"
import Link from "next/link"
import { Inbox, Building2, CheckCircle2, AlertTriangle } from "lucide-react"
import {
  AdminSectionCard, AdminTable, AdminStatusChip, AdminEmptyState, AdminNotConfigured, AdminTabs,
} from "@/components/admin/ui"
import type { AdminTone } from "@/components/admin/ui"
import { shortId } from "@/lib/admin/ops"

type DataRequestRow = {
  id: string
  userId: string
  workspaceId: string | null
  workspaceName: string | null
  kind: "deletion" | "export"
  status: string
  requestedAt: string | null
  scheduledFor: string | null
  expiresAt: string | null
  readyAt: string | null
}

const STATUS_TONE: Record<string, AdminTone> = {
  completed: "emerald", ready: "emerald", scheduled: "amber", processing: "amber",
  pending: "blue", cancelled: "slate", expired: "slate", failed: "red",
}

const WORKFLOW = ["Received", "Verified", "In progress", "Redacted", "Delivered", "Closed"]
const REDACTION = [
  "Identity of subject verified",
  "Third-party personal data redacted",
  "Financial / legal records retained per schedule",
  "Export bundle scanned before release",
  "Deletion confirmed against retention policy",
]

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"
}

interface Props {
  rows: DataRequestRow[]
  tabs: { key: string; label: string; href: string; count?: number }[]
  activeTab: string
  bothMissing: boolean
  erasureEnabled: boolean
  renderActions: (request: DataRequestRow) => React.ReactNode
}

export function DataRequestsTable({ rows, tabs, activeTab, bothMissing, erasureEnabled, renderActions }: Props) {
  return (
    <>
      <AdminSectionCard title="Requests" icon={Inbox} actions={<AdminTabs tabs={tabs} activeKey={activeTab} />}>
        {bothMissing ? (
          <AdminNotConfigured
            title="Data-request tables not provisioned"
            description="Neither account_deletion_requests nor data_export_requests is present in this database yet."
          />
        ) : rows.length === 0 ? (
          <AdminEmptyState
            icon={Inbox}
            title="No requests in this view"
            description="GDPR data requests submitted by users appear here for review and processing."
          />
        ) : (
          <AdminTable
            head={[{ label: "Subject" }, { label: "Type" }, { label: "Status" }, { label: "Requested" }, { label: "Due / scheduled" }, { label: "Actions" }]}
            minWidth={860}
          >
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 align-top">
                <td className="px-4 py-3">
                  <p className="font-mono text-[11px] text-slate-700">{shortId(r.userId)}</p>
                  {r.workspaceId ? (
                    <Link href={`/admin/workspaces/${r.workspaceId}`} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[var(--brand)]">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{r.workspaceName ?? shortId(r.workspaceId)}</span>
                    </Link>
                  ) : (
                    <span className="text-[11px] text-slate-400">No workspace</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <AdminStatusChip tone={r.kind === "deletion" ? "red" : "blue"}>
                    {r.kind === "deletion" ? "Erasure" : "Export / SAR"}
                  </AdminStatusChip>
                </td>
                <td className="px-4 py-3">
                  <AdminStatusChip tone={STATUS_TONE[r.status] ?? "slate"} dot>{r.status}</AdminStatusChip>
                </td>
                <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">{fmt(r.requestedAt)}</td>
                <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">
                  {fmt(r.scheduledFor ?? r.expiresAt ?? r.readyAt)}
                </td>
                <td className="px-4 py-3 min-w-[260px]">
                  {r.status === "completed" || r.status === "cancelled" || r.status === "expired" ? (
                    <span className="text-[11px] text-slate-400">No actions</span>
                  ) : (
                    renderActions(r)
                  )}
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminSectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminSectionCard title="Request workflow" className="lg:col-span-1">
          <ol className="space-y-2.5">
            {WORKFLOW.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#EFF4FF] text-[var(--brand)] text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-[13px] text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] text-slate-400">Standard 30-day SLA from receipt to delivery.</p>
        </AdminSectionCard>

        <AdminSectionCard title="Redaction checklist" icon={AlertTriangle} className="lg:col-span-1">
          <ul className="space-y-2.5">
            {REDACTION.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{c}
              </li>
            ))}
          </ul>
        </AdminSectionCard>
      </div>
    </>
  )
}
