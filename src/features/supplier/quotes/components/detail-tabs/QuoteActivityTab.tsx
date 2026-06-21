"use client"

import { SupplierCard } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface QuoteActivityTabProps {
  request: PipelineRequest | null
}

export function QuoteActivityTab({ request: r }: QuoteActivityTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
      </div>
      <ul className="space-y-2 text-sm text-slate-600">
        {r?.quoteSentAt && <li>Sent {shortDate(r.quoteSentAt)}</li>}
        {r?.acceptedAt && <li>Accepted {shortDate(r.acceptedAt)}</li>}
        {r?.followUpAt && <li>Follow-up due {shortDate(r.followUpAt)}</li>}
        {!r?.quoteSentAt && <li>Not yet sent.</li>}
      </ul>
    </SupplierCard>
  )
}
