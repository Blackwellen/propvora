"use client"

import { Plus, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useCustomerToast } from "../../components/toast"

function Toggle({ on, toast }: { on?: boolean; toast: (m: string, k?: "success" | "info" | "warning" | "error") => void }) {
  const [v, setV] = useState(!!on)
  return <button onClick={() => { setV(!v); toast(!v ? "Enabled" : "Disabled", "success") }} className={cn("w-9 h-5 rounded-full p-0.5 transition", v ? "bg-emerald-500" : "bg-slate-200")}><span className={cn("block w-4 h-4 rounded-full bg-white transition-transform", v && "translate-x-4")} /></button>
}

export default function PaymentMethodsSection() {
  const { toast } = useCustomerToast()
  return (
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
  )
}
