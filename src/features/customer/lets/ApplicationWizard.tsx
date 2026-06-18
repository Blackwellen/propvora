"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, Save, CheckCircle2, Circle, Upload, FileCheck2, Gauge, ShieldCheck,
  User, UserCheck, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { findApplication, applications, type Application } from "../data/lets"

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
          <nav className="text-[12px] text-slate-400 flex items-center gap-1.5 mb-1"><Link href="/customer/lets?tab=applications" className="hover:text-slate-600">Applications</Link><ChevronRight className="w-3.5 h-3.5" /><span className="text-slate-600">{appId}</span></nav>
          <h1 className="text-[24px] font-bold text-slate-900">Application Wizard</h1>
          <p className="text-[13px] text-slate-500 mt-1">Complete your application to secure the home — your progress is saved automatically.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={saveDraft} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Save className="w-4 h-4" /> Save draft</button>
          <button onClick={back} disabled={step === 0} className={cn("inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold", step === 0 ? "text-slate-300" : "text-slate-700 hover:bg-slate-50")}><ArrowLeft className="w-4 h-4" /> Back</button>
          <button onClick={next} className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white rounded-xl px-3 py-2 text-[12.5px] font-semibold">{step === STEPS.length - 1 ? "Submit" : "Next"} <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <ol className="flex items-start justify-between gap-2">
          {STEPS.map((s, i) => {
            const done = i < step; const current = i === step
            return (
              <li key={s} className="flex-1 flex flex-col items-center text-center relative">
                {i < STEPS.length - 1 && <span className={cn("absolute top-[14px] left-1/2 w-full h-0.5", done ? "bg-emerald-400" : "bg-slate-200")} />}
                <button onClick={() => persist(i)} className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold z-10", done ? "bg-emerald-500 text-white" : current ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400")}>{done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}</button>
                <p className={cn("text-[11px] font-semibold mt-2", current ? "text-blue-600" : done ? "text-slate-700" : "text-slate-400")}>{s}</p>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr_300px] gap-5 items-start">
        {/* Left: progress + property + affordability */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2">Application progress</p>
            <ul className="space-y-1.5">
              {STEPS.map((s, i) => <li key={s} className="flex items-center gap-2 text-[12px]">{i < step ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : i === step ? <Circle className="w-4 h-4 text-blue-500 shrink-0 fill-blue-100" /> : <Circle className="w-4 h-4 text-slate-300 shrink-0" />}<span className={i <= step ? "text-slate-700 font-medium" : "text-slate-400"}>{s}</span></li>)}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[12px] font-semibold text-slate-700 mb-2">Linked property</p>
            <div className="flex gap-2.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={app.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" /><div><p className="text-[12.5px] font-semibold text-slate-800">{app.property}</p><p className="text-[11px] text-slate-400">{app.location}</p><p className="text-[12px] font-bold text-slate-900 mt-0.5">{formatPence(app.rentPence, "GBP")}<span className="text-[10px] text-slate-400 font-normal">/mo</span></p></div></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-[12px] font-semibold text-slate-700 mb-2">Affordability snapshot</p>
            <div className="relative w-24 h-24 mx-auto">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" /><circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${app.affordabilityPct} 100`} strokeLinecap="round" /></svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[18px] font-bold text-slate-900">{app.affordabilityPct}%</span><span className="text-[9px] text-slate-400">of income</span></div>
            </div>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-1">Comfortably affordable</p>
          </div>
        </div>

        {/* Center: current step */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[15px] font-bold text-slate-900">{STEPS[step]}</h3>
          <p className="text-[12.5px] text-slate-500 mt-1 mb-4">{step === 4 ? "Upload the required documents to support your application. All files are encrypted and securely stored." : "Complete this step to continue your application."}</p>
          <div className="space-y-5">
            {UPLOAD_GROUPS[step].map((g) => (
              <div key={g.title}>
                <p className="text-[12.5px] font-semibold text-slate-700 mb-2">{g.title}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {g.items.map((it) => (
                    <button key={it} onClick={() => toast(`Upload “${it}” (upload-only) — coming soon`, "info")} className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50/30 transition">
                      <span className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0"><Upload className="w-4 h-4" /></span>
                      <div className="min-w-0"><p className="text-[12.5px] font-semibold text-slate-800 truncate">{it}</p><p className="text-[10.5px] text-slate-400">Drag &amp; drop or click to upload</p></div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: summary */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2">Application summary</p>
            <Row l="Monthly rent" r={formatPence(app.rentPence, "GBP")} />
            <Row l="Security deposit" r={formatPence(app.rentPence + 2000, "GBP")} />
            <Row l="Holding deposit" r={formatPence(Math.round(app.rentPence * 0.23), "GBP")} />
            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100"><span className="text-[12.5px] font-semibold text-slate-700">Total upfront</span><span className="text-[13px] font-bold text-slate-900">{formatPence(app.rentPence * 2 + 2000, "GBP")}</span></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2">Application checklist</p>
            {STEPS.map((s, i) => <div key={s} className="flex items-center gap-2 py-1"><FileCheck2 className={cn("w-3.5 h-3.5", i < step ? "text-emerald-500" : "text-slate-300")} /><span className="text-[11.5px] text-slate-600">{s}</span></div>)}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[12px] font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> Applicant</p>
            <div className="flex items-center gap-2 mb-3"><span className="w-8 h-8 rounded-full bg-slate-200" /><div><p className="text-[12px] font-semibold text-slate-800">Sarah Johnson</p><p className="text-[10.5px] text-slate-400">Lead applicant · Verified</p></div></div>
            <p className="text-[12px] font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-slate-400" /> Guarantor</p>
            <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-slate-200" /><div><p className="text-[12px] font-semibold text-slate-800">James Carter</p><p className="text-[10.5px] text-slate-400">Guarantor · Pending</p></div></div>
          </div>
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><p className="text-[11.5px] text-slate-600">Your data is encrypted and only shared with the landlord and referencing partner for this application.</p></div>
        </div>
      </div>
    </div>
  )
}

function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[12px] py-0.5"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-semibold">{r}</span></div>
}
