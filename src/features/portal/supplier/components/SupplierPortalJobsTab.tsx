"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Building2, Calendar, User, ChevronRight, Briefcase, PoundSterling } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import { formatMoney, formatDate, jobStatusMeta } from "@/lib/portal/format"
import type { SupplierJob } from "@/lib/portal/data"

const STATUS_FILTERS = [
  { key: "All", label: "All" },
  { key: "open", label: "Open" },
  { key: "supplier_requested", label: "Awaiting Quote" },
  { key: "in_progress", label: "In Progress" },
  { key: "complete", label: "Complete" },
  { key: "invoiced", label: "Invoiced" },
] as const

function priorityBadge(priority: string) {
  if (priority === "high" || priority === "urgent")
    return (
      <Badge variant="danger" size="sm">
        High Priority
      </Badge>
    )
  if (priority === "medium")
    return (
      <Badge variant="warning" size="sm">
        Medium
      </Badge>
    )
  return null
}

interface SupplierPortalJobsTabProps {
  jobs: SupplierJob[]
  base: string
}

export function SupplierPortalJobsTab({ jobs, base }: SupplierPortalJobsTabProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        j.title.toLowerCase().includes(q) ||
        (j.propertyLabel ?? "").toLowerCase().includes(q) ||
        (j.operatorLabel ?? "").toLowerCase().includes(q) ||
        (j.reference ?? "").toLowerCase().includes(q)
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "open" &&
          !["complete", "invoiced", "closed", "disputed"].includes(j.status)) ||
        j.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [jobs, search, statusFilter])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Jobs</h1>
        <p className="text-sm text-slate-500">
          {jobs.length} total job{jobs.length === 1 ? "" : "s"} assigned to you
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search jobs, properties, operators..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                statusFilter === s.key
                  ? "bg-[var(--brand)] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No jobs found</h3>
            <p className="text-sm text-slate-400 mt-1">
              {jobs.length === 0
                ? "No jobs have been assigned to you yet."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const meta = jobStatusMeta(job.status)
            const amount = job.approved_amount ?? job.quoted_amount
            return (
              <Link key={job.id} href={`${base}/jobs/${job.id}`} className="block">
                <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900">{job.title}</h3>
                          <Badge variant={meta.variant} dot>
                            {meta.label}
                          </Badge>
                          {priorityBadge(job.priority)}
                        </div>
                        {job.reference && (
                          <span className="text-xs text-slate-400 font-mono">{job.reference}</span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                        {job.propertyLabel && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            {job.propertyLabel}
                          </span>
                        )}
                        {job.scheduled_date && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {formatDate(job.scheduled_date)}
                          </span>
                        )}
                        {job.operatorLabel && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            {job.operatorLabel}
                          </span>
                        )}
                        {amount != null && (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <PoundSterling className="w-3.5 h-3.5 shrink-0" />
                            {formatMoney(amount)}
                          </span>
                        )}
                      </div>
                      {job.category && (
                        <div className="mt-2">
                          <Badge variant="outline" size="sm">
                            {job.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700">
                      View Job <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="pt-2">
          <span className="text-xs text-slate-500">
            Showing {filtered.length} of {jobs.length} jobs
          </span>
        </div>
      )}
    </div>
  )
}
