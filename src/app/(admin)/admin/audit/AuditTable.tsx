"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Search, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import type { AdminAuditRow } from "@/lib/admin/data"

const DATE_FILTERS = [
  { key: "all", label: "All time" },
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
] as const

function actionColour(action: string) {
  if (action.includes("suspend") || action.includes("archived") || action.includes("delete")) return "text-[#EF4444]"
  if (action.includes("restore") || action.includes("reactivat") || action.includes("created")) return "text-[#10B981]"
  if (action.includes("flag") || action.includes("settings")) return "text-[#7C3AED]"
  return "text-[#2563EB]"
}

export default function AuditTable({ events, actions }: { events: AdminAuditRow[]; actions: string[] }) {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("All")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const now = Date.now()
  const cutoff =
    dateFilter === "24h" ? now - 24 * 3600e3 :
    dateFilter === "7d" ? now - 7 * 24 * 3600e3 :
    dateFilter === "30d" ? now - 30 * 24 * 3600e3 : 0

  const filtered = events.filter((e) => {
    const hay = `${e.action} ${e.actorName ?? ""} ${e.actorEmail ?? ""} ${e.resourceType ?? ""} ${e.workspaceName ?? ""} ${e.ip ?? ""}`.toLowerCase()
    const matchSearch = !search || hay.includes(search.toLowerCase())
    const matchAction = actionFilter === "All" || e.action === actionFilter
    const matchDate = !cutoff || (e.createdAt ? new Date(e.createdAt).getTime() >= cutoff : false)
    return matchSearch && matchAction && matchDate
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-start">
        <div className="relative max-w-sm w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input placeholder="Search action, user, workspace, IP..." className="pl-9 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-8 rounded-lg border border-[#E2E8F0] bg-white text-xs px-2 text-slate-600"
        >
          <option value="All">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="flex gap-1">
          {DATE_FILTERS.map((d) => (
            <button key={d.key} onClick={() => setDateFilter(d.key)}
              className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors",
                dateFilter === d.key ? "bg-[#2563EB] text-white" : "bg-white border border-[#E2E8F0] text-slate-500 hover:bg-slate-50")}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <Card noPadding className="mt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50">
                {["Timestamp", "Actor", "Action", "Resource", "Workspace", "IP", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((ev) => (
                <React.Fragment key={ev.id}>
                  <tr className="hover:bg-slate-50/70 cursor-pointer" onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}>
                    <td className="px-3 py-2 text-[11px] text-slate-400 whitespace-nowrap font-mono">
                      {ev.createdAt ? new Date(ev.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs font-medium text-slate-800">
                      {ev.actorId ? (
                        <Link href={`/admin/users/${ev.actorId}`} className="hover:text-[#2563EB]" onClick={(e) => e.stopPropagation()}>
                          {ev.actorName ?? ev.actorEmail ?? "system"}
                        </Link>
                      ) : (ev.actorName ?? ev.actorEmail ?? "system")}
                    </td>
                    <td className="px-3 py-2"><span className={cn("text-xs font-mono font-medium", actionColour(ev.action))}>{ev.action}</span></td>
                    <td className="px-3 py-2">{ev.resourceType ? <Badge variant="outline" size="sm">{ev.resourceType}</Badge> : <span className="text-[11px] text-slate-300">—</span>}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {ev.workspaceId ? (
                        <Link href={`/admin/workspaces/${ev.workspaceId}`} className="hover:text-[#2563EB]" onClick={(e) => e.stopPropagation()}>
                          {ev.workspaceName ?? "workspace"}
                        </Link>
                      ) : <span className="text-[11px] text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{ev.ip ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Button variant="ghost" size="xs">
                        {expandedId === ev.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </td>
                  </tr>
                  {expandedId === ev.id && (
                    <tr>
                      <td colSpan={7} className="px-3 py-2 bg-slate-50">
                        <pre className="text-[11px] text-slate-600 font-mono overflow-auto max-h-40 bg-slate-100 p-3 rounded-lg">
                          {JSON.stringify({ id: ev.id, resourceId: ev.resourceId, before: ev.before, after: ev.after }, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <FileText className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{events.length === 0 ? "No audit events recorded yet" : "No events match your filters"}</p>
              {events.length === 0 && <p className="text-xs text-slate-400 mt-1">Admin actions (suspend, archive, flag changes) will appear here.</p>}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#E2E8F0]">
          <span className="text-xs text-slate-500">Showing {filtered.length} of {events.length} events</span>
        </div>
      </Card>
    </>
  )
}
