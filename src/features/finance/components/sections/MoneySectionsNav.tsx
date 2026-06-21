"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight, ChevronRight, TrendingUp, TrendingDown, FileText, Receipt, AlertTriangle, Home } from "lucide-react"

export function MoneySectionsNav() {
  const sections = [
    { label: "Income", href: "/property-manager/money/income", icon: <TrendingUp className="w-4 h-4 text-emerald-600" /> },
    { label: "Expenses", href: "/property-manager/money/expenses", icon: <TrendingDown className="w-4 h-4 text-red-500" /> },
    { label: "Invoices", href: "/property-manager/money/invoices", icon: <FileText className="w-4 h-4 text-blue-600" /> },
    { label: "Bills & Supplier Pay", href: "/property-manager/money/bills", icon: <Receipt className="w-4 h-4 text-amber-600" /> },
    { label: "Arrears", href: "/property-manager/money/arrears", icon: <AlertTriangle className="w-4 h-4 text-orange-600" /> },
    { label: "Deposits", href: "/property-manager/money/deposits", icon: <Home className="w-4 h-4 text-violet-600" /> },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Money Sections</h3>
      <div className="flex flex-col gap-1">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <span className="text-sm font-medium text-slate-700 flex-1">{s.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export function AccountingLinkCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Accounting</h3>
      <p className="text-xs text-slate-500 mb-3">Ledger, journals, P&amp;L and tax reporting live in Accounting.</p>
      <Link href="/property-manager/accounting" className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1">
        Open Accounting <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
