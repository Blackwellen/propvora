import { ComplianceTabNav } from "@/components/compliance/ComplianceTabNav"

export const dynamic = "force-dynamic"

export default function ComplianceLayout({
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
      {/* Jurisdiction footer note — compliance rules are England & Wales by default.
          Non-GB jurisdictions will see different requirements. */}
      <div className="px-6 pb-6">
        <p className="text-[11px] text-slate-400 mt-8 border-t border-slate-100 pt-3">
          Compliance requirements shown are based on England &amp; Wales regulations unless your workspace jurisdiction is
          set otherwise. Scotland, Northern Ireland and non-UK jurisdictions may have different legal requirements.
          Always verify with a qualified local professional.
        </p>
      </div>
    </div>
  )
}
