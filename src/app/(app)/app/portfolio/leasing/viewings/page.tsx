"use client"
import React, { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Calendar,
  List,
  X,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"
import { createClient } from "@/lib/supabase/client"

/* ─── Types ───────────────────────────────────────────────────── */
interface GridViewing {
  id: string
  dayIndex: number
  startRow: number
  duration: number
  prospect: string
  property: string
  color: string
  status: "Scheduled" | "Completed" | "Cancelled" | "No Show"
  agent: string
  feedback: string
}

interface ListViewing {
  id: string
  datetime: string
  property: string
  prospect: string
  duration: string
  status: string
  agent: string
  feedback: string
}

interface ScheduleForm {
  prospect_id: string
  vacancy_id: string
  date: string
  time: string
  duration: string
  notes: string
}

interface ProspectOption { id: string; name: string }
interface VacancyOption  { id: string; address: string }

/* ─── Helpers ─────────────────────────────────────────────────── */
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const hour = 9 + Math.floor(i / 2)
  const mins = i % 2 === 0 ? "00" : "30"
  return `${String(hour).padStart(2, "0")}:${mins}`
})
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function getWeekStart(offset = 0): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diff + offset * 7)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function weekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

function formatWeekRange(dates: Date[]): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  return `${fmt(dates[0])} – ${fmt(dates[6])}`
}

function statusColor(s: string) {
  if (s === "completed") return "bg-emerald-100 border-emerald-300 text-emerald-800"
  if (s === "cancelled" || s === "no_show") return "bg-red-100 border-red-300 text-red-800"
  return "bg-blue-100 border-blue-300 text-blue-800"
}

function statusLabel(s: string): "Scheduled" | "Completed" | "Cancelled" | "No Show" {
  if (s === "completed") return "Completed"
  if (s === "cancelled") return "Cancelled"
  if (s === "no_show") return "No Show"
  return "Scheduled"
}

const DEFAULT_FORM: ScheduleForm = { prospect_id: "", vacancy_id: "", date: "", time: "09:00", duration: "30", notes: "" }

