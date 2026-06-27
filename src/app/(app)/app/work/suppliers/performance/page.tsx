"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Receipt,
  Star,
  LayoutGrid,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { SuppliersTabNav } from "@/components/work/SuppliersTabNav"
import { MobileTopBar } from "@/components/mobile"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useJobs } from "@/hooks/useJobs"
import { useSuppliers, type SupplierView } from "@/features/suppliers/useSuppliers"
import { useWorkspaceSupplierRatings } from "@/lib/suppliers/ratings"
import type { Job } from "@/types/database"

const DONE = new Set(["complete", "invoiced", "closed"])

interface SupplierPerf {
  supplier: SupplierView
  total: number
  completed: number
  active: number
  completionRate: number
  invoiced: number
  avgValue: number
  rating: number | null
}

export default function SupplierPerformancePage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { suppliers, loading } = useSuppliers(workspaceId)
  const { data: jobs = [], isLoading: jobsLoading } = useJobs(workspaceId)
  const { data: ratings } = useWorkspaceSupplierRatings(workspaceId)

  const isLoading = loading || jobsLoading

  const rows = useMemo<SupplierPerf[]>(() => {
    const bySupplier = new Map<string, Job[]>()
    for (const j of jobs) {
      if (!j.supplier_contact_id) continue
      const list = bySupplier.get(j.supplier_contact_id) ?? []
      list.push(j)
      bySupplier.set(j.supplier_contact_id, list)
    }
    return suppliers
      .map((s) => {
        const sJobs = bySupplier.get(s.id) ?? []
        const total = sJobs.length
        const completed = sJobs.filter((j) => DONE.has(j.status)).length
        const active = total - completed
        const invoiced = sJobs.reduce((sum, j) => sum + Number(j.invoiced_amount ?? 0), 0)
        const avgValue =
          total > 0
            ? Math.round(sJobs.reduce((sum, j) => sum + Number(j.approved_amount ?? j.quoted_amount ?? 0), 0) / total)
            : 0
        return {
          supplier: s,
          total,
          completed,
          active,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          invoiced,
          avgValue,
          rating: ratings?.get(s.id)?.avg ?? null,
        }
      })
      .sort((a, b) => b.total - a.total || b.invoiced - a.invoiced)
  }, [suppliers, jobs, ratings])

  // Workspace KPIs
  const kpis = useMemo(() => {
    const withJobs = rows.filter((r) => r.total > 0)
    const totalJobs = rows.reduce((s, r) => s + r.total, 0)
    const totalCompleted = rows.reduce((s, r) => s + r.completed, 0)
    const totalInvoiced = rows.reduce((s, r) => s + r.invoiced, 0)
    const avgCompletion =
      withJobs.length > 0
        ? Math.round(withJobs.reduce((s, r) => s + r.completionRate, 0) / withJobs.length)
        : 0
    return [
      { label: "Active Suppliers", value: String(withJobs.length), sub: `${suppliers.length} total`, icon: Briefcase, bg: "bg-[var(--brand-soft)]", color: "text-[var(--brand)]" },
      { label: "Jobs Tracked", value: String(totalJobs), sub: `${totalCompleted} completed`, icon: LayoutGrid, bg: "bg-violet-50", color: "text-violet-600" },
      { label: "Avg Completion", value: `${avgCompletion}%`, sub: "Across active suppliers", icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
      { label: "Total Invoiced", value: `£${totalInvoiced.toLocaleString()}`, sub: "All suppliers", icon: Receipt, bg: "bg-amber-50", color: "text-amber-600" },
    ]
  }, [rows, suppliers.length])

  function exportCsv() {
    const headers = ["Supplier", "Trade", "Total Jobs", "Completed", "Active", "Completion %", "Invoiced", "Avg Value", "Rating"]
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [headers.join(",")]
    for (const r of rows) {
      lines.push(
        [r.supplier.name, r.supplier.trade, r.total, r.completed, r.active, r.completionRate, r.invoiced, r.avgValue, r.rating?.toFixed(1) ?? ""]
          .map(escape)
          .join(",")
      )
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `supplier-performance-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasData = rows.some((r) => r.total > 0)

  return (
    <div className="space-y-5">
      <MobileTopBar
        title="Supplier Performance"
        subtitle="Job-derived metrics"
        primaryAction={hasData ? { label: "Export CSV", icon: Download, onClick: exportCsv } : undefined}
      />
      <div className="hidden md:block">
        <PageHeader
          title="Supplier Performance"
          description="Live performance derived from each supplier's job records"
          actions={
            <button
              onClick={exportCsv}
              disabled={!hasData}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          }
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}>
                <Icon className={cn("w-5 h-5", k.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-900 truncate">{k.value}</p>
                <p className="text-[11px] font-medium text-slate-600">{k.label}</p>
                <p className="text-[10px] text-slate-400">{k.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      <WorkTabNav />
      <SuppliersTabNav />

      {/* Performance table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Supplier Scorecard <span className="text-slate-400 font-normal ml-1">({rows.length})</span>
          </h2>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <TrendingUp className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-900 mb-1">No suppliers yet</p>
            <p className="text-sm text-slate-500 mb-4">Add supplier contacts and assign them to jobs to build performance data.</p>
            <Link href="/property-manager/contacts/new?type=supplier" className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold">Add Supplier</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Completion</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Jobs</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Active</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Invoiced</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Avg Value</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const barColor = r.completionRate >= 80 ? "bg-emerald-500" : r.completionRate >= 50 ? "bg-amber-400" : r.total === 0 ? "bg-slate-200" : "bg-red-400"
                  return (
                    <tr
                      key={r.supplier.id}
                      onClick={() => router.push(`/property-manager/work/suppliers/${r.supplier.id}`)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0", r.supplier.avatarBg)}>
                            {r.supplier.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 truncate">{r.supplier.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{r.supplier.trade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {r.total === 0 ? (
                          <span className="text-[12px] text-slate-400">No jobs yet</span>
                        ) : (
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-200 max-w-[90px]">
                              <div className={cn("h-1.5 rounded-full", barColor)} style={{ width: `${r.completionRate}%` }} />
                            </div>
                            <span className="text-[12px] font-semibold text-slate-700 tabular-nums w-9 text-right">{r.completionRate}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center text-[12.5px] font-semibold text-slate-700 hidden sm:table-cell tabular-nums">{r.total}</td>
                      <td className="px-4 py-3.5 text-center text-[12.5px] text-slate-600 hidden md:table-cell tabular-nums">{r.active}</td>
                      <td className="px-4 py-3.5 text-right text-[12.5px] font-semibold text-slate-800 hidden lg:table-cell tabular-nums">£{r.invoiced.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right text-[12.5px] text-slate-600 hidden lg:table-cell tabular-nums">{r.total > 0 ? `£${r.avgValue.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3.5 text-right">
                        {r.rating != null ? (
                          <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate-700">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {r.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Unrated</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && rows.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Metrics derived from live job records · ratings from internal supplier reviews</p>
          </div>
        )}
      </div>
    </div>
  )
}
