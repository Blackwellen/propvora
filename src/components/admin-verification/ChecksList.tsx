import React from "react"
import { CheckCircle2, XCircle, Clock, HelpCircle, ListChecks } from "lucide-react"
import type { VerificationCheckRow } from "./data"

function label(s: string | null) {
  if (!s) return "Check"
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function resultIcon(result: string | null, status: string | null) {
  const r = (result ?? status ?? "").toLowerCase()
  if (r === "pass" || r === "passed" || r === "clear" || r === "completed")
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  if (r === "fail" || r === "failed" || r === "rejected")
    return <XCircle className="w-4 h-4 text-[#EF4444]" />
  if (r === "pending" || r === "processing" || r === "in_progress")
    return <Clock className="w-4 h-4 text-[var(--brand)]" />
  return <HelpCircle className="w-4 h-4 text-slate-400" />
}

/**
 * Automated verification checks (document authenticity, liveness, data match,
 * etc.) shown as evidence for the reviewer. These are inputs to the human
 * decision, not the decision itself.
 */
export default function ChecksList({ checks }: { checks: VerificationCheckRow[] }) {
  if (checks.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white py-8 text-center">
        <ListChecks className="w-7 h-7 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">No checks recorded</p>
        <p className="text-xs text-slate-400 mt-1">Automated checks will appear here once run.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2" role="list">
      {checks.map((c) => (
        <li
          key={c.id}
          className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5"
        >
          <span className="mt-0.5 shrink-0">{resultIcon(c.result, c.status)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-medium text-slate-800">{label(c.checkType)}</p>
              {c.result && (
                <span className="text-[11px] text-slate-500 capitalize">{c.result.replace(/_/g, " ")}</span>
              )}
            </div>
            {c.detail && <p className="text-[11px] text-slate-400 mt-0.5">{c.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}
