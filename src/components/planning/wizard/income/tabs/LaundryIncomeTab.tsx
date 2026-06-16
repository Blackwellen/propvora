"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { LaundryLine } from "@/components/planning/wizard/WizardContext"
import { calcLaundry, deriveOccupiedUnits, gbp, monthlyCurve, round } from "@/lib/planning/income-calculations"
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
  BLUE,
  PURPLE,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"

const SERVICE_TYPES = [
  "Washer (Standard)",
  "Dryer (Standard)",
  "Wash & Dry Package",
  "Laundry Card Top-up Sale",
  "Detergent & Supplies",
  "Ironing & Folding Service",
]
const FREE_PAID = ["Paid only", "Free + Paid", "Included"]
const MIX_COLOURS = ["#7C3AED", "#3B82F6", "#F59E0B", "#10B981", "#06B6D4", "#CBD5E1"]

function laundryPrice(l: LaundryLine): number {
  return l.washPrice || l.dryPrice || l.packagePrice || 0
}
function rowMonthly(l: LaundryLine, occUnits: number): number {
  return round(laundryPrice(l) * l.usageFreq * (l.adoptionRate / 100) * occUnits)
}

export default function LaundryIncomeTab() {
  const { state, update } = useWizard()
  const occUnits = useMemo(
    () => deriveOccupiedUnits({ units: state.units, rooms: state.rooms, numUnits: state.numUnits, voidAllowancePct: state.voidAllowancePct }),
    [state.units, state.rooms, state.numUnits, state.voidAllowancePct],
  )
  const m = useMemo(() => calcLaundry(state.laundryLines, occUnits), [state.laundryLines, occUnits])
  const ai = useIncomeAi("Laundry")

  const machineCount = state.laundryLines.reduce((s, l) => s + (parseInt(l.machineModel, 10) || 0), 0)
  const avgWash = avgPrice((l) => l.washPrice)
  const avgDry = avgPrice((l) => l.dryPrice)
  const avgPackage = avgPrice((l) => l.packagePrice)

  function avgPrice(sel: (l: LaundryLine) => number): number {
    const vals = state.laundryLines.map(sel).filter((v) => v > 0)
    return vals.length ? round(vals.reduce((a, b) => a + b, 0) / vals.length, 2) : 0
  }

  function addStream() {
    const next: LaundryLine = {
      id: Date.now().toString(),
      serviceType: "Washer (Standard)",
      machineModel: "12 machines",
      washPrice: 3.5,
      dryPrice: 0,
      packagePrice: 0,
      usageFreq: 3,
      adoptionRate: 70,
      costRecoveryPct: 90,
      freePaid: "Paid only",
      notes: "",
    }
    update({ laundryLines: [...state.laundryLines, next] })
  }
  const updateStream = (id: string, c: Partial<LaundryLine>) =>
    update({ laundryLines: state.laundryLines.map((l) => (l.id === id ? { ...l, ...c } : l)) })
  const removeStream = (id: string) => update({ laundryLines: state.laundryLines.filter((l) => l.id !== id) })

  const mix = state.laundryLines
    .map((l, i) => ({ name: l.serviceType, raw: rowMonthly(l, occUnits), colour: MIX_COLOURS[i % MIX_COLOURS.length] }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 6)
  const mixTotal = mix.reduce((s, d) => s + d.raw, 0) || 1

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Total Machines / Services", value: machineCount ? String(machineCount) : String(m.streamCount), sub: "units", info: true },
          { label: "Usage Rate (Monthly)", value: `${m.avgUsageRate * 10 > 100 ? 100 : round(m.avgUsageRate * 20)}%`, sub: "of capacity", tone: GREEN, info: true },
          { label: "Adoption Rate", value: `${m.avgAdoption}%`, sub: "of occupied units", tone: PURPLE, info: true },
          { label: "Avg Spend per Occ. Unit", value: m.avgSpendPerOccUnit ? `£${m.avgSpendPerOccUnit.toFixed(2)}` : "—", sub: "per month", tone: BLUE, info: true },
          { label: "Cost Recovery", value: `${m.costRecoveryPct}%`, sub: "of direct costs", tone: GREEN, info: true },
          { label: "Total Monthly Laundry Income", value: gbp(m.grossMonthly), sub: "gross", tone: BLUE, info: true },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Laundry income assumptions"
          subtitle="Set up your laundry services, pricing, usage patterns, and allocation model."
          addLabel="Add Laundry Stream"
          onAdd={addStream}
        />

        <TableShell
          minWidth={1240}
          addLabel="Add Laundry Stream"
          onAdd={addStream}
          headers={[
            "Service Type",
            "Machine Count / Model",
            "Wash",
            "Dry",
            "Package",
            "Usage Frequency (per unit/month)",
            "Adoption Rate (of occ. units)",
            "Cost Recovery (%)",
            "Free vs Paid Allocation",
            "Notes",
            "Projected Monthly Gross Income",
          ]}
        >
          {state.laundryLines.map((l) => (
            <Row key={l.id}>
              <SelectCell value={l.serviceType} onChange={(v) => updateStream(l.id, { serviceType: v })} options={SERVICE_TYPES} width="min-w-[150px]" />
              <TextCell value={l.machineModel} onChange={(v) => updateStream(l.id, { machineModel: v })} placeholder="24 machines" width="w-28" />
              <NumberCell value={l.washPrice} onChange={(v) => updateStream(l.id, { washPrice: v })} prefix="£" width="w-16" step={0.1} />
              <NumberCell value={l.dryPrice} onChange={(v) => updateStream(l.id, { dryPrice: v })} prefix="£" width="w-16" step={0.1} />
              <NumberCell value={l.packagePrice} onChange={(v) => updateStream(l.id, { packagePrice: v })} prefix="£" width="w-16" step={0.1} />
              <NumberCell value={l.usageFreq} onChange={(v) => updateStream(l.id, { usageFreq: v })} width="w-14" step={0.1} />
              <NumberCell value={l.adoptionRate} onChange={(v) => updateStream(l.id, { adoptionRate: v })} suffix="%" width="w-14" max={100} />
              <NumberCell value={l.costRecoveryPct} onChange={(v) => updateStream(l.id, { costRecoveryPct: v })} suffix="%" width="w-14" max={100} />
              <SelectCell value={l.freePaid} onChange={(v) => updateStream(l.id, { freePaid: v })} options={FREE_PAID} width="min-w-[110px]" />
              <TextCell value={l.notes} onChange={(v) => updateStream(l.id, { notes: v })} placeholder="Notes" width="w-32" />
              <MoneyCell value={rowMonthly(l, occUnits)} />
              <DeleteCell onDelete={() => removeStream(l.id)} />
            </Row>
          ))}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "🧺", label: "Total Streams", value: String(m.streamCount) },
            { icon: "🌀", label: "Total Machines / Services", value: machineCount ? String(machineCount) : "—" },
            { icon: "📊", label: "Avg. Usage Rate", value: `${round(m.avgUsageRate * 20) > 100 ? 100 : round(m.avgUsageRate * 20)}%` },
            { icon: "💷", label: "Avg. Spend per Occ. Unit", value: m.avgSpendPerOccUnit ? `£${m.avgSpendPerOccUnit.toFixed(2)}` : "—" },
          ]}
          totalLabel="Total Monthly Laundry Income (Gross)"
          totalValue={gbp(m.grossMonthly)}
        />
      </div>

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Gross Income" value={gbp(m.grossMonthly)} sub="Laundry Income (Gross)" data={monthlyCurve(m.grossMonthly, 4)} />
        <DonutCard
          title="Revenue Distribution"
          data={mix.length ? mix.map((d) => ({ name: d.name, value: round((d.raw / mixTotal) * 100), colour: d.colour, display: `${round((d.raw / mixTotal) * 100)}%` })) : [{ name: "No data", value: 100, colour: "#E2E8F0", display: "—" }]}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Avg. Price - Wash", value: avgWash ? `£${avgWash.toFixed(2)}` : "—" },
            { label: "Avg. Price - Dry", value: avgDry ? `£${avgDry.toFixed(2)}` : "—" },
            { label: "Avg. Package Price", value: avgPackage ? `£${avgPackage.toFixed(2)}` : "—" },
            { label: "Avg. Adoption Rate", value: `${m.avgAdoption}%` },
            { label: "Cost Recovery (Weighted)", value: `${m.costRecoveryPct}%` },
          ]}
        />
        <TrendCard
          title="Laundry Usage Trend"
          badge={{ label: "+4% vs last month", tone: "green" }}
          data={monthlyCurve(m.grossMonthly || 100, 6)}
          formatter={(v) => gbp(v)}
        />
      </ChartGrid>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.laundryLines.length) return []
            const lowAdopt = [...state.laundryLines].sort((a, b) => a.adoptionRate - b.adoptionRate)[0]
            const out = []
            if (lowAdopt) {
              out.push({
                recommendationType: "monetisation",
                title: "Monetisation suggestion",
                body: `${lowAdopt.serviceType} has ${lowAdopt.adoptionRate}% adoption — bundling or marketing could lift margin.`,
                estimatedImpactMonthly: round(rowMonthly(lowAdopt, occUnits) * 0.3),
              })
            }
            out.push({
              recommendationType: "revenue",
              title: "Revenue opportunity",
              body: "Introduce a subscription laundry pass (~£35/month) to smooth demand and raise recurring income.",
              estimatedImpactMonthly: round(occUnits * 0.4 * 35 * 0.15),
            })
            return out
          })
        }
      />
    </div>
  )
}
