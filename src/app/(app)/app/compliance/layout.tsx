import { ComplianceTabNav } from "@/components/compliance/ComplianceTabNav"

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
