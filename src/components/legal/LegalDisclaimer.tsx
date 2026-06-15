"use client"
import React from "react"
import { AlertTriangle } from "lucide-react"

/**
 * Persistent, NON-dismissible legal disclaimer.
 *
 * Mounted on every legal page and embedded in every generated document. Unlike
 * the older dismissible banner, this one cannot be permanently hidden — legal
 * tooling is review-only and the warning must always be visible. There is no
 * "dismiss forever". Two visual weights: `banner` (full width) and `inline`
 * (compact, for cards / previews).
 */
interface LegalDisclaimerProps {
  variant?: "banner" | "inline"
  /** Override the default copy for context-specific surfaces (notice/bundle). */
  message?: string
  className?: string
}

const DEFAULT_MESSAGE =
  "Draft for review only — not legal advice. Verify with a qualified solicitor before serving or filing. Propvora never serves, files, or submits anything on your behalf."

export function LegalDisclaimer({ variant = "banner", message, className = "" }: LegalDisclaimerProps) {
  const text = message ?? DEFAULT_MESSAGE

  if (variant === "inline") {
    return (
      <div
        role="note"
        className={`flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 ${className}`}
      >
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
        <p className="text-[11px] leading-relaxed text-amber-800">{text}</p>
      </div>
    )
  }

  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3.5 ${className}`}
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden />
      </div>
      <p className="flex-1 text-[12px] leading-relaxed text-amber-800">
        <strong className="font-semibold">Draft for review only — not legal advice. </strong>
        {text === DEFAULT_MESSAGE
          ? "Verify with a qualified solicitor before serving or filing. Propvora never serves, files, or submits anything on your behalf."
          : text}
      </p>
    </div>
  )
}

/**
 * DRAFT status badge — stamps every generated notice / document so it can never
 * be mistaken for a served or filed instrument.
 */
export function DraftBadge({ label = "DRAFT — REVIEW ONLY", className = "" }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
      {label}
    </span>
  )
}
