"use client"

import { moneyPence } from "@/components/supplier-workspace/format"
import type { BillableJob } from "./InvoiceStep1JobCustomer"
import type { InvoiceLine } from "./InvoiceStep2LineItems"

const VAT_RATE = 0.2

export interface InvoiceStep3ReviewProps {
  job: BillableJob | null
  lines: InvoiceLine[]
  includeVat: boolean
}

export function InvoiceStep3Review({ job, lines, includeVat }: InvoiceStep3ReviewProps) {
  const netPence = lines.reduce((s, l) => s + l.qty * l.unitPence, 0)
  const vatPence = includeVat ? Math.round(netPence * VAT_RATE) : 0
  const grossPence = netPence + vatPence

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Review &amp; send</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Check the invoice before sending it to {job?.workspace ?? "the operator"}.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Bill to</p>
            <p className="text-sm font-semibold text-slate-900">{job?.workspace ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Job</p>
            <p className="text-sm font-semibold text-slate-900">{job?.ref ?? "—"}</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Unit</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {lines.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2.5 text-slate-800">{l.description || "—"}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{l.qty}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{moneyPence(l.unitPence)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                  {moneyPence(l.qty * l.unitPence)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Net</span>
            <span className="font-semibold text-slate-800">{moneyPence(netPence)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">VAT {includeVat ? "(20%)" : ""}</span>
            <span className="font-semibold text-slate-800">{moneyPence(vatPence)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-slate-600">Total due</span>
            <span className="text-base font-bold text-slate-900">{moneyPence(grossPence)}</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-[var(--brand-soft)]/60 border border-[var(--color-brand-100)] px-4 py-3 text-xs text-[var(--brand)]">
        The operator reviews and approves your invoice; payout follows once payment is released and all escrow
        conditions are met.
      </div>
    </div>
  )
}
