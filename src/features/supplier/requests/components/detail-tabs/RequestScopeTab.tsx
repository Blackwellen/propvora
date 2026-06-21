"use client"

import { CheckCircle2 } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface RequestScopeTabProps {
  request: PipelineRequest
}

export function RequestScopeTab({ request: r }: RequestScopeTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Requested scope</h2>
      </div>
      {r.scopeBullets.length === 0 ? (
        <p className="text-sm text-slate-500">{r.scopeSummary || "No itemised scope provided."}</p>
      ) : (
        <ul className="space-y-2">
          {r.scopeBullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </SupplierCard>
  )
}
