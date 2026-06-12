"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckSquare,
  Wrench,
  Home,
  CreditCard,
  FileText,
  Map,
  User,
  Star,
  Bell,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  RefreshCw,
  Building2,
  Repeat,
  AlertCircle,
  MapPin,
  StickyNote,
  Sparkles,
  CheckCircle2,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarTabNav } from "@/components/calendar/CalendarTabNav"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

/* ------------------------------------------------------------------ */
/* Event types grid config                                              */
/* ------------------------------------------------------------------ */
interface EventTypeOption {
  key: string
  label: string
  description: string
  Icon: React.ElementType
  colour: string
  bg: string
}

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { key: "manual",      label: "Manual Event",             description: "Create a custom event from scratch",          Icon: Calendar,     colour: "#2563EB", bg: "#EFF6FF" },
  { key: "task",        label: "Task Reminder",            description: "Reminder linked to an existing task",         Icon: CheckSquare,  colour: "#64748B", bg: "#F8FAFC" },
  { key: "job",         label: "Job Schedule",             description: "Schedule a maintenance or repair job",        Icon: Wrench,       colour: "#F59E0B", bg: "#FFFBEB" },
  { key: "supplier",    label: "Supplier Booking",         description: "Book a supplier or contractor visit",         Icon: Star,         colour: "#0EA5E9", bg: "#F0F9FF" },
  { key: "viewing",     label: "Viewing",                  description: "Property viewing appointment",                Icon: Eye,          colour: "#10B981", bg: "#ECFDF5" },
  { key: "inspection",  label: "Inspection",               description: "Property inspection visit",                   Icon: Building2,    colour: "#7C3AED", bg: "#F5F3FF" },
  { key: "followup",    label: "Contact Follow-up",        description: "Follow-up with a tenant or contact",         Icon: User,         colour: "#64748B", bg: "#F8FAFC" },
  { key: "money",       label: "Money Reminder",           description: "Rent, invoice or payment deadline",          Icon: CreditCard,   colour: "#EF4444", bg: "#FEF2F2" },
  { key: "planning",    label: "Planning Review",          description: "Planning application or portfolio review",    Icon: Map,          colour: "#7C3AED", bg: "#F5F3FF" },
  { key: "compliance",  label: "Document / Compliance Deadline", description: "Certificate, licence or legal deadline", Icon: FileText, colour: "#DC2626", bg: "#FEF2F2" },
  { key: "other",       label: "Other",                    description: "Any other calendar event",                   Icon: Sparkles,     colour: "#94A3B8", bg: "#F8FAFC" },
]

// Properties and contacts are loaded from Supabase at runtime

const TIMEZONES = ["Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Asia/Singapore"]

const REMINDER_TIMINGS = ["At time of event", "15 minutes before", "1 hour before", "1 day before", "7 days before"]
const REMINDER_TYPES = ["In-app", "Email"]
const RECURRENCE_OPTIONS = ["None", "Daily", "Weekly", "Fortnightly", "Monthly", "Quarterly", "Annual"]
const RISK_LEVELS = ["Low", "Normal", "Important", "Urgent", "Critical"] as const
const RISK_COLOURS: Record<string, string> = {
  Low: "#64748B", Normal: "#2563EB", Important: "#F59E0B", Urgent: "#EF4444", Critical: "#DC2626",
}

