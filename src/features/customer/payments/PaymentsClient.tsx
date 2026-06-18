"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Wallet, ShieldCheck, RotateCcw, Home, CreditCard, Receipt, Search, Filter, Plus,
  Download, CheckCircle2, Headphones, ChevronRight, Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill, type PillTone } from "../components/StatusPill"
import { propertyImages as IMG } from "../data/mock"

const KPIS = [
  { id: "upcoming", label: "Upcoming payments", value: "£2,875.00", sub: "Next 30 days", icon: Wallet, bg: "bg-blue-50 text-blue-600" },
  { id: "deposits", label: "Deposits held", value: "£1,650.00", sub: "Across 2 tenancies", icon: ShieldCheck, bg: "bg-violet-50 text-violet-600" },
  { id: "refunds", label: "Refunds in progress", value: "£320.00", sub: "1 in review", icon: RotateCcw, bg: "bg-emerald-50 text-emerald-600" },
  { id: "rent", label: "Rent due soon", value: "£1,450.00", sub: "Due 1 Jun 2025", icon: Home, bg: "bg-amber-50 text-amber-600" },
  { id: "methods", label: "Saved methods", value: "3", sub: "2 cards · 1 bank", icon: CreditCard, bg: "bg-blue-50 text-blue-600" },
  { id: "receipts", label: "Receipts", value: "24", sub: "All time", icon: Receipt, bg: "bg-slate-50 text-slate-500" },
]
interface Pay {
  id: string; property: string; desc: string; image: string; amountPence: number; due: string
  status: string; tone: PillTone; method: string; canPay?: boolean
}
const PAYMENTS: Pay[] = [
  { id: "p1", property: "Riverside Apartment", desc: "Stay · 4 nights", image: IMG.cityLoft, amountPence: 48500, due: "Paid 10 Apr 2025", status: "Paid", tone: "emerald", method: "Visa ····4242" },
  { id: "p2", property: "Riverside Cottage", desc: "Stay · balance due", image: IMG.riverside, amountPence: 12000, due: "Due 30 May 2025", status: "Due", tone: "amber", method: "Visa ····4242", canPay: true },
  { id: "p3", property: "Hilltop Retreat", desc: "Monthly rent · June", image: IMG.meadow, amountPence: 145000, due: "Due 1 Jun 2025", status: "Scheduled", tone: "blue", method: "Direct debit" },
  { id: "p4", property: "City Loft Apartment", desc: "Stay · deposit", image: IMG.cityLoft, amountPence: 15000, due: "Refunded 12 May 2025", status: "Refunded", tone: "violet", method: "Visa ····4242" },
  { id: "p5", property: "Seaside Cottage", desc: "Stay · 7 nights", image: IMG.seaside, amountPence: 11000, due: "Partially paid", status: "Partial", tone: "amber", method: "Mastercard ····8810", canPay: true },
  { id: "p6", property: "Meadow View Cottage", desc: "Stay · 3 nights", image: IMG.meadow, amountPence: 185000, due: "Paid 2 May 2025", status: "Paid", tone: "emerald", method: "Visa ····4242" },
]

