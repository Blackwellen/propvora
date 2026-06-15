import React from "react"
import Link from "next/link"
import { UserCheck, Building2, Info, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { listCustomers } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

function planBadge(plan: string) {
  if (plan === "enterprise") return <Badge variant="ai" size="sm">Enterprise</Badge>
  if (plan === "business")   return <Badge variant="primary" size="sm">Business</Badge>
  if (plan === "pro")        return <Badge variant="primary" size="sm">Pro</Badge>
  if (plan === "trial")      return <Badge variant="warning" size="sm">Trial</Badge>
  return <Badge variant="default" size="sm">{plan}</Badge>
}

export default async function AdminCustomersPage() {
  const { rows } = await listCustomers()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customers</h1>
        <p className="text-xs text-slate-500">
          {rows.length} customer account{rows.length === 1 ? "" : "s"} · derived from workspace owners
        </p>
      </div>

      <Card className="p-4 border-blue-100 bg-[#EFF6FF]">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600">
            There is no dedicated <code className="font-mono">platform_customers</code> CRM table yet, so this view is derived
            from real data: each workspace owner is treated as one customer account. It is not a fabricated customer list.
          </p>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card className="py-12 text-center">
          <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No customers yet</p>
          <p className="text-xs text-slate-400 mt-1">Customer accounts appear as workspaces are created.</p>
        </Card>
      ) : (
        <Card noPadding>
          {/* Mobile card list */}
          <ul className="lg:hidden divide-y divide-[#F1F5F9]" role="list">
            {rows.map((c) => (
              <li key={c.ownerId} className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.name ?? "—"}</p>
                    <p className="text-[11px] text-slate-400 truncate">{c.email ?? ""}</p>
                  </div>
                  {planBadge(c.plan)}
                </div>
                <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {c.workspaceCount} workspace{c.workspaceCount === 1 ? "" : "s"}
                  </span>
                  <span>
                    Since {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/admin/users/${c.ownerId}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">User</Button>
                  </Link>
                  <Link href={`/admin/workspaces/${c.primaryWorkspaceId}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full" rightIcon={<ChevronRight className="w-3 h-3" />}>Workspace</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50">
                  {["Customer", "Workspaces", "Primary plan", "Since", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {rows.map((c) => (
                  <tr key={c.ownerId} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2">
                      <p className="text-xs font-medium text-slate-800">{c.name ?? "—"}</p>
                      <p className="text-[10px] text-slate-400">{c.email ?? ""}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {c.workspaceCount}
                      </span>
                    </td>
                    <td className="px-3 py-2">{planBadge(c.plan)}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-400 whitespace-nowrap">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                    </td>
                    <td className="px-3 py-2 flex gap-1">
                      <Link href={`/admin/users/${c.ownerId}`}>
                        <Button variant="ghost" size="xs">User</Button>
                      </Link>
                      <Link href={`/admin/workspaces/${c.primaryWorkspaceId}`}>
                        <Button variant="outline" size="xs" rightIcon={<ChevronRight className="w-3 h-3" />}>Workspace</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 border-t border-[#E2E8F0]">
            <span className="text-xs text-slate-500">{rows.length} customer{rows.length === 1 ? "" : "s"}</span>
          </div>
        </Card>
      )}
    </div>
  )
}
