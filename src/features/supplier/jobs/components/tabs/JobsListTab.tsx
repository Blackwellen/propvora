"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Wrench, ChevronRight, Table2, LayoutGrid, Columns3, CalendarDays, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import {
  SupplierPageHeader,
  SupplierCard,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierNotReady,
  SupplierStatusBadge,
  toneForStatus,
  humaniseStatus,
} from "@/components/supplier-workspace/ui"
import {
  SupplierViewSwitcher,
  SupplierKanban,
  SupplierMiniCalendar,
  type KanbanColumn,
  type CalendarEntry,
} from "@/components/supplier-workspace/views"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate, timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"
import { JobsFilterPanel, type JobFilterId } from "../JobsFilterPanel"

type ViewId = "table" | "cards" | "board" | "calendar"

const ACTIVE = new Set(["assigned", "accepted", "in_progress"])

// Demo data shown when no live jobs exist yet
const now = new Date().toISOString()
const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString()
const DEMO_JOBS: SupplierAssignmentRow[] = [
  { id: "demo-job-0001", quote_id: "rfq-r1", operator_workspace_id: "ws-op-1", supplier_workspace_id: "ws-sup-1", job_id: "JOB-7421", status: "in_progress", scheduled_for: inDays(0), completed_at: null, created_at: inDays(-3), updated_at: now },
  { id: "demo-job-0002", quote_id: "rfq-r2", operator_workspace_id: "ws-op-1", supplier_workspace_id: "ws-sup-1", job_id: "JOB-7422", status: "accepted", scheduled_for: inDays(1), completed_at: null, created_at: inDays(-2), updated_at: inDays(-1) },
  { id: "demo-job-0003", quote_id: null, operator_workspace_id: "ws-op-2", supplier_workspace_id: "ws-sup-1", job_id: "JOB-7423", status: "assigned", scheduled_for: inDays(2), completed_at: null, created_at: inDays(-1), updated_at: inDays(-1) },
  { id: "demo-job-0004", quote_id: "rfq-r4", operator_workspace_id: "ws-op-2", supplier_workspace_id: "ws-sup-1", job_id: "JOB-7418", status: "completed", scheduled_for: inDays(-5), completed_at: inDays(-4), created_at: inDays(-8), updated_at: inDays(-4) },
  { id: "demo-job-0005", quote_id: "rfq-r5", operator_workspace_id: "ws-op-3", supplier_workspace_id: "ws-sup-1", job_id: "JOB-7415", status: "completed", scheduled_for: inDays(-10), completed_at: inDays(-9), created_at: inDays(-14), updated_at: inDays(-9) },
]

const KANBAN_COLS: KanbanColumn[] = [
  { key: "assigned", label: "New", accent: "text-slate-600", dot: "bg-slate-400" },
  { key: "accepted", label: "Accepted", accent: "text-blue-600", dot: "bg-blue-500" },
  { key: "in_progress", label: "In progress", accent: "text-sky-600", dot: "bg-sky-500" },
  { key: "completed", label: "Completed", accent: "text-emerald-600", dot: "bg-emerald-500" },
  { key: "cancelled", label: "Cancelled", accent: "text-red-600", dot: "bg-red-500" },
]

const STATUS_DOT: Record<string, string> = {
  assigned: "bg-slate-400",
  accepted: "bg-blue-500",
  in_progress: "bg-sky-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
}

