"use client"

/**
 * SourcedValue — the single render wrapper for every jurisdiction value.
 *
 * Renders a resolved value (from resolveValue()) with:
 *   - the value itself (via an optional formatter)
 *   - a SOURCE CHIP showing provenance (Sourced · Customised · Set this)
 *   - the CITATION for the sourced default (and, when overridden, "default was X")
 *   - an EDIT affordance so the operator can override/customise
 *   - a sub-statutory-minimum WARNING (never a block)
 *
 * This is what makes the liability posture uniform: no jurisdiction number is
 * ever shown as bare authoritative fact — it always carries its provenance and
 * an invitation to verify/customise. Pair with <NotLegalAdviceNotice> in the
 * surrounding section footer.
 */

import { Pencil, AlertTriangle } from "lucide-react"
import type { ResolvedValue } from "@/lib/jurisdiction/resolve"

function chip(source: ResolvedValue<unknown>["source"]): { label: string; cls: string } {
  switch (source) {
    case "case":
    case "property":
    case "workspace":
      return { label: "Customised", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" }
    case "sourced":
      return { label: "Sourced", cls: "bg-slate-50 text-slate-600 border-slate-200" }
    default:
      return { label: "Set this", cls: "bg-amber-50 text-amber-700 border-amber-200" }
  }
}

export function SourcedValue<T>({
  resolved,
  /** Format the value for display (defaults to String). */
  format = (v: T) => String(v),
  /** Optional unit suffix, e.g. "days". */
  unit,
  /** Called when the operator clicks the edit affordance. */
  onEdit,
  /** Hide the source chip (for compact inline contexts). */
  hideChip = false,
  className = "",
}: {
  resolved: ResolvedValue<T>
  format?: (v: T) => string
  unit?: string
  onEdit?: () => void
  hideChip?: boolean
  className?: string
}) {
  const { value, source, isOverridden, overrideReason, sourcedDefault, citation, belowStatutoryMinimum } = resolved
  const c = chip(source)
  const display = value == null ? "—" : `${format(value)}${unit ? ` ${unit}` : ""}`

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className={value == null ? "text-slate-400" : "font-medium text-slate-900"}>{display}</span>

      {!hideChip && (
        <span
          className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${c.cls}`}
          title={
            citation
              ? `Source: ${citation}${isOverridden && sourcedDefault != null ? ` · default was ${format(sourcedDefault as T)}` : ""}`
              : isOverridden
                ? "Customised by your workspace"
                : "Set this value for your records"
          }
        >
          {c.label}
        </span>
      )}

      {isOverridden && sourcedDefault != null && (
        <span className="text-[10px] text-slate-400" title={overrideReason ? `Reason: ${overrideReason}` : undefined}>
          (default {format(sourcedDefault as T)}{unit ? ` ${unit}` : ""})
        </span>
      )}

      {belowStatutoryMinimum && (
        <span
          className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600"
          title="Below a known statutory minimum for this jurisdiction — verify with your professional."
        >
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          below minimum
        </span>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit value"
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

export default SourcedValue
