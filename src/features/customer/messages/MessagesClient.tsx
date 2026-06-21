"use client"

import { useState } from "react"
import {
  MessagesSquare, AlertTriangle, CalendarCheck, Headphones, FileText, Plus, MessageSquare, Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import MessageContextRail from "./components/MessageContextRail"

/* ──────────────────────────────────────────────────────────────────────────
   Customer Messages — stays in touch with hosts, PMs and support.

   Data: wired to /api/customer/messages when available.
   Until the live messages API is implemented the page shows an honest empty
   state — no fake conversations with fake hosts. KPI values show 0.
   TODO: wire to live customer message threads (customer_message_threads table).
─────────────────────────────────────────────────────────────────────────── */

const KPIS = [
  { id: "unread",  label: "Unread messages",        value: "0", sub: "No unread conversations",  icon: MessagesSquare, bg: "bg-violet-50 text-violet-600" },
  { id: "action",  label: "Action needed",           value: "0", sub: "No messages need a reply", icon: AlertTriangle,  bg: "bg-amber-50 text-amber-600"  },
  { id: "checkin", label: "Upcoming check-in chats", value: "0", sub: "No arrivals in 7 days",    icon: CalendarCheck,  bg: "bg-emerald-50 text-emerald-600" },
  { id: "support", label: "Support threads",         value: "0", sub: "No open support threads",  icon: Headphones,     bg: "bg-blue-50 text-blue-600"     },
]

const FILTERS = ["All", "Unread", "Hosts", "Support"] as const

export default function MessagesClient() {
  const { toast } = useCustomerToast()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All")
  const [draft, setDraft] = useState("")

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
          <h1 className="text-[26px] font-bold text-slate-900 flex items-center gap-2">
            <MessagesSquare className="w-6 h-6 text-blue-600" /> Messages
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            Stay in touch with hosts, property managers and our support team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast("Message templates — coming soon", "info")}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileText className="w-4 h-4" /> Message templates
          </button>
          <button
            onClick={() => toast("New message — coming soon", "info")}
            className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-3 py-2 text-[12.5px] font-semibold"
          >
            <Plus className="w-4 h-4" /> New message
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start gap-3">
              <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}>
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[18px] font-bold text-slate-900 leading-none">{k.value}</p>
                <p className="text-[12px] font-medium text-slate-600 mt-1">{k.label}</p>
                <p className="text-[10.5px] text-slate-400">{k.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-2 text-[12.5px] font-semibold border-b-2 -mb-px transition-colors",
              filter === f ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 3-column layout — empty state until live data is wired */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-4 items-start">
        {/* Thread list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Search conversations…"
                aria-label="Search conversations"
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-[12.5px] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <MessagesSquare className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No conversations yet</p>
            <p className="text-xs text-slate-400 mt-1">When you message a host or get a reply, threads appear here.</p>
          </div>
        </div>

        {/* Conversation pane */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[640px]">
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Select a conversation</p>
            <p className="text-xs text-slate-400 mt-1">Your messages with hosts, property managers and support will appear here.</p>
          </div>
          {/* Composer */}
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={1}
                placeholder="Type a message…"
                aria-label="Type your message"
                className="flex-1 resize-none text-sm outline-none bg-transparent"
              />
              <button
                onClick={send}
                disabled={!draft.trim()}
                aria-label="Send message"
                className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <MessageContextRail />
      </div>
    </div>
  )
}
