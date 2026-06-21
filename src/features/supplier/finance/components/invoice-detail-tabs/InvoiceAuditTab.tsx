"use client"

import { SupplierCard } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"

export interface InvoiceAuditEvent {
  id?: string
  label?: string
  created_at?: string
}

export interface InvoiceAuditTabProps {
  events: InvoiceAuditEvent[]
  submittedAt: string | undefined
  approvedAt: string | undefined
  paidAt: string | undefined
}

export function InvoiceAuditTab({ events, submittedAt, approvedAt, paidAt }: InvoiceAuditTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Audit summary</h2>
      </div>
      {events.length === 0 ? (
        <ul className="space-y-2 text-sm text-slate-600">
          {submittedAt && <li>Submitted {shortDate(submittedAt)}</li>}
          {approvedAt && <li>Approved {shortDate(approvedAt)}</li>}
          {paidAt && <li>Paid {shortDate(paidAt)}</li>}
          {!submittedAt && <li>No activity recorded yet.</li>}
        </ul>
      ) : (
        <ol className="space-y-3">
          {events.map((e, i) => (
            <li key={e.id ?? i} className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
              <div>
                <p className="text-sm text-slate-700">{e.label ?? "Update"}</p>
                <p className="text-[11px] text-slate-400">{shortDate(e.created_at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SupplierCard>
  )
}
