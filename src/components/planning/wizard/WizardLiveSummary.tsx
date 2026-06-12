"use client"

import React from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWizard } from "./WizardContext"
import { calculatePlanningSet, formatCurrency, type PlanningWizardData } from "@/lib/planning/calculations"
import { getProfileByKey } from "@/lib/planning/profiles"
import type { WizardState } from "./WizardContext"

// ─── Adapter: WizardState → PlanningWizardData ───────────────────────────────

function adaptStateToCalcData(state: WizardState): PlanningWizardData {
  return {
    profileKey: state.profileKey,
    propertyName: state.setName,
    address: state.address,
    postcode: state.postcode,
    numUnits: state.numUnits,
    propertyValue: state.propertyValue,

    // Income
    rooms: state.rooms.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      monthlyRent: r.avgRentPcm,
    })),
    voidAllowancePct: state.voidAllowancePct,
    occupancyPct: state.occupancyPct,
    adr: state.adr,
    singleMonthlyRent: state.singleMonthlyRent,
    landlordMonthlyRent: state.landlordMonthlyRent,

    // Expenses — calculations.ts ExpenseLine uses `label`, not `name`
    expenses: state.expenses.map(e => ({
      id: e.id,
      label: e.name,
      category: e.category,
      monthlyAmount: e.monthlyAmount,
    })),

    // Bills — calculations.ts BillLine uses `label` + `provider` + `includedInRent`
    bills: state.bills.map(b => ({
      id: b.id,
      label: b.name,
      provider: "",
      monthlyAmount: b.monthlyAmount,
      includedInRent: b.payer === "Tenant",
    })),

    // Upfront costs — calculations.ts UpfrontCostLine uses `label`
    upfrontCosts: state.upfrontCosts.map(u => ({
      id: u.id,
      label: u.name,
      category: u.category,
      amount: u.amount,
    })),

    // Compliance — calculations.ts ComplianceLine uses `label` + `amount` + `required`
    complianceItems: state.complianceItems.map(c => ({
      id: c.id,
      label: c.title,
      amount: c.estimatedCostMax,
      required: c.status !== "not_started",
    })),

    proposedLandlordRent: state.offerRentMonthly,
    offerContractLength: state.offerInitialTermYears * 12,
    offerBreakClause: 0,
    offerBillsIncluded: false,
    offerManagementIncluded: false,
    status: "draft",
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WizardLiveSummary() {
  const { state } = useWizard()
  const profile = getProfileByKey(state.profileKey)

  let result: ReturnType<typeof calculatePlanningSet> | null = null
  try {
    result = calculatePlanningSet(adaptStateToCalcData(state))
  } catch {
    result = null
  }

  const netPcm   = result?.netMonthlyIncome ?? 0
  const riskScore = result?.riskScore ?? 0

  const compliancePct =
    state.complianceItems.length > 0
      ? Math.round(
          (state.complianceItems.filter(c => c.status === "completed").length /
            state.complianceItems.length) *
            100
        )
      : 0

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Live badge */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold text-slate-700">Live Summary</p>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10.5px] font-semibold text-emerald-600">Live</span>
        </div>
      </div>

      {/* Profile chip */}
      {profile && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0"
            style={{ backgroundColor: profile.colour }}
          >
            {profile.label.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-slate-900 truncate">{profile.label}</p>
            <p className="text-[10.5px] text-slate-400">{profile.riskLevel} risk · {profile.yieldRange}</p>
          </div>
        </div>
      )}

      {!profile && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50">
          <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[11.5px] text-slate-400">Select a profile to see live metrics</p>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-violet-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-violet-500 mb-0.5 font-medium">Target Net / Mo</p>
          <p className="text-[18px] font-bold text-[#7C3AED]">
            {state.targetMonthlyCashflow > 0
              ? `£${state.targetMonthlyCashflow.toLocaleString()}`
              : "£—"}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400 mb-0.5 font-medium">Expected Net / Mo</p>
          <p className={cn("text-[18px] font-bold", netPcm > 0 ? "text-slate-900" : "text-slate-400")}>
            {netPcm > 0 ? formatCurrency(netPcm) : "£—"}
          </p>
        </div>
      </div>

      {/* Payback + Risk */}
      {result && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Payback Period</p>
            <p className="text-[14px] font-bold text-slate-900">
              {result.breakevenMonth < 999 ? `${result.breakevenMonth}mo` : "N/A"}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Risk Score</p>
            <p className={cn(
              "text-[14px] font-bold",
              riskScore < 40 ? "text-emerald-600" :
              riskScore < 65 ? "text-amber-600" : "text-red-600"
            )}>
              {riskScore} / 100
            </p>
            <p className={cn(
              "text-[10px] font-semibold",
              riskScore < 40 ? "text-emerald-500" :
              riskScore < 65 ? "text-amber-500" : "text-red-500"
            )}>
              {riskScore < 40 ? "Low" : riskScore < 65 ? "Medium" : "High"}
            </p>
          </div>
        </div>
      )}

      {/* Cash-on-Cash + Compliance */}
      {result && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Cash-on-Cash (Yr 1)</p>
            <p className="text-[14px] font-bold text-[#10B981]">
              {result.roi > 0 ? `${result.roi.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Compliance</p>
            <p className="text-[14px] font-bold text-[#7C3AED]">
              {state.complianceItems.length > 0 ? `${compliancePct}%` : "—"}
            </p>
            {compliancePct >= 80 && (
              <p className="text-[10px] font-semibold text-emerald-500">Ready</p>
            )}
          </div>
        </div>
      )}

      {/* Completion progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11.5px] font-semibold text-slate-700">Completion</p>
          <p className="text-[11px] font-bold text-[#7C3AED]">{state.completionPct}%</p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7C3AED] rounded-full transition-all"
            style={{ width: `${state.completionPct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {state.completionPct < 30
            ? "Keep going — you’re getting started!"
            : state.completionPct < 70
            ? "You’re making great progress!"
            : "Almost there — final steps!"}
        </p>
      </div>
    </div>
  )
}
