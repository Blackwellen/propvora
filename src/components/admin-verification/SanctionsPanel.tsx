import React from "react"
import { ShieldAlert, Info, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import type { SanctionsSignalRow } from "./data"

function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—"
}

function signalResult(s: SanctionsSignalRow): string {
  return (s.result ?? s.matchStatus ?? "unknown").toLowerCase()
}

function isClear(s: SanctionsSignalRow): boolean {
  const r = signalResult(s)
  return r === "clear" || r === "no_match" || r === "no-match"
}

/**
 * Sanctions / PEP SCREENING SIGNALS panel.
 *
 * HONESTY FRAMING (hard requirement): these rows are SIGNALS surfaced for a
 * human reviewer — possible matches against watchlists / PEP sources — NOT legal
 * determinations and NOT an automated decision. The copy and labelling make that
 * explicit. The system never approves or rejects on the basis of a signal; only
 * the admin's recorded action changes status.
 */
export default function SanctionsPanel({ signals }: { signals: SanctionsSignalRow[] }) {
  const hits = signals.filter((s) => !isClear(s))
  const hasHits = hits.length > 0

  return (
    <div className="space-y-3">
      {/* Explicit non-determination banner */}
      <div className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-slate-50 px-3 py-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-relaxed text-slate-500">
          These are <span className="font-semibold text-slate-700">screening signals</span> for human
          review — potential matches against sanctions / PEP sources. They are{" "}
          <span className="font-semibold text-slate-700">not legal determinations</span> and the
          system never auto-decides. Confirm or dismiss each signal as part of your decision.
        </p>
      </div>

      {signals.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white py-8 text-center">
          <ShieldCheck className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No screening signals recorded</p>
          <p className="text-xs text-slate-400 mt-1">
            No sanctions / PEP screening has run, or none returned a signal.
          </p>
        </div>
      ) : (
        <ul className="space-y-2" role="list">
          {signals.map((s) => {
            const clear = isClear(s)
            return (
              <li
                key={s.id}
                className={[
                  "rounded-xl border px-3 py-2.5",
                  clear ? "border-[#E2E8F0] bg-white" : "border-[#FED7AA] bg-[#FFF7ED]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {clear ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-[#EA580C] shrink-0" />
                    )}
                    <span className="text-[13px] font-medium text-slate-800 truncate">
                      {s.provider ?? "Screening"}
                      {s.listName ? <span className="text-slate-400"> · {s.listName}</span> : null}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.pep && (
                      <Badge variant="ai" size="sm">
                        PEP signal
                      </Badge>
                    )}
                    {clear ? (
                      <Badge variant="success" size="sm">
                        Clear
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Possible match
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-3 flex-wrap text-[11px] text-slate-500 pl-6">
                  <span className="capitalize">Result: {signalResult(s).replace(/_/g, " ")}</span>
                  {typeof s.score === "number" && (
                    <span>Score: <span className="tabular-nums">{s.score}</span></span>
                  )}
                  <span>{fmt(s.createdAt)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {hasHits && (
        <p className="text-[11px] text-[#B45309] pl-1">
          {hits.length} signal{hits.length === 1 ? "" : "s"} require reviewer judgement before a
          decision is recorded.
        </p>
      )}
    </div>
  )
}
