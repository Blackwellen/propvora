"use client"

/**
 * JurisdictionFrameworkPanel — reflects the active section LENS. Switching the
 * JurisdictionLensSwitcher updates this panel, so the switcher is a real control,
 * not decoration.
 *
 * - Focused on one jurisdiction → that jurisdiction's framework name, reviewed/
 *   sourced status, and its standing disclaimer.
 * - "All (grouped)" → every jurisdiction present in the portfolio, each with its
 *   framework summary and property count.
 */

import { ShieldCheck, Info } from "lucide-react"
import { useActiveJurisdiction } from "@/lib/jurisdiction/context"
import { usePortfolioJurisdictions } from "@/lib/jurisdiction/usePortfolioJurisdictions"
import { getLegalJurisdiction } from "@/lib/legal/jurisdiction"
import { flagEmoji } from "./JurisdictionChip"

function StatusChip({ reviewed }: { reviewed: boolean }) {
  return reviewed ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
      <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Reviewed baseline
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
      <Info className="h-3 w-3" aria-hidden="true" /> Sourced — verify locally
    </span>
  )
}

export function JurisdictionFrameworkPanel({
  sectionKey,
  defaultToGrouped = false,
  className = "",
}: {
  sectionKey: string
  defaultToGrouped?: boolean
  className?: string
}) {
  const active = useActiveJurisdiction({ sectionKey, defaultToGrouped })
  const { jurisdictions } = usePortfolioJurisdictions()

  if (active.isGrouped) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
        <p className="mb-3 text-[12px] text-slate-500">
          Showing <span className="font-medium text-slate-700">all jurisdictions</span> in your
          portfolio. Each property follows the rules of its own location.
        </p>
        <ul className="divide-y divide-slate-100">
          {jurisdictions.map((j) => {
            const jur = getLegalJurisdiction(j.countryCode, j.region)
            return (
              <li key={`${j.countryCode}:${j.region ?? ""}`} className="flex items-center justify-between gap-3 py-2">
                <span className="flex items-center gap-2 text-[12px] text-slate-700">
                  <span aria-hidden="true">{flagEmoji(j.countryCode)}</span>
                  <span className="font-medium">{jur.regionName}</span>
                  <StatusChip reviewed={jur.reviewed} />
                </span>
                <span className="text-[11px] text-slate-400">
                  {j.count} {j.count === 1 ? "property" : "properties"}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const jur = active.legal
  if (!jur) return null

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <span aria-hidden="true">{flagEmoji(jur.countryCode)}</span>
        <span className="text-[13px] font-semibold text-slate-800">{jur.regionName}</span>
        <StatusChip reviewed={jur.reviewed} />
      </div>
      <p className="text-[12px] leading-relaxed text-slate-500">{jur.legalDisclaimer}</p>
    </div>
  )
}

export default JurisdictionFrameworkPanel