/* ------------------------------------------------------------------ */
/* Form state type                                                      */
/* ------------------------------------------------------------------ */
interface FormData {
  eventType: string
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  allDay: boolean
  timezone: string
  property: string
  unit: string
  contact: string
  sourceRecord: string
  reminderType: string
  reminderTiming: string
  recurrence: string
  recurrenceEnd: string
  assignee: string
  location: string
  notes: string
  risk: string
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

const defaultForm: FormData = {
  eventType: "",
  title: "",
  startDate: todayStr(),
  startTime: "09:00",
  endDate: todayStr(),
  endTime: "10:00",
  allDay: false,
  timezone: "Europe/London",
  property: "",
  unit: "",
  contact: "",
  sourceRecord: "",
  reminderType: "In-app",
  reminderTiming: "1 hour before",
  recurrence: "None",
  recurrenceEnd: "",
  assignee: "",
  location: "",
  notes: "",
  risk: "Normal",
}

/* ------------------------------------------------------------------ */
/* Step label config                                                    */
/* ------------------------------------------------------------------ */
const STEPS = [
  { num: 1, label: "Event Type",            Icon: Calendar    },
  { num: 2, label: "Date & Time",           Icon: Clock       },
  { num: 3, label: "Link Records",          Icon: Building2   },
  { num: 4, label: "Reminder & Recurrence", Icon: Bell        },
  { num: 5, label: "Assignment & Notes",    Icon: User        },
  { num: 6, label: "Review",               Icon: Eye         },
  { num: 7, label: "Success",              Icon: CheckCircle2 },
]

/* ------------------------------------------------------------------ */
/* Helper: duration string                                             */
/* ------------------------------------------------------------------ */
function calcDuration(startDate: string, startTime: string, endDate: string, endTime: string): string {
  if (!startDate || !startTime || !endDate || !endTime) return "—"
  const start = new Date(`${startDate}T${startTime}`)
  const end = new Date(`${endDate}T${endTime}`)
  const diff = (end.getTime() - start.getTime()) / 60000
  if (diff <= 0) return "—"
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h === 0) return `${m} minutes`
  if (m === 0) return `${h} hour${h > 1 ? "s" : ""}`
  return `${h} hour${h > 1 ? "s" : ""} ${m} minutes`
}

/* ------------------------------------------------------------------ */
/* Input helpers                                                        */
/* ------------------------------------------------------------------ */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-600 mb-1">{children}</label>
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

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
    >
      <option value="">Select…</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

