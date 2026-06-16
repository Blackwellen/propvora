"use client"

import React from "react"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import type { DashboardTrends } from "@/lib/admin/data"

const PLAN_COLOURS: Record<string, string> = {
  starter: "#94A3B8", operator: "#2563EB", scale: "#7C3AED", pro_agency: "#0EA5E9", enterprise: "#F59E0B",
}
const STATUS_COLOURS: Record<string, string> = {
  active: "#10B981", trialing: "#F59E0B", suspended: "#EF4444", past_due: "#DC2626", canceled: "#94A3B8",
}
const FALLBACK = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#0EA5E9"]

export default function DashboardChartsImpl({ trends }: { trends: DashboardTrends }) {
  const growth = trends.workspacesByMonth.map((w, i) => ({
    label: w.label,
    workspaces: w.value,
    users: trends.usersByMonth[i]?.value ?? 0,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Growth area chart */}
      <div className="lg:col-span-2 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={growth} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gWs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E2E8F0" }} />
            <Area type="monotone" dataKey="workspaces" name="New workspaces" stroke="#2563EB" strokeWidth={2} fill="url(#gWs)" />
            <Area type="monotone" dataKey="users" name="New users" stroke="#7C3AED" strokeWidth={2} fill="url(#gUsers)" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Plan mix donut */}
      <div className="h-[260px]">
        {trends.planMix.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">No plan data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={trends.planMix} dataKey="value" nameKey="label" cx="50%" cy="46%" innerRadius={44} outerRadius={70} paddingAngle={2}>
                {trends.planMix.map((p, i) => <Cell key={p.label} fill={PLAN_COLOURS[p.label] ?? FALLBACK[i % FALLBACK.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E2E8F0" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export { STATUS_COLOURS }
