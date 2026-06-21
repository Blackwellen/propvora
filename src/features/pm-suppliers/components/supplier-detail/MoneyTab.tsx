"use client"

import React from "react"
import Link from "next/link"
import { Receipt, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { statusColor } from "./JobsTab"
import type { SupplierView } from "@/features/suppliers/useSuppliers"
import type { Job } from "@/types/database"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MoneyTabProps {
  supplier: SupplierView
  jobs: Job[]
  mode: "quotes" | "invoices"
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MoneyTab({ supplier: _supplier, jobs, mode }: MoneyTabProps) {
  const rows = mode === "quotes"
    ? jobs.filter((j) => j.quoted_amount != null || j.approved_amount != null)
    : jobs.filter((j) => j.invoiced_amount != null && Number(j.invoiced_amount) > 0)

  const total = rows.reduce((s, j) => {
    const v = mode === "quotes"
      ? (j.approved_amount ?? j.quoted_amount ?? 0)
      : (j.invoiced_amount ?? 0)
    return s + Number(v)
  }, 0)

  const title = mode === "quotes" ? "Quotes" : "Invoices"
  const emptyCopy = mode === "quotes"
    ? "No quotes recorded against this supplier's jobs yet."
    : "No invoices recorded against this supplier's jobs yet."
  const avg = rows.length > 0 ? Math.round(total / rows.length) : 0
  const TitleIcon = mode === "quotes" ? FileText : Receipt

  return (
    <div className="space-y-4">
      {/* Mini KPI strip */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: title,        value: String(rows.length),        color: "text-slate-900"   },
            { label: "Total Value", value: `£${total.toLocaleString()}`, color: "text-emerald-600" },
            { label: "Average",     value: `£${avg.toLocaleString()}`,   color: "text-[#2563EB]"   },
          ].map((k) => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-medium text-slate-500">{k.label}</p>
              <p className={cn("text-xl font-bold tabular-nums mt-1", k.color)}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TitleIcon className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-semibold text-slate-900">
              {title} <span className="text-slate-400 font-normal ml-1">({rows.length})</span>
            </h3>
          </div>
          {rows.length > 0 && (
            <span className="text-[12px] font-semibold text-slate-700 tabular-nums">
              Total £{total.toLocaleString()}
            </span>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">No {title.toLowerCase()} yet</p>
            <p className="text-[12.5px] text-slate-500">{emptyCopy}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Job</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((j) => {
                  const amount = mode === "quotes"
                    ? (j.approved_amount ?? j.quoted_amount ?? 0)
                    : (j.invoiced_amount ?? 0)
                  return (
                    <tr key={j.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/property-manager/work/jobs/${j.id}`} className="text-[13px] font-semibold text-slate-800 hover:text-[#2563EB]">
                          {j.title}
                        </Link>
                        {j.reference && <p className="text-[11px] text-slate-400">{j.reference}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize", statusColor(j.status))}>
                          {j.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-[12px] text-slate-600">
                        {j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-slate-800 tabular-nums">
                        £{Number(amount).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
