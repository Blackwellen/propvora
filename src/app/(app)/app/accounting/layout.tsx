import { AccountingTabNav } from "@/components/accounting/AccountingTabNav"

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F6FAFF] -mx-6 -mt-6">
      {/* Canonical section header: title above the persistent tab rail */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Accounting</h1>
        <p className="mt-1 text-sm text-slate-500">Ledgers, reconciliation, MTD and statutory reporting.</p>
      </div>
      <AccountingTabNav />
      <div className="flex-1 px-6 py-6">{children}</div>
    </div>
  )
}
