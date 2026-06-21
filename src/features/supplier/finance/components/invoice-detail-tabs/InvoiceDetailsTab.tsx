"use client"

import { Wallet, Calendar, CheckCircle2, FileText, Building2 } from "lucide-react"
import { SupplierCard, SupplierEmptyState } from "@/components/supplier-workspace/ui"
import { moneyPence, shortDate, humaniseStatus } from "@/components/supplier-workspace/format"

export interface InvoiceLineItem {
  id?: string
  description?: string
  quantity?: number
  unit_price_pence?: number
  line_total_pence?: number
}

export interface InvoiceDetailsTabProps {
  totalPence: number | undefined
  status: string | undefined
  submittedAt: string | undefined
  paidAt: string | undefined
  workspaceName: string | undefined
  customerName: string | undefined
  jobRef: string | undefined
  netPence: number | undefined
  vatPence: number | undefined
  lines: InvoiceLineItem[]
  currency: string
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Wallet }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <p className="text-lg font-bold mt-1 text-slate-900">{value}</p>
    </SupplierCard>
  )
}

export function InvoiceDetailsTab({
  totalPence, status, submittedAt, paidAt,
  workspaceName, customerName, jobRef,
  netPence, vatPence, lines, currency,
}: InvoiceDetailsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total" value={moneyPence(totalPence, currency)} icon={Wallet} />
        <Kpi label="Status" value={status ? humaniseStatus(status) : "—"} icon={CheckCircle2} />
        <Kpi label="Submitted" value={shortDate(submittedAt)} icon={Calendar} />
        <Kpi label="Paid" value={shortDate(paidAt)} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SupplierCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bill to</p>
          <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            {workspaceName ?? "—"}
          </p>
          {customerName && <p className="text-xs text-slate-400 mt-0.5">{customerName}</p>}
        </SupplierCard>
        <SupplierCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linked job</p>
          <p className="text-sm font-semibold text-slate-900">{jobRef ?? "—"}</p>
        </SupplierCard>
      </div>

      <SupplierCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Line items</h2>
        </div>
        {lines.length === 0 ? (
          <SupplierEmptyState
            icon={FileText}
            title="No line items"
            description="Itemised charges appear here once the invoice is detailed."
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
                {lines.map((l, i) => (
                  <tr key={l.id ?? i}>
                    <td className="py-2.5 pr-3 text-slate-800">{l.description ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{l.quantity ?? 1}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{moneyPence(l.unit_price_pence, currency)}</td>
                    <td className="py-2.5 pl-3 text-right font-semibold text-slate-900">{moneyPence(l.line_total_pence, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <dl className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-sm max-w-xs ml-auto">
          <div className="flex justify-between">
            <dt className="text-slate-500">Net</dt>
            <dd className="font-semibold text-slate-800">{moneyPence(netPence, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">VAT</dt>
            <dd className="font-semibold text-slate-800">{moneyPence(vatPence, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <dt className="font-medium text-slate-600">Total</dt>
            <dd className="font-bold text-slate-900">{moneyPence(totalPence, currency)}</dd>
          </div>
        </dl>
      </SupplierCard>
    </div>
  )
}
