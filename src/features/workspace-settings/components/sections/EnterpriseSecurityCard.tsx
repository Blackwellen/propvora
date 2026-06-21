"use client"

import React from "react"
import { Lock } from "lucide-react"

const ENTERPRISE_FEATURES = [
  "IP Allowlist",
  "Domain Allowlist",
  "Advanced Session Policies",
  "Custom Password Policy",
  "Audit Trail Retention",
]

export function EnterpriseSecurityCard() {
  return (
    <div className="bg-white rounded-2xl border border-violet-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div style={{ color: "#7C3AED" }}>
          <Lock className="w-5 h-5" />
        </div>
        <h3 className="text-[14px] font-bold text-slate-900">Enterprise Security Features</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 ml-auto">
          Enterprise
        </span>
      </div>
      {ENTERPRISE_FEATURES.map((f) => (
        <div
          key={f}
          className="flex items-center gap-2.5 py-2 border-b border-slate-50 last:border-0 opacity-50"
        >
          <div style={{ color: "#94A3B8" }}>
            <Lock className="w-3.5 h-3.5 shrink-0" />
          </div>
          <p className="text-[12.5px] text-slate-700">{f}</p>
        </div>
      ))}
      <button
        type="button"
        className="mt-4 w-full py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-[12.5px] font-semibold hover:bg-violet-100 transition-colors"
      >
        Upgrade to Enterprise
      </button>
    </div>
  )
}
