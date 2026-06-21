"use client"

import { SupplierCard } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface RequestTimelineTabProps {
  request: PipelineRequest
}

export function RequestTimelineTab({ request: r }: RequestTimelineTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>
      </div>
      <ul className="space-y-2 text-sm text-slate-600">
        <li>Created {r.createdAt ? shortDate(r.createdAt) : "—"}</li>
        {r.quoteSentAt && <li>Quote sent {shortDate(r.quoteSentAt)}</li>}
        {r.acceptedAt && <li>Accepted {shortDate(r.acceptedAt)}</li>}
      </ul>
    </SupplierCard>
  )
}
