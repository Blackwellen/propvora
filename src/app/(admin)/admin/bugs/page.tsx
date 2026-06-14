import React from "react"
import Link from "next/link"
import { Bug, Building2, ShieldCheck, AlertTriangle, MessageSquareWarning } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { listBugReports, type BugReportRow } from "@/lib/bugs/list"

export const dynamic = "force-dynamic"

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}

function fmt(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function kindBadge(kind: string) {
  if (kind === "user_report") return <Badge variant="primary" dot size="sm">User report</Badge>
  return <Badge variant="danger" dot size="sm">Error</Badge>
}

function statusBadge(status: string) {
  if (status === "resolved") return <Badge variant="success" dot size="sm">Resolved</Badge>
  if (status === "triaged")  return <Badge variant="warning" dot size="sm">Triaged</Badge>
  if (status === "ignored")  return <Badge variant="outline" size="sm">Ignored</Badge>
  return <Badge variant="sky" dot size="sm">New</Badge>
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: "blue" | "slate" }) {
  return (
    <Card>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "blue" ? "text-[#2563EB]" : "text-slate-900"}`}>
        {value}
      </p>
    </Card>
  )
}

const TH = "text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap"

export default async function AdminBugsPage() {
  const bugs = await listBugReports(200)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Bug Reports</h1>
        <p className="text-xs text-slate-500">
          Captured client errors and user-submitted reports across all workspaces · read-only · newest first (max 200)
        </p>
      </div>

      {!bugs.available ? (
        <Card className="py-10 text-center">
          <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">bug_reports table not provisioned</p>
          <p className="text-xs text-slate-400 mt-1">
            Apply migration <code className="font-mono">20260613000008_bug_reports.sql</code> to enable the bug inbox.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <Kpi label="New" value={bugs.newCount} tone="blue" />
            <Kpi label="Total (latest 200)" value={bugs.total} tone="slate" />
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Reports</h2>
            </div>

            {bugs.rows.length === 0 ? (
              <Card className="py-10 text-center">
                <MessageSquareWarning className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">No bug reports yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Client error-boundary captures and user-submitted reports appear here.
                </p>
              </Card>
            ) : (
              <Card noPadding>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-slate-50">
                        {["Kind", "Status", "Route", "Message", "Workspace", "When"].map((h) => (
                          <th key={h} className={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {bugs.rows.map((r: BugReportRow) => (
                        <tr key={r.id} className="hover:bg-slate-50/70 align-top">
                          <td className="px-3 py-2 whitespace-nowrap">{kindBadge(r.kind)}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{statusBadge(r.status)}</td>
                          <td className="px-3 py-2">
                            <span className="font-mono text-[11px] text-slate-600">{r.route ?? "—"}</span>
                          </td>
                          <td className="px-3 py-2 max-w-md">
                            <p className="text-[13px] text-slate-700 line-clamp-2">
                              {r.message ?? (r.digest ? `Error digest ${r.digest}` : "—")}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            {r.workspaceId ? (
                              <Link
                                href={`/admin/workspaces/${r.workspaceId}`}
                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#2563EB]"
                              >
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate font-mono">{shortId(r.workspaceId)}</span>
                              </Link>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">{fmt(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-3 py-2 border-t border-[#E2E8F0] flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-slate-300" />
                  <span className="text-xs text-slate-500">
                    {bugs.rows.length} report{bugs.rows.length === 1 ? "" : "s"} · no stack traces or secrets are stored
                  </span>
                </div>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  )
}
