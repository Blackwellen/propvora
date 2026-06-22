"use client"
import { useSectionLink } from "@/components/sections/SectionBasePath"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { AccountingWizardShell } from "@/features/accounting/components"
import MobileTopBar from "@/components/mobile/MobileTopBar"

const WIZARD_STEPS = [
  { number: 1, label: "Disbursement Details" },
  { number: 2, label: "Review & Submit" },
]

export default function NewDisbursementPage() {
  const sectionLink = useSectionLink()
  const [step, setStep] = useState(1)
  const [client, setClient] = useState("")
  const [payee, setPayee] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("Repairs & Maintenance")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const leftContent = (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-1">Disbursement Details</h3>
      <p className="text-xs text-slate-500 mb-5">Enter the details for this client money disbursement.</p>
      {notice && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">{notice}</div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Client / Landlord <span className="text-[#EF4444]">*</span></label>
          <select
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          >
            <option value="">Select a client / landlord…</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Property (Optional)</label>
          <input
            type="text"
            placeholder="Property address (optional)"
            className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Payee <span className="text-[#EF4444]">*</span></label>
          <input
            type="text"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Amount <span className="text-[#EF4444]">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Disbursement Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Reason / Category <span className="text-[#EF4444]">*</span></label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          >
            <option>Repairs &amp; Maintenance</option>
            <option>Management Fees</option>
            <option>Utilities</option>
            <option>Insurance</option>
            <option>Professional Fees</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Bank Destination</label>
          <div className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 flex items-center text-sm text-slate-500">
            Client account destination set in Accounting settings
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Supporting Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Approval Status</label>
          <div className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 flex items-center text-sm text-slate-600">
            Pending Approval
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-100">
          <span className="text-amber-500 text-lg leading-none shrink-0">⚠</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            This disbursement requires approval before it can be processed. Two-step approval is enabled for this account.
          </p>
        </div>
      </div>
    </div>
  )

  const rightRail = (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Disbursement Summary</h3>
      <div className="space-y-2">
        {[
          { label: "Client", value: client.split(" (")[0] },
          { label: "Payee", value: payee },
          { label: "Amount", value: `£${parseFloat(amount || "0").toFixed(2)}` },
          { label: "Category", value: reason },
          { label: "Date", value: date },
          { label: "Approval", value: "Pending" },
        ].map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-2">
            <span className="text-xs text-slate-500">{item.label}</span>
            <span className="text-xs font-semibold text-slate-900 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const footer = (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href={sectionLink("/property-manager/accounting/client-accounts")}>Cancel</Link>
      </Button>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            if (step === 1) {
              if (!client || !payee || !amount) { setNotice("Client, payee and amount are required."); return }
              setNotice(null)
              setStep(2)
            } else {
              setNotice("Client-money disbursements require the client accounts ledger, which isn't provisioned in this workspace yet.")
            }
          }}
        >
          {step === 1 ? "Next: Review →" : "Submit for Approval"}
        </Button>
      </div>
    </>
  )

  return (
    <>
    <MobileTopBar title="New Disbursement" subtitle="Client Accounts" showBack backHref={sectionLink("/property-manager/accounting/client-accounts")} />
    <AccountingWizardShell
      breadcrumbNumber="11"
      breadcrumbLabel="New Disbursement"
      title="New Disbursement"
      subtitle="Process a client money disbursement with full audit trail."
      steps={WIZARD_STEPS}
      currentStep={step}
      leftContent={leftContent}
      rightRail={rightRail}
      footer={footer}
    />
    </>
  )
}
