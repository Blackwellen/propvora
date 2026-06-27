"use client"

import React from "react"
import Link from "next/link"
import { Plus, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SupplierView } from "@/features/suppliers/useSuppliers"
import type { Job } from "@/types/database"

// ─── Status colour helper ─────────────────────────────────────────────────────

export function statusColor(status: string) {
  switch (status) {
    case "complete":
      return "bg-emerald-50 text-emerald-700 border-emerald-100"
    case "in_progress":
    case "scheduled":
      return "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]"
    case "closed":
    case "invoiced":
      return "bg-slate-100 text-slate-500 border-slate-200"
    default:
      return "bg-amber-50 text-amber-700 border-amber-100"
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface JobsTabProps {
  supplier: SupplierView
  jobs: Job[]
  /** When true only the first 5 jobs are shown (used inside OverviewTab) */
  compact?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function JobsTab({ supplier, jobs, compact }: JobsTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Job History <span className="text-slate-400 font-normal ml-1">({jobs.length})</span>
        </h3>
        <Link
          href={`/property-manager/work/jobs/new?supplierId=${supplier.id}`}
          className="flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)] hover:underline"
        >
          <Plus className="w-3 h-3" /> New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Briefcase className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">No jobs assigned yet</p>
          <p className="text-[12.5px] text-slate-500 mb-4">Assign this supplier to a job to start tracking work.</p>
          <Link
            href={`/property-manager/work/jobs/new?supplierId=${supplier.id}`}
            className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors"
          >
            Assign to Job
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Job</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Scheduled</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(compact ? jobs.slice(0, 5) : jobs).map((j) => (
                <tr key={j.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/property-manager/work/jobs/${j.id}`} className="text-[13px] font-semibold text-slate-800 hover:text-[var(--brand)]">
                      {j.title}
                    </Link>
                    {j.reference && <p className="text-[11px] text-slate-400">{j.reference}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", statusColor(j.status))}>
                      {j.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[12px] text-slate-600">
                    {j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-slate-800">
                    {j.approved_amount != null
                      ? `£${j.approved_amount.toLocaleString()}`
                      : j.quoted_amount != null
                      ? `£${j.quoted_amount.toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
