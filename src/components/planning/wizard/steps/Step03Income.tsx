"use client"

import React, { useState, useMemo } from "react"
import {
  Plus,
  Trash2,
  ChevronDown,
  Info,
  Sparkles,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { RoomLine } from "@/components/planning/wizard/WizardContext"
import { getProfileByKey } from "@/lib/planning/profiles"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const INCOME_TABS = [
  "Rent per room",
  "Rent per unit",
  "Nightly rate",
  "Occupancy",
  "Seasonal assumptions",
  "Ancillary income",
  "Parking",
  "Laundry",
  "Membership & service charges",
  "Corporate lets",
  "Other income lines",
]

const ROOM_TYPES = [
  "Standard Room",
  "Large Room",
  "En-suite Room",
  "Studio",
  "Double Room",
  "Single Room",
]

const CONTRACT_TYPES = [
  "Assured Shorthold",
  "Licence",
  "Company Let",
  "Rolling Monthly",
  "Fixed Term",
]

const SEASONALITY_OPTIONS = ["All year", "Seasonal", "Term-time", "Peak summer"]

const ACCORDION_SECTIONS = [
  { label: "Seasonal assumptions (detailed)", value: "Low impact" },
  { label: "Ancillary income & services", value: "£620 pcm" },
  { label: "Corporate lets & long-term partnerships", value: "£0 pcm" },
  { label: "Other income lines", value: "£0 pcm" },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step03Income() {
  const { state, update, setStep } = useWizard()
  const [activeTab, setActiveTab] = useState("Rent per room")
  const [openAccordion, setOpenAccordion] = useState<number | null>(null)

  const profile = useMemo(() => getProfileByKey(state.profileKey), [state.profileKey])

  const grossMonthly = useMemo(
    () => state.rooms.reduce((s, r) => s + Math.round(r.avgRentPcm * (1 - r.voidPct / 100)), 0),
    [state.rooms]
  )

  const roomCount = state.rooms.length

  function addRoom() {
    const newRoom: RoomLine = {
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
    update({ rooms: [...state.rooms, newRoom] })
  }

  function removeRoom(id: string) {
    update({ rooms: state.rooms.filter((r) => r.id !== id) })
  }

  function updateRoom(id: string, changes: Partial<RoomLine>) {
    update({ rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...changes } : r)) })
  }

  const barData = [
    { m: "Jan", v: Math.round(grossMonthly * 0.9) },
    { m: "Feb", v: Math.round(grossMonthly * 0.95) },
    { m: "Mar", v: grossMonthly },
    { m: "Apr", v: grossMonthly },
    { m: "May", v: Math.round(grossMonthly * 1.02) },
    { m: "Jun", v: Math.round(grossMonthly * 1.05) },
    { m: "Jul", v: Math.round(grossMonthly * 1.05) },
    { m: "Aug", v: Math.round(grossMonthly * 1.05) },
    { m: "Sep", v: Math.round(grossMonthly * 1.02) },
    { m: "Oct", v: grossMonthly },
    { m: "Nov", v: Math.round(grossMonthly * 0.98) },
    { m: "Dec", v: Math.round(grossMonthly * 0.95) },
  ]

  const letPct = Math.round(100 - state.voidAllowancePct)
  const voidPct = state.voidAllowancePct

  const occupancyDonutData = [
    { name: "Let (Current)", value: letPct },
    { name: "Void (Expected)", value: voidPct },
    { name: "Turnover", value: 1 },
  ]

  const seasonalityData = [
    { m: "Jan", v: -2 },
    { m: "Apr", v: 1 },
    { m: "Jul", v: 3 },
    { m: "Oct", v: 0 },
  ]

  const avgRentPcm =
    roomCount > 0
      ? Math.round(state.rooms.reduce((s, r) => s + r.avgRentPcm, 0) / roomCount)
      : 0

  const avgVoidPct =
    roomCount > 0
      ? (state.rooms.reduce((s, r) => s + r.voidPct, 0) / roomCount).toFixed(1)
      : "0"

  const grossYield =
    state.propertyValue > 0
      ? `${((grossMonthly * 12) / state.propertyValue * 100).toFixed(1)}%`
      : "—"

  const avgRoomRateDisplay = roomCount > 0 ? `£${Math.round(grossMonthly / roomCount)}` : "—"

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 mb-1">Revenue Model Builder</h1>
            <p className="text-[13.5px] text-slate-500">
              Configure your revenue streams, occupancy assumptions, and pricing to project gross income.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12.5px] text-slate-500">Profile:</span>
            <span className="text-[13px] font-bold text-slate-800">{profile?.label ?? "—"}</span>
            <button
              onClick={() => setStep(1)}
              className="text-[12.5px] font-semibold text-[#7C3AED] hover:text-violet-700"
            >
              Change Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── Income Type Tabs ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 overflow-x-auto">
        <div className="flex items-center px-4 sm:px-6 lg:px-8 gap-0 min-w-max">
          {INCOME_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all",
                activeTab === tab
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Live KPI Bar ──────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 bg-[#F6FAFF] border-b border-slate-100">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-6 gap-y-4 sm:gap-8 sm:flex-wrap">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">
              Gross Monthly
            </p>
            <p className="text-[22px] font-bold text-slate-900">£{grossMonthly.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400">pcm</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">
              Gross Annual
            </p>
            <p className="text-[16px] font-bold text-slate-900">
              £{(grossMonthly * 12).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400">pa</p>
          </div>
          {[
            {
              label: "Avg. Occupancy",
              value: `${state.voidAllowancePct ? (100 - state.voidAllowancePct).toFixed(0) : 95}%`,
              colour: "#10B981",
            },
            {
              label: "Gross Yield",
              value: grossYield,
              colour: "#2563EB",
            },
            {
              label: "Avg. Room Rate",
              value: roomCount > 0 ? `£${Math.round(grossMonthly / roomCount)}` : "—",
              colour: "#7C3AED",
            },
            { label: "Net Yield", value: "7.8%", colour: "#F59E0B" },
          ].map((k) => (
            <div key={k.label} className="text-center">
              <p className="text-[11px] text-slate-400 font-semibold mb-0.5">{k.label}</p>
              <p className="text-[16px] font-bold" style={{ color: k.colour }}>
                {k.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Room Table Section ───────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Rent per room assumptions</h2>
            <p className="text-[12.5px] text-slate-400">
              Set up your rooms, contract types, pricing, voids and seasonality.
            </p>
          </div>
          <button
            onClick={addRoom}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Room
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-4" />
                {[
                  "Room / Type",
                  "Room No.",
                  "Contract Type",
                  "Contract Length",
                  "Avg. Rent (pcm)",
                  "Void % (Annual)",
                  "Seasonality",
                  "Revenue Notes",
                  "Monthly Income (Gross)",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.rooms.map((room) => (
                <tr
                  key={room.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group"
                >
                  {/* Drag handle */}
                  <td className="px-4 py-3 text-slate-300 cursor-grab select-none">⠿</td>

                  {/* Room Type */}
                  <td className="px-3 py-2">
                    <select
                      value={room.type}
                      onChange={(e) => updateRoom(room.id, { type: e.target.value })}
                      className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer min-w-[130px]"
                    >
                      {ROOM_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </td>

                  {/* Room No */}
                  <td className="px-3 py-2">
                    <input
                      value={room.name}
                      onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                      className="w-20 h-8 px-2 rounded-lg border border-slate-200 text-[12.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </td>

                  {/* Contract Type */}
                  <td className="px-3 py-2">
                    <select
                      value={room.contractType}
                      onChange={(e) => updateRoom(room.id, { contractType: e.target.value })}
                      className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer min-w-[140px]"
                    >
                      {CONTRACT_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </td>

                  {/* Contract Length */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={room.contractLengthMonths}
                        onChange={(e) =>
                          updateRoom(room.id, { contractLengthMonths: Number(e.target.value) })
                        }
                        className="w-16 h-8 px-2 text-center rounded-lg border border-slate-200 text-[12.5px] text-slate-700 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400">mo</span>
                    </div>
                  </td>

                  {/* Avg Rent */}
                  <td className="px-3 py-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-medium">
                        £
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={room.avgRentPcm || ""}
                        onChange={(e) =>
                          updateRoom(room.id, { avgRentPcm: Number(e.target.value) })
                        }
                        className="w-24 h-8 pl-5 pr-2 rounded-lg border border-slate-200 text-[12.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                    </div>
                  </td>

                  {/* Void % */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={room.voidPct}
                        onChange={(e) =>
                          updateRoom(room.id, { voidPct: Number(e.target.value) })
                        }
                        className="w-14 h-8 px-2 text-center rounded-lg border border-slate-200 text-[12.5px] text-slate-700 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400">%</span>
                    </div>
                  </td>

                  {/* Seasonality */}
                  <td className="px-3 py-2">
                    <select
                      value={room.seasonality}
                      onChange={(e) => updateRoom(room.id, { seasonality: e.target.value })}
                      className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                    >
                      {SEASONALITY_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* Revenue Notes */}
                  <td className="px-3 py-2">
                    <input
                      value={room.notes}
                      onChange={(e) => updateRoom(room.id, { notes: e.target.value })}
                      placeholder="Stable demand"
                      className="w-28 h-8 px-2 rounded-lg border border-slate-200 text-[12.5px] text-slate-500 placeholder:text-slate-300 focus:outline-none"
                    />
                  </td>

                  {/* Monthly Income Gross */}
                  <td className="px-3 py-2">
                    <span className="text-[13px] font-bold text-slate-900">
                      £{Math.round(room.avgRentPcm * (1 - room.voidPct / 100)).toLocaleString()}
                    </span>
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add room row */}
          <div className="px-4 py-3 border-t border-slate-100">
            <button
              onClick={addRoom}
              className="flex items-center gap-2 text-[13px] font-semibold text-[#7C3AED] hover:text-violet-700"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </button>
          </div>
        </div>

        {/* Summary row below table */}
        <div className="flex items-center gap-x-6 gap-y-3 mt-4 pt-4 border-t border-slate-100 flex-wrap">
          {[
            { icon: "🏠", label: "Total Rooms", value: roomCount.toString() },
            { icon: "💷", label: "Average Rent (pcm)", value: `£${avgRentPcm}` },
            { icon: "📊", label: "Average Void", value: `${avgVoidPct}%` },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <span>{m.icon}</span>
              <div>
                <p className="text-[11px] text-slate-400">{m.label}</p>
                <p className="text-[14px] font-bold text-slate-900">{m.value}</p>
              </div>
            </div>
          ))}
          <div className="ml-auto text-right">
            <p className="text-[12px] text-slate-400">Total Monthly Income (Gross)</p>
            <p className="text-[20px] font-bold text-slate-900">£{grossMonthly.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ── Void Allowance ───────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-100 flex items-center gap-6 bg-[#F6FAFF]">
        <div>
          <label className="text-[12px] font-semibold text-slate-600 block mb-1">
            Void Allowance (%)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={state.voidAllowancePct}
              onChange={(e) => update({ voidAllowancePct: Number(e.target.value) })}
              className="w-20 h-8 px-2.5 text-center rounded-lg border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
            />
            <span className="text-[12px] text-slate-400">% annual void allowance</span>
          </div>
        </div>
        <div className="text-[11.5px] text-slate-400">
          Typical: 5% rooms · 10–25% SA/holiday · 5% LTL
        </div>
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 border-b border-slate-100">

        {/* Monthly Gross Income Projection */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900">Monthly Gross Income</h3>
              <p className="text-[17px] font-bold text-slate-900">
                £{(grossMonthly * 12).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">Annual Gross Income</p>
            </div>
            <button className="text-[11.5px] font-semibold text-[#2563EB] hover:text-blue-700">
              View Details
            </button>
          </div>
          <div className="h-[80px]" role="img" aria-label="Monthly income breakdown bar chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="m"
                  tick={{ fontSize: 9, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`£${Number(v).toLocaleString()}`, "Income"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="v" fill="#7C3AED" radius={[2, 2, 0, 0]} name="Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="text-[13px] font-bold text-slate-900 mb-3">Occupancy Distribution</h3>
          <div className="flex items-center gap-3">
            <div className="h-[80px] w-[80px] shrink-0" role="img" aria-label="Occupancy distribution donut chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={38}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#7C3AED" />
                    <Cell fill="#FCD34D" />
                    <Cell fill="#CBD5E1" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 flex-1">
              {[
                { label: "Let (Current)", value: `${letPct}%`, colour: "#7C3AED" },
                { label: "Void (Expected)", value: `${voidPct}%`, colour: "#FCD34D" },
                { label: "Turnover", value: "1%", colour: "#CBD5E1" },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: d.colour }}
                  />
                  <span className="text-[11px] text-slate-500 flex-1">{d.label}</span>
                  <span className="text-[11px] font-bold text-slate-700">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Yield & Pricing Metrics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-slate-900">Yield & Pricing Metrics</h3>
            <Info className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="space-y-2">
            {[
              { label: "Gross Yield", value: grossYield },
              { label: "Net Yield (After Costs)", value: "7.8%" },
              {
                label: "Average Room Rate",
                value: roomCount > 0 ? `£${avgRentPcm} pcm` : "—",
              },
              {
                label: "Revenue per Room (pcm)",
                value: avgRoomRateDisplay,
              },
              { label: "Rent Cover (Gross)", value: "1.46x" },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0"
              >
                <span className="text-[11.5px] text-slate-500">{m.label}</span>
                <span className="text-[12px] font-bold text-slate-800">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonality Impact */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-slate-900">Seasonality Impact</h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Low (±3%)
            </span>
          </div>
          <div className="h-[80px]" role="img" aria-label="Income sensitivity projection area chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={seasonalityData}
                margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="seasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="m"
                  tick={{ fontSize: 9, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, "Variance"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#7C3AED"
                  fill="url(#seasGrad)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Accordion Sections ───────────────────────────────────────────────── */}
      <div className="border-b border-slate-100">
        {ACCORDION_SECTIONS.map((section, i) => (
          <div key={section.label} className="border-b border-slate-100 last:border-0">
            <button
              onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
              className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 hover:bg-slate-50 transition-colors"
            >
              <span className="text-[13.5px] font-semibold text-slate-700">{section.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-slate-500">{section.value}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-slate-400 transition-transform",
                    openAccordion === i && "rotate-180"
                  )}
                />
              </div>
            </button>
            {openAccordion === i && (
              <div className="px-4 sm:px-6 lg:px-8 pb-5 text-[13px] text-slate-400">
                Configure {section.label.toLowerCase()} for this planning set.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── AI Assistant Panel ───────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-[#7C3AED] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-900">AI Assistant</h3>
            <span className="text-[10px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
              Beta
            </span>
          </div>
          {[
            {
              label: "AI pricing suggestion",
              desc: "Increase avg. rent by £18 (2.6%) based on local demand.",
              action: "Apply Suggestion",
              colour: "#7C3AED",
            },
            {
              label: "Occupancy insight",
              desc: "Similar HMOs in your area average 93% occupancy.",
              action: "Adjust Assumption",
              colour: "#2563EB",
            },
            {
              label: "Benchmark comparison",
              desc: "Your gross yield is 1.1pp above market median.",
              action: "See Details",
              colour: "#10B981",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between py-2.5 border-b border-violet-100/60 last:border-0"
            >
              <div className="flex-1 mr-3">
                <p className="text-[12.5px] font-semibold text-slate-800">{s.label}</p>
                <p className="text-[11.5px] text-slate-500">{s.desc}</p>
              </div>
              <button
                style={{ background: s.colour }}
                className="h-8 px-3 rounded-xl text-white text-[12px] font-semibold shrink-0 hover:opacity-90 transition-opacity"
              >
                {s.action}
              </button>
            </div>
          ))}
          <button className="mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-violet-200 text-[13px] font-semibold text-[#7C3AED] hover:bg-white/80 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI a question →
          </button>
        </div>
      </div>

    </div>
  )
}
