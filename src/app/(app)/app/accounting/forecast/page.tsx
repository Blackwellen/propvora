"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Plus,
  Download,
  LineChart,
  CheckCircle2,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { AccountingKpiCard } from "@/features/accounting/components"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { isMissingTable, toCsv, downloadCsv } from "@/features/accounting/ledger"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

interface ForecastScenario {
  id: string
  name: string
  based_on: string | null
  period_months: number
  currency: string
  description: string | null
  is_base: boolean
  created_at: string
}

export default function ForecastPage() {
  const { workspace } = useWorkspace()
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  useEffect(() => {
    if (!workspace?.id) { setScenarios([]); setLoading(false); return }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("accounting_forecast_scenarios")
          .select("id, name, based_on, period_months, currency, description, is_base, created_at")
          .eq("workspace_id", workspace.id)
          .order("is_base", { ascending: false })
          .order("created_at", { ascending: true })
        if (cancelled) return
        if (error) {
          if (!isMissingTable(error)) throw error
          setScenarios([])
        } else {
          setScenarios((data ?? []) as ForecastScenario[])
        }
      } catch {
        if (!cancelled) setScenarios([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [workspace?.id])

  function exportCsv() {
    if (scenarios.length === 0) { showToast("No scenarios to export"); return }
    const csv = toCsv(
      ["Name", "Based On", "Period (months)", "Currency", "Base Plan", "Created"],
      scenarios.map((s) => [s.name, s.based_on ?? "", s.period_months, s.currency, s.is_base ? "Yes" : "No", s.created_at.slice(0, 10)])
    )
    downloadCsv(`forecast-scenarios-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    showToast("Scenarios exported")
  }

  const cardMapping: MobileCardMapping<ForecastScenario> = {
    getKey: (s) => s.id,
    title: (s) => s.name,
    subtitle: (s) => s.description ?? undefined,
    leading: (s) => s.is_base ? <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0 mt-1" /> : undefined,
    badge: (s) => (
      <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", s.is_base ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-slate-100 text-slate-600")}>
        {s.is_base ? "Base Plan" : "Variant"}
      </span>
    ),
    fields: [
      { label: "Based On", render: (s) => s.based_on ?? "—" },
      { label: "Period", render: (s) => `${s.period_months} months` },
      { label: "Currency", render: (s) => s.currency },
    ],
    actions: (s) => (
      <ActionMenu
        items={[
          { label: "View Scenario", icon: LineChart, onClick: () => showToast(`${s.name} — ${s.period_months} month horizon`) },
          { label: "Export (CSV)", icon: Download, onClick: exportCsv },
        ]}
      />
    ),
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      <MobileTopBar
        title="Forecast Scenarios"
        subtitle="Accounting"
        primaryAction={{ label: "New scenario", icon: Plus, href: "/app/accounting/forecast/scenarios/new" }}
        overflowActions={scenarios.length > 0 ? [{ label: "Export CSV", icon: Download, onClick: exportCsv }] : undefined}
      />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="hidden md:flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Accounting</span>
            <ChevronRight className="w-3 h-3" />
            <span>Forecast</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" size="md">06 · Forecast</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Forecast Scenarios</h1>
          </div>
          <p className="text-sm text-slate-500">Plan future performance with forecast scenarios. Variance against actuals comes from the live ledger.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={exportCsv} disabled={scenarios.length === 0}>Export</Button>
          <Button variant="primary" size="sm" asChild leftIcon={<Plus className="w-3.5 h-3.5" />}>
            <Link href="/app/accounting/forecast/scenarios/new">New Scenario</Link>
          </Button>
        </div>
      </div>

      {/* KPI Row — live counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AccountingKpiCard label="Scenarios" value={String(scenarios.length)} subtitle="Defined plans" trendNeutral />
        <AccountingKpiCard label="Base Plan" value={scenarios.some((s) => s.is_base) ? "Set" : "Not set"} subtitle="Anchor scenario" trendNeutral />
        <AccountingKpiCard label="Variants" value={String(scenarios.filter((s) => !s.is_base).length)} subtitle="Upside / downside" trendNeutral />
        <AccountingKpiCard label="Horizon" value={scenarios[0] ? `${scenarios[0].period_months} mo` : "—"} subtitle="Default period" trendNeutral />
      </div>

      {/* Scenarios list */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-slate-900">Forecast Scenarios</h3>
          <p className="text-xs text-slate-500 mt-0.5">Scenario definitions stored for this workspace.</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading scenarios…</div>
        ) : scenarios.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No forecast scenarios yet</p>
            <p className="text-xs text-slate-500 max-w-md">
              Create a base plan to forecast income and expenses, then compare against actuals from the ledger.
              No projections are shown until a scenario is defined.
            </p>
            <Button variant="primary" size="sm" asChild leftIcon={<Plus className="w-3.5 h-3.5" />}>
              <Link href="/app/accounting/forecast/scenarios/new">Create Base Plan</Link>
            </Button>
          </div>
        ) : (
          <ResponsiveTable rows={scenarios} mobile={cardMapping} className="p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Scenario</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Based On</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Period</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-24">Currency</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Type</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s, idx) => (
                  <tr key={s.id} className={cn("border-b border-[#E2E8F0] hover:bg-slate-50/50 transition-colors", idx === scenarios.length - 1 && "border-0")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {s.is_base && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">{s.name}</p>
                          {s.description && <p className="text-[11px] text-slate-500 max-w-md truncate">{s.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-slate-600">{s.based_on ?? "—"}</td>
                    <td className="px-4 py-3.5 text-[13px] text-slate-600">{s.period_months} months</td>
                    <td className="px-4 py-3.5 text-[13px] text-slate-600">{s.currency}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", s.is_base ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-slate-100 text-slate-600")}>
                        {s.is_base ? "Base Plan" : "Variant"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionMenu
                        items={[
                          { label: "View Scenario", icon: LineChart, onClick: () => showToast(`${s.name} — ${s.period_months} month horizon`) },
                          { label: "Export (CSV)", icon: Download, onClick: exportCsv },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </ResponsiveTable>
        )}
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-blue-50 border border-blue-100">
        <LineChart className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Forecast vs actual variance is derived from posted journal lines in the{" "}
          <Link href="/app/accounting/reports" className="font-semibold underline">Financial Reports</Link>.
          Detailed monthly projections appear once a scenario has line-item assumptions configured.
        </p>
      </div>
    </div>
  )
}
