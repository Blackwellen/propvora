"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { InlineEditField, InlineEditMoney, InlineEditSelect } from "@/components/editing"
import { Shield, AlertTriangle, Check, Plus, ArrowUpRight } from "lucide-react"
import { SectionCard, fmtGBP, type TenancyDisplay } from "./shared"
import { usePropertyJurisdiction } from "@/lib/jurisdiction/usePropertyJurisdiction"
import { DepositRulePanel } from "@/components/jurisdiction"
import { depositRules } from "@/lib/money/deposits"

// Normalise a stored rent + frequency to a monthly figure for the deposit cap.
const RENT_TO_MONTHLY: Record<string, number> = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, annually: 1 / 12 }

export function DepositTab({ t, onSave }: { t: TenancyDisplay; onSave: (field: string, value: unknown) => Promise<void> }) {
  const router = useRouter()
  const [showDeductionForm, setShowDeductionForm] = React.useState(false)
  const [deductionNote, setDeductionNote] = React.useState("")
  const [savingDeduction, setSavingDeduction] = React.useState(false)
  const [showEndConfirm, setShowEndConfirm] = React.useState(false)
  const [endingTenancy, setEndingTenancy] = React.useState(false)

  async function handleSaveDeduction() {
    if (!deductionNote.trim()) return
    setSavingDeduction(true)
    try {
      const existing = t.notes ?? ""
      const stamp = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      const updated = existing
        ? `${existing}\n\n[Deposit deduction — ${stamp}]\n${deductionNote.trim()}`
        : `[Deposit deduction — ${stamp}]\n${deductionNote.trim()}`
      await onSave("notes", updated)
      setDeductionNote("")
      setShowDeductionForm(false)
    } finally {
      setSavingDeduction(false)
    }
  }

  async function handleEndTenancy() {
    setEndingTenancy(true)
    try {
      await onSave("status", "ended")
      router.push(`/property-manager/portfolio/tenancies/${t.id}`)
    } finally {
      setEndingTenancy(false)
      setShowEndConfirm(false)
    }
  }

  const protectedStatus = t.depositScheme && t.depositScheme !== "—" ? "Protected" : "Not recorded"

  // Resolve the property's record-true jurisdiction so the deposit rule, cap and
  // return window reflect where the asset actually is — not the workspace default.
  const jur = usePropertyJurisdiction(t.propertyId ?? undefined)
  const monthlyRent = t.rent * (RENT_TO_MONTHLY[(t.rentFrequency ?? "monthly").toLowerCase()] ?? 1)
  const depositRule = depositRules(jur.countryCode, jur.region)

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Deposit Amount", value: t.deposit ? fmtGBP(t.deposit) : "£0", color: "text-slate-900" },
          { label: "Scheme", value: t.depositScheme, color: "text-slate-900" },
          { label: "Reference", value: t.depositCertNo, color: "text-slate-900" },
          { label: "Status", value: protectedStatus, color: protectedStatus === "Protected" ? "text-emerald-600" : "text-amber-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{k.label}</p>
            <p className={cn("text-lg font-bold tabular-nums mt-1", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 flex flex-col gap-4">
          <SectionCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[var(--brand)]" />
              <span className="text-sm font-bold text-slate-800">Protection Details</span>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Held By</span>
                <InlineEditSelect
                  value={t.depositHeldBy ?? ""}
                  onSave={(v) => onSave("deposit_held_by", v || null)}
                  label="Deposit held by"
                  placeholder="Set holder"
                  options={[
                    { value: "landlord", label: "Landlord" },
                    { value: "scheme", label: "Scheme" },
                    { value: "agent", label: "Agent" },
                  ]}
                  displayClassName="text-sm font-semibold text-slate-800 capitalize"
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Scheme</span>
                <InlineEditField
                  value={t.depositScheme}
                  onSave={(v) => onSave("deposit_scheme", v)}
                  label="Deposit scheme"
                  displayClassName="text-sm font-semibold text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Reference</span>
                <InlineEditField
                  value={t.depositCertNo}
                  onSave={(v) => onSave("deposit_reference", v)}
                  label="Deposit reference"
                  displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Protected Amount</span>
                <InlineEditMoney
                  value={t.deposit}
                  onSave={(v) => onSave("deposit_amount", v ? Number(v) : null)}
                  label="Protected amount"
                  displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
                />
              </div>
            </div>
          </SectionCard>

          <DepositRulePanel
            countryCode={jur.countryCode}
            region={jur.region}
            monthlyRent={monthlyRent}
            currency={jur.currency}
            currentDeposit={t.deposit || null}
          />

          <SectionCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">Potential Deductions</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <span className="text-sm text-slate-500">£0 — No proposed deductions</span>
            </div>
            {showDeductionForm ? (
              <div className="mt-3 flex flex-col gap-2">
                <textarea
                  value={deductionNote}
                  onChange={e => setDeductionNote(e.target.value)}
                  rows={3}
                  placeholder="Describe the deduction (e.g. cleaning, damage repair, unpaid rent)…"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDeduction}
                    disabled={!deductionNote.trim() || savingDeduction}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />{savingDeduction ? "Saving…" : "Save deduction"}
                  </button>
                  <button
                    onClick={() => { setShowDeductionForm(false); setDeductionNote("") }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Deduction notes are saved to the tenancy record and visible in the Notes tab.</p>
              </div>
            ) : (
              <button
                onClick={() => setShowDeductionForm(true)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand)]"
              >
                <Plus className="w-3.5 h-3.5" /> Add deduction
              </button>
            )}
          </SectionCard>

          <SectionCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">Dispute Status</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <span className="text-sm text-slate-500">None — No disputes raised</span>
            </div>
          </SectionCard>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <SectionCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-800">Release Workflow</span>
              <span className="text-xs text-slate-500">Ending tenancy marks it as ended</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Tenant has given notice", done: false },
                { label: "Inspection completed", done: false },
                { label: "Deductions confirmed", done: false },
                { label: "Deposit released", done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    step.done ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-white"
                  )}>
                    {step.done && <Check className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <span className="text-sm text-slate-700">{step.label}</span>
                  <span className="ml-auto text-xs text-slate-500">{step.done ? "Done" : "Pending"}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-[var(--brand)] h-1.5 rounded-full" style={{ width: "0%" }} />
            </div>
            {showEndConfirm ? (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-red-800">End this tenancy?</p>
                <p className="text-xs text-red-700">This will mark the tenancy as ended. The tenant record and deposit details are preserved.</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEndTenancy}
                    disabled={endingTenancy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {endingTenancy ? "Ending…" : "Confirm — end tenancy"}
                  </button>
                  <button
                    onClick={() => setShowEndConfirm(false)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowEndConfirm(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[var(--brand)] rounded-xl py-2.5 hover:bg-[var(--brand-strong)] transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" /> Start Release Process
              </button>
            )}
          </SectionCard>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Deposit return deadline</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {depositRule.returnWindowDays != null
                  ? `Indicative return window for ${depositRule.jurisdiction}: within ${depositRule.returnWindowDays} days of tenancy end. Verify against the scheme rules.`
                  : "Return the deposit promptly at tenancy end and verify the timescale against your jurisdiction's scheme rules."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
