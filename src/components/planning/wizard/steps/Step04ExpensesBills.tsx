"use client"

import React, { useState, useMemo } from "react"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Briefcase,
  Wrench,
  Shield,
  Zap,
  Flame,
  Droplets,
  Settings,
  Building,
  FileText,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { ExpenseLine, BillLine } from "@/components/planning/wizard/WizardContext"
import { cn } from "@/lib/utils"

// ─── Category Icon ────────────────────────────────────────────────────────────

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, React.ElementType> = {
    Management: Briefcase,
    Maintenance: Wrench,
    Cleaning: Sparkles,
    Licensing: FileText,
    Insurance: Shield,
    Utilities: Zap,
    "Council Tax": Building,
    Energy: Flame,
    Water: Droplets,
    Service: Settings,
  }
  const Icon = icons[category] ?? FileText
  return <Icon className="w-4 h-4 text-slate-400" />
}

// ─── Table Column Header ──────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div className="grid grid-cols-[2fr_100px_80px_100px_110px_68px_32px] gap-2 px-6 py-2 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100 bg-slate-50/50">
      <span>Item</span>
      <span>Frequency</span>
      <span>Type</span>
      <span>Payer</span>
      <span>Amount</span>
      <span>VAT</span>
      <span />
    </div>
  )
}

// ─── Expense Row ──────────────────────────────────────────────────────────────

interface ExpenseRowProps {
  item: ExpenseLine
  viewMode: "Monthly" | "Annual"
  onUpdate: (id: string, changes: Partial<ExpenseLine>) => void
  onRemove: (id: string) => void
}

