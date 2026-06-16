import React from "react"
import { MoneyTabNav } from "./MoneyTabNav"

/**
 * Presentational shell for a money sub-section: title + subtitle + the shared
 * money tab rail + a KPI strip + the section body. Server-component-safe (no
 * client hooks). Money values are pre-formatted by the caller.
 */

export interface SectionKpi {
  label: string
  value: string
  hint?: string
  tone?: "default" | "positive" | "negative" | "warning"
}

const TONE: Record<NonNullable<SectionKpi["tone"]>, string> = {
  default: "text-slate-900",
  positive: "text-emerald-600",
  negative: "text-red-600",
  warning: "text-amber-600",
}

export function MoneySectionShell({
  title,
  subtitle,
  kpis,
  notReady,
  children,
}: {
  title: string
  subtitle: string
  kpis?: SectionKpi[]
  notReady?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="px-6 pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="mt-4 -mx-0 px-6">
        <MoneyTabNav />
      </div>

      <div className="flex-1 px-6 py-6 flex flex-col gap-6">
        {notReady && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This section is not provisioned yet — once payments are configured, live data will appear here.
          </div>
        )}

        {kpis && kpis.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs font-medium text-slate-500">{k.label}</p>
                <p className={`mt-1 text-xl font-bold ${TONE[k.tone ?? "default"]}`}>{k.value}</p>
                {k.hint && <p className="mt-0.5 text-[11px] text-slate-400">{k.hint}</p>}
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}

export function MoneyEmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center gap-2 text-center">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
