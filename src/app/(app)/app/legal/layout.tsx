import { LegalTabNav } from "@/components/legal/LegalTabNav"
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer"

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
        <LegalDisclaimer />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