/* ─── Page ────────────────────────────────────────────────────── */
export default function ViewingsPage() {
  const [calView, setCalView]       = useState<"calendar" | "list">("calendar")
  const [weekOffset, setWeekOffset] = useState(0)
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState<ScheduleForm>(DEFAULT_FORM)
  const [saving, setSaving]         = useState(false)

  const [gridViewings, setGridViewings] = useState<GridViewing[]>([])
  const [listViewings, setListViewings] = useState<ListViewing[]>([])
  const [prospects, setProspects]       = useState<ProspectOption[]>([])
  const [vacancies, setVacancies]       = useState<VacancyOption[]>([])
  const [loading, setLoading]           = useState(true)

  const weekStart = getWeekStart(weekOffset)
  const dates     = weekDates(weekStart)

  const loadViewings = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const weekEnd = new Date(dates[6])
    weekEnd.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from("viewings")
      .select(`
        id, scheduled_at, duration_minutes, status, feedback,
        prospects ( id, first_name, last_name ),
        property_vacancies ( id, unit_ref, address )
      `)
      .gte("scheduled_at", weekStart.toISOString())
      .lte("scheduled_at", weekEnd.toISOString())
      .order("scheduled_at")

    const rows = data ?? []

    const grid: GridViewing[] = []
    const list: ListViewing[] = []

    for (const v of rows) {
      const at = new Date(v.scheduled_at)
      const dayIdx = dates.findIndex(d =>
        d.getFullYear() === at.getFullYear() &&
        d.getMonth()    === at.getMonth()    &&
        d.getDate()     === at.getDate()
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = v.prospects as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const va = v.property_vacancies as any
      const prospectName = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : "Unknown"
      const address = va?.address ?? va?.unit_ref ?? ""

      if (dayIdx !== -1) {
        const hour = at.getHours()
        const mins = at.getMinutes()
        const startRow = Math.max(0, (hour - 9) * 2 + (mins >= 30 ? 1 : 0))
        const durationSlots = Math.max(1, Math.ceil(v.duration_minutes / 30))
        grid.push({
          id: v.id,
          dayIndex: dayIdx,
          startRow,
          duration: durationSlots,
          prospect: prospectName,
          property: address,
          color: statusColor(v.status),
          status: statusLabel(v.status),
          agent: "",
          feedback: v.feedback ?? "",
        })
      }

      list.push({
        id: v.id,
        datetime: at.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        property: address,
        prospect: prospectName,
        duration: `${v.duration_minutes} min`,
        status: statusLabel(v.status),
        agent: "",
        feedback: v.feedback ?? "",
      })
    }

    setGridViewings(grid)
    setListViewings(list)
    setLoading(false)
  }, [weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadViewings() }, [loadViewings])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: ps }, { data: vs }] = await Promise.all([
        supabase.from("prospects").select("id, first_name, last_name").eq("status", "active").order("last_name"),
        supabase.from("property_vacancies").select("id, unit_ref, address").eq("status", "available").order("created_at"),
      ])
      setProspects((ps ?? []).map(p => ({ id: p.id, name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() })))
      setVacancies((vs ?? []).map(v => ({ id: v.id, address: v.address ?? v.unit_ref ?? v.id })))
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.prospect_id || !form.date || !form.time) return
    setSaving(true)
    const supabase = createClient()
    const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString()
    await supabase.from("viewings").insert({
      prospect_id: form.prospect_id,
      vacancy_id: form.vacancy_id || null,
      scheduled_at,
      duration_minutes: parseInt(form.duration, 10),
      status: "scheduled",
      feedback: form.notes || null,
    })
    setSaving(false)
    setShowModal(false)
    setForm(DEFAULT_FORM)
    loadViewings()
  }

  const viewingCardMapping: MobileCardMapping<ListViewing> = {
    getKey: (v) => v.id,
    title: (v) => v.property,
    subtitle: (v) => v.datetime,
    badge: (v) => (
      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap">
        {v.status}
      </span>
    ),
    fields: [
      { label: "Prospect", render: (v) => v.prospect },
      { label: "Duration", render: (v) => v.duration },
      { label: "Feedback",  render: (v) => v.feedback },
    ],
  }

  return (
    <>
      <MobileTopBar
        title="Viewings"
        subtitle={`${formatWeekRange(dates)} · ${gridViewings.length} viewings`}
        showBack
        backHref="/property-manager/portfolio/leasing"
        primaryAction={{ label: "Schedule viewing", icon: Plus, onClick: () => setShowModal(true) }}
        overflowActions={[
          { label: calView === "calendar" ? "List view" : "Calendar view", icon: calView === "calendar" ? List : Calendar, onClick: () => setCalView(calView === "calendar" ? "list" : "calendar") },
        ]}
      />

      <div className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Viewings</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{formatWeekRange(dates)} · {loading ? "Loading…" : `${gridViewings.length} viewings`}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Week navigation */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setWeekOffset(w => w - 1)} className="px-2 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors border-x border-slate-200">
              Today
            </button>
            <button onClick={() => setWeekOffset(w => w + 1)} className="px-2 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setCalView("calendar")} className={cn("px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors", calView === "calendar" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50")}>
              <Calendar className="w-3.5 h-3.5" /> Calendar
            </button>
            <button onClick={() => setCalView("list")} className={cn("px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors", calView === "list" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50")}>
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Schedule Viewing
          </button>
        </div>
      </div>

      <div className="py-6 px-4 md:px-0">
        {calView === "calendar" ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
            <div className="min-w-[640px] md:min-w-0">
              <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
                <div className="px-2 py-3 border-r border-slate-100" />
                {DAY_SHORT.map((day, i) => (
                  <div key={day} className="px-3 py-3 border-r border-slate-100 last:border-r-0 text-center">
                    <p className="text-[11px] font-semibold text-slate-800">{day}</p>
                    <p className="text-[10px] text-slate-500">{dates[i].toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-y-auto max-h-[520px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="relative" style={{ display: "grid", gridTemplateColumns: "64px repeat(7, 1fr)" }}>
                  {TIME_SLOTS.map((slot, rowIdx) => (
                    <React.Fragment key={slot}>
                      <div className="border-r border-slate-100 border-b border-slate-50 px-2 flex items-start justify-end pr-3" style={{ gridColumn: 1, gridRow: rowIdx + 1, height: 40 }}>
                        {rowIdx % 2 === 0 && <span className="text-[10px] text-slate-500 pt-1">{slot}</span>}
                      </div>
                      {DAY_SHORT.map((_, dayIdx) => (
                        <div key={dayIdx} className="border-r border-slate-50 border-b border-slate-50 last:border-r-0 relative" style={{ gridColumn: dayIdx + 2, gridRow: rowIdx + 1, height: 40 }} />
                      ))}
                    </React.Fragment>
                  ))}
                  {gridViewings.map((v) => (
                    <div
                      key={v.id}
                      className={cn("rounded border text-[10px] font-medium px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-95 transition-all mx-0.5", v.color)}
                      style={{ gridColumn: v.dayIndex + 2, gridRow: `${v.startRow + 1} / span ${v.duration}`, height: v.duration * 40 - 4, alignSelf: "start", marginTop: 2 }}
                    >
                      <p className="font-semibold truncate leading-tight">{v.prospect}</p>
                      <p className="text-[9px] truncate opacity-75 leading-tight">{v.property}</p>
                    </div>
                  ))}
                  {!loading && gridViewings.length === 0 && (
                    <div style={{ gridColumn: "2 / span 7", gridRow: "1 / span 4" }} className="flex items-center justify-center py-8 text-[12px] text-slate-400">
                      No viewings this week — schedule one with the button above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ResponsiveTable rows={listViewings} mobile={viewingCardMapping}>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Date/Time", "Property", "Prospect", "Duration", "Status", "Feedback"].map((col) => (
                        <th key={col} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {listViewings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-[12px] text-slate-400">
                          No viewings scheduled yet. Use &ldquo;Schedule Viewing&rdquo; to add your first appointment.
                        </td>
                      </tr>
                    )}
                    {listViewings.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-[12px] font-medium text-slate-800 whitespace-nowrap">{v.datetime}</td>
                        <td className="px-4 py-3 text-[12px] text-slate-600"><span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{v.property || "—"}</span></td>
                        <td className="px-4 py-3 text-[12px] text-slate-600"><span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" />{v.prospect}</span></td>
                        <td className="px-4 py-3 text-[12px] text-slate-600"><span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{v.duration}</span></td>
                        <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-medium">{v.status}</span></td>
                        <td className="px-4 py-3 text-[12px] text-slate-500">{v.feedback || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ResponsiveTable>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-slate-900">Schedule Viewing</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">Prospect</label>
                <select value={form.prospect_id} onChange={e => setForm(f => ({ ...f, prospect_id: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
                  <option value="">Select prospect…</option>
                  {prospects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">Vacancy (optional)</label>
                <select value={form.vacancy_id} onChange={e => setForm(f => ({ ...f, vacancy_id: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">No specific vacancy</option>
                  {vacancies.map(v => <option key={v.id} value={v.id}>{v.address}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">Time</label>
                  <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">Duration</label>
                <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Access instructions, key code, etc." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-400" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                  {saving ? "Saving…" : "Schedule Viewing"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
