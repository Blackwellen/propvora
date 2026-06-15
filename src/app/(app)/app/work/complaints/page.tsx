"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { MessageSquareWarning, CheckCircle2, Clock, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { MobileTopBar, MobileTabs } from "@/components/mobile"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useJobs } from "@/hooks/useJobs"
import {
  useWorkspaceComplaints,
  useUpdateComplaint,
  COMPLAINT_STATUS_META,
  COMPLAINT_SEVERITY_META,
  type ComplaintStatus,
  type JobComplaint,
} from "@/lib/suppliers/complaints"

const STATUS_FILTERS: { key: "all" | ComplaintStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
]

const NEXT_ACTIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  open: ["acknowledged", "resolved", "closed"],
  acknowledged: ["resolved", "closed"],
  resolved: ["closed", "open"],
  closed: ["open"],
}

function ComplaintRow({
  complaint,
  jobTitle,
}: {
  complaint: JobComplaint
  jobTitle: string | null
}) {
  const workspaceId = useWorkspaceId()
  const update = useUpdateComplaint()
  const [notes, setNotes] = useState(complaint.resolution_notes ?? "")
  const [expanded, setExpanded] = useState(false)

  const sMeta = COMPLAINT_STATUS_META[complaint.status]
  const sevMeta = COMPLAINT_SEVERITY_META[complaint.severity]

  function applyStatus(status: ComplaintStatus) {
    if (!workspaceId) return
    update.mutate({
      id: complaint.id,
      workspaceId,
      patch: { status, resolution_notes: notes.trim() || null },
    })
  }

  function saveNotes() {
    if (!workspaceId) return
    update.mutate({
      id: complaint.id,
      workspaceId,
      patch: { resolution_notes: notes.trim() || null },
    })
  }

  return (
    <div className="border-b border-slate-100 last:border-0 px-5 py-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn("inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold", sMeta.badge)}>
              {sMeta.label}
            </span>
            <span className={cn("inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold", sevMeta.badge)}>
              {sevMeta.label}
            </span>
            {complaint.category && (
              <span className="text-[11px] text-slate-500">{complaint.category}</span>
            )}
          </div>
          <p className="text-[13px] text-slate-800">{complaint.description}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {jobTitle && (
              <Link
                href={`/app/work/jobs/${complaint.job_id}`}
                className="text-[12px] text-[#2563EB] hover:underline"
              >
                {jobTitle}
              </Link>
            )}
            <span className="text-[11px] text-slate-400">
              Raised {new Date(complaint.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {complaint.resolution_notes && !expanded && (
              <span className="text-[11px] text-slate-500">· Response added</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[12px] font-semibold text-slate-600 hover:text-slate-900 shrink-0"
        >
          {expanded ? "Hide" : "Manage"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3">
          <textarea
            className="w-full min-h-16 rounded-lg border border-slate-200 px-2.5 py-2 text-[12.5px] text-slate-900 resize-y bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            placeholder="Resolution / response notes (visible to the tenant)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={saveNotes}
              disabled={update.isPending}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-white transition-colors disabled:opacity-60"
            >
              Save notes
            </button>
            {NEXT_ACTIONS[complaint.status].map((s) => {
              const meta = COMPLAINT_STATUS_META[s]
              return (
                <button
                  key={s}
                  onClick={() => applyStatus(s)}
                  disabled={update.isPending}
                  className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-[12px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-60"
                >
                  Mark {meta.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComplaintsPage() {
  const workspaceId = useWorkspaceId()
  const { data: complaints = [], isLoading } = useWorkspaceComplaints(workspaceId)
  const { data: jobs = [] } = useJobs(workspaceId)
  const [filter, setFilter] = useState<"all" | ComplaintStatus>("all")

  const jobTitleById = useMemo(() => {
    const m = new Map<string, string>()
    for (const j of jobs) m.set(j.id, j.title)
    return m
  }, [jobs])

  const filtered = useMemo(
    () => (filter === "all" ? complaints : complaints.filter((c) => c.status === filter)),
    [complaints, filter]
  )

  const openCount = complaints.filter((c) => c.status === "open" || c.status === "acknowledged").length
  const resolvedCount = complaints.filter((c) => c.status === "resolved" || c.status === "closed").length

  const KPIS = [
    { label: "Total", value: String(complaints.length), icon: ListChecks, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Open", value: String(openCount), icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Resolved", value: String(resolvedCount), icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
  ]

  return (
    <div className="space-y-5">
      <MobileTopBar title="Complaints" subtitle="Tenant-reported issues" />
      <div className="hidden md:block">
        <PageHeader
          title="Complaints"
          description="Tenant-reported issues and reopened jobs"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", kpi.bg)}>
                <Icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-[11px] font-medium text-slate-600">{kpi.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <WorkTabNav />

      {/* Status filter — MobileTabs below md, segmented strip on desktop */}
      <div className="md:hidden">
        <MobileTabs
          tabs={STATUS_FILTERS.map((f) => ({ id: f.key, label: f.label }))}
          value={filter}
          onChange={(id) => setFilter(id as "all" | ComplaintStatus)}
          aria-label="Filter complaints by status"
        />
      </div>
      <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
              filter === f.key ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <MessageSquareWarning className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No complaints</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              When a tenant reports an issue or reopens a completed job, it appears here so your team can respond.
            </p>
          </div>
        ) : (
          filtered.map((c) => (
            <ComplaintRow key={c.id} complaint={c} jobTitle={jobTitleById.get(c.job_id) ?? null} />
          ))
        )}
      </div>
    </div>
  )
}
