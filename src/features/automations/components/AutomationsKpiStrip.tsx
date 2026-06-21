"use client"

import { Check, History, Inbox, Zap } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type Tone = "blue" | "amber" | "emerald" | "slate"

const TONES: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-100 text-slate-500",
}

interface KpiCardProps {
  label: string
  value: number
  sub: string
  icon: LucideIcon
  tone: Tone
}

function KpiCard({ label, value, sub, icon: Icon, tone }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${TONES[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  )
}

export interface AutomationsKpiStripProps {
  activeRules: number
  totalRules: number
  pendingCount: number
  executedCount: number
  recentRuns: number
}

/**
 * Four-up KPI strip for the Automations overview page.
 * Shows active rules, pending review count, total executed, and recent run count.
 */
export default function AutomationsKpiStrip({
  activeRules,
  totalRules,
  pendingCount,
  executedCount,
  recentRuns,
}: AutomationsKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard label="Active automations" value={activeRules} sub={`${totalRules} total`} icon={Zap} tone="blue" />
      <KpiCard label="Pending review" value={pendingCount} sub="awaiting approval" icon={Inbox} tone="amber" />
      <KpiCard label="Actions executed" value={executedCount} sub="all time" icon={Check} tone="emerald" />
      <KpiCard label="Runs (recent)" value={recentRuns} sub="last 200" icon={History} tone="slate" />
    </div>
  )
}
