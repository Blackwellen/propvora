import React from "react"
import Link from "next/link"
import { Building2, Trash2, Download, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import {
  listAccountDeletionRequests,
  listDataExportRequests,
  shortId,
  type AccountDeletionRow,
  type DataExportRow,
} from "@/lib/admin/ops"
import { RequestActions } from "./RequestActions"

export const dynamic = "force-dynamic"

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"
}

function deletionStatusBadge(status: string) {
  if (status === "completed") return <Badge variant="default" dot size="sm">Completed</Badge>
  if (status === "scheduled") return <Badge variant="warning" dot size="sm">Scheduled</Badge>
  if (status === "cancelled") return <Badge variant="outline" size="sm">Cancelled</Badge>
  if (status === "pending")   return <Badge variant="primary" dot size="sm">Pending</Badge>
  return <Badge dot size="sm">{status}</Badge>
}

function exportStatusBadge(status: string) {
  if (status === "ready")      return <Badge variant="success" dot size="sm">Ready</Badge>
  if (status === "processing") return <Badge variant="warning" dot size="sm">Processing</Badge>
  if (status === "expired")    return <Badge variant="outline" size="sm">Expired</Badge>
  if (status === "failed")     return <Badge variant="danger" dot size="sm">Failed</Badge>
  if (status === "pending")    return <Badge variant="primary" dot size="sm">Pending</Badge>
  return <Badge dot size="sm">{status}</Badge>
}

function Subject({ userId, workspaceId, workspaceName }: { userId: string; workspaceId: string | null; workspaceName: string | null }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[11px] text-slate-700">{shortId(userId)}</p>
      {workspaceId ? (
        <Link
          href={`/admin/workspaces/${workspaceId}`}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#2563EB]"
        >
          <Building2 className="w-3 h-3 shrink-0" />
          <span className="truncate">{workspaceName ?? shortId(workspaceId)}</span>
        </Link>
      ) : (
        <span className="text-[11px] text-slate-400">No workspace</span>
      )}
    </div>
  )
}

function NotProvisioned({ label }: { label: string }) {
  return (
    <Card className="py-10 text-center">
      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500 font-medium">{label} table not provisioned</p>
      <p className="text-xs text-slate-400 mt-1">The table is not present in this database yet.</p>
    </Card>
  )
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof Trash2; title: string; hint: string }) {
  return (
    <Card className="py-10 text-center">
      <Icon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </Card>
  )
}

const TH = "text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap"

