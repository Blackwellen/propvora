"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { type PillTone } from "../components/StatusPill"
import { propertyImages as IMG } from "../data/mock"
import PaymentsKpiStrip from "./components/PaymentsKpiStrip"
import PaymentHistoryTable from "./components/PaymentHistoryTable"
import PaymentMethodsSection from "./components/PaymentMethodsSection"
import PaymentDetailRail from "./components/PaymentDetailRail"

interface Pay {
  id: string; property: string; desc: string; image: string; amountPence: number; due: string
  status: string; tone: PillTone; method: string; canPay?: boolean
}
const PAYMENTS: Pay[] = []

export default function PaymentsClient() {
  const [selectedId, setSelectedId] = useState("")
  const selected = PAYMENTS.find((p) => p.id === selectedId)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900">Payments</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Track, manage and make payments for your stays and lets in one secure place.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-3 py-1.5"><ShieldCheck className="w-4 h-4" /> All payments protected</span>
      </div>

      <PaymentsKpiStrip />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-5">
          <PaymentHistoryTable payments={PAYMENTS} selectedId={selectedId} onSelect={setSelectedId} />
          <PaymentMethodsSection />
        </div>

        {selected ? (
          <PaymentDetailRail selected={selected} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
            <p className="text-[13px] text-slate-400">Select a payment to see details.</p>
          </div>
        )}
      </div>
    </div>
  )
}
