"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Calendar, Camera, CheckCircle2, ClipboardCheck, Clock, Download, FileText,
  Gauge, Key, MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type PillTone } from "../components/StatusPill"
import { useCustomerToast } from "../components/toast"
import TenancySubNav from "./TenancySubNav"
import type { Tenancy } from "../data/lets"
import MoveInChecklist from "./components/tenancy/MoveInChecklist"

interface Item { id: string; label: string; category: string; status: string; tone: PillTone; icon: React.ElementType; done: boolean }
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
    setItems((arr) => arr.map((i) =>
      i.id === id
        ? { ...i, done: !i.done, status: !i.done ? "Complete" : "Pending", tone: (!i.done ? "emerald" : "amber") as PillTone }
        : i
    ))
  }

  const KPIS = [
    { id: "completion", label: "Checklist completion", value: `${pct}%`, icon: ClipboardCheck, bg: "bg-[var(--brand-soft)] text-[var(--brand)]" },
    { id: "items", label: "Items completed", value: `${done}`, icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
    { id: "pending", label: "Pending actions", value: `${items.length - done}`, icon: Clock, bg: "bg-amber-50 text-amber-600" },
    { id: "date", label: "Move-in date", value: t.moveIn, icon: Calendar, bg: "bg-violet-50 text-violet-600" },
    { id: "docs", label: "Documents uploaded", value: "6", icon: FileText, bg: "bg-[var(--brand-soft)] text-[var(--brand)]" },
  ]

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]">
        <ArrowLeft className="w-4 h-4" /> Back to tenancy
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Move-in Checklist</h1>
          <p className="text-[13px] text-slate-500 mt-1">Keys, inventory, meter readings and condition photos for {t.property}.</p>
        </div>
        <button
          onClick={() => toast("Downloading checklist…", "info")}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="w-4 h-4" /> Download checklist
        </button>
      </div>
      <TenancySubNav id={t.id} active="movein" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
              <p className="text-[16px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
              <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <MoveInChecklist items={items} done={done} pct={pct} onToggle={toggle} tenancyId={t.id} />

        <aside className="space-y-5 sticky top-[84px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2.5">Move-in summary</p>
            <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">Move-in date</span><span className="text-[12px] font-semibold text-slate-800">{t.moveIn}</span></div>
            <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">Property</span><span className="text-[12px] font-semibold text-slate-800">{t.property}</span></div>
            <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">Completion</span><span className="text-[12px] font-semibold text-slate-800">{pct}%</span></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2.5">Contacts</p>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-slate-200" />
              <div>
                <p className="text-[12px] font-semibold text-slate-800">{t.landlord}</p>
                <p className="text-[10.5px] text-slate-400">Letting agent</p>
              </div>
            </div>
            <Link
              href="/customer/messages"
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <MessageSquare className="w-4 h-4" /> Message agent
            </Link>
          </div>
          <button
            onClick={() => toast(pct === 100 ? "Move-in marked complete" : "Complete all items first", pct === 100 ? "success" : "warning")}
            className={cn("w-full rounded-xl py-3 text-[13px] font-semibold", pct === 100 ? "bg-emerald-600 text-white" : "bg-[var(--brand)] text-white")}
          >
            Mark move-in complete
          </button>
        </aside>
      </div>
    </div>
  )
}
