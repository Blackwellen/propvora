"use client"

import React, { useMemo } from "react"
import {
  Plus,
  Trash2,
  Edit2,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  Home,
  Scale,
  FileText,
  Users,
  Banknote,
  Wrench,
  Sofa,
  Settings,
  Shield,
  Package,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { UpfrontCostLine, ComplianceItem } from "@/components/planning/wizard/WizardContext"
import { cn } from "@/lib/utils"

// ─── Category Icon ────────────────────────────────────────────────────────────

function UpfrontCategoryIcon({ category }: { category: string }) {
  const map: Record<string, React.ElementType> = {
    Acquisition: Home,
    Legal: Scale,
    Tax: FileText,
    Fees: Users,
    Financing: Banknote,
    Refurb: Wrench,
    Furnishing: Sofa,
    Setup: Settings,
    Licensing: Shield,
    Contingency: Package,
    Deposit: Banknote,
    Other: FileText,
  }
  const Icon = map[category] ?? FileText
  return <Icon className="w-4 h-4 text-slate-400" />
}

function getCostDescription(category: string): string {
  const map: Record<string, string> = {
    Acquisition: "Property purchase price",
    Legal: "Conveyancing & legal",
    Tax: "Land & property tax",
    Fees: "Agent / broker fees",
    Financing: "Arrangement & valuation",
    Refurb: "Works & renovations",
    Furnishing: "Furniture, appliances, décor",
    Setup: "IT, signage, onboarding, misc.",
    Licensing: "HMO licence & application",
    Contingency: "Buffer for unexpected costs",
    Deposit: "Cash deposit / reserves",
    Other: "Custom upfront investment",
  }
  return map[category] ?? ""
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Step05UpfrontCompliance() {
  const { state, update } = useWizard()

  // ── Upfront calculations ──────────────────────────────────────────────────
  const totalUpfront = useMemo(
    () => state.upfrontCosts.reduce((s, c) => s + c.amount, 0),
    [state.upfrontCosts]
  )

  // ── Compliance calculations ───────────────────────────────────────────────
  const completedCount = useMemo(
    () => state.complianceItems.filter((c) => c.status === "completed").length,
    [state.complianceItems]
  )

  const readinessPct = Math.round(
    (completedCount / Math.max(state.complianceItems.length, 1)) * 100
  )

  const blockingCount = useMemo(
    () =>
      state.complianceItems.filter(
        (c) => c.status === "not_started" && c.priority === "Mandatory"
      ).length,
    [state.complianceItems]
  )

  const totalComplianceCost = useMemo(
    () => state.complianceItems.reduce((s, c) => s + c.estimatedCostMax, 0),
    [state.complianceItems]
  )

  // ── Upfront helpers ───────────────────────────────────────────────────────

  function addUpfrontCost() {
    const newCost: UpfrontCostLine = {
      id: Date.now().toString(),
      name: "New Cost",
      category: "Other",
      amount: 0,
      notes: "",
    }
    update({ upfrontCosts: [...state.upfrontCosts, newCost] })
  }

  function removeUpfrontCost(id: string) {
    update({ upfrontCosts: state.upfrontCosts.filter((c) => c.id !== id) })
  }

  function updateUpfrontCost(id: string, changes: Partial<UpfrontCostLine>) {
    update({
      upfrontCosts: state.upfrontCosts.map((c) =>
        c.id === id ? { ...c, ...changes } : c
      ),
    })
  }

  // ── Compliance helpers ────────────────────────────────────────────────────

  function addComplianceItem() {
    const newItem: ComplianceItem = {
      id: Date.now().toString(),
      title: "New Compliance Item",
      priority: "Important",
      status: "not_started",
      estimatedCostMin: 0,
      estimatedCostMax: 0,
      dueDate: "",
      evidenceRequired: [],
      notes: "",
    }
    update({ complianceItems: [...state.complianceItems, newItem] })
  }

  function updateComplianceItem(id: string, changes: Partial<ComplianceItem>) {
    update({
      complianceItems: state.complianceItems.map((c) =>
        c.id === id ? { ...c, ...changes } : c
      ),
    })
  }

  // ── Donut data ────────────────────────────────────────────────────────────
  const fundingData = [
    { name: "Equity", value: state.fundingEquityPct },
    { name: "Mortgage", value: state.fundingMortgagePct },
    { name: "Other", value: state.fundingOtherPct },
  ]

  return (
    <div className="flex h-full">
      {/* ── Main scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto">

        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
          <h1 className="text-[22px] font-bold text-slate-900 mb-1">
            Upfront &amp; Compliance
          </h1>
          <p className="text-[13.5px] text-slate-500">
            Capture upfront investment and compliance readiness to understand your total
            initial requirement.
          </p>
        </div>

        {/* ── SECTION 1: Upfront Investment Builder ──────────────────────────── */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-brand-100)] flex items-center justify-center shrink-0">
                <span className="text-[14px] font-bold text-[var(--brand)]">1</span>
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">
                  Upfront Investment Builder
                </h2>
                <p className="text-[12.5px] text-slate-400">
                  Add all upfront cash outflows to understand your total investment
                  requirement.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12.5px] text-slate-400">All amounts in</span>
              <select className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]">
                <option>£ GBP</option>
                <option>$ USD</option>
                <option>€ EUR</option>
              </select>
            </div>
          </div>

          {/* Cost lines — two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0 mb-6">
            {state.upfrontCosts.map((cost) => (
              <div
                key={cost.id}
                className="flex items-center gap-3 py-2.5 border-b border-slate-100"
              >
                {/* Category icon */}
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <UpfrontCategoryIcon category={cost.category} />
                </div>
                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <input
                    value={cost.name}
                    onChange={(e) =>
                      updateUpfrontCost(cost.id, { name: e.target.value })
                    }
                    className="w-full text-[13px] font-semibold text-slate-800 bg-transparent focus:outline-none focus:bg-white focus:px-2 focus:rounded-lg focus:border focus:border-[#7C3AED]/30 truncate"
                  />
                  <p className="text-[11px] text-slate-400 truncate">
                    {cost.notes || getCostDescription(cost.category)}
                  </p>
                </div>
                {/* Amount */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[13px] text-slate-400">£</span>
                  <input
                    type="number"
                    min={0}
                    value={cost.amount || ""}
                    onChange={(e) =>
                      updateUpfrontCost(cost.id, { amount: Number(e.target.value) })
                    }
                    className="w-28 h-8 px-2 rounded-lg border border-slate-200 text-[13px] font-semibold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]/50"
                  />
                </div>
                {/* Remove */}
                <button
                  onClick={() => removeUpfrontCost(cost.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add line */}
          <button
            onClick={addUpfrontCost}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-dashed border-slate-300 text-[13px] font-semibold text-slate-500 hover:border-[#7C3AED]/40 hover:text-[#7C3AED] hover:bg-violet-50 transition-all mb-6"
          >
            <Plus className="w-3.5 h-3.5" />
            + Add Custom Line
          </button>

          {/* Summary row + Funding Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: summary metrics + card */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                  {
                    label: "Total Upfront Cash Required",
                    value: `£${totalUpfront.toLocaleString()}`,
                    sub: "Includes 10% contingency",
                    colour: "#2563EB",
                    large: true,
                  },
                  {
                    label: "Payback Estimate",
                    value: "4.8 years",
                    sub: "Based on forecasted cash flow",
                    colour: "#7C3AED",
                    large: false,
                  },
                  {
                    label: "Break-even Contribution",
                    value: `£${Math.round(totalUpfront / 36).toLocaleString()} / month / unit`,
                    sub: "Average minimum rent contribution",
                    colour: "#10B981",
                    large: false,
                  },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <p className="text-[11px] text-slate-400 mb-1">{m.label}</p>
                    <p
                      className={cn("font-bold", m.large ? "text-[20px]" : "text-[15px]")}
                      style={{ color: m.colour }}
                    >
                      {m.value}
                    </p>
                    {m.sub && (
                      <p className="text-[10.5px] text-slate-400 mt-0.5">{m.sub}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Upfront Summary card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                <p className="text-[12.5px] font-bold text-slate-700 mb-3">
                  Upfront Summary
                </p>
                {[
                  {
                    label: "Total Cash Outlay",
                    value: `£${Math.round(totalUpfront * 0.95).toLocaleString()}`,
                  },
                  {
                    label: "Contingency (10%)",
                    value: `£${Math.round(totalUpfront * 0.05).toLocaleString()}`,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between py-1.5 border-b border-slate-200 last:border-0"
                  >
                    <span className="text-[12px] text-slate-500">{s.label}</span>
                    <span className="text-[13px] font-bold text-slate-800">
                      {s.value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 mt-1">
                  <span className="text-[13px] font-bold text-slate-700">
                    Total Upfront Cash Required
                  </span>
                  <span className="text-[16px] font-bold text-[var(--brand)]">
                    £{totalUpfront.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Funding Split */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-bold text-slate-700">Funding Split</p>
                <button className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]">
                  <Edit2 className="w-3 h-3" />
                  Edit Funding Split
                </button>
              </div>
              <div className="flex items-center gap-4">
                {/* Donut */}
                <div
                  className="w-[90px] h-[90px] shrink-0"
                  role="img"
                  aria-label={`Funding split: Equity ${state.fundingEquityPct}%, Mortgage ${state.fundingMortgagePct}%, Other ${state.fundingOtherPct}%`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fundingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={42}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#2563EB" />
                        <Cell fill="#7C3AED" />
                        <Cell fill="#F59E0B" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Labels */}
                <div className="flex-1 space-y-2">
                  {[
                    { label: "Equity", pct: state.fundingEquityPct, colour: "#2563EB" },
                    {
                      label: "Mortgage",
                      pct: state.fundingMortgagePct,
                      colour: "#7C3AED",
                    },
                    { label: "Other", pct: state.fundingOtherPct, colour: "#F59E0B" },
                  ].map((f) => (
                    <div key={f.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: f.colour }}
                          />
                          <span className="text-[12px] text-slate-600">{f.label}</span>
                        </div>
                        <span className="text-[12px] font-bold text-slate-700">
                          {f.pct}% ·{" "}
                          £{Math.round((totalUpfront * f.pct) / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${f.pct}%`, background: f.colour }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    Total{" "}
                    {state.fundingEquityPct +
                      state.fundingMortgagePct +
                      state.fundingOtherPct}
                    % · £{totalUpfront.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Compliance Requirements Checklist ───────────────────── */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <span className="text-[14px] font-bold text-[#7C3AED]">2</span>
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">
                  Compliance Requirements Checklist
                </h2>
                <p className="text-[12.5px] text-slate-400">
                  Complete all compliance requirements for a fully compliant operation.
                </p>
              </div>
            </div>
          </div>

          {/* Progress + cost + filters row */}
          <div className="flex items-center gap-6 mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12.5px] font-semibold text-slate-700">
                  Overall Progress
                </span>
                <span className="text-[12.5px] font-bold text-[#7C3AED]">
                  {readinessPct}% —{" "}
                  {completedCount} of {state.complianceItems.length} completed
                </span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7C3AED] rounded-full transition-all"
                  style={{ width: `${readinessPct}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-slate-400">Est. Compliance Cost</p>
              <p className="text-[16px] font-bold text-slate-900">
                £{totalComplianceCost.toLocaleString()}
              </p>
              <p className="text-[10.5px] text-slate-400">Total estimated cost</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]">
                <option>All Categories</option>
                <option>Mandatory</option>
                <option>Recommended</option>
                <option>Important</option>
              </select>
              <select className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]">
                <option>All Status</option>
                <option>Completed</option>
                <option>In Progress</option>
                <option>Not Started</option>
                <option>Blocked</option>
              </select>
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                Bulk Upload Evidence
              </button>
            </div>
          </div>

          {/* Compliance cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
            {state.complianceItems.map((item) => {
              const statusConfig: Record<
                ComplianceItem["status"],
                { label: string; colour: string; dot: string }
              > = {
                completed: {
                  label: "Completed",
                  colour: "#10B981",
                  dot: "#10B981",
                },
                in_progress: {
                  label: "In Progress",
                  colour: "#F59E0B",
                  dot: "#F59E0B",
                },
                not_started: {
                  label: "Not Started",
                  colour: "#EF4444",
                  dot: "#EF4444",
                },
                blocked: {
                  label: "Blocked",
                  colour: "#DC2626",
                  dot: "#DC2626",
                },
              }

              const priorityConfig: Record<
                ComplianceItem["priority"],
                { colour: string; bg: string }
              > = {
                Mandatory: { colour: "#EF4444", bg: "#FEF2F2" },
                Recommended: { colour: "#2563EB", bg: "#EFF6FF" },
                Important: { colour: "#F59E0B", bg: "#FFFBEB" },
              }

              const sc = statusConfig[item.status]
              const pc = priorityConfig[item.priority]

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border-2 p-4 transition-all",
                    item.status === "completed"
                      ? "border-emerald-200 bg-emerald-50/30"
                      : item.status === "blocked"
                      ? "border-red-200 bg-red-50/20"
                      : item.status === "not_started"
                      ? "border-red-100 bg-white"
                      : "border-slate-200 bg-white"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13.5px] font-bold text-slate-900 mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          style={{ background: pc.bg, color: pc.colour }}
                          className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                        >
                          {item.priority}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: sc.dot }}
                          />
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: sc.colour }}
                          >
                            {sc.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Status select */}
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateComplianceItem(item.id, {
                          status: e.target.value as ComplianceItem["status"],
                        })
                      }
                      className="ml-2 h-7 px-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 focus:outline-none cursor-pointer shrink-0"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  {/* Cost + Due Date */}
                  <div className="flex items-center gap-4 mb-3 text-[11.5px] text-slate-500 flex-wrap">
                    <span>
                      Est. Cost: £{item.estimatedCostMin.toLocaleString()}–£
                      {item.estimatedCostMax.toLocaleString()}
                    </span>
                    {item.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          {item.dueDate === "2035-03-10"
                            ? "Valid until: 10 Mar 2035"
                            : `Due: ${item.dueDate}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Evidence chips */}
                  {item.evidenceRequired.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-3">
                      {item.evidenceRequired.map((ev) => (
                        <span
                          key={ev}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    {item.status === "completed"
                      ? "View Evidence"
                      : "Upload Evidence"}
                  </button>
                </div>
              )
            })}

            {/* Add custom compliance item */}
            <button
              onClick={addComplianceItem}
              className="rounded-2xl border-2 border-dashed border-slate-200 p-4 flex flex-col items-center justify-center gap-2 hover:border-[#7C3AED]/40 hover:bg-violet-50/30 transition-all min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-[13px] font-semibold text-slate-400">
                + Add Custom Compliance
              </p>
              <p className="text-[11px] text-slate-300 text-center">
                Need to track another requirement?
              </p>
              <span className="text-[11.5px] font-semibold text-[#7C3AED]">
                + Add Item
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Step-specific right rail (2xl only) ─────────────────────────────── */}
      <div className="hidden 2xl:flex flex-col w-[240px] shrink-0 border-l border-slate-100 overflow-y-auto p-4 gap-4">

        {/* Readiness Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[13px] font-bold text-slate-900 mb-3">Readiness Overview</p>
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
                  stroke="#7C3AED"
                  strokeWidth="3.5"
                  strokeDasharray={`${readinessPct} ${100 - readinessPct}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-slate-900">
                {readinessPct}
              </span>
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#7C3AED]">
                {readinessPct >= 75
                  ? "Great Progress"
                  : readinessPct >= 40
                  ? "Good Progress"
                  : "Getting Started"}
              </p>
              <p className="text-[11px] text-slate-400">
                {readinessPct >= 75
                  ? "Almost there!"
                  : "You're on track."}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[13px] font-bold text-slate-900 mb-3">Financial Snapshot</p>
          {[
            {
              label: "Total Upfront Cash",
              value: `£${totalUpfront.toLocaleString()}`,
            },
            {
              label: "Est. Compliance Cost",
              value: `£${totalComplianceCost.toLocaleString()}`,
            },
            {
              label: "Total Initial Investment",
              value: `£${(totalUpfront + totalComplianceCost).toLocaleString()}`,
            },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
            >
              <span className="text-[11.5px] text-slate-500">{f.label}</span>
              <span className="text-[12.5px] font-bold text-slate-800">{f.value}</span>
            </div>
          ))}
        </div>

        {/* Blocking Items */}
        <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-red-900">
              Blocking Items ({blockingCount})
            </p>
          </div>
          {state.complianceItems
            .filter(
              (c) => c.status === "not_started" && c.priority === "Mandatory"
            )
            .slice(0, 3)
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1.5 border-b border-red-100 last:border-0"
              >
                <span className="text-[12px] text-red-800 flex-1 mr-2">
                  {item.title}
                </span>
                <span
                  className={cn(
                    "text-[10.5px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                    item.priority === "Mandatory"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {item.priority === "Mandatory" ? "High" : "Medium"}
                </span>
              </div>
            ))}
          {blockingCount === 0 && (
            <p className="text-[11.5px] text-red-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              No mandatory items blocking
            </p>
          )}
          <button className="mt-2 text-[11.5px] font-semibold text-red-600 hover:text-red-700">
            View all compliance items →
          </button>
        </div>

        {/* AI Guidance */}
        <div className="bg-gradient-to-br from-violet-50 to-[var(--brand-soft)] rounded-2xl border border-violet-200/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-[#7C3AED] flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <p className="text-[13px] font-bold text-slate-900">AI Guidance</p>
            <span className="text-[9px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full ml-auto">
              Beta
            </span>
          </div>
          {[
            "HMO license can take 4–8 weeks. Start early.",
            "Consider a larger contingency for refurbishment.",
            "Ensure all certificates are valid before letting.",
          ].map((g, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 py-1.5 border-b border-violet-100/60 last:border-0"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-slate-600">{g}</p>
            </div>
          ))}
          <button className="mt-2 w-full text-[12px] font-semibold text-[#7C3AED] text-center hover:text-violet-700">
            Ask AI a question →
          </button>
        </div>
      </div>
    </div>
  )
}
