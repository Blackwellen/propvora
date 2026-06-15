"use client"

import React from "react"
import Link from "next/link"
import { Search, Building2, ChevronRight, Flag, Activity } from "lucide-react"
import type { RiskBand, WorkspaceRiskRow } from "@/lib/risk/types"
import { BandBadge } from "./badges"
import { shortId, fmtDate } from "./helpers"

const TH = "text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap"

const BAND_FILTERS: ReadonlyArray<{ value: "all" | RiskBand; label: string }> = [
  { value: "all", label: "All bands" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

function WorkspaceCell({ row }: { row: WorkspaceRiskRow }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-slate-800 truncate">
        {row.workspaceName ?? "Workspace"}
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Building2 className="w-3 h-3 shrink-0" />
        <span className="font-mono">{shortId(row.workspaceId)}</span>
        {row.country && (
          <>
            <span>·</span>
            <span>{row.country}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function RiskTable({ rows }: { rows: WorkspaceRiskRow[] }) {
  const [band, setBand] = React.useState<"all" | RiskBand>("all")
  const [flaggedOnly, setFlaggedOnly] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (band !== "all" && r.band !== band) return false
      if (flaggedOnly && !r.flagged) return false
      if (!q) return true
      return (
        (r.workspaceName ?? "").toLowerCase().includes(q) ||
        (r.country ?? "").toLowerCase().includes(q) ||
        r.workspaceId.toLowerCase().includes(q)
      )
    })
  }, [rows, band, flaggedOnly, query])

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {BAND_FILTERS.map((f) => {
            const active = band === f.value
            const count =
              f.value === "all" ? rows.length : rows.filter((r) => r.band === f.value).length
            return (
              <button
                key={f.value}
                onClick={() => setBand(f.value)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                  active
                    ? "bg-[#2563EB] text-white shadow-[0_2px_8px_rgba(37,99,235,0.28)]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                {f.label}
                <span
                  className={[
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    active ? "bg-white/20" : "bg-white text-slate-500",
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            )
          })}
          <button
            onClick={() => setFlaggedOnly((v) => !v)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
              flaggedOnly
                ? "bg-rose-600 text-white shadow-[0_2px_8px_rgba(225,29,72,0.28)]"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            ].join(" ")}
          >
            <Flag className="w-3.5 h-3.5" />
            Flagged
          </button>
        </div>
        <div className="relative lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspace, country, id…"
            className="w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
          <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No workspaces match</p>
          <p className="text-xs text-slate-400 mt-1">Adjust the band filter or search.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          {/* Mobile cards */}
          <ul className="lg:hidden divide-y divide-[#F1F5F9]" role="list">
            {filtered.map((r) => (
              <li key={r.workspaceId}>
                <Link
                  href={`/admin/risk/${r.workspaceId}`}
                  className="flex items-center gap-3 p-3.5 active:bg-slate-50"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <WorkspaceCell row={r} />
                      <BandBadge band={r.band} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                      <span className="tabular-nums font-semibold text-slate-700">{r.score}/100</span>
                      <span>·</span>
                      <span>{r.eventCount} signal{r.eventCount === 1 ? "" : "s"}</span>
                      {r.flagged && (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                          <Flag className="w-3 h-3" /> Flagged
                        </span>
                      )}
                      <span>· {fmtDate(r.lastEventAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50">
                  {["Workspace", "Band", "Score", "Signals", "Flag", "Last signal", ""].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((r) => (
                  <tr key={r.workspaceId} className="group hover:bg-slate-50/70">
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/risk/${r.workspaceId}`} className="block">
                        <WorkspaceCell row={r} />
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <BandBadge band={r.band} />
                    </td>
                    <td className="px-3 py-2.5 text-[13px] font-semibold text-slate-700 tabular-nums">
                      {r.score}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-slate-600 tabular-nums">
                      {r.eventCount}
                    </td>
                    <td className="px-3 py-2.5">
                      {r.flagged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
                          <Flag className="w-3.5 h-3.5" /> Flagged
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-500 whitespace-nowrap">
                      {fmtDate(r.lastEventAt)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/admin/risk/${r.workspaceId}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Review <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-3 py-2 border-t border-[#E2E8F0]">
            <span className="text-xs text-slate-500">
              {filtered.length} workspace{filtered.length === 1 ? "" : "s"} in view
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
