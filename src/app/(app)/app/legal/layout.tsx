import { LegalTabNav } from "@/components/legal/LegalTabNav"
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer"
import JurisdictionBanner from "@/components/i18n/JurisdictionBanner"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 -mx-6 -mt-6">
      {/* Canonical section header: title above the persistent tab rail */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Legal</h1>
        <p className="mt-1 text-sm text-slate-500">Notices, cases, possession and statutory compliance.</p>
      </div>
      <LegalTabNav />
      {/* Persistent, non-dismissible legal disclaimer on every legal page. */}
      <div className="px-6 pt-4">
        <JurisdictionBanner />
        <LegalDisclaimer />
      </div>
      <div className="flex-1">{children}</div>
      {/* Jurisdiction footer note — subtle reminder that legal info is England & Wales.
          For non-GB workspaces this is especially important. GB workspaces still see it
          because Scotland and Northern Ireland have different regulations. */}
      <div className="px-6 pb-6">
        <p className="text-[11px] text-slate-400 mt-8 border-t border-slate-100 pt-3">
          Information relates to England &amp; Wales law unless otherwise stated. Scotland and Northern Ireland have
          different regulations. Propvora is not a law firm and does not provide legal advice. Consult a qualified
          solicitor before acting on any legal information shown here.
        </p>
      </div>
    </div>
  )
}
