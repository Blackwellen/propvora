"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
  Search, X, Clock, AlertTriangle, CheckCircle2, FileText, Calendar, StickyNote,
  MessageSquare, ChevronDown,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { MobileTopBar, MobilePageHeader, MobileSheet, useIsMobile } from "@/components/mobile"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/hooks/useWorkspace"

// ─── Avatar helpers ─────────────────────────────────────────────────────────
const AVATAR_BG = [
  "bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500",
  "bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500",
]
function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

// ─── Types ──────────────────────────────────────────────────────────────────
type EventType = "message" | "payment" | "document" | "task" | "system" | "alert"

interface TimelineEvent {
  id: string
  date: string
  time: string
  contactId: string
  contactName: string
  contactType: string
  eventType: EventType
  title: string
  description: string
  chipLabel: string
  amount?: number | null
}

interface ContactSummary {
  id: string
  name: string
  count: number
}

// ─── Map audit_log action → EventType ────────────────────────────────────────
function actionToEventType(action: string): EventType {
  const a = action.toLowerCase()
  if (a.includes("message") || a.includes("sms") || a.includes("email")) return "message"
  if (a.includes("payment") || a.includes("invoice") || a.includes("rent")) return "payment"
  if (a.includes("document") || a.includes("upload") || a.includes("file")) return "document"
  if (a.includes("task") || a.includes("job") || a.includes("work")) return "task"
  if (a.includes("alert") || a.includes("arrears") || a.includes("overdue")) return "alert"
  return "system"
}

// ─── Event type config ────────────────────────────────────────────────────────
interface EventConfig {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  chipCls: string
}

const EVENT_CONFIG: Record<EventType, EventConfig> = {
  message:  { icon: MessageSquare, iconBg: "bg-blue-100",    iconColor: "text-blue-600",    chipCls: "bg-blue-100 text-blue-700" },
  payment:  { icon: CheckCircle2,  iconBg: "bg-emerald-100", iconColor: "text-emerald-600", chipCls: "bg-emerald-100 text-emerald-700" },
  document: { icon: FileText,      iconBg: "bg-purple-100",  iconColor: "text-purple-600",  chipCls: "bg-purple-100 text-purple-700" },
  task:     { icon: Clock,         iconBg: "bg-amber-100",   iconColor: "text-amber-600",   chipCls: "bg-amber-100 text-amber-700" },
  alert:    { icon: AlertTriangle, iconBg: "bg-red-100",     iconColor: "text-red-600",     chipCls: "bg-red-100 text-red-700" },
  system:   { icon: StickyNote,    iconBg: "bg-slate-100",   iconColor: "text-slate-500",   chipCls: "bg-slate-100 text-slate-600" },
}

type FilterKey = "all" | EventType

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "message",  label: "Messages" },
  { key: "payment",  label: "Payments" },
  { key: "document", label: "Documents" },
  { key: "task",     label: "Tasks" },
  { key: "system",   label: "System" },
  { key: "alert",    label: "Alerts" },
]

// ─── Group by date ────────────────────────────────────────────────────────────
interface DateGroup {
  dateKey: string
  label: string
  events: TimelineEvent[]
}

function groupByDate(events: TimelineEvent[]): DateGroup[] {
  const map = new Map<string, TimelineEvent[]>()
  for (const ev of events) {
    map.set(ev.date, [...(map.get(ev.date) ?? []), ev])
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([dateKey, evs]) => ({
      dateKey,
      label: formatDateLabel(dateKey),
      events: evs,
    }))
}

