"use client"

/**
 * BilingualNotice — renders a notice in the jurisdiction's required language(s)
 * (dimension 25). Wales requires tenant-facing documents bilingually (EN/CY);
 * Belgium/Quebec/Switzerland route to the official language(s). When only one
 * language applies it renders a single block.
 */

import { Languages } from "lucide-react"
import { requiredNoticeLanguages } from "@/lib/i18n/notice-language"

const LANG_LABEL: Record<string, string> = {
  en: "English", cy: "Cymraeg (Welsh)", fr: "Français", nl: "Nederlands", de: "Deutsch", it: "Italiano",
}

export function BilingualNotice({
  countryCode,
  region,
  className = "",
}: {
  countryCode: string
  region?: string | null
  className?: string
}) {
  const rule = requiredNoticeLanguages(countryCode, region)
  if (!rule.bilingual && rule.languages.length <= 1) return null

  return (
    <div className={`rounded-xl border border-indigo-200 bg-indigo-50 p-3 ${className}`} role="note">
      <div className="flex items-center gap-2 mb-1">
        <Languages className="h-4 w-4 text-indigo-500" aria-hidden="true" />
        <span className="text-[12px] font-semibold text-indigo-800">Notice language requirement</span>
      </div>
      <p className="text-[12px] leading-relaxed text-indigo-700">
        {rule.bilingual ? "Tenant-facing documents here should be issued in: " : "Issue notices in the official language(s): "}
        <span className="font-medium">{rule.languages.map((l) => LANG_LABEL[l] ?? l).join(" + ")}</span>.
      </p>
      <p className="text-[11px] text-indigo-500 mt-1">{rule.note}</p>
    </div>
  )
}

export default BilingualNotice
