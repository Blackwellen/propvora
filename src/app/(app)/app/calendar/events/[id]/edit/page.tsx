"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSectionRouter, useSectionLink } from "@/components/sections/SectionBasePath"
import {
  ChevronRight,
  Wrench,
  Clock,
  Building2,
  User,
  Bell,
  Repeat,
  StickyNote,
  RefreshCw,
  X,
  Trash2,
  AlertTriangle,
  ChevronDown,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarTabNav } from "@/components/calendar/CalendarTabNav"
import { MobileTopBar } from "@/components/mobile"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"

// Properties loaded from Supabase at runtime

const EVENT_TYPES = [
  "Manual Event",
  "Task Reminder",
  "Job Schedule",
  "Supplier Booking",
  "Viewing",
  "Inspection",
  "Contact Follow-up",
  "Money Reminder",
  "Planning Review",
  "Document / Compliance Deadline",
  "Other",
]

const RISK_LEVELS = ["Low", "Normal", "Important", "Urgent", "Critical"] as const
const RISK_COLOURS: Record<string, string> = {
  Low: "#64748B", Normal: "#2563EB", Important: "#F59E0B", Urgent: "#EF4444", Critical: "#DC2626",
}

const TIMEZONES = ["Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Dubai"]
const RECURRENCE_OPTIONS = ["None", "Daily", "Weekly", "Fortnightly", "Monthly", "Quarterly", "Annual"]
const REMINDER_TIMINGS = ["At time of event", "15 minutes before", "1 hour before", "1 day before", "7 days before"]
const REMINDER_TYPES = ["In-app", "Email"]

/* ------------------------------------------------------------------ */
/* Form state type                                                      */
/* ------------------------------------------------------------------ */
interface EditForm {
  title: string
  eventType: string
  description: string
  location: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  allDay: boolean
  timezone: string
  property: string
  contact: string
  sourceRecord: string
  assignee: string
  risk: string
  reminderType: string
  reminderTiming: string
  recurrence: string
  recurrenceEnd: string
  notes: string
  internalNotes: string
}

const EMPTY_FORM: EditForm = {
  title: "",
  eventType: "",
  description: "",
  location: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  allDay: false,
  timezone: "Europe/London",
  property: "",
  contact: "",
  sourceRecord: "",
  assignee: "",
  risk: "Normal",
  reminderType: "In-app",
  reminderTiming: "1 hour before",
  recurrence: "None",
  recurrenceEnd: "",
  notes: "",
  internalNotes: "",
}

/* ------------------------------------------------------------------ */
/* Section card wrapper                                                 */
/* ------------------------------------------------------------------ */
function SectionCard({ title, Icon, children }: { title: string; Icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 mb-4">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
          <div style={{ color: "var(--brand)" }}><Icon className="w-3.5 h-3.5" /></div>
        </div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Input helpers                                                        */
/* ------------------------------------------------------------------ */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
    />
  )
}

function SelectInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white resize-none"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Dangerous action accordion item                                      */
/* ------------------------------------------------------------------ */
interface DangerItemProps {
  title: string
  description: string
  colour: "amber" | "red"
  children: React.ReactNode
}

