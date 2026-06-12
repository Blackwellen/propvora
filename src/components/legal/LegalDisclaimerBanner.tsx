"use client"
import React, { useState } from "react"
import { AlertTriangle, X } from "lucide-react"

interface LegalDisclaimerBannerProps {
  dismissible?: boolean
  className?: string
}

export function LegalDisclaimerBanner({
  dismissible = true,
  className = "",
}: LegalDisclaimerBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      className={`bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 flex items-start gap-3 ${className}`}
    >
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-[12px] text-amber-800 leading-relaxed flex-1">
        <strong>Legal advice disclaimer: </strong>
        Propvora does not provide legal advice. This tool helps you organise evidence and generate
        document drafts only. Seek independent legal advice from a qualified solicitor before
        taking any possession proceedings.
      </p>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
