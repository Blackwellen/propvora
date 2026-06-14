"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  ExternalLink,
  Pencil,
  X,
  Bell,
  MessageSquare,
  FileText,
  Activity,
  Shield,
  Layers,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Plus,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarTabNav } from "@/components/calendar/CalendarTabNav"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"

const EVENT_TYPE_OPTIONS = [
  { value: "viewing", label: "Viewing" },
  { value: "inspection", label: "Inspection" },
  { value: "maintenance", label: "Maintenance" },
  { value: "meeting", label: "Meeting" },
  { value: "appointment", label: "Appointment" },
  { value: "reminder", label: "Reminder" },
  { value: "other", label: "Other" },
]
const EVENT_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "tentative", label: "Tentative" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]
type EventSaveFn = (field: string, value: string) => Promise<void>

/** Convert an ISO string to a value usable by <input type="datetime-local">. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* ------------------------------------------------------------------ */
/* Supabase event type                                                  */
/* ------------------------------------------------------------------ */
interface CalendarEventRow {
  id: string
  title: string
  description: string | null
  start_at: string
  end_at: string | null
  event_type: string | null
  source_module: string | null
  property_id: string | null
  all_day: boolean | null
  recurrence_rule: string | null
  status: string | null
  risk_level: string | null
  location: string | null
  workspace_id: string
  is_demo?: boolean | null
  created_at?: string
  updated_at?: string
  metadata?: Record<string, unknown> | null
}

/**
 * `calendar_events` stores source_module / status / risk_level / location inside
 * the `metadata` jsonb (no dedicated columns). Flatten them onto the row so the
 * UI can read them, and never write these as top-level columns.
 */
const META_FIELDS = ["status", "source_module", "risk_level", "location"] as const
type MetaField = (typeof META_FIELDS)[number]

function flattenEvent(raw: Record<string, unknown>): CalendarEventRow {
  const meta = (raw.metadata ?? {}) as Record<string, unknown>
  return {
    ...(raw as unknown as CalendarEventRow),
    status: (meta.status as string | null) ?? (raw.status as string | null) ?? null,
    source_module: (meta.source_module as string | null) ?? (raw.source_module as string | null) ?? null,
    risk_level: (meta.risk_level as string | null) ?? (raw.risk_level as string | null) ?? null,
    location: (meta.location as string | null) ?? (raw.location as string | null) ?? null,
    metadata: meta,
  }
}

type TabKey = "overview" | "linked" | "schedule" | "reminders" | "messages" | "documents" | "activity" | "audit"

const TABS: { key: TabKey; label: string; Icon: React.ElementType }[] = [
  { key: "overview",   label: "Overview",       Icon: Layers       },
  { key: "linked",     label: "Linked Record",  Icon: ExternalLink  },
  { key: "schedule",   label: "Schedule",       Icon: CalendarDays  },
  { key: "reminders",  label: "Reminders",      Icon: Bell          },
  { key: "messages",   label: "Messages",       Icon: MessageSquare },
  { key: "documents",  label: "Documents",      Icon: FileText      },
  { key: "activity",   label: "Activity",       Icon: Activity      },
  { key: "audit",      label: "Audit",          Icon: Shield        },
]

/* ------------------------------------------------------------------ */
/* Status / risk helpers                                                */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "primary" | "warning" | "danger" | "default" }> = {
    confirmed:  { label: "Confirmed",  variant: "success"  },
    scheduled:  { label: "Scheduled",  variant: "primary"  },
    tentative:  { label: "Tentative",  variant: "default"  },
    overdue:    { label: "Overdue",    variant: "danger"   },
    completed:  { label: "Completed",  variant: "success"  },
    cancelled:  { label: "Cancelled",  variant: "default"  },
  }
  const m = map[status] ?? { label: status, variant: "default" as const }
  return <Badge variant={m.variant} size="sm" dot>{m.label}</Badge>
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, { colour: string }> = {
    low:       { colour: "#64748B" },
    normal:    { colour: "#2563EB" },
    important: { colour: "#F59E0B" },
    urgent:    { colour: "#EF4444" },
    critical:  { colour: "#DC2626" },
  }
  const m = map[risk] ?? { colour: "#64748B" }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full border capitalize" style={{ color: m.colour, borderColor: m.colour + "40", backgroundColor: m.colour + "12" }}>
      {risk}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* KPI strip card                                                       */