export default function PaymentsClient() {
  const { toast } = useCustomerToast()
  const [selectedId, setSelectedId] = useState("p2")
  const selected = PAYMENTS.find((p) => p.id === selectedId) ?? PAYMENTS[0]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900">Payments</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Track, manage and make payments for your stays and lets in one secure place.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-3 py-1.5"><ShieldCheck className="w-4 h-4" /> All payments protected</span>
      </div>

      {/* KPIs */}
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-5">
          {/* Payments table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-slate-900">Recent &amp; upcoming payments</h3>
              <div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input placeholder="Search" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none w-32" /></div><button className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-slate-600"><Filter className="w-3.5 h-3.5" /> Filter</button></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 pr-2 font-semibold">Payment</th><th className="py-2 px-2 font-semibold">Amount</th><th className="py-2 px-2 font-semibold">Due</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 font-semibold">Method</th><th className="py-2 px-2 font-semibold w-20"></th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {PAYMENTS.map((p) => {
                    const active = p.id === selectedId
                    return (
                      <tr key={p.id} onClick={() => setSelectedId(p.id)} className={cn("text-[12.5px] cursor-pointer", active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50")}>
                        <td className="py-3 pr-2"><div className="flex items-center gap-2.5 min-w-[170px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" /><div className="min-w-0"><p className="font-semibold text-slate-800 truncate">{p.property}</p><p className="text-[11px] text-slate-400 truncate">{p.desc}</p></div></div></td>
                        <td className="py-3 px-2 font-semibold text-slate-900">{formatPence(p.amountPence, "GBP")}</td>
                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{p.due}</td>
                        <td className="py-3 px-2"><StatusPill tone={p.tone}>{p.status}</StatusPill></td>
                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{p.method}</td>
                        <td className="py-3 px-2">{p.canPay ? <button onClick={(e) => { e.stopPropagation(); toast("Opening payment…", "info") }} className="bg-[#2563EB] text-white rounded-lg px-2.5 py-1 text-[11.5px] font-semibold">Pay now</button> : <button onClick={(e) => { e.stopPropagation(); toast("Opening receipt…", "info") }} className="text-[11.5px] font-semibold text-blue-600">View</button>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* methods + autopay + receipts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-2">Saved payment methods</p>
              {[["Visa", "····4242", "Expires 09/27"], ["Mastercard", "····8810", "Expires 03/26"], ["HSBC", "····1180", "Bank account"]].map(([b, n, e]) => <div key={n} className="flex items-center gap-2.5 py-2 border-b border-slate-50 last:border-0"><span className="w-9 h-7 rounded bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">{b.slice(0, 4)}</span><div className="flex-1"><p className="text-[12px] font-semibold text-slate-700">{b} {n}</p><p className="text-[10.5px] text-slate-400">{e}</p></div></div>)}
              <button onClick={() => toast("Add payment method — coming soon", "info")} className="w-full mt-2 inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"><Plus className="w-3.5 h-3.5" /> Add payment method</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-2">Autopay &amp; direct debit</p>
              <div className="flex items-center justify-between py-2"><div><p className="text-[12px] font-semibold text-slate-700">Rent autopay</p><p className="text-[10.5px] text-slate-400">Hilltop Retreat · 1st monthly</p></div><Toggle on toast={toast} /></div>
              <div className="flex items-center justify-between py-2"><div><p className="text-[12px] font-semibold text-slate-700">Balance reminders</p><p className="text-[10.5px] text-slate-400">3 days before due</p></div><Toggle on toast={toast} /></div>
              <button onClick={() => toast("Manage autopay — coming soon", "info")} className="w-full mt-2 border border-slate-200 rounded-xl py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">Manage autopay</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-2">Receipts &amp; statements</p>
              {[["April 2025 statement", "PDF · 84 KB"], ["March 2025 statement", "PDF · 79 KB"], ["Annual summary 2024", "PDF · 142 KB"]].map(([n, s]) => <button key={n} onClick={() => toast(`Downloading ${n}…`, "info")} className="w-full flex items-center justify-between py-2 border-b border-slate-50 last:border-0 group"><span className="text-left"><span className="block text-[12px] font-medium text-slate-700">{n}</span><span className="block text-[10.5px] text-slate-400">{s}</span></span><Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" /></button>)}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <aside className="space-y-5 sticky top-[84px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[14px] font-bold text-slate-900 mb-3">Payment details</p>
            <div className="flex gap-2.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={selected.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" /><div><p className="text-[12.5px] font-semibold text-slate-800">{selected.property}</p><p className="text-[11px] text-slate-400">{selected.desc}</p><StatusPill tone={selected.tone}>{selected.status}</StatusPill></div></div>
            <p className="text-[24px] font-bold text-slate-900 mt-3">{formatPence(selected.amountPence, "GBP")}</p>
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
              <Row l="Subtotal" r={formatPence(Math.round(selected.amountPence * 0.85), "GBP")} />
              <Row l="Cleaning fee" r="£50.00" />
              <Row l="Service fee" r="£35.00" />
              <div className="flex items-center justify-between pt-1 border-t border-slate-100"><span className="text-[12.5px] font-semibold text-slate-700">Total</span><span className="text-[13px] font-bold text-slate-900">{formatPence(selected.amountPence, "GBP")}</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
              <Row l="Payment method" r={selected.method} />
              <Row l="Due" r={selected.due} />
              <Row l="Reference" r="PMT-77123" />
            </div>
            <div className="mt-3 space-y-2">
              {selected.canPay && <button onClick={() => toast("Opening secure payment…", "info")} className="w-full bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold">Pay {formatPence(selected.amountPence, "GBP")}</button>}
              <button onClick={() => toast("Downloading receipt…", "info")} className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4" /> Download receipt</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[14px] font-bold text-slate-900 mb-2">Deposits &amp; refunds</p>
            <div className="flex items-center justify-between py-2"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></span><div><p className="text-[12px] font-semibold text-slate-700">Deposit held</p><p className="text-[10.5px] text-slate-400">Hilltop Retreat</p></div></div><span className="text-[12.5px] font-bold text-slate-900">£1,650</span></div>
            <div className="flex items-center justify-between py-2"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><RotateCcw className="w-4 h-4" /></span><div><p className="text-[12px] font-semibold text-slate-700">Refund in review</p><p className="text-[10.5px] text-slate-400">City Loft Apartment</p></div></div><span className="text-[12.5px] font-bold text-slate-900">£320</span></div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900">Payment support</p>
            <p className="text-[11.5px] text-slate-400 mt-1 mb-2">Questions about a charge or refund? We're here to help.</p>
            <Link href="/customer/help" className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Headphones className="w-4 h-4" /> Contact support</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[12px]"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium text-right">{r}</span></div>
}
function Toggle({ on, toast }: { on?: boolean; toast: (m: string, k?: "success" | "info" | "warning" | "error") => void }) {
  const [v, setV] = useState(!!on)
  return <button onClick={() => { setV(!v); toast(!v ? "Enabled" : "Disabled", "success") }} className={cn("w-9 h-5 rounded-full p-0.5 transition", v ? "bg-emerald-500" : "bg-slate-200")}><span className={cn("block w-4 h-4 rounded-full bg-white transition-transform", v && "translate-x-4")} /></button>
}
