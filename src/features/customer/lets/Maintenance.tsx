"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Wrench, Loader, AlertTriangle, Clock, CheckCircle2, Plus, Search, Upload,
  MessageSquare, Calendar, ShieldCheck, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { StatusPill, type PillTone } from "../components/StatusPill"
import TenancySubNav from "./TenancySubNav"
import type { Tenancy } from "../data/lets"

interface Req { id: string; title: string; category: string; reported: string; status: string; tone: PillTone; priority: string; pTone: PillTone }
const REQS: Req[] = [
  { id: "MR-3041", title: "Leaking kitchen tap", category: "Plumbing", reported: "22 May 2025", status: "In progress", tone: "amber", priority: "Medium", pTone: "amber" },
  { id: "MR-3038", title: "Boiler not heating water", category: "Heating", reported: "21 May 2025", status: "Emergency", tone: "red", priority: "Urgent", pTone: "red" },
  { id: "MR-3030", title: "Broken window latch", category: "General", reported: "18 May 2025", status: "Awaiting landlord", tone: "violet", priority: "Low", pTone: "slate" },
  { id: "MR-3021", title: "Faulty smoke alarm", category: "Electrical", reported: "15 May 2025", status: "Open", tone: "blue", priority: "High", pTone: "amber" },
  { id: "MR-3005", title: "Damp patch in bedroom", category: "General", reported: "8 May 2025", status: "Resolved", tone: "emerald", priority: "Medium", pTone: "amber" },
]
const KPIS = [
  { id: "open", label: "Open requests", value: "4", icon: Wrench, bg: "bg-blue-50 text-blue-600" },
  { id: "progress", label: "In progress", value: "2", icon: Loader, bg: "bg-amber-50 text-amber-600" },
  { id: "emergency", label: "Emergency issues", value: "1", icon: AlertTriangle, bg: "bg-rose-50 text-rose-500" },
  { id: "awaiting", label: "Awaiting landlord", value: "1", icon: Clock, bg: "bg-violet-50 text-violet-600" },
  { id: "resolved", label: "Resolved this month", value: "3", icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
]

export default function Maintenance({ t }: { t: Tenancy }) {
  const { toast } = useCustomerToast()
  const [selectedId, setSelectedId] = useState("MR-3041")
  const selected = REQS.find((r) => r.id === selectedId) ?? REQS[0]

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="w-4 h-4" /> Back to tenancy</Link>
      <div className="flex items-center justify-between gap-3"><div><h1 className="text-[22px] font-bold text-slate-900">Maintenance Requests</h1><p className="text-[13px] text-slate-500 mt-1">Report repairs, track progress and stay informed every step of the way.</p></div><button onClick={() => toast("Report repair — opens form", "info")} className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white rounded-xl px-3.5 py-2 text-[12.5px] font-semibold"><Plus className="w-4 h-4" /> Report a repair</button></div>
      <TenancySubNav id={t.id} active="maintenance" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
            <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
            <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Your maintenance requests</h3><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input placeholder="Search" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none w-36" /></div></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 pr-2 font-semibold">Issue</th><th className="py-2 px-2 font-semibold">Category</th><th className="py-2 px-2 font-semibold">Reported</th><th className="py-2 px-2 font-semibold">Priority</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 w-8"></th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {REQS.map((r) => { const active = r.id === selectedId; return (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)} className={cn("text-[12.5px] cursor-pointer", active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50")}>
                    <td className="py-3 pr-2"><p className="font-semibold text-slate-800">{r.title}</p><p className="text-[10.5px] text-slate-400">{r.id}</p></td>
                    <td className="py-3 px-2 text-slate-500">{r.category}</td>
                    <td className="py-3 px-2 text-slate-500">{r.reported}</td>
                    <td className="py-3 px-2"><StatusPill tone={r.pTone}>{r.priority}</StatusPill></td>
                    <td className="py-3 px-2"><StatusPill tone={r.tone}>{r.status}</StatusPill></td>
                    <td className="py-3 px-2"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: issue detail */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <div className="flex items-center justify-between"><p className="text-[12px] text-slate-400">{selected.id}</p><StatusPill tone={selected.tone}>{selected.status}</StatusPill></div>
          <h3 className="text-[15px] font-bold text-slate-900 mt-1">{selected.title}</h3>
          <p className="text-[12px] text-slate-500">{selected.category} · reported {selected.reported}</p>

          <div className="mt-3 pt-3 border-t border-slate-100"><p className="text-[12px] font-semibold text-slate-700 mb-1">Description</p><p className="text-[12px] text-slate-500">Reported by tenant. Awaiting contractor assessment and a confirmed appointment slot.</p></div>

          <div className="mt-3 pt-3 border-t border-slate-100"><p className="text-[12px] font-semibold text-slate-700 mb-1.5">Photos</p><div className="grid grid-cols-4 gap-1.5">{["/property-types/sa.jpg", "/property-types/holiday.jpg", "/property-types/mixed.jpg"].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full h-12 rounded-md object-cover" />
          ))}<button onClick={() => toast("Add photo (upload-only) — coming soon", "info")} className="w-full h-12 rounded-md border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-300"><Upload className="w-4 h-4" /></button></div></div>

          <div className="mt-3 pt-3 border-t border-slate-100"><p className="text-[12px] font-semibold text-slate-700 mb-1.5">Contractor appointment</p><div className="bg-blue-50 rounded-lg p-2.5 flex items-center justify-between"><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /><div><p className="text-[11.5px] font-semibold text-slate-700">26 May 2025, 10:00–12:00</p><p className="text-[10.5px] text-slate-400">PlumbPro Ltd</p></div></div><button onClick={() => toast("Appointment approved", "success")} className="text-[11px] font-semibold bg-white border border-blue-200 rounded-lg px-2 py-1 text-blue-700">Approve</button></div></div>

          <div className="mt-3 pt-3 border-t border-slate-100"><p className="text-[12px] font-semibold text-slate-700 mb-1.5">Timeline</p><ol className="space-y-1.5"><TL title="Reported by you" sub={selected.reported} done /><TL title="Acknowledged by manager" sub="Same day" done /><TL title="Contractor assigned" sub="23 May 2025" done /><TL title="Repair scheduled" sub="26 May 2025" /><TL title="Resolved" sub="Pending" /></ol></div>

          <div className="mt-3 space-y-2">
            <button onClick={() => toast("Messaging property manager…", "info")} className="w-full inline-flex items-center justify-center gap-1.5 bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold"><MessageSquare className="w-4 h-4" /> Message property manager</button>
            <button onClick={() => toast("Marked resolved", "success")} className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><CheckCircle2 className="w-4 h-4" /> Mark resolved</button>
          </div>

          <div className="mt-3 bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><p className="text-[11px] text-slate-600">Emergencies (gas, flooding, no heating in winter) are prioritised within 24 hours. Call the emergency line for urgent issues.</p></div>
        </aside>
      </div>
    </div>
  )
}

function TL({ title, sub, done }: { title: string; sub: string; done?: boolean }) {
  return <li className="flex items-center gap-2"><CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0", done ? "text-emerald-500" : "text-slate-300")} /><span className="text-[11.5px] text-slate-600 flex-1">{title}</span><span className="text-[10.5px] text-slate-400">{sub}</span></li>
}
