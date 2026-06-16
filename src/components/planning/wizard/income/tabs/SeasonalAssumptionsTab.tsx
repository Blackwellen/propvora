"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { SeasonLine } from "@/components/planning/wizard/WizardContext"
import {
  calcSeasonal,
  calcRooms,
  calcUnits,
  calcNightly,
  gbp,
  grossYield,
  rentCover,
  monthlyCurve,
  round,
  OPEX_RATIO,
} from "@/lib/planning/income-calculations"
import {
  IncomeKpiStrip,
  TableShell,
  Row,
  TextCell,
  DeleteCell,
  ChartGrid,
  MonthlyGrossCard,
  DonutCard,
  MetricsCard,
  TrendCard,
  TrendFooter,
  DetailAccordion,
  IncomeAiPanel,
  GREEN,
  BLUE,
  PURPLE,
  AMBER,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"
import { cn } from "@/lib/utils"

const BASE_STRATEGIES = ["4-Season UK (Default)", "2-Season (Peak/Off)", "Term-Time / Holiday", "Custom"]
const DEMAND_LEVELS: SeasonLine["demandLevel"][] = ["High", "Medium", "Low"]
const DEMAND_TONE: Record<SeasonLine["demandLevel"], string> = {
  High: "bg-emerald-50 text-emerald-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-rose-50 text-rose-500",
}
const DOT_COLOURS = ["#10B981", "#F59E0B", "#F97316", "#3B82F6", "#8B5CF6"]

export default function SeasonalAssumptionsTab() {
  const { state, update } = useWizard()
  const s = useMemo(() => calcSeasonal(state.seasons), [state.seasons])
  const ai = useIncomeAi("Seasonal assumptions")

  const coreRent =
    calcRooms(state.rooms, state.voidAllowancePct).grossMonthly +
    calcUnits(state.units, state.voidAllowancePct).grossMonthly +
    calcNightly(state.nightlyRates, state.nightlyVoidPct).grossMonthly
  const grossAnnual = coreRent * 12
  const unitM = calcUnits(state.units, state.voidAllowancePct)
  const gy = grossYield(grossAnnual, state.propertyValue)
  const rc = rentCover(coreRent, state.propertyValue, state.forecastLtvPct, state.forecastInterestRatePct)
  const occupancy = round(100 - state.voidAllowancePct)

  function addSeason() {
    const i = state.seasons.length
    const next: SeasonLine = {
      id: Date.now().toString(),
      name: "New Season",
      colour: DOT_COLOURS[i % DOT_COLOURS.length],
      dateRange: "",
      occupancyAdjPct: 0,
      rateAdjPct: 0,
      demandLevel: "Medium",
      localEvents: "",
      notes: "",
    }
    update({ seasons: [...state.seasons, next] })
  }
  const updateSeason = (id: string, c: Partial<SeasonLine>) =>
    update({ seasons: state.seasons.map((x) => (x.id === id ? { ...x, ...c } : x)) })
  const removeSeason = (id: string) => update({ seasons: state.seasons.filter((x) => x.id !== id) })

  const signed = (v: number) => `${v > 0 ? "+" : ""}${v}%`

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Gross Monthly", value: gbp(coreRent), sub: "pcm", info: true },
          { label: "Gross Annual", value: gbp(grossAnnual), sub: "pa", info: true },
          { label: "Avg. Occupancy", value: `${occupancy}%`, tone: GREEN, info: true },
          { label: "Gross Yield", value: gy != null ? `${gy.toFixed(1)}%` : "—", tone: PURPLE, info: true },
          { label: "Net Yield", value: gy != null ? `${(gy * (1 - OPEX_RATIO)).toFixed(1)}%` : "—", tone: AMBER, info: true },
          { label: "Avg. Unit Rate (PCM)", value: unitM.avgUnitRate ? gbp(unitM.avgUnitRate) : "—", tone: BLUE, info: true },
          { label: "Net Income (Annual)", value: gbp(round(grossAnnual * (1 - OPEX_RATIO))), tone: GREEN, info: true },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Seasonal assumptions</h2>
            <p className="text-[12.5px] text-slate-400">Define seasonal periods and their impact on occupancy, pricing and demand.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11.5px] text-slate-400">Base strategy</span>
            <select
              value={state.seasonalBaseStrategy}
              onChange={(e) => update({ seasonalBaseStrategy: e.target.value })}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {BASE_STRATEGIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
              {(["pct", "index"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => update({ seasonalMode: mode })}
                  className={cn(
                    "h-7 px-2.5 rounded-md text-[11.5px] font-semibold transition-all",
                    state.seasonalMode === mode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500",
                  )}
                >
                  {mode === "pct" ? "% Adjustments" : "Index (Base = 100)"}
                </button>
              ))}
            </div>
            <button
              onClick={addSeason}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#7C3AED] text-white text-[12.5px] font-semibold hover:bg-violet-700 transition-colors"
            >
              + Add Season
            </button>
          </div>
        </div>

        <TableShell
          minWidth={1080}
          headers={["Season Name", "Date Range", "Occupancy Adjustment", "Rate Adjustment", "Demand Level", "Local Events (Examples)", "Notes"]}
        >
          {state.seasons.map((x) => (
            <Row key={x.id}>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.colour }} />
                  <input
                    value={x.name}
                    onChange={(e) => updateSeason(x.id, { name: e.target.value })}
                    className="w-36 h-8 px-2 rounded-lg border border-slate-200 text-[12.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>
              </td>
              <TextCell value={x.dateRange} onChange={(v) => updateSeason(x.id, { dateRange: v })} placeholder="Jun 1 – Aug 31" width="w-32" />
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={x.occupancyAdjPct}
                    onChange={(e) => updateSeason(x.id, { occupancyAdjPct: Number(e.target.value) })}
                    className={cn(
                      "w-16 h-8 px-2 text-center rounded-lg border border-slate-200 text-[12.5px] font-semibold focus:outline-none",
                      x.occupancyAdjPct >= 0 ? "text-emerald-600" : "text-rose-500",
                    )}
                  />
                  <span className="text-[11px] text-slate-400">%</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={x.rateAdjPct}
                    onChange={(e) => updateSeason(x.id, { rateAdjPct: Number(e.target.value) })}
                    className={cn(
                      "w-16 h-8 px-2 text-center rounded-lg border border-slate-200 text-[12.5px] font-semibold focus:outline-none",
                      x.rateAdjPct >= 0 ? "text-emerald-600" : "text-rose-500",
                    )}
                  />
                  <span className="text-[11px] text-slate-400">%</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <select
                  value={x.demandLevel}
                  onChange={(e) => updateSeason(x.id, { demandLevel: e.target.value as SeasonLine["demandLevel"] })}
                  className={cn("h-7 px-2 rounded-full text-[10.5px] font-semibold border-0 cursor-pointer", DEMAND_TONE[x.demandLevel])}
                >
                  {DEMAND_LEVELS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </td>
              <TextCell value={x.localEvents} onChange={(v) => updateSeason(x.id, { localEvents: v })} placeholder="School holidays, Festivals" width="w-44" />
              <TextCell value={x.notes} onChange={(v) => updateSeason(x.id, { notes: v })} placeholder="Notes" width="w-32" />
              <DeleteCell onDelete={() => removeSeason(x.id)} />
            </Row>
          ))}
        </TableShell>

        <p className="text-[11.5px] text-slate-400 mt-3">
          ⓘ Adjustments are applied to your base occupancy ({occupancy}%) and base rate ({gbp(unitM.avgUnitRate || 1000)} pcm) to calculate seasonal impact.
        </p>
      </div>

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Gross Income" value={gbp(coreRent)} sub="Average per month" data={monthlyCurve(coreRent, 12)} />
        <DonutCard
          title="Occupancy Distribution"
          data={[
            { name: "Let (Current)", value: occupancy, colour: PURPLE, display: `${occupancy}%` },
            { name: "Void (Expected)", value: round(100 - occupancy - 1), colour: "#FCD34D", display: `${round(100 - occupancy - 1)}%` },
            { name: "Turnover", value: 1, colour: "#CBD5E1", display: "1%" },
          ]}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Gross Yield", value: gy != null ? `${gy.toFixed(1)}%` : "—" },
            { label: "Net Yield (After Costs)", value: gy != null ? `${(gy * (1 - OPEX_RATIO)).toFixed(1)}%` : "—" },
            { label: "Average Unit Rate (pcm)", value: unitM.avgUnitRate ? gbp(unitM.avgUnitRate) : "—" },
            { label: "Rev: Cover (Gross)", value: rc != null ? `${rc.toFixed(2)}x` : "—" },
            { label: "Rev: PBT (pcm)", value: gbp(round(coreRent * (1 - OPEX_RATIO))) },
          ]}
        />
        <TrendCard
          title="Seasonality Impact"
          badge={{ label: `${s.netAnnualImpactPct >= 0 ? "+" : ""}${s.netAnnualImpactPct}% net`, tone: s.netAnnualImpactPct >= 0 ? "green" : "amber" }}
          data={monthlyCurve(coreRent, Math.max(Math.abs(s.peakImpactPct), 8))}
          formatter={(v) => gbp(v)}
          footer={
            <TrendFooter
              leftLabel="Peak Impact"
              leftValue={`${signed(s.peakImpactPct)} (${s.peakSeason})`}
              rightLabel="Low Impact"
              rightValue={`${signed(s.lowImpactPct)} (${s.lowSeason})`}
            />
          }
        />
      </ChartGrid>

      <div className="border-b border-slate-100">
        <DetailAccordion title="Seasonal assumptions (detailed)" subtitle="" status={state.seasons.length ? "Configured" : "Not set"}>
          {state.seasons.length
            ? `${state.seasons.length} season(s) defined. Net annual rate impact ${signed(s.netAnnualImpactPct)}.`
            : "Add seasons above to configure detailed seasonal assumptions."}
        </DetailAccordion>
        <DetailAccordion title="Demand drivers" subtitle="Local demand factors, events & market indicators" status={state.seasons.some((x) => x.localEvents) ? "Configured" : "Not set"}>
          {state.seasons.filter((x) => x.localEvents).map((x) => `${x.name}: ${x.localEvents}`).join(" · ") || "Add local events to each season to capture demand drivers."}
        </DetailAccordion>
        <DetailAccordion title="Sensitivity analysis" subtitle="Test impact of changes in seasonality" status={state.seasons.length ? "Configured" : "Not set"}>
          Peak season lifts monthly gross to ~{gbp(round(coreRent * (1 + s.peakImpactPct / 100)))}; low season to ~{gbp(round(coreRent * (1 + s.lowImpactPct / 100)))}.
        </DetailAccordion>
      </div>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.seasons.length) return []
            return [
              {
                recommendationType: "pricing",
                title: "Seasonal pricing suggestion",
                body: `Increase rates by ~${Math.max(s.peakImpactPct, 10)}% during ${s.peakSeason} to maximise peak demand capture.`,
                estimatedImpactMonthly: round(coreRent * (Math.max(s.peakImpactPct, 10) / 100)),
              },
              {
                recommendationType: "occupancy",
                title: "Occupancy optimisation",
                body: `Consider mid-stay discounts in ${s.lowSeason} to improve low-season occupancy.`,
                estimatedImpactMonthly: round(coreRent * 0.04),
              },
            ]
          })
        }
      />
    </div>
  )
}