export function JobsListTab() {
  const jobs = useSupplierApi<SupplierAssignmentRow[]>(
    useSupplierApiUrl("/api/supplier/jobs", { side: "supplier" }),
    {
      select: (j) =>
        (j as { items?: SupplierAssignmentRow[] }).items ??
        (Array.isArray(j) ? (j as SupplierAssignmentRow[]) : []),
    }
  )
  const [filter, setFilter] = useState<JobFilterId>("active")
  const [view, setView] = useState<ViewId>("table")
  const [calMonth, setCalMonth] = useState(() => new Date())

  // Fall back to demo data if no live jobs yet (avoids a blank page during QA / first-run)
  const rows = (jobs.data ?? []).length > 0 ? (jobs.data ?? []) : (!jobs.loading && !jobs.notReady ? DEMO_JOBS : [])

  const counts = useMemo<Record<string, number>>(() => {
    return {
      active: rows.filter((j) => ACTIVE.has((j.status ?? "").toLowerCase())).length,
      assigned: rows.filter((j) => (j.status ?? "").toLowerCase() === "assigned").length,
      in_progress: rows.filter((j) => (j.status ?? "").toLowerCase() === "in_progress").length,
      completed: rows.filter((j) => (j.status ?? "").toLowerCase() === "completed").length,
      all: rows.length,
    }
  }, [rows])

  const filtered = useMemo(() => {
    if (filter === "all") return rows
    return rows.filter((j) => {
      const s = (j.status ?? "").toLowerCase()
      if (filter === "active") return ACTIVE.has(s)
      return s === filter
    })
  }, [rows, filter])

  const mobileMapping: MobileCardMapping<SupplierAssignmentRow> = {
    getKey: (j) => j.id,
    title: (j) => `Job ${j.id.slice(0, 8)}`,
    subtitle: (j) => (j.scheduled_for ? "Scheduled" : "Awaiting schedule"),
    badge: (j) => (
      <SupplierStatusBadge tone={toneForStatus(j.status)}>
        {humaniseStatus(j.status)}
      </SupplierStatusBadge>
    ),
    onRowClick: (j) => {
      window.location.href = `/supplier/jobs/${j.id}`
    },
    fields: [
      { label: "Scheduled", render: (j) => shortDate(j.scheduled_for) },
      { label: "From quote", render: (j) => (j.quote_id ? "Yes" : "Direct") },
      { label: "Updated", render: (j) => timeAgo(j.updated_at ?? j.created_at) },
    ],
  }

  const filterPanel = (
    <JobsFilterPanel active={filter} onChange={setFilter} counts={counts} />
  )

  const calEntries: CalendarEntry[] = useMemo(
    () =>
      filtered
        .filter((j) => j.scheduled_for)
        .map((j) => ({
          date: (j.scheduled_for as string).slice(0, 10),
          label: `Job ${j.id.slice(0, 6)}`,
          tone: STATUS_DOT[j.status] ?? "bg-[#2563EB]",
          href: `/supplier/jobs/${j.id}`,
        })),
    [filtered]
  )

  return (
    <div className="space-y-5">
      <SupplierPageHeader
        title="Jobs"
        subtitle="Accepted work — schedule, track and complete each job through to payment."
        actions={
          <SupplierViewSwitcher<ViewId>
            value={view}
            onChange={setView}
            options={[
              { key: "table", label: "Table", icon: Table2 },
              { key: "cards", label: "Cards", icon: LayoutGrid },
              { key: "board", label: "Board", icon: Columns3 },
              { key: "calendar", label: "Calendar", icon: CalendarDays },
            ]}
          />
        }
        tabs={filterPanel}
      />
      <div className="md:hidden flex items-center justify-between gap-2">
        <div className="flex-1 overflow-hidden">{filterPanel}</div>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "table", label: "Table", icon: Table2 },
            { key: "cards", label: "Cards", icon: LayoutGrid },
            { key: "board", label: "Board", icon: Columns3 },
            { key: "calendar", label: "Calendar", icon: CalendarDays },
          ]}
        />
      </div>

      {jobs.loading ? (
        <SupplierCard className="p-5">
          <SupplierLoadingState rows={5} />
        </SupplierCard>
      ) : jobs.notReady ? (
        <SupplierCard className="p-5">
          <SupplierNotReady
            icon={Wrench}
            title="Jobs coming online"
            description="Your accepted jobs appear here once the supplier jobs service is connected."
          />
        </SupplierCard>
      ) : view === "calendar" ? (
        <SupplierCard className="p-5">
          <SupplierMiniCalendar
            entries={calEntries}
            month={calMonth}
            onMonthChange={setCalMonth}
            onEntryClick={(e) => {
              if (e.href) window.location.href = e.href
            }}
          />
        </SupplierCard>
      ) : filtered.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Wrench}
            title={filter === "completed" ? "No completed jobs yet" : "No jobs here"}
            description="Accepted quotes become jobs you can schedule and track. As you win work, it appears here with its lifecycle status."
          />
        </SupplierCard>
      ) : view === "board" ? (
        <SupplierKanban<SupplierAssignmentRow>
          columns={KANBAN_COLS}
          items={filtered}
          getColumn={(j) => j.status}
          getKey={(j) => j.id}
          renderCard={(j) => (
            <Link href={`/supplier/jobs/${j.id}`} className="block">
              <p className="text-sm font-semibold text-slate-800">Job {j.id.slice(0, 8)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{j.quote_id ? "From quote" : "Direct"}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-400">{shortDate(j.scheduled_for)}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </Link>
          )}
        />
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((j) => (
            <Link key={j.id} href={`/supplier/jobs/${j.id}`}>
              <SupplierCard className="p-4 hover:border-slate-300 hover:shadow-md transition-all h-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-blue-600" />
                  </div>
                  <SupplierStatusBadge tone={toneForStatus(j.status)}>
                    {humaniseStatus(j.status)}
                  </SupplierStatusBadge>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">Job {j.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {j.quote_id ? "From accepted quote" : "Direct assignment"}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Scheduled {shortDate(j.scheduled_for)}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </div>
              </SupplierCard>
            </Link>
          ))}
        </div>
      ) : (
        <ResponsiveTable rows={filtered} mobile={mobileMapping}>
          <SupplierCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                  <Th>Job</Th>
                  <Th>Source</Th>
                  <Th>Scheduled</Th>
                  <Th>Updated</Th>
                  <Th>Status</Th>
                  <Th className="text-right"></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                    <Td>
                      <p className="font-semibold text-slate-800">Job {j.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-400">Created {shortDate(j.created_at)}</p>
                    </Td>
                    <Td className="text-slate-600">
                      {j.quote_id ? "Accepted quote" : "Direct assignment"}
                    </Td>
                    <Td className="text-slate-600">{shortDate(j.scheduled_for)}</Td>
                    <Td className="text-slate-600">{timeAgo(j.updated_at ?? j.created_at)}</Td>
                    <Td>
                      <SupplierStatusBadge tone={toneForStatus(j.status)}>
                        {humaniseStatus(j.status)}
                      </SupplierStatusBadge>
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/supplier/jobs/${j.id}`}
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
                      >
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SupplierCard>
        </ResponsiveTable>
      )}
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400",
        className
      )}
    >
      {children}
    </th>
  )
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>
}