export default async function AdminDataRequestsPage() {
  const [deletions, exports] = await Promise.all([
    listAccountDeletionRequests(200),
    listDataExportRequests(200),
  ])

  const openDeletions = deletions.rows.filter((r) => r.status === "pending" || r.status === "scheduled").length
  const openExports = exports.rows.filter((r) => r.status === "pending" || r.status === "processing" || r.status === "ready").length

  // Mirror the server erasure kill-switch so the UI shows whether execution is live.
  const erasureEnabled = process.env.ACCOUNT_ERASURE_ENABLED === "true"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Data Requests</h1>
        <p className="text-xs text-slate-500">
          GDPR account-lifecycle requests across all workspaces · newest first (max 200 each)
        </p>
      </div>

      {/* Erasure execution kill-switch state. */}
      {erasureEnabled ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2">
          <ShieldCheck className="w-4 h-4 text-[#EF4444] shrink-0" />
          <p className="text-xs text-[#B91C1C]">
            <span className="font-semibold">Erasure execution is LIVE.</span> Processing a deletion permanently removes user data.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Dry-run only.</span> Set <code className="font-mono">ACCOUNT_ERASURE_ENABLED=true</code> to allow erasure execution. Preview and export remain available.
          </p>
        </div>
      )}

      {/* ── Account deletions ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">Account deletions (right to erasure)</h2>
          {deletions.available && (
            <span className="text-[11px] text-slate-400">
              {deletions.rows.length} total · {openDeletions} open
            </span>
          )}
        </div>

        {!deletions.available ? (
          <NotProvisioned label="account_deletion_requests" />
        ) : deletions.rows.length === 0 ? (
          <EmptyState icon={Trash2} title="No deletion requests" hint="Erasure requests submitted by users appear here for review." />
        ) : (
          <Card noPadding>
            {/* Mobile card list */}
            <ul className="lg:hidden divide-y divide-[#F1F5F9]" role="list">
              {deletions.rows.map((r: AccountDeletionRow) => (
                <li key={r.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Subject userId={r.userId} workspaceId={r.workspaceId} workspaceName={r.workspaceName} />
                    {deletionStatusBadge(r.status)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                    <Badge variant="outline" size="sm" className="capitalize">
                      {r.requestType === "workspace" ? "Workspace" : "User account"}
                    </Badge>
                    <span>Requested {fmt(r.requestedAt)}</span>
                    {r.scheduledFor && <span>· Scheduled {fmt(r.scheduledFor)}</span>}
                  </div>
                  {r.status === "completed" || r.status === "cancelled" ? (
                    <span className="text-[11px] text-slate-400">No actions</span>
                  ) : (
                    <RequestActions requestId={r.id} kind="deletion" erasureEnabled={erasureEnabled} />
                  )}
                </li>
              ))}
            </ul>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50">
                    {["Subject", "Type", "Status", "Requested", "Scheduled for", "Completed", "Actions"].map((h) => (
                      <th key={h} className={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {deletions.rows.map((r: AccountDeletionRow) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2"><Subject userId={r.userId} workspaceId={r.workspaceId} workspaceName={r.workspaceName} /></td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" size="sm" className="capitalize">
                          {r.requestType === "workspace" ? "Workspace" : "User account"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{deletionStatusBadge(r.status)}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">{fmt(r.requestedAt)}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">{fmt(r.scheduledFor)}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-400 whitespace-nowrap">{fmt(r.completedAt)}</td>
                      <td className="px-3 py-2 align-top min-w-[260px]">
                        {r.status === "completed" || r.status === "cancelled" ? (
                          <span className="text-[11px] text-slate-400">No actions</span>
                        ) : (
                          <RequestActions requestId={r.id} kind="deletion" erasureEnabled={erasureEnabled} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-[#E2E8F0]">
              <span className="text-xs text-slate-500">{deletions.rows.length} request{deletions.rows.length === 1 ? "" : "s"}</span>
            </div>
          </Card>
        )}
      </section>

      {/* ── Data exports (SAR) ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">Data exports (subject access requests)</h2>
          {exports.available && (
            <span className="text-[11px] text-slate-400">
              {exports.rows.length} total · {openExports} open
            </span>
          )}
        </div>

        {!exports.available ? (
          <NotProvisioned label="data_export_requests" />
        ) : exports.rows.length === 0 ? (
          <EmptyState icon={Download} title="No export requests" hint="Data-export (SAR) requests submitted by users appear here." />
        ) : (
          <Card noPadding>
            {/* Mobile card list */}
            <ul className="lg:hidden divide-y divide-[#F1F5F9]" role="list">
              {exports.rows.map((r: DataExportRow) => (
                <li key={r.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Subject userId={r.userId} workspaceId={r.workspaceId} workspaceName={r.workspaceName} />
                    {exportStatusBadge(r.status)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                    <span>Requested {fmt(r.requestedAt)}</span>
                    {r.readyAt && <span>· Ready {fmt(r.readyAt)}</span>}
                    {r.expiresAt && <span>· Expires {fmt(r.expiresAt)}</span>}
                  </div>
                  {r.status === "expired" ? (
                    <span className="text-[11px] text-slate-400">Expired</span>
                  ) : (
                    <RequestActions requestId={r.id} kind="export" erasureEnabled={erasureEnabled} />
                  )}
                </li>
              ))}
            </ul>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50">
                    {["Subject", "Status", "Requested", "Ready", "Expires", "Actions"].map((h) => (
                      <th key={h} className={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {exports.rows.map((r: DataExportRow) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2"><Subject userId={r.userId} workspaceId={r.workspaceId} workspaceName={r.workspaceName} /></td>
                      <td className="px-3 py-2">{exportStatusBadge(r.status)}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">{fmt(r.requestedAt)}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">{fmt(r.readyAt)}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-400 whitespace-nowrap">{fmt(r.expiresAt)}</td>
                      <td className="px-3 py-2 align-top min-w-[260px]">
                        {r.status === "expired" ? (
                          <span className="text-[11px] text-slate-400">Expired</span>
                        ) : (
                          <RequestActions requestId={r.id} kind="export" erasureEnabled={erasureEnabled} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 border-t border-[#E2E8F0]">
              <span className="text-xs text-slate-500">{exports.rows.length} request{exports.rows.length === 1 ? "" : "s"}</span>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}
