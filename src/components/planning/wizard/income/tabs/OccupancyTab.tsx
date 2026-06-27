"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { OccupancyScenario } from "@/components/planning/wizard/WizardContext"
import {
  calcOccupancy,
  calcRooms,
  calcUnits,
  calcNightly,
  gbp,
  grossYield,
  rentCover,
  monthlyCurve,
  parseRangeCount,
  sum,
  round,
  OPEX_RATIO,
} from "@/lib/planning/income-calculations"
import {
  IncomeKpiStrip,
  IncomeSectionHeader,
  TableShell,
  Row,
  SelectCell,
  TextCell,
  NumberCell,
  DeleteCell,
  SummaryFooter,
  ChartGrid,
  MonthlyGrossCard,
  DonutCard,
  MetricsCard,
  TrendCard,
  TrendFooter,
  IncomeAiPanel,
  GREEN,
  BLUE,
  PURPLE,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"
import { cn } from "@/lib/utils"

const KINDS: OccupancyScenario["kind"][] = ["base", "upside", "downside", "ramp"]
const KIND_LABEL: Record<OccupancyScenario["kind"], string> = { base: "Base", upside: "Upside", downside: "Downside", ramp: "Ramp" }
const KIND_TONE: Record<OccupancyScenario["kind"], string> = {
  base: "bg-slate-100 text-slate-600",
  upside: "bg-emerald-50 text-emerald-600",
  downside: "bg-amber-50 text-amber-600",
  ramp: "bg-[var(--brand-soft)] text-[var(--brand)]",
}
const CHANNELS = ["Direct & Referrals", "Direct", "Aggregators", "Mixed", "OTA"]
const SEGMENTS = ["Mid-Market", "Premium", "Budget", "Student", "Corporate"]
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

export default function OccupancyTab() {
  const { state, update } = useWizard()
  const occ = useMemo(() => calcOccupancy(state.occupancyScenarios), [state.occupancyScenarios])
  const ai = useIncomeAi("Occupancy")

  const coreRent =
    calcRooms(state.rooms, state.voidAllowancePct).grossMonthly +
    calcUnits(state.units, state.voidAllowancePct).grossMonthly +
    calcNightly(state.nightlyRates, state.nightlyVoidPct).grossMonthly
  const grossAnnual = coreRent * 12
  const totalUnits = sum(state.units.map((u) => parseRangeCount(u.unitNumber))) || state.rooms.length || state.numUnits || 0
  const arr = totalUnits ? round(coreRent / totalUnits) : 0
  const gy = grossYield(grossAnnual, state.propertyValue)
  const rc = rentCover(coreRent, state.propertyValue, state.forecastLtvPct, state.forecastInterestRatePct)
  const baseOcc = occ.baseOccupancy || occ.weightedOccupancy

  function addScenario() {
    const next: OccupancyScenario = {
      id: Date.now().toString(),
      name: "New Scenario",
      kind: "base",
      targetOccupancyPct: 94,
      expectedVoidPct: 6,
      turnoverPct: 6,
      leaseUpPeriod: "—",
      stabilisedPeriod: "Month 4 onwards",
      channel: "Direct & Referrals",
      segment: "Mid-Market",
      notes: "",
    }
    update({ occupancyScenarios: [...state.occupancyScenarios, next] })
  }
  const updateScenario = (id: string, c: Partial<OccupancyScenario>) =>
    update({ occupancyScenarios: state.occupancyScenarios.map((s) => (s.id === id ? { ...s, ...c } : s)) })
  const removeScenario = (id: string) => update({ occupancyScenarios: state.occupancyScenarios.filter((s) => s.id !== id) })

  const deltaIncome = round(coreRent * 0.05)
  const sensitivityRows = [
    { label: `Base Scenario (${baseOcc}%)`, delta: 0 },
    { label: "-5% Occupancy", delta: -5 },
    { label: "+5% Occupancy", delta: 5 },
  ]

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Gross Monthly", value: gbp(coreRent), sub: "pcm", info: true },
          { label: "Gross Annual", value: gbp(grossAnnual), sub: "pa", info: true },
          { label: "Avg. Occupancy", value: `${occ.weightedOccupancy}%`, tone: GREEN, info: true },
          { label: "Avg. Room Rate", value: arr ? gbp(arr) : "—", tone: PURPLE, info: true },
          { label: "Net Yield", value: gy != null ? `${(gy * (1 - OPEX_RATIO)).toFixed(1)}%` : "—", tone: BLUE, info: true },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Occupancy assumptions"
          subtitle="Define your occupancy scenarios by target performance, market channel and property segment."
          addLabel="Add Occupancy Scenario"
          onAdd={addScenario}
        />

        <TableShell
          minWidth={1180}
          addLabel="Add Occupancy Scenario"
          onAdd={addScenario}
          headers={[
            "Scenario / Type",
            "Target Occupancy %",
            "Expected Void %",
            "Turnover % (Annual)",
            "Lease-Up Period",
            "Stabilised Period",
            "Channel / Source",
            "Property Segment",
            "Assumptions Notes",
          ]}
        >
          {state.occupancyScenarios.map((s) => (
            <Row key={s.id}>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    value={s.name}
                    onChange={(e) => updateScenario(s.id, { name: e.target.value })}
                    className="w-32 h-8 px-2 rounded-lg border border-slate-200 text-[12.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                  <select
                    value={s.kind}
                    onChange={(e) => updateScenario(s.id, { kind: e.target.value as OccupancyScenario["kind"] })}
                    className={cn("h-6 px-2 rounded-full text-[10px] font-semibold border-0 cursor-pointer", KIND_TONE[s.kind])}
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <NumberCell value={s.targetOccupancyPct ?? 0} onChange={(v) => updateScenario(s.id, { targetOccupancyPct: v })} suffix="%" width="w-16" max={100} />
              <NumberCell value={s.expectedVoidPct ?? 0} onChange={(v) => updateScenario(s.id, { expectedVoidPct: v })} suffix="%" width="w-16" max={100} />
              <NumberCell value={s.turnoverPct ?? 0} onChange={(v) => updateScenario(s.id, { turnoverPct: v })} suffix="%" width="w-16" max={100} />
              <TextCell value={s.leaseUpPeriod} onChange={(v) => updateScenario(s.id, { leaseUpPeriod: v })} placeholder="—" width="w-24" />
              <TextCell value={s.stabilisedPeriod} onChange={(v) => updateScenario(s.id, { stabilisedPeriod: v })} width="w-32" />
              <SelectCell value={s.channel} onChange={(v) => updateScenario(s.id, { channel: v })} options={CHANNELS} width="min-w-[130px]" />
              <SelectCell value={s.segment} onChange={(v) => updateScenario(s.id, { segment: v })} options={SEGMENTS} width="min-w-[120px]" />
              <TextCell value={s.notes} onChange={(v) => updateScenario(s.id, { notes: v })} placeholder="Notes" width="w-36" />
              <DeleteCell onDelete={() => removeScenario(s.id)} />
            </Row>
          ))}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "🎯", label: "Weighted Avg. Occupancy", value: `${occ.weightedOccupancy}%` },
            { icon: "📉", label: "Weighted Avg. Void", value: `${occ.weightedVoid}%` },
            { icon: "🔁", label: "Weighted Turnover (Annual)", value: `${occ.weightedTurnover}%` },
            { icon: "📡", label: "Primary Channel", value: occ.primaryChannel },
            { icon: "📈", label: "Stabilisation", value: occ.stabilisation },
          ]}
          totalLabel="Total Monthly Income (Gross)"
          totalValue={gbp(coreRent)}
        />
      </div>

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Gross Income" value={gbp(coreRent)} sub={`Annual Gross Income: ${gbp(grossAnnual)}`} data={monthlyCurve(coreRent, 3)} />
        <DonutCard
          title="Occupancy Distribution"
          data={[
            { name: `Occupied (${occ.weightedOccupancy}%)`, value: occ.weightedOccupancy, colour: PURPLE, display: `${occ.weightedOccupancy}%` },
            { name: `Void (${occ.weightedVoid}%)`, value: occ.weightedVoid, colour: "#FCD34D", display: `${occ.weightedVoid}%` },
            { name: "Turnover", value: occ.weightedTurnover, colour: "#CBD5E1", display: `${occ.weightedTurnover}%` },
          ]}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Gross Yield", value: gy != null ? `${gy.toFixed(1)}%` : "—" },
            { label: "Net Yield (After Costs)", value: gy != null ? `${(gy * (1 - OPEX_RATIO)).toFixed(1)}%` : "—" },
            { label: "Average Room Rate (ARR)", value: arr ? gbp(arr) : "—" },
            { label: "RevPAR (Gross)", value: arr ? gbp(round(arr * (occ.weightedOccupancy / 100))) : "—" },
            { label: "Rent Cover (Gross)", value: rc != null ? `${rc.toFixed(2)}x` : "—" },
          ]}
        />
        <TrendCard
          title="Seasonality / Occupancy Trend"
          badge={{ label: "Low (+2%)", tone: "green" }}
          data={monthlyCurve(coreRent, 2)}
          formatter={(v) => gbp(v)}
          footer={<TrendFooter leftLabel="Peak Occupancy" leftValue="+2.0% (Jul)" rightLabel="Low Occupancy" rightValue="-1.1% (Jan)" />}
        />
      </ChartGrid>

      {/* Occupancy sensitivity */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Occupancy sensitivity</h3>
            <p className="text-[12px] text-slate-400">Analyze the impact of occupancy changes on gross monthly income.</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {(["month", "propertyType"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => update({ occupancySensitivityMode: mode })}
                className={cn(
                  "h-7 px-3 rounded-md text-[12px] font-semibold transition-all",
                  state.occupancySensitivityMode === mode ? "bg-[#7C3AED] text-white" : "text-slate-500",
                )}
              >
                {mode === "month" ? "By Month" : "By Property Type"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-5">
          <div className="rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-[10.5px] font-semibold text-slate-500 uppercase px-3 py-2.5">Sensitivity</th>
                  {MONTHS.map((mo) => (
                    <th key={mo} className="text-center text-[10px] font-semibold text-slate-500 uppercase px-2 py-2.5">
                      {mo}
                    </th>
                  ))}
                  <th className="text-center text-[10px] font-semibold text-slate-500 uppercase px-2 py-2.5">ANNUAL</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityRows.map((r) => (
                  <tr key={r.label} className="border-b border-slate-100 last:border-0">
                    <td className="text-[12px] font-semibold text-slate-700 px-3 py-2.5 whitespace-nowrap">{r.label}</td>
                    {MONTHS.map((mo, i) => {
                      const seasonal = Math.round(Math.sin(((i - 2) / 12) * Math.PI * 2) * 2)
                      const v = Math.min(100, Math.max(0, baseOcc + r.delta + seasonal))
                      return (
                        <td key={mo} className="text-center text-[11.5px] text-slate-600 px-2 py-2.5">
                          {v}%
                        </td>
                      )
                    })}
                    <td className="text-center text-[11.5px] font-bold text-slate-800 px-2 py-2.5">
                      {Math.min(100, Math.max(0, baseOcc + r.delta))}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[12px] font-bold text-slate-900 mb-3">Income Impact (Monthly)</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] text-slate-500">-5% Occupancy</span>
                <span className="text-[12px] font-bold text-rose-500">-{gbp(deltaIncome)} (-5.0%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] text-slate-500">Base ({baseOcc}%)</span>
                <span className="text-[12px] font-bold text-slate-800">{gbp(coreRent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] text-slate-500">+5% Occupancy</span>
                <span className="text-[12px] font-bold text-emerald-600">+{gbp(deltaIncome)} (+5.0%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.occupancyScenarios.length) return []
            return [
              {
                recommendationType: "occupancy",
                title: "Occupancy insight",
                body: `Your weighted occupancy of ${occ.weightedOccupancy}% drives ${gbp(coreRent)} pcm. Early lease-up focus reaches stabilisation sooner.`,
                estimatedImpactMonthly: deltaIncome,
              },
              {
                recommendationType: "channel",
                title: "Channel mix",
                body: `${occ.primaryChannel} is your primary channel — direct & referral mixes typically deliver 3–5% higher occupancy.`,
                estimatedImpactMonthly: round(coreRent * 0.03),
              },
            ]
          })
        }
      />
    </div>
  )
}
