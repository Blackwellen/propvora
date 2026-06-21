"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle, Clock, MessageSquare, CheckCircle2,
  FileText, Globe, X,
  Search, SlidersHorizontal, Activity, Eye, Copy,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { MobileTopBar, MobilePageHeader } from "@/components/mobile"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

// ─── Avatar helpers ──────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
type ActivityEventType = "payment" | "message" | "document" | "task" | "portal" | "alert" | "system"

interface ActivityEvent {
  id: string
  time: string
  date: string
  actor: string
  resourceType: string
  resourceId: string
  eventType: ActivityEventType
  title: string
  description: string
}

type FilterKey = "all" | ActivityEventType

// ─── Map audit action → event type ────────────────────────────────────────────
function actionToEventType(action: string): ActivityEventType {
  const a = action.toLowerCase()
  if (a.includes("message") || a.includes("sms") || a.includes("email")) return "message"
  if (a.includes("payment") || a.includes("invoice") || a.includes("rent")) return "payment"
  if (a.includes("document") || a.includes("upload") || a.includes("file")) return "document"
  if (a.includes("task") || a.includes("job") || a.includes("work")) return "task"
  if (a.includes("portal") || a.includes("login") || a.includes("access")) return "portal"
  if (a.includes("alert") || a.includes("arrears") || a.includes("overdue") || a.includes("expir")) return "alert"
  return "system"
}

// ─── Event config ──────────────────────────────────────────────────────────────
interface EventConfig {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  chipCls: string
  dotColor: string
}

const EVENT_CONFIG: Record<ActivityEventType, EventConfig> = {
  payment:  { icon: CheckCircle2,  iconBg: "bg-emerald-100", iconColor: "text-emerald-600", chipCls: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-500" },
  message:  { icon: MessageSquare, iconBg: "bg-blue-100",    iconColor: "text-blue-600",    chipCls: "bg-blue-100 text-blue-700",       dotColor: "bg-blue-500" },
  document: { icon: FileText,      iconBg: "bg-purple-100",  iconColor: "text-purple-600",  chipCls: "bg-purple-100 text-purple-700",   dotColor: "bg-purple-500" },
  task:     { icon: Clock,         iconBg: "bg-amber-100",   iconColor: "text-amber-600",   chipCls: "bg-amber-100 text-amber-700",     dotColor: "bg-amber-500" },
  portal:   { icon: Globe,         iconBg: "bg-teal-100",    iconColor: "text-teal-600",    chipCls: "bg-teal-100 text-teal-700",       dotColor: "bg-teal-500" },
  alert:    { icon: AlertTriangle, iconBg: "bg-red-100",     iconColor: "text-red-600",     chipCls: "bg-red-100 text-red-700",         dotColor: "bg-red-500" },
  system:   { icon: Activity,      iconBg: "bg-slate-100",   iconColor: "text-slate-500",   chipCls: "bg-slate-100 text-slate-600",     dotColor: "bg-slate-400" },
}

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "payment",  label: "Payments" },
  { key: "message",  label: "Messages" },
  { key: "document", label: "Documents" },
  { key: "task",     label: "Tasks" },
  { key: "portal",   label: "Portal" },
  { key: "alert",    label: "Alerts" },
  { key: "system",   label: "System" },
]

