"use client"

import React from "react"
import {
  BarChart3, Target, Timer, TrendingUp, MapPin, Users, Download,
  CheckCircle2, Trophy, Clock, Wallet, Gauge,
} from "lucide-react"
import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import {
  SupplierCard,
  SupplierKpiStrip,
  SupplierLoadingState,
  SupplierErrorState,
  SupplierButton,
  type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { SupplierBarChart, Donut, type DonutSlice } from "@/components/supplier-workspace/charts"
import { formatPence } from "@/lib/marketplace/money"
import { TeamProductivity } from "@/features/supplier/team/insights/TeamProductivity"

interface TimePoint { label: string; value: number }
interface Slice { name: string; value: number; color: string }

interface InsightsEnvelope {
  jobsOverTime?: TimePoint[]
  earningsOverTime?: TimePoint[]
  quotesOverTime?: TimePoint[]
  statusMix?: Slice[]
  quoteMix?: Slice[]
  completionRatePct?: number
  totalJobs?: number
  totalQuotes?: number
  winRatePct?: number
  avgResponseHours?: number
  slaHitPct?: number
  totalRevenuePence?: number
  avgJobValuePence?: number
}

type ApiState = ReturnType<typeof useSupplierApi<InsightsEnvelope>>

/* ── Building blocks ──────────────────────────────────────────────────────── */

function Panel({
  title, desc, state, children, right,
}: {
  title: string
  desc?: string
  state: ApiState
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {desc && <p className="text-[11px] text-slate-400">{desc}</p>}
        </div>
        {right}
      </div>
      {state.loading ? (
        <SupplierLoadingState rows={3} />
      ) : state.error ? (
        <SupplierErrorState onRetry={state.refresh} />
      ) : (
        children
      )}
    </SupplierCard>
  )
}

/** Legend-flanked donut for a status/quote mix. */
function MixDonut({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  return (
    <div className="flex items-center gap-5">
      <div className="h-[150px] w-[150px] shrink-0">
        <Donut data={slices} />
      </div>
      <ul className="flex-1 space-y-1.5 min-w-0">
        {slices.length === 0 && <li className="text-sm text-slate-400">No data yet.</li>}
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="flex-1 text-slate-600 truncate">{s.name}</span>
            <span className="font-semibold text-slate-800 tabular-nums">{s.value}</span>
            <span className="text-xs text-slate-400 tabular-nums w-10 text-right">
              {total > 0 ? `${Math.round((s.value / total) * 100)}%` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Big single-metric gauge with a progress ring substitute (horizontal bar). */
function MetricGauge({
  value, label, tone = "blue", sub,
}: {
  value: string
  label: string
  tone?: "blue" | "emerald" | "amber"
  sub?: string
}) {
  const bar =
    tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-[#2563EB]"
  const pct = Number(String(value).replace(/[^\d.]/g, ""))
  const width = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5">
      <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      <div className="mt-3 h-2 rounded-full bg-slate-200/70 overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function SupplierInsightsHub() {
  const { isTeam } = useSupplierPlan()
  const a = useSupplierApi<InsightsEnvelope>(useSupplierApiUrl("/api/supplier/analytics"), {
    select: (j) => j as InsightsEnvelope,
  })
  const d = a.data ?? {}

  const pct = (v?: number) => (v != null ? `${v}%` : "—")

  // ── Performance ───────────────────────────────────────────────────────────
  const performance = (
    <div className="space-y-5">
      <SupplierKpiStrip
        kpis={[
          { label: "Total jobs", value: String(d.totalJobs ?? 0), icon: BarChart3 },
          { label: "Win rate", value: pct(d.winRatePct), icon: Target },
          { label: "SLA hit rate", value: pct(d.slaHitPct), icon: Timer },
          { label: "Completion", value: pct(d.completionRatePct), icon: CheckCircle2 },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Jobs over time" desc="New job assignments per week" state={a}>
          <SupplierBarChart data={d.jobsOverTime ?? []} height={220} />
        </Panel>
        <Panel title="Job status mix" desc="Where active work currently sits" state={a}>
          <MixDonut slices={(d.statusMix ?? []) as DonutSlice[]} />
        </Panel>
      </div>
    </div>
  )

  // ── Win rate ──────────────────────────────────────────────────────────────
  const won = (d.quoteMix ?? []).find((s) => s.name.toLowerCase() === "accepted")?.value ?? 0
  const winRate = (
    <div className="space-y-5">
      <SupplierKpiStrip
        kpis={[
          { label: "Win rate", value: pct(d.winRatePct), icon: Trophy },
          { label: "Quotes sent", value: String(d.totalQuotes ?? 0), icon: Target },
          { label: "Won", value: String(won), icon: CheckCircle2 },
          { label: "Avg job value", value: formatPence(d.avgJobValuePence ?? 0), icon: Wallet },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Quote outcomes" desc="Conversion across your pipeline" state={a}>
          <MixDonut slices={(d.quoteMix ?? []) as DonutSlice[]} />
        </Panel>
        <Panel title="Quotes over time" desc="Quote volume per week" state={a}>
          <SupplierBarChart data={d.quotesOverTime ?? []} height={220} />
        </Panel>
      </div>
    </div>
  )

  // ── SLA / responsiveness ──────────────────────────────────────────────────
  const slaSlices: DonutSlice[] =
    d.slaHitPct != null
      ? [
          { name: "Within target", value: d.slaHitPct, color: "#10B981" },
          { name: "Breached", value: Math.max(0, 100 - d.slaHitPct), color: "#EF4444" },
        ]
      : []
  const sla = (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MetricGauge value={pct(d.slaHitPct)} label="Responses within 24h SLA" tone="emerald" sub="First quote response time" />
        <MetricGauge
          value={d.avgResponseHours != null ? `${d.avgResponseHours}h` : "—"}
          label="Average response time"
          tone={d.avgResponseHours != null && d.avgResponseHours <= 24 ? "emerald" : "amber"}
          sub="From request to first quote"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="SLA adherence" desc="Within target vs breached" state={a}>
          <MixDonut slices={slaSlices} />
        </Panel>
        <Panel title="Why responsiveness matters" desc="Operator-facing signal" state={a}>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li className="flex gap-2"><Clock className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />Faster first responses lift your win rate and marketplace ranking.</li>
            <li className="flex gap-2"><Gauge className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Suppliers responding under 24h are surfaced higher to operators.</li>
            <li className="flex gap-2"><Target className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />Aim to keep SLA hit rate above 90% to protect your trust score.</li>
          </ul>
        </Panel>
      </div>
    </div>
  )

  // ── Revenue ───────────────────────────────────────────────────────────────
  const revenue = (
    <div className="space-y-5">
      <SupplierKpiStrip
        kpis={[
          { label: "Total revenue", value: formatPence(d.totalRevenuePence ?? 0), icon: Wallet },
          { label: "Avg job value", value: formatPence(d.avgJobValuePence ?? 0), icon: TrendingUp },
          { label: "Jobs delivered", value: String(d.totalJobs ?? 0), icon: CheckCircle2 },
          { label: "Completion", value: pct(d.completionRatePct), icon: BarChart3 },
        ]}
      />
      <Panel title="Revenue over time" desc="Paid earnings per week (£)" state={a}>
        <SupplierBarChart data={d.earningsOverTime ?? []} height={240} />
      </Panel>
    </div>
  )

  // ── Coverage / demand ─────────────────────────────────────────────────────
  const coverage = (
    <div className="space-y-5">
      <SupplierKpiStrip
        kpis={[
          { label: "Quotes received", value: String(d.totalQuotes ?? 0), icon: MapPin },
          { label: "Active jobs", value: String(d.totalJobs ?? 0), icon: BarChart3 },
          { label: "Win rate", value: pct(d.winRatePct), icon: Target },
          { label: "Avg job value", value: formatPence(d.avgJobValuePence ?? 0), icon: Wallet },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Demand over time" desc="Quote requests per week" state={a}>
          <SupplierBarChart data={d.quotesOverTime ?? []} height={220} />
        </Panel>
        <Panel title="Pipeline coverage" desc="Quotes by stage" state={a}>
          <MixDonut slices={(d.quoteMix ?? []) as DonutSlice[]} />
        </Panel>
      </div>
    </div>
  )

  // ── Team productivity ─────────────────────────────────────────────────────
  const productivity = (
    <div className="space-y-5">
      <SupplierKpiStrip
        kpis={[
          { label: "Jobs delivered", value: String(d.totalJobs ?? 0), icon: Users },
          { label: "Completion", value: pct(d.completionRatePct), icon: CheckCircle2 },
          { label: "SLA hit rate", value: pct(d.slaHitPct), icon: Timer },
          { label: "Avg response", value: d.avgResponseHours != null ? `${d.avgResponseHours}h` : "—", icon: Clock },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Throughput" desc="Jobs completed per week" state={a}>
          <SupplierBarChart data={d.jobsOverTime ?? []} height={220} />
        </Panel>
        <Panel title="Work distribution" desc="Job status across the team" state={a}>
          <MixDonut slices={(d.statusMix ?? []) as DonutSlice[]} />
        </Panel>
      </div>
    </div>
  )

  const tabs: SupplierHubTab[] = [
    { key: "performance", label: "Performance", icon: BarChart3, render: () => performance },
    { key: "winrate", label: "Win Rate", icon: Target, render: () => winRate },
    { key: "sla", label: "SLA", icon: Timer, render: () => sla },
    { key: "revenue", label: "Revenue", icon: TrendingUp, render: () => revenue },
    { key: "coverage", label: "Coverage", icon: MapPin, render: () => coverage },
    {
      key: "team-productivity", label: "Team Productivity", icon: Users,
      render: () => (isTeam ? <TeamProductivity /> : productivity),
      teamOnly: true,
      upgradeTitle: "Team Productivity is a Team feature",
      upgradeDescription: "Upgrade to the Team plan to break performance down by team member, coverage and routes.",
    },
  ]

  return (
    <SupplierTabHub
      title="Insights"
      subtitle="Performance, win rate, SLA, revenue and coverage"
      isTeam={isTeam}
      actions={
        <SupplierButton variant="outline" onClick={() => a.refresh()}>
          <Download className="w-4 h-4" /> Export
        </SupplierButton>
      }
      tabs={tabs}
    />
  )
}