function ExpenseRow({ item, viewMode, onUpdate, onRemove }: ExpenseRowProps) {
  const displayAmount =
    viewMode === "Annual" ? item.monthlyAmount * 12 : item.monthlyAmount

  return (
    <div className="grid grid-cols-[2fr_100px_80px_100px_110px_68px_32px] gap-2 items-center px-6 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
      {/* Icon + name + description */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <CategoryIcon category={item.category} />
        </div>
        <div className="min-w-0">
          <input
            value={item.name}
            onChange={(e) => onUpdate(item.id, { name: e.target.value })}
            className="w-full text-[13px] font-semibold text-slate-800 bg-transparent focus:outline-none focus:bg-white focus:px-1.5 focus:rounded-lg focus:border focus:border-[#7C3AED]/30 -ml-0.5 truncate"
          />
          <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
        </div>
      </div>
      {/* Frequency */}
      <select
        value={item.frequency}
        onChange={(e) =>
          onUpdate(item.id, { frequency: e.target.value as ExpenseLine["frequency"] })
        }
        className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-600 focus:outline-none cursor-pointer"
      >
        {["Monthly", "Quarterly", "Annual", "One-off"].map((f) => (
          <option key={f}>{f}</option>
        ))}
      </select>
      {/* Fixed / Variable */}
      <button
        onClick={() => onUpdate(item.id, { isFixed: !item.isFixed })}
        className={cn(
          "h-8 px-2 rounded-lg text-[11.5px] font-bold border transition-all",
          item.isFixed
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        )}
      >
        {item.isFixed ? "Fixed" : "Variable"}
      </button>
      {/* Payer */}
      <select
        value={item.payer}
        onChange={(e) =>
          onUpdate(item.id, { payer: e.target.value as ExpenseLine["payer"] })
        }
        className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-600 focus:outline-none cursor-pointer"
      >
        {["Landlord", "Tenant", "Operator", "Split"].map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      {/* Amount */}
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-medium">
          £
        </span>
        <input
          type="number"
          min={0}
          value={displayAmount || ""}
          onChange={(e) => {
            const raw = Number(e.target.value)
            onUpdate(item.id, {
              monthlyAmount: viewMode === "Annual" ? Math.round(raw / 12) : raw,
            })
          }}
          className="w-full h-8 pl-5 pr-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
        />
      </div>
      {/* VAT */}
      <select
        value={item.vatTreatment}
        onChange={(e) =>
          onUpdate(item.id, {
            vatTreatment: e.target.value as ExpenseLine["vatTreatment"],
          })
        }
        className="h-8 px-1 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-500 focus:outline-none cursor-pointer"
      >
        {["Ex VAT", "Inc VAT", "No VAT"].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      {/* Delete */}
      <button
        onClick={() => onRemove(item.id)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Bill Row ─────────────────────────────────────────────────────────────────

interface BillRowProps {
  item: BillLine
  viewMode: "Monthly" | "Annual"
  onUpdate: (id: string, changes: Partial<BillLine>) => void
  onRemove: (id: string) => void
}

function BillRow({ item, viewMode, onUpdate, onRemove }: BillRowProps) {
  const displayAmount =
    viewMode === "Annual" ? item.monthlyAmount * 12 : item.monthlyAmount

  return (
    <div className="grid grid-cols-[2fr_100px_80px_100px_110px_68px_32px] gap-2 items-center px-6 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
      {/* Icon + name + description */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <CategoryIcon category={item.category} />
        </div>
        <div className="min-w-0">
          <input
            value={item.name}
            onChange={(e) => onUpdate(item.id, { name: e.target.value })}
            className="w-full text-[13px] font-semibold text-slate-800 bg-transparent focus:outline-none focus:bg-white focus:px-1.5 focus:rounded-lg focus:border focus:border-[#7C3AED]/30 -ml-0.5 truncate"
          />
          <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
        </div>
      </div>
      {/* Frequency */}
      <select
        value={item.frequency}
        onChange={(e) =>
          onUpdate(item.id, { frequency: e.target.value as BillLine["frequency"] })
        }
        className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-600 focus:outline-none cursor-pointer"
      >
        {["Monthly", "Quarterly", "Annual"].map((f) => (
          <option key={f}>{f}</option>
        ))}
      </select>
      {/* Fixed / Variable */}
      <button
        onClick={() => onUpdate(item.id, { isFixed: !item.isFixed })}
        className={cn(
          "h-8 px-2 rounded-lg text-[11.5px] font-bold border transition-all",
          item.isFixed
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        )}
      >
        {item.isFixed ? "Fixed" : "Variable"}
      </button>
      {/* Payer */}
      <select
        value={item.payer}
        onChange={(e) =>
          onUpdate(item.id, { payer: e.target.value as BillLine["payer"] })
        }
        className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-600 focus:outline-none cursor-pointer"
      >
        {["Landlord", "Tenant", "Operator"].map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      {/* Amount */}
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-medium">
          £
        </span>
        <input
          type="number"
          min={0}
          value={displayAmount || ""}
          onChange={(e) => {
            const raw = Number(e.target.value)
            onUpdate(item.id, {
              monthlyAmount: viewMode === "Annual" ? Math.round(raw / 12) : raw,
            })
          }}
          className="w-full h-8 pl-5 pr-2 rounded-lg border border-slate-200 text-[13px] text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
        />
      </div>
      {/* VAT */}
      <select
        value={item.vatTreatment}
        onChange={(e) =>
          onUpdate(item.id, {
            vatTreatment: e.target.value as BillLine["vatTreatment"],
          })
        }
        className="h-8 px-1 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-500 focus:outline-none cursor-pointer"
      >
        {["Ex VAT", "Inc VAT", "No VAT"].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      {/* Delete */}
      <button
        onClick={() => onRemove(item.id)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface ExpenseSectionProps {
  title: string
  subtitle: string
  monthlyTotal: number
  collapsed: boolean
  onToggle: () => void
  onAdd: () => void
  children: React.ReactNode
}

function SectionWrapper({
  title,
  subtitle,
  monthlyTotal,
  collapsed,
  onToggle,
  onAdd,
  children,
}: ExpenseSectionProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <div>
            <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
            <p className="text-[12px] text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-slate-700">
            £{monthlyTotal.toLocaleString()}/mo
          </span>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#7C3AED] text-white text-[12.5px] font-semibold hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Line
          </button>
        </div>
      </div>

      {/* Table body */}
      {!collapsed && (
        <div>
          <TableHeader />
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Step04ExpensesBills() {
  const { state, update } = useWizard()

  const [viewMode, setViewMode] = useState<"Monthly" | "Annual">("Monthly")
  const [expensesCollapsed, setExpensesCollapsed] = useState(false)
  const [billsCollapsed, setBillsCollapsed] = useState(false)

  const grossMonthly = useMemo(
    () =>
      state.rooms.reduce((s, r) => s + Math.round(r.avgRentPcm * (1 - r.voidPct / 100)), 0) ||
      state.singleMonthlyRent ||
      0,
    [state.rooms, state.singleMonthlyRent]
  )

  const expenseTotal = useMemo(
    () => state.expenses.reduce((s, e) => s + e.monthlyAmount, 0),
    [state.expenses]
  )

  const billTotal = useMemo(
    () => state.bills.reduce((s, b) => s + b.monthlyAmount, 0),
    [state.bills]
  )

  const noi = Math.max(0, grossMonthly - expenseTotal - billTotal)
  const noiMarginPct =
    grossMonthly > 0 ? (noi / grossMonthly * 100).toFixed(1) : "0"

  // ── Expense helpers ──────────────────────────────────────────────────────

  function addExpense() {
    const newExp: ExpenseLine = {
      id: Date.now().toString(),
      name: "New Expense",
      description: "",
      category: "Management",
      frequency: "Monthly",
      isFixed: true,
      payer: "Landlord",
      monthlyAmount: 0,
      vatTreatment: "Ex VAT",
    }
    update({ expenses: [...state.expenses, newExp] })
  }

  function removeExpense(id: string) {
    update({ expenses: state.expenses.filter((e) => e.id !== id) })
  }

  function updateExpense(id: string, changes: Partial<ExpenseLine>) {
    update({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...changes } : e)),
    })
  }

  // ── Bill helpers ──────────────────────────────────────────────────────────

  function addBill() {
    const newBill: BillLine = {
      id: Date.now().toString(),
      name: "New Bill",
      description: "",
      category: "Utilities",
      frequency: "Monthly",
      isFixed: false,
      payer: "Landlord",
      monthlyAmount: 0,
      vatTreatment: "No VAT",
    }
    update({ bills: [...state.bills, newBill] })
  }

  function removeBill(id: string) {
    update({ bills: state.bills.filter((b) => b.id !== id) })
  }

  function updateBill(id: string, changes: Partial<BillLine>) {
    update({
      bills: state.bills.map((b) => (b.id === id ? { ...b, ...changes } : b)),
    })
  }

  // ── Benchmark diff ────────────────────────────────────────────────────────
  const BENCHMARK_MONTHLY = 1213
  const benchmarkDiff = expenseTotal - BENCHMARK_MONTHLY
  const benchmarkPct = Math.abs(Math.round((benchmarkDiff / BENCHMARK_MONTHLY) * 100))

  // ── Expense mix donut ─────────────────────────────────────────────────────
  const totalCosts = expenseTotal + billTotal
  const expenseMixData = [
    { name: "Op. Costs", value: expenseTotal },
    { name: "Bills", value: billTotal },
  ]

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 mb-1">Expenses & Bills</h1>
            <p className="text-[13.5px] text-slate-500">
              Capture all operating expenses and running bills to understand your true net returns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Monthly / Annual toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(["Monthly", "Annual"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setViewMode(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all",
                    viewMode === t
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setExpensesCollapsed(!expensesCollapsed)
                setBillsCollapsed(!billsCollapsed)
              }}
              className="h-9 px-4 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Templates ───────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
        <span className="text-[12.5px] font-semibold text-slate-500">Quick Templates:</span>
        {[
          { label: "HMO Cost Template", colour: "#7C3AED" },
          { label: "Single Let Cost Template", colour: "#2563EB" },
          { label: "Co-Living Template", colour: "#F59E0B" },
          { label: "+ Custom Template", colour: "#10B981" },
        ].map((t) => (
          <button
            key={t.label}
            style={{
              borderColor: t.colour + "40",
              color: t.colour,
              background: t.colour + "10",
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[12.5px] font-semibold hover:opacity-80 transition-opacity"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main 2-col layout ─────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row flex-1 min-h-0">

        {/* Left: tables */}
        <div className="flex-1 min-w-0 divide-y divide-slate-100">

          {/* Operating Costs */}
          <SectionWrapper
            title="Operating Costs"
            subtitle="Day-to-day running costs of the property and business."
            monthlyTotal={expenseTotal}
            collapsed={expensesCollapsed}
            onToggle={() => setExpensesCollapsed(!expensesCollapsed)}
            onAdd={addExpense}
          >
            {state.expenses.map((item) => (
              <ExpenseRow
                key={item.id}
                item={item}
                viewMode={viewMode}
                onUpdate={updateExpense}
                onRemove={removeExpense}
              />
            ))}
            {/* Add expense row */}
            <div className="px-6 py-3 border-t border-slate-50">
              <button
                onClick={addExpense}
                className="flex items-center gap-2 text-[12.5px] font-semibold text-[#7C3AED] hover:text-violet-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Expense Line
              </button>
            </div>
          </SectionWrapper>

          {/* Bills & Utilities */}
          <SectionWrapper
            title="Bills & Utilities"
            subtitle="Utility bills and property services."
            monthlyTotal={billTotal}
            collapsed={billsCollapsed}
            onToggle={() => setBillsCollapsed(!billsCollapsed)}
            onAdd={addBill}
          >
            {state.bills.map((item) => (
              <BillRow
                key={item.id}
                item={item}
                viewMode={viewMode}
                onUpdate={updateBill}
                onRemove={removeBill}
              />
            ))}
            {/* Add bill row */}
            <div className="px-6 py-3 border-t border-slate-50">
              <button
                onClick={addBill}
                className="flex items-center gap-2 text-[12.5px] font-semibold text-[#7C3AED] hover:text-violet-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Bill Line
              </button>
            </div>
          </SectionWrapper>
        </div>

        {/* Right: benchmark + analytics */}
        <div className="w-full xl:w-[280px] shrink-0 border-t xl:border-t-0 xl:border-l border-slate-100 flex flex-col divide-y divide-slate-100 overflow-y-auto">
          <div className="p-4 flex flex-col gap-4">

            {/* Live Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-slate-900">Live Summary</p>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              {[
                {
                  label: "Total Monthly Expenses",
                  value: `£${totalCosts.toLocaleString()}`,
                  colour: "#EF4444",
                },
                {
                  label: "Operating Costs",
                  value: `£${expenseTotal.toLocaleString()}`,
                  colour: "#F59E0B",
                },
                {
                  label: "Bills & Utilities",
                  value: `£${billTotal.toLocaleString()}`,
                  colour: "#2563EB",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-[12px] text-slate-500">{m.label}</span>
                  <span className="text-[13px] font-bold" style={{ color: m.colour }}>
                    {m.value}
                  </span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-slate-700">
                    NOI (Before Financing)
                  </span>
                  <span className="text-[14px] font-bold text-emerald-600">
                    £{noi.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{noiMarginPct}% Margin</p>
              </div>
            </div>

            {/* Benchmark card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-slate-900">Benchmark: Similar HMOs</p>
                <Info className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] mb-2">
                {["Your Total", "Market Avg.", "vs Market"].map((h) => (
                  <p key={h} className="font-semibold text-slate-400">
                    {h}
                  </p>
                ))}
                <p className="font-bold text-slate-900">£{expenseTotal.toLocaleString()}/mo</p>
                <p className="font-bold text-slate-500">£{BENCHMARK_MONTHLY}/mo</p>
                <p
                  className={cn(
                    "font-bold",
                    benchmarkDiff <= 0 ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {benchmarkDiff <= 0 ? "-" : "+"}
                  {benchmarkPct}%
                </p>
              </div>
              <p
                className={cn(
                  "text-[11px] font-semibold text-center",
                  benchmarkDiff <= 0 ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {benchmarkDiff <= 0 ? "Below average" : "Above average"}
              </p>

              {/* Top 3 cost drivers */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[11.5px] font-bold text-slate-700 mb-2">Top 3 cost drivers</p>
                {state.expenses.slice(0, 3).map((exp) => {
                  const pct =
                    expenseTotal > 0
                      ? Math.round((exp.monthlyAmount / expenseTotal) * 100)
                      : 0
                  return (
                    <div key={exp.id} className="mb-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-slate-600">{exp.name}</span>
                        <span className="text-[11px] font-bold text-slate-700">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7C3AED] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Health Indicators */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-3">Health Indicators</p>
              {[
                { label: "Cost Burden", value: "38 / 100", positive: true },
                { label: "Operating Cost Ratio", value: "21.6%", positive: true },
                { label: "Bills Ratio", value: "9.8%", positive: true },
                { label: "Expense Coverage Ratio", value: "1.69×", positive: true },
              ].map((h) => (
                <div
                  key={h.label}
                  className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[12px] text-slate-600 flex-1">{h.label}</span>
                  <span className="text-[12px] font-bold text-slate-800">{h.value}</span>
                </div>
              ))}
            </div>

            {/* Warnings */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-[13px] font-bold text-amber-900">Warnings & Flags</p>
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center ml-auto">
                  2
                </span>
              </div>
              {[
                "Energy costs look higher than market for HMOs. Review Energy",
                "Consider setting aside 10–15% for maintenance. Add Contingency",
              ].map((w, i) => (
                <p key={i} className="text-[12px] text-amber-800 mb-1.5 last:mb-0">
                  ⚠️ {w}
                </p>
              ))}
            </div>

            {/* AI Recommendations */}
            <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[#7C3AED] flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">AI Recommendations</p>
                <span className="text-[9px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full ml-auto">
                  Beta
                </span>
              </div>
              {[
                "Switch to a 12-month broadband contract. Est. save: £8 /mo",
                "Review energy tariff or consider fixed plan. Est. save: £22 /mo",
                "Benchmark management fees. You're above average by £63 /mo",
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 py-2 border-b border-slate-100/60 last:border-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-slate-700">{r}</p>
                </div>
              ))}
              <button className="mt-2 w-full text-[12px] font-semibold text-[#7C3AED] text-center hover:text-violet-700">
                View all recommendations →
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom Summary Cards ──────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-100 bg-slate-50/50">

        {/* Total Operating Cost Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[12.5px] font-bold text-slate-700 mb-3">
            Total Operating Cost Summary
          </p>
          {[
            { label: "Total Operating Costs", value: `£${expenseTotal.toLocaleString()}/mo` },
            { label: "Total Bills & Utilities", value: `£${billTotal.toLocaleString()}/mo` },
            {
              label: "Total Monthly Expenses",
              value: `£${totalCosts.toLocaleString()}`,
            },
            {
              label: "Total Annual Expenses",
              value: `£${(totalCosts * 12).toLocaleString()}/yr`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
            >
              <span className="text-[11.5px] text-slate-500">{s.label}</span>
              <span className="text-[12px] font-bold text-slate-900">{s.value}</span>
            </div>
          ))}
          <button className="mt-2 text-[11.5px] font-semibold text-[#2563EB] hover:text-blue-700">
            View full expense report →
          </button>
        </div>

        {/* Expense Mix donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[12.5px] font-bold text-slate-700 mb-3">Expense Mix (Monthly)</p>
          <div className="flex items-center gap-3">
            <div className="w-[70px] h-[70px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={33}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#7C3AED" />
                    <Cell fill="#2563EB" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {[
                {
                  label: "Op. Costs",
                  value: `${totalCosts > 0 ? Math.round((expenseTotal / totalCosts) * 100) : 0}%`,
                  colour: "#7C3AED",
                },
                {
                  label: "Bills & Utilities",
                  value: `${totalCosts > 0 ? Math.round((billTotal / totalCosts) * 100) : 0}%`,
                  colour: "#2563EB",
                },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: d.colour }}
                  />
                  <span className="text-[11px] text-slate-500 flex-1">{d.label}</span>
                  <span className="text-[12px] font-bold text-slate-700">{d.value}</span>
                </div>
              ))}
              <p className="text-[11.5px] font-bold text-slate-800 text-center">
                £{totalCosts.toLocaleString()}
                <br />
                <span className="text-[10px] text-slate-400 font-normal">Total /mo</span>
              </p>
            </div>
          </div>
        </div>

        {/* Margin Impact */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[12.5px] font-bold text-slate-700 mb-3">Margin Impact</p>
          {[
            {
              label: "Gross Monthly Income",
              value: `£${grossMonthly.toLocaleString()}`,
              colour: undefined,
            },
            {
              label: "Total Monthly Expenses",
              value: `−£${totalCosts.toLocaleString()}`,
              colour: "#EF4444",
            },
            {
              label: "NOI (Before Financing)",
              value: `£${noi.toLocaleString()}`,
              colour: "#10B981",
            },
            {
              label: "Net After All Expenses",
              value: `£${noi.toLocaleString()}`,
              colour: "#10B981",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
            >
              <span className="text-[11.5px] text-slate-500">{m.label}</span>
              <span
                className="text-[12px] font-bold"
                style={{ color: m.colour ?? "#374151" }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* Cost Burden Score */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[12.5px] font-bold text-slate-700 mb-2">Cost Burden Score</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeDasharray="38 62"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-slate-900">
                38
              </span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-emerald-600">Good</p>
              <p className="text-[11px] text-slate-400">Healthy cost structure</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Well done! Your expenses are below market average.
          </p>
          <p className="text-[10.5px] text-slate-300 mt-1">Benchmark: 52 / 100</p>
        </div>

      </div>
    </div>
  )
}