/* ------------------------------------------------------------------ */
/* Step 1 — Event Type                                                  */
/* ------------------------------------------------------------------ */
function Step1({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Choose Event Type</h2>
        <p className="text-sm text-slate-500 mt-0.5">Select the type of calendar event you want to create.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {EVENT_TYPE_OPTIONS.map(opt => {
          const Icon = opt.Icon
          const active = form.eventType === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => setForm({ ...form, eventType: opt.key })}
              className={cn(
                "text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm",
                active ? "border-[#2563EB] bg-[#EFF6FF]" : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: opt.bg }}>
                <div style={{ color: opt.colour }}><Icon className="w-4 h-4" /></div>
              </div>
              <p className={cn("text-sm font-semibold", active ? "text-[#2563EB]" : "text-slate-800")}>{opt.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
            </button>
          )
        })}
      </div>

      <div>
        <FieldLabel>Event Title</FieldLabel>
        <TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. Annual boiler service — 12 Oak St" />
        <p className="text-[11px] text-slate-400 mt-1">A short, clear name for this event.</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 2 — Date & Time                                                 */
/* ------------------------------------------------------------------ */
function Step2({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  const duration = calcDuration(form.startDate, form.startTime, form.endDate, form.endTime)
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Date &amp; Time</h2>
        <p className="text-sm text-slate-500 mt-0.5">Set when this event takes place.</p>
      </div>

      {/* All-day toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
        <div>
          <p className="text-sm font-medium text-slate-800">All-day event</p>
          <p className="text-xs text-slate-500">No specific start/end time</p>
        </div>
        <button
          onClick={() => setForm({ ...form, allDay: !form.allDay })}
          className={cn(
            "w-11 h-6 rounded-full transition-colors relative",
            form.allDay ? "bg-[#2563EB]" : "bg-slate-300"
          )}
        >
          <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", form.allDay ? "translate-x-5" : "translate-x-0.5")} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Start Date</FieldLabel>
          <TextInput type="date" value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} />
        </div>
        {!form.allDay && (
          <div>
            <FieldLabel>Start Time</FieldLabel>
            <TextInput type="time" value={form.startTime} onChange={v => setForm({ ...form, startTime: v })} />
          </div>
        )}
        <div>
          <FieldLabel>End Date</FieldLabel>
          <TextInput type="date" value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} />
        </div>
        {!form.allDay && (
          <div>
            <FieldLabel>End Time</FieldLabel>
            <TextInput type="time" value={form.endTime} onChange={v => setForm({ ...form, endTime: v })} />
          </div>
        )}
      </div>

      <div>
        <FieldLabel>Timezone</FieldLabel>
        <SelectInput value={form.timezone} onChange={v => setForm({ ...form, timezone: v })} options={TIMEZONES} />
      </div>

      {!form.allDay && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
          <Clock className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="text-sm text-[#2563EB] font-medium">Duration: {duration}</span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 3 — Link Records                                                */
/* ------------------------------------------------------------------ */
function Step3({ form, setForm, properties }: { form: FormData; setForm: (f: FormData) => void; properties: string[] }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Link Records</h2>
        <p className="text-sm text-slate-500 mt-0.5">Connect this event to a property (optional).</p>
      </div>

      <div>
        <FieldLabel>Property</FieldLabel>
        <SelectInput
          value={form.property}
          onChange={v => setForm({ ...form, property: v, unit: "" })}
          options={properties.length > 0 ? properties : ["No properties found"]}
        />
      </div>

      {form.property && (
        <div>
          <FieldLabel>Unit (optional)</FieldLabel>
          <SelectInput value={form.unit} onChange={v => setForm({ ...form, unit: v })} options={["Unit 1", "Unit 2", "Unit 3", "Ground Floor", "First Floor"]} />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 4 — Reminder & Recurrence                                       */
/* ------------------------------------------------------------------ */
function Step4({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Reminder &amp; Recurrence</h2>
        <p className="text-sm text-slate-500 mt-0.5">Set how and when to be reminded, and if this repeats.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-[#2563EB]" />
          <p className="text-sm font-semibold text-slate-800">Reminder</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Type</FieldLabel>
            <SelectInput value={form.reminderType} onChange={v => setForm({ ...form, reminderType: v })} options={REMINDER_TYPES} />
          </div>
          <div>
            <FieldLabel>Timing</FieldLabel>
            <SelectInput value={form.reminderTiming} onChange={v => setForm({ ...form, reminderTiming: v })} options={REMINDER_TIMINGS} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Repeat className="w-4 h-4 text-[#2563EB]" />
          <p className="text-sm font-semibold text-slate-800">Recurrence</p>
        </div>
        <div>
          <FieldLabel>Repeat</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-1">
            {RECURRENCE_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setForm({ ...form, recurrence: opt })}
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
        </div>

        {form.recurrence !== "None" && (
          <div>
            <FieldLabel>End Date (or leave blank for no end)</FieldLabel>
            <TextInput type="date" value={form.recurrenceEnd} onChange={v => setForm({ ...form, recurrenceEnd: v })} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 5 — Assignment & Notes                                          */
/* ------------------------------------------------------------------ */
function Step5({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Assignment &amp; Notes</h2>
        <p className="text-sm text-slate-500 mt-0.5">Assign the event and add any extra details.</p>
      </div>

      <div>
        <FieldLabel>Assignee (optional)</FieldLabel>
        <TextInput value={form.assignee} onChange={v => setForm({ ...form, assignee: v })} placeholder="Name or email..." />
      </div>

      <div>
        <FieldLabel>Location (optional)</FieldLabel>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. 14 Westbourne Gardens, London"
            className="w-full h-9 pl-8 pr-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Notes</FieldLabel>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Add any notes or instructions for this event…"
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white resize-none"
        />
      </div>

      <div>
        <FieldLabel>Priority / Risk</FieldLabel>
        <div className="flex flex-wrap gap-2 mt-1">
          {RISK_LEVELS.map(r => (
            <button
              key={r}
              onClick={() => setForm({ ...form, risk: r })}
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
  )
}

/* ------------------------------------------------------------------ */
/* Step 6 — Review                                                      */
/* ------------------------------------------------------------------ */
function Step6({ form, goTo }: { form: FormData; goTo: (s: number) => void }) {
  const eventTypeMeta = EVENT_TYPE_OPTIONS.find(o => o.key === form.eventType)
  const Icon = eventTypeMeta?.Icon ?? Calendar
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Review Event</h2>
        <p className="text-sm text-slate-500 mt-0.5">Check everything looks right before creating.</p>
      </div>

      {/* Event preview card */}
      {eventTypeMeta && (
        <div className="rounded-xl border-l-4 border border-slate-200 bg-white p-5" style={{ borderLeftColor: eventTypeMeta.colour }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: eventTypeMeta.bg }}>
              <div style={{ color: eventTypeMeta.colour }}><Icon className="w-5 h-5" /></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: eventTypeMeta.bg, color: eventTypeMeta.colour }}>{eventTypeMeta.label}</span>
                <Badge variant="primary" size="sm">{form.risk}</Badge>
              </div>
              <p className="text-base font-semibold text-slate-900">{form.title || "Untitled event"}</p>
              <p className="text-xs text-slate-500 mt-1">{form.startDate} {!form.allDay && form.startTime} — {form.endDate} {!form.allDay && form.endTime} · {form.timezone}</p>
              {form.property && <p className="text-xs text-slate-500 mt-0.5">{form.property}{form.unit ? `, ${form.unit}` : ""}</p>}
              {form.contact && <p className="text-xs text-slate-500 mt-0.5">{form.contact}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Summary sections */}
      <div className="space-y-2">
        {[
          { label: "Title", value: form.title || "—", step: 1 },
          { label: "Event Type", value: eventTypeMeta?.label ?? "—", step: 1 },
          { label: "Date / Time", value: form.allDay ? `${form.startDate} (All day)` : `${form.startDate} ${form.startTime} → ${form.endDate} ${form.endTime}`, step: 2 },
          { label: "Property", value: form.property || "—", step: 3 },
          { label: "Contact", value: form.contact || "—", step: 3 },
          { label: "Reminder", value: `${form.reminderType} · ${form.reminderTiming}`, step: 4 },
          { label: "Recurrence", value: form.recurrence, step: 4 },
          { label: "Assignee", value: form.assignee || "—", step: 5 },
          { label: "Risk", value: form.risk, step: 5 },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-xs text-slate-500 w-32 shrink-0">{row.label}</span>
            <span className="text-sm text-slate-800 font-medium flex-1">{row.value}</span>
            <button onClick={() => goTo(row.step)} className="text-xs text-[#2563EB] hover:underline shrink-0">Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 7 — Success                                                     */
/* ------------------------------------------------------------------ */
function Step7({ form, onReset, createdId }: { form: FormData; onReset: () => void; createdId: string | null }) {
  return (
    <div className="flex flex-col items-center text-center py-10 space-y-5">
      <div className="w-20 h-20 rounded-full bg-[#ECFDF5] flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Event Created!</h2>
        <p className="text-sm text-slate-500 mt-1">Your event has been saved and added to your calendar.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 w-full max-w-sm text-left">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Event Summary</p>
        <p className="text-base font-semibold text-slate-900">{form.title || "Untitled event"}</p>
        <p className="text-xs text-slate-500 mt-1">{form.startDate} {!form.allDay && form.startTime}</p>
        {form.property && <p className="text-xs text-slate-500 mt-0.5">{form.property}</p>}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {createdId && (
          <Button variant="primary" asChild>
            <a href={`/app/calendar/events/${createdId}`}>View Event</a>
          </Button>
        )}
        <Button variant="outline" asChild>
          <a href="/app/calendar">Back to Calendar</a>
        </Button>
        <Button variant="ghost" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={onReset}>Create Another</Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Right summary rail                                                   */
/* ------------------------------------------------------------------ */
function SummaryRail({ form, step }: { form: FormData; step: number }) {
  const eventTypeMeta = EVENT_TYPE_OPTIONS.find(o => o.key === form.eventType)
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Event Summary</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Type</span>
            <span className="font-medium text-slate-800">{eventTypeMeta?.label ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span className="font-medium text-slate-800">{form.startDate || "—"}</span>
          </div>
          {!form.allDay && (
            <div className="flex justify-between">
              <span className="text-slate-500">Time</span>
              <span className="font-medium text-slate-800">{form.startTime ? `${form.startTime} → ${form.endTime}` : "—"}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Property</span>
            <span className="font-medium text-slate-800 truncate max-w-[120px]">{form.property || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Contact</span>
            <span className="font-medium text-slate-800 truncate max-w-[120px]">{form.contact || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Assignee</span>
            <span className="font-medium text-slate-800">{form.assignee || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Risk</span>
            <span className="font-semibold" style={{ color: RISK_COLOURS[form.risk] || "#2563EB" }}>{form.risk}</span>
          </div>
        </div>
      </div>

      {step >= 4 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-[#2563EB]" />
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Reminder</p>
          </div>
          <p className="text-xs text-slate-600">{form.reminderType} · {form.reminderTiming}</p>
        </div>
      )}

      {step >= 4 && form.recurrence !== "None" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Repeat className="w-3.5 h-3.5 text-[#7C3AED]" />
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Recurrence</p>
          </div>
          <p className="text-xs text-slate-600">{form.recurrence}{form.recurrenceEnd ? ` · ends ${form.recurrenceEnd}` : " · no end"}</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-[#F5F3FF] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
          <p className="text-xs font-semibold text-[#6D28D9] uppercase tracking-wide">Step {step} of 7</p>
        </div>
        <p className="text-xs text-[#6D28D9]">{STEPS[step - 1]?.label}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function NewEventPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [properties, setProperties] = useState<string[]>([])

  // Property label -> id map so we can persist the real FK.
  const [propertyMap, setPropertyMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient()
    ;(async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, nickname, address_line1, city")
        .eq("workspace_id", workspace.id)
        .order("nickname", { ascending: true })
      if (error || !data) return // 42P01 / RLS tolerant
      const labels: string[] = []
      const map: Record<string, string> = {}
      for (const p of data as Array<{ id: string; nickname: string | null; address_line1: string | null; city: string | null }>) {
        const label = p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || p.id
        labels.push(label)
        map[label] = p.id
      }
      setProperties(labels)
      setPropertyMap(map)
    })()
  }, [workspace?.id])

  function goTo(s: number) { setStep(s) }
  function next() { setStep(s => Math.min(s + 1, 7)) }
  function prev() { setStep(s => Math.max(s - 1, 1)) }
  function reset() { setStep(1); setForm(defaultForm); setCreatedId(null); setSaveError(null) }

  function canProceed() {
    if (step === 1) return !!form.eventType && form.title.trim().length > 0
    if (step === 2) {
      if (!form.startDate || !form.endDate) return false
      // end must be >= start
      const start = new Date(`${form.startDate}T${form.allDay ? "00:00" : form.startTime}`)
      const end = new Date(`${form.endDate}T${form.allDay ? "23:59" : form.endTime}`)
      return end.getTime() >= start.getTime()
    }
    return true
  }

  async function handleCreate() {
    if (!workspace?.id) { setSaveError("Workspace not loaded. Please refresh."); return }
    if (!form.title.trim()) { setSaveError("Please give the event a title."); return }

    const startIso = (form.allDay ? new Date(`${form.startDate}T00:00:00`) : new Date(`${form.startDate}T${form.startTime}:00`))
    const endIso = (form.allDay ? new Date(`${form.endDate}T23:59:59`) : new Date(`${form.endDate}T${form.endTime}:00`))
    if (endIso.getTime() < startIso.getTime()) { setSaveError("End must be the same as or after the start."); return }

    // Map wizard event type → real source_module.
    const sourceModule =
      form.eventType === "task" ? "work" :
      form.eventType === "job" ? "work" :
      form.eventType === "supplier" ? "supplier" :
      form.eventType === "money" ? "money" :
      form.eventType === "followup" ? "contacts" :
      form.eventType === "planning" ? "planning" :
      form.eventType === "compliance" ? "compliance" :
      "manual"
    const riskLevel = (form.risk || "Normal").toLowerCase() === "low" ? "normal" : (form.risk || "Normal").toLowerCase()

    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          workspace_id: workspace.id,
          title: form.title.trim(),
          description: form.notes || null,
          start_at: startIso.toISOString(),
          end_at: endIso.toISOString(),
          event_type: form.eventType || "manual",
          source_module: sourceModule,
          all_day: form.allDay,
          timezone: form.timezone || "Europe/London",
          status: "scheduled",
          risk_level: ["normal", "important", "urgent", "critical"].includes(riskLevel) ? riskLevel : "normal",
          recurrence_rule: form.recurrence !== "None" ? form.recurrence : null,
          property_id: form.property ? (propertyMap[form.property] ?? null) : null,
          location: form.location || null,
        })
        .select("id")
        .single()

      if (error) {
        if ((error as { code?: string }).code === "42P01") {
          setSaveError("Calendar events table not set up yet. Please run the database migration.")
        } else {
          setSaveError(error.message)
        }
        setSaving(false)
        return
      }
      setCreatedId((data as { id: string }).id)
      setStep(7)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Unexpected error saving event")
    } finally {
      setSaving(false)
    }
  }

  const progress = ((step - 1) / 6) * 100

  return (
    <div className="space-y-0">
      <CalendarTabNav />

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div className="h-1 bg-[#2563EB] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex gap-0 min-h-screen">
        {/* Left stepper */}
        <div className="w-[220px] shrink-0 border-r border-slate-200 bg-white pt-6 px-4 space-y-1">
          {STEPS.map(s => {
            const Icon = s.Icon
            const done = step > s.num
            const active = step === s.num
            return (
              <button
                key={s.num}
                onClick={() => s.num < step ? goTo(s.num) : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm",
                  active ? "bg-[#EFF6FF] text-[#2563EB] font-semibold" :
                  done ? "text-slate-600 hover:bg-slate-100 cursor-pointer" :
                  "text-slate-400 cursor-default"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  active ? "bg-[#2563EB] text-white" :
                  done ? "bg-[#10B981] text-white" :
                  "bg-slate-200 text-slate-400"
                )}>
                  {done ? <Check className="w-3 h-3" /> : s.num}
                </div>
                <div className="min-w-0">
                  <div className={cn("text-xs font-medium truncate", active ? "text-[#2563EB]" : done ? "text-slate-700" : "text-slate-400")}>{s.label}</div>
                </div>
                {active && <Icon className="w-3.5 h-3.5 ml-auto shrink-0 text-[#2563EB]" />}
              </button>
            )
          })}
        </div>

        {/* Center card */}
        <div className="flex-1 min-w-0 py-6 px-8">
          <div className="max-w-[640px] mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[500px]">
              {step === 1 && <Step1 form={form} setForm={setForm} />}
              {step === 2 && <Step2 form={form} setForm={setForm} />}
              {step === 3 && <Step3 form={form} setForm={setForm} properties={properties} />}
              {step === 4 && <Step4 form={form} setForm={setForm} />}
              {step === 5 && <Step5 form={form} setForm={setForm} />}
              {step === 6 && <Step6 form={form} goTo={goTo} />}
              {step === 7 && <Step7 form={form} onReset={reset} createdId={createdId} />}

              {/* Save error */}
              {saveError && step === 6 && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {saveError}
                </div>
              )}

              {/* Nav buttons */}
              {step < 7 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    onClick={prev}
                    disabled={step === 1}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={step < 6 ? <ChevronRight className="w-4 h-4" /> : undefined}
                    onClick={step === 6 ? handleCreate : next}
                    disabled={!canProceed() || saving}
                  >
                    {saving ? "Saving..." : step === 6 ? "Create Event" : "Next"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right summary rail */}
        {step < 7 && (
          <div className="w-[260px] shrink-0 border-l border-slate-200 bg-slate-50 pt-6 px-4">
            <SummaryRail form={form} step={step} />
          </div>
        )}
      </div>
    </div>
  )
}
