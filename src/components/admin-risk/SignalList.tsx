import React from "react"
import { Flag, ShieldAlert, FileWarning, Scale, Gauge, Activity, CheckCircle2 } from "lucide-react"
import type { RiskEvent } from "@/lib/risk/types"
import { SeverityBadge } from "./badges"
import { eventTypeLabel, fmtDateTime } from "./helpers"

function iconFor(type: string) {
  switch (type) {
    case "sanctions_signal":
      return ShieldAlert
    case "kyc_failed":
      return FileWarning
    case "dispute_opened":
      return Scale
    case "velocity":
    case "chargeback":
      return Gauge
    case "manual_flag":
      return Flag
    case "manual_clear":
      return CheckCircle2
    default:
      return Activity
  }
}

function detailSummary(detail: Record<string, unknown>): string | null {
  const parts: string[] = []
  if (typeof detail.reason === "string") parts.push(detail.reason)
  if (typeof detail.signal_type === "string") parts.push(detail.signal_type)
  if (typeof detail.check_type === "string") parts.push(`check: ${detail.check_type}`)
  if (typeof detail.subject === "string") parts.push(detail.subject)
  if (typeof detail.status === "string") parts.push(`status: ${detail.status}`)
  return parts.length ? parts.join(" · ") : null
}

/**
 * Chronological list of contributing risk signals. Each row is a recorded
 * SIGNAL or admin action — not a determination of wrongdoing.
 */
export function SignalList({ events }: { events: RiskEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white py-10 text-center">
        <Activity className="w-7 h-7 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">No risk signals recorded</p>
        <p className="text-xs text-slate-400 mt-1">
          Nothing has contributed to this workspace&apos;s score.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2" role="list">
      {events.map((e) => {
        const Icon = iconFor(e.eventType)
        const summary = detailSummary(e.detail)
        const isManual = e.eventType === "manual_flag" || e.eventType === "manual_clear"
        return (
          <li
            key={e.id}
            className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-3"
          >
            <div
              className={[
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                isManual ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-slate-800">
                  {eventTypeLabel(e.eventType)}
                </span>
                <SeverityBadge severity={e.severity} />
                {e.scoreDelta !== 0 && (
                  <span className="text-[11px] tabular-nums text-slate-400">
                    {e.scoreDelta > 0 ? "+" : ""}
                    {e.scoreDelta}
                  </span>
                )}
              </div>
              {summary && (
                <p className="mt-0.5 text-[12px] text-slate-500 break-words">{summary}</p>
              )}
              <p className="mt-0.5 text-[11px] text-slate-400">
                {fmtDateTime(e.createdAt)}
                {e.source ? ` · ${e.source}` : ""}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
