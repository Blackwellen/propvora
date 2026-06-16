import React from "react"
import { Card } from "@/components/ui/Card"
import { lazyChart } from "@/components/charts/LazyChart"
import type { DashboardTrends } from "@/lib/admin/data"

const ChartsImpl = lazyChart<{ trends: DashboardTrends }>(
  () => import("./DashboardChartsImpl"),
  { skeletonClassName: "h-[260px]" },
)

export default function DashboardCharts({ trends }: { trends: DashboardTrends }) {
  return (
    <Card noPadding>
      <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Growth & Plan Mix</h3>
        <span className="text-[11px] text-slate-400">Last 6 months · live</span>
      </div>
      <div className="p-4">
        <ChartsImpl trends={trends} />
      </div>
    </Card>
  )
}
