"use client"

import { SupplierCard } from "@/components/supplier-workspace/ui"
import { moneyPence } from "@/components/supplier-workspace/format"

export interface PayoutFeeBreakdownProps {
  grossPence: number
  feePence: number
  vatPence: number
  netPence: number
  destinationMasked: string
  currency: string
}

export function PayoutFeeBreakdown({
  grossPence, feePence, vatPence, netPence, destinationMasked, currency,
}: PayoutFeeBreakdownProps) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Breakdown</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Gross earnings</dt>
          <dd className="font-semibold text-slate-800">{moneyPence(grossPence, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Platform fee</dt>
          <dd className="font-semibold text-slate-800">{`−${moneyPence(feePence, currency)}`}</dd>
        </div>
        {vatPence > 0 && (
          <div className="flex justify-between">
            <dt className="text-slate-500">VAT</dt>
            <dd className="font-semibold text-slate-800">{moneyPence(vatPence, currency)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2">
          <dt className="font-medium text-slate-600">Net to {destinationMasked}</dt>
          <dd className="font-bold text-slate-900">{moneyPence(netPence, currency)}</dd>
        </div>
      </dl>
    </SupplierCard>
  )
}
