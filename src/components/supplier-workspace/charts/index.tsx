"use client"

import { lazyChart } from "@/components/charts/LazyChart"
import type { SupplierAreaChartProps, SupplierBarChartProps } from "./SupplierChartsImpl"

/* Lazy, code-split supplier charts — recharts is fetched on demand. Re-export the
   shared Donut so supplier pages have one chart import surface. */

export const SupplierAreaChart = lazyChart<SupplierAreaChartProps>(() =>
  import("./SupplierChartsImpl").then((m) => ({ default: m.SupplierAreaChartImpl }))
)

export const SupplierBarChart = lazyChart<SupplierBarChartProps>(() =>
  import("./SupplierChartsImpl").then((m) => ({ default: m.SupplierBarChartImpl }))
)

export { Donut } from "@/components/charts/Donut"
export type { DonutSlice } from "@/components/charts/Donut"
export type { SupplierAreaChartProps, SupplierBarChartProps, AreaPoint, BarPoint } from "./SupplierChartsImpl"
