"use client"

import Link from "next/link"
import { List } from "lucide-react"
import { SupplierCard, SupplierButton, SupplierEmptyState } from "@/components/supplier-workspace/ui"
import { moneyPence } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface QuoteLineItemsTabProps {
  request: PipelineRequest | null
  reviseHref: string
}

export function QuoteLineItemsTab({ request: r, reviseHref }: QuoteLineItemsTabProps) {
  const amount = r?.quoteAmountPence ?? null
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Line items</h2>
      </div>
      {!r || r.lineItems.length === 0 ? (
        <SupplierEmptyState
          icon={List}
          title="No line items"
          description="Itemise this quote to break down labour and materials."
          action={<Link href={reviseHref}><SupplierButton variant="outline">Edit quote</SupplierButton></Link>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Unit</th>
                <th className="py-2 pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {r.lineItems.map((li) => (
                <tr key={li.id}>
                  <td className="py-2.5 pr-3 text-slate-800">{li.description}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{li.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{moneyPence(li.unitPricePence)}</td>
                  <td className="py-2.5 pl-3 text-right font-semibold text-slate-900">{moneyPence(li.lineTotalPence)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={3} className="py-2.5 pr-3 text-right text-sm font-medium text-slate-600">Total</td>
                <td className="py-2.5 pl-3 text-right text-base font-bold text-slate-900">{moneyPence(amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </SupplierCard>
  )
}
