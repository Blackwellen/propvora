"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
} from "lucide-react"
import { use } from "react"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"


/* ─── Types ─────────────────────────────────────────────────── */
interface RoomPerformance {
  id: string
  room: string
  tenant: string | null
  tenantInitials: string | null
  avatarBg: string
  monthlyRent: number | null
  monthlyRentLabel: string
  annualRent: number | null
  annualRentLabel: string
  voidDays: number
  voidCost: number
  yieldDiff: string
  yieldDiffColor: "green" | "amber" | "red" | "slate"
  recommendation: string
  status: string
}

interface MonthBar {
  month: string
  received: number
  voidLoss: number
}

/* ─── Sub-tab strip ─────────────────────────────────────────── */
function HmoTabStrip({ propertyId }: { propertyId: string }) {
  const pathname = usePathname()
  const base = `/app/portfolio/properties/${propertyId}/hmo`

  const tabs = [
    { label: "Overview", href: base },
    { label: "Rooms", href: `${base}/rooms` },
    { label: "Utilities", href: `${base}/utilities` },
    { label: "Analytics", href: `${base}/analytics` },
  ]

  return (
    <div className="flex gap-1 px-4 md:px-6 border-b border-slate-200 bg-white overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

/* ─── Mock Data ──────────────────────────────────────────────── */
const ROOM_PERFORMANCE: RoomPerformance[] = [
  {
    id: "r1",
    room: "Room 1",
    tenant: "Sarah Mitchell",
    tenantInitials: "SM",
    avatarBg: "bg-blue-500",
    monthlyRent: 750,
    monthlyRentLabel: "£750",
    annualRent: 9000,
    annualRentLabel: "£9,000",
    voidDays: 0,
    voidCost: 0,
    yieldDiff: "+2.1% above",
    yieldDiffColor: "green",
    recommendation: "Optimised",
    status: "Optimised",
  },
  {
    id: "r2",
    room: "Room 2",
    tenant: "James Chen",
    tenantInitials: "JC",
    avatarBg: "bg-amber-500",
    monthlyRent: 720,
    monthlyRentLabel: "£720",
    annualRent: 8640,
    annualRentLabel: "£8,640",
    voidDays: 14,
    voidCost: 336,
    yieldDiff: "-1.4% below",
    yieldDiffColor: "amber",
    recommendation: "Review pricing",
    status: "Review pricing",
  },
  {
    id: "r3",
    room: "Room 3",
    tenant: "Emma Davies",
    tenantInitials: "ED",
    avatarBg: "bg-emerald-500",
    monthlyRent: 700,
    monthlyRentLabel: "£700",
    annualRent: 8400,
    annualRentLabel: "£8,400",
    voidDays: 0,
    voidCost: 0,
    yieldDiff: "-3.2% below",
    yieldDiffColor: "red",
    recommendation: "Underpriced",
    status: "Underpriced",
  },
  {
    id: "r4",
    room: "Room 4",
    tenant: "Ahmed Hassan",
    tenantInitials: "AH",
    avatarBg: "bg-violet-500",
    monthlyRent: 780,
    monthlyRentLabel: "£780",
    annualRent: 9360,
    annualRentLabel: "£9,360",
    voidDays: 7,
    voidCost: 182,
    yieldDiff: "+1.8% above",
    yieldDiffColor: "green",
    recommendation: "Good",
    status: "Good",
  },
  {
    id: "r5",
    room: "Room 5",
    tenant: "Lisa Park",
    tenantInitials: "LP",
    avatarBg: "bg-pink-500",
    monthlyRent: 900,
    monthlyRentLabel: "£900",
    annualRent: 10800,
    annualRentLabel: "£10,800",
    voidDays: 0,
    voidCost: 0,
    yieldDiff: "+4.1% above",
    yieldDiffColor: "green",
    recommendation: "Premium",
    status: "Premium",
  },
  {
    id: "r6",
    room: "Room 6",
    tenant: null,
    tenantInitials: null,
    avatarBg: "",
    monthlyRent: null,
    monthlyRentLabel: "£750 asking",
    annualRent: null,
    annualRentLabel: "—",
    voidDays: 28,
    voidCost: 700,
    yieldDiff: "At market",
    yieldDiffColor: "slate",
    recommendation: "Re-let ASAP",
    status: "Re-let ASAP",
  },
]

const MONTH_BARS: MonthBar[] = [
  { month: "Jan", received: 3800, voidLoss: 50 },
  { month: "Feb", received: 3850, voidLoss: 0 },
  { month: "Mar", received: 3850, voidLoss: 0 },
  { month: "Apr", received: 3800, voidLoss: 100 },
  { month: "May", received: 3850, voidLoss: 0 },
  { month: "Jun", received: 3200, voidLoss: 650 },
]

const YIELD_BADGE: Record<
  RoomPerformance["yieldDiffColor"],
  string
> = {
  green: "bg-green-50 text-green-700 border border-green-200",
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  red: "bg-red-50 text-red-700 border border-red-200",
  slate: "bg-slate-100 text-slate-600 border border-slate-200",
}

/* ─── SVG Bar Chart ─────────────────────────────────────────── */
function IncomeVoidChart() {
  const chartWidth = 560
  const chartHeight = 180
  const padding = { top: 20, right: 20, bottom: 40, left: 55 }
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  const maxValue = 4500
  const yTicks = [0, 1000, 2000, 3000, 4000]
  const barWidth = plotWidth / MONTH_BARS.length
  const barPad = 12

  function yPos(val: number) {
    return plotHeight - (val / maxValue) * plotHeight
  }

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full h-auto"
      role="img"
      aria-label="Monthly income vs void loss chart"
    >
      {/* Y-axis ticks */}
      {yTicks.map((tick) => {
        const y = padding.top + yPos(tick)
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={padding.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              £{(tick / 1000).toFixed(0)}k
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {MONTH_BARS.map((bar, i) => {
        const x = padding.left + i * barWidth + barPad / 2
        const w = barWidth - barPad
        const totalHeight = ((bar.received + bar.voidLoss) / maxValue) * plotHeight
        const receivedHeight = (bar.received / maxValue) * plotHeight
        const voidHeight = (bar.voidLoss / maxValue) * plotHeight
        const baseY = padding.top + plotHeight

        return (
          <g key={bar.month}>
            {/* Received bar */}
            <rect
              x={x}
              y={baseY - receivedHeight}
              width={w}
              height={receivedHeight}
              fill="#2563eb"
              rx="3"
            />
            {/* Void bar stacked on top */}
            {bar.voidLoss > 0 && (
              <rect
                x={x}
                y={baseY - receivedHeight - voidHeight}
                width={w}
                height={voidHeight}
                fill="#ef4444"
                rx="3"
              />
            )}
            {/* Month label */}
            <text
              x={x + w / 2}
              y={baseY + 14}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {bar.month}
            </text>
          </g>
        )
      })}

      {/* Legend */}
      <rect x={padding.left} y={chartHeight - 12} width={10} height={10} fill="#2563eb" rx="2" />
      <text x={padding.left + 14} y={chartHeight - 4} fontSize="10" fill="#64748b">Received</text>
      <rect x={padding.left + 80} y={chartHeight - 12} width={10} height={10} fill="#ef4444" rx="2" />
      <text x={padding.left + 94} y={chartHeight - 4} fontSize="10" fill="#64748b">Void Loss</text>
    </svg>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function HmoAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [appliedRecs, setAppliedRecs] = useState(false)

  /* Row → card mapping for the mobile room-performance list. */
  const performanceCardMapping: MobileCardMapping<RoomPerformance> = {
    getKey: (r) => r.id,
    title: (r) => r.room,
    subtitle: (r) => r.tenant ?? "Vacant",
    badge: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${YIELD_BADGE[r.yieldDiffColor]}`}>
        {r.yieldDiff}
      </span>
    ),
    fields: [
      { label: "Monthly Rent", render: (r) => r.monthlyRentLabel },
      { label: "Annual Rent", render: (r) => r.annualRentLabel },
      { label: "Void Days YTD", render: (r) => String(r.voidDays) },
      { label: "Void Cost YTD", render: (r) => r.voidCost > 0 ? `£${r.voidCost}` : "—" },
      { label: "Status", render: (r) => r.status },
    ],
  }

  return (
    <>
      {/* Mobile top bar */}
      <MobileTopBar
        title="HMO Analytics"
        subtitle="22 Victoria Road · Year to date"
        showBack
        backHref={`/app/portfolio/properties/${id}/hmo`}
      />

      {/* Page Header — hidden on phones */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            HMO Analytics &amp; Yield Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">22 Victoria Road, Manchester · Year to date</p>
        </div>
      </div>

      {/* Sub-tab strip */}
      <HmoTabStrip propertyId={id} />

      {/* Content */}
      <div className="px-4 md:px-6 pb-6 pt-5 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Annual Rent Roll",
              value: "£46,200",
              sub: "YTD 2026",
              Icon: TrendingUp,
              bg: "bg-green-50",
              color: "text-green-600",
            },
            {
              title: "Gross Yield",
              value: "6.8%",
              sub: "Based on £680k value",
              Icon: BarChart3,
              bg: "bg-blue-50",
              color: "text-blue-600",
            },
            {
              title: "Void-Adjusted Yield",
              value: "6.2%",
              sub: "Accounts for voids",
              Icon: BarChart3,
              bg: "bg-amber-50",
              color: "text-amber-600",
            },
            {
              title: "Avg Tenancy Length",
              value: "14.3 mo",
              sub: "Across all rooms",
              Icon: Calendar,
              bg: "bg-slate-100",
              color: "text-slate-600",
            },
          ].map(({ title, value, sub, Icon, bg, color }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-4 flex items-start gap-3"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                  {title}
                </p>
                <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Room Performance Table */}
          <div className="col-span-12 lg:col-span-8">
            <ResponsiveTable rows={ROOM_PERFORMANCE} mobile={performanceCardMapping}>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Room Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {[
                        "Room",
                        "Tenant",
                        "Monthly Rent",
                        "Annual Rent",
                        "Void Days YTD",
                        "Void Cost YTD",
                        "Yield vs Market",
                        "Status",
                      ].map((col) => (
                        <th
                          key={col}
                          className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ROOM_PERFORMANCE.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {row.room}
                        </td>
                        <td className="px-4 py-3">
                          {row.tenant ? (
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${row.avatarBg}`}
                              >
                                {row.tenantInitials}
                              </div>
                              <span className="text-xs text-slate-700">{row.tenant}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Vacant</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.monthlyRentLabel}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.annualRentLabel}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{row.voidDays}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {row.voidCost > 0 ? `£${row.voidCost}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${YIELD_BADGE[row.yieldDiffColor]}`}
                          >
                            {row.yieldDiff}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </ResponsiveTable>
          </div>

          {/* AI Pricing Recommendations */}
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-xl overflow-hidden shadow-sm border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
              <div className="px-4 py-3 border-b border-violet-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-semibold text-violet-900">AI Pricing Intelligence</h3>
              </div>
              <div className="px-4 py-4 space-y-3">
                {[
                  {
                    room: "Room 3",
                    text: "£700/mo is £95 below local market median of £795. Raising to £780 adds £960/year.",
                    accent: "text-red-600",
                  },
                  {
                    room: "Room 2",
                    text: "£720/mo — slight discount fair given 14-day void last quarter. Hold for now.",
                    accent: "text-amber-600",
                  },
                  {
                    room: "Room 6",
                    text: "Current asking price of £750 is at market. Consider £775 if no interest in 7 days.",
                    accent: "text-blue-600",
                  },
                ].map((rec) => (
                  <div
                    key={rec.room}
                    className="bg-white/70 border border-violet-200 rounded-lg p-3 space-y-1"
                  >
                    <p className={`text-[11px] font-bold ${rec.accent}`}>{rec.room}</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{rec.text}</p>
                  </div>
                ))}

                {appliedRecs ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-xs text-green-700 font-medium text-center">
                    Recommendations noted — apply at next rent review.
                  </div>
                ) : (
                  <button
                    onClick={() => setAppliedRecs(true)}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    Apply All Recommendations
                  </button>
                )}
                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  Changes won&apos;t take effect until next rent review
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Income vs Void Chart */}
          <div className="col-span-12">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Monthly Income vs Void Loss (Jan–Jun 2026)
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
                    Received
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" />
                    Void Loss
                  </span>
                </div>
              </div>
              <div className="px-6 py-5">
                <IncomeVoidChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
