import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Activity, Building2, ExternalLink } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { getWorkspaceDetail } from "@/lib/admin/data"
import WorkspaceAdminActions from "./WorkspaceAdminActions"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }> }

function planBadge(plan: string) {
  if (plan === "enterprise") return <Badge variant="ai">Enterprise</Badge>
  if (plan === "business")   return <Badge variant="primary">Business</Badge>
  if (plan === "pro")        return <Badge variant="primary">Pro</Badge>
  if (plan === "trial")      return <Badge variant="warning">Trial</Badge>
  return <Badge variant="default">{plan}</Badge>
}

function statusBadge(status: string) {
  if (status === "active")    return <Badge variant="success" dot>Active</Badge>
  if (status === "trialing")  return <Badge variant="warning" dot>Trialing</Badge>
  if (status === "suspended") return <Badge variant="danger" dot>Suspended</Badge>
  if (status === "past_due")  return <Badge variant="danger" dot>Past due</Badge>
  if (status === "canceled")  return <Badge variant="default" dot>Archived</Badge>
  return <Badge dot>{status}</Badge>
}

export default async function AdminWorkspaceDetailPage({ params }: PageProps) {
  const { id } = await params
  const ws = await getWorkspaceDetail(id)
  if (!ws) notFound()

  const dataEntries = Object.entries(ws.dataSummary)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/workspaces" className="hover:text-[#2563EB] flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Workspaces</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{ws.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Header */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#0D1B2A] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-lg font-bold text-slate-900">{ws.name}</h1>
                  {planBadge(ws.plan)}
                  {statusBadge(ws.planStatus)}
                </div>
                <p className="text-sm text-slate-500">
                  Owner: {ws.owner.name ?? "—"}{ws.owner.email ? ` · ${ws.owner.email}` : ""}
                </p>
                <p className="text-xs text-slate-400">
                  Created {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  {" · "}
                  <span className="font-mono">{ws.id}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Data summary (live cross-workspace counts) */}
          <Card>
            <CardHeader><CardTitle>Data Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dataEntries.map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl border border-[#E2E8F0] bg-white">
                    <p className="text-xl font-bold text-[#2563EB]">{v === null ? "—" : v.toLocaleString("en-GB")}</p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{k}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Members (live) */}
          <Card noPadding>
            <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Members</h3>
              <span className="text-xs text-slate-400">{ws.members.length}</span>
            </div>
            {ws.members.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">No members</div>
            ) : (
              <>
              {/* Mobile card list */}
              <ul className="sm:hidden divide-y divide-[#F1F5F9]" role="list">
                {ws.members.map((m) => (
                  <li key={m.userId}>
                    <Link href={`/admin/users/${m.userId}`} className="flex items-center justify-between gap-2 p-3.5 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{m.name ?? m.email ?? "Unknown"}</p>
                        <p className="text-[11px] text-slate-400 truncate">{m.email ?? ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" size="sm">{m.role}</Badge>
                        <p className="text-[10px] text-slate-400 mt-1">{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("en-GB") : "—"}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50">
                    {["Member", "Role", "Joined"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {ws.members.map((m) => (
                    <tr key={m.userId} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/users/${m.userId}`} className="block group">
                          <p className="text-xs font-medium text-slate-800 group-hover:text-[#2563EB]">{m.name ?? m.email ?? "Unknown"}</p>
                          <p className="text-[10px] text-slate-400">{m.email ?? ""}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5"><Badge variant="outline" size="sm">{m.role}</Badge></td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("en-GB") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              </>
            )}
          </Card>

          {/* Recent audit for this workspace (live) */}
          <Card>
            <CardHeader><CardTitle>Recent Activity (Audit)</CardTitle></CardHeader>
            <CardContent>
              {ws.recentAudit.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No audit events recorded for this workspace.</p>
              ) : (
                <div className="space-y-2.5">
                  {ws.recentAudit.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                        <Activity className="w-3 h-3 text-[#2563EB]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-medium text-slate-700">{e.action}</p>
                        <p className="text-[11px] text-slate-400">{e.actorName ?? e.actorEmail ?? "system"}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                        {e.createdAt ? new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <div className="w-full lg:w-56 shrink-0 space-y-4">
          <Card className="p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Admin Actions</h3>
            <WorkspaceAdminActions workspaceId={ws.id} workspaceName={ws.name} planStatus={ws.planStatus} />
            <p className="text-[10px] text-slate-400 mt-3">Every action is permission-checked and written to the audit log.</p>
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Billing</h3>
            {ws.stripeCustomerId ? (
              <a href={`https://dashboard.stripe.com/customers/${ws.stripeCustomerId}`} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> View in Stripe
              </a>
            ) : (
              <p className="text-xs text-slate-400">No Stripe customer linked. Billing data appears once a subscription is created.</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Demo Data</h3>
            <p className="text-xs text-slate-500">
              {ws.demoDataLoaded ? "Demo data is loaded in this workspace." : "No demo data loaded."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
