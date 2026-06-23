import { AccountingTabNav } from "@/components/accounting/AccountingTabNav"

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F6FAFF] -mx-6 -mt-6">
      {/* Section eyebrow + persistent tab rail. The page-specific title is the
          single <h1> on each sub-page (matches the Money section); we deliberately
          do NOT render a generic "Accounting" <h1> here — that duplicated every
          page's own heading and made every tab read as "Accounting". */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Accounting</p>
        <p className="mt-0.5 text-sm text-slate-500">Ledgers, reconciliation, MTD and statutory reporting.</p>
      </div>
      <AccountingTabNav />
      <div className="flex-1 px-6 py-6">{children}</div>
    </div>
  )
}
