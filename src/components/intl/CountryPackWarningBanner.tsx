"use client"

import React from "react"
import { AlertTriangle, Ban, CheckCircle2, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * CountryPackWarningBanner — the single banner every non-GB surface renders to
 * communicate the country-pack posture honestly.
 *
 *   - enabled/GB  → calm green "fully supported" (UK reviewed baseline).
 *   - research    → amber "general information only, not reviewed".
 *   - restricted  → orange "manual review required".
 *   - banned      → red hard block.
 *
 * Pure presentational — driven by the resolved gates, never by feature flags.
 */
export type CountryPackTone = "enabled" | "research" | "restricted" | "banned"

export function CountryPackWarningBanner({
  countryName,
  countryCode,
  tone,
  reason,
  disclaimers,
  className,
}: {
  countryName: string
  countryCode: string
  tone: CountryPackTone
  reason?: string | null
  disclaimers?: string[]
  className?: string
}) {
  if (tone === "enabled") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3",
          className
        )}
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="text-[13px] font-bold text-emerald-900">
            {countryName} ({countryCode}) — fully supported
          </p>
          <p className="text-[12px] text-emerald-700 mt-0.5 leading-relaxed">
            This is a reviewed country pack. All jurisdiction-specific legal, tax and compliance
            features apply.
          </p>
        </div>
      </div>
    )
  }

  const cfg =
    tone === "banned"
      ? {
          wrap: "border-red-200 bg-red-50",
          icon: <Ban className="w-5 h-5 text-red-600 mt-0.5 shrink-0" aria-hidden />,
          title: "text-red-900",
          body: "text-red-700",
          head: `${countryName} (${countryCode}) — blocked`,
          lead:
            reason ??
            "This country is sanctioned or unavailable. Onboarding, billing and payouts are blocked.",
        }
      : tone === "restricted"
        ? {
            wrap: "border-orange-200 bg-orange-50",
            icon: <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" aria-hidden />,
            title: "text-orange-900",
            body: "text-orange-700",
            head: `${countryName} (${countryCode}) — manual review required`,
            lead:
              reason ??
              "This country requires manual commercial, payment, sanctions, legal and tax review before it can be enabled.",
          }
        : {
            wrap: "border-amber-200 bg-amber-50",
            icon: <FlaskConical className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" aria-hidden />,
            title: "text-amber-900",
            body: "text-amber-700",
            head: `${countryName} (${countryCode}) — general information only`,
            lead:
              reason ??
              "This country pack is not reviewed. Legal, tax and compliance content is general information only and is not tailored to local law. Consult a qualified local professional before acting.",
          }

  return (
    <div className={cn("rounded-2xl border p-4 flex gap-3", cfg.wrap, className)}>
      {cfg.icon}
      <div className="min-w-0">
        <p className={cn("text-[13px] font-bold", cfg.title)}>{cfg.head}</p>
        <p className={cn("text-[12px] mt-0.5 leading-relaxed", cfg.body)}>{cfg.lead}</p>
        {disclaimers && disclaimers.length > 0 && (
          <ul className={cn("mt-2 space-y-1 list-disc pl-4 text-[11.5px]", cfg.body)}>
            {disclaimers.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Map an offer/pack posture to a banner tone. */
export function toneFromPosture(input: {
  countryCode: string
  offerStatus: string
  canShowLegalPack: boolean
  blocked: boolean
  requiresManualReview: boolean
}): CountryPackTone {
  if (input.countryCode === "GB" || input.canShowLegalPack) return "enabled"
  if (input.blocked || input.offerStatus === "banned") return "banned"
  if (input.requiresManualReview || input.offerStatus === "restricted") return "restricted"
  return "research"
}
