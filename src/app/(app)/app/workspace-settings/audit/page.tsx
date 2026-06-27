"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Search, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type RiskLevel = "low" | "medium" | "high" | "critical"

interface AuditEntry {
  id: string
  event: string
  user: string
  module: string
  time: string
  risk: RiskLevel
  type: string
}

const TYPE_OPTIONS = [
  { value: "all",      label: "All types" },
  { value: "settings", label: "Settings" },
  { value: "team",     label: "Team" },
  { value: "role",     label: "Role" },
  { value: "ai",       label: "AI" },
  { value: "billing",  label: "Billing" },
  { value: "security", label: "Security" },
]

const DATE_OPTIONS = [
  { value: "7d",  label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
]

const RISK_STYLES: Record<RiskLevel, string> = {
  low:      "bg-slate-100 text-slate-600",
  medium:   "bg-amber-100 text-amber-700",
  high:     "bg-red-100 text-red-700",
  critical: "bg-red-100 text-red-700",
}

function daysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]         = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("7d")

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()

        const wsId = profile?.current_workspace_id
        if (!wsId) { setLoading(false); return }

        const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90
        const since = daysAgo(days)

        const { data, error } = await supabase
          .from("audit_logs")
          // Live schema: action / resource_type / user_id / metadata. The
          // richer presentational fields (actor name, risk) are derived.
          .select("id, action, resource_type, user_id, metadata, created_at")
          .eq("workspace_id", wsId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(200)

        if (error || !data) { setLoading(false); return }

        setEntries(
          data.map((row) => {
            const meta = (row.metadata as Record<string, unknown> | null) ?? {}
            const action = (row.action as string) ?? "—"
            // Coarse risk heuristic from the action verb (delete/remove = high).
            const risk: RiskLevel = /delete|remove|purge|revoke|destroy/i.test(action)
              ? "high"
              : /update|edit|change|disable|invite/i.test(action)
                ? "medium"
                : "low"
            return {
            id:     row.id as string,
            event:  action,
            user:   (meta.actor_name as string) ?? (row.user_id ? "Team member" : "System"),
            module: (row.resource_type as string) ?? "—",
            risk,
            type:   (row.resource_type as string) ?? "settings",
            time:   row.created_at
              ? new Date(row.created_at as string).toLocaleString("en-GB", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                })
              : "—",
            }
          })
        )
      } catch {
        // graceful — table may not exist yet
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateFilter])

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        !search ||
        entry.event.toLowerCase().includes(search.toLowerCase()) ||
        entry.user.toLowerCase().includes(search.toLowerCase()) ||
        entry.module.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === "all" || entry.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [entries, search, typeFilter])

  function handleExport() {
    const rows = [
      ["Event", "User", "Module", "Risk", "Time"],
      ...filtered.map((e) => [e.event, e.user, e.module, e.risk, e.time]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "audit-log.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Audit Logs</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Track all significant actions performed in your workspace
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-disabled)" }}>
              <Search className="w-4 h-4" />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, users, modules…"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] transition-all"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by type"
            className="flex-1 sm:flex-none min-w-[140px] min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white focus:outline-none focus:border-[var(--brand)] transition-all"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date range"
            className="flex-1 sm:flex-none min-w-[140px] min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white focus:outline-none focus:border-[var(--brand)] transition-all"
          >
            {DATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 min-h-[44px] py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="text-[12px] text-slate-400 mb-3">
            Showing {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Audit table (desktop grid) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_80px_120px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50">
              {["Event", "User", "Module", "Risk", "Time"].map((col) => (
                <p key={col} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  {col}
                </p>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[13px] text-slate-400">
                  {entries.length === 0
                    ? "No audit events found. Events will appear here as your team takes actions."
                    : "No audit events match your filters"}
                </p>
              </div>
            ) : (
              filtered.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[2fr_1fr_1fr_80px_120px] gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <p className="text-[12.5px] text-slate-800 font-medium truncate">{entry.event}</p>
                  <p className="text-[12.5px] text-slate-600 truncate">{entry.user}</p>
                  <p className="text-[12.5px] text-slate-500 truncate">{entry.module}</p>
                  <div>
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2.5 py-1 rounded-full",
                        RISK_STYLES[entry.risk]
                      )}
                    >
                      {entry.risk}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-400">{entry.time}</p>
                </div>
              ))
            )}
          </div>

          {/* Audit card list (mobile) */}
          {filtered.length === 0 ? (
            <div className="md:hidden bg-white rounded-2xl border border-slate-200 py-12 text-center">
              <p className="text-[13px] text-slate-400 px-6">
                {entries.length === 0
                  ? "No audit events found. Events will appear here as your team takes actions."
                  : "No audit events match your filters"}
              </p>
            </div>
          ) : (
            <ul className="md:hidden space-y-2.5" role="list">
              {filtered.map((entry) => (
                <li
                  key={entry.id}
                  className="bg-white rounded-2xl border border-[#E8EEF8] shadow-sm p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-bold text-[#071B4D] leading-tight min-w-0">{entry.event}</p>
                    <span
                      className={cn(
                        "shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize",
                        RISK_STYLES[entry.risk]
                      )}
                    >
                      {entry.risk}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                    <div className="min-w-0">
                      <dt className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wide">User</dt>
                      <dd className="text-[13px] font-medium text-slate-700 truncate mt-0.5">{entry.user}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wide">Module</dt>
                      <dd className="text-[13px] font-medium text-slate-700 truncate mt-0.5">{entry.module}</dd>
                    </div>
                    <div className="min-w-0 col-span-2">
                      <dt className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wide">Time</dt>
                      <dd className="text-[13px] font-medium text-slate-700 mt-0.5">{entry.time}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
