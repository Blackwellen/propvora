"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Save, ChevronRight, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import type { Application } from "../data/lets"
import WizardStepper from "./components/wizard/WizardStepper"
import WizardProgressRail from "./components/wizard/WizardProgressRail"
import WizardStepPanel from "./components/wizard/WizardStepPanel"
import WizardSummaryRail from "./components/wizard/WizardSummaryRail"

const STEPS = ["Applicant Details", "Income", "References", "Guarantor", "Documents", "Review & Submit"]

const UPLOAD_GROUPS: Record<number, { title: string; items: string[] }[]> = {
  0: [{ title: "Personal details", items: ["Full legal name", "Date of birth", "Current address", "Contact details"] }],
  1: [{ title: "Income verification", items: ["Latest 3 payslips", "Bank statements (3 months)", "Employment contract"] }],
  2: [{ title: "References", items: ["Employer reference", "Previous landlord reference", "Character reference"] }],
  3: [{ title: "Guarantor", items: ["Guarantor details", "Guarantor ID", "Guarantor proof of income"] }],
  4: [
    { title: "Identity & Right to Rent", items: ["Passport", "Right to Rent proof"] },
    { title: "Income verification", items: ["Payslips", "Bank statements", "Employment contract"] },
    { title: "Additional documents", items: ["Proof of address", "Other (optional)"] },
  ],
  5: [{ title: "Review & submit", items: ["Confirm all details", "Accept terms", "Submit application"] }],
}

export default function ApplicationWizard({ app, appId }: { app: Application; appId: string }) {
  const { toast } = useCustomerToast()
  const [step, setStep] = useState(4)
  const storeKey = `propvora.appwizard.${appId}`

  // Persist progress (client stub; TODO(supabase): customer_let_application_steps)
  useEffect(() => {
    try { const raw = localStorage.getItem(storeKey); if (raw) setStep(JSON.parse(raw).step ?? 4) } catch { /* ignore */ }
  }, [storeKey])
  function persist(next: number) {
    setStep(next)
    try { localStorage.setItem(storeKey, JSON.stringify({ step: next, savedAt: Date.now() })) } catch { /* ignore */ }
  }

  function saveDraft() { persist(step); toast("Draft saved", "success") }
  function back() { if (step > 0) persist(step - 1) }
  function next() {
    if (step < STEPS.length - 1) { persist(step + 1); toast("Progress saved", "success") }
    else { toast("Application submitted", "success") }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="text-[12px] text-slate-400 flex items-center gap-1.5 mb-1">
            <Link href="/customer/lets?tab=applications" className="hover:text-slate-600">Applications</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-600">{appId}</span>
          </nav>
          <h1 className="text-[24px] font-bold text-slate-900">Application Wizard</h1>
          <p className="text-[13px] text-slate-500 mt-1">Complete your application to secure the home — your progress is saved automatically.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={saveDraft} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50">
            <Save className="w-4 h-4" /> Save draft
          </button>
          <button onClick={back} disabled={step === 0} className={cn("inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold", step === 0 ? "text-slate-300" : "text-slate-700 hover:bg-slate-50")}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={next} className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white rounded-xl px-3 py-2 text-[12.5px] font-semibold">
            {step === STEPS.length - 1 ? "Submit" : "Next"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-[12.5px] leading-relaxed text-slate-600">
          <strong className="text-slate-700">Why we ask for these documents.</strong> Your letting agent or
          landlord is legally required to carry out a <strong>Right to Rent</strong> check (Immigration Act 2014,
          England) and referencing before granting a tenancy. You supply your ID and documents here; the
          property manager performs and records the check — Propvora only provides the secure workflow.
        </p>
      </div>

      <WizardStepper steps={STEPS} currentStep={step} onStepClick={persist} />

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr_300px] gap-5 items-start">
        <WizardProgressRail steps={STEPS} currentStep={step} app={app} />
        <WizardStepPanel stepName={STEPS[step]} stepIndex={step} groups={UPLOAD_GROUPS[step]} />
        <WizardSummaryRail steps={STEPS} currentStep={step} app={app} />
      </div>
    </div>
  )
}