function formatDateLabel(d: string): string {
  const today = new Date().toISOString().split("T")[0]
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const yesterday = yesterdayDate.toISOString().split("T")[0]
  if (d === today) return `Today — ${fmtDate(d)}`
  if (d === yesterday) return `Yesterday — ${fmtDate(d)}`
  return fmtDate(d)
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

// ALL_CONTACTS is derived from live events in the component below

// ─── Timeline event row ───────────────────────────────────────────────────────
function EventRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const cfg = EVENT_CONFIG[event.eventType]
  const Icon = cfg.icon

  return (
    <div className="relative flex gap-4">
      {/* Left: time */}
      <div className="w-16 shrink-0 text-right">
        <span className="text-[10px] text-slate-400 leading-none">{event.time}</span>
      </div>

      {/* Connector */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", cfg.iconBg)}>
          <Icon className={cn("w-4 h-4", cfg.iconColor)} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-2 min-h-[24px]" />}
      </div>

      {/* Content */}
      <div className={cn("pb-5 flex-1 min-w-0", !isLast && "")}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Contact + title */}
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0", avatarBg(event.contactName))}>
                {initials(event.contactName)}
              </div>
              <Link
                href={`/property-manager/contacts/${event.contactId}`}
                className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                {event.contactName}
              </Link>
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-xs font-medium text-slate-700">{event.title}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{event.description}</p>
          </div>

          {/* Right: chip + amount */}
          <div className="flex items-center gap-2 shrink-0">
            {event.amount != null && (
              <span className="text-sm font-bold text-emerald-600">
                £{event.amount.toLocaleString("en-GB")}
              </span>
            )}
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.chipCls)}>
              {event.chipLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Donut chart (CSS conic-gradient) ─────────────────────────────────────────
function DonutChart({ events }: { events: TimelineEvent[] }) {
  const total = events.length || 1
  const counts: Record<EventType, number> = { payment: 0, message: 0, document: 0, task: 0, alert: 0, system: 0 }
  for (const ev of events) counts[ev.eventType] = (counts[ev.eventType] ?? 0) + 1

  const segments = [
    { label: "Payments",  pct: Math.round((counts.payment  / total) * 100), color: "#10b981" },
    { label: "Messages",  pct: Math.round((counts.message  / total) * 100), color: "#3b82f6" },
    { label: "Documents", pct: Math.round((counts.document / total) * 100), color: "#8b5cf6" },
    { label: "Tasks",     pct: Math.round((counts.task     / total) * 100), color: "#f59e0b" },
    { label: "Alerts",    pct: Math.round((counts.alert    / total) * 100), color: "#ef4444" },
    { label: "System",    pct: Math.round((counts.system   / total) * 100), color: "#94a3b8" },
  ]

  let cumulativePct = 0
  const gradientParts = segments.map((s) => {
    const start = cumulativePct
    cumulativePct += s.pct
    return `${s.color} ${start * 3.6}deg ${cumulativePct * 3.6}deg`
  })
  const gradient = `conic-gradient(${gradientParts.join(", ")})`

  return (
    <div>
      <div className="flex justify-center mb-3">
        <div
          role="img"
          aria-label={`Event type distribution: ${segments.filter(s => s.pct > 0).map(s => `${s.label} ${s.pct}%`).join(", ")}`}
          className="w-24 h-24 rounded-full"
          style={{ background: gradient }}
        >
          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle at center, white 55%, transparent 55%)" }}>
            <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight">Event<br/>Types</span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-slate-600">{s.label}</span>
            </div>
            <span className="font-semibold text-slate-700 tabular-nums">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CSS bar chart — derived from live events (last 7 weeks) ─────────────────────
function BarChart({ events }: { events: TimelineEvent[] }) {
  const bars = useMemo(() => {
    const now = new Date()
    const weeks: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * 86400000)
      const start = new Date(end.getTime() - 7 * 86400000)
      const startKey = start.toISOString().split("T")[0]
      const endKey = end.toISOString().split("T")[0]
      const value = events.filter((e) => e.date > startKey && e.date <= endKey).length
      weeks.push({ label: `W${7 - i}`, value })
    }
    return weeks
  }, [events])
  const max = Math.max(1, ...bars.map((b) => b.value))

  return (
    <div className="flex items-end gap-1.5 h-16" role="img" aria-label={`Activity over time: ${bars.map((b) => `${b.label} ${b.value} events`).join(", ")}`}>
      {bars.map((bar) => (
        <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-blue-500 rounded-t-sm"
            style={{ height: `${(bar.value / max) * 100}%` }}
          />
          <span className="text-[9px] text-slate-400">{bar.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Right rail ───────────────────────────────────────────────────────────────
function RightRail({ events }: { events: TimelineEvent[] }) {
  const today = new Date().toISOString().split("T")[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const ninetyAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const todayCount = events.filter((e) => e.date === today).length
  const weekCount = events.filter((e) => e.date >= weekAgo && e.date <= today).length
  const monthCount = events.filter((e) => e.date >= monthAgo).length
  const ninetyCount = events.filter((e) => e.date >= ninetyAgo).length

  // Derive top contacts from live event data
  const contactCountMap = new Map<string, { name: string; count: number }>()
  for (const ev of events) {
    const existing = contactCountMap.get(ev.contactId)
    if (existing) {
      existing.count += 1
    } else {
      contactCountMap.set(ev.contactId, { name: ev.contactName, count: 1 })
    }
  }
  const topContacts: ContactSummary[] = Array.from(contactCountMap.entries())
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <aside className="w-72 shrink-0 sticky top-6 space-y-4">
      {/* Activity Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Activity Summary</h3>
        <div className="space-y-2.5">
          {[
            { label: "Today",        value: todayCount,  sub: "events" },
            { label: "This week",    value: weekCount,   sub: "events" },
            { label: "This month",   value: monthCount,  sub: "events" },
            { label: "Last 90 days", value: ninetyCount, sub: "events" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{row.label}</span>
              <span className="font-bold text-slate-900 tabular-nums">{row.value} {row.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contacts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Top Contacts</h3>
        <div className="space-y-2.5">
          {topContacts.map((c) => (
            <Link key={c.id} href={`/property-manager/contacts/${c.id}`} className="flex items-center gap-2.5 group">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarBg(c.name))}>
                {initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{c.name}</p>
                <p className="text-[10px] text-slate-400">{c.count} events</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Event Types donut */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Event Types</h3>
        <DonutChart events={events} />
      </div>

      {/* Activity Over Time */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Activity Over Time</h3>
          <span className="text-[10px] text-blue-600 cursor-pointer hover:underline">View full report</span>
        </div>
        <BarChart events={events} />
      </div>
    </aside>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TimelinePage() {
  const { data: workspace } = useWorkspace()
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [search, setSearch] = useState("")
  const [eventFilter, setEventFilter] = useState<FilterKey>("all")
  const [contactFilter, setContactFilter] = useState("all")
  const [contactDropOpen, setContactDropOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!workspace?.id) return
    setLoadingEvents(true)
    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("audit_logs")
          .select("id, action, resource_type, resource_id, created_at, user_id")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false })
          .limit(200)

        if (error) {
          if ((error as { code?: string }).code === "42P01") {
            setAllEvents([])
          } else {
            console.error("audit_logs load error:", error)
          }
          return
        }

        const rows: TimelineEvent[] = (data ?? []).map((row) => {
          const createdAt = new Date(row.created_at)
          const date = createdAt.toISOString().split("T")[0]
          const time = createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
          const eventType = actionToEventType(row.action)
          const chipLabel = eventType.charAt(0).toUpperCase() + eventType.slice(1)
          const resourceId = row.resource_id ?? ""
          const contactId = row.resource_type === "contact" ? resourceId : ""
          return {
            id: row.id,
            date,
            time,
            contactId,
            contactName: row.user_id ? "User" : "System",
            contactType: row.resource_type ?? "system",
            eventType,
            title: row.action,
            description: `${row.resource_type ?? "Resource"}${resourceId ? ` — ${resourceId.slice(0, 8)}` : ""}`,
            chipLabel,
            amount: null,
          }
        })
        setAllEvents(rows)
      } catch (err) {
        console.error("timeline fetch error:", err)
      } finally {
        setLoadingEvents(false)
      }
    })()
  }, [workspace?.id])

  // Derive unique contacts from live event data for the dropdown
  const allContacts: ContactSummary[] = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>()
    for (const ev of allEvents) {
      if (!ev.contactId) continue
      const existing = map.get(ev.contactId)
      if (existing) existing.count += 1
      else map.set(ev.contactId, { name: ev.contactName, count: 1 })
    }
    return Array.from(map.entries()).map(([id, { name, count }]) => ({ id, name, count }))
  }, [allEvents])

  const filtered = useMemo(() => {
    let data = [...allEvents]
    if (eventFilter !== "all") data = data.filter((e) => e.eventType === eventFilter)
    if (contactFilter !== "all") data = data.filter((e) => e.contactId === contactFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(
        (e) =>
          e.contactName.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      )
    }
    return data
  }, [allEvents, search, eventFilter, contactFilter])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  const selectedContactName =
    contactFilter === "all"
      ? "All Contacts"
      : allContacts.find((c) => c.id === contactFilter)?.name ?? "All Contacts"

  return (
    <DashboardContainer>
      <MobileTopBar title="Contact Timeline" subtitle="Events & interactions" />
      <div className="md:hidden -mx-4">
        <ContactsTabNav />
      </div>
      <div className="md:hidden px-4 pt-4">
        <MobilePageHeader
          title="Contact Timeline"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search events…"
        />
      </div>

      <div className="hidden md:block">
        <ContactsTabNav />
      </div>

      {/* Header */}
      <div className="hidden md:flex items-start justify-between gap-4 px-6 pt-6 pb-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Contacts</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contact Timeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">All contact events, interactions and milestones in chronological order</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          1–4 June 2026
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-4 md:px-6 pb-5 flex-wrap">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            aria-label="Search events"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-52 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Event type filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setEventFilter(chip.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                eventFilter === chip.key ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Contact dropdown */}
        <div className="relative">
          <button
            onClick={() => setContactDropOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={contactDropOpen}
            aria-label="Filter by contact"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors min-w-[140px] justify-between shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            <span className="truncate">{selectedContactName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
          {/* Desktop popover (md+) — click-away backdrop + height cap */}
          {contactDropOpen && !isMobile && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setContactDropOpen(false)} aria-hidden="true" />
              <div
                role="menu"
                className="absolute right-0 top-9 z-30 w-52 rounded-xl border border-slate-200 bg-white shadow-lg py-1 max-h-64 overflow-y-auto overscroll-contain"
              >
                <button
                  role="menuitem"
                  onClick={() => { setContactFilter("all"); setContactDropOpen(false) }}
                  className={cn("w-full text-left px-3 py-2 text-xs transition-colors", contactFilter === "all" ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700 hover:bg-slate-50")}
                >
                  All Contacts
                </button>
                {allContacts.map((c) => (
                  <button
                    key={c.id}
                    role="menuitem"
                    onClick={() => { setContactFilter(c.id); setContactDropOpen(false) }}
                    className={cn("w-full text-left px-3 py-2 text-xs transition-colors", contactFilter === c.id ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700 hover:bg-slate-50")}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {/* Mobile — bottom sheet */}
          {isMobile && (
            <MobileSheet open={contactDropOpen} onClose={() => setContactDropOpen(false)} title="Filter by contact">
              <div className="py-1" role="menu" aria-label="Filter by contact">
                <button
                  role="menuitem"
                  onClick={() => { setContactFilter("all"); setContactDropOpen(false) }}
                  className={cn("flex items-center justify-between w-full text-left px-3 min-h-[48px] text-[15px] rounded-xl transition-colors", contactFilter === "all" ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700 hover:bg-slate-50")}
                >
                  All Contacts
                </button>
                {allContacts.map((c) => (
                  <button
                    key={c.id}
                    role="menuitem"
                    onClick={() => { setContactFilter(c.id); setContactDropOpen(false) }}
                    className={cn("flex items-center justify-between w-full text-left px-3 min-h-[48px] text-[15px] rounded-xl transition-colors", contactFilter === c.id ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700 hover:bg-slate-50")}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </MobileSheet>
          )}
        </div>
      </div>

      {/* 2-col layout */}
      <div className="flex gap-6 px-6 pb-8 items-start">
        {/* Feed */}
        <div className="flex-1 min-w-0">
          {loadingEvents ? (
            <div className="py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                <span className="text-sm">Loading timeline…</span>
              </div>
            </div>
          ) : groups.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">
                {allEvents.length === 0 ? "No timeline events yet" : "No events match your filters"}
              </p>
              {allEvents.length > 0 && (
                <button
                  onClick={() => { setSearch(""); setEventFilter("all"); setContactFilter("all") }}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                <div key={group.dateKey}>
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap px-3 py-1 rounded-full bg-slate-100">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 px-5 pt-5 pb-1">
                    {group.events.map((ev, idx) => (
                      <EventRow
                        key={ev.id}
                        event={ev}
                        isLast={idx === group.events.length - 1}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="hidden xl:block">
          <RightRail events={allEvents} />
        </div>
      </div>
    </DashboardContainer>
  )
}
