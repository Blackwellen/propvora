import { ComplianceTabNav } from "@/components/compliance/ComplianceTabNav"
import { ComplianceJurisdictionNote } from "@/components/compliance/ComplianceJurisdictionNote"

export const dynamic = "force-dynamic"

export default async function ComplianceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-50 min-h-screen -mx-4 -mt-5 sm:-mx-6 sm:-mt-6">
      {/* Canonical section header: title above the persistent tab rail, matching
          every other section (Legal/Money/Work). The negative margins above cancel
          the shell's content padding exactly at each breakpoint so the section sits
          flush with no mobile overflow. */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Compliance</h1>
        <p className="mt-1 text-sm text-slate-500 text-pretty">Risk, renewals and evidence control centre.</p>
      </div>
      <ComplianceTabNav />
      {/* Children own their horizontal padding (px-4 sm:px-6), like Legal — the
          wrapper adds none, so content aligns flush with the section header. */}
      <div className="pt-0">{children}</div>
      {/* Jurisdiction-aware footer note — reads the workspace country/region and
          shows the correct statutory disclaimer (reviewed for GB E&W/Scotland,
          research-only wording for every other jurisdiction). */}
      <div className="px-4 sm:px-6 pb-6">
        <ComplianceJurisdictionNote />
      </div>
    </div>
  )
}
