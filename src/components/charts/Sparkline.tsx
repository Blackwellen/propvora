"use client"

import { lazyChart } from "./LazyChart"
import type { SparklineProps } from "./SparklineImpl"

/**
 * Lazy, code-split sparkline. Drop-in for the inline
 * `<ResponsiveContainer><LineChart>…` pattern that was duplicated across KPI
 * strips. Recharts is fetched on demand the first time a sparkline renders.
 */
export const Sparkline = lazyChart<SparklineProps>(() => import("./SparklineImpl"))

export type { SparklineProps }
export default Sparkline
