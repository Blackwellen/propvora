"use client"

import React, { useState } from "react"
import { useSectionRouter, useSectionLink } from "@/components/sections/SectionBasePath"
import { Building2, User, Calendar, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { AccountingWizardShell, DebitCreditLinesEditor } from "@/features/accounting/components"
import type { DebitCreditLine } from "@/features/accounting/components/DebitCreditLinesEditor"
import MobileTopBar from "@/components/mobile/MobileTopBar"

const WIZARD_STEPS = [
  { number: 1, label: "Transaction Details" },
  { number: 2, label: "Debit / Credit Lines" },
  { number: 3, label: "Attachments" },
  { number: 4, label: "Review & Post" },
]

export default function ManualTransactionPage() {
  const router = useSectionRouter()
  const sectionLink = useSectionLink()
  const [step, setStep] = useState(1)
  const [lines, setLines] = useState<DebitCreditLine[]>([])
  const totalDebits = lines.filter((l) => l.type === "Debit").reduce((s, l) => s + l.grossAmount, 0)
  const totalCredits = lines.filter((l) => l.type === "Credit").reduce((s, l) => s + l.grossAmount, 0)
  const isBalanced = lines.length > 0 && Math.abs(totalDebits - totalCredits) < 0.01

  const leftContent = (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Transaction Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enter the core details for this transaction.</p>
          </div>
          <Button variant="outline" size="sm">Templates ▼</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Transaction Date <span className="text-[#EF4444]">*</span></label>
            <div className="relative">
              <input
                type="date"
                className="w-full h-9 px-3 pr-9 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Property <span className="text-[#EF4444]">*</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
                <option value="">Select a property…</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Contact / Supplier</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Contact or supplier name"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Transaction Type <span className="text-[#EF4444]">*</span></label>
            <select className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
              <option>Expense</option>
              <option>Income</option>
              <option>Transfer</option>
              <option>Adjustment</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Reference</label>
            <input
              type="text"
              defaultValue="EXP-2026-04-0001"
              className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Tax Code</label>
            <select className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
              <option>20% (Standard Rate)</option>
              <option>5% (Reduced Rate)</option>
              <option>Exempt</option>
              <option>Zero</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Description <span className="text-[#EF4444]">*</span></label>
            <input
              type="text"
              defaultValue="Repairs & maintenance materials for common areas"
              className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              defaultValue="Replacement of lighting fixtures in main lobby and corridors. Invoice INV-38492."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 resize-none"
            />
          </div>
        </div>
      </div>

      <DebitCreditLinesEditor lines={lines} onChange={setLines} />
    </div>
  )

  const rightRail = (
    <>
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Transaction Summary</h3>
        <div className="space-y-2">
          {[
            { label: "Status", value: <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">Draft</span> },
            { label: "Created By", value: "James Taylor" },
            { label: "Created On", value: "28 Apr 2026, 13:58" },
            { label: "Last Updated", value: "Just now" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">{item.label}</span>
              {typeof item.value === "string"
                ? <span className="text-xs font-semibold text-slate-900">{item.value}</span>
                : item.value}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Transaction Overview</h3>
        <div className="space-y-2.5">
          {[
            { icon: "✦", label: "Transaction Type", value: "—" },
            { icon: "🏠", label: "Property", value: "—" },
            { icon: "👤", label: "Contact / Supplier", value: "—" },
            { icon: "📅", label: "Transaction Date", value: "—" },
            { icon: "📄", label: "Reference", value: "—" },
            { icon: "🏷", label: "Tax Code", value: "—" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2.5">
              <span className="text-sm shrink-0">{item.icon}</span>
              <div>
                <p className="text-[11px] text-slate-500">{item.label}</p>
                <p className="text-xs font-semibold text-slate-900">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Line Summary</h3>
        <div className="space-y-2">
          {[
            { label: "Total Lines", value: String(lines.length) },
            { label: "Total Net Amount", value: `£${lines.reduce((s, l) => s + l.netAmount, 0).toFixed(2)}` },
            { label: "Total VAT", value: `£${lines.reduce((s, l) => s + l.vatAmount, 0).toFixed(2)}` },
            { label: "Total Gross Amount", value: `£${lines.reduce((s, l) => s + l.grossAmount, 0).toFixed(2)}` },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{item.label}</span>
              <span className="text-xs font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
            <span className="text-xs text-slate-500">Balance</span>
            <span className={cn("text-xs font-bold", isBalanced ? "text-[#10B981]" : "text-[#EF4444]")}>
              {lines.length === 0 ? "No lines" : isBalanced ? "Balanced ✓" : "Unbalanced"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Balanced double-entry transactions are posted from the Journal Ledger, where debits are
            validated against credits before posting. Posted entries are immutable and corrected via reversal.
          </p>
        </div>
      </div>
    </>
  )

  const footer = (
    <>
      <Button variant="outline" size="sm" onClick={() => router.push("/property-manager/accounting/accounts/journal-ledger")}>Cancel</Button>
      {step < 4 ? (
        <Button variant="primary" size="sm" onClick={() => setStep(Math.min(step + 1, 4))}>Next →</Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          disabled={!isBalanced}
          onClick={() => router.push("/property-manager/accounting/accounts/journal-ledger")}
        >
          Post in Journal Ledger →
        </Button>
      )}
    </>
  )

  return (
    <>
    <MobileTopBar title="Manual Transaction" subtitle="Reconciliation" showBack backHref={sectionLink("/property-manager/accounting/reconciliation")} />
    <AccountingWizardShell
      breadcrumbNumber="09"
      breadcrumbLabel="Create Manual Transaction"
      title="Create Manual Transaction"
      badge="Draft"
      subtitle="Manually enter a transaction and post it to your ledger using double-entry accounting."
      steps={WIZARD_STEPS}
      currentStep={step}
      leftContent={leftContent}
      rightRail={rightRail}
      footer={footer}
    />
    </>
  )
}
