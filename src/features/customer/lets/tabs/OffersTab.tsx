"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Tag, RefreshCw, CheckCircle2, Clock, Wallet, Search, ChevronRight, Check, X, MessageSquare, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../../components/toast"
import { StatusPill, type PillTone } from "../../components/StatusPill"
import type { Offer, OfferStatus } from "../../data/lets"

const STATUS_TONE: Record<OfferStatus, PillTone> = { Open: "amber", "Counter offer": "violet", Accepted: "emerald", Expired: "slate" }

export default function OffersTab() {
  const { toast } = useCustomerToast()
  const [data, setData] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState("")
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const res = await fetch("/api/customer/lets?type=offers", { headers: { accept: "application/json" } })
      const j = (await res.json()) as { offers?: Offer[] }
      const rows = j.offers ?? []
      setData(rows)
      setSelectedId((cur) => cur || (rows[0]?.id ?? ""))
    } catch { /* ignore */ } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const selected = data.find((o) => o.id === selectedId) ?? data[0] ?? null

  const kpis = [
    { id: "open", label: "Open offers", value: data.filter((o) => o.status === "Open").length, icon: Tag, bg: "bg-amber-50 text-amber-600" },
    { id: "counter", label: "Counter offers", value: data.filter((o) => o.status === "Counter offer").length, icon: RefreshCw, bg: "bg-violet-50 text-violet-600" },
    { id: "accepted", label: "Accepted offers", value: data.filter((o) => o.status === "Accepted").length, icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
    { id: "expired", label: "Expired offers", value: data.filter((o) => o.status === "Expired").length, icon: Clock, bg: "bg-slate-50 text-slate-500" },
    { id: "holding", label: "Holding deposits", value: data.filter((o) => o.holdingDepositPence > 0).length, icon: Wallet, bg: "bg-blue-50 text-blue-600" },
  ]

  async function patch(body: Record<string, unknown>, okMsg: string) {
    if (!selected || busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/customer/lets/offers", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: selected.id, ...body }),
      })
      if (!res.ok) { toast("Could not update the offer.", "error"); return }
      toast(okMsg, "success")
      await load()
    } catch { toast("Something went wrong.", "error") } finally { setBusy(false) }
  }

  function counter() {
    if (!selected) return
    const input = window.prompt("Enter your revised monthly rent offer (£):", String(Math.round(selected.rentOfferedPence / 100)))
    if (!input) return
    const pounds = Number(input.replace(/[^\d.]/g, ""))
    if (!Number.isFinite(pounds) || pounds <= 0) { toast("Enter a valid amount.", "error"); return }
    void patch({ action: "amend", amountPence: Math.round(pounds * 100) }, "Revised offer sent.")
  }

  if (loading) return <div className="py-16 flex justify-center text-slate-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (data.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
      <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-[14px] font-semibold text-slate-700">No offers yet</p>
      <p className="text-[12.5px] text-slate-400 mt-1">Make an offer on a rental and track it here.</p>
      <Link href="/customer/lets?tab=search" className="mt-3 inline-block text-[12.5px] font-semibold text-blue-600">Browse lets →</Link>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => { const Icon = k.icon; return (
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
            <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">All offers</h3><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input placeholder="Search" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-36" /></div></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 pr-2 font-semibold">Property</th><th className="py-2 px-2 font-semibold">Rent offered</th><th className="py-2 px-2 font-semibold">Move-in</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 w-8"></th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((o) => { const active = o.id === selectedId; return (
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3">Compare offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.slice(0, 3).map((o) => (
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

        {selected && (
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <div className="relative rounded-xl overflow-hidden h-32">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={selected.image} alt="" className="w-full h-full object-cover" /><div className="absolute top-2.5 left-2.5"><StatusPill tone={STATUS_TONE[selected.status]} className="bg-white/95">{selected.status}</StatusPill></div></div>
          <h3 className="text-[15px] font-bold text-slate-900 mt-3">{selected.property}</h3>
          <p className="text-[12px] text-slate-400">{selected.location}</p>

          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
            <Field label="Rent offered" value={`${formatPence(selected.rentOfferedPence, "GBP")}/mo`} /><Field label="Asking rent" value={`${formatPence(selected.askingPence, "GBP")}/mo`} />
            <Field label="Move-in date" value={selected.moveIn} /><Field label="Tenancy length" value={`${selected.tenancyMonths} months`} />
            <Field label="Furnished" value={selected.furnished ? "Furnished" : "Unfurnished"} /><Field label="Holding deposit" value={formatPence(selected.holdingDepositPence, "GBP")} />
          </div>

          <div className="mt-3 space-y-2">
            <button onClick={() => patch({ action: "accept" }, "Offer accepted.")} disabled={busy || selected.status === "Accepted" || selected.status === "Expired"} className="w-full inline-flex items-center justify-center gap-1.5 bg-[var(--brand)] text-white rounded-xl py-2.5 text-[13px] font-semibold disabled:opacity-50"><Check className="w-4 h-4" /> {selected.status === "Counter offer" ? "Accept counter-offer" : "Accept offer"}</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={counter} disabled={busy || selected.status === "Accepted" || selected.status === "Expired"} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className="w-3.5 h-3.5" /> Counter</button>
              <button onClick={() => patch({ action: "withdraw" }, "Offer withdrawn.")} disabled={busy || selected.status === "Accepted" || selected.status === "Expired"} className="inline-flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 rounded-xl py-2 text-[11.5px] font-semibold hover:bg-rose-50 disabled:opacity-50"><X className="w-3.5 h-3.5" /> Withdraw</button>
            </div>
            <Link href={`/customer/lets/offers/${selected.id}`} className="block text-center border border-slate-200 rounded-xl py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">View offer detail</Link>
            <Link href="/customer/messages" className="inline-flex w-full items-center justify-center gap-1.5 text-[11.5px] font-semibold text-slate-600 py-1"><MessageSquare className="w-3.5 h-3.5" /> Message agent</Link>
          </div>
        </aside>
        )}
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
