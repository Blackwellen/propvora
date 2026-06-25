import { ComplianceTabNav } from "@/components/compliance/ComplianceTabNav"
import { ComplianceJurisdictionNote } from "@/components/compliance/ComplianceJurisdictionNote"

export const dynamic = "force-dynamic"

export default async function ComplianceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-50 min-h-screen -mx-6 -mt-6">
      {/* Section eyebrow + persistent tab rail. The page-specific title is the
          single <h1> on each sub-page (matches Money/Accounting); we deliberately
          do NOT render a generic "Compliance" <h1> here — it duplicated each
          page's own heading and made every tab read as "Compliance". */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Compliance</p>
        <p className="mt-0.5 text-sm text-slate-500">Risk, renewals and evidence control centre.</p>
      </div>
      <ComplianceTabNav />
      <div className="px-6 pt-0">{children}</div>
      {/* Jurisdiction-aware footer note — reads the workspace country/region and
          shows the correct statutory disclaimer (reviewed for GB E&W/Scotland,
          research-only wording for every other jurisdiction). */}
      <div className="px-6 pb-6">
        <ComplianceJurisdictionNote />
      </div>
    </div>
  )
}
