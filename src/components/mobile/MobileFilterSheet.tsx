"use client"

import { cn } from "@/lib/utils"
import MobileSheet from "./MobileSheet"

export interface FilterOption {
  value: string
  label: string
}

export interface FilterGroup {
  /** Stable key (also used as the field id). */
  key: string
  label: string
  options: FilterOption[]
  /** Current selected value. */
  value: string
  onChange: (value: string) => void
}

interface MobileFilterSheetProps {
  open: boolean
  onClose: () => void
  /** Filter groups rendered as pill rows. */
  groups: FilterGroup[]
  /** Called when "Clear all" is pressed. */
  onClear?: () => void
  /** Number of active (non-default) filters. */
  activeCount?: number
  title?: string
}

/**
 * Bottom-sheet for filters/search refinements on mobile. Each group renders as a
 * wrap of selectable pills (touch-friendly, ≥40px). Sticky footer offers
 * "Clear all" + "Show results". Built on MobileSheet (focus-trap, Esc, safe-area).
 */
export default function MobileFilterSheet({
  open,
  onClose,
  groups,
  onClear,
  activeCount = 0,
  title = "Filters",
}: MobileFilterSheetProps) {
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={title}
      description={activeCount > 0 ? `${activeCount} active` : "Refine the list"}
      footer={
        <div className="flex items-center gap-2">
          {onClear && (
            <button
              onClick={onClear}
              disabled={activeCount === 0}
              className="flex-1 h-12 rounded-xl border border-[#E2EAF6] text-[14px] font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-[2] h-12 rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1d4ed8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
          >
            Show results
          </button>
        </div>
      }
    >
      <div className="pb-2 space-y-5">
        {groups.map((group) => (
          <fieldset key={group.key}>
            <legend className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
              {group.label}
            </legend>
            <div className="flex flex-wrap gap-2 px-1">
              {group.options.map((opt) => {
                const active = group.value === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => group.onChange(opt.value)}
                    aria-pressed={active}
                    className={cn(
                      "min-h-[40px] px-3.5 rounded-xl text-[13px] font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
                      active
                        ? "bg-[#2563EB] border-[#2563EB] text-white"
                        : "bg-white border-[#E2EAF6] text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </MobileSheet>
  )
}
