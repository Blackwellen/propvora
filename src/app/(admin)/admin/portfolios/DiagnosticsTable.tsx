"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Search, Database, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import type { DiagnosticRow } from "@/lib/admin/data"

interface Props {
  rows: DiagnosticRow[]
  primaryLabel: string
  metaLabel: string
  /** Builds the deep link to the source record in the customer app. */
  sourceHref?: (row: DiagnosticRow) => string
  metaFilters?: string[]
}

export default function DiagnosticsTable({ rows, primaryLabel, metaLabel, sourceHref, metaFilters }: Props) {
  const [search, setSearch] = useState("")
  const [metaFilter, setMetaFilter] = useState("All")

  const filters = metaFilters ?? ["All", ...Array.from(new Set(rows.map((r) => r.meta).filter(Boolean) as string[]))]

  const filtered = rows.filter((r) => {
    const hay = `${r.primary} ${r.secondary ?? ""} ${r.workspaceName}`.toLowerCase()
    const matchSearch = !search || hay.includes(search.toLowerCase())
    const matchMeta = metaFilter === "All" || r.meta === metaFilter
    return matchSearch && matchMeta
  })

  const diagnosticCardMapping: MobileCardMapping<DiagnosticRow> = {
    getKey: (r) => r.id,
    title: (r) => r.primary,
    subtitle: (r) => r.secondary ?? r.workspaceName,
    badge: (r) => (r.status ? <Badge variant="default" size="sm" className="capitalize">{r.status.replace(/_/g, " ")}</Badge> : null),
    onRowClick: sourceHref ? (r) => { window.location.href = sourceHref(r) } : undefined,
    fields: [
      { label: "Workspace", render: (r) => r.workspaceName },
      { label: metaLabel, render: (r) => (r.meta ? r.meta.replace(/_/g, " ") : "—"), hideWhenEmpty: true },
    ],
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input placeholder="Search..." className="pl-9 h-8 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {filters.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            {filters.map((f) => (
              <button key={f} onClick={() => setMetaFilter(f)}
                className={cn("px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors",
                  metaFilter === f ? "bg-[#2563EB] text-white" : "bg-white border border-[#E2E8F0] text-slate-500 hover:bg-slate-50")}>
                {(f ?? "").replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      <ResponsiveTable
        rows={filtered}
        mobile={diagnosticCardMapping}
        className="mt-3"
        emptyState={
          <Card noPadding className="mt-3">
            <div className="text-center py-10">
              <Database className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{rows.length === 0 ? "No records found across any workspace" : "No records match your filters"}</p>
            </div>
          </Card>
        }
      >
      <Card noPadding className="mt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-slate-50">
                {[primaryLabel, "Workspace", metaLabel, "Status", sourceHref ? "" : null].filter(Boolean).map((h) => (
                  <th key={h as string} className="text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2">
                    <p className="text-xs font-medium text-slate-800">{r.primary}</p>
                    {r.secondary && <p className="text-[10px] text-slate-400">{r.secondary}</p>}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    <Link href={`/admin/workspaces/${r.workspaceId}`} className="hover:text-[#2563EB]">{r.workspaceName}</Link>
                  </td>
                  <td className="px-3 py-2">{r.meta ? <Badge variant="outline" size="sm" className="capitalize">{r.meta.replace(/_/g, " ")}</Badge> : <span className="text-[11px] text-slate-300">—</span>}</td>
                  <td className="px-3 py-2">{r.status ? <Badge variant="default" size="sm" className="capitalize">{r.status.replace(/_/g, " ")}</Badge> : <span className="text-[11px] text-slate-300">—</span>}</td>
                  {sourceHref && (
                    <td className="px-3 py-2">
                      <Link href={sourceHref(r)}>
                        <Button variant="ghost" size="xs" rightIcon={<ChevronRight className="w-3 h-3" />}>Source</Button>
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <Database className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{rows.length === 0 ? "No records found across any workspace" : "No records match your filters"}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#E2E8F0]">
          <span className="text-xs text-slate-500">Showing {filtered.length} of {rows.length}</span>
        </div>
      </Card>
      </ResponsiveTable>
    </>
  )
}
