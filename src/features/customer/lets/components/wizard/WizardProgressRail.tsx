import { CheckCircle2, Circle } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import type { Application } from "../../../data/lets"

interface Props {
  steps: string[]
  currentStep: number
  app: Application
}

export default function WizardProgressRail({ steps, currentStep, app }: Props) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2">Application progress</p>
        <ul className="space-y-1.5">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2 text-[12px]">
              {i < currentStep ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : i === currentStep ? (
                <Circle className="w-4 h-4 text-blue-500 shrink-0 fill-blue-100" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
              )}
              <span className={i <= currentStep ? "text-slate-700 font-medium" : "text-slate-400"}>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[12px] font-semibold text-slate-700 mb-2">Linked property</p>
        <div className="flex gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={app.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" />
          <div>
            <p className="text-[12.5px] font-semibold text-slate-800">{app.property}</p>
            <p className="text-[11px] text-slate-400">{app.location}</p>
            <p className="text-[12px] font-bold text-slate-900 mt-0.5">
              {formatPence(app.rentPence, "GBP")}
              <span className="text-[10px] text-slate-400 font-normal">/mo</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
        <p className="text-[12px] font-semibold text-slate-700 mb-2">Affordability snapshot</p>
        <div className="relative w-24 h-24 mx-auto">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeDasharray={`${app.affordabilityPct} 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[18px] font-bold text-slate-900">{app.affordabilityPct}%</span>
            <span className="text-[9px] text-slate-400">of income</span>
          </div>
        </div>
        <p className="text-[10.5px] text-emerald-600 font-semibold mt-1">Comfortably affordable</p>
      </div>
    </div>
  )
}
