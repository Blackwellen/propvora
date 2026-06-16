"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { CorporateLetLine } from "@/components/planning/wizard/WizardContext"
import {
  calcCorporate,
  calcIncomeTotals,
  deriveOccupiedUnits,
  parseRangeCount,
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
  AMBER,
} from "@/components/planning/wizard/income/IncomeShared"
import { useIncomeAi } from "@/components/planning/wizard/income/useIncomeAi"

const SECTORS = ["Technology", "Professional Services", "Healthcare", "Construction", "Finance", "Education", "Renewables", "Cybersecurity"]
const CONTRACT_TYPES = ["Monthly", "Project", "Academic Year"]
const CONTRACT_SUBTYPES = ["Rolling", "Fixed Term"]
const INVOICING = ["Monthly In Advance", "Monthly In Arrears", "Quarterly In Advance"]
const NOTICE = ["30 days", "60 days", "90 days"]
const MIX_COLOURS = ["#7C3AED", "#F59E0B", "#3B82F6", "#CBD5E1", "#10B981"]

function contractMonthly(c: CorporateLetLine): number {
  return round(parseRangeCount(c.unitAllocation) * c.agreedRatePcm * (c.occupancyCommitmentPct / 100))
}

export default function CorporateLetsTab() {
  const { state, update } = useWizard()
  const m = useMemo(() => calcCorporate(state.corporateLets), [state.corporateLets])
  const ai = useIncomeAi("Corporate lets")

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
  const revPerUnit = m.totalUnits ? round(m.grossMonthly / m.totalUnits) : 0

  function addContract() {
    const next: CorporateLetLine = {
      id: Date.now().toString(),
      client: "New Client Ltd",
      sector: "Technology",
      unitAllocation: "5 Studios",
      contractType: "Monthly",
      contractSubtype: "Rolling",
      expectedMonths: 12,
      agreedRatePcm: 1250,
      occupancyCommitmentPct: 100,
      invoicingFrequency: "Monthly In Advance",
      noticePeriod: "30 days",
      notes: "",
    }
    update({ corporateLets: [...state.corporateLets, next] })
  }
  const updateContract = (id: string, c: Partial<CorporateLetLine>) =>
    update({ corporateLets: state.corporateLets.map((l) => (l.id === id ? { ...l, ...c } : l)) })
  const removeContract = (id: string) => update({ corporateLets: state.corporateLets.filter((l) => l.id !== id) })

  const typeMix = CONTRACT_TYPES.map((t, i) => {
    const raw = state.corporateLets.filter((c) => c.contractType === t).reduce((s, c) => s + contractMonthly(c), 0)
    return { name: t, raw, colour: MIX_COLOURS[i % MIX_COLOURS.length] }
  }).filter((d) => d.raw > 0)
  const mixTotal = typeMix.reduce((s, d) => s + d.raw, 0) || 1

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Active Corporate Accounts", value: String(m.activeAccounts), info: true },
          { label: "Avg. Contract Value (Monthly)", value: m.avgContractValue ? gbp(m.avgContractValue) : "—", sub: "per account", info: true },
          { label: "Contracted Occupancy", value: `${m.contractedOccupancy}%`, sub: "of available units", tone: GREEN, info: true },
          { label: "Avg. Contract Length", value: `${m.avgContractLength}`, sub: "months", info: true },
          { label: "Total Monthly Corporate Income", value: gbp(m.grossMonthly), tone: BLUE, info: true },
          { label: "% of Total Gross Income", value: `${pctOfTotal}%`, sub: "from corporate lets", tone: AMBER, info: true },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Corporate lets & long-term partnerships"
          subtitle="Add and manage corporate accounts and long-term partnerships driving predictable revenue."
          addLabel="Add Corporate Contract"
          onAdd={addContract}
        />

        <TableShell
          minWidth={1280}
          addLabel="Add Corporate Contract"
          onAdd={addContract}
          headers={[
            "Client / Sector",
            "Unit Allocation",
            "Contract Type",
            "Expected Nights / Months",
            "Agreed Rate (PCM)",
            "Occupancy Commitment",
            "Invoicing Frequency",
            "Notice Period",
            "Account Manager Notes",
            "Projected Monthly Gross Income",
          ]}
        >
          {state.corporateLets.map((c) => (
            <Row key={c.id}>
              <td className="px-3 py-2">
                <div className="space-y-1">
                  <input
                    value={c.client}
                    onChange={(e) => updateContract(c.id, { client: e.target.value })}
                    className="w-36 h-7 px-2 rounded-lg border border-slate-200 text-[12.5px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                  <select
                    value={c.sector}
                    onChange={(e) => updateContract(c.id, { sector: e.target.value })}
                    className="w-36 h-6 px-1.5 rounded-md border border-slate-100 bg-slate-50 text-[10.5px] text-slate-500 focus:outline-none cursor-pointer"
                  >
                    {SECTORS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </td>
              <TextCell value={c.unitAllocation} onChange={(v) => updateContract(c.id, { unitAllocation: v })} placeholder="12 Studios" width="w-24" />
              <td className="px-3 py-2">
                <div className="space-y-1">
                  <select
                    value={c.contractType}
                    onChange={(e) => updateContract(c.id, { contractType: e.target.value })}
                    className="w-32 h-7 px-2 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={c.contractSubtype}
                    onChange={(e) => updateContract(c.id, { contractSubtype: e.target.value })}
                    className="w-32 h-6 px-1.5 rounded-md border border-slate-100 bg-slate-50 text-[10.5px] text-slate-500 focus:outline-none cursor-pointer"
                  >
                    {CONTRACT_SUBTYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </td>
              <NumberCell value={c.expectedMonths} onChange={(v) => updateContract(c.id, { expectedMonths: v })} suffix="months" width="w-14" />
              <NumberCell value={c.agreedRatePcm} onChange={(v) => updateContract(c.id, { agreedRatePcm: v })} prefix="£" />
              <NumberCell value={c.occupancyCommitmentPct} onChange={(v) => updateContract(c.id, { occupancyCommitmentPct: v })} suffix="%" width="w-14" max={100} />
              <SelectCell value={c.invoicingFrequency} onChange={(v) => updateContract(c.id, { invoicingFrequency: v })} options={INVOICING} width="min-w-[140px]" />
              <SelectCell value={c.noticePeriod} onChange={(v) => updateContract(c.id, { noticePeriod: v })} options={NOTICE} width="min-w-[90px]" />
              <TextCell value={c.notes} onChange={(v) => updateContract(c.id, { notes: v })} placeholder="Notes" width="w-40" />
              <MoneyCell value={contractMonthly(c)} />
              <DeleteCell onDelete={() => removeContract(c.id)} />
            </Row>
          ))}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "👥", label: "Total Contracts", value: String(m.activeAccounts) },
            { icon: "🏢", label: "Total Units Allocated", value: `${m.totalUnits} units` },
            { icon: "💷", label: "Weighted Avg. Rate (PCM)", value: m.weightedAvgRate ? gbp(m.weightedAvgRate) : "—" },
            { icon: "📈", label: "Contracted Occupancy", value: `${m.contractedOccupancy}%` },
          ]}
          totalLabel="Total Monthly Income (Gross)"
          totalValue={gbp(m.grossMonthly)}
        />
      </div>

      <ChartGrid>
        <MonthlyGrossCard title="Monthly Corporate Income" value={gbp(m.grossMonthly)} sub="Corporate Lets Income" data={monthlyCurve(m.grossMonthly, 4)} />
        <DonutCard
          title="Contract Type Distribution"
          data={typeMix.length ? typeMix.map((d) => ({ name: d.name, value: round((d.raw / mixTotal) * 100), colour: d.colour, display: `${round((d.raw / mixTotal) * 100)}%` })) : [{ name: "No data", value: 100, colour: "#E2E8F0", display: "—" }]}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Avg. Corporate Rate (PCM)", value: m.weightedAvgRate ? gbp(m.weightedAvgRate) : "—" },
            { label: "Avg. Rate per Unit (PCM)", value: m.totalUnits ? gbp(round(m.grossMonthly / m.totalUnits / (m.contractedOccupancy / 100 || 1))) : "—" },
            { label: "Contracted Occupancy", value: `${m.contractedOccupancy}%` },
            { label: "Revenue per Unit (PCM)", value: revPerUnit ? gbp(revPerUnit) : "—" },
            { label: "Rate Premium vs Market", value: "+12%", tone: GREEN },
          ]}
        />
        <TrendCard
          title="Contract Seasonality / Demand Trend"
          badge={{ label: "Stable (+4%)", tone: "green" }}
          data={monthlyCurve(m.grossMonthly, 4)}
          formatter={(v) => gbp(v)}
          footer={<TrendFooter leftLabel="Peak Demand" leftValue="Sep – Nov" rightLabel="Low Demand" rightValue="Feb – Mar" />}
        />
      </ChartGrid>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.corporateLets.length) return []
            return [
              {
                recommendationType: "pricing",
                title: "B2B pricing suggestion",
                body: `Corporate rates can carry a 10–12% premium vs local market. Targeted uplift on Tech & Finance sectors lifts revenue.`,
                estimatedImpactMonthly: round(m.grossMonthly * 0.1),
              },
              {
                recommendationType: "occupancy",
                title: "Occupancy smoothing tip",
                body: "Fill Jan–Mar dip by securing 2–3 short-term project contracts in Construction & Consulting.",
                estimatedImpactMonthly: round(m.avgContractValue * 0.5),
              },
            ]
          })
        }
      />
    </div>
  )
}
