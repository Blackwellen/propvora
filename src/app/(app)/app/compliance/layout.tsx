import { ComplianceTabNav } from "@/components/compliance/ComplianceTabNav"
import JurisdictionBanner from "@/components/i18n/JurisdictionBanner"

export const dynamic = "force-dynamic"

export default function ComplianceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-50 min-h-screen -mx-6 -mt-6">
      {/* Canonical section header: title above the persistent tab rail */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Compliance</h1>
        <p className="mt-1 text-sm text-slate-500">Risk, renewals and evidence control centre.</p>
      </div>
      <ComplianceTabNav />
      <div className="px-6 pt-4">
        <JurisdictionBanner />
        {children}
      </div>
    </div>
  )
}
