"use client"

import React, { useState } from "react"
import Link from "next/link"
import { CheckSquare, Square, Calendar, FileDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { AccountingWizardShell } from "@/features/accounting/components"
import MobileTopBar from "@/components/mobile/MobileTopBar"

const WIZARD_STEPS = [
  { number: 1, label: "Select Reports" },
  { number: 2, label: "Filters & Options" },
  { number: 3, label: "Recipients" },
  { number: 4, label: "Generate" },
]

const ALL_REPORTS = [
  { id: "pl", name: "Profit & Loss", desc: "Income and expense summary for a period", category: "Financial" },
  { id: "tb", name: "Trial Balance", desc: "All account balances at a point in time", category: "Financial" },
  { id: "bs", name: "Balance Sheet", desc: "Assets, liabilities and equity", category: "Financial" },
  { id: "cf", name: "Cash Flow", desc: "Cash inflows and outflows", category: "Financial" },
  { id: "ar", name: "Aged Receivables", desc: "Outstanding amounts owed to you", category: "Debtors" },
  { id: "ap", name: "Aged Payables", desc: "Outstanding amounts you owe", category: "Creditors" },
  { id: "tax", name: "Tax Pack", desc: "Quarterly MTD-ready tax summary", category: "Tax" },
  { id: "prop", name: "Property Performance", desc: "Income and expenses per property", category: "Property" },
]

export default function ReportGeneratePage() {
  const [step, setStep] = useState(1)
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set(["pl", "bs"]))
  const [period, setPeriod] = useState("Q1 2026 (Apr – Jun)")
  const [format, setFormat] = useState("PDF")
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeAudit, setIncludeAudit] = useState(false)
  const [includeSchedules, setIncludeSchedules] = useState(true)
  const [recipients, setRecipients] = useState<string[]>([])
  const [recipientInput, setRecipientInput] = useState("")
  const [scheduleRepeat, setScheduleRepeat] = useState(false)

  function toggleReport(id: string) {
    setSelectedReports((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addRecipient(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && recipientInput.trim().includes("@")) {
      setRecipients([...recipients, recipientInput.trim()])
      setRecipientInput("")
    }
  }

  const stepContent = [
    // Step 1 — Select Reports
    <div key="step1" className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Select Reports</h3>
        <p className="text-xs text-slate-500 mb-5">Choose one or more reports to include in this pack.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_REPORTS.map((r) => {
            const selected = selectedReports.has(r.id)
            return (
              <div
                key={r.id}
                onClick={() => toggleReport(r.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  selected ? "border-[#2563EB] bg-blue-50/30" : "border-[#E2E8F0] hover:border-slate-300"
                )}
              >
                {selected
                  ? <CheckSquare className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  : <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />}
                <div>
                  <p className={cn("text-sm font-semibold", selected ? "text-[#2563EB]" : "text-slate-800")}>{r.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1 block">{r.category}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
          <span className="text-xs text-slate-500">{selectedReports.size} of {ALL_REPORTS.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedReports(new Set(ALL_REPORTS.map((r) => r.id)))}
              className="text-xs font-medium text-[#2563EB] hover:text-[#1d4ed8]"
            >
              Select all
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setSelectedReports(new Set())}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>,

    // Step 2 — Filters & Options
    <div key="step2" className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Filters &amp; Options</h3>
        <p className="text-xs text-slate-500 mb-5">Configure how this report pack will be generated.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            >
              <option>Q1 2026 (Apr – Jun)</option>
              <option>Q4 2025 (Jan – Mar)</option>
              <option>FY 2025/26</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Currency</label>
            <select className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
              <option>GBP – British Pound</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Property Scope</label>
            <select className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
              <option>All Portfolios</option>
              <option>Maple Avenue</option>
              <option>Oakwood House</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Format</label>
            <div className="flex gap-2">
              {["PDF", "XLSX", "CSV"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-sm font-semibold transition-all",
                    format === f ? "bg-[#2563EB] text-white" : "border border-[#E2E8F0] text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Include in report</p>
          {[
            { label: "Include charts", value: includeCharts, set: setIncludeCharts },
            { label: "Include audit notes", value: includeAudit, set: setIncludeAudit },
            { label: "Include supporting schedules", value: includeSchedules, set: setIncludeSchedules },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={opt.value}
                onChange={(e) => opt.set(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>,

    // Step 3 — Recipients
    <div key="step3" className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Recipients</h3>
        <p className="text-xs text-slate-500 mb-5">Choose who will receive this report pack.</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Add Email Address</label>
            <input
              type="email"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyDown={addRecipient}
              placeholder="email@example.com — press Enter to add"
              className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>
          {recipients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipients.map((r) => (
                <span key={r} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-medium">
                  {r}
                  <button onClick={() => setRecipients(recipients.filter((x) => x !== r))} className="hover:text-[#1d4ed8]">×</button>
                </span>
              ))}
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduleRepeat}
              onChange={(e) => setScheduleRepeat(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
            />
            <span className="text-sm text-slate-700">Schedule as a recurring report</span>
          </label>
          {scheduleRepeat && (
            <div className="flex gap-3 pl-7">
              <select className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Weekly</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>,

    // Step 4 — Generate
    <div key="step4" className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Review &amp; Generate</h3>
        <p className="text-xs text-slate-500 mb-5">Review your report pack configuration before generating.</p>
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Selected Reports ({selectedReports.size})</p>
            <div className="flex flex-wrap gap-2">
              {ALL_REPORTS.filter((r) => selectedReports.has(r.id)).map((r) => (
                <span key={r.id} className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] text-xs font-semibold">{r.name}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Period", value: period },
              { label: "Format", value: format },
              { label: "Recipients", value: recipients.length > 0 ? `${recipients.length} added` : "None" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-xl border border-[#E2E8F0] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{item.label}</p>
                <p className="text-sm font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <Button variant="primary" size="md" className="flex-1">
              <FileDown className="w-4 h-4 mr-2" />
              Generate Pack Now
            </Button>
            <Button variant="outline" size="md" className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Pack
            </Button>
          </div>
        </div>
      </div>
    </div>,
  ]

  const footer = (
    <>
      <div className="flex items-center gap-2">
        {step > 1 && (
          <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>← Back</Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/accounting/reports">Cancel</Link>
        </Button>
      </div>
      {step < 4 && (
        <Button variant="primary" size="sm" onClick={() => setStep(step + 1)}>
          {step === 3 ? "Review →" : "Next →"}
        </Button>
      )}
    </>
  )

  return (
    <>
    <MobileTopBar title="Generate Report Pack" subtitle="Reports" showBack backHref="/app/accounting/reports" />
    <AccountingWizardShell
      breadcrumbNumber="12"
      breadcrumbLabel="Generate Report Pack"
      title="Generate Report Pack"
      subtitle="Select reports, configure options, add recipients and generate your pack."
      steps={WIZARD_STEPS}
      currentStep={step}
      leftContent={stepContent[step - 1]}
      footer={footer}
    />
    </>
  )
}
