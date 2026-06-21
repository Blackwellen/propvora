"use client"

import React from "react"
import { Check } from "lucide-react"

export interface PlanFeature {
  label: string
  included: boolean
}

export interface Plan {
  id: string
  name: string
  monthlyPrice: number
  annualPrice: number
  features: PlanFeature[]
  isPopular?: boolean
  isCurrent?: boolean
}

export interface BillingCycleToggleProps {
  cycle: "monthly" | "annual"
  onChange: (cycle: "monthly" | "annual") => void
}

export function BillingCycleToggle({ cycle, onChange }: BillingCycleToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 w-fit">
      {(["monthly", "annual"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
            cycle === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {c === "monthly" ? "Monthly" : "Annual"}
          {c === "annual" && (
            <span className="ml-1.5 text-[10px] font-semibold text-emerald-600">Save 20%</span>
          )}
        </button>
      ))}
    </div>
  )
}

export interface PlanComparisonGridProps {
  plans: Plan[]
  cycle: "monthly" | "annual"
  onUpgrade: (planId: string) => void
  onManage: () => void
}

function gbp(p: number) {
  return `£${(p / 100).toFixed(0)}`
}

export function PlanComparisonGrid({ plans, cycle, onUpgrade, onManage }: PlanComparisonGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {plans.map((plan) => {
        const price = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice
        return (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl border p-5 shadow-sm flex flex-col ${
              plan.isCurrent
                ? "border-[#2563EB] ring-1 ring-[#2563EB]/20"
                : plan.isPopular
                ? "border-violet-300"
                : "border-slate-200"
            }`}
          >
            {plan.isCurrent && (
              <span className="absolute -top-3 left-4 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#2563EB] text-white">
                Current plan
              </span>
            )}
            {plan.isPopular && !plan.isCurrent && (
              <span className="absolute -top-3 left-4 text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-600 text-white">
                Most popular
              </span>
            )}
            <p className="text-[14px] font-bold text-slate-900 mb-1">{plan.name}</p>
            <p className="text-[26px] font-black text-slate-900 mb-0.5 tabular-nums">
              {gbp(price)}
              <span className="text-[13px] font-normal text-slate-400">/mo</span>
            </p>
            {cycle === "annual" && (
              <p className="text-[11px] text-slate-400 mb-3">billed annually</p>
            )}
            <ul className="space-y-2 flex-1 mt-3">
              {plan.features.map((f) => (
                <li key={f.label} className="flex items-start gap-2 text-[12.5px]">
                  <Check
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      f.included ? "text-emerald-500" : "text-slate-200"
                    }`}
                  />
                  <span className={f.included ? "text-slate-700" : "text-slate-300 line-through"}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              {plan.isCurrent ? (
                <button
                  type="button"
                  onClick={onManage}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Manage plan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpgrade(plan.id)}
                  className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
