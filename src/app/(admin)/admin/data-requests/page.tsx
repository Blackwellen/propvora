import React from "react"
import Link from "next/link"
import { ShieldCheck, Inbox, Clock, AlertTriangle, CheckCircle2, Download, Trash2, FileSearch, Building2 } from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminSectionCard,
  AdminTable,
  AdminStatusChip,
  AdminEmptyState,
  AdminNotConfigured,
  AdminBarChart,
  AdminBanner,
  AdminTabs,
  type AdminKpi,
  type AdminTone,
} from "@/components/admin/ui"
import { getDataRequestsData } from "@/lib/admin/pages/batch4"
import { shortId } from "@/lib/admin/ops"
import { RequestActions } from "./RequestActions"

export const dynamic = "force-dynamic"
export const metadata = { title: "Data requests — Propvora admin" }

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"
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

export default async function AdminDataRequestsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "all" } = await searchParams
  const data = await getDataRequestsData(200)
  const erasureEnabled = process.env.ACCOUNT_ERASURE_ENABLED === "true"

  const filtered = data.rows.filter((r) =>
    tab === "deletion" ? r.kind === "deletion" : tab === "export" ? r.kind === "export" : tab === "completed" ? r.status === "completed" : true,
  )

  const kpis: AdminKpi[] = [
    { label: "Open requests", value: data.kpis.openDeletions + data.kpis.openExports, icon: Inbox, tone: "blue" },
    { label: "Deletions (open)", value: data.kpis.openDeletions, icon: Trash2, tone: "red" },
    { label: "Exports (open)", value: data.kpis.openExports, icon: Download, tone: "amber" },
    { label: "Completed", value: data.kpis.completed, icon: CheckCircle2, tone: "emerald" },
  ]

  const tabs = [
    { key: "all", label: "All requests", href: "/admin/data-requests?tab=all", count: data.rows.length },
    { key: "deletion", label: "Deletions", href: "/admin/data-requests?tab=deletion" },
    { key: "export", label: "Exports", href: "/admin/data-requests?tab=export" },
    { key: "completed", label: "Completed", href: "/admin/data-requests?tab=completed", count: data.kpis.completed },
  ]

  const bothMissing = !data.deletionsConfigured && !data.exportsConfigured

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={FileSearch}
        title="Data requests"
        subtitle="GDPR subject-access, export and right-to-erasure requests across every workspace. Verify, process and deliver within SLA — fully audited."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Data" }, { label: "Data requests" }]}
      />

      <AdminKpiStrip kpis={kpis} cols={4} />

      {erasureEnabled ? (
        <AdminBanner tone="red" icon={ShieldCheck} title="Erasure execution is LIVE.">Processing a deletion permanently removes user data.</AdminBanner>
      ) : (
        <AdminBanner tone="amber" icon={ShieldCheck} title="Dry-run only.">Set <code className="font-mono">ACCOUNT_ERASURE_ENABLED=true</code> to allow erasure execution. Preview and export remain available.</AdminBanner>
      )}

      <AdminSectionCard title="Requests" icon={Inbox} actions={<AdminTabs tabs={tabs} activeKey={tab} />}>
        {bothMissing ? (
          <AdminNotConfigured title="Data-request tables not provisioned" description="Neither account_deletion_requests nor data_export_requests is present in this database yet." />
        ) : filtered.length === 0 ? (
          <AdminEmptyState icon={Inbox} title="No requests in this view" description="GDPR data requests submitted by users appear here for review and processing." />
        ) : (
          <AdminTable head={[{ label: "Subject" }, { label: "Type" }, { label: "Status" }, { label: "Requested" }, { label: "Due / scheduled" }, { label: "Actions" }]} minWidth={860}>
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 align-top">
                <td className="px-4 py-3">
                  <p className="font-mono text-[11px] text-slate-700">{shortId(r.userId)}</p>
                  {r.workspaceId ? (
                    <Link href={`/admin/workspaces/${r.workspaceId}`} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#2563EB]">
                      <Building2 className="w-3 h-3 shrink-0" /><span className="truncate">{r.workspaceName ?? shortId(r.workspaceId)}</span>
                    </Link>
                  ) : <span className="text-[11px] text-slate-400">No workspace</span>}
                </td>
                <td className="px-4 py-3">
                  <AdminStatusChip tone={r.kind === "deletion" ? "red" : "blue"}>{r.kind === "deletion" ? "Erasure" : "Export / SAR"}</AdminStatusChip>
                </td>
                <td className="px-4 py-3"><AdminStatusChip tone={STATUS_TONE[r.status] ?? "slate"} dot>{r.status}</AdminStatusChip></td>
                <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">{fmt(r.requestedAt)}</td>
                <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">{fmt(r.scheduledFor ?? r.expiresAt ?? r.readyAt)}</td>
                <td className="px-4 py-3 min-w-[260px]">
                  {r.status === "completed" || r.status === "cancelled" || r.status === "expired" ? (
                    <span className="text-[11px] text-slate-400">No actions</span>
                  ) : (
                    <RequestActions requestId={r.id} kind={r.kind} erasureEnabled={erasureEnabled} />
                  )}
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminSectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminSectionCard title="Monthly request volume" icon={Clock} className="lg:col-span-1">
          <AdminBarChart data={data.byMonth} tone="blue" />
          <p className="mt-2 text-[11px] text-slate-400">Requests received per month (real, last 6 months).</p>
        </AdminSectionCard>

        <AdminSectionCard title="Request workflow" className="lg:col-span-1">
          <ol className="space-y-2.5">
            {WORKFLOW.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#EFF4FF] text-[#2563EB] text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
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
    </div>
  )
}
