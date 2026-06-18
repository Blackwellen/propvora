"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Bug, Building2, X, ListFilter } from "lucide-react"
import { AdminCard, AdminStatusChip, AdminTable, AdminEmptyState, type AdminTone } from "@/components/admin/ui"
import { cn } from "@/lib/utils"
import type { AdminBugRow } from "@/lib/admin/pages/batch4.types"

const SEV_TONE: Record<string, AdminTone> = { critical: "red", high: "amber", medium: "blue", low: "slate" }
const STATUS_TONE: Record<string, AdminTone> = { new: "sky", triaged: "amber", resolved: "emerald", ignored: "slate" }

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"
}
function shortId(id: string) { return id.length > 8 ? `${id.slice(0, 8)}…` : id }

export default function BugReportsClient({ rows }: { rows: AdminBugRow[] }) {
  const [severity, setSeverity] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null)

  const filtered = useMemo(
    () => rows.filter((r) => (severity === "all" || r.severity === severity) && (status === "all" || r.status === status)),
    [rows, severity, status],
  )
  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null

  const SEVERITIES = ["all", "critical", "high", "medium", "low"]
  const STATUSES = ["all", "new", "triaged", "resolved", "ignored"]

  return (
    <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
      <AdminCard padded={false}>
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-[#EEF3FB]">
          <ListFilter className="w-4 h-4 text-slate-400" />
          <Select label="Severity" value={severity} onChange={setSeverity} options={SEVERITIES} />
          <Select label="Status" value={status} onChange={setStatus} options={STATUSES} />
          <span className="ml-auto text-[12px] text-slate-400">{filtered.length} of {rows.length}</span>
        </div>
        {filtered.length === 0 ? (
          <AdminEmptyState icon={Bug} title="No bugs match" description="Adjust the filters to see captured errors and user-submitted reports." />
        ) : (
          <AdminTable head={[{ label: "Bug" }, { label: "Severity" }, { label: "Status" }, { label: "Route" }, { label: "When" }]} minWidth={620}>
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={cn("cursor-pointer align-top", selected?.id === r.id ? "bg-[#F5F9FF]" : "hover:bg-slate-50/60")}
              >
                <td className="px-4 py-3 max-w-[260px]">
                  <p className="text-[13px] font-medium text-[#0B1B3F] line-clamp-1">{r.message ?? (r.digest ? `Error ${r.digest}` : "Captured error")}</p>
                  <p className="font-mono text-[10px] text-slate-400">{shortId(r.id)}</p>
                </td>
                <td className="px-4 py-3"><AdminStatusChip tone={SEV_TONE[r.severity] ?? "slate"} dot>{r.severity}</AdminStatusChip></td>
                <td className="px-4 py-3"><AdminStatusChip tone={STATUS_TONE[r.status] ?? "slate"}>{r.status}</AdminStatusChip></td>
                <td className="px-4 py-3"><span className="font-mono text-[11px] text-slate-500">{r.route ?? "—"}</span></td>
                <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{fmt(r.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminCard>

      <AdminCard>
        {!selected ? (
          <div className="text-center py-10 text-[13px] text-slate-400">Select a bug to see details.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-mono text-slate-400">{shortId(selected.id)}</p>
                <h3 className="text-[15px] font-semibold text-[#0B1B3F] mt-0.5">{selected.message ?? "Captured error"}</h3>
              </div>
              <button onClick={() => setSelectedId(null)} aria-label="Clear selection" className="text-slate-300 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <AdminStatusChip tone={SEV_TONE[selected.severity] ?? "slate"} dot>{selected.severity}</AdminStatusChip>
              <AdminStatusChip tone={STATUS_TONE[selected.status] ?? "slate"}>{selected.status}</AdminStatusChip>
              <AdminStatusChip tone="slate">{selected.kind}</AdminStatusChip>
            </div>
            <dl className="space-y-2.5 text-[13px]">
              <Row label="Route"><span className="font-mono text-[12px] text-slate-700">{selected.route ?? "—"}</span></Row>
              <Row label="Digest"><span className="font-mono text-[12px] text-slate-700">{selected.digest ?? "—"}</span></Row>
              <Row label="Reported">{fmt(selected.createdAt)}</Row>
              <Row label="Workspace">
                {selected.workspaceId ? (
                  <Link href={`/admin/workspaces/${selected.workspaceId}`} className="inline-flex items-center gap-1 text-[#2563EB] hover:underline">
                    <Building2 className="w-3.5 h-3.5" />{selected.workspaceName ?? shortId(selected.workspaceId)}
                  </Link>
                ) : "—"}
              </Row>
            </dl>
            <div className="rounded-xl bg-slate-50 border border-[#EEF3FB] p-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Message</p>
              <p className="text-[12.5px] text-slate-700 whitespace-pre-wrap break-words">{selected.message ?? "No additional message captured. No stack traces or secrets are stored."}</p>
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[12px] text-slate-500">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-lg border border-[#E2EAF6] bg-white px-2 text-[12px] text-slate-700 capitalize focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-700 text-right">{children}</dd>
    </div>
  )
}
