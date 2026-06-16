"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { MembershipLine } from "@/components/planning/wizard/WizardContext"
import {
  calcMembership,
  calcIncomeTotals,
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
  TrendFooter,
  IncomeAiPanel,
  GREEN,
  BLUE,
  PURPLE,
  AMBER,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"

const BILLING_BASIS = ["Per Unit", "Per Tenant", "Per Property", "Flat"]
const BILLING_FREQ = ["Monthly", "Quarterly", "Annual"]
const VAT_STATUS = ["Standard (20%)", "Exempt", "Zero-rated"]
const MIX_COLOURS = ["#7C3AED", "#3B82F6", "#F59E0B", "#10B981", "#06B6D4", "#EF4444", "#CBD5E1"]

function chargeMonthly(m: MembershipLine): number {
  const f = m.billingFrequency === "Annual" ? 1 / 12 : m.billingFrequency === "Quarterly" ? 1 / 3 : 1
  return round(m.pricePerUnit * m.eligibleUnits * (m.takeUpRate / 100) * f)
}

export default function MembershipServiceChargesTab() {
  const { state, update } = useWizard()
  const m = useMemo(() => calcMembership(state.membershipLines), [state.membershipLines])
  const ai = useIncomeAi("Membership & service charges")

  const occUnits = deriveOccupiedUnits({ units: state.units, rooms: state.rooms, numUnits: state.numUnits, voidAllowancePct: state.voidAllowancePct })
  const totals = calcIncomeTotals({
    rooms: state.rooms,
    units: state.units,
    nightlyRates: state.nightlyRates,
    ancillaryLines: state.ancillaryLines,
    parkingLines: state.parkingLines,
    laundryLines: state.laundryLines,
    membershipLines: state.membershipLines,
    corporateLets: state.corporateLets,
    otherIncomeLines: state.otherIncomeLines,
    voidAllowancePct: state.voidAllowancePct,
    nightlyVoidPct: state.nightlyVoidPct,
    occupiedUnits: occUnits,
  })
  const pctOfTotal = totals.grossMonthly ? round((m.grossMonthly / totals.grossMonthly) * 100, 1) : 0
  const totalUnits = m.eligibleUnits || occUnits || 0

  function addCharge() {
    const next: MembershipLine = {
      id: Date.now().toString(),
      name: "New Charge",
      billingBasis: "Per Unit",
      pricePerUnit: 25,
      billingFrequency: "Monthly",
      includedServices: "",
      eligibleUnits: totalUnits || 100,
      vatStatus: "Standard (20%)",
      takeUpRate: 85,
      notes: "",
    }
    update({ membershipLines: [...state.membershipLines, next] })
  }
  const updateCharge = (id: string, c: Partial<MembershipLine>) =>
    update({ membershipLines: state.membershipLines.map((l) => (l.id === id ? { ...l, ...c } : l)) })
  const removeCharge = (id: string) => update({ membershipLines: state.membershipLines.filter((l) => l.id !== id) })

  const mix = state.membershipLines
    .map((l, i) => ({ name: l.name, raw: chargeMonthly(l), colour: MIX_COLOURS[i % MIX_COLOURS.length] }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 6)
  const mixTotal = mix.reduce((s, d) => s + d.raw, 0) || 1

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Active Charges", value: String(m.activeCharges), info: true },
          { label: "Avg. Charge / Unit / Mo", value: m.avgChargePerUnit ? gbp(m.avgChargePerUnit) : "—", info: true },
          { label: "Collection Rate (Weighted)", value: `${m.weightedCollection}%`, tone: GREEN, info: true },
          { label: "Avg. Take-up Rate", value: `${m.weightedCollection}%`, tone: PURPLE, info: true },
          { label: "Total Monthly Income (Gross)", value: gbp(m.grossMonthly), tone: BLUE, info: true },
          { label: "% of Total Income", value: `${pctOfTotal}%`, tone: AMBER, info: true },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Membership & service charge assumptions"
          subtitle="Define optional and mandatory services available to residents and estimate take-up to project income."
          addLabel="Add Charge"
          onAdd={addCharge}
        />

        <TableShell
          minWidth={1240}
          addLabel="Add Charge"
          onAdd={addCharge}
          headers={[
            "Charge / Service",
            "Billing Basis",
            "Price (Per Unit)",
            "Billing Frequency",
            "Included Services / Notes",
            "Eligible Units / Tenants",
            "VAT Status",
            "Take-up / Collection Rate",
            "Revenue Notes",
            "Projected Monthly Income (Gross)",
          ]}
        >
          {state.membershipLines.map((l) => (
            <Row key={l.id}>
              <TextCell value={l.name} onChange={(v) => updateCharge(l.id, { name: v })} placeholder="Co-working Access" width="w-36" />
              <SelectCell value={l.billingBasis} onChange={(v) => updateCharge(l.id, { billingBasis: v })} options={BILLING_BASIS} width="min-w-[100px]" />
              <NumberCell value={l.pricePerUnit} onChange={(v) => updateCharge(l.id, { pricePerUnit: v })} prefix="£" width="w-20" />
              <SelectCell value={l.billingFrequency} onChange={(v) => updateCharge(l.id, { billingFrequency: v })} options={BILLING_FREQ} width="min-w-[110px]" />
              <TextCell value={l.includedServices} onChange={(v) => updateCharge(l.id, { includedServices: v })} placeholder="Hot desks, Wi-Fi" width="w-40" />
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={l.eligibleUnits}
                    onChange={(e) => updateCharge(l.id, { eligibleUnits: Number(e.target.value) })}
                    className="w-16 h-8 px-2 text-center rounded-lg border border-slate-200 text-[12.5px] text-slate-700 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">of {totalUnits || "—"}</span>
                </div>
              </td>
              <SelectCell value={l.vatStatus} onChange={(v) => updateCharge(l.id, { vatStatus: v })} options={VAT_STATUS} width="min-w-[110px]" />
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={l.takeUpRate}
                    onChange={(e) => updateCharge(l.id, { takeUpRate: Number(e.target.value) })}
                    className="w-14 h-8 px-2 text-center rounded-lg border border-slate-200 text-[12.5px] font-semibold text-emerald-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400">%</span>
                </div>
              </td>
              <TextCell value={l.notes} onChange={(v) => updateCharge(l.id, { notes: v })} placeholder="Notes" width="w-28" />
              <MoneyCell value={chargeMonthly(l)} />
              <DeleteCell onDelete={() => removeCharge(l.id)} />
            </Row>
          ))}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "🎟️", label: "Active Charges", value: String(m.activeCharges) },
            { icon: "🏢", label: "Eligible Units (Total)", value: String(totalUnits || 0) },
            { icon: "💷", label: "Avg. Charge / Unit / Mo", value: m.avgChargePerUnit ? gbp(m.avgChargePerUnit) : "—" },
            { icon: "✅", label: "Collection Rate (Weighted)", value: `${m.weightedCollection}%` },
          ]}
          totalLabel="Total Monthly Income (Gross)"
          totalValue={gbp(m.grossMonthly)}
        />
      </div>

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Gross Income" value={gbp(m.grossMonthly)} sub="From membership & service charges" data={monthlyCurve(m.grossMonthly, 4)} />
        <DonutCard
          title="Charge Mix Distribution"
          data={mix.length ? mix.map((d) => ({ name: d.name, value: round((d.raw / mixTotal) * 100), colour: d.colour, display: `${round((d.raw / mixTotal) * 100)}%` })) : [{ name: "No data", value: 100, colour: "#E2E8F0", display: "—" }]}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Avg. Charge / Unit / Month", value: m.avgChargePerUnit ? gbp(m.avgChargePerUnit) : "—" },
            { label: "Effective Take-up Rate", value: `${m.weightedCollection}%` },
            { label: "Collection Rate (Weighted)", value: `${m.weightedCollection}%` },
            { label: "Income per Eligible Unit / Month", value: m.perEligibleUnit ? `£${m.perEligibleUnit.toFixed(2)}` : "—" },
            { label: "% of Total Monthly Income", value: `${pctOfTotal}%` },
          ]}
        />
        <TrendCard
          title="Trend (Monthly Income)"
          badge={{ label: "Low (+4%)", tone: "green" }}
          data={monthlyCurve(m.grossMonthly, 6)}
          formatter={(v) => gbp(v)}
          footer={
            <TrendFooter
              leftLabel="Peak Month"
              leftValue={`Aug (${gbp(round(m.grossMonthly * 1.06))})`}
              rightLabel="Low Month"
              rightValue={`Jan (${gbp(round(m.grossMonthly * 0.88))})`}
            />
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
            if (!state.membershipLines.length) return []
            const low = [...state.membershipLines].sort((a, b) => a.takeUpRate - b.takeUpRate)[0]
            const out = []
            if (low && low.takeUpRate < 90) {
              out.push({
                recommendationType: "packaging",
                title: "Packaging suggestion",
                body: `${low.name} take-up is ${low.takeUpRate}% — bundling it with a core service can lift adoption above 90%.`,
                estimatedImpactMonthly: round(chargeMonthly(low) * 0.15),
              })
            }
            out.push({
              recommendationType: "pricing",
              title: "Churn reduction tip",
              body: "Introduce quarterly billing with a 5% discount to improve retention and cash flow.",
              estimatedImpactMonthly: round(m.grossMonthly * 0.05),
            })
            return out
          })
        }
      />
    </div>
  )
}
