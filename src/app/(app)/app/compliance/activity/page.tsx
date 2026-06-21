"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Download,
  Activity,
  AlertTriangle,
  CheckCircle,
  Upload,
  Search,
  Eye,
  RefreshCw,
} from "lucide-react"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { ComplianceKpiCard } from "@/components/compliance"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useComplianceActivity, type ComplianceActivityEvent } from "@/hooks/useComplianceData"
import { fmtDate, humaniseType, downloadCsv } from "../_lib/useComplianceItems"

const SEVERITY_FILTERS = ["", "low", "medium", "high", "critical"]

function linkedRecordHref(linkedType: string | null) {
  const t = (linkedType ?? "").toLowerCase()
  if (t.includes("certificate")) return "/property-manager/compliance/certificates"
  if (t.includes("inspection")) return "/property-manager/compliance/inspections"
  if (t.includes("document")) return "/property-manager/compliance/documents"
  if (t.includes("evidence")) return "/property-manager/compliance/evidence"
  if (t.includes("supplier")) return "/property-manager/compliance/supplier-docs"
  return "/property-manager/compliance/overview"
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
    critical: "bg-red-200 text-red-800 font-bold",
  }
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${map[severity] ?? "bg-slate-100 text-slate-600"}`}>{humaniseType(severity)}</span>
}

function initials(name: string | null) {
  if (!name) return "SY"
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}

export default function ComplianceActivityPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")

  const { data: events = [], isLoading, refetch } = useComplianceActivity()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return events.filter((e) => {
      if (severityFilter && e.severity !== severityFilter) return false
      if (q) {
        const hay = `${e.event_label} ${e.actor_name ?? ""} ${e.linked_record_label ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [events, search, severityFilter])

  const kpis = useMemo(() => {
    const todayStr = new Date().toDateString()
    const today = events.filter((e) => e.created_at && new Date(e.created_at).toDateString() === todayStr).length
    const escalations = events.filter((e) => e.severity === "high" || e.severity === "critical").length
    const completed = events.filter((e) => e.event_type?.includes("complete") || e.event_type?.includes("approved")).length
    const uploads = events.filter((e) => e.event_type?.includes("upload") || e.event_type?.includes("evidence")).length
    return { today, escalations, completed, uploads }
  }, [events])

  function exportLog() {
    downloadCsv(
      "compliance-activity.csv",
      ["Date", "Actor", "Event", "Linked Record", "Source", "Severity", "Details"],
      filtered.map((e) => [
        e.created_at ?? "",
        e.actor_name ?? "",
        e.event_label,
        e.linked_record_label ?? "",
        e.source ?? "",
        e.severity,
        e.change_details ?? "",
      ])
    )
  }

  return (
    <DashboardContainer>
      <PageHeader
        title="Activity"
        description="Audit trail of compliance events, actions and system changes."
        actions={
          <>
            <button onClick={exportLog} disabled={filtered.length === 0} className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
              <Download className="w-4 h-4" />
              Export log
            </button>
            <ActionMenu
              items={[
                { label: "Refresh", icon: RefreshCw, onClick: () => refetch() },
                { label: "Open Overview", icon: Activity, onClick: () => router.push("/property-manager/compliance/overview") },
                { label: "Open Reports", icon: Download, onClick: () => router.push("/property-manager/compliance/reports") },
              ]}
            />
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 py-4">
        <ComplianceKpiCard label="Events today" value={isLoading ? "—" : kpis.today} subtitle="Logged today" icon={Activity} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <ComplianceKpiCard label="Escalations" value={isLoading ? "—" : kpis.escalations} subtitle="High / critical" trendPositive={kpis.escalations === 0} icon={AlertTriangle} iconBg="bg-red-100" iconColor="text-red-600" />
        <ComplianceKpiCard label="Completed actions" value={isLoading ? "—" : kpis.completed} subtitle="Approvals & completions" icon={CheckCircle} iconBg="bg-green-100" iconColor="text-green-600" />
        <ComplianceKpiCard label="Evidence uploads" value={isLoading ? "—" : kpis.uploads} subtitle="Files added" icon={Upload} iconBg="bg-violet-100" iconColor="text-violet-600" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {SEVERITY_FILTERS.map((s) => (
            <option key={s} value={s}>{s ? humaniseType(s) : "All severity"}</option>
          ))}
        </select>
        {(search || severityFilter) && (
          <button onClick={() => { setSearch(""); setSeverityFilter("") }} className="text-sm text-blue-600 hover:underline font-medium px-1">Clear</button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} of {events.length}</span>
      </div>

      {/* Table */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-16 text-center text-sm text-slate-400">Loading activity…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-20 text-center">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">{events.length === 0 ? "No activity recorded yet" : "No events match your filters"}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {events.length === 0
                  ? "Compliance events — certificate changes, inspections, uploads and escalations — will appear here as your team works."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Actor", "Event", "Linked Record", "Time & Date", "Source", "Severity", "Details", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((row: ComplianceActivityEvent) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold bg-blue-500">{initials(row.actor_name)}</div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">{row.actor_name ?? "System"}</p>
                            {row.actor_role && <p className="text-[11px] text-slate-500">{row.actor_role}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">{row.event_label}</p>
                        {row.event_type && <p className="text-[11px] text-slate-500">{humaniseType(row.event_type)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {row.linked_record_label ? (
                          <button onClick={() => router.push(linkedRecordHref(row.linked_record_type))} className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap text-left">
                            {row.linked_record_label}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                        {row.linked_record_type && <p className="text-[11px] text-slate-400">{humaniseType(row.linked_record_type)}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{fmtDate(row.created_at)}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 max-w-[140px]">{row.source ? humaniseType(row.source) : "—"}</td>
                      <td className="px-4 py-3"><SeverityBadge severity={row.severity} /></td>
                      <td className="px-4 py-3 max-w-[200px] text-xs text-slate-500">{row.change_details ?? "—"}</td>
                      <td className="px-4 py-3">
                        <ActionMenu items={[{ label: "Open Record", icon: Eye, onClick: () => router.push(linkedRecordHref(row.linked_record_type)) }]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardContainer>
  )
}
