"use client"

import { useState } from "react"
import { Copy, Check, CalendarDays, Bell, Globe } from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { CalendarTabNav } from "@/components/calendar/CalendarTabNav"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"

export default function CalendarSettingsPage() {
  const { workspace } = useWorkspace()
  const [copied, setCopied] = useState(false)
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    inAppAlerts: true,
    overdueWarnings: true,
    dailyDigest: false,
  })

  const icalUrl = workspace?.id
    ? `/api/calendar/ical?workspace_id=${workspace.id}`
    : "/api/calendar/ical?workspace_id=your-workspace-id"

  const fullIcalUrl = typeof window !== "undefined"
    ? `${window.location.origin}${icalUrl}`
    : icalUrl

  function copyIcal() {
    navigator.clipboard.writeText(fullIcalUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function toggle(key: keyof typeof notifications) {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <DashboardContainer>
      <CalendarTabNav />

      <div className="px-6 py-6 max-w-[720px] space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Calendar Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure your calendar preferences and integrations.</p>
        </div>

        {/* iCal Export */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">iCal / Calendar Feed</h2>
              <p className="text-xs text-slate-500">Subscribe to your Propvora calendar in Google Calendar, Outlook, or Apple Calendar.</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 flex items-center gap-2">
            <code className="flex-1 text-xs text-slate-700 font-mono truncate">{fullIcalUrl}</code>
            <button
              onClick={copyIcal}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                copied
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <p>Add this URL to your external calendar app to subscribe to your events feed.</p>
            <p>The feed updates automatically as you create and modify events in Propvora.</p>
          </div>
        </div>

        {/* Notification preferences */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Notification Preferences</h2>
              <p className="text-xs text-slate-500">Choose how and when you get notified about calendar events.</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: "emailReminders" as const, label: "Email reminders", desc: "Receive event reminders by email" },
              { key: "inAppAlerts" as const, label: "In-app alerts", desc: "Show notification banner in the app" },
              { key: "overdueWarnings" as const, label: "Overdue warnings", desc: "Alert when events are overdue" },
              { key: "dailyDigest" as const, label: "Daily digest", desc: "Summary email of upcoming events each morning" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative shrink-0",
                    notifications[key] ? "bg-[#2563EB]" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    notifications[key] ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Default view */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Default View</h2>
              <p className="text-xs text-slate-500">Choose the default calendar view when opening the calendar.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Month", "Week", "Day", "Agenda"].map(view => (
              <button
                key={view}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition-all first:bg-[#EFF6FF] first:border-[#2563EB] first:text-[#2563EB]"
              >
                {view}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">Preference saved locally. Full persistence coming soon.</p>
        </div>
      </div>
    </DashboardContainer>
  )
}
