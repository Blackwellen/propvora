"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { PpmTabNav } from "@/components/work/PpmTabNav"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { usePpmPlans } from "@/hooks/usePpm"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

// ─── KPIs ─────────────────────────────────────────────────────────────────────

const KPIS = [
  { label: "Scheduled This Month", value: "18", sub: "Across 7 properties", trend: "+12% vs May", trendColor: "text-blue-600", trendBg: "bg-blue-50", iconBg: "bg-blue-50", icon: "📅" },
  { label: "At Risk", value: "6", sub: "Require attention", trend: "⚠", trendColor: "text-amber-600", trendBg: "bg-amber-50", iconBg: "bg-amber-50", icon: "⚠" },
  { label: "Overdue", value: "3", sub: "Past due dates", trend: "⊘", trendColor: "text-red-600", trendBg: "bg-red-50", iconBg: "bg-red-50", icon: "⊘" },
  { label: "Capacity Utilisation", value: "72%", sub: "Avg across all trades", trend: "+8% vs May", trendColor: "text-emerald-600", trendBg: "bg-emerald-50", iconBg: "bg-emerald-50", icon: "📊" },
]

// ─── Timeline data ────────────────────────────────────────────────────────────

const MONTHS = ["Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026"]

const STATUS_COLOURS: Record<string, string> = {
  "due-soon":  "bg-amber-400",
  "scheduled": "bg-blue-500",
  "completed": "bg-emerald-500",
  "overdue":   "bg-red-500",
  "at-risk":   "bg-orange-500",
}

const STATUS_TEXT: Record<string, string> = {
  "due-soon":  "text-amber-700",
  "scheduled": "text-blue-700",
  "completed": "text-emerald-700",
  "overdue":   "text-red-700",
  "at-risk":   "text-orange-700",
}

interface TimelineTask {
  name: string
  dot: string
  spans: Array<{ col: number; label: string; status: string }>
}

interface Property {
  name: string
  badge: number
  tasks: TimelineTask[]
}

const PROPERTIES: Property[] = [
  {
    name: "14 Park Rd",
    badge: 7,
    tasks: [
      {
        name: "Gas Safety Certificate",
        dot: "bg-orange-400",
        spans: [
          { col: 0, label: "8–10 Jun ⚠", status: "at-risk" },
          { col: 4, label: "9–11 Oct ✓", status: "completed" },
        ],
      },
      {
        name: "Boiler Annual Service",
        dot: "bg-orange-400",
        spans: [
          { col: 0, label: "12 Jun", status: "scheduled" },
          { col: 3, label: "14 Sep", status: "scheduled" },
        ],
      },
      {
        name: "EICR Electrical Inspection",
        dot: "bg-yellow-400",
        spans: [{ col: 2, label: "14–15 Aug", status: "scheduled" }],
      },
      {
        name: "Fire Alarm Test",
        dot: "bg-red-400",
        spans: [{ col: 0, label: "19 Jun", status: "scheduled" }],
      },
      {
        name: "Legionella Risk Assessment",
        dot: "bg-teal-400",
        spans: [
          { col: 0, label: "24 Jun", status: "scheduled" },
          { col: 4, label: "20 Oct", status: "scheduled" },
        ],
      },
      {
        name: "PAT Testing",
        dot: "bg-yellow-400",
        spans: [
          { col: 0, label: "28 Jun", status: "scheduled" },
          { col: 5, label: "2 Nov", status: "scheduled" },
        ],
      },
    ],
  },
  {
    name: "7 Oak Ave",
    badge: 6,
    tasks: [
      {
        name: "Gas Safety Certificate",
        dot: "bg-orange-400",
        spans: [{ col: 0, label: "11–12 Jun", status: "scheduled" }],
      },
      {
        name: "Boiler Annual Service",
        dot: "bg-orange-400",
        spans: [{ col: 0, label: "16 Jun", status: "scheduled" }],
      },
      {
        name: "EICR Electrical Inspection",
        dot: "bg-yellow-400",
        spans: [{ col: 3, label: "8–9 Sep", status: "scheduled" }],
      },
      {
        name: "Fire Alarm Test",
        dot: "bg-red-400",
        spans: [{ col: 4, label: "21 Oct", status: "scheduled" }],
      },
      {
        name: "Legionella Risk Assessment",
        dot: "bg-teal-400",
        spans: [{ col: 1, label: "15 Jul", status: "scheduled" }],
      },
      {
        name: "PAT Testing",
        dot: "bg-yellow-400",
        spans: [{ col: 2, label: "27 Aug", status: "scheduled" }],
      },
    ],
  },
  {
    name: "22 Mill Lane",
    badge: 5,
    tasks: [
      {
        name: "Gas Safety Certificate",
        dot: "bg-orange-400",
        spans: [{ col: 2, label: "6–7 Aug", status: "scheduled" }],
      },
      {
        name: "Boiler Annual Service",
        dot: "bg-orange-400",
        spans: [{ col: 3, label: "10 Sep", status: "scheduled" }],
      },
    ],
  },
]

