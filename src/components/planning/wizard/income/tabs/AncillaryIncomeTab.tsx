"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { AncillaryLine } from "@/components/planning/wizard/WizardContext"
import {
  calcAncillary,
  deriveOccupiedUnits,
  gbp,
  monthlyCurve,
  round,
} from "@/lib/planning/income-calculations"
import {
  IncomeKpiStrip,
  IncomeSectionHeader,
  TableShell,
  Row,
  TextCell,
  NumberCell,
  SelectCell,
  MoneyCell,
  DeleteCell,
  SummaryFooter,
  ChartGrid,
  MonthlyGrossCard,
  DonutCard,
  MetricsCard,
  TrendCard,
  IncomeAiPanel,
  GREEN,
  PURPLE,
  AMBER,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"

const PRICING_MODELS = ["Per clean", "Per month", "Per pet / month", "Per booking", "Per item", "One-time"]
const FREQUENCIES = ["Per occurrence", "Monthly", "One-time", "Per item"]
const VAT_STATUS = ["VATable (20%)", "Exempt", "Zero-rated"]
const LINKED = ["All Units", "Pet Friendly Units", "Units with Parking", "Common Areas"]
const MIX_COLOURS = ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#CBD5E1"]

function lineMonthly(l: AncillaryLine, occUnits: number): number {
  return round(l.unitPriceIncVat * (l.adoptionRate / 100) * occUnits)
}

export default function AncillaryIncomeTab() {
  const { state, update } = useWizard()
  const occUnits = useMemo(
    () => deriveOccupiedUnits({ units: state.units, rooms: state.rooms, numUnits: state.numUnits, voidAllowancePct: state.voidAllowancePct }),
    [state.units, state.rooms, state.numUnits, state.voidAllowancePct],
  )
  const m = useMemo(() => calcAncillary(state.ancillaryLines, occUnits), [state.ancillaryLines, occUnits])
  const ai = useIncomeAi("Ancillary income")

  const avgUnitPrice = state.ancillaryLines.length
    ? round(state.ancillaryLines.reduce((s, l) => s + l.unitPriceIncVat, 0) / state.ancillaryLines.length, 2)
    : 0

  function addLine() {
    const next: AncillaryLine = {
      id: Date.now().toString(),
      name: "New Service",
      pricingModel: "Per month",
      unitPriceIncVat: 25,
      frequency: "Monthly",
      adoptionRate: 50,
      vatStatus: "VATable (20%)",
      linkedUnitType: "All Units",
      notes: "",
    }
    update({ ancillaryLines: [...state.ancillaryLines, next] })
  }
  const updateLine = (id: string, c: Partial<AncillaryLine>) =>
    update({ ancillaryLines: state.ancillaryLines.map((l) => (l.id === id ? { ...l, ...c } : l)) })
  const removeLine = (id: string) => update({ ancillaryLines: state.ancillaryLines.filter((l) => l.id !== id) })

  const mix = state.ancillaryLines
    .map((l, i) => ({ name: l.name, raw: lineMonthly(l, occUnits), colour: MIX_COLOURS[i % MIX_COLOURS.length] }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 6)
  const mixTotal = mix.reduce((s, d) => s + d.raw, 0) || 1

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Ancillary Monthly (Gross)", value: gbp(m.grossMonthly), sub: "pcm", info: true },
          { label: "Ancillary Annual (Gross)", value: gbp(m.grossAnnual), sub: "pa", info: true },
          { label: "Avg. Ancillary / Occ Unit", value: m.avgPerOccUnit ? gbp(m.avgPerOccUnit) : "—", sub: "pcm", info: true },
          { label: "Take-up Rate (Weighted)", value: `${m.weightedTakeUp}%`, tone: GREEN, info: true },
          { label: "Avg. Contribution Margin", value: `${m.contributionMarginPct}%`, tone: PURPLE, info: true },
          { label: "Projected Growth (YoY)", value: "+6.8%", tone: AMBER, info: true },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Ancillary income & services"
          subtitle="Add additional services and products to unlock more revenue and enhance resident experience."
          addLabel="Add Income Line"
          onAdd={addLine}
        />

        <TableShell
          minWidth={1140}
          addLabel="Add Income Line"
          onAdd={addLine}
          headers={[
            "Income Line",
            "Pricing Model",
            "Unit Price (inc VAT)",
            "Frequency",
            "Adoption Rate",
            "VAT Status",
            "Linked Property / Unit Type",
            "Revenue Notes",
            "Projected Monthly (Gross)",
          ]}
        >
          {state.ancillaryLines.map((l) => (
            <Row key={l.id}>
              <TextCell value={l.name} onChange={(v) => updateLine(l.id, { name: v })} placeholder="Cleaning Upgrades" width="w-36" />
              <SelectCell value={l.pricingModel} onChange={(v) => updateLine(l.id, { pricingModel: v })} options={PRICING_MODELS} width="min-w-[120px]" />
              <NumberCell value={l.unitPriceIncVat} onChange={(v) => updateLine(l.id, { unitPriceIncVat: v })} prefix="£" width="w-20" />
              <SelectCell value={l.frequency} onChange={(v) => updateLine(l.id, { frequency: v })} options={FREQUENCIES} width="min-w-[120px]" />
              <NumberCell value={l.adoptionRate} onChange={(v) => updateLine(l.id, { adoptionRate: v })} suffix="%" width="w-14" max={100} />
              <SelectCell value={l.vatStatus} onChange={(v) => updateLine(l.id, { vatStatus: v })} options={VAT_STATUS} width="min-w-[120px]" />
              <SelectCell value={l.linkedUnitType} onChange={(v) => updateLine(l.id, { linkedUnitType: v })} options={LINKED} width="min-w-[130px]" />
              <TextCell value={l.notes} onChange={(v) => updateLine(l.id, { notes: v })} placeholder="Notes" width="w-32" />
              <MoneyCell value={lineMonthly(l, occUnits)} />
              <DeleteCell onDelete={() => removeLine(l.id)} />
            </Row>
          ))}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "🏠", label: "Total Ancillary Streams", value: String(m.streamCount) },
            { icon: "🏷️", label: "Avg. Ancillary / Occ Unit", value: m.avgPerOccUnit ? `${gbp(m.avgPerOccUnit)} pcm` : "—" },
            { icon: "📈", label: "Weighted Take-up Rate", value: `${m.weightedTakeUp}%` },
          ]}
          totalLabel="Total Ancillary Monthly Income (Gross)"
          totalValue={gbp(m.grossMonthly)}
        />
      </div>

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Gross Income" value={gbp(m.grossMonthly)} sub="Ancillary Income" data={monthlyCurve(m.grossMonthly, 6)} />
        <DonutCard
          title="Ancillary Revenue Mix"
          data={mix.map((d) => ({ name: d.name, value: round((d.raw / mixTotal) * 100), colour: d.colour, display: `${round((d.raw / mixTotal) * 100)}%` }))}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Avg. Unit Price (Inc. VAT)", value: avgUnitPrice ? `£${avgUnitPrice.toFixed(2)}` : "—" },
            { label: "Avg. Contribution Margin", value: `${m.contributionMarginPct}%` },
            { label: "Avg. Revenue / Occ Unit", value: m.avgPerOccUnit ? `${gbp(m.avgPerOccUnit)} pcm` : "—" },
            { label: "Take-up Rate (Weighted)", value: `${m.weightedTakeUp}%` },
            { label: "Price Optimisation Potential", value: "+6.8%", tone: GREEN },
          ]}
        />
        <TrendCard
          title="Take-up Trend"
          badge={{ label: "Improving (+5%)", tone: "green" }}
          data={monthlyCurve(m.weightedTakeUp || 60, 4)}
          formatter={(v) => `${round(v)}%`}
          footer={
            <div className="grid grid-cols-3 text-center">
              <div>
                <p className="text-[10px] text-slate-400">Current</p>
                <p className="text-[12px] font-bold text-slate-800">{m.weightedTakeUp}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">3-Mo Avg</p>
                <p className="text-[12px] font-bold text-slate-800">{Math.max(0, m.weightedTakeUp - 2)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">6-Mo Avg</p>
                <p className="text-[12px] font-bold text-slate-800">{Math.max(0, m.weightedTakeUp - 5)}%</p>
              </div>
            </div>
          }
        />
      </ChartGrid>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.ancillaryLines.length) return []
            const under = [...state.ancillaryLines].filter((l) => l.adoptionRate < 50).sort((a, b) => a.adoptionRate - b.adoptionRate)
            const out = []
            if (under[0]) {
              out.push({
                recommendationType: "adoption",
                title: "Boost low-adoption service",
                body: `${under[0].name} sits at ${under[0].adoptionRate}% take-up. Marketing to residents could double adoption.`,
                estimatedImpactMonthly: lineMonthly(under[0], occUnits),
              })
            }
            out.push({
              recommendationType: "monetisation",
              title: "Monetisation opportunity",
              body: `Optimising under-performing services could add an estimated ${gbp(round(m.grossMonthly * 0.12))} pcm.`,
              estimatedImpactMonthly: round(m.grossMonthly * 0.12),
            })
            return out
          })
        }
      />
    </div>
  )
}
