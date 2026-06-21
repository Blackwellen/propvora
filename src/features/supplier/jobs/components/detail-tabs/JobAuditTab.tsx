"use client"

import { ShieldCheck } from "lucide-react"
import { SupplierCard, SupplierLoadingState } from "@/components/supplier-workspace/ui"
import { humaniseStatus, timeAgo } from "@/components/supplier-workspace/format"
import type { SupplierJobEvent } from "@/components/supplier-workspace/types"

export interface JobAuditTabProps {
  events: SupplierJobEvent[]
  loading: boolean
}

export function JobAuditTab({ events, loading }: JobAuditTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">Audit trail</h2>
      </div>
      {loading ? (
        <SupplierLoadingState rows={3} />
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-400 py-3">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-4">
          {events.map((e, i) => (
            <li key={e.id ?? i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] mt-1.5" />
                {i < events.length - 1 && <span className="flex-1 w-px bg-slate-200 my-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-sm font-semibold text-slate-800">
                  {e.status ? humaniseStatus(e.status) : "Update"}
                </p>
                {e.note && <p className="text-xs text-slate-500 mt-0.5">{e.note}</p>}
                <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(e.created_at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SupplierCard>
  )
}
