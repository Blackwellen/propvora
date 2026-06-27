import { FileCheck2, ShieldCheck, User, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import type { Application } from "../../../data/lets"

interface Props {
  steps: string[]
  currentStep: number
  app: Application
}

function Row({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex items-center justify-between text-[12px] py-0.5">
      <span className="text-slate-500">{l}</span>
      <span className="text-slate-700 font-semibold">{r}</span>
    </div>
  )
}

export default function WizardSummaryRail({ steps, currentStep, app }: Props) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2">Application summary</p>
        <Row l="Monthly rent" r={formatPence(app.rentPence, "GBP")} />
        <Row l="Security deposit" r={formatPence(app.rentPence + 2000, "GBP")} />
        <Row l="Holding deposit" r={formatPence(Math.round(app.rentPence * 0.23), "GBP")} />
        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100">
          <span className="text-[12.5px] font-semibold text-slate-700">Total upfront</span>
          <span className="text-[13px] font-bold text-slate-900">{formatPence(app.rentPence * 2 + 2000, "GBP")}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2">Application checklist</p>
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 py-1">
            <FileCheck2 className={cn("w-3.5 h-3.5", i < currentStep ? "text-emerald-500" : "text-slate-300")} />
            <span className="text-[11.5px] text-slate-600">{s}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[12px] font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <User className="w-4 h-4 text-slate-400" /> Applicant
        </p>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-full bg-slate-200" />
          <div>
            <p className="text-[12px] font-semibold text-slate-800">You</p>
            <p className="text-[10.5px] text-slate-400">Lead applicant · Verified</p>
          </div>
        </div>
        <p className="text-[12px] font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-slate-400" /> Guarantor
        </p>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-slate-200" />
          <div>
            <p className="text-[12px] font-semibold text-slate-800">—</p>
            <p className="text-[10.5px] text-slate-400">Guarantor · Pending</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--brand-soft)]/70 border border-[var(--color-brand-100)] rounded-2xl p-3 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-slate-600">
          Your data is encrypted and only shared with the landlord and referencing partner for this application.
        </p>
      </div>
    </div>
  )
}