// ─── Group by date ─────────────────────────────────────────────────────────────
interface DateGroup {
  dateKey: string
  label: string
  events: ActivityEvent[]
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

function groupByDate(events: ActivityEvent[]): DateGroup[] {
  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  const map = new Map<string, ActivityEvent[]>()
  for (const ev of events) {
    map.set(ev.date, [...(map.get(ev.date) ?? []), ev])
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([dateKey, evs]) => ({
      dateKey,
      label: dateKey === today ? `Today — ${fmtDate(dateKey)}` : dateKey === yesterday ? `Yesterday — ${fmtDate(dateKey)}` : fmtDate(dateKey),
      events: evs,
    }))
}

// ─── Activity event row ────────────────────────────────────────────────────────
function ActivityRow({ event }: { event: ActivityEvent }) {
  const cfg = EVENT_CONFIG[event.eventType]
  const Icon = cfg.icon
  const router = useRouter()
  const contactHref = event.resourceType === "contact" && event.resourceId
    ? `/property-manager/contacts/${event.resourceId}`
    : null

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-b-0 group">
      <span className="text-[10px] text-slate-400 w-14 shrink-0 pt-1 text-right">{event.time}</span>
      <span className={cn("w-2 h-2 rounded-full shrink-0 mt-2", cfg.dotColor)} />
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", cfg.iconBg)}>
        <Icon className={cn("w-3.5 h-3.5", cfg.iconColor)} />
      </div>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0", avatarBg(event.actor))}>
        {initials(event.actor)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900">{event.actor}</span>
        </div>
        <p className="text-xs font-medium text-slate-700 mt-0.5">{event.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{event.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.chipCls)}>
          {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionMenu
            items={[
              ...(contactHref ? [{ label: "View Contact", icon: Eye, onClick: () => router.push(contactHref) }] : []),
              { label: "Copy Details", icon: Copy, onClick: () => { void navigator.clipboard?.writeText(`${event.actor} — ${event.title}: ${event.description}`) } },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ActivityPage() {
  const { workspace } = useWorkspace()
  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!workspace?.id) return
    setLoading(true)
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
          // 42P01 (missing table) → honest empty state
          setAllEvents([])
          return
        }

        const rows: ActivityEvent[] = (data ?? []).map((row) => {
          const createdAt = new Date(row.created_at)
          const eventType = actionToEventType(row.action)
          const resourceId = (row.resource_id as string) ?? ""
          return {
            id: row.id as string,
            date: createdAt.toISOString().split("T")[0],
            time: createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
            actor: row.user_id ? "Team member" : "System",
            resourceType: (row.resource_type as string) ?? "system",
            resourceId,
            eventType,
            title: row.action as string,
            description: `${(row.resource_type as string) ?? "Resource"}${resourceId ? ` — ${resourceId.slice(0, 8)}` : ""}`,
          }
        })
        setAllEvents(rows)
      } catch {
        setAllEvents([])
      } finally {
        setLoading(false)
      }
    })()
  }, [workspace?.id])

  const filtered = useMemo(() => {
    let data = [...allEvents]
    if (activeFilter !== "all") data = data.filter((e) => e.eventType === activeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(
        (e) =>
          e.actor.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      )
    }
    return data
  }, [allEvents, activeFilter, search])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  // Live KPI counts derived from real audit events
  const counts = useMemo(() => {
    const c: Record<string, number> = { total: allEvents.length }
    for (const ev of allEvents) c[ev.eventType] = (c[ev.eventType] ?? 0) + 1
    return c
  }, [allEvents])

  const KPIS: { key: FilterKey; label: string; icon: React.ReactNode; bg: string }[] = [
    { key: "all",      label: "Total Events", icon: <Activity     className="w-4 h-4 text-slate-600"   />, bg: "bg-slate-50" },
    { key: "payment",  label: "Payments",     icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: "bg-emerald-50" },
    { key: "message",  label: "Messages",     icon: <MessageSquare className="w-4 h-4 text-blue-600"   />, bg: "bg-blue-50" },
    { key: "document", label: "Documents",    icon: <FileText     className="w-4 h-4 text-purple-600"  />, bg: "bg-purple-50" },
    { key: "task",     label: "Tasks",        icon: <Clock        className="w-4 h-4 text-amber-600"   />, bg: "bg-amber-50" },
    { key: "portal",   label: "Portal",       icon: <Globe        className="w-4 h-4 text-teal-600"    />, bg: "bg-teal-50" },
    { key: "alert",    label: "Alerts",       icon: <AlertTriangle className="w-4 h-4 text-red-600"    />, bg: "bg-red-50" },
    { key: "system",   label: "System",       icon: <Activity     className="w-4 h-4 text-slate-400"   />, bg: "bg-slate-50" },
  ]

  return (
    <DashboardContainer>
      <MobileTopBar title="Contact Activity" subtitle="Activity log" />
      <div className="md:hidden -mx-4">
        <ContactsTabNav />
      </div>
      <div className="hidden md:block">
        <ContactsTabNav />
      </div>

      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-8 space-y-6">
        {/* Mobile search */}
        <div className="md:hidden">
          <MobilePageHeader
            title="Contact Activity"
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search activity…"
            className="mb-0"
          />
        </div>
        {/* Header */}
        <div className="hidden md:flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Contacts</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contact Activity</h1>
            <p className="text-sm text-slate-500 mt-0.5">Live activity log across all contacts and event types</p>
          </div>
        </div>

        {/* KPI cards — live counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", kpi.bg)}>
                {kpi.icon}
              </div>
              <p className="text-xl font-bold text-slate-900 leading-none">
                {loading ? "—" : kpi.key === "all" ? counts.total : (counts[kpi.key] ?? 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setActiveFilter(chip.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeFilter === chip.key ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              aria-label="Search activity"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
              <span className="text-sm">Loading activity…</span>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <Activity className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">
              {allEvents.length === 0 ? "No activity recorded yet" : "No activity matches your filters"}
            </p>
            {allEvents.length > 0 && (
              <button
                onClick={() => { setSearch(""); setActiveFilter("all") }}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.dateKey}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap px-3 py-1 rounded-full bg-slate-100">
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 px-4 shadow-sm">
                  {group.events.map((ev) => (
                    <ActivityRow key={ev.id} event={ev} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardContainer>
  )
}
