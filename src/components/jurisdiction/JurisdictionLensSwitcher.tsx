"use client"

/**
 * JurisdictionLensSwitcher — the header control on section overviews that lets
 * an operator focus one jurisdiction or view "All (grouped)". This is the
 * literal "UAE one minute, UK the next" control. Distinct from a property's
 * record-true chip (which is locked).
 *
 * Options default to the jurisdictions actually present in the portfolio. The
 * choice persists per user+section via the JurisdictionContextProvider.
 */

import { useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import { useActiveJurisdiction, type SectionLens } from "@/lib/jurisdiction/context"
import { usePortfolioJurisdictions } from "@/lib/jurisdiction/usePortfolioJurisdictions"
import { JurisdictionChip, flagEmoji } from "./JurisdictionChip"

const REGION_LABEL: Record<string, string> = { EW: "England & Wales", SCT: "Scotland", NI: "Northern Ireland" }

function lensLabel(lens: SectionLens, nameFor: (cc: string) => string): string {
  if (lens === "ALL") return "All jurisdictions"
  return (lens.region && REGION_LABEL[lens.region]) || nameFor(lens.countryCode)
}

export function JurisdictionLensSwitcher({
  sectionKey,
  defaultToGrouped = false,
  /** Show the "All (grouped)" option (default true). */
  allowGrouped = true,
  className = "",
}: {
  sectionKey: string
  defaultToGrouped?: boolean
  allowGrouped?: boolean
  className?: string
}) {
  const { lens, setLens } = useActiveJurisdiction({ sectionKey, defaultToGrouped })
  const { jurisdictions } = usePortfolioJurisdictions()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const nameFor = (cc: string) => jurisdictions.find((j) => j.countryCode === cc)?.name ?? cc
  const currentLabel = lensLabel(lens, nameFor)
  const isAll = lens === "ALL"

  function choose(next: SectionLens) {
    setLens(next)
    setOpen(false)
  }

  function isActive(opt: SectionLens): boolean {
    if (opt === "ALL" || lens === "ALL") return opt === lens
    return lens.countryCode === opt.countryCode && (lens.region ?? null) === (opt.region ?? null)
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      {isAll ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Jurisdiction lens (currently ${currentLabel})`}
        >
          <span aria-hidden="true">🌐</span>
          <span>{currentLabel}</span>
          <span className="text-slate-400" aria-hidden="true">▾</span>
        </button>
      ) : (
        <JurisdictionChip
          countryCode={(lens as { countryCode: string }).countryCode}
          region={(lens as { region: string | null }).region}
          name={currentLabel}
          onClick={() => setOpen((o) => !o)}
        />
      )}

      {open && (
        <ul
          role="listbox"
          aria-label="Choose jurisdiction lens"
          className="absolute z-50 mt-1 max-h-72 w-56 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {allowGrouped && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={isAll}
                onClick={() => choose("ALL")}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
              >
                <span aria-hidden="true">🌐</span>
                <span className="flex-1">All jurisdictions (grouped)</span>
                {isAll && <Check className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />}
              </button>
            </li>
          )}
          {jurisdictions.map((j) => {
            const opt: SectionLens = { countryCode: j.countryCode, region: j.region }
            const active = isActive(opt)
            return (
              <li key={`${j.countryCode}:${j.region ?? ""}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(opt)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
                >
                  <span aria-hidden="true">{flagEmoji(j.countryCode)}</span>
                  <span className="flex-1">{lensLabel(opt, () => j.name)}</span>
                  {j.count > 0 && <span className="text-[10px] text-slate-400">{j.count}</span>}
                  {active && <Check className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default JurisdictionLensSwitcher
