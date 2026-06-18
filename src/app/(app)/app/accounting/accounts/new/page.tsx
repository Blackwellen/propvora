"use client"
import { useSectionLink } from "@/components/sections/SectionBasePath"

import React, { useState } from "react"
import Link from "next/link"
import { Info, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { AccountingWizardShell } from "@/features/accounting/components"
import MobileTopBar from "@/components/mobile/MobileTopBar"

const WIZARD_STEPS = [
  { number: 1, label: "Account Details", sublabel: "Define the account" },
  { number: 2, label: "Mapping", sublabel: "Link to categories & taxes" },
  { number: 3, label: "Opening Balances", sublabel: "Set starting position" },
  { number: 4, label: "Review", sublabel: "Confirm and create" },
]

const ACCOUNT_TYPES = ["Assets", "Liabilities", "Equity", "Income", "Expenses"]
const SUBCATEGORIES: Record<string, string[]> = {
  Assets: ["Current Assets", "Fixed Assets", "Intangible Assets"],
  Liabilities: ["Current Liabilities", "Non-Current Liabilities"],
  Equity: ["Capital", "Reserves", "Retained Earnings"],
  Income: ["Operating Income", "Other Income", "Rental Income"],
  Expenses: ["Operating", "Finance", "Administrative"],
}
const CURRENCIES = ["GBP – British Pound", "USD – US Dollar", "EUR – Euro"]
const SCOPES = ["Portfolio", "Property", "All Portfolios", "Propvora Estates"]

export default function NewAccountPage() {
  const sectionLink = useSectionLink()
  const [step, setStep] = useState(1)
  const [code, setCode] = useState("4000")
  const [name, setName] = useState("Rent Income")
  const [accountType, setAccountType] = useState("Income")
  const [subcategory, setSubcategory] = useState("Rental Income")
  const [currency, setCurrency] = useState("GBP – British Pound")
  const [scope, setScope] = useState("Portfolio")
  const [description, setDescription] = useState("Income from residential and commercial property rents.")

  const codeValid = code.length >= 3
  const nameValid = name.length >= 2

  const leftContent = (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Account Details</h3>
        <p className="text-xs text-slate-500 mb-5">Define the core properties of this account.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Account Code <span className="text-[#EF4444]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 4000"
                className={cn(
                  "w-full h-9 px-3 pr-9 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition-colors",
                  codeValid ? "border-[#10B981]" : "border-[#E2E8F0]"
                )}
              />
              {codeValid && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981]" />}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Account Name <span className="text-[#EF4444]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rent Income"
                className={cn(
                  "w-full h-9 px-3 pr-9 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition-colors",
                  nameValid ? "border-[#10B981]" : "border-[#E2E8F0]"
                )}
              />
              {nameValid && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981]" />}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Account Type <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={accountType}
              onChange={(e) => { setAccountType(e.target.value); setSubcategory("") }}
              className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            >
              {ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Subcategory <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            >
              <option value="">Select subcategory...</option>
              {(SUBCATEGORIES[accountType] ?? []).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Currency <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            >
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Property Scope <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            >
              {SCOPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={255}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 resize-none"
              placeholder="Optional description for this account..."
            />
            <span className="absolute bottom-2 right-3 text-[11px] text-slate-500">{description.length}/255</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">Currency cannot be changed after the account is created.</p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">Scope determines which transactions can use this account.</p>
          </div>
        </div>
      </div>
    </div>
  )

  const rightRail = (
    <>
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Account Preview</h3>
        <div className="space-y-3">
          {[
            { label: "Account Code", value: code || "—" },
            { label: "Account Name", value: name || "—" },
            { label: "Account Type", value: accountType },
            { label: "Subcategory", value: subcategory || "—" },
            { label: "Currency", value: currency },
            { label: "Property Scope", value: scope },
          ].map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-2">
              <span className="text-xs text-slate-500 shrink-0">{item.label}</span>
              <span className="text-xs font-semibold text-slate-900 text-right">{item.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
            <span className="text-xs text-slate-500">Default Status</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">Active</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">What&apos;s next?</h3>
        <div className="space-y-3">
          {[
            { step: "Step 2 – Mapping", desc: "Link this account to HMRC categories and tax treatments." },
            { step: "Step 3 – Opening Balances", desc: "Set the starting balance for this account." },
            { step: "Step 4 – Review", desc: "Confirm details before creating the account." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-700">{item.step}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const footer = (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={sectionLink("/app/accounting/accounts/overview")}>Cancel</Link>
        </Button>
        <Button variant="outline" size="sm">Save as Draft</Button>
      </div>
      <Button variant="primary" size="sm" onClick={() => setStep(2)}>
        Continue to Mapping →
      </Button>
    </>
  )

  return (
    <>
    <MobileTopBar title="New Account" subtitle="Accounting" showBack backHref={sectionLink("/app/accounting/accounts/overview")} />
    <AccountingWizardShell
      breadcrumbNumber="08"
      breadcrumbLabel="New Account"
      title="New Account"
      subtitle="Create a new account in your chart of accounts."
      steps={WIZARD_STEPS}
      currentStep={step}
      leftContent={leftContent}
      rightRail={rightRail}
      footer={footer}
    />
    </>
  )
}
