"use client"
import React, { useState } from "react"
import {
  Plus,
  Calendar,
  List,
  X,
  Clock,
  MapPin,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

/* ─── Types ───────────────────────────────────────────────────── */
interface Viewing {
  id: string
  dayIndex: number       // 0=Mon … 6=Sat
  startRow: number       // 0-based half-hour slot (0 = 09:00)
  duration: number       // in slots
  prospect: string
  property: string
  color: string
  status: "Scheduled" | "Completed" | "Cancelled"
  agent: string
  feedback: string
}

interface ScheduleForm {
  prospect: string
  vacancy: string
  date: string
  time: string
  duration: string
  agent: string
  notes: string
}

/* ─── Mock data ───────────────────────────────────────────────── */
// Grid: rows = 30-min slots from 09:00 to 18:00 => 18 rows (0-17)
// dayIndex: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
const VIEWINGS: Viewing[] = []

const TIME_SLOTS: string[] = Array.from({ length: 18 }, (_, i) => {
  const hour = 9 + Math.floor(i / 2)
  const mins = i % 2 === 0 ? "00" : "30"
  return `${String(hour).padStart(2, "0")}:${mins}`
})

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_DATES  = ["9 Jun", "10 Jun", "11 Jun", "12 Jun", "13 Jun", "14 Jun", "15 Jun"]

const LIST_COLUMNS = ["Date/Time", "Property", "Prospect", "Duration", "Status", "Conducted By", "Feedback", "Actions"]

interface ViewingListRow {
  id: string
  datetime: string
  property: string
  prospect: string
  duration: string
  status: string
  agent: string
  feedback: string
}
const VIEWING_LIST: ViewingListRow[] = []

const TIME_OPTIONS = TIME_SLOTS.filter((_, i) => i < 18)
const PROSPECT_OPTIONS: string[] = []
const VACANCY_OPTIONS: string[]  = []
const AGENT_OPTIONS: string[]    = []

const DEFAULT_FORM: ScheduleForm = { prospect: "", vacancy: "", date: "", time: "09:00", duration: "30", agent: "", notes: "" }

/* ─── Page ────────────────────────────────────────────────────── */
export default function ViewingsPage() {
  const [calView, setCalView] = useState<"calendar" | "list">("calendar")
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ScheduleForm>(DEFAULT_FORM)

  function handleFieldChange(field: keyof ScheduleForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowModal(false)
    setForm(DEFAULT_FORM)
  }

  /* Row → card mapping for the mobile list view. */
  const viewingCardMapping: MobileCardMapping<(typeof VIEWING_LIST)[number]> = {
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
      { label: "Conducted by", render: (v) => v.agent },
      { label: "Feedback", render: (v) => v.feedback },
    ],
  }

  return (
    <>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Viewings"
        subtitle={`Week of 9 – 15 Jun · ${VIEWINGS.length} viewings`}
        showBack
        backHref="/property-manager/portfolio/leasing"
        primaryAction={{ label: "Schedule viewing", icon: Plus, onClick: () => setShowModal(true) }}
        overflowActions={[
          { label: calView === "calendar" ? "List view" : "Calendar view", icon: calView === "calendar" ? List : Calendar, onClick: () => setCalView(calView === "calendar" ? "list" : "calendar") },
        ]}
      />

      {/* Page header — hidden on phones */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Viewings</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Week of 9 – 15 Jun 2026 · {VIEWINGS.length} viewings</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setCalView("calendar")}
              className={cn("px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors", calView === "calendar" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50")}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              onClick={() => setCalView("list")}
              className={cn("px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors", calView === "list" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50")}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule Viewing
          </button>
        </div>
      </div>

      <div className="py-6 px-4 md:px-0">
        {calView === "calendar" ? (
          /* ── Calendar grid — horizontal scroll on phones ── */
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <div className="min-w-[640px] md:min-w-0">
            {/* Day headers */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
              <div className="px-2 py-3 border-r border-slate-100" />
              {DAY_LABELS.map((day, i) => (
                <div key={day} className="px-3 py-3 border-r border-slate-100 last:border-r-0 text-center">
                  <p className="text-[11px] font-semibold text-slate-800">{day}</p>
                  <p className="text-[10px] text-slate-500">{DAY_DATES[i]}</p>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="overflow-y-auto max-h-[520px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="relative" style={{ display: "grid", gridTemplateColumns: "64px repeat(7, 1fr)" }}>
                {/* Time labels column */}
                {TIME_SLOTS.map((slot, rowIdx) => (
                  <React.Fragment key={slot}>
                    {/* Time label */}
                    <div
                      className="border-r border-slate-100 border-b border-slate-50 px-2 flex items-start justify-end pr-3"
                      style={{ gridColumn: 1, gridRow: rowIdx + 1, height: 40 }}
                    >
                      {rowIdx % 2 === 0 && (
                        <span className="text-[10px] text-slate-500 pt-1">{slot}</span>
                      )}
                    </div>
                    {/* Day cells */}
                    {DAY_LABELS.map((_, dayIdx) => (
                      <div
                        key={dayIdx}
                        className="border-r border-slate-50 border-b border-slate-50 last:border-r-0 relative"
                        style={{ gridColumn: dayIdx + 2, gridRow: rowIdx + 1, height: 40 }}
                      />
                    ))}
                  </React.Fragment>
                ))}

                {/* Viewing blocks — absolutely positioned per column */}
                {VIEWINGS.map((v) => (
                  <div
                    key={v.id}
                    className={cn(
                      "rounded border text-[10px] font-medium px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-95 transition-all mx-0.5",
                      v.color,
                    )}
                    style={{
                      gridColumn: v.dayIndex + 2,
                      gridRow: `${v.startRow + 1} / span ${v.duration}`,
                      height: v.duration * 40 - 4,
                      alignSelf: "start",
                      marginTop: 2,
                    }}
                  >
                    <p className="font-semibold truncate leading-tight">{v.prospect}</p>
                    <p className="text-[9px] truncate opacity-75 leading-tight">{v.property}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        ) : (
          /* ── List view ── */
          <ResponsiveTable rows={VIEWING_LIST} mobile={viewingCardMapping}>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {LIST_COLUMNS.map((col) => (
                    <th key={col} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {VIEWING_LIST.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[12px] text-slate-400">
                      No viewings scheduled yet. Use &ldquo;Schedule Viewing&rdquo; to add your first appointment.
                    </td>
                  </tr>
                )}
                {VIEWING_LIST.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-[12px] font-medium text-slate-800 whitespace-nowrap">{v.datetime}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{v.property}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">
                      <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" />{v.prospect}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{v.duration}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-medium">{v.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{v.agent}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">{v.feedback}</td>
                    <td className="px-4 py-3">
                      <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          </ResponsiveTable>
        )}
      </div>

      {/* Schedule Viewing Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-slate-900">Schedule Viewing</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Prospect */}
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">Prospect</label>
                <select
                  value={form.prospect}
                  onChange={(e) => handleFieldChange("prospect", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select prospect…</option>
                  {PROSPECT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Vacancy */}
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">Vacancy</label>
                <select
                  value={form.vacancy}
                  onChange={(e) => handleFieldChange("vacancy", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select vacancy…</option>
                  {VACANCY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">Time</label>
                  <select
                    value={form.time}
                    onChange={(e) => handleFieldChange("time", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Duration + Agent */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">Duration</label>
                  <select
                    value={form.duration}
                    onChange={(e) => handleFieldChange("duration", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">Agent Conducting</label>
                  <select
                    value={form.agent}
                    onChange={(e) => handleFieldChange("agent", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select agent…</option>
                    {AGENT_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  rows={2}
                  placeholder="Access instructions, key code, etc."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button type="submit" className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                  Schedule Viewing
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

