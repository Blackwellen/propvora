"use client"

import { Wallet, ShieldCheck, RotateCcw, Home, CreditCard, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"

const KPIS = [
  { id: "upcoming", label: "Upcoming payments", value: "£2,875.00", sub: "Next 30 days", icon: Wallet, bg: "bg-blue-50 text-blue-600" },
  { id: "deposits", label: "Deposits held", value: "£1,650.00", sub: "Across 2 tenancies", icon: ShieldCheck, bg: "bg-violet-50 text-violet-600" },
  { id: "refunds", label: "Refunds in progress", value: "£320.00", sub: "1 in review", icon: RotateCcw, bg: "bg-emerald-50 text-emerald-600" },
  { id: "rent", label: "Rent due soon", value: "£1,450.00", sub: "Due 1 Jun 2025", icon: Home, bg: "bg-amber-50 text-amber-600" },
  { id: "methods", label: "Saved methods", value: "3", sub: "2 cards · 1 bank", icon: CreditCard, bg: "bg-blue-50 text-blue-600" },
  { id: "receipts", label: "Receipts", value: "24", sub: "All time", icon: Receipt, bg: "bg-slate-50 text-slate-500" },
]

export default function PaymentsKpiStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {KPIS.map((k) => { const Icon = k.icon; return (
        <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
          <p className="text-[17px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
          <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
          <p className="text-[10.5px] text-slate-400 mt-0.5">{k.sub}</p>
        </div>
      )})}
    </div>
  )
}
