"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  MessagesSquare, AlertTriangle, CalendarCheck, Headphones, Search,
  Plus, MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MessageContextRail from "./components/MessageContextRail"
import type { CustomerThread } from "@/lib/customer/types"

/* ──────────────────────────────────────────────────────────────────────────
   Customer Messages — stays in touch with hosts, PMs and support.

   Data: real customer_message_threads loaded server-side and passed as
   `threads`. KPI values and the thread list are derived from live rows — no
   fabricated names or conversations. Opening a thread navigates to the
   /user/messages/[id] detail route (which loads the real messages + composer).

   New conversations are started in-context from a booking (a guest messages
   the host of a specific trip), so "New message" routes to the bookings list
   rather than opening an orphan compose form with no host to address. This
   keeps every CTA wired to a real destination (no toast/dead-button stubs).
─────────────────────────────────────────────────────────────────────────── */

const FILTERS = ["All", "Unread"] as const

function relTime(iso: string | null): string {
  if (!iso) return ""
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ""
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export default function MessagesClient({ threads = [] }: { threads?: CustomerThread[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All")
  const [query, setQuery] = useState("")

  const unreadTotal = useMemo(
    () => threads.reduce((n, t) => n + (t.unread ?? 0), 0),
    [threads]
  )
  const actionNeeded = useMemo(
    () => threads.filter((t) => (t.unread ?? 0) > 0).length,
    [threads]
  )
  const supportThreads = useMemo(
    () => threads.filter((t) => (t.title ?? "").toLowerCase().includes("support")).length,
    [threads]
  )

  const KPIS = [
    { id: "unread", label: "Unread messages", value: String(unreadTotal), sub: unreadTotal ? "Across your conversations" : "No unread conversations", icon: MessagesSquare, bg: "bg-violet-50 text-violet-600" },
    { id: "action", label: "Action needed", value: String(actionNeeded), sub: actionNeeded ? "Conversations need a reply" : "No messages need a reply", icon: AlertTriangle, bg: "bg-amber-50 text-amber-600" },
    { id: "threads", label: "Active conversations", value: String(threads.length), sub: threads.length ? "Open threads" : "No open threads", icon: CalendarCheck, bg: "bg-emerald-50 text-emerald-600" },
    { id: "support", label: "Support threads", value: String(supportThreads), sub: supportThreads ? "Open with Support" : "No open support threads", icon: Headphones, bg: "bg-[var(--brand-soft)] text-[var(--brand)]" },
  ]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return threads.filter((t) => {
      if (filter === "Unread" && (t.unread ?? 0) === 0) return false
      if (q && ![t.title, t.last_message, t.last_sender].some((v) => (v ?? "").toLowerCase().includes(q))) return false
      return true
    })
  }, [threads, filter, query])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 flex items-center gap-2">
            <MessagesSquare className="w-6 h-6 text-[var(--brand)]" /> Messages
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            Stay in touch with hosts, property managers and our support team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/user/bookings"
            title="Open a trip to message its host"
            className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-3 py-2 text-[12.5px] font-semibold hover:bg-[#0D1B2A]/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          >
            <Plus className="w-4 h-4" /> New message
          </Link>
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
              filter === f ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {f}
            {f === "Unread" && unreadTotal > 0 && <span className="ml-1 opacity-70">{unreadTotal}</span>}
          </button>
        ))}
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-4 items-start">
        {/* Thread list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations…"
                aria-label="Search conversations"
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-[12.5px] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <MessagesSquare className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                {threads.length === 0 ? "No conversations yet" : "No matching conversations"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {threads.length === 0
                  ? "When you message a host or get a reply, threads appear here."
                  : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <ul className="max-h-[640px] overflow-y-auto divide-y divide-slate-50">
              {filtered.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/user/messages/${t.id}`}
                    className="w-full text-left flex gap-2.5 p-3 transition-colors hover:bg-slate-50"
                  >
                    <span className="w-9 h-9 rounded-full bg-slate-200 shrink-0" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-slate-800 truncate">
                        {t.title || "Conversation"}
                      </p>
                      {t.last_sender && (
                        <p className="text-[11.5px] font-medium text-slate-600 truncate">{t.last_sender}</p>
                      )}
                      <p className="text-[11px] text-slate-400 truncate">{t.last_message || "No messages yet"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10.5px] text-slate-400">{relTime(t.last_at ?? t.updated_at)}</span>
                      {(t.unread ?? 0) > 0 && (
                        <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold flex items-center justify-center">
                          {t.unread}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Conversation pane — open a thread to read + reply on its detail route */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[640px]">
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Select a conversation</p>
            <p className="text-xs text-slate-400 mt-1">
              {threads.length === 0
                ? "Your messages with hosts, property managers and support will appear here."
                : "Choose a conversation on the left to read it and reply."}
            </p>
          </div>
        </div>

        <MessageContextRail />
      </div>
    </div>
  )
}
