"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Search, Building2, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import type { AdminWorkspaceRow } from "@/lib/admin/data"

const PLAN_FILTERS = ["All", "enterprise", "business", "pro", "basic", "trial"] as const
const STATUS_FILTERS = ["All", "active", "trialing", "suspended", "past_due", "canceled"] as const

function planBadge(plan: string) {
  if (plan === "enterprise") return <Badge variant="ai" size="sm">Enterprise</Badge>
  if (plan === "business")   return <Badge variant="primary" size="sm">Business</Badge>
  if (plan === "pro")        return <Badge variant="primary" size="sm">Pro</Badge>
  if (plan === "trial")      return <Badge variant="warning" size="sm">Trial</Badge>
  if (plan === "basic")      return <Badge variant="sky" size="sm">Basic</Badge>
  return <Badge variant="default" size="sm">{plan}</Badge>
}

function statusBadge(status: string) {
  if (status === "active")    return <Badge variant="success" dot size="sm">Active</Badge>
  if (status === "trialing")  return <Badge variant="warning" dot size="sm">Trialing</Badge>
  if (status === "suspended") return <Badge variant="danger" dot size="sm">Suspended</Badge>
  if (status === "past_due")  return <Badge variant="danger" dot size="sm">Past due</Badge>
  if (status === "canceled")  return <Badge variant="default" dot size="sm">Archived</Badge>
  return <Badge dot size="sm">{status}</Badge>
}

export default function WorkspacesFilter({ workspaces }: { workspaces: AdminWorkspaceRow[] }) {
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  const filtered = workspaces.filter((w) => {
    const owner = (w.ownerName ?? w.ownerEmail ?? "").toLowerCase()
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || owner.includes(search.toLowerCase())
    const matchPlan = planFilter === "All" || w.plan === planFilter
    const matchStatus = statusFilter === "All" || w.planStatus === statusFilter
    return matchSearch && matchPlan && matchStatus
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input placeholder="Search workspaces or owner..." className="pl-9 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors",
                statusFilter === s ? "bg-[#2563EB] text-white" : "bg-white border border-[#E2E8F0] text-slate-500 hover:bg-slate-50")}>
              {s === "past_due" ? "Past due" : s === "canceled" ? "Archived" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {PLAN_FILTERS.map((p) => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={cn("px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors",
                planFilter === p ? "bg-slate-700 text-white" : "bg-white border border-[#E2E8F0] text-slate-500 hover:bg-slate-50")}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <Card noPadding className="mt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50">
                {["Workspace", "Owner", "Plan", "Status", "Members", "Created", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((ws) => (
                <tr key={ws.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#0D1B2A] flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-slate-800">{ws.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{ws.ownerName ?? ws.ownerEmail ?? "—"}</td>
                  <td className="px-3 py-2">{planBadge(ws.plan)}</td>
                  <td className="px-3 py-2">{statusBadge(ws.planStatus)}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{ws.memberCount}</td>
                  <td className="px-3 py-2 text-[11px] text-slate-400 whitespace-nowrap">
                    {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/workspaces/${ws.id}`}>
                      <Button variant="outline" size="xs" rightIcon={<ChevronRight className="w-3 h-3" />}>View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <Building2 className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No workspaces match your filters</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#E2E8F0]">
          <span className="text-xs text-slate-500">Showing {filtered.length} of {workspaces.length}</span>
        </div>
      </Card>
    </>
  )
}
