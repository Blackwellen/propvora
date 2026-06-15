"use client"

import { lazyChart } from "./LazyChart"
import type { DonutProps } from "./DonutImpl"

/**
 * Lazy, code-split donut chart. Drop-in for the inline
 * `<ResponsiveContainer><PieChart>…` donut pattern. Recharts is fetched on
 * demand the first time the donut renders.
 */
export const Donut = lazyChart<DonutProps>(() => import("./DonutImpl"))

export type { DonutProps, DonutSlice } from "./DonutImpl"
export default Donut
