"use client"

// Automation shortcut banner — shown in PM workspace sections to let users
// quickly create a relevant automation with the trigger node pre-selected.
// Opens the canvas builder at /app/automations/canvas with query params.

import React from "react"
import Link from "next/link"
import { Zap, ChevronRight } from "lucide-react"

interface AutomationShortcutBannerProps {
  /** Short verb phrase: "Automate: Certificate expiry reminders" */
  label: string
  /** One-line description shown below the label */
  description: string
  /** Node type to pre-select in the builder (e.g. "compliance.expiring") */
  triggerNodeType: string
  /** Default automation name pre-filled in the builder */
  defaultName: string
  /** Visual accent colour class for the icon background */
  accentBg?: string
  /** Visual accent colour class for the icon */
  accentIcon?: string
}

export function AutomationShortcutBanner({
  label,
  description,
  triggerNodeType,
  defaultName,
  accentBg = "bg-[var(--brand-soft)]",
  accentIcon = "text-[var(--brand)]",
}: AutomationShortcutBannerProps) {
  const href = `/app/automations/canvas?trigger=${encodeURIComponent(triggerNodeType)}&name=${encodeURIComponent(defaultName)}`

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-dashed border-[var(--color-brand-100)] bg-[var(--brand-soft)]/50 px-4 py-3 hover:bg-[var(--brand-soft)] hover:border-[var(--color-brand-300)] transition-colors"
    >
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${accentBg}`}>
        <Zap className={`h-4 w-4 ${accentIcon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{label}</p>
        <p className="mt-0.5 text-[12px] text-slate-500 truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[var(--brand)] transition-colors" />
    </Link>
  )
}
