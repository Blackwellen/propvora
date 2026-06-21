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
  { label: "Job Completion",    value: 95, color: "bg-blue-500"    },
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

  const topPerformers = useMemo(() => {
    return suppliers
      .map((s) => ({
        ...s,
        rating:         4.3 + ((s.id.charCodeAt(0) % 7) / 10),
        responseTime:   (1 + (s.id.charCodeAt(Math.min(1, s.id.length - 1)) % 30) / 10).toFixed(1) + " hrs",
        completionRate: 90 + (s.id.charCodeAt(0) % 10),
        jobs:           10 + (s.id.charCodeAt(0) % 40),
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
  }, [suppliers])

  function exportCsv() {
    const rows = topPerformers.map((s) => [s.id, s.name, s.trade, String(s.rating), s.responseTime].map((v) => `"${v}"`).join(","))
    const csv = ["ID,Name,Trade,Rating,ResponseTime", ...rows].join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "suppliers-performance.csv"
    a.click()
  }

  const KPIS = [
    { label: "Avg Rating",     value: "4.7",    sub: "Across all suppliers", icon: Star,         bg: "bg-amber-50",   color: "text-amber-600"   },
    { label: "Avg Response",   value: "2.4 hrs", sub: "vs 2.8 hr industry",  icon: Clock,        bg: "bg-blue-50",    color: "text-blue-600"    },
    { label: "Completion Rate",value: "95%",     sub: "+2% vs last month",   icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Top Performers", value: String(Math.min(5, suppliers.length)), sub: "Above 4.5 rating", icon: Award, bg: "bg-violet-50",  color: "text-violet-600"  },
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
          {/* Monthly jobs chart */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h3 className="text-[13px] font-semibold text-slate-800 mb-4">Jobs Completed Monthly</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_JOBS} barSize={28}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`${v} jobs`]}
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="jobs" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top performers table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-slate-800">Top Performers</h3>
              <Link href="/property-manager/suppliers/directory" className="text-[11px] text-[#2563EB] hover:underline font-medium">
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
                          className="text-[13px] font-semibold text-slate-900 hover:text-[#2563EB] transition-colors truncate"
                        >
                          {s.name}
                        </Link>
                        {s.preferred && <BadgeCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={s.rating} />
                        <span className="text-[11px] text-slate-400">· {s.trade}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-semibold text-slate-800">{s.completionRate}%</p>
                      <p className="text-[10.5px] text-slate-500">completion</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11.5px] text-slate-500 shrink-0 w-20 text-right">
                      <Zap className="w-3 h-3 text-blue-400 shrink-0" />
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
          {/* Radar chart */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Network Overview</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metric bars */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h3 className="text-[13px] font-semibold text-slate-800 mb-4">Key Metrics</h3>
            <div className="space-y-4">
              {PERF_METRICS.map((m) => (
                <PerformanceBar key={m.label} label={m.label} value={m.value} color={m.color} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
