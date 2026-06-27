"use client"

import { Globe } from "lucide-react"
import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { getCountryProfile } from "@/lib/i18n/country-profiles"

/**
 * Shows a non-dismissible jurisdiction banner on compliance/legal/money pages
 * for non-GB workspaces. Tells the user which country pack is active and
 * what the legal framework covers (or doesn't cover).
 */
export default function JurisdictionBanner() {
  const jurisdiction = useWorkspaceJurisdiction()

  // Don't show for GB — it's the reviewed default; no extra disclaimer needed.
  if (!jurisdiction || jurisdiction.countryCode === "GB") return null

  const countryCode = jurisdiction.countryCode
  const profile = getCountryProfile(countryCode)
  const name = profile?.displayName ?? countryCode
  const disclaimer = profile?.legalDisclaimer ?? null

  // Determine badge styling: non-GB jurisdictions without a GB-reviewed pack get amber
  const isResearchOnly = !profile || countryCode !== "GB"

  const borderColor = isResearchOnly ? "border-amber-200" : "border-[var(--color-brand-100)]"
  const bgColor = isResearchOnly ? "bg-amber-50" : "bg-[var(--brand-soft)]"
  const iconColor = isResearchOnly ? "text-amber-500" : "text-[var(--brand)]"
  const titleColor = isResearchOnly ? "text-amber-800" : "text-[var(--brand-strong)]"
  const bodyColor = isResearchOnly ? "text-amber-700" : "text-[var(--brand)]"

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border ${borderColor} ${bgColor} px-4 py-3 mb-4`}
      role="note"
      aria-label="Jurisdiction notice"
    >
      <Globe className={`h-4 w-4 ${iconColor} mt-0.5 shrink-0`} />
      <div>
        <p className={`text-[13px] font-[600] ${titleColor}`}>
          {name}
          {jurisdiction.currency ? ` — ${jurisdiction.currency}` : ""}
        </p>
        {disclaimer && (
          <p className={`text-[12px] ${bodyColor} mt-0.5 leading-relaxed`}>{disclaimer}</p>
        )}
      </div>
    </div>
  )
}
