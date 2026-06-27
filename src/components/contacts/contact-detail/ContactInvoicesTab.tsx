"use client"

import React from "react"
import Link from "next/link"
import { Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import type { InvoiceRecord } from "./types"
import { SectionCard, EmptyState, StatusChip } from "./shared"

export function InvoiceTable({ invoices, emptyLabel }: { invoices: InvoiceRecord[]; emptyLabel?: string }) {
  if (invoices.length === 0) return <EmptyState icon={Wallet} message={emptyLabel ?? "No invoices yet."} />
  const total = invoices.reduce((s, i) => s + i.amount, 0)
  const paid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0)
  const outstanding = total - paid
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Invoiced", value: `£${total.toLocaleString("en-GB")}`, colour: "text-slate-900" },
          { label: "Total Paid",     value: `£${paid.toLocaleString("en-GB")}`,  colour: "text-emerald-600" },
          { label: "Outstanding",    value: `£${outstanding.toLocaleString("en-GB")}`, colour: outstanding > 0 ? "text-red-600" : "text-slate-400" },
        ].map(k => (
          <SectionCard key={k.label} className="p-3">
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={cn("text-xl font-bold", k.colour)}>{k.value}</p>
          </SectionCard>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Invoice #","Date","Amount","Status",""].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.ref} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700">{inv.ref}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{inv.date}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">£{inv.amount.toLocaleString("en-GB")}</td>
                <td className="px-4 py-3"><StatusChip status={inv.status} /></td>
                <td className="px-4 py-3 text-right">
                  {inv.id ? (
                    <Link href={`/property-manager/money/invoices/${inv.id}`} className="text-xs text-[var(--brand)] hover:underline">View</Link>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
