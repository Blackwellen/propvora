"use client"

import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { getLegalJurisdiction } from "@/lib/legal/jurisdiction"

/**
 * Jurisdiction-aware legal disclaimer footer.
 *
 * Replaces the previously hard-coded "Information relates to England & Wales
 * law" note so the Legal section tells every workspace which jurisdiction it is
 * showing, and surfaces the stronger "not reviewed — verify locally" wording for
 * non-GB (research-only) jurisdictions. Reads the workspace country/region from
 * workspace settings (GB-safe default). Mirrors <ComplianceJurisdictionNote>.
 */
export function LegalJurisdictionNote() {
  const { countryCode, settings } = useWorkspaceJurisdiction()
  const region = (settings as { region?: string }).region
  const jur = getLegalJurisdiction(countryCode, region)

  return (
    <p
      className={`text-[11px] mt-8 border-t pt-3 ${
        jur.reviewed ? "text-slate-400 border-slate-100" : "text-amber-600 border-amber-100"
      }`}
      role="note"
      aria-label="Legal jurisdiction notice"
    >
      {jur.legalDisclaimer}
      {!jur.reviewed && (
        <>
          {" "}
          You can change your workspace jurisdiction in{" "}
          <span className="font-medium">Workspace Settings → Jurisdiction</span>.
        </>
      )}
    </p>
  )
}

export default LegalJurisdictionNote