// ─── Load donut data ──────────────────────────────────────────────────────────

const LOAD_DATA = [
  { name: "Gas",          value: 18, fill: "#F97316" },
  { name: "Electrical",   value: 16, fill: "#EAB308" },
  { name: "Plumbing",     value: 14, fill: "#3B82F6" },
  { name: "Fire Safety",  value: 10, fill: "#EF4444" },
  { name: "Water",        value: 6,  fill: "#14B8A6" },
]

// ─── Resource pressure ────────────────────────────────────────────────────────

const RESOURCE_PRESSURE = [
  { trade: "Gas Engineering", util: 84, pressure: "High",   pressureColor: "text-red-600",   utilColor: "bg-red-500" },
  { trade: "Electrical",      util: 76, pressure: "High",   pressureColor: "text-red-600",   utilColor: "bg-red-500" },
  { trade: "Plumbing",        util: 63, pressure: "Medium", pressureColor: "text-amber-600", utilColor: "bg-amber-400" },
  { trade: "Fire Safety",     util: 58, pressure: "Medium", pressureColor: "text-amber-600", utilColor: "bg-amber-400" },
  { trade: "Water Hygiene",   util: 41, pressure: "Low",    pressureColor: "text-emerald-600", utilColor: "bg-emerald-500" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PpmTimelinePage() {
  const workspaceId = useWorkspaceId()
  const { data: livePlans } = usePpmPlans(workspaceId)
  const hasLive = !!livePlans && livePlans.length > 0

  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(PROPERTIES.map((p) => [p.name, true]))
  )

  function toggleProperty(name: string) {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  // Live KPI values override the seeded template when live data exists
  const kpiValues = hasLive
    ? [
        String(livePlans!.length),
        String(livePlans!.filter((p) => p.status === "due_soon").length),
        String(livePlans!.filter((p) => p.status === "overdue").length),
        KPIS[3].value,
      ]
    : KPIS.map((k) => k.value)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">PPM Timeline</h1>
        <p className="text-sm text-slate-500">Visualise recurring maintenance across upcoming months</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k, idx) => (
          <div key={k.label} className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{k.label}</span>
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", k.trendBg, k.trendColor)}>
                {k.trend}
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{kpiValues[idx]}</p>
            <p className="text-[11px] text-slate-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab navs */}
      <WorkTabNav />
      <PpmTabNav />

      {/* Timeline controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          Jun 2026 – Nov 2026 <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>
        <button className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" />
        </button>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search properties..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/50 bg-white"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-600 hover:bg-slate-50 transition-colors">
          Group by: Property <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-600 hover:bg-slate-50 transition-colors">
          Months <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Today
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Timeline grid */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          {/* Grid header */}
          <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "240px repeat(6, 1fr)" }}>
            <div className="px-4 py-3 border-r border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Property / Task</span>
            </div>
            {MONTHS.map((m) => (
              <div key={m} className="px-2 py-3 border-r border-slate-100 last:border-r-0 text-center">
                <span className={cn("text-[11px] font-semibold", m === "Jun 2026" ? "text-[#2563EB]" : "text-slate-500")}>
                  {m}
                </span>
                {m === "Jun 2026" && (
                  <div className="w-1 h-1 rounded-full bg-[#2563EB] mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>

          {/* Property rows */}
          {PROPERTIES.map((prop) => (
            <React.Fragment key={prop.name}>
              {/* Property header row */}
              <div
                className="grid border-b border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                style={{ gridTemplateColumns: "240px repeat(6, 1fr)" }}
                onClick={() => toggleProperty(prop.name)}
              >
                <div className="px-4 py-2.5 flex items-center gap-2 border-r border-slate-100">
                  <span className="text-[12px]">{expanded[prop.name] ? "▾" : "▸"}</span>
                  <span className="text-sm">🏢</span>
                  <span className="text-[12.5px] font-semibold text-slate-800">{prop.name}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    {prop.badge}
                  </span>
                </div>
                {MONTHS.map((m) => (
                  <div key={m} className="border-r border-slate-100 last:border-r-0" />
                ))}
              </div>

              {/* Task rows */}
              {expanded[prop.name] &&
                prop.tasks.map((task) => (
                  <div
                    key={task.name}
                    className="grid border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    style={{ gridTemplateColumns: "240px repeat(6, 1fr)" }}
                  >
                    {/* Task name */}
                    <div className="px-4 py-2 flex items-center gap-2 border-r border-slate-100 pl-8">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", task.dot)} />
                      <span className="text-[11.5px] text-slate-700 truncate">{task.name}</span>
                    </div>
                    {/* Month cells */}
                    {MONTHS.map((m, colIdx) => {
                      const spansHere = task.spans.filter((s) => s.col === colIdx)
                      return (
                        <div
                          key={m}
                          className="relative border-r border-slate-50 last:border-r-0 px-1 py-1.5 flex items-center"
                        >
                          {spansHere.map((span, si) => (
                            <div
                              key={si}
                              className={cn(
                                "flex items-center px-2 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                                STATUS_COLOURS[span.status] ?? "bg-blue-500"
                              )}
                              title={`${task.name}: ${span.label}`}
                            >
                              {span.label}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
            </React.Fragment>
          ))}

          {/* Legend + footer */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <div className="flex flex-wrap items-center gap-4 mb-2">
              {[
                { label: "Due Soon",  color: "bg-amber-400" },
                { label: "Scheduled", color: "bg-blue-500" },
                { label: "Completed", color: "bg-emerald-500" },
                { label: "Overdue",   color: "bg-red-500" },
                { label: "At Risk",   color: "bg-orange-500" },
                { label: "Cancelled", color: "bg-slate-400" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={cn("w-2.5 h-2.5 rounded-sm shrink-0", l.color)} />
                  <span className="text-[11px] text-slate-600">{l.label}</span>
                </div>
              ))}
              <label className="flex items-center gap-1.5 ml-auto text-[11px] text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Show weekends
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Timeline shows scheduled and actual dates. Drag to reschedule or click a task for details.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              Last updated: 2 mins ago
              <button className="hover:text-slate-600 transition-colors">↺</button>
            </p>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Upcoming Load */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Upcoming Load</h3>
              <select className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white">
                <option>Next 90 Days</option>
                <option>Next 60 Days</option>
                <option>Next 30 Days</option>
              </select>
            </div>
            <div className="relative h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={LOAD_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={64}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {LOAD_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} jobs`]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-bold text-slate-900">64</p>
                <p className="text-[10px] text-slate-500">Total Jobs</p>
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              {LOAD_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{d.value}</span>
                    <span className="text-slate-400">({Math.round((d.value / 64) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Peak week */}
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
              <span className="text-sm">📅</span>
              <div>
                <p className="text-[12px] font-semibold text-amber-800">Peak Week</p>
                <p className="text-[11px] text-amber-700">8–14 Sep 2026 · 22 jobs</p>
              </div>
            </div>
          </div>

          {/* Resource Pressure */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Resource Pressure</h3>
              <select className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white">
                <option>All Trades</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Trade", "Utilisation", "Pressure"].map((h) => (
                      <th key={h} className="pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESOURCE_PRESSURE.map((r) => (
                    <tr key={r.trade} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 text-[12px] text-slate-700 whitespace-nowrap">{r.trade}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100">
                            <div
                              className={cn("h-1.5 rounded-full", r.utilColor)}
                              style={{ width: `${r.util}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-semibold text-slate-700">{r.util}%</span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className={cn("text-[11px] font-semibold", r.pressureColor)}>
                          {r.pressure}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link
              href="/app/work/suppliers/preferred"
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> View Workload →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
