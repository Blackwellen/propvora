"use client"

import React, { useMemo } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { RoomLine } from "@/components/planning/wizard/WizardContext"
import {
  calcRooms,
  gbp,
  grossYield,
  rentCover,
  monthlyCurve,
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

const ROOM_TYPES = ["Standard Room", "Large Room", "En-suite Room", "Studio", "Double Room", "Single Room"]
const CONTRACT_TYPES = ["Assured Shorthold", "Licence", "Company Let", "Rolling Monthly", "Fixed Term"]
const SEASONALITY = ["All year", "Seasonal", "Term-time", "Peak summer"]

export default function RentPerRoomTab() {
  const { state, update } = useWizard()
  const m = useMemo(() => calcRooms(state.rooms, state.voidAllowancePct), [state.rooms, state.voidAllowancePct])
  const ai = useIncomeAi("Rent per room")

  const gy = grossYield(m.grossAnnual, state.propertyValue)
  const rc = rentCover(m.grossMonthly, state.propertyValue, state.forecastLtvPct, state.forecastInterestRatePct)

  function addRoom() {
    const next: RoomLine = {
      id: Date.now().toString(),
      name: `Room ${state.rooms.length + 1}`,
      type: "Standard Room",
      contractType: "Assured Shorthold",
      contractLengthMonths: 12,
      avgRentPcm: 650,
      voidPct: 5,
      seasonality: "All year",
      notes: "",
    }
    update({ rooms: [...state.rooms, next] })
  }
  const updateRoom = (id: string, c: Partial<RoomLine>) =>
    update({ rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...c } : r)) })
  const removeRoom = (id: string) => update({ rooms: state.rooms.filter((r) => r.id !== id) })

  return (
    <div>
      <IncomeKpiStrip
        items={[
          { label: "Gross Monthly", value: gbp(m.grossMonthly), sub: "pcm" },
          { label: "Gross Annual", value: gbp(m.grossAnnual), sub: "pa" },
          { label: "Avg. Occupancy", value: `${m.letPct}%`, tone: GREEN, info: true },
          { label: "Gross Yield", value: gy != null ? `${gy.toFixed(1)}%` : "—", tone: BLUE, info: true },
          { label: "Avg. Room Rate", value: m.avgRoomRate ? gbp(m.avgRoomRate) : "—", tone: PURPLE, info: true },
          { label: "Net Yield", value: gy != null ? `${(gy * (1 - OPEX_RATIO)).toFixed(1)}%` : "—", tone: AMBER },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <IncomeSectionHeader
          title="Rent per room assumptions"
          subtitle="Set up your rooms, contract types, pricing, voids and seasonality."
          addLabel="Add Room"
          onAdd={addRoom}
        />

        <TableShell
          minWidth={1040}
          addLabel="Add Room"
          onAdd={addRoom}
          headers={[
            "Room / Type",
            "Room No.",
            "Contract Type",
            "Contract Length",
            "Avg. Rent (pcm)",
            "Void % (Annual)",
            "Seasonality",
            "Revenue Notes",
            "Monthly Income (Gross)",
          ]}
        >
          {state.rooms.map((room) => (
            <Row key={room.id}>
              <SelectCell value={room.type} onChange={(v) => updateRoom(room.id, { type: v })} options={ROOM_TYPES} />
              <TextCell value={room.name} onChange={(v) => updateRoom(room.id, { name: v })} width="w-20" />
              <SelectCell
                value={room.contractType}
                onChange={(v) => updateRoom(room.id, { contractType: v })}
                options={CONTRACT_TYPES}
                width="min-w-[140px]"
              />
              <NumberCell
                value={room.contractLengthMonths}
                onChange={(v) => updateRoom(room.id, { contractLengthMonths: v })}
                suffix="mo"
                width="w-16"
                min={1}
              />
              <NumberCell value={room.avgRentPcm} onChange={(v) => updateRoom(room.id, { avgRentPcm: v })} prefix="£" />
              <NumberCell
                value={room.voidPct}
                onChange={(v) => updateRoom(room.id, { voidPct: v })}
                suffix="%"
                width="w-14"
                max={100}
              />
              <SelectCell
                value={room.seasonality}
                onChange={(v) => updateRoom(room.id, { seasonality: v })}
                options={SEASONALITY}
                width="min-w-[120px]"
              />
              <TextCell
                value={room.notes}
                onChange={(v) => updateRoom(room.id, { notes: v })}
                placeholder="Stable demand"
                width="w-28"
              />
              <MoneyCell value={Math.round(room.avgRentPcm * (1 - room.voidPct / 100))} />
              <DeleteCell onDelete={() => removeRoom(room.id)} />
            </Row>
          ))}
        </TableShell>

        <SummaryFooter
          items={[
            { icon: "🏠", label: "Total Rooms", value: String(m.roomCount) },
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
        hint="Typical: 5% rooms · 10–25% SA/holiday · 5% LTL"
      />

      <ChartGrid>
        <MonthlyGrossCard
          title="Monthly Gross Income"
          value={gbp(m.grossAnnual)}
          sub="Annual Gross Income"
          data={monthlyCurve(m.grossMonthly, 5)}
        />
        <DonutCard
          title="Occupancy Distribution"
          data={[
            { name: "Let (Current)", value: m.letPct, colour: PURPLE },
            { name: "Void (Expected)", value: m.voidPct, colour: "#FCD34D" },
            { name: "Turnover", value: m.turnoverPct, colour: "#CBD5E1" },
          ]}
        />
        <MetricsCard
          title="Yield & Pricing Metrics"
          rows={[
            { label: "Gross Yield", value: gy != null ? `${gy.toFixed(1)}%` : "—" },
            { label: "Net Yield (After Costs)", value: gy != null ? `${(gy * (1 - OPEX_RATIO)).toFixed(1)}%` : "—" },
            { label: "Average Room Rate", value: m.avgRent ? `${gbp(m.avgRent)} pcm` : "—" },
            { label: "Revenue per Room (pcm)", value: m.avgRoomRate ? gbp(m.avgRoomRate) : "—" },
            { label: "Rent Cover (Gross)", value: rc != null ? `${rc.toFixed(2)}x` : "—" },
          ]}
        />
        <TrendCard
          title="Seasonality Impact"
          badge={{ label: "Low (±3%)", tone: "green" }}
          data={monthlyCurve(m.grossMonthly, 3)}
          formatter={(v) => gbp(v)}
          footer={<TrendFooter leftLabel="Peak impact" leftValue="+3% (Jul)" rightLabel="Low impact" rightValue="-3% (Jan)" />}
        />
      </ChartGrid>

      <IncomeAiPanel
        suggestions={ai.suggestions}
        isGenerating={ai.isGenerating}
        onApply={ai.apply}
        onApplyAll={ai.applyAll}
        onGenerate={() =>
          ai.generate(() => {
            if (!state.rooms.length) return []
            const out = []
            const lowVoidRoom = [...state.rooms].sort((a, b) => b.voidPct - a.voidPct)[0]
            if (lowVoidRoom && lowVoidRoom.voidPct > 5) {
              out.push({
                recommendationType: "void",
                title: "Reduce void exposure",
                body: `${lowVoidRoom.type} (${lowVoidRoom.name}) carries a ${lowVoidRoom.voidPct}% void. Cutting it to 5% recovers income.`,
                estimatedImpactMonthly: Math.round(lowVoidRoom.avgRentPcm * ((lowVoidRoom.voidPct - 5) / 100)),
              })
            }
            const belowAvg = state.rooms.filter((r) => r.avgRentPcm < m.avgRent)
            if (belowAvg.length) {
              out.push({
                recommendationType: "pricing",
                title: "Align below-average rooms",
                body: `${belowAvg.length} room(s) price below your ${gbp(m.avgRent)} average. Closing the gap lifts gross income.`,
                estimatedImpactMonthly: Math.round(belowAvg.reduce((s, r) => s + (m.avgRent - r.avgRentPcm), 0)),
              })
            }
            return out
          })
        }
      />
    </div>
  )
}