/* ------------------------------------------------------------------ */
function CtxCard({ label, value, sub, Icon, colour }: { label: string; value: string; sub?: string; Icon: React.ElementType; colour: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: colour + "18" }}>
        <div style={{ color: colour }}><Icon className="w-4 h-4" /></div>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 truncate">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab content — Overview                                               */
/* ------------------------------------------------------------------ */
function TabOverview({ event, onSave, editable }: { event: CalendarEventRow; onSave: EventSaveFn; editable: boolean }) {
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  return (
    <div className="space-y-6">
      {/* Event details */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Event Details</h3>
          {editable && <span className="text-xs text-slate-400">Click any field to edit</span>}
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div className="col-span-2">
            <dt className="text-xs text-slate-500 mb-0.5">Title</dt>
            <dd><InlineEditField value={event.title} disabled={!editable} placeholder="Untitled event"
              displayClassName="text-sm text-slate-800 font-medium" onSave={(v) => onSave("title", v)} /></dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-500 mb-0.5">Description</dt>
            <dd><InlineEditField value={event.description} type="textarea" disabled={!editable} placeholder="No description"
              displayClassName="text-sm text-slate-800" onSave={(v) => onSave("description", v)} /></dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-slate-500 mb-0.5">Event Type</dt>
            <dd><InlineEditField value={event.event_type} type="select" options={EVENT_TYPE_OPTIONS} disabled={!editable}
              placeholder="—" displayClassName="text-sm text-slate-800 font-medium capitalize" onSave={(v) => onSave("event_type", v)} /></dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-slate-500 mb-0.5">Status</dt>
            <dd><InlineEditField value={event.status} type="select" options={EVENT_STATUS_OPTIONS} disabled={!editable}
              placeholder="—" displayClassName="text-sm text-slate-800 font-medium capitalize" onSave={(v) => onSave("status", v)} /></dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-slate-500 mb-0.5">Starts</dt>
            <dd>{editable ? (
              <input type="datetime-local" defaultValue={toLocalInput(event.start_at)}
                onBlur={(e) => { if (e.target.value) onSave("start_at", new Date(e.target.value).toISOString()) }}
                className="text-[13px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white text-slate-900" />
            ) : (
              <span className="text-sm text-slate-800 font-medium">{event.start_at ? fmtDate(event.start_at) : "—"}</span>
            )}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-slate-500 mb-0.5">Ends</dt>
            <dd>{editable ? (
              <input type="datetime-local" defaultValue={toLocalInput(event.end_at)}
                onBlur={(e) => { if (e.target.value) onSave("end_at", new Date(e.target.value).toISOString()) }}
                className="text-[13px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white text-slate-900" />
            ) : (
              <span className="text-sm text-slate-800 font-medium">{event.end_at ? fmtDate(event.end_at) : "—"}</span>
            )}</dd>
          </div>
          {[
            { label: "All Day",      value: event.all_day ? "Yes" : "No" },
            { label: "Recurrence",   value: event.recurrence_rule || "None" },
            { label: "Created",      value: event.created_at ? fmtDate(event.created_at) : "—" },
            { label: "Last Updated", value: event.updated_at ? fmtDate(event.updated_at) : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="col-span-2 sm:col-span-1">
              <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
              <dd className="text-sm text-slate-800 font-medium capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab content — Linked Record                                          */
/* ------------------------------------------------------------------ */
function TabLinked() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Linked Work Job</h3>
          <Button variant="soft" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />} asChild>
            <a href="/app/work/jobs/job-001">Open Full Record</a>
          </Button>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          {[
            { label: "Job ID",       value: "JOB-2045"          },
            { label: "Type",         value: "Maintenance"        },
            { label: "Status",       value: "Confirmed"          },
            { label: "Property",     value: "14 Westbourne Gardens" },
            { label: "Supplier",     value: "Elite Gas Services" },
            { label: "Scheduled",    value: "4 Jun 2026 · 09:00" },
            { label: "Est. Cost",    value: "£320"               },
            { label: "Priority",     value: "Normal"             },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
              <dd className="text-sm text-slate-800 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab content — Schedule                                               */
/* ------------------------------------------------------------------ */
function TabSchedule() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Scheduling History</h3>
        <div className="space-y-4">
          {[
            { date: "28 May 2026 · 14:32", action: "Event created",   actor: "Jamie Clarke",  colour: "#2563EB" },
            { date: "1 Jun 2026 · 10:15",  action: "Event scheduled", actor: "Jamie Clarke",  colour: "#10B981" },
            { date: "3 Jun 2026 · 09:12",  action: "Confirmed",       actor: "System",        colour: "#10B981" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.colour }} />
              <div>
                <p className="text-sm font-medium text-slate-800">{item.action}</p>
                <p className="text-xs text-slate-500">{item.date} · {item.actor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">Propose Reschedule</p>
        </div>
        <p className="text-xs text-amber-700 mb-3">No reschedule proposals pending.</p>
        <Button variant="warning" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Propose New Time</Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab content — Reminders                                              */
/* ------------------------------------------------------------------ */
function TabReminders() {
  const [adding, setAdding] = useState(false)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Reminders</p>
        <Button variant="soft" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAdding(true)}>Add Reminder</Button>
      </div>

      {/* Mock reminder */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800">1 hour before — In-app</p>
          <p className="text-xs text-slate-500 mt-0.5">4 Jun 2026 · 08:00 · <span className="text-amber-600 font-medium">Pending</span></p>
        </div>
        <Button variant="ghost" size="icon-xs"><X className="w-3.5 h-3.5" /></Button>
      </div>

      {adding && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-800">New Reminder</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option>In-app</option><option>Email</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Timing</label>
              <select className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option>At time of event</option><option>15 minutes before</option><option>1 hour before</option><option>1 day before</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => setAdding(false)}>Save Reminder</Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab content — Messages                                               */
/* ------------------------------------------------------------------ */
function TabMessages({ event }: { event: CalendarEventRow }) {
  // Calendar events are not their own message thread — messaging lives in the
  // contacts hub. Surface an honest empty state that routes there rather than
  // faking a conversation.
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <MessageSquare className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">No messages on this event</p>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
        Conversations are kept against contacts. Open the contacts messaging hub to message anyone linked to this event.
      </p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link href={event.property_id ? `/app/contacts/messages?property=${event.property_id}` : "/app/contacts/messages"}>
          Open Messaging
        </Link>
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab content — Documents                                              */
/* ------------------------------------------------------------------ */
function TabDocuments({ event }: { event: CalendarEventRow }) {
  const [docs, setDocs] = useState<Array<{ id: string; name: string; size_bytes: number | null; created_at: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      // Documents linked to this event's property (events have no own doc store).
      if (!event.property_id) { if (active) { setDocs([]); setLoading(false) }; return }
      const supabase = createClient()
      const { data, error } = await supabase
        .from("documents")
        .select("id, name, size_bytes, created_at")
        .eq("workspace_id", event.workspace_id)
        .eq("property_id", event.property_id)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(50)
      if (!active) return
      // 42P01 / RLS tolerant → honest empty state.
      setDocs(error ? [] : (data ?? []))
      setLoading(false)
    })()
    return () => { active = false }
  }, [event.property_id, event.workspace_id])

  const fmtSize = (b: number | null) => (!b ? "—" : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`)

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">Loading documents…</div>
  }
  if (docs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No documents</p>
        <p className="text-xs text-slate-500 mt-1">
          {event.property_id ? "No documents are filed against this event's property yet." : "Link a property to this event to surface related documents."}
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div key={doc.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
            <p className="text-xs text-slate-500">
              {new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {fmtSize(doc.size_bytes)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab content — Activity                                               */
/* ------------------------------------------------------------------ */
function TabActivity({ event }: { event: CalendarEventRow }) {
  const [items, setItems] = useState<Array<{ id: string; action: string; created_at: string; user_id: string | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, created_at, user_id")
        .eq("workspace_id", event.workspace_id)
        .eq("resource_type", "calendar_event")
        .eq("resource_id", event.id)
        .order("created_at", { ascending: false })
        .limit(50)
      if (!active) return
      setItems(error ? [] : (data ?? []))
      setLoading(false)
    })()
    return () => { active = false }
  }, [event.id, event.workspace_id])

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">Loading activity…</div>
  }
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Activity className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No activity recorded</p>
        <p className="text-xs text-slate-500 mt-1">Changes to this event will appear here.</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="relative pl-4">
        <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-200" />
        <div className="space-y-5">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full absolute -left-[5px] mt-1.5 bg-[#2563EB]" />
              <div className="pl-2">
                <p className="text-sm font-medium text-slate-800">{item.action}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(item.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · {item.user_id ? "Team member" : "System"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab content — Audit                                                  */
/* ------------------------------------------------------------------ */
function TabAudit() {
  const rows = [
    { date: "28 May 2026 · 14:32", action: "Created",         actor: "Jamie Clarke", details: "Event created from Work module" },
    { date: "1 Jun 2026 · 10:15",  action: "Updated",         actor: "Jamie Clarke", details: "startAt set to 2026-06-04T09:00:00" },
    { date: "1 Jun 2026 · 10:18",  action: "Reminder added",  actor: "Jamie Clarke", details: "In-app, 1 hour before" },
    { date: "3 Jun 2026 · 09:12",  action: "Status changed",  actor: "System",       details: "scheduled → confirmed" },
  ]
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Date", "Action", "Actor", "Details"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{row.date}</td>
                <td className="px-4 py-3 text-xs font-medium text-slate-800">{row.action}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{row.actor}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{row.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Right rail                                                           */
/* ------------------------------------------------------------------ */
function RightRail({ event, onDelete, onMarkDone, busy }: { event: CalendarEventRow; onDelete: () => void; onMarkDone: () => void; busy: boolean }) {
  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Quick Actions</p>
        <Button variant="outline" size="sm" className="w-full justify-start" leftIcon={<Pencil className="w-3.5 h-3.5" />} asChild>
          <a href={`/app/calendar/events/${event.id}/edit`}>Edit Event</a>
        </Button>
        <Button variant="success" size="sm" className="w-full justify-start" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={onMarkDone} disabled={busy || event.status === "completed"}>
          {event.status === "completed" ? "Completed" : "Mark Done"}
        </Button>
        <ConfirmDialog
          title="Delete event?"
          description={`This permanently deletes "${event.title}" and cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={async () => { onDelete() }}
        >
          {(open) => (
            <Button variant="outline" size="sm" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50" leftIcon={<X className="w-3.5 h-3.5" />} onClick={open} disabled={busy}>
              Delete Event
            </Button>
          )}
        </ConfirmDialog>
      </div>

      {/* Event info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Event Info</p>
        <dl className="space-y-2 text-xs">
          {[
            { label: "ID",      value: event.id.slice(0, 8) + "..." },
            { label: "Type",    value: event.event_type?.replace("-", " ") || "—" },
            { label: "Status",  value: event.status || "—" },
            { label: "All Day", value: event.all_day ? "Yes" : "No" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-800 text-right capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* AI insight */}
      <div className="rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          <p className="text-xs font-semibold text-[#6D28D9] uppercase tracking-wide">AI Insight</p>
        </div>
        <p className="text-xs text-[#6D28D9] leading-relaxed">
          AI-powered recommendations for this event will appear here once your calendar data is populated.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [event, setEvent] = useState<CalendarEventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from("calendar_events")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          if ((error as { code?: string }).code === "PGRST116" || (error as { code?: string }).code === "42P01") {
            setNotFound(true)
          } else {
            console.error("event load error:", error.message)
            setNotFound(true)
          }
        } else {
          setEvent(flattenEvent(data as Record<string, unknown>))
        }
        setLoading(false)
      })
  }, [id])

  // Live events persist; seed/demo rows are read-only inline.
  const editable = !!event && event.is_demo !== true

  async function saveField(field: string, value: string) {
    if (!event) return
    const v = value.trim()
    const next = v === "" ? null : v
    // status / source_module / risk_level / location live in metadata jsonb,
    // not as top-level columns — route them there so the write actually succeeds.
    const isMeta = (META_FIELDS as readonly string[]).includes(field)
    const payload: Record<string, unknown> = isMeta
      ? { metadata: { ...(event.metadata ?? {}), [field as MetaField]: next } }
      : { [field]: next }
    const supabase = createClient()
    const { data, error } = await supabase
      .from("calendar_events")
      .update(payload)
      .eq("id", event.id)
      .eq("workspace_id", event.workspace_id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setEvent(flattenEvent(data as Record<string, unknown>))
  }

  async function handleMarkDone() {
    if (!event) return
    try {
      await saveField("status", "completed")
    } catch (e) {
      alert("Failed to update: " + (e as Error).message)
    }
  }

  async function handleDelete() {
    if (!event) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("calendar_events").delete().eq("id", event.id)
    if (error) {
      alert("Failed to delete: " + error.message)
      setDeleting(false)
      return
    }
    router.push("/app/calendar")
  }

  if (loading) {
    return (
      <div className="space-y-0">
        <CalendarTabNav />
        <div className="px-6 py-16 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading event...</p>
        </div>
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="space-y-0">
        <CalendarTabNav />
        <div className="px-6 py-16 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Event not found</p>
          <p className="text-xs text-slate-400 mt-1">This event may have been deleted or the calendar table is not yet set up.</p>
          <a href="/app/calendar" className="mt-4 inline-block text-sm text-blue-600 hover:underline">Back to Calendar</a>
        </div>
      </div>
    )
  }

  const eventTypeLabel = event.event_type?.replace("-", " ") ?? "event"
  const startLabel = event.start_at
    ? new Date(event.start_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : ""

  return (
    <div className="space-y-0">
      <CalendarTabNav />

      {/* Breadcrumb */}
      <div className="px-6 pt-5 pb-0">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <a href="/app/calendar" className="hover:text-[#2563EB]">Calendar</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">{event.title}</span>
        </nav>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Hero card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 border-l-4" style={{ borderLeftColor: "#2563EB" }}>
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">{eventTypeLabel}</span>
                  {event.status && <StatusBadge status={event.status} />}
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{startLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap lg:shrink-0">
              <Button variant="outline" size="sm" leftIcon={<Pencil className="w-3.5 h-3.5" />} asChild>
                <a href={`/app/calendar/events/${event.id}/edit`}>Edit Event</a>
              </Button>
              <Button variant="success" size="sm" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={handleMarkDone} disabled={deleting || event.status === "completed"}>
                {event.status === "completed" ? "Completed" : "Mark Done"}
              </Button>
              <ConfirmDialog
                title="Delete event?"
                description={`This permanently deletes "${event.title}" and cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
              >
                {(openDelete) => (
                  <ActionMenu
                    items={[
                      { label: "Edit Event", icon: Pencil, onClick: () => router.push(`/app/calendar/events/${event.id}/edit`) },
                      { label: "Mark Confirmed", icon: CheckCircle2, disabled: !editable || event.status === "confirmed", onClick: () => { saveField("status", "confirmed").catch((e) => alert("Failed: " + (e as Error).message)) } },
                      { label: "Mark Completed", icon: CheckCircle2, disabled: !editable || event.status === "completed", onClick: handleMarkDone },
                      { label: "Cancel Event", icon: X, disabled: !editable || event.status === "cancelled", onClick: () => { saveField("status", "cancelled").catch((e) => alert("Failed: " + (e as Error).message)) } },
                      { label: "Delete Event", icon: X, variant: "danger", onClick: openDelete },
                    ]}
                  />
                )}
              </ConfirmDialog>
            </div>
          </div>
        </div>

        {/* Main + Rail */}
        <div className="flex gap-5 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-0">
            {/* Tabs */}
            <div className="border-b border-slate-200 bg-white rounded-t-xl overflow-x-auto">
              <div className="flex items-center gap-0.5 px-2 pt-2 [&::-webkit-scrollbar]:hidden">
                {TABS.map(tab => {
                  const Icon = tab.Icon
                  const active = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-t-lg border-b-2 -mb-px whitespace-nowrap transition-all",
                        active
                          ? "border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]/60"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab panel */}
            <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-6">
              {activeTab === "overview"  && <TabOverview event={event} onSave={saveField} editable={editable} />}
              {activeTab === "linked"    && <TabLinked />}
              {activeTab === "schedule"  && <TabSchedule />}
              {activeTab === "reminders" && <TabReminders />}
              {activeTab === "messages"  && <TabMessages event={event} />}
              {activeTab === "documents" && <TabDocuments event={event} />}
              {activeTab === "activity"  && <TabActivity event={event} />}
              {activeTab === "audit"     && <TabAudit />}
            </div>
          </div>

          {/* Right rail */}
          <aside className="w-[280px] shrink-0 sticky top-6">
            <RightRail event={event} onDelete={handleDelete} onMarkDone={handleMarkDone} busy={deleting} />
          </aside>
        </div>
      </div>
    </div>
  )
}
