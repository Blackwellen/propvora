"use client"

import React from "react"
import { Shield, AlertTriangle, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { InlineEditField, InlineEditMoney, InlineEditSelect } from "@/components/editing"
import { TenancySectionCard } from "./TenancySectionCard"

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n)

interface TenancyDepositTabProps {
  deposit: number
  depositScheme: string
  depositCertNo: string
  depositExpiry: string
  depositHeldBy: string | null
  onSave: (field: string, value: unknown) => Promise<void>
}

export function TenancyDepositTab({
  deposit, depositScheme, depositCertNo, depositExpiry, depositHeldBy, onSave,
}: TenancyDepositTabProps) {
  const protectedStatus = depositScheme && depositScheme !== "—" ? "Protected" : "Not recorded"

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Deposit Amount", value: deposit ? fmtGBP(deposit) : "—",      color: "text-slate-900" },
          { label: "Scheme",         value: depositScheme,                          color: "text-slate-900" },
          { label: "Reference",      value: depositCertNo,                          color: "text-slate-900" },
          { label: "Status",         value: protectedStatus, color: protectedStatus === "Protected" ? "text-emerald-600" : "text-amber-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{k.label}</p>
            <p className={cn("text-lg font-bold tabular-nums mt-1", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left */}
        <div className="flex-1 flex flex-col gap-4">
          <TenancySectionCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-800">Protection Details</span>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Held By</span>
                <InlineEditSelect
                  value={depositHeldBy ?? ""}
                  onSave={(v) => onSave("deposit_held_by", v || null)}
                  label="Deposit held by"
                  placeholder="Set holder"
                  options={[
                    { value: "landlord", label: "Landlord" },
                    { value: "scheme",   label: "Scheme" },
                    { value: "agent",    label: "Agent" },
                  ]}
                  displayClassName="text-sm font-semibold text-slate-800 capitalize"
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Scheme</span>
                <InlineEditField
                  value={depositScheme}
                  onSave={(v) => onSave("deposit_scheme", v)}
                  label="Deposit scheme"
                  displayClassName="text-sm font-semibold text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Reference</span>
                <InlineEditField
                  value={depositCertNo}
                  onSave={(v) => onSave("deposit_reference", v)}
                  label="Deposit reference"
                  displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Protected Amount</span>
                <InlineEditMoney
                  value={deposit}
                  onSave={(v) => onSave("deposit_amount", v ? Number(v) : null)}
                  label="Protected amount"
                  displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
                />
              </div>
            </div>
          </TenancySectionCard>

          <TenancySectionCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">Potential Deductions</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">£0 — No proposed deductions</span>
            </div>
            <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700">
              <Plus className="w-3.5 h-3.5" /> Add deduction
            </button>
          </TenancySectionCard>

          <TenancySectionCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">Dispute Status</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <span className="text-sm text-slate-500">None — No disputes raised</span>
            </div>
          </TenancySectionCard>
        </div>

        {/* Right */}
        <div className="flex-1 flex flex-col gap-4">
          <TenancySectionCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-800">Release Workflow</span>
              <span className="text-xs text-slate-500">0 of 4 steps</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Tenant has given notice",  status: "not_started" },
                { label: "Inspection completed",     status: "pending" },
                { label: "Deductions confirmed",     status: "pending" },
                { label: "Deposit released",         status: "pending" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    step.status === "not_started" ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"
                  )}>
                    {step.status === "done" && <Check className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <span className="text-sm text-slate-700">{step.label}</span>
                  <span className="ml-auto text-xs text-slate-500 capitalize">{step.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "0%" }} />
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-600 rounded-xl py-2.5 hover:bg-blue-700 transition-colors">
              Start Release Process
            </button>
          </TenancySectionCard>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Deposit return deadline approaching</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Deposit must be returned by {depositExpiry} (10 days after tenancy ends). Failure to return may result in penalties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
