import React from "react"
import Link from "next/link"
import { CreditCard, Building2 } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { listSubscriptions } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

function statusBadge(status: string) {
  if (status === "active")    return <Badge variant="success" dot size="sm">Active</Badge>
  if (status === "trialing")  return <Badge variant="warning" dot size="sm">Trialing</Badge>
  if (status === "past_due")  return <Badge variant="danger" dot size="sm">Past due</Badge>
  if (status === "canceled" || status === "cancelled") return <Badge variant="default" dot size="sm">Cancelled</Badge>
  return <Badge dot size="sm">{status}</Badge>
}

export default async function AdminSubscriptionsPage() {
  const { available, rows } = await listSubscriptions(500)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-xs text-slate-500">Live billing records from the subscriptions table</p>
      </div>

      {/* Honest billing note */}
      <Card className="p-4 border-amber-200 bg-[#FFFBEB]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">MRR &amp; revenue totals are billing-integration dependent</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Plan pricing and MRR are derived from Stripe. Until the Stripe billing integration is live and{" "}
              <code className="font-mono">subscriptions</code> is populated, monetary totals are not shown to avoid fabricated figures.
            </p>
          </div>
        </div>
      </Card>

      {!available ? (
        <Card className="py-12 text-center">
          <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Subscriptions table not provisioned</p>
          <p className="text-xs text-slate-400 mt-1">The subscriptions table is not present in this database yet.</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-12 text-center">
          <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No subscriptions yet</p>
          <p className="text-xs text-slate-400 mt-1">Subscription records appear here once customers start billing via Stripe.</p>
        </Card>
      ) : (
        <Card noPadding>
          {/* Mobile card list */}
          <ul className="lg:hidden divide-y divide-[#F1F5F9]" role="list">
            {rows.map((s) => (
              <li key={s.id} className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/workspaces/${s.workspaceId}`} className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-[#2563EB] min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{s.workspaceName}</span>
                  </Link>
                  {statusBadge(s.status)}
                </div>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <Badge variant="primary" size="sm" className="capitalize">{s.plan}</Badge>
                  <span className="text-[11px] text-slate-500">
                    Renews {s.periodEnd ? new Date(s.periodEnd).toLocaleDateString("en-GB") : "—"}
                  </span>
                </div>
                {s.stripeSubscriptionId && (
                  <p className="mt-1.5 font-mono text-[10px] text-slate-400 truncate">{s.stripeSubscriptionId}</p>
                )}
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50">
                  {["Workspace", "Plan", "Status", "Renewal", "Stripe Subscription ID"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2">
                      <Link href={`/admin/workspaces/${s.workspaceId}`} className="flex items-center gap-1.5 text-xs font-medium text-slate-800 hover:text-[#2563EB]">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {s.workspaceName}
                      </Link>
                    </td>
                    <td className="px-3 py-2"><Badge variant="primary" size="sm" className="capitalize">{s.plan}</Badge></td>
                    <td className="px-3 py-2">{statusBadge(s.status)}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-400 whitespace-nowrap">{s.periodEnd ? new Date(s.periodEnd).toLocaleDateString("en-GB") : "—"}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{s.stripeSubscriptionId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 border-t border-[#E2E8F0]">
            <span className="text-xs text-slate-500">{rows.length} subscription{rows.length === 1 ? "" : "s"}</span>
          </div>
        </Card>
      )}
    </div>
  )
}
