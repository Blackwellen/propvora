"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Calendar, CheckCircle2, CheckCheck, RefreshCw, XCircle, Search, ChevronRight, MapPin,
  MessageSquare, Navigation, ClipboardCheck, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../../components/toast"
import { StatusPill, type PillTone } from "../../components/StatusPill"
import type { Viewing, ViewingStatus } from "../../data/lets"

const STATUS_TONE: Record<ViewingStatus, PillTone> = {
  Upcoming: "blue", Confirmed: "emerald", Completed: "violet", "Reschedule requested": "amber", Cancelled: "red",
}
const PREP = ["Confirm your attendance", "Plan your travel route", "Prepare questions for the agent", "Bring ID and proof of funds"]

export default function ViewingsTab() {
  const { toast } = useCustomerToast()
  const [data, setData] = useState<Viewing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState("")
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const res = await fetch("/api/customer/lets?type=viewings", { headers: { accept: "application/json" } })
      const j = (await res.json()) as { viewings?: Viewing[] }
      const rows = j.viewings ?? []
      setData(rows)
      setSelectedId((cur) => cur || (rows[0]?.id ?? ""))
    } catch { /* ignore */ } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const selected = data.find((v) => v.id === selectedId) ?? data[0] ?? null

  const kpis = [
    { id: "upcoming", label: "Upcoming viewings", value: data.filter((v) => v.status === "Upcoming").length, sub: "Awaiting", icon: Calendar, bg: "bg-blue-50 text-blue-600" },
    { id: "confirmed", label: "Confirmed", value: data.filter((v) => v.status === "Confirmed").length, sub: "Booked in", icon: CheckCheck, bg: "bg-emerald-50 text-emerald-600" },
    { id: "completed", label: "Completed", value: data.filter((v) => v.status === "Completed").length, sub: "Viewed", icon: CheckCircle2, bg: "bg-violet-50 text-violet-600" },
    { id: "reschedule", label: "Reschedule requests", value: data.filter((v) => v.status === "Reschedule requested").length, sub: "Awaiting time", icon: RefreshCw, bg: "bg-amber-50 text-amber-600" },
    { id: "cancel", label: "Cancellations", value: data.filter((v) => v.status === "Cancelled").length, sub: "Cancelled", icon: XCircle, bg: "bg-rose-50 text-rose-500" },
  ]

  async function act(action: "confirm" | "reschedule" | "cancel") {
    if (!selected || busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/customer/lets/viewings", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: selected.id, action }),
      })
      if (!res.ok) { toast("Could not update the viewing.", "error"); return }
      toast(action === "confirm" ? "Viewing confirmed." : action === "cancel" ? "Viewing cancelled." : "Reschedule requested — the agent will propose a new time.", "success")
      await load()
    } catch { toast("Something went wrong.", "error") } finally { setBusy(false) }
  }

  if (loading) return <div className="py-16 flex justify-center text-slate-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (data.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
      <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-[14px] font-semibold text-slate-700">No viewings yet</p>
      <p className="text-[12.5px] text-slate-400 mt-1">Book a viewing from a rental listing and it'll appear here.</p>
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
            <p className="text-[10.5px] text-slate-400">{k.sub}</p>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Your viewings</h3><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input placeholder="Search" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-36" /></div></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 pr-2 font-semibold">Property</th><th className="py-2 px-2 font-semibold">Date &amp; time</th><th className="py-2 px-2 font-semibold">Agent</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 font-semibold">Transport</th><th className="py-2 px-2 w-8"></th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((v) => { const active = v.id === selectedId; return (
                    <tr key={v.id} onClick={() => setSelectedId(v.id)} className={cn("text-[12.5px] cursor-pointer", active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50")}>
                      <td className="py-3 pr-2"><div className="flex items-center gap-2.5 min-w-[160px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={v.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" /><div className="min-w-0"><p className="font-semibold text-slate-800 truncate">{v.property}</p><p className="text-[11px] text-slate-400 truncate">{v.location}</p></div></div></td>
                      <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{v.date}<span className="block text-[11px] text-slate-400">{v.time}</span></td>
                      <td className="py-3 px-2 text-slate-600">{v.agent}</td>
                      <td className="py-3 px-2"><StatusPill tone={STATUS_TONE[v.status]}>{v.status}</StatusPill></td>
                      <td className="py-3 px-2 text-slate-500">{v.transport}</td>
                      <td className="py-3 px-2"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3 flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-blue-500" /> Viewing preparation checklist</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREP.map((p) => <li key={p} className="flex items-center gap-2 text-[12.5px] text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {p}</li>)}
            </ul>
          </div>
        </div>

        {/* Right panel */}
        {selected && (
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <div className="relative rounded-xl overflow-hidden h-36">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={selected.image} alt="" className="w-full h-full object-cover" /><div className="absolute top-2.5 left-2.5"><StatusPill tone={STATUS_TONE[selected.status]} className="bg-white/95">{selected.status}</StatusPill></div></div>
          <h3 className="text-[15px] font-bold text-slate-900 mt-3">{selected.property}</h3>
          <p className="text-[12px] text-slate-400">{selected.location}</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Date" value={selected.date} /><Field label="Time" value={selected.time} /><Field label="Agent" value={selected.agent} /><Field label="Transport" value={selected.transport} />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100"><p className="text-[12px] font-semibold text-slate-700 mb-1">Access instructions</p><p className="text-[12px] text-slate-500">{selected.access}</p></div>
          <div className="mt-3 space-y-2">
            <button onClick={() => act("confirm")} disabled={busy || selected.status === "Confirmed" || selected.status === "Cancelled" || selected.status === "Completed"} className="w-full bg-[var(--brand)] text-white rounded-xl py-2.5 text-[13px] font-semibold disabled:opacity-50">Confirm viewing</button>
            <div className="grid grid-cols-2 gap-2">
              <Btn icon={RefreshCw} onClick={() => act("reschedule")} disabled={busy}>Reschedule</Btn>
              <Btn icon={XCircle} onClick={() => act("cancel")} disabled={busy}>Cancel</Btn>
              <LinkBtn icon={MessageSquare} href="/customer/messages">Message</LinkBtn>
              <Btn icon={Navigation} onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(selected.location)}`, "_blank", "noopener")}>Directions</Btn>
            </div>
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
function Btn({ icon: Icon, children, onClick, disabled }: { icon: typeof MapPin; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Icon className="w-3.5 h-3.5" /> {children}</button>
}
function LinkBtn({ icon: Icon, children, href }: { icon: typeof MapPin; children: React.ReactNode; href: string }) {
  return <Link href={href} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"><Icon className="w-3.5 h-3.5" /> {children}</Link>
}
