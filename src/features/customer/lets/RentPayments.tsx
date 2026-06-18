"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Wallet, CheckCircle2, AlertTriangle, ShieldCheck, Gift, Download, FileText, RefreshCw, Headphones,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill, type PillTone } from "../components/StatusPill"
import TenancySubNav from "./TenancySubNav"
import type { Tenancy } from "../data/lets"

interface Sched { id: string; month: string; due: string; amountPence: number; status: string; tone: PillTone; method: string }

export default function RentPayments({ t }: { t: Tenancy }) {
  const { toast } = useCustomerToast()
  const schedule: Sched[] = [
    { id: "jun", month: "June 2025", due: "1 Jun 2025", amountPence: t.rentPence, status: "Due", tone: "amber", method: "Direct debit" },
    { id: "may", month: "May 2025", due: "1 May 2025", amountPence: t.rentPence, status: "Paid", tone: "emerald", method: "Direct debit" },
    { id: "apr", month: "April 2025", due: "1 Apr 2025", amountPence: t.rentPence, status: "Paid", tone: "emerald", method: "Direct debit" },
    { id: "mar", month: "March 2025", due: "1 Mar 2025", amountPence: t.rentPence, status: "Paid", tone: "emerald", method: "Visa ····4242" },
    { id: "feb", month: "February 2025", due: "1 Feb 2025", amountPence: t.rentPence, status: "Paid", tone: "emerald", method: "Visa ····4242" },
  ]
  const [selectedId, setSelectedId] = useState("jun")
  const selected = schedule.find((s) => s.id === selectedId) ?? schedule[0]

  const KPIS = [
    { id: "next", label: "Next rent due", value: formatPence(t.rentPence, "GBP"), sub: t.nextPaymentDate, icon: Wallet, bg: "bg-amber-50 text-amber-600" },
    { id: "paid", label: "Paid this year", value: "£9,900", sub: "6 payments", icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
    { id: "outstanding", label: "Outstanding balance", value: "£0.00", sub: "Up to date", icon: AlertTriangle, bg: "bg-blue-50 text-blue-600" },
    { id: "deposit", label: "Deposit held", value: formatPence(t.depositPence, "GBP"), sub: "DPS protected", icon: ShieldCheck, bg: "bg-violet-50 text-violet-600" },
    { id: "credit", label: "Overpayment credit", value: "£150.00", sub: "Auto-applied", icon: Gift, bg: "bg-emerald-50 text-emerald-600" },
  ]

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="w-4 h-4" /> Back to tenancy</Link>
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-[22px] font-bold text-slate-900">Rent Payments</h1><p className="text-[13px] text-slate-500 mt-1">{t.property} · {t.location} · {t.id}</p></div>
      </div>
      <TenancySubNav id={t.id} active="rent" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
            <p className="text-[16px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
            <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
            <p className="text-[10.5px] text-slate-400">{k.sub}</p>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[14px] font-bold text-slate-900 mb-3">Rent schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 pr-2 font-semibold">Month</th><th className="py-2 px-2 font-semibold">Due date</th><th className="py-2 px-2 font-semibold">Amount</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 font-semibold">Method</th><th className="py-2 px-2 font-semibold w-16">Receipt</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {schedule.map((s) => { const active = s.id === selectedId; return (
                  <tr key={s.id} onClick={() => setSelectedId(s.id)} className={cn("text-[12.5px] cursor-pointer", active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50")}>
                    <td className="py-3 pr-2 font-semibold text-slate-800">{s.month}</td>
                    <td className="py-3 px-2 text-slate-500">{s.due}</td>
                    <td className="py-3 px-2 font-semibold text-slate-900">{formatPence(s.amountPence, "GBP")}</td>
                    <td className="py-3 px-2"><StatusPill tone={s.tone}>{s.status}</StatusPill></td>
                    <td className="py-3 px-2 text-slate-500">{s.method}</td>
                    <td className="py-3 px-2">{s.status === "Paid" ? <button onClick={(e) => { e.stopPropagation(); toast("Downloading receipt…", "info") }} className="text-blue-600"><Download className="w-4 h-4" /></button> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: payment details */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <p className="text-[12px] text-slate-400">{selected.month} — Payment details</p>
          <p className="text-[26px] font-bold text-slate-900 mt-1">{formatPence(selected.amountPence, "GBP")}</p>
          <StatusPill tone={selected.tone}>{selected.status}</StatusPill>
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
            <Row l="Rent" r={formatPence(selected.amountPence, "GBP")} />
            <Row l="Service charge" r="£0.00" />
            <Row l="Due date" r={selected.due} />
            <Row l="Payment method" r={selected.method} />
          </div>
          <div className="mt-3 space-y-2">
            {selected.status === "Due" && <button onClick={() => toast("Opening secure payment…", "info")} className="w-full bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold">Pay {formatPence(selected.amountPence, "GBP")}</button>}
            <Btn icon={Download} onClick={() => toast("Downloading receipt…", "info")}>Download receipt</Btn>
            <Btn icon={FileText} onClick={() => toast("Downloading pro forma…", "info")}>Download pro forma invoice</Btn>
            <Btn icon={RefreshCw} onClick={() => toast("Autopay — coming soon", "info")}>Set up autopay</Btn>
            <Link href="/customer/help" className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Headphones className="w-4 h-4" /> Contact support</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[12px]"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium">{r}</span></div>
}
function Btn({ icon: Icon, children, onClick }: { icon: typeof Download; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Icon className="w-4 h-4" /> {children}</button>
}
