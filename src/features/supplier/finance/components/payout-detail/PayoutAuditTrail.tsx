"use client"

import { SupplierCard } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"

export interface PayoutAuditEntry {
  id: string
  label: string
  at: string | null
}

export interface PayoutAuditTrailProps {
  entries: PayoutAuditEntry[]
}

export function PayoutAuditTrail({ entries }: PayoutAuditTrailProps) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Activity</h2>
      <ol className="space-y-3">
        {entries.map((a, i) => (
          <li key={a.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-2 h-2 rounded-full bg-[var(--brand)] mt-1.5" />
              {i < entries.length - 1 && <span className="flex-1 w-px bg-slate-200 my-1" />}
            </div>
            <div className="pb-1">
              <p className="text-sm text-slate-700">{a.label}</p>
              <p className="text-[11px] text-slate-400">{shortDate(a.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </SupplierCard>
  )
}
