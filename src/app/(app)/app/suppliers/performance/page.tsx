"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import {
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Download,
  Award,
  Zap,
  BadgeCheck,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { SuppliersHubTabNav } from "@/components/suppliers/SuppliersHubTabNav"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useSuppliers } from "@/features/suppliers/useSuppliers"

// ─── Seed data ────────────────────────────────────────────────────────────────

const RADAR_DATA = [
  { subject: "Response",   A: 98 },
  { subject: "Quality",    A: 94 },
  { subject: "Completion", A: 95 },
  { subject: "Value",      A: 88 },
  { subject: "Safety",     A: 97 },
  { subject: "Comms",      A: 91 },
]

const MONTHLY_JOBS = [
  { month: "Jan", jobs: 18 },
  { month: "Feb", jobs: 22 },
  { month: "Mar", jobs: 27 },
  { month: "Apr", jobs: 24 },
  { month: "May", jobs: 31 },
  { month: "Jun", jobs: 29 },
]

const PERF_METRICS = [
  { label: "On-Time Response",  value: 98, color: "bg-emerald-500" },
  { label: "Job Completion",    value: 95, color: "bg-[var(--brand)]"    },
  { label: "SLA Compliance",    value: 96, color: "bg-violet-500"  },
  { label: "Quality Score",     value: 94, color: "bg-amber-500"   },
  { label: "Cost Efficiency",   value: 88, color: "bg-slate-500"   },
  { label: "Safety Record",     value: 97, color: "bg-emerald-600" },
]

function PerformanceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12.5px] text-slate-600">{label}</span>
        <span className="text-[12px] font-bold text-slate-800">{value}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100">
        <div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("w-3 h-3", s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")}
        />
      ))}
      <span className="text-[11px] font-semibold text-slate-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SuppliersPerformancePage() {
  const workspaceId = useWorkspaceId()
  const { suppliers } = useSuppliers(workspaceId)

  // No live performance telemetry yet — list real suppliers without fabricating
  // ratings/response/completion figures.
  const topPerformers = useMemo(() => {
    return suppliers
      .slice(0, 5)
      .map((s) => ({ ...s, rating: null as number | null, responseTime: "—", completionRate: null as number | null }))
  }, [suppliers])

  function exportCsv() {
    const rows = topPerformers.map((s) => [s.id, s.name, s.trade].map((v) => `"${v}"`).join(","))
    const csv = ["ID,Name,Trade", ...rows].join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "suppliers-performance.csv"
    a.click()
  }

  // No live performance telemetry source yet — headline metrics show an honest
  // "—" rather than fabricated figures. Supplier count is live.
  const KPIS = [
    { label: "Avg Rating",     value: "—",      sub: "Awaiting reviews",     icon: Star,         bg: "bg-amber-50",   color: "text-amber-600"   },
    { label: "Avg Response",   value: "—",      sub: "Awaiting data",        icon: Clock,        bg: "bg-[var(--brand-soft)]",    color: "text-[var(--brand)]"    },
    { label: "Completion Rate",value: "—",      sub: "Awaiting data",        icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Suppliers",      value: String(suppliers.length), sub: "In your network", icon: Award, bg: "bg-violet-50",  color: "text-violet-600"  },
  ]

  return (
    <div className="space-y-5">
      <MobileTopBar
        title="Performance"
        subtitle="Supplier metrics"
        overflowActions={[
          { label: "Export", icon: Download, onClick: exportCsv },
        ]}
      />

      <div className="hidden md:block">
        <PageHeader
          title="Supplier Performance"
          description="Track response times, completion rates and quality scores across your supplier network"
          actions={
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          }
        />
      </div>

      <SuppliersHubTabNav />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", kpi.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", kpi.color)} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 leading-none mb-1">{kpi.value}</p>
              <p className="text-[11px] text-slate-500">{kpi.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: top performers + bar chart */}
        <div className="lg:col-span-2 space-y-5">
          {/* Monthly jobs chart — no live job-history source yet */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h3 className="text-[13px] font-semibold text-slate-800 mb-4">Jobs Completed Monthly</h3>
            <div className="h-44 flex flex-col items-center justify-center text-center">
              <TrendingUp className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-[12.5px] font-semibold text-slate-600">No job history yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">This chart fills in as supplier jobs complete.</p>
            </div>
          </div>

          {/* Top performers table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-slate-800">Top Performers</h3>
              <Link href="/property-manager/suppliers/directory" className="text-[11px] text-[var(--brand)] hover:underline font-medium">
                View all
              </Link>
            </div>

            {topPerformers.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[13px] text-slate-500">No supplier data yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0", s.avatarBg)}>
                      {s.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link
                          href={`/property-manager/work/suppliers/${s.id}`}
                          className="text-[13px] font-semibold text-slate-900 hover:text-[var(--brand)] transition-colors truncate"
                        >
                          {s.name}
                        </Link>
                        {s.preferred && <BadgeCheck className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{s.trade}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-semibold text-slate-400">—</p>
                      <p className="text-[10.5px] text-slate-500">completion</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11.5px] text-slate-400 shrink-0 w-20 text-right">
                      <Zap className="w-3 h-3 text-slate-300 shrink-0" />
                      {s.responseTime}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Network overview + key metrics — no live telemetry source yet */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Network Overview</h3>
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <Award className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-[12.5px] font-semibold text-slate-600">No metrics yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Performance metrics appear as suppliers complete jobs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
