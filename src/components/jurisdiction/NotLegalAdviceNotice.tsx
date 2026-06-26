"use client"

/**
 * NotLegalAdviceNotice — the permanent, dismissible "not legal advice" notice.
 *
 * Propvora is a property-management platform, NOT a legal/tax advisor. Wherever
 * we surface a jurisdiction figure (notice period, deposit cap, tax rate,
 * compliance cadence) we show that the information is informational, drawn from
 * verified public sources, and that the operator must verify and customise it.
 *
 * Two render modes:
 *   - variant="inline"  → a quiet footer/aside line (always visible; this is the
 *     standing footer that NEVER goes away).
 *   - variant="popover" → a dismissible callout the operator can Acknowledge or
 *     Close. Dismissal is remembered per user+key in localStorage so it doesn't
 *     nag — but the inline footer remains as the permanent backstop.
 *
 * This is the liability shield described in
 * release-gated/docs/internationalisation/LIABILITY-disclaimer-and-customizability-plan.md
 */

import { useEffect, useState } from "react"
import { Info, X } from "lucide-react"

const DISMISS_PREFIX = "propvora.notice.dismissed.v1."

const STANDING_TEXT =
  "Propvora is a property-management platform, not a legal or tax advisor. Jurisdiction information is provided for convenience from verified public sources and may be out of date. You are responsible for verifying and customising every value for your own compliance."

function isDismissed(key: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(DISMISS_PREFIX + key) === "1"
  } catch {
    return false
  }
}

function setDismissed(key: string) {
  try {
    window.localStorage.setItem(DISMISS_PREFIX + key, "1")
  } catch {
    /* storage unavailable — notice simply reappears next load */
  }
}

export function NotLegalAdviceNotice({
  variant = "inline",
  /** Unique key for popover dismissal persistence (e.g. "legal.possession"). */
  noticeKey = "global",
  /** Optional extra context appended to the standing text. */
  context,
  className = "",
}: {
  variant?: "inline" | "popover"
  noticeKey?: string
  context?: string
  className?: string
}) {
  const [open, setOpen] = useState(true)

  // Resolve dismissal on the client to avoid SSR mismatch.
  useEffect(() => {
    if (variant === "popover") setOpen(!isDismissed(noticeKey))
  }, [variant, noticeKey])

  const text = context ? `${STANDING_TEXT} ${context}` : STANDING_TEXT

  if (variant === "inline") {
    return (
      <p
        className={`text-[11px] leading-relaxed text-slate-400 ${className}`}
        role="note"
        aria-label="Not legal advice notice"
      >
        {text}
      </p>
    )
  }

  if (!open) return null

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 ${className}`}
      role="note"
      aria-label="Not legal advice notice"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed">{text}</p>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDismissed(noticeKey)
              setOpen(false)
            }}
            className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Acknowledge
          </button>
          <span className="text-[11px] text-amber-600">Always shown in the footer.</span>
        </div>
      </div>
      <button
        type="button"
        aria-label="Close notice"
        onClick={() => {
          setDismissed(noticeKey)
          setOpen(false)
        }}
        className="shrink-0 rounded-md p-1 text-amber-500 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export default NotLegalAdviceNotice
