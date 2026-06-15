import { LedgerSubNav } from "./LedgerSubNav"

export default function LedgerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <span>Accounting</span>
          <span>/</span>
          <span>General Ledger</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">General Ledger</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          The canonical double-entry record. Every balance is computed live from posted journal lines.
        </p>
      </div>
      <LedgerSubNav />
      {children}
    </div>
  )
}
