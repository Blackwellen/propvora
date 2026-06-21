"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Phone, Search, MessagesSquare, Flag, CheckCircle2, BookOpen, Calendar, CreditCard, Home,
  Eye, FileText, Building2, Scale, Shield, User, Plus, Clock, Mail,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { StatusPill, type PillTone } from "../components/StatusPill"

const KPIS = [
  { id: "open", label: "Open tickets", value: "0", sub: "No open tickets", icon: MessagesSquare, bg: "bg-violet-50 text-violet-600", subTone: "slate" },
  { id: "priority", label: "Priority issues", value: "0", sub: "No priority issues", icon: Flag, bg: "bg-amber-50 text-amber-600", subTone: "slate" },
  { id: "resolved", label: "Recent resolutions", value: "0", sub: "In the last 30 days", icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600", subTone: "slate" },
  { id: "safety", label: "Safety contacts", value: "—", sub: "See contact details below", icon: Phone, bg: "bg-blue-50 text-blue-600", subTone: "slate" },
  { id: "guides", label: "Quick guides", value: "—", sub: "Browse categories below", icon: BookOpen, bg: "bg-violet-50 text-violet-600", subTone: "slate" },
]
const CATEGORIES = [
  { label: "Bookings", icon: Calendar }, { label: "Payments", icon: CreditCard }, { label: "Lets", icon: Home },
  { label: "Viewings", icon: Eye }, { label: "Applications", icon: FileText }, { label: "Tenancy", icon: Building2 },
  { label: "Disputes", icon: Scale }, { label: "Safety", icon: Shield }, { label: "Account", icon: User },
]
const TICKETS: { id: string; topic: string; linked: string; linkedSub: string; status: string; tone: PillTone; update: string }[] = []
const TICKET_TABS = ["All tickets", "Awaiting your reply", "In progress", "Resolved"]

export default function HelpClient() {
  const { toast } = useCustomerToast()
  const [ticketTab, setTicketTab] = useState("All tickets")

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900">Help centre</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Find answers, get support and manage your cases — we're here to help.</p>
        </div>
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0"><Phone className="w-4 h-4" /></span>
          <div><p className="text-[12.5px] font-semibold text-rose-600">Emergency assistance</p><p className="text-[11px] text-slate-500">For urgent issues that need immediate help.</p><p className="text-[12px] text-slate-700 mt-0.5"><Clock className="w-3 h-3 inline" /> Call emergency line <span className="font-bold text-rose-600">support@propvora.com</span> <span className="text-[10px] bg-rose-50 text-rose-500 rounded px-1">24/7</span></p></div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input placeholder="Search help topics, articles or ask a question…" className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-100" /></div>
        <button onClick={() => toast("Searching help…", "info")} className="bg-[#2563EB] text-white rounded-xl px-5 py-2.5 text-[13px] font-semibold">Search</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
            <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
            <p className="text-[12px] font-medium text-slate-500 mt-1">{k.label}</p>
            <p className={cn("text-[11px] mt-0.5 font-semibold", k.subTone === "blue" ? "text-blue-600" : k.subTone === "amber" ? "text-amber-600" : k.subTone === "emerald" ? "text-emerald-600" : "text-slate-400")}>{k.sub}</p>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-5">
          {/* Categories */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-[15px] font-bold text-slate-900">Browse help by category</h3><Link href="#" className="text-[12px] font-semibold text-blue-600">See all categories →</Link></div>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {CATEGORIES.map((c) => { const Icon = c.icon; return (
                <button key={c.label} onClick={() => toast(`${c.label} help — coming soon`, "info")} className="flex flex-col items-center gap-2 group">
                  <span className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"><Icon className="w-5 h-5" /></span>
                  <span className="text-[11px] font-medium text-slate-600">{c.label}</span>
                </button>
              )})}
            </div>
          </div>

          {/* Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-slate-900">Your support tickets</h3>
              <div className="flex items-center gap-2"><button onClick={() => toast("New ticket — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white rounded-xl px-3 py-1.5 text-[12px] font-semibold"><Plus className="w-3.5 h-3.5" /> Open ticket</button><Link href="#" className="text-[12px] font-semibold text-blue-600">View all tickets →</Link></div>
            </div>
            {/* Mobile dropdown — shown only below md breakpoint */}
            <div className="md:hidden mb-2 border-b border-slate-100 pb-2">
              <select
                value={ticketTab}
                onChange={(e) => setTicketTab(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Filter tickets"
              >
                {TICKET_TABS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {/* Desktop tab strip — hidden below md */}
            <div className="hidden md:flex items-center gap-1 mb-2 border-b border-slate-100">
              {TICKET_TABS.map((t) => <button key={t} onClick={() => setTicketTab(t)} className={cn("px-3 py-2 text-[12.5px] font-semibold border-b-2 -mb-px", t === ticketTab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>{t}</button>)}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 pr-2 font-semibold">Ticket #</th><th className="py-2 px-2 font-semibold">Topic</th><th className="py-2 px-2 font-semibold">Linked to</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 font-semibold">Last update</th><th className="py-2 px-2 font-semibold w-16">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {TICKETS.map((t) => (
                    <tr key={t.id} className="text-[12.5px]">
                      <td className="py-3 pr-2 font-semibold text-slate-700">#{t.id}</td>
                      <td className="py-3 px-2 text-slate-700">{t.topic}</td>
                      <td className="py-3 px-2"><p className="text-blue-600 font-medium">{t.linked}</p>{t.linkedSub && <p className="text-[10.5px] text-slate-400">{t.linkedSub}</p>}</td>
                      <td className="py-3 px-2"><StatusPill tone={t.tone}>{t.status}</StatusPill></td>
                      <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{t.update}</td>
                      <td className="py-3 px-2"><button onClick={() => toast(`Opening ${t.id}…`, "info")} className="text-[11.5px] font-semibold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {TICKETS.length === 0 && <p className="text-[12.5px] text-slate-400 py-4 text-center">No support tickets yet. Open a ticket above if you need help.</p>}
          <div className="flex items-center justify-between mt-3 text-[12px] text-slate-500"><span>Showing {TICKETS.length} of {TICKETS.length} tickets</span></div>
          </div>

          {/* bottom info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2"><p className="text-[13px] font-bold text-slate-900">Top help articles</p><Link href="#" className="text-[11px] font-semibold text-blue-600">View all articles →</Link></div>
              {[["How payments and refunds work", "12 May 2025 · 5 min read"], ["How to manage your bookings", "8 May 2025 · 4 min read"], ["Security deposit: what you need to know", "3 May 2025 · 6 min read"], ["Check-in and check-out guide", "1 May 2025 · 3 min read"]].map(([t, s]) => <Link key={t} href="#" className="flex gap-2 py-1.5 group"><FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><div><p className="text-[12px] font-medium text-slate-700 group-hover:text-blue-600">{t}</p><p className="text-[10.5px] text-slate-400">{s}</p></div></Link>)}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <Scale className="w-5 h-5 text-violet-500" /><p className="text-[13px] font-bold text-slate-900 mt-1.5">Dispute resolution</p><p className="text-[11px] text-slate-500">We're here to help resolve issues fairly.</p>
              {[["Report a dispute", "Start a new dispute case"], ["Track existing dispute", "Check status and updates"], ["Resolution process", "How our dispute process works"]].map(([t, s]) => <div key={t} className="flex gap-2 py-1.5"><Flag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /><div><p className="text-[12px] font-medium text-slate-700">{t}</p><p className="text-[10.5px] text-slate-400">{s}</p></div></div>)}
              <button onClick={() => toast("Learn about disputes", "info")} className="w-full mt-1 border border-slate-200 rounded-xl py-1.5 text-[12px] font-semibold text-slate-700">Learn about disputes →</button>
            </div>
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4">
              <Shield className="w-5 h-5 text-rose-500" /><p className="text-[13px] font-bold text-slate-900 mt-1.5">Emergency &amp; safety</p><p className="text-[11px] text-slate-500">For urgent matters and safety concerns.</p>
              {[["Emergency contacts", "Local and 24/7 numbers"], ["Report safety issue", "Let us know about safety concerns"], ["Trust & Safety centre", "How we keep you safe"]].map(([t, s]) => <div key={t} className="flex gap-2 py-1.5"><AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" /><div><p className="text-[12px] font-medium text-slate-700">{t}</p><p className="text-[10.5px] text-slate-400">{s}</p></div></div>)}
              <button onClick={() => toast("Calling emergency line…", "warning")} className="w-full mt-1 border border-rose-200 text-rose-600 rounded-xl py-1.5 text-[12px] font-semibold inline-flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Call emergency line</button>
            </div>
          </div>

          {/* still need help */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div className="flex items-center gap-2"><span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><MessagesSquare className="w-4 h-4" /></span><div><p className="text-[12.5px] font-bold text-slate-800">Still need help?</p><p className="text-[10.5px] text-slate-400">Our team is ready to help</p><button onClick={() => toast("Starting live chat…", "info")} className="mt-1 bg-[#0D1B2A] text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold">Start live chat</button></div></div>
            <Contact icon={Phone} title="Call support" lines={["support@propvora.com", "Open 24/7"]} />
            <Contact icon={Mail} title="Email support" lines={["support@propvora.com", "Response within 24h"]} />
            <Contact icon={Flag} title="Report a problem" lines={["Something not working?", "Let us know"]} />
          </div>
        </div>

        {/* Right rail: selected case */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <h3 className="text-[14px] font-bold text-slate-900 mb-3">Selected case</h3>
          <div className="py-8 text-center">
            <MessagesSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-[12.5px] text-slate-400">Select a ticket to see case details.</p>
          </div>
          <div className="mt-3 space-y-2">
            <button onClick={() => toast("Open a ticket to get started", "info")} className="w-full bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold">Open a ticket</button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PageBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return <button className={cn("min-w-[28px] h-[28px] rounded-lg text-[12px] font-semibold inline-flex items-center justify-center", active ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50")}>{children}</button>
}
function Contact({ icon: Icon, title, lines }: { icon: typeof Phone; title: string; lines: string[] }) {
  return <div className="flex items-start gap-2"><span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span><div><p className="text-[12px] font-semibold text-slate-800">{title}</p>{lines.map((l) => <p key={l} className="text-[10.5px] text-slate-400">{l}</p>)}</div></div>
}
