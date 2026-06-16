"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { ParkingLine } from "@/components/planning/wizard/WizardContext"
import { calcParking, rentCover, gbp, monthlyCurve, round } from "@/lib/planning/income-calculations"
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
  TrendFooter,
  IncomeAiPanel,
  GREEN,
  PURPLE,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"

const PARKING_TYPES = ["Indoor - Reserved", "Indoor - Unreserved", "Outdoor - Covered", "Outdoor - Open", "EV Charging Bays"]
const PERMIT_TYPES = ["Assigned", "Unassigned"]
const CHARGE_TYPES = ["Bundled", "Separate"]
const SEASONALITY = ["Low", "Medium", "High"]
const DIST_COLOURS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444"]

function rowMonthly(l: ParkingLine): number {
  return round(l.spacesAvailable * l.monthlyFee * (l.currentUtilPct / 100))
}

export default function ParkingIncomeTab() {
  const { state, update } = useWizard()
  const m = useMemo(() => calcParking(state.parkingLines), [state.parkingLines])
  const ai = useIncomeAi("Parking")
  const rc = rentCover(m.projectedMonthly, state.propertyValue, state.forecastLtvPct, state.forecastInterestRatePct)

  function addRule() {
    const next: ParkingLine = {
      id: Date.now().toString(),
      parkingType: "Outdoor - Open",
      spacesAvailable: 20,
      reservedSpaces: 0,
      rentableSpaces: 20,
      monthlyFee: 90,
      nightlyFee: 0,
      currentUtilPct: 80,
      targetUtilPct: 90,
      permitType: "Unassigned",
      chargeType: "Separate",
      seasonality: "Low",
      notes: "",
    }
    update({ parkingLines: [...state.parkingLines, next] })
  }
  const updateRule = (id: string, c: Partial<ParkingLine>) =>
    update({ parkingLines: state.parkingLines.map((l) => (l.id === id ? { ...l, ...c } : l)) })
  const removeRule = (id: string) => update({ parkingLines: state.parkingLines.filter((l) => l.id !== id) })

  const reservedPct = m.totalSpaces ? round((m.reservedSpaces / m.totalSpaces) * 100) : 0
  const rentablePct = m.totalSpaces ? round((m.rentableSpaces / m.totalSpaces) * 100) : 0

  const dist = state.parkingLines.map((l, i) => ({
    name: `${l.parkingType} (${l.currentUtilPct}%)`,
    value: m.totalSpaces ? round((l.spacesAvailable / m.totalSpaces) * 100) : 0,
    colour: DIST_COLOURS[i % DIST_COLOURS.length],
    display: `${l.spacesAvailable} | ${m.totalSpaces ? round((l.spacesAvailable / m.totalSpaces) * 100) : 0}%`,
  }))

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Total Rentable Spaces", value: String(m.totalSpaces), sub: "spaces", info: true },
          { label: "Utilization Rate", value: `${m.utilisationPct}%`, sub: "monthly avg", tone: GREEN, info: true },
          { label: "Occupied Spaces", value: String(m.occupiedSpaces), sub: "spaces", info: true },
          { label: "Avg Monthly Fee", value: m.avgMonthlyFee ? `£${m.avgMonthlyFee.toFixed(2)}` : "—", sub: "per space", info: true },
          { label: "Potential Monthly Income", value: gbp(m.potentialMonthly), sub: "at 100%", tone: PURPLE, info: true },
          { label: "Projected Monthly Income", value: gbp(m.projectedMonthly), sub: "at current util.", tone: GREEN, info: true },
          { label: "Annual Projected Income", value: gbp(m.annualProjected), info: true },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Parking income assumptions"
          subtitle="Define parking inventory, pricing, utilization, and revenue rules."
          addLabel="Add Parking Rule"
          onAdd={addRule}
        />

        <TableShell
          minWidth={1240}
          addLabel="Add Parking Rule"
          onAdd={addRule}
          headers={[
            "Parking Type",
            "Spaces Available",
            "Reserved",
            "Rentable",
            "Monthly Fee",
            "Nightly Fee",
            "Current Util %",
            "Target Util %",
            "Permit Type",
            "Charge Type",
            "Seasonality",
            "Notes",
            "Projected Monthly Income",
          ]}
        >
          {state.parkingLines.map((l) => (
            <Row key={l.id}>
              <SelectCell value={l.parkingType} onChange={(v) => updateRule(l.id, { parkingType: v })} options={PARKING_TYPES} width="min-w-[140px]" />
              <NumberCell value={l.spacesAvailable} onChange={(v) => updateRule(l.id, { spacesAvailable: v })} width="w-16" />
              <NumberCell value={l.reservedSpaces} onChange={(v) => updateRule(l.id, { reservedSpaces: v })} width="w-14" />
              <NumberCell value={l.rentableSpaces} onChange={(v) => updateRule(l.id, { rentableSpaces: v })} width="w-14" />
              <NumberCell value={l.monthlyFee} onChange={(v) => updateRule(l.id, { monthlyFee: v })} prefix="£" width="w-20" />
              <NumberCell value={l.nightlyFee} onChange={(v) => updateRule(l.id, { nightlyFee: v })} prefix="£" width="w-16" />
              <NumberCell value={l.currentUtilPct} onChange={(v) => updateRule(l.id, { currentUtilPct: v })} suffix="%" width="w-14" max={100} />
              <NumberCell value={l.targetUtilPct} onChange={(v) => updateRule(l.id, { targetUtilPct: v })} suffix="%" width="w-14" max={100} />
              <SelectCell value={l.permitType} onChange={(v) => updateRule(l.id, { permitType: v })} options={PERMIT_TYPES} width="min-w-[110px]" />
              <SelectCell value={l.chargeType} onChange={(v) => updateRule(l.id, { chargeType: v })} options={CHARGE_TYPES} width="min-w-[100px]" />
              <SelectCell value={l.seasonality} onChange={(v) => updateRule(l.id, { seasonality: v })} options={SEASONALITY} width="min-w-[90px]" />
              <TextCell value={l.notes} onChange={(v) => updateRule(l.id, { notes: v })} placeholder="Notes" width="w-32" />
              <MoneyCell value={rowMonthly(l)} />
              <DeleteCell onDelete={() => removeRule(l.id)} />
            </Row>
          ))}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "🅿️", label: "Total Spaces", value: String(m.totalSpaces) },
            { icon: "🔒", label: "Reserved Spaces", value: `${m.reservedSpaces} (${reservedPct}%)` },
            { icon: "🚗", label: "Rentable Spaces", value: `${m.rentableSpaces} (${rentablePct}%)` },
            { icon: "💷", label: "Average Fee (Monthly)", value: m.avgMonthlyFee ? `£${m.avgMonthlyFee.toFixed(2)}` : "—" },
            { icon: "📊", label: "Utilization (Current)", value: `${m.utilisationPct}%` },
          ]}
          totalLabel="Total Monthly Parking Income (Gross)"
          totalValue={gbp(m.projectedMonthly)}
        />
      </div>

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Parking Income" value={gbp(m.projectedMonthly)} sub="Projected gross income" data={monthlyCurve(m.projectedMonthly, 7)} />
        <DonutCard title="Parking Utilization Distribution" data={dist.length ? dist : [{ name: "No data", value: 100, colour: "#E2E8F0", display: "—" }]} />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Average Monthly Fee", value: m.avgMonthlyFee ? `£${m.avgMonthlyFee.toFixed(2)}` : "—" },
            { label: "Average Fee per Sq Ft (Est.)", value: m.avgMonthlyFee ? `£${(m.avgMonthlyFee / 137).toFixed(2)}` : "—" },
            { label: "Potential Income @ 100% Util.", value: gbp(m.potentialMonthly) },
            { label: "Revenue per Space (Current)", value: m.revenuePerSpace ? `£${m.revenuePerSpace.toFixed(2)}` : "—" },
            { label: "Rent Cover (Parking Income)", value: rc != null ? `${rc.toFixed(2)}x` : "—" },
          ]}
        />
        <TrendCard
          title="Seasonality / Parking Demand"
          badge={{ label: "Low (+7%)", tone: "green" }}
          data={monthlyCurve(m.projectedMonthly, 7)}
          formatter={(v) => gbp(v)}
          footer={<TrendFooter leftLabel="Peak Impact" leftValue="+7% (Jun)" rightLabel="Low Impact" rightValue="-5% (Jan)" />}
        />
      </ChartGrid>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.parkingLines.length) return []
            const under = [...state.parkingLines].filter((l) => l.currentUtilPct < l.targetUtilPct).sort((a, b) => a.currentUtilPct - b.currentUtilPct)
            const out = []
            if (under[0]) {
              const gap = under[0].targetUtilPct - under[0].currentUtilPct
              out.push({
                recommendationType: "utilisation",
                title: "Underused inventory",
                body: `${under[0].parkingType} runs at ${under[0].currentUtilPct}% vs ${under[0].targetUtilPct}% target. Waitlist pricing closes the gap.`,
                estimatedImpactMonthly: round(under[0].spacesAvailable * under[0].monthlyFee * (gap / 100)),
              })
            }
            out.push({
              recommendationType: "pricing",
              title: "Dynamic pricing suggestion",
              body: "Increase outdoor open rates during peak demand (Apr–Sep) to boost annual income.",
              estimatedImpactMonthly: round(m.projectedMonthly * 0.1),
            })
            return out
          })
        }
      />
    </div>
  )
}
