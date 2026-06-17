"use client"

import React from "react"
import Link from "next/link"
import { PoundSterling, ArrowUpRight } from "lucide-react"
import { SectionCard, fmtGBP, type TenancyDisplay } from "./shared"

export function PaymentsTab({ t }: { t: TenancyDisplay }) {
  const rent = t.rent ?? 0
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">Rent terms shown from the tenancy. Recorded payments, arrears and receipts live in Money.</p>
        <Link href="/app/money" className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-blue-600 rounded-xl px-4 py-2 hover:bg-blue-700 transition-colors shadow-sm">
          Open Money <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Monthly Rent", value: rent > 0 ? fmtGBP(rent) : "—", sub: "Per month" },
          { label: "Annualised", value: rent > 0 ? fmtGBP(rent * 12) : "—", sub: "Rent × 12" },
          { label: "Deposit Held", value: t.deposit ? fmtGBP(t.deposit) : "—", sub: t.depositScheme },
          { label: "Status", value: t.status, sub: "Tenancy" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{k.label}</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">{k.value}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <SectionCard className="p-10 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <PoundSterling className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">Payment history is tracked in Money</p>
          <p className="text-[12px] text-slate-500 mt-1">Record rent receipts, charges and arrears against this tenancy in the Money section.</p>
        </div>
        <Link href="/app/money" className="text-[12px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
          Go to Money <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </SectionCard>
    </div>
  )
}
