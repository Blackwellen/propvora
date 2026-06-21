"use client"

import Link from "next/link"
import { SupplierCard } from "@/components/supplier-workspace/ui"

export function JobPaymentsTab() {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Payments</h2>
      <p className="text-sm text-slate-500">
        You raise invoices and track payouts at the workspace level. Open{" "}
        <Link href="/supplier/invoices" className="font-semibold text-[#2563EB]">
          Invoices
        </Link>{" "}
        to bill for this job, and{" "}
        <Link href="/supplier/payouts" className="font-semibold text-[#2563EB]">
          Payouts
        </Link>{" "}
        to see settled funds. Payment release is controlled by the property manager.
      </p>
    </SupplierCard>
  )
}
