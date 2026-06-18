"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Database, ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AdminCard,
  AdminTable,
  AdminStatusChip,
  AdminEmptyState,
  type AdminTone,
} from "@/components/admin/ui"
import type { DiagnosticRow } from "@/lib/admin/data"

const STATUS_TONE: Record<string, AdminTone> = {
  active: "emerald", published: "emerald", live: "emerald", complete: "emerald", completed: "emerald",
  draft: "slate", archived: "slate", inactive: "slate",
  pending: "amber", pending_review: "amber", in_progress: "amber", review: "amber",
  blocked: "red", overdue: "red", cancelled: "red", failed: "red",
}

function toneFor(status: string | null): AdminTone {
  if (!status) return "slate"
  return STATUS_TONE[status.toLowerCase()] ?? "blue"
}

function humanise(v: string | null): string {
  if (!v) return "—"
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

interface Props {
  rows: DiagnosticRow[]
  primaryLabel: string
  metaLabel: string
  /** Empty-state icon. */
  icon: LucideIcon
}

/**
 * Read-only cross-workspace diagnostics browser (Portfolios / Work / Planning).
 * Search + meta filter are entirely client-side over the already-fetched rows,
 * so there is no extra round-trip. Read-only by design — links deep into the
 * source workspace; no mutating controls.
 */
export default function DiagnosticsBrowser({ rows, primaryLabel, metaLabel, icon: Icon }: Props) {
  const [search, setSearch] = useState("")
  const [metaFilter, setMetaFilter] = useState("All")

  const metaOptions = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((r) => r.meta).filter(Boolean) as string[]))],
    [rows],
  )

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const hay = `${r.primary} ${r.secondary ?? ""} ${r.workspaceName}`.toLowerCase()
        const matchSearch = !search || hay.includes(search.toLowerCase())
        const matchMeta = metaFilter === "All" || r.meta === metaFilter
        return matchSearch && matchMeta
      }),
    [rows, search, metaFilter],
  )

  return (
    <AdminCard padded={false}>
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-[#EEF3FB]">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${primaryLabel.toLowerCase()}s, workspace…`}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2EAF6] bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          />
        </div>
        {metaOptions.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            {metaOptions.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setMetaFilter(f)}
                className={cn(
                  "px-3 h-9 rounded-xl text-[12.5px] font-semibold capitalize transition-colors",
                  metaFilter === f
                    ? "bg-[#0D1B2A] text-white"
                    : "bg-white border border-[#E2EAF6] text-slate-500 hover:bg-slate-50",
                )}
              >
                {f === "All" ? "All" : humanise(f)}
              </button>
            ))}
          </div>
        )}
        <span className="ml-auto text-[12px] text-slate-400">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={rows.length === 0 ? Icon : Database}
          title={rows.length === 0 ? `No ${primaryLabel.toLowerCase()}s found` : "No records match your filters"}
          description={
            rows.length === 0
              ? `No ${primaryLabel.toLowerCase()}s exist across any workspace yet. Records appear here as workspaces create them.`
              : "Try a different search term or clear the active filter."
          }
        />
      ) : (
        <AdminTable
          minWidth={760}
          head={[
            { label: primaryLabel },
            { label: "Workspace" },
            { label: metaLabel },
            { label: "Status" },
            { label: "", align: "right" },
          ]}
        >
          {filtered.map((r) => (
            <tr key={r.id} className="hover:bg-[#FAFCFF]">
              <td className="px-4 py-3">
                <p className="text-[13px] font-semibold text-[#0B1B3F]">{r.primary}</p>
                {r.secondary && <p className="text-[11.5px] text-slate-400">{r.secondary}</p>}
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/workspaces/${r.workspaceId}`} className="text-[12.5px] text-slate-500 hover:text-[#2563EB]">
                  {r.workspaceName}
                </Link>
              </td>
              <td className="px-4 py-3">
                {r.meta ? <AdminStatusChip tone="slate">{humanise(r.meta)}</AdminStatusChip> : <span className="text-slate-300">—</span>}
              </td>
              <td className="px-4 py-3">
                {r.status ? <AdminStatusChip tone={toneFor(r.status)} dot>{humanise(r.status)}</AdminStatusChip> : <span className="text-slate-300">—</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/workspaces/${r.workspaceId}`}
                  className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
                >
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </AdminCard>
  )
}
