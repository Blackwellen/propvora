"use client"

import { FileText, Receipt } from "lucide-react"
import { fmtGBP } from "./MoneyFormatUtils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"

interface ReceivablesPayablesCardProps {
  outstanding: number
  dueThisWeek: number
  overdue: number
  supplierPaymentQueue: number
  awaitingReview: number
  approvedToPay: number
}

export function ReceivablesPayablesCard({
  outstanding,
  dueThisWeek,
  overdue,
  supplierPaymentQueue,
  awaitingReview,
  approvedToPay,
}: ReceivablesPayablesCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Receivables vs Payables</h2>
          <p className="text-xs text-slate-500 mt-0.5">Where cash is coming from and going to</p>
        </div>
        <ActionMenu
          items={[
            { label: "View Invoices", icon: FileText, onClick: () => { window.location.href = "/property-manager/money/invoices" } },
            { label: "View Bills", icon: Receipt, onClick: () => { window.location.href = "/property-manager/money/bills" } },
          ]}
        />
      </div>

      <div className="flex flex-col gap-6">
        {/* Receivables */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide uppercase">
              Receivables (Outstanding Invoices)
            </span>
            <span className="text-sm font-bold text-slate-900">{fmtGBP(outstanding)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-amber-600 font-medium">{fmtGBP(dueThisWeek)}</span> due this week ·{" "}
            <span className="text-red-500 font-medium">{fmtGBP(overdue)}</span> overdue
          </div>
        </div>

        {/* Payables */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide uppercase">
              Payables (Supplier Pay Queue)
            </span>
            <span className="text-sm font-bold text-slate-900">{fmtGBP(supplierPaymentQueue)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{awaitingReview}</span> awaiting review ·{" "}
            <span className="font-medium text-slate-700">{approvedToPay}</span> approved to pay
          </div>
        </div>
      </div>
    </div>
  )
}
