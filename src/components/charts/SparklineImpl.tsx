"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"

export interface SparklineProps {
  data: { v: number }[]
  color: string
  strokeWidth?: number
  /** Disable animation (default true) — sparklines are decorative. */
  animate?: boolean
}

/**
 * Minimal trend sparkline. This module is the ONLY place these tiny line charts
 * import Recharts; it is loaded lazily via `Sparkline` (LazySparkline) so the
 * library is code-split out of the initial bundle of every KPI strip.
 */
export default function SparklineImpl({
  data,
  color,
  strokeWidth = 1.5,
  animate = false,
}: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={strokeWidth}
          dot={false}
          isAnimationActive={animate}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
