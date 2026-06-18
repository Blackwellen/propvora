"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Key, Truck, Wallet, Wrench, FolderOpen, Search, ChevronRight, FileText, MessageSquare,
  RotateCcw, LogOut, CalendarClock, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../../components/toast"
import { StatusPill, type PillTone } from "../../components/StatusPill"
import { tenancies, type TenancyStatus } from "../../data/lets"

const KPIS = [
  { id: "active", label: "Active tenancies", value: "2", icon: Key, bg: "bg-emerald-50 text-emerald-600" },
  { id: "movein", label: "Upcoming move-ins", value: "1", icon: Truck, bg: "bg-blue-50 text-blue-600" },
  { id: "rent", label: "Rent due", value: "£1,450", icon: Wallet, bg: "bg-amber-50 text-amber-600" },
  { id: "maint", label: "Maintenance open", value: "2", icon: Wrench, bg: "bg-violet-50 text-violet-600" },
  { id: "docs", label: "Documents pending", value: "3", icon: FolderOpen, bg: "bg-rose-50 text-rose-500" },
]
const STATUS_TONE: Record<TenancyStatus, PillTone> = { Active: "emerald", Upcoming: "blue", "Notice given": "amber" }

export default function TenancyTab() {
  const { toast } = useCustomerToast()
  const [selectedId, setSelectedId] = useState(tenancies[0].id)
  const selected = tenancies.find((t) => t.id === selectedId) ?? tenancies[0]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
            <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
            <p className="text-[12px] font-medium text-slate-500 mt-1">{k.label}</p>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Your tenancies</h3><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input placeholder="Search" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none w-36" /></div></div>
          <div className="space-y-2">
            {tenancies.map((t) => { const active = t.id === selectedId; return (
              <button key={t.id} onClick={() => setSelectedId(t.id)} className={cn("w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors", active ? "outline outline-2 -outline-offset-2 outline-blue-500 bg-blue-50/30" : "hover:bg-slate-50")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-slate-900 truncate">{t.property}</p><p className="text-[11.5px] text-slate-400">{t.location} · {t.id}</p><p className="text-[11.5px] text-slate-500 mt-0.5">Next payment {t.nextPaymentDate}</p></div>
                <div className="text-right shrink-0"><StatusPill tone={STATUS_TONE[t.status]}>{t.status}</StatusPill><p className="text-[13px] font-bold text-slate-900 mt-1">{formatPence(t.rentPence, "GBP")}<span className="text-[10px] text-slate-400 font-normal">/mo</span></p></div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            )})}
          </div>
        </div>

        {/* Right panel */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <div className="relative rounded-xl overflow-hidden h-32">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={selected.image} alt="" className="w-full h-full object-cover" /><div className="absolute top-2.5 left-2.5"><StatusPill tone={STATUS_TONE[selected.status]} className="bg-white/95">{selected.status}</StatusPill></div></div>
          <h3 className="text-[15px] font-bold text-slate-900 mt-3">{selected.property}</h3>
          <p className="text-[12px] text-slate-400">{selected.location} · {selected.id}</p>

          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
            <Field label="Monthly rent" value={formatPence(selected.rentPence, "GBP")} /><Field label="Next payment" value={selected.nextPaymentDate} />
            <Field label="Landlord / manager" value={selected.landlord} /><Field label="Deposit held" value={formatPence(selected.depositPence, "GBP")} />
            <Field label="Move-in" value={selected.moveIn} /><Field label="Term" value={`${selected.termMonths} months`} />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Urgent actions</p>
            <div className="bg-amber-50 rounded-lg p-2.5 flex items-center justify-between"><div><p className="text-[11.5px] font-semibold text-amber-700">Rent due {selected.nextPaymentDate}</p><p className="text-[10.5px] text-amber-600">{formatPence(selected.rentPence, "GBP")}</p></div><Link href={`/customer/lets/tenancies/${selected.id}/rent-payments`} className="text-[11px] font-semibold bg-white border border-amber-200 rounded-lg px-2 py-1 text-amber-700">Pay rent</Link></div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Tenancy timeline</p>
            <ol className="space-y-1.5">
              <TL title="Tenancy started" sub={selected.startDate} done />
              <TL title="Next rent payment" sub={selected.nextPaymentDate} />
              <TL title="Inspection due" sub="15 Jul 2025" />
              <TL title="Renewal window" sub={`${selected.termMonths === 12 ? "Jan 2026" : "Jan 2027"}`} />
            </ol>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <Link href={`/customer/lets/tenancies/${selected.id}`} className="text-center bg-[#0D1B2A] text-white rounded-xl py-2 text-[12px] font-semibold col-span-2">Open tenancy</Link>
            <QA icon={FileText} label="Upload document" onClick={() => toast("Upload — coming soon", "info")} />
            <QA icon={Wrench} label="Report maintenance" href={`/customer/lets/tenancies/${selected.id}/maintenance`} />
            <QA icon={MessageSquare} label="Message manager" onClick={() => toast("Messaging manager…", "info")} />
            <QA icon={RotateCcw} label="Renew tenancy" onClick={() => toast("Renewal — coming soon", "info")} />
            <QA icon={LogOut} label="Give notice" onClick={() => toast("Give notice — coming soon", "info")} />
            <QA icon={CalendarClock} label="View inspections" onClick={() => toast("Inspections — coming soon", "info")} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10.5px] text-slate-400">{label}</p><p className="text-[12.5px] font-semibold text-slate-800">{value}</p></div>
}
function TL({ title, sub, done }: { title: string; sub: string; done?: boolean }) {
  return <li className="flex items-center gap-2"><CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0", done ? "text-emerald-500" : "text-slate-300")} /><span className="text-[11.5px] text-slate-600 flex-1">{title}</span><span className="text-[10.5px] text-slate-400">{sub}</span></li>
}
function QA({ icon: Icon, label, onClick, href }: { icon: typeof FileText; label: string; onClick?: () => void; href?: string }) {
  const cls = "inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
  return href ? <Link href={href} className={cls}><Icon className="w-3.5 h-3.5" /> {label}</Link> : <button onClick={onClick} className={cls}><Icon className="w-3.5 h-3.5" /> {label}</button>
}
