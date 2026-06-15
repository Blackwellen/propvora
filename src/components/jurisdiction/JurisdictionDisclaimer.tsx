"use client"

import React from "react"
import { Info, ShieldAlert } from "lucide-react"
import { jurisdictionDisclaimer } from "@/lib/international/guardrails"

/**
 * Renders the jurisdiction disclaimer for a given country-pack status.
 * - `reviewed` (GB)  → standard "general information" note (slate/blue).
 * - non-reviewed      → stronger amber "not yet supported" warning.
 *
 * No Tailwind `dark:` classes — light surfaces only.
 */
export function JurisdictionDisclaimer({
  status,
  className,
}: {
  status: string | null | undefined
  className?: string
}) {
  const d = jurisdictionDisclaimer(status)
  const strong = d.level === "strong"
  const Icon = strong ? ShieldAlert : Info

  return (
    <div
      role="note"
      className={[
        "rounded-xl border px-4 py-3 flex gap-3",
        strong
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-slate-50",
        className ?? "",
      ].join(" ")}
    >
      <Icon
        className={[
          "w-4 h-4 mt-0.5 shrink-0",
          strong ? "text-amber-600" : "text-slate-400",
        ].join(" ")}
        aria-hidden
      />
      <div>
        <p
          className={[
            "text-[12.5px] font-semibold",
            strong ? "text-amber-800" : "text-slate-700",
          ].join(" ")}
        >
          {d.title}
        </p>
        <p
          className={[
            "text-[12px] mt-0.5 leading-relaxed",
            strong ? "text-amber-700" : "text-slate-500",
          ].join(" ")}
        >
          {d.body}
        </p>
      </div>
    </div>
  )
}
