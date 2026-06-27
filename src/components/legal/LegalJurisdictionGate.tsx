"use client"

import Link from "next/link"
import { Globe, ShieldAlert, FileText, ArrowRight, Settings2, BookOpen } from "lucide-react"
import { useLegalJurisdiction } from "@/hooks/useLegalJurisdiction"
import type { LegalModuleKey } from "@/lib/legal/jurisdiction"
import type { MergedLegalJurisdiction } from "@/lib/legal/customModules"

/**
 * Gates an England & Wales statutory legal sub-tab (Possession, HMO, EPC, RRA)
 * by the active workspace's jurisdiction.
 *
 *   reviewed (GB England & Wales) → render the full E&W tooling (children)
 *   research-only (any other live country) → replace with a jurisdiction panel:
 *       the E&W statutory workflow does not apply; Propvora runs in generic
 *       record-keeping mode and points the user to Compliance / Documents.
 *   blocked (sanctioned country) → blocked panel, no tooling.
 *
 * This is the hard internationalisation requirement: the Legal section must
 * change / disappear based on the jurisdiction selected, never render E&W
 * statute as if it applied everywhere.
 */
export function LegalJurisdictionGate({
  module,
  children,
}: {
  module: LegalModuleKey | "overview"
  children: React.ReactNode
}) {
  const { jurisdiction: jur, loading } = useLegalJurisdiction()

  // Avoid flashing E&W content to a non-GB workspace while settings load.
  if (loading) {
    return (
      <div className="px-4 sm:px-6 pt-6">
        <div className="h-32 rounded-xl border border-slate-200 bg-white animate-pulse" />
      </div>
    )
  }

  if (jur.reviewed) return <>{children}</>

  return <LegalJurisdictionPanel module={module} jurisdiction={jur} />
}

function LegalJurisdictionPanel({
  module,
  jurisdiction: jur,
}: {
  module: LegalModuleKey | "overview"
  jurisdiction: MergedLegalJurisdiction
}) {
  const blocked = jur.blocked
  const mod =
    module === "overview"
      ? {
          key: "overview" as const,
          applies: false,
          label: "Legal",
          note: `The Legal section's possession, HMO licensing and Renters' Rights tools are built for England & Wales statute and do not apply in ${jur.regionName}. Use Compliance and Documents for jurisdiction-neutral record-keeping.`,
        }
      : jur.modules[module]

  const accent = blocked
    ? { border: "border-red-200", bg: "bg-red-50", icon: "text-red-500", chip: "bg-red-100 text-red-700 border-red-200" }
    : { border: "border-amber-200", bg: "bg-amber-50", icon: "text-amber-500", chip: "bg-amber-100 text-amber-700 border-amber-200" }

  const heading = blocked
    ? `Legal tools are unavailable for ${jur.regionName}`
    : mod.applies
      ? `${mod.label} runs in generic mode for ${jur.regionName}`
      : `${mod.label} doesn’t apply in ${jur.regionName}`

  return (
    <div className="px-4 sm:px-6 pt-6 pb-8">
      <div className={`rounded-2xl border ${accent.border} ${accent.bg} overflow-hidden`}>
        <div className="px-6 py-5 flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl bg-white border ${accent.border} flex items-center justify-center shrink-0`}>
            {blocked ? (
              <ShieldAlert className={`w-5 h-5 ${accent.icon}`} />
            ) : (
              <Globe className={`w-5 h-5 ${accent.icon}`} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] font-semibold text-slate-900">{heading}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${accent.chip}`}>
                {jur.regionName}
              </span>
            </div>
            <p className="text-[12.5px] text-slate-600 leading-relaxed mt-1.5 max-w-2xl">{mod.note}</p>
            <p className="text-[12px] text-slate-500 leading-relaxed mt-2 max-w-2xl">{jur.legalDisclaimer}</p>
          </div>
        </div>

        {!blocked && (
          <div className="px-6 pb-5 pt-1 flex flex-wrap items-center gap-2.5">
            <Link
              href="/property-manager/compliance"
              className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-[12px] font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Record-keeping in Compliance
            </Link>
            <Link
              href="/property-manager/contacts/documents"
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[12px] font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              Documents
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/property-manager/workspace-settings/jurisdiction"
              className="ml-auto text-[11.5px] text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Change jurisdiction in Workspace Settings
            </Link>
          </div>
        )}
      </div>

      {/* Workspace-authored legal guidance (custom pack). Informational only —
          never unlocks E&W tooling. */}
      {!blocked && jur.customModules.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <h3 className="text-[13px] font-semibold text-slate-800">
              Your workspace legal guidance — {jur.regionName}
            </h3>
            <span className="ml-auto text-[10.5px] text-slate-400">Configured by your workspace · not Propvora-reviewed</span>
          </div>
          <div className="divide-y divide-slate-100">
            {jur.customModules.map((m, i) => (
              <div key={`${m.label}-${i}`} className="px-5 py-3">
                <p className="text-[12.5px] font-medium text-slate-800">{m.label}</p>
                <p className="text-[12px] text-slate-600 leading-relaxed mt-0.5">{m.note}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-2.5 border-t border-slate-100">
            <Link href="/property-manager/settings/legal" className="text-[11.5px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-medium">
              Edit legal guidance →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default LegalJurisdictionGate
