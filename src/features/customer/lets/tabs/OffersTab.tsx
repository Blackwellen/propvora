"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Tag, RefreshCw, CheckCircle2, Clock, Wallet, Search, ChevronRight, Check, X, MessageSquare, Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../../components/toast"
import { StatusPill, type PillTone } from "../../components/StatusPill"
import { offers, type OfferStatus } from "../../data/lets"

const KPIS = [
  { id: "open", label: "Open offers", value: "3", icon: Tag, bg: "bg-amber-50 text-amber-600" },
  { id: "counter", label: "Counter offers", value: "2", icon: RefreshCw, bg: "bg-violet-50 text-violet-600" },
  { id: "accepted", label: "Accepted offers", value: "1", icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
  { id: "expired", label: "Expired offers", value: "1", icon: Clock, bg: "bg-slate-50 text-slate-500" },
  { id: "holding", label: "Holding deposits", value: "1", icon: Wallet, bg: "bg-blue-50 text-blue-600" },
]
const STATUS_TONE: Record<OfferStatus, PillTone> = { Open: "amber", "Counter offer": "violet", Accepted: "emerald", Expired: "slate" }

export default function OffersTab() {
  const { toast } = useCustomerToast()
  const [selectedId, setSelectedId] = useState(offers[0].id)
  const selected = offers.find((o) => o.id === selectedId) ?? offers[0]

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
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">All offers</h3><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input placeholder="Search" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none w-36" /></div></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 pr-2 font-semibold">Property</th><th className="py-2 px-2 font-semibold">Rent offered</th><th className="py-2 px-2 font-semibold">Move-in</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 w-8"></th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {offers.map((o) => { const active = o.id === selectedId; return (
                    <tr key={o.id} onClick={() => setSelectedId(o.id)} className={cn("text-[12.5px] cursor-pointer", active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50")}>
                      <td className="py-3 pr-2"><div className="flex items-center gap-2.5 min-w-[160px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={o.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" /><div className="min-w-0"><p className="font-semibold text-slate-800 truncate">{o.property}</p><p className="text-[11px] text-slate-400 truncate">{o.location}</p></div></div></td>
                      <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{formatPence(o.rentOfferedPence, "GBP")}<span className="text-slate-400 font-normal text-[10px]">/mo</span></td>
                      <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{o.moveIn}</td>
                      <td className="py-3 px-2"><StatusPill tone={STATUS_TONE[o.status]}>{o.status}</StatusPill></td>
                      <td className="py-3 px-2"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compare offers */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3">Compare offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {offers.slice(0, 3).map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-[12.5px] font-semibold text-slate-800 truncate">{o.property}</p>
                  <p className="text-[16px] font-bold text-slate-900 mt-1">{formatPence(o.rentOfferedPence, "GBP")}<span className="text-[10px] text-slate-400 font-normal">/mo</span></p>
                  <div className="mt-2 space-y-1 text-[11px] text-slate-500"><Row l="Move-in" r={o.moveIn} /><Row l="Term" r={`${o.tenancyMonths} months`} /><Row l="Furnished" r={o.furnished ? "Yes" : "No"} /></div>
                  <StatusPill tone={STATUS_TONE[o.status]} className="mt-2">{o.status}</StatusPill>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <div className="relative rounded-xl overflow-hidden h-32">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={selected.image} alt="" className="w-full h-full object-cover" /><div className="absolute top-2.5 left-2.5"><StatusPill tone={STATUS_TONE[selected.status]} className="bg-white/95">{selected.status}</StatusPill></div></div>
          <p className="text-[11px] text-slate-400 mt-3">Offer #{selected.id}</p>
          <h3 className="text-[15px] font-bold text-slate-900">{selected.property}</h3>
          <p className="text-[12px] text-slate-400">{selected.location}</p>

          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
            <Field label="Rent offered" value={`${formatPence(selected.rentOfferedPence, "GBP")}/mo`} /><Field label="Asking rent" value={`${formatPence(selected.askingPence, "GBP")}/mo`} />
            <Field label="Move-in date" value={selected.moveIn} /><Field label="Tenancy length" value={`${selected.tenancyMonths} months`} />
            <Field label="Furnished" value={selected.furnished ? "Furnished" : "Unfurnished"} /><Field label="Holding deposit" value={formatPence(selected.holdingDepositPence, "GBP")} />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Payment breakdown</p>
            <Row l="First month's rent" r={formatPence(selected.rentOfferedPence, "GBP")} />
            <Row l="Holding deposit" r={formatPence(selected.holdingDepositPence, "GBP")} />
            <Row l="Security deposit" r={formatPence(selected.rentOfferedPence + 2000, "GBP")} />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Negotiation history</p>
            <ol className="space-y-2">
              <Hist who="You" text={`Offered ${formatPence(selected.rentOfferedPence, "GBP")}/mo`} when="2 days ago" />
              <Hist who="Landlord" text={selected.status === "Counter offer" ? `Countered at ${formatPence(selected.askingPence, "GBP")}/mo` : "Reviewing your offer"} when="1 day ago" landlord />
            </ol>
          </div>

          <div className="mt-3 space-y-2">
            <button onClick={() => toast("Offer accepted", "success")} className="w-full inline-flex items-center justify-center gap-1.5 bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold"><Check className="w-4 h-4" /> {selected.status === "Counter offer" ? "Accept counter-offer" : "Accept offer"}</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => toast("Counter offer — coming soon", "info")} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="w-3.5 h-3.5" /> Counter</button>
              <button onClick={() => toast("Offer declined", "info")} className="inline-flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 rounded-xl py-2 text-[11.5px] font-semibold hover:bg-rose-50"><X className="w-3.5 h-3.5" /> Decline</button>
            </div>
            <Link href={`/customer/lets/offers/${selected.id}`} className="block text-center border border-slate-200 rounded-xl py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">Pay holding deposit</Link>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => toast("Messaging agent…", "info")} className="inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-slate-600"><MessageSquare className="w-3.5 h-3.5" /> Message agent</button>
              <button onClick={() => toast("Downloading terms…", "info")} className="inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-slate-600"><Download className="w-3.5 h-3.5" /> Download terms</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10.5px] text-slate-400">{label}</p><p className="text-[12.5px] font-semibold text-slate-800">{value}</p></div>
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[11.5px]"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium">{r}</span></div>
}
function Hist({ who, text, when, landlord }: { who: string; text: string; when: string; landlord?: boolean }) {
  return <li className="flex gap-2"><span className={cn("w-6 h-6 rounded-full shrink-0", landlord ? "bg-violet-100" : "bg-blue-100")} /><div className="flex-1"><div className="flex items-center justify-between"><p className="text-[11.5px] font-semibold text-slate-700">{who}</p><p className="text-[10px] text-slate-400">{when}</p></div><p className="text-[11px] text-slate-500">{text}</p></div></li>
}
