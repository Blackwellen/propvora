"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts"

/* Mini sparkline area (KPI cards) */
export function Sparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  const rows = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function MiniLine({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  const rows = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function MiniArea({ data, color = "#ef4444" }: { data: number[]; color?: string }) {
  const rows = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`area-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#area-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function MiniBars({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  const rows = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export interface DonutSlice {
  label: string
  value: number
  color: string
}

export function Donut({
  slices,
  centerLabel,
  centerSub,
  size = 160,
}: {
  slices: DonutSlice[]
  centerLabel?: string
  centerSub?: string
  size?: number
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius="64%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
          >
            {slices.map((s) => (
              <Cell key={s.label} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerSub) && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            {centerLabel && <div className="text-xl font-semibold text-slate-900">{centerLabel}</div>}
            {centerSub && <div className="text-[11px] text-slate-400">{centerSub}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

/* Horizontal labelled bar list */
export function BarList({
  items,
  color = "bg-blue-500",
}: {
  items: { label: string; value: number; sub?: string }[]
  color?: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">{it.label}</span>
            <span className="font-medium text-slate-800">{it.sub ?? it.value.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
