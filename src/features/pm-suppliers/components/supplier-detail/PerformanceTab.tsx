"use client"

import React from "react"
import { TrendingUp, LayoutGrid, Briefcase, FileText, Receipt, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Job } from "@/types/database"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PerformanceTabProps {
  jobs: Job[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PerformanceTab({ jobs }: PerformanceTabProps) {
  const total        = jobs.length
  const completed    = jobs.filter((j) => ["complete", "invoiced", "closed"].includes(j.status)).length
  const active       = jobs.filter((j) => !["complete", "invoiced", "closed"].includes(j.status)).length
  const completionRate  = total > 0 ? Math.round((completed / total) * 100) : 0
  const totalQuoted     = jobs.reduce((s, j) => s + Number(j.quoted_amount ?? 0), 0)
  const totalInvoiced   = jobs.reduce((s, j) => s + Number(j.invoiced_amount ?? 0), 0)
  const avgJobValue     = total > 0
    ? Math.round(jobs.reduce((s, j) => s + Number(j.approved_amount ?? j.quoted_amount ?? 0), 0) / total)
    : 0

  const stats: { label: string; value: string; icon: React.ElementType; bg: string; color: string }[] = [
    { label: "Total Jobs",      value: String(total),                        icon: LayoutGrid,  bg: "bg-[var(--brand-soft)]",    color: "text-[var(--brand)]"    },
    { label: "Completed",       value: String(completed),                    icon: CheckCircle, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Active",          value: String(active),                       icon: Briefcase,   bg: "bg-amber-50",   color: "text-amber-600"   },
    { label: "Total Quoted",    value: `£${totalQuoted.toLocaleString()}`,   icon: FileText,    bg: "bg-violet-50",  color: "text-violet-600"  },
    { label: "Total Invoiced",  value: `£${totalInvoiced.toLocaleString()}`, icon: Receipt,     bg: "bg-[var(--brand-soft)]",    color: "text-[var(--brand)]"    },
    { label: "Avg Job Value",   value: total > 0 ? `£${avgJobValue.toLocaleString()}` : "—", icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
  ]

  // SVG gauge (r=30 → circ ≈ 188.5)
  const circ       = 2 * Math.PI * 30
  const gaugeColor = completionRate >= 80 ? "#10B981" : completionRate >= 50 ? "#F59E0B" : "#EF4444"

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[var(--brand)]" />
        <h3 className="text-sm font-semibold text-slate-900">Performance Summary</h3>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">No performance data yet</p>
          <p className="text-[12.5px] text-slate-500">Assign jobs to this supplier to build a performance picture.</p>
        </div>
      ) : (
        <>
          {/* Gauge + summary */}
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
            <div className="relative w-[120px] h-[120px] shrink-0">
              <svg className="w-[120px] h-[120px] -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                <circle
                  cx="36" cy="36" r="30" fill="none"
                  stroke={gaugeColor} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${(completionRate / 100) * circ} ${circ}`}
                  className="transition-all duration-700 motion-reduce:transition-none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[26px] font-bold text-slate-900 tabular-nums leading-none">{completionRate}%</span>
                <span className="text-[10px] font-medium text-slate-400 mt-1">complete</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3 w-full">
              {[
                { label: "Completed", value: String(completed), color: "text-emerald-600" },
                { label: "Active",    value: String(active),    color: "text-amber-600"   },
                { label: "Total",     value: String(total),     color: "text-slate-900"   },
              ].map((m) => (
                <div key={m.label} className="text-center sm:text-left">
                  <p className={cn("text-[22px] font-bold tabular-nums leading-tight", m.color)}>{m.value}</p>
                  <p className="text-[11px] font-medium text-slate-500">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-xl border border-slate-100 bg-white p-3.5 flex items-start gap-3 hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                    <Icon className={cn("w-4 h-4", s.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[18px] font-bold text-slate-900 tabular-nums leading-tight truncate">{s.value}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-4">Derived from this supplier&apos;s live job records.</p>
        </>
      )}
    </div>
  )
}
