"use client"

import React from "react"
import { Sparkles } from "lucide-react"

export interface AiUsageLimitsSectionProps {}

export function AiUsageLimitsSection(_props: AiUsageLimitsSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900">AI Credits &amp; Usage</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Usage metering and credit top-ups require the billing integration.
          </p>
        </div>
        <button
          disabled
          title="Connect billing to enable credit purchases"
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-[12.5px] font-semibold cursor-not-allowed flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Buy credits
        </button>
      </div>
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-[12px] text-slate-500">
        Per-user credit caps and usage history will appear here once the Stripe billing integration is connected.
      </div>
    </div>
  )
}

export default AiUsageLimitsSection
