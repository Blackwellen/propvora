"use client"

import { Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInlineEdit } from "@/hooks/useInlineEdit"

export interface InlineEditBooleanProps {
  value: boolean | null | undefined
  onSave: (val: boolean) => Promise<void>
  label?: string
  className?: string
  readOnly?: boolean
  disabled?: boolean
  permission?: boolean
  readOnlyReason?: string
  silentToast?: boolean
  /** Labels for on/off. Defaults to "Yes"/"No". */
  trueLabel?: string
  falseLabel?: string
}

/**
 * Boolean toggle inline editor. The whole control is a single accessible
 * switch — tapping it commits immediately (optimistic) with no separate
 * save/cancel, which suits boolean fields better than a text editor.
 */
export function InlineEditBoolean({
  value,
  onSave,
  label,
  className,
  readOnly,
  disabled,
  permission,
  readOnlyReason,
  silentToast,
  trueLabel = "Yes",
  falseLabel = "No",
}: InlineEditBooleanProps) {
  const locked = readOnly || disabled || permission === false

  const { displayValue, saving, commit } = useInlineEdit<string>({
    value: value ? "1" : "0",
    onSave: (v) => onSave(v === "1"),
    permission: !locked,
    label,
    silent: silentToast,
  })

  const on = displayValue === "1"
  const ariaLabel = label ? `Toggle ${label}` : "Toggle"

  if (locked) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)} title={readOnlyReason}>
        <span className="text-[13px] text-slate-700">{on ? trueLabel : falseLabel}</span>
        {readOnlyReason && (
          <>
            <Lock className="w-3 h-3 text-slate-300 shrink-0" aria-hidden="true" />
            <span className="sr-only">
              {label ? `${label} is read-only. ` : "Read-only. "}
              {readOnlyReason}
            </span>
          </>
        )}
      </span>
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={saving}
      onClick={() => void commit(on ? "0" : "1")}
      className={cn(
        "inline-flex items-center gap-2 group focus-visible:outline-none disabled:opacity-60",
        className
      )}
    >
      <span
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors shrink-0",
          "group-focus-visible:ring-2 group-focus-visible:ring-[var(--brand)]/40",
          on ? "bg-[var(--brand)]" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow flex items-center justify-center transition-transform motion-reduce:transition-none",
            on && "translate-x-4"
          )}
        >
          {on && <Check className="w-2.5 h-2.5 text-[var(--brand)]" />}
        </span>
      </span>
      <span className="text-[13px] text-slate-700">{on ? trueLabel : falseLabel}</span>
    </button>
  )
}

export default InlineEditBoolean
