"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

const SEVERITY: Record<string, string> = {
  info: "bg-sky-600 text-white",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-amber-950",
  critical: "bg-red-600 text-white",
}

/** Renders the platform announcement bar. Dismissal is per-message (a new
 *  message re-shows even if a prior one was dismissed). */
export default function AnnouncementBar({
  message,
  severity,
  ctaLabel,
  ctaHref,
  dismissible,
  sig,
}: {
  message: string
  severity: string
  ctaLabel?: string
  ctaHref?: string
  dismissible: boolean
  /** Stable signature of the current announcement (so dismissal resets on change). */
  sig: string
}) {
  const key = `pv-announce-dismissed:${sig}`
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (dismissible && typeof window !== "undefined" && localStorage.getItem(key) === "1") setHidden(true)
  }, [dismissible, key])

  if (hidden) return null
  const tone = SEVERITY[severity] ?? SEVERITY.info

  return (
    <div className={`${tone} relative w-full px-10 py-2 text-center text-[13px] font-medium`} role="status">
      <span>{message}</span>
      {ctaLabel && ctaHref && (
        <a href={ctaHref} className="ml-2 font-bold underline underline-offset-2 hover:opacity-90">
          {ctaLabel}
        </a>
      )}
      {dismissible && (
        <button
          aria-label="Dismiss announcement"
          onClick={() => { localStorage.setItem(key, "1"); setHidden(true) }}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
