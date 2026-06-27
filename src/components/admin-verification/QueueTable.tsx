"use client"

import React from "react"
import Link from "next/link"
import { Building2, Search, AlertTriangle, FileText, ChevronRight, Globe } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { StatusBadge, RiskBadge } from "./badges"
import type { VerificationQueueRow } from "./data"

const TH =
  "text-left text-[11px] font-semibold text-slate-500 px-3 py-2.5 whitespace-nowrap"

const STATUS_FILTERS = [
  { value: "all", label: "All open" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "requires_input", label: "Needs info" },
] as const

function shortId(id: string | null) {
  return id ? id.slice(0, 8) : "—"
}

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—"
}

function Subject({ row }: { row: VerificationQueueRow }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-slate-800 truncate">
        {row.fullName ?? "Unnamed subject"}
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <span className="font-mono">{shortId(row.userId)}</span>
        {row.workspaceId && (
          <>
            <span>·</span>
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{row.workspaceName ?? shortId(row.workspaceId)}</span>
          </>
        )}
      </div>
    </div>
  )
}

function SanctionsFlag({ on }: { on: boolean }) {
  if (!on) return <span className="text-[11px] text-slate-300">—</span>
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309]"
      title="A screening signal is present — review required. Not a determination."
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      Signal
    </span>
  )
}

export default function QueueTable({ rows }: { rows: VerificationQueueRow[] }) {
  const [status, setStatus] = React.useState<string>("all")
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false
      if (!q) return true
      return (
        (r.fullName ?? "").toLowerCase().includes(q) ||
        (r.country ?? "").toLowerCase().includes(q) ||
        (r.workspaceName ?? "").toLowerCase().includes(q) ||
        (r.userId ?? "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    })
  }, [rows, status, query])

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value
            const count =
              f.value === "all" ? rows.length : rows.filter((r) => r.status === f.value).length
            return (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                  active
                    ? "bg-[var(--brand)] text-white shadow-[0_2px_8px_rgba(37,99,235,0.28)]"
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
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, country, workspace…"
            className="w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No verifications match</p>
          <p className="text-xs text-slate-400 mt-1">Adjust the status filter or search.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          {/* Mobile cards */}
          <ul className="lg:hidden divide-y divide-[#F1F5F9]" role="list">
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/verification/${r.id}`}
                  className="flex items-start gap-2 p-3.5 active:bg-slate-50"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Subject row={r} />
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                      <RiskBadge level={r.riskLevel} />
                      {r.country && (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {r.country}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {r.documentCount} doc{r.documentCount === 1 ? "" : "s"}
                      </span>
                      <SanctionsFlag on={r.sanctionsSignal} />
                      <span>· {fmt(r.submittedAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-slate-50">
                  {["Subject", "Status", "Risk", "Country", "Docs", "Sanctions", "Submitted", ""].map(
                    (h) => (
                      <th key={h} className={TH}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((r) => (
                  <tr key={r.id} className="group hover:bg-slate-50/70">
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/verification/${r.id}`} className="block">
                        <Subject row={r} />
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <RiskBadge level={r.riskLevel} />
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-slate-600 whitespace-nowrap">
                      {r.country ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-slate-600 tabular-nums">
                      {r.documentCount}
                    </td>
                    <td className="px-3 py-2.5">
                      <SanctionsFlag on={r.sanctionsSignal} />
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-500 whitespace-nowrap">
                      {fmt(r.submittedAt)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/admin/verification/${r.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity"
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
              {filtered.length} verification{filtered.length === 1 ? "" : "s"} in view
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
