"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

export interface DonutSlice {
  name: string
  value: number
  color: string
}

export interface DonutProps {
  data: DonutSlice[]
  innerRadius?: number
  outerRadius?: number
}

/**
 * Compact donut/ring chart. Recharts is imported only here and reached lazily
 * through `Donut` (LazyDonut) so it stays out of the initial bundle.
 */
export default function DonutImpl({
  data,
  innerRadius = 36,
  outerRadius = 54,
}: DonutProps) {
  const slices = data.length > 0 ? data : [{ name: "No data", value: 1, color: "#E2E8F0" }]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={slices}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          strokeWidth={2}
        >
          {slices.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="white" />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
