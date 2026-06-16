"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { UnitLine } from "@/components/planning/wizard/WizardContext"
import {
  calcUnits,
  gbp,
  grossYield,
  rentCover,
  monthlyCurve,
  parseRangeCount,
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
  GREEN,
  BLUE,
  PURPLE,
  AMBER,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"

const UNIT_TYPES = ["Studio", "1 Bed", "2 Bed", "2 Bed (Premium)", "3 Bed", "4 Bed"]
const TENANCY_TYPES = ["AST (12m)", "AST (6m)", "Company Let", "Rolling Monthly", "Fixed Term"]
const FURNISHED = ["Furnished", "Part-furnished", "Unfurnished"]

export default function RentPerUnitTab() {
  const { state, update } = useWizard()
  const m = useMemo(() => calcUnits(state.units, state.voidAllowancePct), [state.units, state.voidAllowancePct])
  const ai = useIncomeAi("Rent per unit")

  const gy = grossYield(m.grossAnnual, state.propertyValue)
  const rc = rentCover(m.grossMonthly, state.propertyValue, state.forecastLtvPct, state.forecastInterestRatePct)

  function addUnit() {
    const next: UnitLine = {
      id: Date.now().toString(),
      unitType: "1 Bed",
      unitNumber: "",
      tenancyType: "AST (12m)",
      unitSizeSqFt: 450,
      avgRentPcm: 1050,
      voidPct: 5,
      furnished: "Furnished",
      notes: "",
    }
    update({ units: [...state.units, next] })
  }
  const updateUnit = (id: string, c: Partial<UnitLine>) =>
    update({ units: state.units.map((u) => (u.id === id ? { ...u, ...c } : u)) })
  const removeUnit = (id: string) => update({ units: state.units.filter((u) => u.id !== id) })

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Gross Monthly", value: gbp(m.grossMonthly), sub: "pcm", info: true },
          { label: "Gross Annual", value: gbp(m.grossAnnual), sub: "pa", info: true },
          { label: "Avg. Occupancy", value: `${m.letPct}%`, tone: GREEN, info: true },
          { label: "Gross Yield", value: gy != null ? `${gy.toFixed(1)}%` : "—", tone: BLUE, info: true },
          { label: "Avg. Unit Rate (PCM)", value: m.avgUnitRate ? gbp(m.avgUnitRate) : "—", tone: PURPLE, info: true },
          { label: "Net Yield", value: gy != null ? `${(gy * (1 - OPEX_RATIO)).toFixed(1)}%` : "—", tone: AMBER, info: true },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Rent per unit assumptions"
          subtitle="Set up your units, tenancy types, pricing, voids, and other key assumptions."
          addLabel="Add Unit"
          onAdd={addUnit}
        />

        <TableShell
          minWidth={1100}
          addLabel="Add Unit"
          onAdd={addUnit}
          headers={[
            "Unit Type",
            "Unit Number",
            "Tenancy Type",
            "Unit Size (sq ft)",
            "Avg. Rent (PCM)",
            "Void % (Annual)",
            "Furnished",
            "Revenue Notes",
            "Monthly Income (Gross)",
          ]}
        >
          {state.units.map((u) => (
            <Row key={u.id}>
              <SelectCell value={u.unitType} onChange={(v) => updateUnit(u.id, { unitType: v })} options={UNIT_TYPES} width="min-w-[120px]" />
              <TextCell value={u.unitNumber} onChange={(v) => updateUnit(u.id, { unitNumber: v })} placeholder="101–110" width="w-24" />
              <SelectCell value={u.tenancyType} onChange={(v) => updateUnit(u.id, { tenancyType: v })} options={TENANCY_TYPES} width="min-w-[120px]" />
              <NumberCell value={u.unitSizeSqFt} onChange={(v) => updateUnit(u.id, { unitSizeSqFt: v })} suffix="sq ft" width="w-16" />
              <NumberCell value={u.avgRentPcm} onChange={(v) => updateUnit(u.id, { avgRentPcm: v })} prefix="£" />
              <NumberCell value={u.voidPct} onChange={(v) => updateUnit(u.id, { voidPct: v })} suffix="%" width="w-14" max={100} />
              <SelectCell value={u.furnished} onChange={(v) => updateUnit(u.id, { furnished: v })} options={FURNISHED} width="min-w-[120px]" />
              <TextCell value={u.notes} onChange={(v) => updateUnit(u.id, { notes: v })} placeholder="Young professionals" width="w-32" />
              <MoneyCell value={Math.round(u.avgRentPcm * parseRangeCount(u.unitNumber))} />
              <DeleteCell onDelete={() => removeUnit(u.id)} />
            </Row>
          ))}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "🏠", label: "Total Units", value: String(m.unitCount) },
            { icon: "📐", label: "Avg. Unit Size", value: `${m.avgUnitSize} sq ft` },
            { icon: "💷", label: "Average Rent (pcm)", value: gbp(m.avgRent) },
            { icon: "📊", label: "Average Void", value: `${m.avgVoid}%` },
          ]}
          totalLabel="Total Monthly Income (Gross)"
          totalValue={gbp(m.grossMonthly)}
        />
      </div>

      <VoidAllowanceBar
        label="Void Allowance (%)"
        value={state.voidAllowancePct}
        onChange={(v) => update({ voidAllowancePct: v })}
        hint="Typical: 5% units · 10–20% SA/holiday · 5% LTL"
        rightLabel="Estimated Annual Void (units)"
        rightValue={gbp(m.estimatedAnnualVoid)}
      />

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Gross Income" value={gbp(m.grossMonthly)} sub="Monthly gross income" data={monthlyCurve(m.grossMonthly, 4)} />
        <DonutCard
          title="Occupancy Distribution"
          data={[
            { name: "Let (Occupied)", value: m.letPct, colour: PURPLE },
            { name: "Void (Expected)", value: m.voidPct, colour: "#FCD34D" },
            { name: "Turnover", value: m.turnoverPct, colour: "#CBD5E1" },
          ]}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Gross Yield", value: gy != null ? `${gy.toFixed(1)}%` : "—" },
            { label: "Net Yield (After Costs)", value: gy != null ? `${(gy * (1 - OPEX_RATIO)).toFixed(1)}%` : "—" },
            { label: "Average Unit Rate (pcm)", value: m.avgUnitRate ? gbp(m.avgUnitRate) : "—" },
            { label: "Rent Cover (Gross)", value: rc != null ? `${rc.toFixed(2)}x` : "—" },
            { label: "Rent PSF (pcm)", value: m.rentPsf ? `£${m.rentPsf.toFixed(2)}` : "—" },
          ]}
        />
        <TrendCard
          title="Seasonality Impact"
          badge={{ label: "Low (+2%)", tone: "green" }}
          data={monthlyCurve(m.grossMonthly, 2)}
          formatter={(v) => gbp(v)}
          footer={<TrendFooter leftLabel="Peak impact" leftValue="+2% (Jul)" rightLabel="Low impact" rightValue="-1% (Jan)" />}
        />
      </ChartGrid>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.units.length) return []
            const out = []
            const premium = [...state.units].sort((a, b) => b.avgRentPcm - a.avgRentPcm)[0]
            if (premium) {
              out.push({
                recommendationType: "pricing",
                title: "AI pricing suggestion",
                body: `Consider increasing ${premium.unitType} rent by ~3% based on local comparable data.`,
                estimatedImpactMonthly: Math.round(premium.avgRentPcm * parseRangeCount(premium.unitNumber) * 0.03),
              })
            }
            if (state.voidAllowancePct > 4) {
              out.push({
                recommendationType: "occupancy",
                title: "Occupancy insight",
                body: `Reducing voids by 1% could add ~${gbp(Math.round(m.grossAnnual * 0.01))} per year.`,
                estimatedImpactMonthly: Math.round(m.grossMonthly * 0.01),
              })
            }
            return out
          })
        }
      />
    </div>
  )
}
