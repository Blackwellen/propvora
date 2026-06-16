"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { OtherIncomeLine } from "@/components/planning/wizard/WizardContext"
import {
  calcOther,
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
  IncomeAiPanel,
  GREEN,
  PURPLE,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"

const CATEGORIES = ["Retail", "Media", "Utilities", "Real Estate", "Facilities", "Transport", "Logistics", "Services"]
const PRICING_BASIS = ["Revenue Share (20%)", "Flat Fee", "Rebate per Unit", "Per Booking", "Per Unit / Month", "Cost-Plus (10%)", "Percentage (3%)"]
const FREQUENCIES = ["Monthly", "Quarterly", "Annual", "One-time"]
const LINKED = ["All Units", "Common Areas", "Building Lobby", "Building Roof", "Amenity Spaces", "Bike Storage Area"]
const MIX_COLOURS = ["#7C3AED", "#F59E0B", "#3B82F6", "#10B981", "#06B6D4", "#EF4444", "#CBD5E1"]
const IDEAS = [
  { name: "EV Charging Stations", range: "£650 – £1,200 pcm" },
  { name: "Premium Storage Lockers", range: "£250 – £450 pcm" },
  { name: "Wellness Studio Rentals", range: "£300 – £700 pcm" },
  { name: "Laundry App Commissions", range: "£150 – £300 pcm" },
  { name: "Data / Wi-Fi Sponsorship", range: "£200 – £500 pcm" },
]

function rowMonthly(o: OtherIncomeLine): number {
  const f = o.frequency === "Annual" ? 1 / 12 : o.frequency === "Quarterly" ? 1 / 3 : o.frequency === "One-time" ? 1 / 12 : 1
  return round(o.amount * f)
}

export default function OtherIncomeLinesTab() {
  const { state, update } = useWizard()
  const m = useMemo(() => calcOther(state.otherIncomeLines), [state.otherIncomeLines])
  const ai = useIncomeAi("Other income lines")

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
  const recurringLines = state.otherIncomeLines.filter((o) => o.frequency !== "One-time").length
  const oneOffLines = state.otherIncomeLines.length - recurringLines
  const recurringPct = m.grossMonthly ? round((m.recurringMonthly / m.grossMonthly) * 100, 1) : 0
  const avgPerSource = m.lineCount ? round(m.grossMonthly / m.lineCount) : 0
  const yieldPerUnit = occUnits ? round(m.grossMonthly / occUnits, 2) : 0
  const sumAmount = state.otherIncomeLines.reduce((s, o) => s + o.amount, 0)

  function addLine() {
    const next: OtherIncomeLine = {
      id: Date.now().toString(),
      source: "New Income Source",
      category: "Services",
      pricingBasis: "Flat Fee",
      amount: 500,
      frequency: "Monthly",
      adoptionPct: 90,
      vatRate: 20,
      linkedUnitType: "All Units",
      notes: "",
    }
    update({ otherIncomeLines: [...state.otherIncomeLines, next] })
  }
  const updateLine = (id: string, c: Partial<OtherIncomeLine>) =>
    update({ otherIncomeLines: state.otherIncomeLines.map((l) => (l.id === id ? { ...l, ...c } : l)) })
  const removeLine = (id: string) => update({ otherIncomeLines: state.otherIncomeLines.filter((l) => l.id !== id) })

  const mix = state.otherIncomeLines
    .map((o, i) => ({ name: o.source, raw: rowMonthly(o), colour: MIX_COLOURS[i % MIX_COLOURS.length] }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 6)
  const mixTotal = mix.reduce((s, d) => s + d.raw, 0) || 1
  const weightedAdoption = m.lineCount ? round(state.otherIncomeLines.reduce((s, o) => s + o.adoptionPct, 0) / m.lineCount) : 0

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Total Income Lines", value: String(m.lineCount), sub: "lines", info: true },
          { label: "Recurring Monthly Value", value: gbp(m.recurringMonthly), sub: "pcm", info: true },
          { label: "Utilisation Rate (Weighted)", value: `${m.weightedUtilisation}%`, tone: GREEN, info: true },
          { label: "One-off / Variable (Monthly Avg.)", value: gbp(m.oneOffMonthly), sub: "pcm", info: true },
          { label: "VAT Reclaimable", value: gbp(m.vatReclaimable), sub: "pcm", info: true },
          { label: "Total Monthly Other Income", value: gbp(m.grossMonthly), sub: "pcm", tone: PURPLE, info: true },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Other income lines"
          subtitle="Add and manage all additional income sources beyond rent and core services."
          addLabel="Add Income Line"
          onAdd={addLine}
        />

        <TableShell
          minWidth={1240}
          addLabel="Add Income Line"
          onAdd={addLine}
          headers={[
            "Income Source",
            "Category",
            "Pricing Basis",
            "Amount",
            "Frequency",
            "Adoption / Utilisation",
            "VAT",
            "Linked Property / Unit Type",
            "Notes",
            "Projected Monthly Gross",
          ]}
        >
          {state.otherIncomeLines.map((o) => (
            <Row key={o.id}>
              <TextCell value={o.source} onChange={(v) => updateLine(o.id, { source: v })} placeholder="Vending Machines" width="w-36" />
              <SelectCell value={o.category} onChange={(v) => updateLine(o.id, { category: v })} options={CATEGORIES} width="min-w-[110px]" />
              <SelectCell value={o.pricingBasis} onChange={(v) => updateLine(o.id, { pricingBasis: v })} options={PRICING_BASIS} width="min-w-[130px]" />
              <NumberCell value={o.amount} onChange={(v) => updateLine(o.id, { amount: v })} prefix="£" width="w-20" />
              <SelectCell value={o.frequency} onChange={(v) => updateLine(o.id, { frequency: v })} options={FREQUENCIES} width="min-w-[110px]" />
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={o.adoptionPct}
                    onChange={(e) => updateLine(o.id, { adoptionPct: Number(e.target.value) })}
                    className="w-12 h-8 px-1.5 text-center rounded-lg border border-slate-200 text-[12px] text-slate-700 focus:outline-none"
                  />
                  <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, o.adoptionPct)}%` }} />
                  </div>
                </div>
              </td>
              <NumberCell value={o.vatRate} onChange={(v) => updateLine(o.id, { vatRate: v })} suffix="%" width="w-12" max={100} />
              <SelectCell value={o.linkedUnitType} onChange={(v) => updateLine(o.id, { linkedUnitType: v })} options={LINKED} width="min-w-[120px]" />
              <TextCell value={o.notes} onChange={(v) => updateLine(o.id, { notes: v })} placeholder="Notes" width="w-32" />
              <MoneyCell value={rowMonthly(o)} />
              <DeleteCell onDelete={() => removeLine(o.id)} />
            </Row>
          ))}
          {state.otherIncomeLines.length > 0 && (
            <tr className="bg-slate-50 border-t border-slate-200 font-semibold">
              <td className="px-4 py-3" />
              <td className="px-3 py-3 text-[12px] font-bold text-slate-700">TOTAL</td>
              <td className="px-3 py-3 text-slate-300">—</td>
              <td className="px-3 py-3 text-slate-300">—</td>
              <td className="px-3 py-3 text-[12.5px] font-bold text-slate-800">{gbp(sumAmount)}</td>
              <td className="px-3 py-3 text-slate-300">—</td>
              <td className="px-3 py-3 text-[12px] font-bold text-slate-700">{weightedAdoption}% <span className="text-[10px] font-normal text-slate-400">(Weighted)</span></td>
              <td className="px-3 py-3 text-slate-300">—</td>
              <td className="px-3 py-3 text-slate-300">—</td>
              <td className="px-3 py-3 text-slate-300">—</td>
              <td className="px-3 py-3 text-[13px] font-bold text-slate-900">{gbp(m.grossMonthly)}</td>
              <td className="px-3 py-3" />
            </tr>
          )}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "🔁", label: "Recurring income lines", value: String(recurringLines) },
            { icon: "🎲", label: "One-off / variable lines", value: String(oneOffLines) },
            { icon: "💷", label: "Avg. income per unit", value: yieldPerUnit ? `£${yieldPerUnit.toFixed(2)}` : "—" },
            { icon: "🔼", label: "Highest contributor", value: m.highest.name !== "—" ? `${m.highest.name} (${m.highest.pct}%)` : "—" },
            { icon: "🔽", label: "Lowest contributor", value: m.lowest.name !== "—" ? `${m.lowest.name} (${m.lowest.pct}%)` : "—" },
          ]}
          totalLabel="Total Monthly Other Income (Gross)"
          totalValue={gbp(m.grossMonthly)}
        />
      </div>

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Gross Income" value={gbp(m.grossMonthly)} sub="Other income (Gross)" data={monthlyCurve(m.grossMonthly, 8)} />
        <DonutCard
          title="Income Source Distribution"
          data={mix.length ? mix.map((d) => ({ name: d.name, value: round((d.raw / mixTotal) * 100), colour: d.colour, display: `${round((d.raw / mixTotal) * 100)}%` })) : [{ name: "No data", value: 100, colour: "#E2E8F0", display: "—" }]}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Other Income Yield (pcm)", value: yieldPerUnit ? `£${yieldPerUnit.toFixed(2)} /unit` : "—" },
            { label: "% of Total Gross Income", value: `${pctOfTotal}%` },
            { label: "Avg. Revenue per Source", value: avgPerSource ? gbp(avgPerSource) : "—" },
            { label: "Recurring Income %", value: `${recurringPct}%` },
            { label: "VAT Reclaimable (pcm)", value: gbp(m.vatReclaimable) },
          ]}
        />
        <TrendCard title="Income Trend" badge={{ label: "Up (+8.3%)", tone: "green" }} data={monthlyCurve(m.grossMonthly || 100, 8)} formatter={(v) => gbp(v)} />
      </ChartGrid>

      {/* Monetisation idea chips */}
      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12.5px] font-semibold text-slate-700">Monetisation opportunities detected</p>
          <button className="text-[11.5px] font-semibold text-[#7C3AED] hover:text-violet-700">View All Ideas</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {IDEAS.map((idea) => (
            <button
              key={idea.name}
              onClick={addLine}
              className="text-left rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 p-3 transition-colors"
            >
              <p className="text-[12px] font-semibold text-slate-800 leading-tight">{idea.name}</p>
              <p className="text-[11px] text-slate-400 mt-1">{idea.range}</p>
            </button>
          ))}
        </div>
      </div>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.otherIncomeLines.length) return []
            return [
              {
                recommendationType: "monetisation",
                title: "Additional monetisation idea",
                body: `Your highest contributor is ${m.highest.name} (${m.highest.pct}%). Adding EV charging or premium lockers diversifies income.`,
                estimatedImpactMonthly: round(m.grossMonthly * 0.12),
              },
              {
                recommendationType: "mix",
                title: "Recurring mix improvement",
                body: `Recurring income is ${recurringPct}% of the total — converting one-off lines to subscriptions improves predictability.`,
                estimatedImpactMonthly: m.oneOffMonthly,
              },
            ]
          })
        }
      />
    </div>
  )
}
