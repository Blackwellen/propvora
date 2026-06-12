"use client"

import {
  Building2,
  LayoutGrid,
  Users,
  TrendingUp,
  PoundSterling,
  Wrench,
  ShieldAlert,
} from "lucide-react"
import { HomeKpiCard } from "./HomeKpiCard"
import type { HomeKpi } from "../types"

interface HomeKpiRowProps {
  data: HomeKpi
  loading?: boolean
}

export function HomeKpiRow({ data, loading = false }: HomeKpiRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      <HomeKpiCard
        label="Properties"
        value={data.properties === 0 ? "—" : String(data.properties)}
        trend={data.propertiesTrend !== 0 ? `${data.propertiesTrend > 0 ? "+" : ""}${data.propertiesTrend} vs last month` : undefined}
        trendUp={data.propertiesTrend >= 0}
        icon={Building2}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        href="/app/portfolio/properties"
        loading={loading}
      />
      <HomeKpiCard
        label="Units"
        value={data.units === 0 ? "—" : String(data.units)}
        trend={data.unitsTrend !== 0 ? `${data.unitsTrend > 0 ? "+" : ""}${data.unitsTrend} vs last month` : undefined}
        trendUp={data.unitsTrend >= 0}
        icon={LayoutGrid}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
        href="/app/portfolio/units"
        loading={loading}
      />
      <HomeKpiCard
        label="Active Tenancies"
        value={data.activeTenancies === 0 ? "—" : String(data.activeTenancies)}
        trend={data.tenanciesTrend !== 0 ? `${data.tenanciesTrend > 0 ? "+" : ""}${data.tenanciesTrend} vs last month` : undefined}
        trendUp={data.tenanciesTrend >= 0}
        icon={Users}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        href="/app/portfolio/tenancies"
        loading={loading}
      />
      <HomeKpiCard
        label="Occupancy"
        value={data.occupancyPct === 0 ? "—" : `${data.occupancyPct}%`}
        trend={data.occupancyTrend !== 0 ? `${data.occupancyTrend > 0 ? "+" : ""}${data.occupancyTrend}pp vs last month` : undefined}
        trendUp={data.occupancyTrend >= 0}
        trendNeutral={data.occupancyTrend === 0}
        icon={TrendingUp}
        iconBg="bg-teal-50"
        iconColor="text-teal-600"
        loading={loading}
      />
      <HomeKpiCard
        label="Rent Roll"
        value={data.rentCollected === 0 ? "—" : `£${data.rentCollected.toLocaleString("en-GB")}`}
        trend={data.rentTrend !== 0 ? `${data.rentTrend > 0 ? "+" : ""}${data.rentTrend}% vs last month` : undefined}
        trendUp={data.rentTrend >= 0}
        icon={PoundSterling}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        href="/app/money/income"
        loading={loading}
      />
      <HomeKpiCard
        label="Open Work"
        value={data.openWork === 0 ? "—" : String(data.openWork)}
        trend={data.workTrend !== 0 ? `${data.workTrend > 0 ? "+" : ""}${data.workTrend} vs last month` : undefined}
        trendUp={false}
        icon={Wrench}
        iconBg="bg-orange-50"
        iconColor="text-orange-600"
        href="/app/work"
        loading={loading}
      />
      <HomeKpiCard
        label="Compliance Due"
        value={data.complianceDue === 0 ? "—" : String(data.complianceDue)}
        trendNeutral
        icon={ShieldAlert}
        iconBg="bg-red-50"
        iconColor="text-red-500"
        href="/app/compliance"
        loading={loading}
      />
    </div>
  )
}
