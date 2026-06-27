"use client"

import Link from "next/link"
import { FileText, Send } from "lucide-react"
import { SupplierCard, SupplierStatusBadge, SupplierButton, SupplierEmptyState } from "@/components/supplier-workspace/ui"
import { moneyPence } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface RequestQuoteTabProps {
  request: PipelineRequest
  newQuoteHref: string
}

export function RequestQuoteTab({ request: r, newQuoteHref }: RequestQuoteTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Your quote</h2>
      </div>
      {r.quoteId ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Status</span>
            {r.quoteStatus && <SupplierStatusBadge status={r.quoteStatus} />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Amount</span>
            <span className="text-sm font-semibold text-slate-900">{moneyPence(r.quoteAmountPence)}</span>
          </div>
          <Link href={`/supplier/quotes/${r.quoteId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]">
            View quote
          </Link>
        </div>
      ) : (
        <SupplierEmptyState
          icon={FileText}
          title="No quote yet"
          description="Price this request and send a quote."
          action={
            <Link href={newQuoteHref}>
              <SupplierButton><Send className="w-4 h-4" /> Build quote</SupplierButton>
            </Link>
          }
        />
      )}
    </SupplierCard>
  )
}
