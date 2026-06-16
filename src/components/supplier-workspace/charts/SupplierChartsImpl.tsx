"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier-workspace chart implementations. Recharts lives ONLY here and is
   reached lazily via `./index` (one boundary per chart, per the LazyChart
   convention). Light tokens only. Every series is real data passed by the page.
─────────────────────────────────────────────────────────────────────────── */

export interface AreaPoint {
  label: string
  value: number
}

export interface SupplierAreaChartProps {
  data: AreaPoint[]
  color?: string
  /** Format the Y/tooltip value (e.g. pence → "£12.00"). */
  format?: (v: number) => string
  height?: number
}

export function SupplierAreaChartImpl({
  data,
  color = "#2563EB",
  format,
  height = 200,
}: SupplierAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="supplierArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => (format ? format(Number(v)) : String(v))}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, boxShadow: "0 4px 16px rgba(15,23,42,0.08)" }}
          formatter={((v: unknown) => [format ? format(Number(v)) : String(v), ""]) as never}
          labelStyle={{ color: "#475569", fontWeight: 600 }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#supplierArea)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export interface BarPoint {
  label: string
  value: number
  color?: string
}

export interface SupplierBarChartProps {
  data: BarPoint[]
  color?: string
  format?: (v: number) => string
  height?: number
}

export function SupplierBarChartImpl({
  data,
  color = "#2563EB",
  format,
  height = 200,
}: SupplierBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          width={36}
          allowDecimals={false}
          tickFormatter={(v) => (format ? format(Number(v)) : String(v))}
        />
        <Tooltip
          cursor={{ fill: "#F8FAFC" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, boxShadow: "0 4px 16px rgba(15,23,42,0.08)" }}
          formatter={((v: unknown) => [format ? format(Number(v)) : String(v), ""]) as never}
          labelStyle={{ color: "#475569", fontWeight: 600 }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const SupplierChartsImpl = { SupplierAreaChartImpl, SupplierBarChartImpl }
export default SupplierChartsImpl
