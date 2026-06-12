"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Download, FileText, Search } from "lucide-react"

type InvoiceStatus = "paid" | "pending" | "failed"

interface Invoice {
  id: string
  date: string
  description: string
  amount: string
  status: InvoiceStatus
  pdf: string
}

const MOCK_INVOICES: Invoice[] = [
  { id: "inv-001", date: "1 Dec 2026", description: "Pro Plan · December 2026",  amount: "£79.00", status: "paid",    pdf: "#" },
  { id: "inv-002", date: "1 Nov 2026", description: "Pro Plan · November 2026",  amount: "£79.00", status: "paid",    pdf: "#" },
  { id: "inv-003", date: "1 Oct 2026", description: "Pro Plan · October 2026",   amount: "£79.00", status: "paid",    pdf: "#" },
  { id: "inv-004", date: "1 Sep 2026", description: "Pro Plan · September 2026", amount: "£79.00", status: "paid",    pdf: "#" },
  { id: "inv-005", date: "1 Aug 2026", description: "Pro Plan · August 2026",    amount: "£79.00", status: "paid",    pdf: "#" },
  { id: "inv-006", date: "1 Jul 2026", description: "Pro Plan · July 2026",      amount: "£79.00", status: "paid",    pdf: "#" },
]

const STATUS_STYLES: Record<InvoiceStatus, { bg: string; text: string; label: string }> = {
  paid:    { bg: "bg-emerald-50", text: "text-emerald-700", label: "Paid"    },
  pending: { bg: "bg-amber-50",   text: "text-amber-700",   label: "Pending" },
  failed:  { bg: "bg-red-50",     text: "text-red-700",     label: "Failed"  },
}

export default function InvoicesPage() {
  const [search, setSearch] = useState("")

  const filtered = MOCK_INVOICES.filter(inv =>
    inv.description.toLowerCase().includes(search.toLowerCase()) ||
    inv.id.toLowerCase().includes(search.toLowerCase())
  )

  const totalPaid = MOCK_INVOICES
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + parseFloat(i.amount.replace("£", "")), 0)

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Invoices</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Download and review your billing history</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total invoices", value: `${MOCK_INVOICES.length}`, sub: "All time" },
          { label: "Total paid",     value: `£${totalPaid.toFixed(2)}`, sub: "This year" },
          { label: "Next invoice",   value: "£79.00", sub: "Due 1 Jan 2027" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{stat.label}</p>
            <p className="text-[18px] font-bold text-slate-900">{stat.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Search + table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-[12.5px] text-slate-700 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export all
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Invoice", "Date", "Description", "Amount", "Status", ""].map(col => (
                  <th
                    key={col}
                    className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[13px] text-slate-400">No invoices found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv, idx) => {
                  const st = STATUS_STYLES[inv.status]
                  return (
                    <tr
                      key={inv.id}
                      className={cn(
                        "border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors",
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono font-semibold text-slate-500">{inv.id.toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12.5px] text-slate-700 whitespace-nowrap">{inv.date}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12.5px] text-slate-800 font-medium">{inv.description}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-bold text-slate-900">{inv.amount}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", st.bg, st.text)}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <a
                          href={inv.pdf}
                          className="flex items-center gap-1.5 text-[12px] font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </a>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11.5px] text-slate-400 text-center mt-4">
        Invoices are generated automatically at the start of each billing period and sent to your billing email address.
      </p>
    </div>
  )
}
