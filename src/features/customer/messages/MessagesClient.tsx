"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MessagesSquare, AlertTriangle, CalendarCheck, Headphones, Search, SlidersHorizontal,
  FileText, Plus, MoreHorizontal, ExternalLink, Calendar, Paperclip, Smile, Send,
  Bold, Italic, Underline, List, Link2, ChevronDown, CheckCheck, Star, CheckCircle2,
  Shield, MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { StatusPill } from "../components/StatusPill"
import { propertyImages as IMG } from "../data/mock"

type Role = "Host" | "Property Manager" | "Support" | "Long-let Manager"
interface Convo {
  id: string; name: string; role: Role; subject: string; preview: string; time: string; unread: number
}

const ROLE_TONE: Record<Role, "violet" | "blue" | "amber" | "emerald"> = {
  Host: "violet", "Property Manager": "blue", Support: "amber", "Long-let Manager": "emerald",
}

const CONVOS: Convo[] = [
  { id: "james", name: "James Parker", role: "Host", subject: "Riverside Cottage – Check-in details", preview: "Hi Sarah, thanks for your message. Early check-in is…", time: "10:24", unread: 1 },
  { id: "lakeview", name: "Lakeview Stays", role: "Property Manager", subject: "Lakeview Penthouse – Parking", preview: "No problem at all. We have a secure parking space…", time: "Yesterday", unread: 2 },
  { id: "emma", name: "Emma Lewis", role: "Host", subject: "Seaside Cottage – Wifi information", preview: "The WiFi details are in the welcome guide…", time: "Yesterday", unread: 0 },
  { id: "support", name: "Propvora Support", role: "Support", subject: "Payment issue · Booking #BK-48391", preview: "We're looking into this for you and will update…", time: "Yesterday", unread: 1 },
  { id: "urban", name: "Urban Retreats", role: "Property Manager", subject: "City Loft Apartment – House rules", preview: "Thanks for your question about the house rules…", time: "2d ago", unread: 0 },
  { id: "daniel", name: "Daniel Hayes", role: "Host", subject: "Meadow View Cottage – Local tips", preview: "Here are some of our favourite spots nearby…", time: "3d ago", unread: 0 },
  { id: "longlet", name: "LongLet Living", role: "Long-let Manager", subject: "Monthly let – Maintenance update", preview: "The scheduled maintenance for next week…", time: "5d ago", unread: 0 },
]

const KPIS = [
  { id: "unread", label: "Unread messages", value: "3", sub: "Across all conversations", icon: MessagesSquare, bg: "bg-violet-50 text-violet-600" },
  { id: "action", label: "Action needed", value: "2", sub: "Messages require a reply", icon: AlertTriangle, bg: "bg-amber-50 text-amber-600" },
  { id: "checkin", label: "Upcoming check-in chats", value: "2", sub: "Arriving in next 7 days", icon: CalendarCheck, bg: "bg-emerald-50 text-emerald-600" },
  { id: "support", label: "Support threads", value: "1", sub: "Open with Support", icon: Headphones, bg: "bg-blue-50 text-blue-600" },
]

const FILTERS = ["All", "Unread", "Hosts", "Support"] as const

