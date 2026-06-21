"use client"

import React from "react"
import {
  Check,
  Copy,
  Download,
  Sparkles,
} from "lucide-react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import { cn } from "@/lib/utils"

// ─── OfferField wrapper ───────────────────────────────────────────────────────

function OfferField({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="mb-3">
        <h3 className="text-[13.5px] font-bold text-slate-900">{title}</h3>
        {subtitle && (
          <p className="text-[11.5px] text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Responsibility Select ────────────────────────────────────────────────────

function ResponsibilitySelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: "Landlord" | "Tenant"
  onChange: (v: "Landlord" | "Tenant") => void
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
        {(["Landlord", "Tenant"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
              value === opt
                ? "bg-white shadow-sm text-slate-800"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Step06LLOffer() {
  const { state, update } = useWizard()

  const statusOrder: Array<typeof state.offerStatus> = [
    "draft",
    "internal_review",
    "negotiation",
    "agreed",
    "signed",
  ]

  const statusLabels = [
    "Draft",
    "Internal Review",
    "Negotiation",
    "Agreed",
    "Signed",
  ]

  const currentStatusIndex = statusOrder.indexOf(state.offerStatus)

  // Total landlord value estimate
  const totalLandlordValue = Math.round(
    state.offerRentMonthly * state.offerInitialTermYears * 12 * 0.9
  )

  return (
    <div className="flex h-full">
      {/* ── Main scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto">

        {/* ── TOP HEADER + OFFER STATUS ────────────────────────────────────── */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-[22px] font-bold text-slate-900 mb-1">
                Offer Builder
              </h1>
              <p className="text-[13.5px] text-slate-500">
                Configure terms and commercial package for the landlord.
              </p>
            </div>
            <div className="shrink-0 max-w-full">
              <p className="text-[11px] text-slate-400 mb-2 text-center">
                Offer Status
              </p>
              <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
                {statusLabels.map((s, i) => {
                  const isActive = state.offerStatus === statusOrder[i]
                  const isComplete = currentStatusIndex > i
                  return (
                    <React.Fragment key={s}>
                      <button
                        onClick={() =>
                          update({ offerStatus: statusOrder[i] })
                        }
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all",
                          isActive
                            ? "bg-[#7C3AED] text-white"
                            : isComplete
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-400"
                        )}
                      >
                        {isComplete && <Check className="w-2.5 h-2.5" />}
                        <span>{i + 1}</span>
                        <span>{s}</span>
                      </button>
                      {i < 4 && (
                        <div
                          className={cn(
                            "w-4 h-px shrink-0",
                            isComplete ? "bg-emerald-200" : "bg-slate-200"
                          )}
                        />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN 12-FIELD FORM ───────────────────────────────────────────── */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* ── FIELD 1: Rent Offer ────────────────────────────────────── */}
            <OfferField
              title="1. Rent Offer"
              subtitle="Indicative monthly rent (excl. bills)"
            >
              <div>
                <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                  Indicative monthly rent (excl. bills)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] font-medium">
                    £
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={state.offerRentMonthly || ""}
                    onChange={(e) =>
                      update({ offerRentMonthly: Number(e.target.value) })
                    }
                    className="w-full h-10 pl-7 pr-14 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                    / month
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Rent escalation
                  </label>
                  <select
                    value={String(state.offerRentEscalationPct)}
                    onChange={(e) =>
                      update({ offerRentEscalationPct: Number(e.target.value) })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {["0", "1", "1.5", "2", "2.5", "3", "5"].map((v) => (
                      <option key={v} value={v}>
                        {v}%
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Escalation frequency
                  </label>
                  <select
                    value={state.offerEscalationFrequency}
                    onChange={(e) =>
                      update({ offerEscalationFrequency: e.target.value })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {["Annually", "Every 2 Years", "Every 3 Years"].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </OfferField>

            {/* ── FIELD 2: Structure ─────────────────────────────────────── */}
            <OfferField title="2. Structure" subtitle="">
              <div className="flex flex-col gap-2">
                {[
                  {
                    value: "guaranteed_rent" as const,
                    label: "Guaranteed Rent",
                    desc: "Fixed rent with no turnover share",
                  },
                  {
                    value: "management_fee" as const,
                    label: "Management Fee",
                    desc: "% of revenue managed",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      state.offerStructure === opt.value
                        ? "border-[#7C3AED] bg-violet-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="structure"
                      value={opt.value}
                      checked={state.offerStructure === opt.value}
                      onChange={() => update({ offerStructure: opt.value })}
                      className="mt-0.5 accent-[#7C3AED]"
                    />
                    <div>
                      <p
                        className={cn(
                          "text-[13px] font-bold",
                          state.offerStructure === opt.value
                            ? "text-[#7C3AED]"
                            : "text-slate-800"
                        )}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[11.5px] text-slate-400">{opt.desc}</p>
                    </div>
                  </label>
                ))}
                {state.offerStructure === "guaranteed_rent" && (
                  <div className="mt-2">
                    <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                      Guaranteed rent
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">
                        £
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={state.offerRentMonthly || ""}
                        onChange={(e) =>
                          update({ offerRentMonthly: Number(e.target.value) })
                        }
                        className="w-full h-9 pl-7 pr-16 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                        / month
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </OfferField>

            {/* ── FIELD 3: Term Length ───────────────────────────────────── */}
            <OfferField title="3. Term Length" subtitle="">
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Initial term
                  </label>
                  <select
                    value={String(state.offerInitialTermYears)}
                    onChange={(e) =>
                      update({ offerInitialTermYears: Number(e.target.value) })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {["1", "2", "3", "5", "7", "10"].map((y) => (
                      <option key={y} value={y}>
                        {y} Years
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Renewal option
                  </label>
                  <select
                    value={state.offerRenewalOption}
                    onChange={(e) =>
                      update({ offerRenewalOption: e.target.value })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {[
                      "None",
                      "1 x 5 Years",
                      "1 x 3 Years",
                      "2 x 3 Years",
                      "Mutual Option",
                    ].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Lock-in period
                  </label>
                  <select
                    value={String(state.offerLockInMonths)}
                    onChange={(e) =>
                      update({ offerLockInMonths: Number(e.target.value) })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {["0", "6", "12", "18", "24", "36"].map((m) => (
                      <option key={m} value={m}>
                        {m} Months
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </OfferField>

            {/* ── FIELD 4: Rent-Free Period ──────────────────────────────── */}
            <OfferField
              title="4. Rent-Free Period"
              subtitle="Upfront incentive to offset fit-out costs."
            >
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Rent-free months
                  </label>
                  <select
                    value={String(state.offerRentFreeMonths)}
                    onChange={(e) =>
                      update({ offerRentFreeMonths: Number(e.target.value) })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {["0", "1", "2", "3", "4", "6"].map((m) => (
                      <option key={m} value={m}>
                        {m} {m === "1" ? "Month" : "Months"}
                      </option>
                    ))}
                  </select>
                </div>
                {state.offerRentFreeMonths > 0 && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-[11.5px] text-blue-700 font-semibold">
                      Equivalent saving
                    </p>
                    <p className="text-[14px] font-bold text-[#2563EB]">
                      £
                      {(
                        state.offerRentFreeMonths * state.offerRentMonthly
                      ).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-blue-500 mt-0.5">
                      Based on £{state.offerRentMonthly.toLocaleString()} /month
                    </p>
                  </div>
                )}
              </div>
            </OfferField>

            {/* ── FIELD 5: Break Clause ──────────────────────────────────── */}
            <OfferField
              title="5. Break Clause"
              subtitle="Option to exit before the end of the initial term."
            >
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Break clause after
                  </label>
                  <select
                    value={state.offerBreakClauseAfter}
                    onChange={(e) =>
                      update({ offerBreakClauseAfter: e.target.value })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {[
                      "None",
                      "After 12 Months",
                      "After 18 Months",
                      "After 24 Months",
                      "After 36 Months",
                      "After 48 Months",
                    ].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Break notice (months)
                  </label>
                  <select
                    value={String(state.offerBreakNoticeMonths)}
                    onChange={(e) =>
                      update({ offerBreakNoticeMonths: Number(e.target.value) })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {["1", "2", "3", "6"].map((m) => (
                      <option key={m} value={m}>
                        {m} {m === "1" ? "Month" : "Months"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </OfferField>

            {/* ── FIELD 6: Notice Terms ──────────────────────────────────── */}
            <OfferField
              title="6. Notice Terms"
              subtitle="Termination and early exit requirements."
            >
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Termination notice (months)
                  </label>
                  <select
                    value={String(state.offerTerminationNoticeMonths)}
                    onChange={(e) =>
                      update({
                        offerTerminationNoticeMonths: Number(e.target.value),
                      })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {["1", "2", "3", "6", "12"].map((m) => (
                      <option key={m} value={m}>
                        {m} {m === "1" ? "Month" : "Months"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Early termination penalty
                  </label>
                  <select
                    value={state.offerEarlyTerminationPenalty}
                    onChange={(e) =>
                      update({ offerEarlyTerminationPenalty: e.target.value })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {[
                      "None",
                      "1 Month Rent",
                      "2 Months Rent",
                      "3 Months Rent",
                      "6 Months Rent",
                      "Negotiated",
                    ].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
            </OfferField>

            {/* ── FIELD 7: Deposit ───────────────────────────────────────── */}
            <OfferField
              title="7. Deposit"
              subtitle="Security deposit or rent deposit held against the property."
            >
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Deposit amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">
                      £
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={state.offerDepositAmount || ""}
                      onChange={(e) =>
                        update({ offerDepositAmount: Number(e.target.value) })
                      }
                      className="w-full h-9 pl-7 pr-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                  {state.offerRentMonthly > 0 && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      ≈{" "}
                      {(
                        state.offerDepositAmount / state.offerRentMonthly
                      ).toFixed(1)}{" "}
                      months rent
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Deposit type
                  </label>
                  <select
                    value={state.offerDepositType}
                    onChange={(e) =>
                      update({ offerDepositType: e.target.value })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {[
                      "Rent Deposit",
                      "Security Deposit",
                      "Advance Payment",
                      "Bank Guarantee",
                      "None",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </OfferField>

            {/* ── FIELD 8: Maintenance Responsibilities ─────────────────── */}
            <OfferField
              title="8. Maintenance Responsibilities"
              subtitle="Who is responsible for structural and internal maintenance."
            >
              <div className="flex flex-col gap-4">
                <ResponsibilitySelect
                  label="Structural maintenance"
                  value={state.offerMaintenanceStructural}
                  onChange={(v) => update({ offerMaintenanceStructural: v })}
                />
                <ResponsibilitySelect
                  label="Internal maintenance"
                  value={state.offerMaintenanceInternal}
                  onChange={(v) => update({ offerMaintenanceInternal: v })}
                />
              </div>
            </OfferField>

            {/* ── FIELD 9: Furnishing Responsibilities ──────────────────── */}
            <OfferField
              title="9. Furnishing Responsibilities"
              subtitle="Who provides and replaces furnishings and fittings."
            >
              <div className="flex flex-col gap-4">
                <ResponsibilitySelect
                  label="Furnishing & fittings"
                  value={state.offerFurnishingFittings}
                  onChange={(v) => update({ offerFurnishingFittings: v })}
                />
                <ResponsibilitySelect
                  label="Replacement responsibility"
                  value={state.offerReplacementResponsibility}
                  onChange={(v) => update({ offerReplacementResponsibility: v })}
                />
              </div>
            </OfferField>

            {/* ── FIELD 10: Bills Responsibility ────────────────────────── */}
            <OfferField
              title="10. Bills Responsibility"
              subtitle="Allocation of utility bills and council tax."
            >
              <div className="flex flex-col gap-4">
                <ResponsibilitySelect
                  label="Bills & utilities"
                  value={state.offerBillsUtilities}
                  onChange={(v) => update({ offerBillsUtilities: v })}
                />
                <ResponsibilitySelect
                  label="Council tax"
                  value={state.offerCouncilTax}
                  onChange={(v) => update({ offerCouncilTax: v })}
                />
              </div>
            </OfferField>

            {/* ── FIELD 11: Commission / Management ─────────────────────── */}
            <OfferField
              title="11. Commission / Management"
              subtitle="Fee model and percentage applied to the offer."
            >
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Commission model
                  </label>
                  <select
                    value={state.offerCommissionModel}
                    onChange={(e) =>
                      update({ offerCommissionModel: e.target.value })
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {[
                      "Fixed Fee",
                      "% of Revenue",
                      "% of Rent",
                      "None",
                      "Negotiated",
                    ].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
                    Management fee %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={state.offerManagementFeePct || ""}
                      onChange={(e) =>
                        update({ offerManagementFeePct: Number(e.target.value) })
                      }
                      className="w-full h-9 pl-3 pr-20 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
                      % of revenue
                    </span>
                  </div>
                  {state.offerManagementFeePct > 0 && state.offerRentMonthly > 0 && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      £
                      {Math.round(
                        (state.offerManagementFeePct / 100) * state.offerRentMonthly
                      ).toLocaleString()}{" "}
                      / month
                    </p>
                  )}
                </div>
              </div>
            </OfferField>

            {/* ── FIELD 12: Special Terms ───────────────────────────────── */}
            <OfferField
              title="12. Special Terms"
              subtitle="Any additional terms or conditions specific to this offer."
            >
              <textarea
                value={state.offerSpecialTerms}
                onChange={(e) => update({ offerSpecialTerms: e.target.value })}
                rows={6}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-[13px] text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 placeholder:text-slate-300"
                placeholder="Exclusive use of reception area.&#10;Right of first refusal on adjoining unit."
              />
              <p className="text-right text-[11px] text-slate-400 mt-1">
                {state.offerSpecialTerms.length} / 500
              </p>
            </OfferField>

            {/* ── FIELD 13 (full width): Negotiation Notes + AI ────────── */}
            <div className="md:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Negotiation Notes */}
              <OfferField
                title="13. Negotiation Notes"
                subtitle="Internal notes for negotiation strategy and priorities."
              >
                <textarea
                  value={state.offerNegotiationNotes}
                  onChange={(e) =>
                    update({ offerNegotiationNotes: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-[13px] text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 placeholder:text-slate-300"
                  placeholder="Landlord is motivated by long-term stability and minimal void risk..."
                />
                <p className="text-right text-[11px] text-slate-400 mt-1">
                  {state.offerNegotiationNotes.length} / 1000
                </p>
              </OfferField>

              {/* AI Offer Assistant */}
              <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-xl bg-[#7C3AED] flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-[14px] font-bold text-slate-900">
                    AI Offer Assistant
                  </h3>
                  <span className="text-[10px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
                    Beta
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-500 mb-4">
                  Our AI analysed market data and suggests the following:
                </p>
                <div className="bg-white rounded-xl p-4 mb-4 border border-violet-100">
                  {[
                    {
                      emoji: "💷",
                      label: "Rent range to target:",
                      value: `£${Math.round(state.offerRentMonthly * 0.94).toLocaleString()} – £${Math.round(state.offerRentMonthly * 1.06).toLocaleString()} / month`,
                      colour: "#7C3AED",
                    },
                    {
                      emoji: "⏳",
                      label: "Recommended rent-free:",
                      value: "1 – 2 months",
                      colour: "#2563EB",
                    },
                    {
                      emoji: "📋",
                      label: "Strategy:",
                      value: `Offer £${state.offerRentMonthly.toLocaleString()} with ${state.offerRentFreeMonths} months rent-free to create value while protecting margin.`,
                      colour: "#374151",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-[14px] shrink-0">{s.emoji}</span>
                      <div>
                        <p className="text-[11.5px] font-semibold text-slate-500">
                          {s.label}
                        </p>
                        <p
                          className="text-[12.5px] font-bold"
                          style={{ color: s.colour }}
                        >
                          {s.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full h-10 rounded-xl bg-[#7C3AED] text-white text-[13.5px] font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Apply AI Suggestions
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Right intelligence panel (xl+) ──────────────────────────────────── */}
      <div className="hidden xl:flex flex-col w-[260px] shrink-0 border-l border-slate-100 overflow-y-auto p-4 gap-4">

        {/* Likely Acceptance — derived from offer completeness */}
        {(() => {
          const offerFilled = [
            state.offerRentMonthly > 0,
            state.offerInitialTermYears > 0,
            !!state.offerStructure,
            state.offerDepositAmount > 0,
            state.offerRentFreeMonths >= 0,
          ].filter(Boolean).length
          const acceptancePct = Math.round((offerFilled / 5) * 100)
          const strokeVal = acceptancePct
          const acceptLabel = acceptancePct >= 80 ? "High" : acceptancePct >= 50 ? "Medium" : "Low"
          const strokeColour = acceptancePct >= 80 ? "#10B981" : acceptancePct >= 50 ? "#F59E0B" : "#EF4444"
          const labelColour = strokeColour
          return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-[13px] font-bold text-slate-900 mb-3">
            Offer Completeness
          </p>
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
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
                stroke={strokeColour}
                strokeWidth="3.5"
                strokeDasharray={`${strokeVal} ${100 - strokeVal}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-bold text-slate-900">{acceptancePct}%</span>
            </div>
          </div>
          <p className="text-[12px] font-bold mb-1" style={{ color: labelColour }}>{acceptLabel}</p>
          <p className="text-[11px] text-slate-400">
            {offerFilled === 5 ? "All key offer fields filled" : `${5 - offerFilled} field${5 - offerFilled === 1 ? "" : "s"} still needed`}
          </p>
        </div>
          )
        })()}

        {/* Target Margin After Offer — live derived from income vs offer rent */}
        {(() => {
          const roomIncome = state.rooms.reduce((s, r) => s + r.avgRentPcm, 0)
          const singleIncome = state.singleMonthlyRent || 0
          const grossIncome = roomIncome > 0 ? roomIncome : singleIncome
          const offerRent = state.offerRentMonthly || 0
          const marginPct = grossIncome > 0 && offerRent > 0
            ? (((grossIncome - offerRent) / grossIncome) * 100).toFixed(1)
            : null
          return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-[12.5px] font-bold text-slate-700 mb-1">
            Target Margin After Offer
          </p>
          <p className="text-[26px] font-bold text-[#7C3AED]">{marginPct !== null ? `${marginPct}%` : "—"}</p>
          <p className="text-[11.5px] text-slate-400">{marginPct !== null ? "Income vs offer rent" : "Enter income (Step 3) and offer rent above"}</p>
        </div>
          )
        })()}

        {/* Landlord Benefit Highlights */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[13px] font-bold text-slate-900 mb-3">
            Landlord Benefit Highlights
          </p>
          {[
            `Guaranteed stable income of £${state.offerRentMonthly.toLocaleString()}/month`,
            "Long-term tenant with professional operation",
            "Property well-maintained at tenant cost",
            `Reduced void risk with ${state.offerLockInMonths}-month lock-in`,
            "Transparent management and reporting",
          ].map((b) => (
            <div
              key={b}
              className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0"
            >
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-slate-700">{b}</p>
            </div>
          ))}
        </div>

        {/* Comparable Rent Benchmarks — shown only when offer rent is entered */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[13px] font-bold text-slate-900 mb-3">
            Comparable Rent Benchmarks
          </p>
          {state.offerRentMonthly > 0 ? (
            <div className="text-[12px] text-slate-500 space-y-1.5">
              <p>Your offer: <span className="font-semibold text-slate-800">£{state.offerRentMonthly.toLocaleString()}/mo</span></p>
              <p className="text-[11px] text-slate-400">Live market benchmarks will be available when your postcode is connected to Propvora's rental data feed (coming in V2). For now, cross-reference with Rightmove, Zoopla, or local agents.</p>
            </div>
          ) : (
            <p className="text-[12px] text-slate-400">
              Enter a monthly rent figure in the Offer Terms section above to benchmark against market rates.
            </p>
          )}
        </div>

        {/* Suggested Offer Strategy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold text-slate-900">
              Suggested Offer Strategy
            </p>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Competitive &amp; Fair
            </span>
          </div>
          <p className="text-[12px] text-slate-500 mb-3">
            Competitive offer with strong tenant profile and favourable terms for a
            win-win outcome.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] text-slate-400">Conservative</span>
            <div className="flex-1 relative h-2 bg-slate-200 rounded-full">
              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#7C3AED] border-2 border-white shadow-sm -top-1" />
            </div>
            <span className="text-[10.5px] text-slate-400">Aggressive</span>
          </div>
          <p className="text-center text-[10.5px] font-semibold text-[#7C3AED] mt-1">
            Balanced
          </p>
        </div>

        {/* Messaging Template Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-slate-900">
              Messaging Template Preview
            </p>
            <button className="flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:text-blue-700">
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-line">
            {`Dear [Landlord Name],

Thank you for the opportunity to propose a partnership for your property at [Property Address].

We believe our structured offer delivers long-term stability, strong occupancy, and professional management.

We look forward to discussing this further.

Best regards,
[Your Name / Company]`}
          </div>
        </div>

        {/* Offer Summary to Send */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-slate-900">
              Offer Summary to Send
            </p>
            <button className="flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:text-blue-700">
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
          {(
            [
              {
                label: "Monthly Rent (Excl. Bills)",
                value: `£${state.offerRentMonthly.toLocaleString()}`,
                bold: false,
              },
              {
                label: "Rent-Free Period",
                value: `${state.offerRentFreeMonths} ${state.offerRentFreeMonths === 1 ? "Month" : "Months"}`,
                bold: false,
              },
              {
                label: "Term Length",
                value: `${state.offerInitialTermYears} Years + ${state.offerRenewalOption}`,
                bold: false,
              },
              {
                label: "Lock-in Period",
                value: `${state.offerLockInMonths} Months`,
                bold: false,
              },
              {
                label: "Deposit",
                value: `£${state.offerDepositAmount.toLocaleString()} (${state.offerDepositType})`,
                bold: false,
              },
              {
                label: "Total Landlord Value (Est.)",
                value: `£${totalLandlordValue.toLocaleString()}+`,
                bold: true,
              },
            ] as Array<{ label: string; value: string; bold: boolean }>
          ).map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
            >
              <span className="text-[11.5px] text-slate-500">{s.label}</span>
              <span
                className={cn(
                  "text-[12.5px]",
                  s.bold
                    ? "font-bold text-slate-900"
                    : "font-semibold text-slate-700"
                )}
              >
                {s.value}
              </span>
            </div>
          ))}
          {state.offerInitialTermYears >= 5 && (
            <p className="text-[10.5px] text-slate-400 mt-1">
              Over initial term
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
