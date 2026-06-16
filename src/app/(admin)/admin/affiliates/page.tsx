import React from "react"
import Link from "next/link"
import { UserCheck, Inbox } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { listAffiliates, listAffiliateApplications, listWorkspacePicks } from "@/lib/admin/data"
import { formatPence } from "@/lib/affiliate/levels"
import ApplicationsReview from "./ApplicationsReview"
import CreateAffiliateWizard from "@/components/admin-affiliates/CreateAffiliateWizard"

export const dynamic = "force-dynamic"

function statusBadge(status: string) {
  if (status === "active") return <Badge variant="success" dot size="sm">Active</Badge>
  if (status === "pending") return <Badge variant="warning" dot size="sm">Pending</Badge>
  if (status === "none") return <Badge variant="default" dot size="sm">Not enrolled</Badge>
  return <Badge dot size="sm">{status}</Badge>
}

export default async function AdminAffiliatesPage() {
  const [{ available, rows }, apps, workspacePicks] = await Promise.all([
    listAffiliates(500),
    listAffiliateApplications(500),
    listWorkspacePicks(300),
  ])

  const pendingApps = apps.rows.filter((a) => a.status === "pending_review" || a.status === "submitted").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Affiliates</h1>
          <p className="text-xs text-slate-500">
            Applications, enrolled affiliates and live commission balances. Commission accrues from paid
            invoices (Stripe) and clears after a 30-day cooling-off.
          </p>
        </div>
        <CreateAffiliateWizard workspaces={workspacePicks} />
      </div>

      {/* Applications review */}
      <Card>
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Applications</h2>
          </div>
          {pendingApps > 0 && <Badge variant="warning" size="sm">{pendingApps} pending</Badge>}
        </div>
        <div className="px-4">
          {!apps.available ? (
            <p className="text-sm text-slate-400 py-6 text-center">Applications table not provisioned.</p>
          ) : (
            <ApplicationsReview rows={apps.rows} />
          )}
        </div>
      </Card>

      {/* Enrolled affiliates */}
      {!available ? (
        <Card className="py-12 text-center">
          <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Affiliates table not provisioned</p>
          <p className="text-xs text-slate-400 mt-1">The affiliates table is not present in this database yet.</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-12 text-center">
          <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No affiliates yet</p>
          <p className="text-xs text-slate-400 mt-1">Affiliate accounts appear here as people join the programme.</p>
        </Card>
      ) : (
        <Card noPadding>
          {/* Mobile card list */}
          <ul className="lg:hidden divide-y divide-[#F1F5F9]" role="list">
            {rows.map((a) => (
              <li key={a.id} className="p-3.5">
                <Link href={`/admin/affiliates/${a.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.name ?? "—"}</p>
                      <p className="text-[11px] text-slate-400 truncate">{a.email ?? ""}</p>
                    </div>
                    {statusBadge(a.status)}
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                    <span className="font-mono">{a.code}</span>
                    <span className="capitalize">· {a.origin}</span>
                    <span>· {Math.round(a.commissionRate * 100)}% · {a.referrals} refs</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Pending</p>
                      <p className="text-[12px] font-medium text-amber-600 tabular-nums">{formatPence(a.pendingPence)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Cleared</p>
                      <p className="text-[12px] font-medium text-[#2563EB] tabular-nums">{formatPence(a.clearedPence)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Paid</p>
                      <p className="text-[12px] font-medium text-emerald-600 tabular-nums">{formatPence(a.paidPence)}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm min-w-[920px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50">
                  {["Affiliate", "Code", "Origin", "Status", "Rate", "Active refs", "Pending", "Cleared", "Paid"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2">
                      <Link href={`/admin/affiliates/${a.id}`} className="block hover:text-[#2563EB]">
                        <p className="text-xs font-medium text-slate-800 hover:text-[#2563EB]">{a.name ?? "—"}</p>
                        <p className="text-[10px] text-slate-400">{a.email ?? ""}</p>
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{a.code}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-500 capitalize">{a.origin}</td>
                    <td className="px-3 py-2">{statusBadge(a.status)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{Math.round(a.commissionRate * 100)}%</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{a.referrals}</td>
                    <td className="px-3 py-2 text-xs text-amber-600">{formatPence(a.pendingPence)}</td>
                    <td className="px-3 py-2 text-xs text-[#2563EB]">{formatPence(a.clearedPence)}</td>
                    <td className="px-3 py-2 text-xs text-emerald-600">{formatPence(a.paidPence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 border-t border-[#E2E8F0]">
            <span className="text-xs text-slate-500">{rows.length} affiliate{rows.length === 1 ? "" : "s"}</span>
          </div>
        </Card>
      )}
    </div>
  )
}
