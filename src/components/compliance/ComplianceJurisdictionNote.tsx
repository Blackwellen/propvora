"use client"

import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { getComplianceNote } from "@/lib/compliance/requirements"

/**
 * Jurisdiction-aware compliance disclaimer footer.
 *
 * Replaces the previously hard-coded "England & Wales" note so the compliance
 * section tells every workspace which jurisdiction's requirements it is showing,
 * and surfaces the stronger "not reviewed — verify locally" wording for non-GB
 * (research-only) jurisdictions. Reads the workspace country/region from
 * workspace settings (GB-safe default).
 */
export function ComplianceJurisdictionNote() {
  const { countryCode, settings } = useWorkspaceJurisdiction()
  const region = (settings as { region?: string }).region
  const note = getComplianceNote(countryCode, region)

  return (
    <p
      className={`text-[11px] mt-8 border-t pt-3 ${
        note.reviewed ? "text-slate-400 border-slate-100" : "text-amber-600 border-amber-100"
      }`}
      role="note"
      aria-label="Compliance jurisdiction notice"
    >
      {note.disclaimer}
      {!note.reviewed && (
        <>
          {" "}
          You can change your workspace jurisdiction in{" "}
          <span className="font-medium">Workspace Settings → Preferences</span>.
        </>
      )}
    </p>
  )
}
