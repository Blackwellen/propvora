"use client"

import React, { useState } from "react"
import {
  Save,
  Link,
  RefreshCcw,
  Unlink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"

export const dynamic = "force-dynamic"

/* ------------------------------------------------------------------ */
/* Reusable primitives                                                   */
/* ------------------------------------------------------------------ */
function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30",
        checked ? "bg-[#2563EB]" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
  children,
}: {
  label: string
  sub?: string
  checked: boolean
  onChange: (v: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {children}
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </div>
  )
}

type WeekStart = "Monday" | "Sunday" | "Saturday"
type DefaultView = "Month" | "Week" | "Day" | "Agenda" | "Gantt"
type FrequencyOption = "Immediately" | "Hourly" | "Daily Digest"

type LayerKey =
  | "work"
  | "money"
  | "portfolio"
  | "compliance"
  | "planning"
  | "contacts"
  | "external"

interface LayerConfig {
  label: string
  colour: string
}

const LAYERS: Record<LayerKey, LayerConfig> = {
  work: { label: "Work Tasks", colour: "#2563EB" },
  money: { label: "Money & Finance", colour: "#10B981" },
  portfolio: { label: "Portfolio Events", colour: "#7C3AED" },
  compliance: { label: "Compliance Deadlines", colour: "#F97316" },
  planning: { label: "Planning", colour: "#4F46E5" },
  contacts: { label: "Contacts & Tenancy", colour: "#EC4899" },
  external: { label: "External Calendar", colour: "#94A3B8" },
}

const DEFAULT_VIEW_OPTIONS: DefaultView[] = ["Month", "Week", "Day", "Agenda", "Gantt"]
const WEEK_START_OPTIONS: WeekStart[] = ["Monday", "Sunday", "Saturday"]
const FREQUENCY_OPTIONS: FrequencyOption[] = ["Immediately", "Hourly", "Daily Digest"]

const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
type WorkDay = (typeof WORKING_DAYS)[number]

type ConnectedStatus = "Connected" | "Not connected"

interface SyncRow {
  id: string
  name: string
  status: ConnectedStatus
  lastSync: string
}

