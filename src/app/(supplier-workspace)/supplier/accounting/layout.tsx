import type { ReactNode } from "react"
import { AccountingTabNav } from "@/components/accounting/AccountingTabNav"
import { SupplierAccountingSection } from "../_sections/providers"

export default function SupplierAccountingLayout({ children }: { children: ReactNode }) {
  return (
    <SupplierAccountingSection>
      <div className="flex flex-col min-h-screen bg-[#F6FAFF] -mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
        <div className="px-4 sm:px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Accounting</h1>
          <p className="mt-1 text-sm text-slate-500">Ledgers, reconciliation, MTD and statutory reporting.</p>
        </div>
        <AccountingTabNav />
        <div className="flex-1 px-4 sm:px-6 py-6">{children}</div>
      </div>
    </SupplierAccountingSection>
  )
}
