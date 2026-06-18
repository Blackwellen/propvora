"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Download, ClipboardCheck, CheckCircle2, Clock, Calendar, FileText, Key,
  Gauge, Camera, MessageSquare, Upload, PenLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { StatusPill, type PillTone } from "../components/StatusPill"
import TenancySubNav from "./TenancySubNav"
import type { Tenancy } from "../data/lets"

interface Item { id: string; label: string; category: string; status: string; tone: PillTone; icon: typeof Key; done: boolean }
const INITIAL: Item[] = [
  { id: "keys", label: "Keys collected", category: "Access", status: "Complete", tone: "emerald", icon: Key, done: true },
  { id: "inventory", label: "Inventory reviewed & signed", category: "Inventory", status: "Pending", tone: "amber", icon: FileText, done: false },
  { id: "electric", label: "Electricity meter reading", category: "Meters", status: "Complete", tone: "emerald", icon: Gauge, done: true },
  { id: "gas", label: "Gas meter reading", category: "Meters", status: "Pending", tone: "amber", icon: Gauge, done: false },
  { id: "water", label: "Water meter reading", category: "Meters", status: "Complete", tone: "emerald", icon: Gauge, done: true },
  { id: "photos", label: "Condition photos uploaded", category: "Condition", status: "Pending", tone: "amber", icon: Camera, done: false },
  { id: "utilities", label: "Utilities transferred", category: "Setup", status: "Complete", tone: "emerald", icon: CheckCircle2, done: true },
  { id: "council", label: "Council tax registered", category: "Setup", status: "Pending", tone: "amber", icon: CheckCircle2, done: false },
]

export default function MoveIn({ t }: { t: Tenancy }) {
  const { toast } = useCustomerToast()
  const [items, setItems] = useState(INITIAL)
  const done = items.filter((i) => i.done).length
  const pct = Math.round((done / items.length) * 100)

  function toggle(id: string) {
    setItems((arr) => arr.map((i) => i.id === id ? { ...i, done: !i.done, status: !i.done ? "Complete" : "Pending", tone: (!i.done ? "emerald" : "amber") as PillTone } : i))
  }

  const KPIS = [
    { id: "completion", label: "Checklist completion", value: `${pct}%`, icon: ClipboardCheck, bg: "bg-blue-50 text-blue-600" },
    { id: "items", label: "Items completed", value: `${done}`, icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
    { id: "pending", label: "Pending actions", value: `${items.length - done}`, icon: Clock, bg: "bg-amber-50 text-amber-600" },
    { id: "date", label: "Move-in date", value: t.moveIn, icon: Calendar, bg: "bg-violet-50 text-violet-600" },
    { id: "docs", label: "Documents uploaded", value: "6", icon: FileText, bg: "bg-blue-50 text-blue-600" },
  ]

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="w-4 h-4" /> Back to tenancy</Link>
      <div className="flex items-center justify-between gap-3"><div><h1 className="text-[22px] font-bold text-slate-900">Move-in Checklist</h1><p className="text-[13px] text-slate-500 mt-1">Keys, inventory, meter readings and condition photos for {t.property}.</p></div><button onClick={() => toast("Downloading checklist…", "info")} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4" /> Download checklist</button></div>
      <TenancySubNav id={t.id} active="movein" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
            <p className="text-[16px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
            <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Move-in checklist</h3><span className="text-[12px] font-semibold text-blue-600">{done}/{items.length} complete</span></div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4"><div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
          <ul className="divide-y divide-slate-50">
            {items.map((i) => { const Icon = i.icon; return (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <button onClick={() => toggle(i.id)} className={cn("w-6 h-6 rounded-md border flex items-center justify-center shrink-0", i.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300")}>{i.done && <CheckCircle2 className="w-4 h-4" />}</button>
                <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", i.done ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400")}><Icon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0"><p className={cn("text-[13px] font-semibold", i.done ? "text-slate-500" : "text-slate-800")}>{i.label}</p><p className="text-[11px] text-slate-400">{i.category}</p></div>
                <StatusPill tone={i.tone}>{i.status}</StatusPill>
                {i.id === "photos" ? <button onClick={() => toast("Upload photos (upload-only) — coming soon", "info")} className="text-[11.5px] font-semibold text-blue-600 inline-flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Upload</button> : i.category === "Meters" && !i.done ? <button onClick={() => toast("Add meter reading — coming soon", "info")} className="text-[11.5px] font-semibold text-blue-600">Add reading</button> : i.id === "inventory" ? <button onClick={() => toast("Signature requested", "info")} className="text-[11.5px] font-semibold text-blue-600 inline-flex items-center gap-1"><PenLine className="w-3.5 h-3.5" /> Sign</button> : null}
              </li>
            )})}
          </ul>
        </div>

        {/* Right */}
        <aside className="space-y-5 sticky top-[84px]">
          <Card title="Move-in summary">
            <Row l="Move-in date" r={t.moveIn} />
            <Row l="Property" r={t.property} />
            <Row l="Completion" r={`${pct}%`} />
          </Card>
          <Card title="Contacts">
            <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-slate-200" /><div><p className="text-[12px] font-semibold text-slate-800">{t.landlord}</p><p className="text-[10.5px] text-slate-400">Letting agent</p></div></div>
            <button onClick={() => toast("Messaging…", "info")} className="mt-2 w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"><MessageSquare className="w-4 h-4" /> Message agent</button>
          </Card>
          <button onClick={() => toast(pct === 100 ? "Move-in marked complete 🎉" : "Complete all items first", pct === 100 ? "success" : "warning")} className={cn("w-full rounded-xl py-3 text-[13px] font-semibold", pct === 100 ? "bg-emerald-600 text-white" : "bg-[#2563EB] text-white")}>Mark move-in complete</button>
        </aside>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"><p className="text-[13px] font-bold text-slate-900 mb-2.5">{title}</p>{children}</div>
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">{l}</span><span className="text-[12px] font-semibold text-slate-800">{r}</span></div>
}
