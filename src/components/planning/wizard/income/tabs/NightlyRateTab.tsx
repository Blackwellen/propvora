"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { NightlyRateLine } from "@/components/planning/wizard/WizardContext"
import {
  calcNightly,
  gbp,
  grossYield,
  monthlyCurve,
  NIGHTS_PER_MONTH,
  OPEX_RATIO,
  round,
} from "@/lib/planning/income-calculations"
import {
  IncomeSectionHeader,
  TableShell,
  Row,
  SelectCell,
  TextCell,
  NumberCell,
  MoneyCell,
  DeleteCell,
  SummaryFooter,
  ChartGrid,
  MonthlyGrossCard,
  DonutCard,
  MetricsCard,
  TrendCard,
  TrendFooter,
  VoidAllowanceBar,
  IncomeAiPanel,
  PURPLE,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"

const CATEGORIES = ["Studio", "1 Bed", "2 Bed", "2 Bed (Premium)", "3 Bed", "Penthouse"]
const SEASONALITY_RULES = [
  "High: +25% Jul–Aug / Low: -15% Jan–Feb",
  "High: +20% Jul–Aug / Low: -12% Jan–Feb",
  "High: +15% Jul–Aug / Low: -10% Jan–Feb",
  "Flat year-round",
]

function rowGross(p: NightlyRateLine, voidPct: number): number {
  const avgNightly = (p.baseRateWeekday * (5 + 2 * (1 + p.weekendUpliftPct / 100))) / 7
  const occNights = NIGHTS_PER_MONTH * (p.occupancyTargetPct / 100) * (1 - voidPct / 100)
  const stays = occNights / Math.max(p.minStayNights || 1, 1)
  return round(avgNightly * occNights + stays * (p.cleaningFee || 0))
}

export default function NightlyRateTab() {
  const { state, update } = useWizard()
  const m = useMemo(() => calcNightly(state.nightlyRates, state.nightlyVoidPct), [state.nightlyRates, state.nightlyVoidPct])
  const ai = useIncomeAi("Nightly rate")

  const gy = grossYield(m.grossAnnual, state.propertyValue)

  function addPlan() {
    const next: NightlyRateLine = {
      id: Date.now().toString(),
      category: "Studio",
      baseRateWeekday: 95,
      weekendUpliftPct: 15,
      minStayNights: 2,
      occupancyTargetPct: 90,
      cleaningFee: 35,
      channelDirectPct: 40,
      channelOtaPct: 45,
      channelCorpPct: 15,
      seasonalityRule: SEASONALITY_RULES[0],
      notes: "",
    }
    update({ nightlyRates: [...state.nightlyRates, next] })
  }
  const updatePlan = (id: string, c: Partial<NightlyRateLine>) =>
    update({ nightlyRates: state.nightlyRates.map((p) => (p.id === id ? { ...p, ...c } : p)) })
  const removePlan = (id: string) => update({ nightlyRates: state.nightlyRates.filter((p) => p.id !== id) })

  const occ = m.avgOccupancyTarget
  const turnover = 2

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Nightly rate assumptions"
          subtitle="Set your nightly base rates, weekend uplift, minimum stay and channel mix. All rates in GBP (£)."
          addLabel="Add Rate Plan"
          onAdd={addPlan}
        />

        <TableShell
          minWidth={1180}
          addLabel="Add Rate Plan"
          onAdd={addPlan}
          headers={[
            "Room / Unit Category",
            "Nightly Base Rate (Weekday)",
            "Weekend Uplift (%)",
            "Min Stay (Nights)",
            "Occupancy Target (%)",
            "Cleaning Fee (Per stay)",
            "Channel Mix (Direct/OTA/Corp)",
            "Seasonality Rule",
            "Revenue Notes",
            "Projected Monthly Gross Income",
          ]}
        >
          {state.nightlyRates.map((p) => (
            <Row key={p.id}>
              <SelectCell value={p.category} onChange={(v) => updatePlan(p.id, { category: v })} options={CATEGORIES} width="min-w-[120px]" />
              <NumberCell value={p.baseRateWeekday} onChange={(v) => updatePlan(p.id, { baseRateWeekday: v })} prefix="£" />
              <NumberCell value={p.weekendUpliftPct} onChange={(v) => updatePlan(p.id, { weekendUpliftPct: v })} suffix="%" width="w-14" />
              <NumberCell value={p.minStayNights} onChange={(v) => updatePlan(p.id, { minStayNights: v })} width="w-14" min={1} />
              <NumberCell value={p.occupancyTargetPct} onChange={(v) => updatePlan(p.id, { occupancyTargetPct: v })} suffix="%" width="w-14" max={100} />
              <NumberCell value={p.cleaningFee} onChange={(v) => updatePlan(p.id, { cleaningFee: v })} prefix="£" width="w-20" />
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  {(["channelDirectPct", "channelOtaPct", "channelCorpPct"] as const).map((key, i) => (
                    <React.Fragment key={key}>
                      {i > 0 && <span className="text-[11px] text-slate-300">/</span>}
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={p[key]}
                        onChange={(e) => updatePlan(p.id, { [key]: Number(e.target.value) } as Partial<NightlyRateLine>)}
                        className="w-11 h-8 px-1 text-center rounded-lg border border-slate-200 text-[12px] text-slate-700 focus:outline-none"
                      />
                    </React.Fragment>
                  ))}
                </div>
              </td>
              <SelectCell value={p.seasonalityRule} onChange={(v) => updatePlan(p.id, { seasonalityRule: v })} options={SEASONALITY_RULES} width="min-w-[200px]" />
              <TextCell value={p.notes} onChange={(v) => updatePlan(p.id, { notes: v })} placeholder="High demand" width="w-28" />
              <MoneyCell value={rowGross(p, state.nightlyVoidPct)} />
              <DeleteCell onDelete={() => removePlan(p.id)} />
            </Row>
          ))}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "🛏️", label: "Total Rate Plans", value: String(m.planCount) },
            { icon: "💷", label: "Average Nightly Rate", value: m.avgNightlyRate ? gbp(m.avgNightlyRate) : "—" },
            { icon: "📈", label: "Average Occupancy Target", value: `${m.avgOccupancyTarget}%` },
          ]}
          totalLabel="Total Monthly Income (Gross)"
          totalValue={gbp(m.grossMonthly)}
        />
      </div>

      <VoidAllowanceBar
        label="Void / Unsold Night Allowance"
        value={state.nightlyVoidPct}
        onChange={(v) => update({ nightlyVoidPct: v })}
        hint="Typical: 8%–15% for serviced accommodation. Covers voids, clean days, maintenance & unforeseen gaps."
      />

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Gross Income" value={gbp(m.grossMonthly)} sub={`Annual Gross Income ${gbp(m.grossAnnual)}`} data={monthlyCurve(m.grossMonthly, 8)} />
        <DonutCard
          title="Occupancy Distribution"
          data={[
            { name: "Let (Current)", value: occ, colour: PURPLE, display: `${occ}%` },
            { name: "Void (Expected)", value: round(100 - occ - turnover, 1), colour: "#FCD34D", display: `${round(100 - occ - turnover, 1)}%` },
            { name: "Turnover", value: turnover, colour: "#CBD5E1", display: `${turnover}%` },
          ]}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Gross Yield", value: gy != null ? `${gy.toFixed(1)}%` : "—" },
            { label: "Net Yield (After Costs)", value: gy != null ? `${(gy * (1 - OPEX_RATIO)).toFixed(1)}%` : "—" },
            { label: "Average Nightly Rate", value: m.avgNightlyRate ? gbp(m.avgNightlyRate) : "—" },
            { label: "RevPAR (Room)", value: m.revpar ? gbp(m.revpar) : "—" },
            { label: "ADR (Achieved)", value: m.adr ? gbp(m.adr) : "—" },
          ]}
        />
        <TrendCard
          title="Seasonality Impact"
          badge={{ label: "Low (+3%)", tone: "green" }}
          data={monthlyCurve(m.grossMonthly, 8)}
          formatter={(v) => gbp(v)}
          footer={<TrendFooter leftLabel="Peak impact" leftValue="+8% (Aug)" rightLabel="Low impact" rightValue="-8% (Jan)" />}
        />
      </ChartGrid>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.nightlyRates.length) return []
            const out = []
            const lowOcc = [...state.nightlyRates].sort((a, b) => a.occupancyTargetPct - b.occupancyTargetPct)[0]
            out.push({
              recommendationType: "pricing",
              title: "Nightly pricing suggestion",
              body: `Test a 5–10% rate increase on ${m.avgNightlyRate ? gbp(m.avgNightlyRate) : "your"} ADR during peak season to capture demand.`,
              estimatedImpactMonthly: round(m.grossMonthly * 0.06),
            })
            if (lowOcc && lowOcc.occupancyTargetPct < 90) {
              out.push({
                recommendationType: "occupancy",
                title: "Occupancy insight",
                body: `${lowOcc.category} targets ${lowOcc.occupancyTargetPct}% occupancy — longer min-stays in low season could lift it.`,
                estimatedImpactMonthly: round(rowGross(lowOcc, state.nightlyVoidPct) * 0.04),
              })
            }
            return out
          })
        }
      />
    </div>
  )
}
