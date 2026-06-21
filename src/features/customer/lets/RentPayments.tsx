"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, CheckCircle2, Gift, ShieldCheck, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { type PillTone } from "../components/StatusPill"
import TenancySubNav from "./TenancySubNav"
import type { Tenancy } from "../data/lets"
import RentScheduleTable from "./components/tenancy/RentScheduleTable"
import RentPaymentPanel from "./components/tenancy/RentPaymentPanel"

interface Sched { id: string; month: string; due: string; amountPence: number; status: string; tone: PillTone; method: string }

export default function RentPayments({ t }: { t: Tenancy }) {
  const schedule: Sched[] = []
  const [selectedId, setSelectedId] = useState("")
  const selected = schedule.find((s) => s.id === selectedId)

  const KPIS = [
    { id: "next", label: "Next rent due", value: formatPence(t.rentPence, "GBP"), sub: t.nextPaymentDate, icon: Wallet, bg: "bg-amber-50 text-amber-600" },
    { id: "paid", label: "Paid this year", value: "—", sub: "No payment history yet", icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
    { id: "outstanding", label: "Outstanding balance", value: "£0.00", sub: "Up to date", icon: AlertTriangle, bg: "bg-blue-50 text-blue-600" },
    { id: "deposit", label: "Deposit held", value: formatPence(t.depositPence, "GBP"), sub: "DPS protected", icon: ShieldCheck, bg: "bg-violet-50 text-violet-600" },
    { id: "credit", label: "Overpayment credit", value: "—", sub: "No credit held", icon: Gift, bg: "bg-emerald-50 text-emerald-600" },
  ]

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" /> Back to tenancy
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Rent Payments</h1>
          <p className="text-[13px] text-slate-500 mt-1">{t.property} · {t.location} · {t.id}</p>
        </div>
      </div>
      <TenancySubNav id={t.id} active="rent" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
              <p className="text-[16px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
              <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
              <p className="text-[10.5px] text-slate-400">{k.sub}</p>
            </div>
          )
        })}
      </div>

      {schedule.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-[13px] text-slate-400">No rent payment history yet. Payments will appear here once your tenancy is active.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
          <RentScheduleTable schedule={schedule} selectedId={selectedId} onSelect={setSelectedId} />
          {selected && <RentPaymentPanel selected={selected} />}
        </div>
      )}
    </div>
  )
}
