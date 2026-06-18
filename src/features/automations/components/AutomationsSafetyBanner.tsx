"use client"

import { useState } from "react"
import { ShieldCheck, X } from "lucide-react"

/**
 * Emerald-tinted review-first banner. Dismissible (local state).
 * "Learn more" opens a lightweight overlay describing the safety model.
 */
export default function AutomationsSafetyBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [learnMore, setLearnMore] = useState(false)
  if (dismissed) return null
  return (
    <>
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <p className="flex-1 text-sm text-emerald-900">
          <span className="font-semibold">Review-first by design.</span> All automations propose
          safe, reversible actions. Destructive or irreversible steps require approval before
          execution.{" "}
          <button
            onClick={() => setLearnMore(true)}
            className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            Learn more
          </button>
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="grid h-7 w-7 place-items-center rounded-lg text-emerald-600 hover:bg-emerald-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {learnMore && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          onClick={() => setLearnMore(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">How review-first works</h2>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li>• Automations only ever propose actions — tasks, drafts, reminders, flags.</li>
              <li>• Payments, refunds and legal actions are blocked from auto-execution.</li>
              <li>• High-risk steps pause in Approvals for a human decision before running.</li>
              <li>• Every run is recorded with a full, honest audit trail.</li>
            </ul>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setLearnMore(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