function DangerItem({ title, description, colour, children }: DangerItemProps) {
  const [open, setOpen] = useState(false)
  const isRed = colour === "red"
  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      isRed ? "border-red-200" : "border-amber-200"
    )}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 text-left transition-colors",
          isRed ? "bg-red-50 hover:bg-red-100" : "bg-amber-50 hover:bg-amber-100"
        )}
      >
        <div>
          <p className={cn("text-sm font-semibold", isRed ? "text-red-800" : "text-amber-800")}>{title}</p>
          <p className={cn("text-xs mt-0.5", isRed ? "text-red-600" : "text-amber-600")}>{description}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", open ? "rotate-180" : "", isRed ? "text-red-500" : "text-amber-500")} />
      </button>
      {open && (
        <div className={cn("px-5 py-4 border-t", isRed ? "border-red-200 bg-white" : "border-amber-200 bg-white")}>
          {children}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function EventEditPage() {
  const params = useParams()
  const router = useSectionRouter()
  const sectionLink = useSectionLink()
  const id = params.id as string

  const [form, setForm] = useState<EditForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [properties, setProperties] = useState<string[]>([])
  // Preserve metadata keys we don't edit here (source_module, status) on save.
  const [existingMeta, setExistingMeta] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from("calendar_events")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const raw = data as Record<string, unknown>
          const meta = (raw.metadata ?? {}) as Record<string, unknown>
          // status/source_module/risk_level/location/timezone live in metadata jsonb.
          setExistingMeta(meta)
          const ev = {
            title: raw.title as string | undefined,
            event_type: raw.event_type as string | undefined,
            description: raw.description as string | undefined,
            location: (meta.location as string | undefined) ?? (raw.location as string | undefined),
            start_at: raw.start_at as string | undefined,
            end_at: raw.end_at as string | undefined,
            all_day: raw.all_day as boolean | undefined,
            status: (meta.status as string | undefined) ?? (raw.status as string | undefined),
            recurrence_rule: raw.recurrence_rule as string | null | undefined,
            risk_level: (meta.risk_level as string | null | undefined) ?? (raw.risk_level as string | null | undefined),
            timezone: (meta.timezone as string | null | undefined) ?? (raw.timezone as string | null | undefined),
          }
          // Convert ISO → local input parts.
          const toParts = (iso?: string) => {
            if (!iso) return { date: "", time: "" }
            const d = new Date(iso)
            const pad = (n: number) => String(n).padStart(2, "0")
            return {
              date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
              time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
            }
          }
          const s = toParts(ev.start_at)
          const e = toParts(ev.end_at)
          const cap = (v?: string | null) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "Normal"
          setForm({
            title: ev.title || "",
            eventType: ev.event_type || "",
            description: ev.description || "",
            location: ev.location || "",
            startDate: s.date,
            startTime: s.time,
            endDate: e.date,
            endTime: e.time,
            allDay: ev.all_day ?? false,
            timezone: ev.timezone || "Europe/London",
            property: "",
            contact: "",
            sourceRecord: "",
            assignee: "",
            risk: cap(ev.risk_level),
            reminderType: "In-app",
            reminderTiming: "1 hour before",
            recurrence: ev.recurrence_rule || "None",
            recurrenceEnd: "",
            notes: ev.description || "",
            internalNotes: "",
          })
        }
        setLoading(false)
      })
    ;(async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, nickname, address_line1, city")
        .order("nickname", { ascending: true })
      if (error || !data) return // 42P01 / RLS tolerant
      setProperties((data as Array<{ id: string; nickname: string | null; address_line1: string | null; city: string | null }>)
        .map((p) => p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || p.id))
    })()
  }, [id])

  const canDelete = deleteText.trim() === form.title

  function update<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) { setSaveError("Title is required."); return }
    if (!form.startDate) { setSaveError("Start date is required."); return }
    const startIso = new Date(form.allDay ? `${form.startDate}T00:00:00` : `${form.startDate}T${form.startTime || "00:00"}:00`)
    const endIso = form.endDate
      ? new Date(form.allDay ? `${form.endDate}T23:59:59` : `${form.endDate}T${form.endTime || "00:00"}:00`)
      : startIso
    if (endIso.getTime() < startIso.getTime()) { setSaveError("End must be the same as or after the start."); return }

    const riskLevel = (form.risk || "Normal").toLowerCase()
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("calendar_events")
        .update({
          title: form.title.trim(),
          description: form.description || null,
          start_at: startIso.toISOString(),
          end_at: endIso.toISOString(),
          start_date: form.startDate,
          start_time: form.allDay ? null : (form.startTime || null),
          end_time: form.allDay ? null : (form.endTime || null),
          event_type: form.eventType || "manual",
          all_day: form.allDay,
          recurrence_rule: form.recurrence !== "None" ? form.recurrence : null,
          // No dedicated columns for these on calendar_events — keep in metadata.
          // Merge over existing metadata so source_module/status aren't dropped.
          metadata: {
            ...existingMeta,
            timezone: form.timezone || "Europe/London",
            risk_level: ["normal", "important", "urgent", "critical"].includes(riskLevel) ? riskLevel : "normal",
            location: form.location || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) {
        setSaveError(error.message)
        setSaving(false)
        return
      }
      router.push(`/app/calendar/events/${id}`)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Unexpected error")
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!canDelete) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("calendar_events").delete().eq("id", id)
    if (error) { alert("Delete failed: " + error.message); setSaving(false); return }
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

  return (
    <div className="space-y-0 pb-32 lg:pb-24">
      <MobileTopBar title="Edit Event" subtitle={form.title || "Event"} showBack backHref={sectionLink(`/app/calendar/events/${id}`)} />
      <div className="hidden md:block">
        <CalendarTabNav />
      </div>

      {/* Breadcrumb */}
      <div className="hidden md:block px-6 pt-5 pb-0">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <a href={sectionLink("/app/calendar")} className="hover:text-[#2563EB]">Calendar</a>
          <ChevronRight className="w-3 h-3" />
          <a href={sectionLink(`/app/calendar/events/${id}`)} className="hover:text-[#2563EB]">{form.title || "Event"}</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Edit</span>
        </nav>
      </div>

      <div className="px-4 md:px-6 py-5 max-w-[860px]">
        {/* Section 1: Event Details */}
        <SectionCard title="Event Details" Icon={Wrench}>
          <div className="space-y-4">
            <div>
              <FieldLabel required>Title</FieldLabel>
              <TextInput value={form.title} onChange={v => update("title", v)} placeholder="Event title…" />
            </div>
            <div>
              <FieldLabel required>Event Type</FieldLabel>
              <SelectInput value={form.eventType} onChange={v => update("eventType", v)} options={EVENT_TYPES} />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <TextArea value={form.description} onChange={v => update("description", v)} placeholder="Describe this event…" />
            </div>
            <div>
              <FieldLabel>Location</FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.location}
                  onChange={e => update("location", e.target.value)}
                  placeholder="e.g. 14 Westbourne Gardens, London"
                  className="w-full h-9 pl-8 pr-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 2: Date & Time */}
        <SectionCard title="Date &amp; Time" Icon={Clock}>
          <div className="space-y-4">
            {/* All-day toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-sm font-medium text-slate-700">All-day event</p>
              <button
                onClick={() => update("allDay", !form.allDay)}
                className={cn("w-11 h-6 rounded-full transition-colors relative", form.allDay ? "bg-[#2563EB]" : "bg-slate-300")}
              >
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", form.allDay ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Start Date</FieldLabel>
                <TextInput type="date" value={form.startDate} onChange={v => update("startDate", v)} />
              </div>
              {!form.allDay && (
                <div>
                  <FieldLabel>Start Time</FieldLabel>
                  <TextInput type="time" value={form.startTime} onChange={v => update("startTime", v)} />
                </div>
              )}
              <div>
                <FieldLabel>End Date</FieldLabel>
                <TextInput type="date" value={form.endDate} onChange={v => update("endDate", v)} />
              </div>
              {!form.allDay && (
                <div>
                  <FieldLabel>End Time</FieldLabel>
                  <TextInput type="time" value={form.endTime} onChange={v => update("endTime", v)} />
                </div>
              )}
            </div>
            <div>
              <FieldLabel>Timezone</FieldLabel>
              <SelectInput value={form.timezone} onChange={v => update("timezone", v)} options={TIMEZONES} />
            </div>
          </div>
        </SectionCard>

        {/* Section 3: Linked Records */}
        <SectionCard title="Linked Records" Icon={Building2}>
          <div className="space-y-4">
            <div>
              <FieldLabel>Property</FieldLabel>
              <SelectInput value={form.property} onChange={v => update("property", v)} options={properties} placeholder="Select property..." />
            </div>
            <div>
              <FieldLabel>Notes / Context</FieldLabel>
              <TextArea value={form.notes} onChange={v => update("notes", v)} placeholder="Notes for this event..." rows={2} />
            </div>
          </div>
        </SectionCard>

        {/* Section 4: Assignment & Risk */}
        <SectionCard title="Assignment &amp; Risk" Icon={User}>
          <div className="space-y-4">
            <div>
              <FieldLabel>Assignee (optional)</FieldLabel>
              <TextInput value={form.assignee} onChange={v => update("assignee", v)} placeholder="Name or email..." />
            </div>
            <div>
              <FieldLabel>Risk Level</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {RISK_LEVELS.map(r => (
                  <button
                    key={r}
                    onClick={() => update("risk", r)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all",
                      form.risk === r ? "border-current text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                    style={form.risk === r ? { borderColor: RISK_COLOURS[r], backgroundColor: RISK_COLOURS[r] } : {}}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 5: Reminders & Recurrence */}
        <SectionCard title="Reminders &amp; Recurrence" Icon={Bell}>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-[#2563EB]" />
                <p className="text-xs font-semibold text-slate-700">Reminder</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <SelectInput value={form.reminderType} onChange={v => update("reminderType", v)} options={REMINDER_TYPES} />
                </div>
                <div>
                  <FieldLabel>Timing</FieldLabel>
                  <SelectInput value={form.reminderTiming} onChange={v => update("reminderTiming", v)} options={REMINDER_TIMINGS} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-[#7C3AED]" />
                <p className="text-xs font-semibold text-slate-700">Recurrence</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {RECURRENCE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => update("recurrence", opt)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      form.recurrence === opt
                        ? "bg-[#2563EB] text-white border-[#2563EB]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {form.recurrence !== "None" && (
                <div>
                  <FieldLabel>End Date (leave blank for no end)</FieldLabel>
                  <TextInput type="date" value={form.recurrenceEnd} onChange={v => update("recurrenceEnd", v)} />
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Section 6: Notes & Metadata */}
        <SectionCard title="Notes &amp; Metadata" Icon={StickyNote}>
          <div className="space-y-4">
            <div>
              <FieldLabel>Internal Notes</FieldLabel>
              <TextArea value={form.internalNotes} onChange={v => update("internalNotes", v)} placeholder="Internal team notes..." rows={3} />
            </div>
          </div>
        </SectionCard>

        {/* Dangerous Actions */}
        <div className="mt-8 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">Dangerous Actions</p>

          {/* Reschedule */}
          <DangerItem
            title="Reschedule Event"
            description="Move this event to a new date and time."
            colour="amber"
          >
            <div className="space-y-3">
              <div>
                <FieldLabel>New Start Date</FieldLabel>
                <TextInput type="date" value={rescheduleDate} onChange={setRescheduleDate} />
              </div>
              <div className="flex gap-2">
                <Button variant="warning" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} disabled={!rescheduleDate}>
                  Reschedule Event
                </Button>
              </div>
            </div>
          </DangerItem>

          {/* Cancel */}
          <DangerItem
            title="Cancel Event"
            description="Cancel this event. This can be undone by re-scheduling."
            colour="amber"
          >
            {!cancelConfirm ? (
              <Button variant="warning" size="sm" leftIcon={<X className="w-3.5 h-3.5" />} onClick={() => setCancelConfirm(true)}>
                Cancel Event
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">Are you sure you want to cancel this event? It will be marked as Cancelled and removed from active schedules.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="warning" size="sm">Yes, Cancel Event</Button>
                  <Button variant="ghost" size="sm" onClick={() => setCancelConfirm(false)}>Go Back</Button>
                </div>
              </div>
            )}
          </DangerItem>

          {/* Delete */}
          <DangerItem
            title="Delete Event"
            description="Permanently delete this event. This cannot be undone."
            colour="red"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">
                  This will permanently delete <span className="font-semibold">{form.title}</span> and all associated data. This action cannot be undone.
                </p>
              </div>
              <div>
                <FieldLabel>
                  Type &quot;{form.title}&quot; to confirm
                </FieldLabel>
                <input
                  type="text"
                  value={deleteText}
                  onChange={e => setDeleteText(e.target.value)}
                  placeholder={`Type: ${form.title}`}
                  className="w-full h-9 px-3 rounded-lg text-sm border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 bg-white"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                disabled={!canDelete || saving}
                onClick={handleDelete}
              >
                {saving ? "Deleting..." : "Permanently Delete Event"}
              </Button>
            </div>
          </DangerItem>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="app-save-bar fixed left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-500">Editing: <span className="font-medium text-slate-700">{form.title || "Event"}</span></span>
            {saveError && <p className="text-xs text-red-600 mt-0.5">{saveError}</p>}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href={sectionLink(`/app/calendar/events/${id}`)}>Cancel</a>
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
