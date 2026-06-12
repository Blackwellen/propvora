"use client"

import React from "react"
import { Globe, Check } from "lucide-react"

const FEATURES = [
  "Hide 'Powered by Propvora' branding",
  "Custom brand name across platform",
  "Custom support email in notifications",
  "Branded landlord & tenant portals",
  "Custom invoice and report headers",
  "Custom login screen (Enterprise)",
]

const LOCKED_FIELDS = [
  "Custom brand name",
  "Hide Propvora branding",
  "Custom support email",
  "Custom portal branding",
  "Custom domain readiness",
]

export default function WhiteLabelPage() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">White Label</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Custom branding, portals and identity for your business</p>
      </div>

      {/* Locked state card */}
      <div className="bg-white rounded-2xl border border-violet-200 p-10 text-center max-w-[560px] mx-auto mt-8">
        <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-5">
          <div style={{ color: "#7C3AED" }}><Globe className="w-7 h-7" /></div>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wide">
          Agency Plan or Add-on Required
        </span>
        <h2 className="text-[18px] font-black text-slate-900 mt-4 mb-2">White Label Branding</h2>
        <p className="text-[13.5px] text-slate-500 mb-6">
          Remove Propvora branding, use your own logo and colours, configure custom support email, and deliver a fully branded experience to your landlords and tenants.
        </p>
        <div className="text-left bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <div style={{ color: "#7C3AED" }}><Check className="w-2.5 h-2.5" /></div>
              </div>
              <p className="text-[12.5px] text-slate-700">{f}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-[#6d28d9] transition-colors">
            Upgrade to Agency
          </button>
          <button className="flex-1 py-3 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Add-on · £39/mo
          </button>
        </div>
      </div>

      {/* Grayed-out preview of locked settings */}
      <div className="mt-8 opacity-40 pointer-events-none max-w-[560px] mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-[14px] font-bold text-slate-900 mb-4">White Label Settings</h3>
          {LOCKED_FIELDS.map(field => (
            <div key={field} className="py-3 border-b border-slate-100 last:border-0">
              <div className="h-3 bg-slate-200 rounded w-40 mb-2" />
              <div className="h-8 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
          <div className="mt-4">
            <div className="h-3 bg-slate-200 rounded w-32 mb-2" />
            <div className="flex gap-2">
              <div className="h-8 bg-slate-100 rounded-xl flex-1" />
              <div className="h-8 bg-[#7C3AED]/20 rounded-xl w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
