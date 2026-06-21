"use client"

import React from "react"
import { Zap } from "lucide-react"

export interface AICreditsCardProps {
  creditsUsed?: number
  creditsLimit?: number
  billingConnected?: boolean
}

export function AICreditsCard({
  creditsUsed = 0,
  creditsLimit = 0,
  billingConnected = false,
}: AICreditsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
          <Zap className="w-4 h-4 text-violet-600" />
        </div>
        <h3 className="text-[14px] font-bold text-slate-900">AI Credits</h3>
        {!billingConnected && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            Requires billing
          </span>
        )}
      </div>
      {billingConnected ? (
        <div>
          <p className="text-[26px] font-black text-slate-900 tabular-nums">
            {creditsUsed.toLocaleString()}
            <span className="text-[13px] font-normal text-slate-400"> / {creditsLimit.toLocaleString()} used</span>
          </p>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${creditsLimit > 0 ? Math.min((creditsUsed / creditsLimit) * 100, 100) : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Credits reset monthly with your billing cycle.</p>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-[13px] text-slate-500">
            AI credits tracking is available once Stripe billing is connected.
          </p>
        </div>
      )}
    </div>
  )
}