const SYNC_CONNECTIONS: SyncRow[] = [
  { id: "gc", name: "Google Calendar", status: "Connected", lastSync: "2 min ago" },
  { id: "ol", name: "Outlook / Office 365", status: "Not connected", lastSync: "—" },
  { id: "ac", name: "Apple Calendar (iCal)", status: "Not connected", lastSync: "—" },
]

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */
export default function CalendarNotificationsSettingsPage() {
  /* --- Default View --- */
  const [defaultView, setDefaultView] = useState<DefaultView>("Week")
  const [weekStart, setWeekStart] = useState<WeekStart>("Monday")

  /* --- Calendar Layers --- */
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    work: true,
    money: true,
    portfolio: true,
    compliance: true,
    planning: true,
    contacts: true,
    external: false,
  })

  function toggleLayer(key: LayerKey) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  /* --- Notification Channels --- */
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [emailFrequency, setEmailFrequency] = useState<FrequencyOption>("Immediately")
  const [pushEnabled, setPushEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [slackEnabled, setSlackEnabled] = useState(false)

  /* --- Working Hours --- */
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("18:00")
  const [showOutsideHours, setShowOutsideHours] = useState(false)
  const [workingDays, setWorkingDays] = useState<Set<WorkDay>>(
    new Set(["Mon", "Tue", "Wed", "Thu", "Fri"])
  )

  function toggleWorkDay(day: WorkDay) {
    setWorkingDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  /* --- AI Recommendations --- */
  const [aiScheduling, setAiScheduling] = useState(true)
  const [aiOptimalTimes, setAiOptimalTimes] = useState(true)
  const [aiConflicts, setAiConflicts] = useState(true)
  const [aiRiskFlagging, setAiRiskFlagging] = useState(true)
  const [aiConfidence, setAiConfidence] = useState(75)

  /* --- Sync --- */
  const [syncConns] = useState<SyncRow[]>(SYNC_CONNECTIONS)

  return (
    <DashboardContainer>
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">Calendar &amp; Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure your calendar preferences, notification channels, and AI recommendations
          </p>
        </div>

        {/* 1. Default View */}
        <SectionCard title="Default View">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-2">
                Default calendar view
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {DEFAULT_VIEW_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDefaultView(opt)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                      defaultView === opt
                        ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label
                htmlFor="week-start"
                className="text-sm font-medium text-slate-700 min-w-[120px]"
              >
                Start of week
              </label>
              <select
                id="week-start"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value as WeekStart)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                {WEEK_START_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* 2. Calendar Layers */}
        <SectionCard title="Calendar Layers">
          <div className="space-y-0">
            {(Object.entries(LAYERS) as [LayerKey, LayerConfig][]).map(([key, cfg]) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.colour }}
                  />
                  <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                </div>
                <Toggle
                  checked={layers[key]}
                  onChange={() => toggleLayer(key)}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 3. Notification Channels */}
        <SectionCard title="Notification Channels">
          <div className="space-y-0">
            <ToggleRow
              label="Email notifications"
              sub="Receive event alerts via email"
              checked={emailEnabled}
              onChange={setEmailEnabled}
            >
              {emailEnabled && (
                <select
                  value={emailFrequency}
                  onChange={(e) => setEmailFrequency(e.target.value as FrequencyOption)}
                  className="border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </ToggleRow>

            <ToggleRow
              label="Push notifications"
              sub="Browser and mobile push alerts"
              checked={pushEnabled}
              onChange={setPushEnabled}
            />

            <ToggleRow
              label="SMS alerts"
              sub="Text message alerts for critical events"
              checked={smsEnabled}
              onChange={setSmsEnabled}
            >
              {!smsEnabled && (
                <button
                  type="button"
                  className="text-xs text-[#2563EB] hover:underline font-medium"
                >
                  Configure
                </button>
              )}
            </ToggleRow>

            <ToggleRow
              label="Slack integration"
              sub="Post reminders to your Slack workspace"
              checked={slackEnabled}
              onChange={setSlackEnabled}
            >
              {!slackEnabled && (
                <button
                  type="button"
                  className="text-xs font-medium px-2.5 py-1 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Connect Slack
                </button>
              )}
            </ToggleRow>
          </div>
        </SectionCard>

        {/* 4. Working Hours */}
        <SectionCard title="Working Hours">
          <div className="space-y-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700 min-w-[70px]">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700 min-w-[70px]">
                  End time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
              <div
                className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                  showOutsideHours
                    ? "border-[#2563EB] bg-[#2563EB]"
                    : "border-slate-300 bg-white"
                )}
                onClick={() => setShowOutsideHours((v) => !v)}
              >
                {showOutsideHours && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path
                      d="M1.5 5l2.5 2.5 4.5-4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-700">
                Show events outside working hours
              </span>
            </label>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Working days</p>
              <div className="flex items-center gap-2">
                {WORKING_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkDay(day)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-xs font-medium transition-all border",
                      workingDays.has(day)
                        ? "bg-[#2563EB] text-white border-[#2563EB]"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 5. AI Recommendations */}
        <SectionCard title="AI Recommendations">
          <div className="space-y-0">
            <ToggleRow
              label="Enable AI scheduling suggestions"
              sub="Let AI propose optimal times for new events"
              checked={aiScheduling}
              onChange={setAiScheduling}
            />
            <ToggleRow
              label="Suggest optimal meeting times"
              sub="AI analyses your calendar patterns to recommend slots"
              checked={aiOptimalTimes}
              onChange={setAiOptimalTimes}
            />
            <ToggleRow
              label="Auto-detect conflicts"
              sub="Automatically flag overlapping or clashing events"
              checked={aiConflicts}
              onChange={setAiConflicts}
            />
            <ToggleRow
              label="Risk flagging"
              sub="Highlight overdue compliance tasks and high-priority events"
              checked={aiRiskFlagging}
              onChange={setAiRiskFlagging}
            />
          </div>

          {/* Confidence slider */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                AI confidence threshold
              </label>
              <span className="text-sm font-semibold text-[#2563EB]">{aiConfidence}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={aiConfidence}
              onChange={(e) => setAiConfidence(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-slate-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2563EB] [&::-webkit-slider-thumb]:cursor-pointer accent-[#2563EB]"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-400">0%</span>
              <span className="text-xs text-slate-400">100%</span>
            </div>
          </div>
        </SectionCard>

        {/* 6. Sync Connections */}
        <SectionCard title="Sync Connections">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Calendar", "Status", "Last Synced", "Action"].map((col, i) => (
                    <th
                      key={col}
                      className={cn(
                        "px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide",
                        i === 3 ? "text-right" : "text-left"
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncConns.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                          row.status === "Connected"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            row.status === "Connected"
                              ? "bg-green-500"
                              : "bg-slate-300"
                          )}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{row.lastSync}</td>
                    <td className="px-4 py-3 text-right">
                      {row.status === "Connected" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                          >
                            <RefreshCcw className="w-3 h-3" />
                            Sync
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Unlink className="w-3 h-3" />
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                        >
                          <Link className="w-3 h-3" />
                          Connect
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Save */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardContainer>
  )
}