export default function MessagesClient() {
  const { toast } = useCustomerToast()
  const [selectedId, setSelectedId] = useState("james")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All")
  const [draft, setDraft] = useState("")
  const selected = CONVOS.find((c) => c.id === selectedId) ?? CONVOS[0]

  const filtered = CONVOS.filter((c) => {
    if (filter === "Unread") return c.unread > 0
    if (filter === "Hosts") return c.role === "Host"
    if (filter === "Support") return c.role === "Support"
    return true
  })

  function send() {
    if (!draft.trim()) return
    toast("Message sent", "success")
    setDraft("")
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 flex items-center gap-2"><MessagesSquare className="w-6 h-6 text-blue-600" /> Messages</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Stay in touch with hosts, property managers and our support team.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast("Message templates — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><FileText className="w-4 h-4" /> Message templates</button>
          <button onClick={() => toast("New message — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-3 py-2 text-[12.5px] font-semibold"><Plus className="w-4 h-4" /> New message</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start gap-3">
            <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}><Icon className="w-5 h-5" /></span>
            <div><p className="text-[18px] font-bold text-slate-900 leading-none">{k.value}</p><p className="text-[12px] font-medium text-slate-600 mt-1">{k.label}</p><p className="text-[10.5px] text-slate-400">{k.sub}</p></div>
          </div>
        )})}
      </div>

      {/* 3-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-4 items-start">
        {/* Conversation list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input placeholder="Search messages" className="w-full bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12.5px] outline-none" /></div>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400"><SlidersHorizontal className="w-4 h-4" /></button>
              <button className="inline-flex items-center gap-1 text-[12px] text-slate-500">All <ChevronDown className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-semibold inline-flex items-center gap-1", filter === f ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100")}>
                  {f}{f === "All" && <span className="opacity-70">12</span>}{f === "Unread" && <span className="opacity-70">3</span>}{f === "Hosts" && <span className="opacity-70">6</span>}{f === "Support" && <span className="opacity-70">2</span>}
                </button>
              ))}
            </div>
          </div>
          <ul className="max-h-[640px] overflow-y-auto divide-y divide-slate-50">
            {filtered.map((c) => {
              const active = c.id === selectedId
              return (
                <li key={c.id}>
                  <button onClick={() => setSelectedId(c.id)} className={cn("w-full text-left flex gap-2.5 p-3 transition-colors", active ? "bg-blue-50/50" : "hover:bg-slate-50")}>
                    <span className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><p className="text-[12.5px] font-semibold text-slate-800 truncate">{c.name}</p><StatusPill tone={ROLE_TONE[c.role]}>{c.role}</StatusPill></div>
                      <p className="text-[11.5px] font-medium text-slate-600 truncate">{c.subject}</p>
                      <p className="text-[11px] text-slate-400 truncate">{c.preview}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0"><span className="text-[10.5px] text-slate-400">{c.time}</span>{c.unread > 0 && <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{c.unread}</span>}</div>
                  </button>
                </li>
              )
            })}
          </ul>
          <button className="w-full py-3 text-[12px] font-semibold text-blue-600 border-t border-slate-100">View archived conversations</button>
        </div>

        {/* Active thread */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[640px]">
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5"><span className="w-10 h-10 rounded-full bg-slate-200" /><div><p className="text-[13.5px] font-semibold text-slate-800 flex items-center gap-1.5">{selected.name} <StatusPill tone={ROLE_TONE[selected.role]}>{selected.role}</StatusPill></p><p className="text-[11.5px] text-slate-400">Riverside Cottage · Booking #BK-48391</p></div></div>
            <div className="flex items-center gap-1.5"><button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><MoreHorizontal className="w-4 h-4" /></button><button className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5">Details</button></div>
          </div>
          <div className="px-4 py-2 bg-slate-50 flex items-center justify-between text-[11.5px]"><span className="text-slate-500 inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Check-in: 6 Jun 2025 &nbsp; Check-out: 9 Jun 2025</span><Link href="/customer/bookings/PV-98230" className="font-semibold text-blue-600 inline-flex items-center gap-1">View booking <ExternalLink className="w-3.5 h-3.5" /></Link></div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <Bubble side="in" text="Hi Sarah, thanks for your message. Early check-in is usually possible if the property is ready. I'll confirm by tomorrow morning and let you know." time="10:18" />
            <Bubble side="out" text="That would be amazing, thank you! We're arriving early and would love to drop off our bags if possible." time="10:20" />
            <Bubble side="in" text="You're very welcome. If early check-in isn't available, we can also store your luggage securely." time="10:21" />
            <Bubble side="in" file="Welcome Guide – Riverside Cottage.pdf" time="10:22" />
            <Bubble side="out" text="Perfect, thanks! Looking forward to our stay." time="10:24" />
          </div>

          <div className="px-4 pt-2 flex items-center gap-2">
            {["Thanks!", "Sounds good", "Can't wait", "See you soon"].map((q) => (
              <button key={q} onClick={() => setDraft(q)} className="rounded-full border border-slate-200 px-3 py-1 text-[12px] text-slate-600 hover:bg-slate-50">{q}</button>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-1 mb-2 text-slate-400">
              {[Bold, Italic, Underline, List, Link2, Smile, Paperclip].map((I, i) => <button key={i} className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center"><I className="w-3.5 h-3.5" /></button>)}
            </div>
            <div className="flex items-end gap-2">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your message…" rows={2} className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none resize-none" />
              <button onClick={send} className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-4 py-2.5 text-[13px] font-semibold"><Send className="w-4 h-4" /> Send</button>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2">Linked booking</p>
            <div className="flex gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMG.riverside} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" />
              <div className="min-w-0"><p className="text-[12.5px] font-semibold text-slate-800 truncate">Riverside Cottage</p><p className="text-[11px] text-slate-400">Bakewell, Derbyshire</p><p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.8 (96) <StatusPill tone="amber">Price drop</StatusPill></p></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100"><div><p className="text-[10px] text-slate-400">Check-in</p><p className="text-[12px] font-semibold text-slate-800">6 Jun 2025</p></div><div><p className="text-[10px] text-slate-400">Check-out</p><p className="text-[12px] font-semibold text-slate-800">9 Jun 2025</p></div></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2">Guest details</p>
            <p className="text-[12.5px] font-semibold text-slate-800 flex items-center gap-1.5">Sarah Johnson <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></p>
            <p className="text-[11.5px] text-slate-400">sarah.johnson@email.com</p>
            <p className="text-[11.5px] text-slate-400">+44 7700 900123</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2">Payment &amp; alerts</p>
            <div className="space-y-2">
              <div className="bg-amber-50 rounded-lg p-2.5 flex items-center justify-between"><div><p className="text-[11.5px] font-semibold text-amber-700">Balance due: £120.00</p><p className="text-[10.5px] text-amber-600">Due by 30 May 2025</p></div><button onClick={() => toast("Opening payment…", "info")} className="text-[11px] font-semibold bg-white border border-amber-200 rounded-lg px-2 py-1 text-amber-700">Pay now</button></div>
              <div className="bg-emerald-50 rounded-lg p-2.5"><p className="text-[11.5px] font-semibold text-emerald-700">Payment verified</p><p className="text-[10.5px] text-emerald-600">£310.00 paid on 12 May 2025</p></div>
              <div className="bg-blue-50 rounded-lg p-2.5 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-500" /><div><p className="text-[11.5px] font-semibold text-blue-700">Free cancellation</p><p className="text-[10.5px] text-blue-600">Until 2 Jun 2025</p></div></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2">Quick actions</p>
            <ul className="space-y-1">
              {[["View booking details", Calendar], ["Share check-in guide", FileText], ["Request early check-in", CalendarCheck], ["Contact support", Headphones]].map(([label, Icon]) => {
                const I = Icon as typeof Calendar
                return <li key={label as string}><button onClick={() => toast(`${label} — coming soon`, "info")} className="w-full flex items-center gap-2.5 py-1.5 text-[12px] text-slate-600 hover:text-slate-900"><I className="w-4 h-4 text-slate-400" /> {label as string}</button></li>
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Bubble({ side, text, file, time }: { side: "in" | "out"; text?: string; file?: string; time: string }) {
  const out = side === "out"
  return (
    <div className={cn("flex gap-2", out ? "flex-row-reverse" : "")}>
      <span className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
      <div className={cn("max-w-[78%]")}>
        <div className={cn("rounded-2xl px-3 py-2 text-[12.5px]", out ? "bg-blue-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm")}>
          {file ? (
            <span className="flex items-center gap-2"><span className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-[9px] font-bold">PDF</span><span><span className="block font-semibold">{file}</span><span className="block text-[10px] opacity-80">2.4 MB · PDF</span></span></span>
          ) : text}
        </div>
        <p className={cn("text-[10px] text-slate-400 mt-0.5 flex items-center gap-1", out ? "justify-end" : "")}>{time}{out && <CheckCheck className="w-3 h-3 text-blue-400" />}</p>
      </div>
    </div>
  )
}
