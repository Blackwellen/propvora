"use client"

import Link from "next/link"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"

export interface InvoicePaymentsTabProps {
  approvedAt: string | undefined
  paidAt: string | undefined
  payoutId: string | undefined
}

export function InvoicePaymentsTab({ approvedAt, paidAt, payoutId }: InvoicePaymentsTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Payments &amp; payouts</h2>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span className="text-slate-500">Approved</span>
          <span className="font-medium text-slate-700">{shortDate(approvedAt)}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-slate-500">Paid</span>
          <span className="font-medium text-slate-700">{shortDate(paidAt)}</span>
        </li>
      </ul>
      {payoutId ? (
        <Link
          href={`/supplier/payouts/${payoutId}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
        >
          View linked payout
        </Link>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          Payout links here once payment is released by the operator.
        </p>
      )}
    </SupplierCard>
  )
}
