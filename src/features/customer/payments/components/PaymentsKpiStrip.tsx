"use client"

import { Wallet, ShieldCheck, RotateCcw, CheckCircle2, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"

export interface PaymentsKpis {
  upcomingPence: number
  paidPence: number
  depositsPence: number
  refundsPence: number
  receipts: number
}

const ZERO: PaymentsKpis = { upcomingPence: 0, paidPence: 0, depositsPence: 0, refundsPence: 0, receipts: 0 }

export default function PaymentsKpiStrip({ kpis = ZERO }: { kpis?: PaymentsKpis }) {
  const items = [
    { id: "upcoming", label: "Upcoming payments", value: formatPence(kpis.upcomingPence, "GBP"), sub: "Outstanding now", icon: Wallet, bg: "bg-blue-50 text-blue-600" },
    { id: "paid", label: "Total paid", value: formatPence(kpis.paidPence, "GBP"), sub: "All time", icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
    { id: "deposits", label: "Deposits held", value: formatPence(kpis.depositsPence, "GBP"), sub: "Across your bookings", icon: ShieldCheck, bg: "bg-violet-50 text-violet-600" },
    { id: "refunds", label: "Refunds in progress", value: formatPence(kpis.refundsPence, "GBP"), sub: kpis.refundsPence > 0 ? "In review" : "None", icon: RotateCcw, bg: "bg-amber-50 text-amber-600" },
    { id: "receipts", label: "Receipts", value: String(kpis.receipts), sub: "All time", icon: Receipt, bg: "bg-slate-50 text-slate-500" },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((k) => { const Icon = k.icon; return (
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
