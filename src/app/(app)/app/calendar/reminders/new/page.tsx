"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSectionLink } from "@/components/sections/SectionBasePath"
import {
  Bell,
  ChevronLeft,
  Check,
  CheckCircle2,
  Clock,
  CalendarDays,
  AlertCircle,
} from "lucide-react"
import { CalendarTabNav } from "@/components/calendar/CalendarTabNav"
import { MobileTopBar } from "@/components/mobile"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

const CHANNELS = [
  { value: "in_app", label: "In-app" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
]

function nowLocalInput(): string {
  const d = new Date(Date.now() + 60 * 60_000) // default: 1 hour from now
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface EventOption { id: string; title: string; start_at: string }

export default function NewReminderPage() {
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()

  const [title, setTitle] = useState("")
  const [channel, setChannel] = useState("in_app")
  const [dueLocal, setDueLocal] = useState(nowLocalInput())
  const [eventId, setEventId] = useState("")
  const [events, setEvents] = useState<EventOption[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableMissing, setTableMissing] = useState(false)
  const [done, setDone] = useState(false)

  // Load native events to optionally attach the reminder to.
  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient()
    ;(async () => {
      const { data, error: e } = await supabase
        .from("calendar_events")
        .select("id, title, start_at")
        .eq("workspace_id", workspace.id)
        .order("start_at", { ascending: true })
        .limit(100)
      if (!e && data) setEvents(data as EventOption[])
    })()
  }, [workspace?.id])

  function validate(): string | null {
    if (!title.trim()) return "Please enter a reminder title."
    if (!dueLocal) return "Please choose when the reminder is due."
    if (new Date(dueLocal).getTime() <= Date.now()) return "The reminder time must be in the future."
    return null
  }

  async function handleCreate() {
    if (!workspace?.id) { setError("Workspace not loaded. Please refresh."); return }
    const v = validate()
    if (v) { setError(v); return }
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: userRes } = await supabase.auth.getUser()
      const { error: e } = await supabase
        .from("calendar_reminders")
        .insert({
          workspace_id: workspace.id,
          created_by: userRes?.user?.id ?? null,
          event_id: eventId || null,
          title: title.trim(),
          reminder_type: "standard",
          channel,
          due_at: new Date(dueLocal).toISOString(),
          status: "pending",
        })
        .select("id")
        .single()

      if (e) {
        if ((e as { code?: string }).code === "42P01") {
          setTableMissing(true)
        } else {
          setError(e.message)
        }
        setSaving(false)
        return
      }
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error saving reminder")
    } finally {
      setSaving(false)
    }
  }

  if (tableMissing) {
    return (
      <div className="space-y-0">
        <CalendarTabNav />
        <div className="px-6 py-16 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Reminders not available yet</h2>
          <p className="text-sm text-slate-500 mt-1">The reminders table isn&apos;t provisioned in this workspace, so reminders can&apos;t be saved right now.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="outline" asChild><Link href={sectionLink("/property-manager/calendar/reminders")}>Back to Reminders</Link></Button>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-0">
        <CalendarTabNav />
        <div className="flex flex-col items-center text-center py-16 space-y-5 max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-full bg-[#ECFDF5] flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Reminder Created!</h2>
            <p className="text-sm text-slate-500 mt-1">Your reminder has been saved.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 w-full text-left">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Summary</p>
            <p className="text-base font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500 mt-1">{new Date(dueLocal).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {CHANNELS.find((c) => c.value === channel)?.label}</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="primary" asChild><Link href={sectionLink("/property-manager/calendar/reminders")}>View Reminders</Link></Button>
            <Button variant="ghost" onClick={() => { setDone(false); setTitle(""); setDueLocal(nowLocalInput()); setEventId("") }}>Create Another</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <MobileTopBar title="New Reminder" subtitle="Scheduled alert" showBack backHref={sectionLink("/property-manager/calendar/reminders")} />
      <div className="hidden md:block">
        <CalendarTabNav />
      </div>

      <div className="hidden md:block px-6 pt-5 pb-0">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href={sectionLink("/property-manager/calendar/reminders")} className="hover:text-[#2563EB]">Reminders</Link>
          <ChevronLeft className="w-3 h-3 rotate-180" />
          <span className="text-slate-900 font-medium">New Reminder</span>
        </nav>
      </div>

      <div className="px-4 md:px-6 py-5 max-w-xl mx-auto w-full">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">New Reminder</h1>
              <p className="text-sm text-slate-500">Get alerted before an important date.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chase gas certificate renewal"
              className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Due</label>
              <input
                type="datetime-local"
                value={dueLocal}
                onChange={(e) => setDueLocal(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
              >
                {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Link to event (optional)</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            >
              <option value="">No linked event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title} — {new Date(ev.start_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</option>
              ))}
            </select>
            {events.length === 0 && (
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> No calendar events yet — you can still create a standalone reminder.</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} asChild>
              <Link href={sectionLink("/property-manager/calendar/reminders")}>Cancel</Link>
            </Button>
            <Button variant="primary" size="sm" leftIcon={saving ? undefined : <Check className="w-4 h-4" />} onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Create Reminder"}
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500">Reminders are stored against your workspace and surface in the Reminders list. Delivery scheduling depends on your notification settings.</p>
        </div>
      </div>
    </div>
  )
}
