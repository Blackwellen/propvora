"use client"

import { GitBranch } from "lucide-react"
import { SupplierCard, SupplierStatusBadge, SupplierEmptyState } from "@/components/supplier-workspace/ui"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface QuoteVersionsTabProps {
  request: PipelineRequest | null
}

export function QuoteVersionsTab({ request: r }: QuoteVersionsTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Quote versions</h2>
      </div>
      {!r || r.versions.length === 0 ? (
        <SupplierEmptyState
          icon={GitBranch}
          title="Single version"
          description="Revisions you send will be tracked here."
        />
      ) : (
        <ul className="space-y-2.5">
          {r.versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-1">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  v{v.version} · {v.label}
                </p>
                <p className="text-xs text-slate-400">
                  {v.createdAt ? shortDate(v.createdAt) : "—"}
                  {v.note ? ` · ${v.note}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {moneyPence(v.totalIncVatPence ?? v.amountPence)}
                </span>
                <SupplierStatusBadge status={v.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SupplierCard>
  )
}
