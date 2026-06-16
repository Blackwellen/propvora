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
import { money, shortDate, timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierJob } from "@/components/supplier-workspace/types"

const FILTERS = [
  { id: "active", label: "Active" },
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
] as const
type FilterId = (typeof FILTERS)[number]["id"]

export default function SupplierJobsPage() {
  const jobs = useSupplierApi<SupplierJob[]>(
    useSupplierApiUrl("/api/supplier/jobs", { side: "supplier" }),
    {
      select: (j) =>
        (j as { items?: SupplierJob[]; jobs?: SupplierJob[]; data?: SupplierJob[] }).items ??
        (j as { jobs?: SupplierJob[] }).jobs ??
        (j as { data?: SupplierJob[] }).data ??
        (Array.isArray(j) ? (j as SupplierJob[]) : []),
    }
  )
  const [filter, setFilter] = useState<FilterId>("active")

  const rows = jobs.data ?? []
  const filtered = useMemo(() => {
    if (filter === "all") return rows
    const done = ["completed", "closed", "paid", "approved", "payment_released"]
    return rows.filter((j) => {
      const s = (j.status ?? "").toLowerCase()
      if (filter === "completed") return done.includes(s)
      if (filter === "scheduled") return s === "scheduled" || s === "supplier_confirmed"
      // active = everything not completed/cancelled
      return !done.includes(s) && s !== "cancelled" && s !== "refunded"
    })
  }, [rows, filter])

  const mobileMapping: MobileCardMapping<SupplierJob> = {
    getKey: (j) => j.id ?? j.reference ?? Math.random().toString(36),
    title: (j) => j.title ?? j.reference ?? "Job",
    subtitle: (j) => j.property_label ?? "Property",
    badge: (j) => (j.status ? <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge> : null),
    onRowClick: (j) => { if (j.id) window.location.href = `/supplier/jobs/${j.id}` },
    fields: [
      { label: "Category", render: (j) => (j.category ? humaniseStatus(j.category) : "—") },
      { label: "Scheduled", render: (j) => shortDate(j.scheduled_date) },
      { label: "Value", render: (j) => (j.amount ? money(j.amount, j.currency) : "—") },
      { label: "Updated", render: (j) => timeAgo(j.updated_at ?? j.created_at) },
    ],
  }

  const tabRail = (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => setFilter(f.id)}
          className={cn(
            "px-3.5 py-2.5 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap transition-colors",
            filter === f.id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-5">
      <MobileTopBar title="Jobs" subtitle="Your work orders" />

      <SupplierPageHeader
        title="Jobs"
        subtitle="Accepted work — schedule, track and complete your jobs"
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
            description="Accepted quotes become jobs you can schedule and track. As you win work, it appears here with its status and value."
          />
        </SupplierCard>
      ) : (
        <ResponsiveTable rows={filtered} mobile={mobileMapping}>
          <SupplierCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                  <Th>Job</Th>
                  <Th>Property</Th>
                  <Th>Scheduled</Th>
                  <Th>Value</Th>
                  <Th>Status</Th>
                  <Th className="text-right"></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((j, i) => (
                  <tr key={j.id ?? i} className="hover:bg-slate-50/60 transition-colors">
                    <Td>
                      <p className="font-semibold text-slate-800">{j.title ?? j.reference ?? "Job"}</p>
                      <p className="text-xs text-slate-400">{j.category ? humaniseStatus(j.category) : timeAgo(j.created_at)}</p>
                    </Td>
                    <Td className="text-slate-600">{j.property_label ?? "—"}</Td>
                    <Td className="text-slate-600">{shortDate(j.scheduled_date)}</Td>
                    <Td className="text-slate-600">{j.amount ? money(j.amount, j.currency) : "—"}</Td>
                    <Td>{j.status ? <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge> : "—"}</Td>
                    <Td className="text-right">
                      {j.id && (
                        <Link href={`/supplier/jobs/${j.id}`} className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
                          Open <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
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
