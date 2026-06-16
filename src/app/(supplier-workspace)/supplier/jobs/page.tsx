"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Wrench, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar, ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
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
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate, timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"

const FILTERS = [
  { id: "active", label: "Active" },
  { id: "assigned", label: "New" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
] as const
type FilterId = (typeof FILTERS)[number]["id"]

const ACTIVE = new Set(["assigned", "accepted", "in_progress"])

export default function SupplierJobsPage() {
  const jobs = useSupplierApi<SupplierAssignmentRow[]>(
    useSupplierApiUrl("/api/supplier/jobs", { side: "supplier" }),
    { select: (j) => (j as { items?: SupplierAssignmentRow[] }).items ?? (Array.isArray(j) ? (j as SupplierAssignmentRow[]) : []) }
  )
  const [filter, setFilter] = useState<FilterId>("active")

  const rows = jobs.data ?? []
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
    badge: (j) => <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>,
    onRowClick: (j) => { window.location.href = `/supplier/jobs/${j.id}` },
    fields: [
      { label: "Scheduled", render: (j) => shortDate(j.scheduled_for) },
      { label: "From quote", render: (j) => (j.quote_id ? "Yes" : "Direct") },
      { label: "Updated", render: (j) => timeAgo(j.updated_at ?? j.created_at) },
    ],
  }

  const tabRail = (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {FILTERS.map((f) => {
        const count = f.id === "all" ? rows.length : rows.filter((j) => (f.id === "active" ? ACTIVE.has(j.status) : j.status === f.id)).length
        return (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3.5 py-2.5 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap transition-colors",
              filter === f.id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {f.label}
            {count > 0 && <span className="ml-1.5 text-[11px] text-slate-400">{count}</span>}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-5">
      <MobileTopBar title="Jobs" subtitle="Your work orders" />

      <SupplierPageHeader
        title="Jobs"
        subtitle="Accepted work — schedule, track and complete each job through to payment."
        tabs={tabRail}
      />
      <div className="md:hidden">{tabRail}</div>

      {jobs.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>
      ) : jobs.notReady ? (
        <SupplierCard className="p-5">
          <SupplierNotReady icon={Wrench} title="Jobs coming online" description="Your accepted jobs appear here once the supplier jobs service is connected." />
        </SupplierCard>
      ) : filtered.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Wrench}
            title={filter === "completed" ? "No completed jobs yet" : "No jobs here"}
            description="Accepted quotes become jobs you can schedule and track. As you win work, it appears here with its lifecycle status."
          />
        </SupplierCard>
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
                    <Td className="text-slate-600">{j.quote_id ? "Accepted quote" : "Direct assignment"}</Td>
                    <Td className="text-slate-600">{shortDate(j.scheduled_for)}</Td>
                    <Td className="text-slate-600">{timeAgo(j.updated_at ?? j.created_at)}</Td>
                    <Td><SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge></Td>
                    <Td className="text-right">
                      <Link href={`/supplier/jobs/${j.id}`} className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
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
  return <th className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>
}
