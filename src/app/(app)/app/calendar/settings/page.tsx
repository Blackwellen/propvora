"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, CalendarDays, Bell, Globe } from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { CalendarTabNav } from "@/components/calendar/CalendarTabNav"
import { MobileTopBar } from "@/components/mobile"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"

type NotifPrefs = {
  emailReminders: boolean
  inAppAlerts: boolean
  overdueWarnings: boolean
  dailyDigest: boolean
}
const DEFAULT_NOTIFS: NotifPrefs = { emailReminders: true, inAppAlerts: true, overdueWarnings: true, dailyDigest: false }
const VIEW_OPTIONS = ["month", "week", "day", "agenda"] as const

export default function CalendarSettingsPage() {
  const { workspace } = useWorkspace()
  const [copied, setCopied] = useState(false)
  const [notifications, setNotifications] = useState<NotifPrefs>(DEFAULT_NOTIFS)
  const [defaultView, setDefaultView] = useState<string>("month")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [icalToken, setIcalToken] = useState<string | null>(null)

  // Load persisted calendar_settings (42P01 / RLS tolerant). Ensures an iCal
  // subscribe token exists so the feed URL below is real and unguessable.
  useEffect(() => {
    if (!workspace?.id) return
    ;(async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("calendar_settings")
        .select("default_view, visible_layers_json, ical_token")
        .eq("workspace_id", workspace.id)
        .maybeSingle()
      if (!error && data) {
        if (data.default_view) setDefaultView(data.default_view as string)
        const layers = (data.visible_layers_json ?? {}) as { notifications?: Partial<NotifPrefs> }
        if (layers.notifications) setNotifications({ ...DEFAULT_NOTIFS, ...layers.notifications })
      }
      // Generate + persist a token once if the workspace has none yet.
      let token = (data?.ical_token as string | null) ?? null
      if (!token) {
        token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "")
        const { error: tokenErr } = await supabase
          .from("calendar_settings")
          .upsert(
            { workspace_id: workspace.id, ical_token: token, updated_at: new Date().toISOString() },
            { onConflict: "workspace_id" }
          )
        if (tokenErr) token = null
      }
      if (token) setIcalToken(token)
    })()
  }, [workspace?.id])

  const persist = useCallback(async (next: { defaultView?: string; notifications?: NotifPrefs }) => {
    if (!workspace?.id) return
    setSaveState("saving")
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("calendar_settings")
        .upsert(
          {
            workspace_id: workspace.id,
            default_view: next.defaultView ?? defaultView,
            visible_layers_json: { notifications: next.notifications ?? notifications },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id" }
        )
      setSaveState(error ? "error" : "saved")
      if (!error) setTimeout(() => setSaveState("idle"), 1800)
    } catch {
      setSaveState("error")
    }
  }, [workspace?.id, defaultView, notifications])

  const icalUrl = icalToken
    ? `/api/calendar/ical/${icalToken}.ics`
    : null

  const fullIcalUrl = icalUrl
    ? (typeof window !== "undefined" ? `${window.location.origin}${icalUrl}` : icalUrl)
    : "Generating your private feed URL…"

  function copyIcal() {
    if (!icalUrl) return
    navigator.clipboard
      .writeText(fullIcalUrl)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        // Clipboard permission denied / unavailable — fail silently.
      })
  }

  function toggle(key: keyof NotifPrefs) {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    void persist({ notifications: updated })
  }

  function chooseView(view: string) {
    setDefaultView(view)
    void persist({ defaultView: view })
  }

  return (
    <DashboardContainer>
      <MobileTopBar title="Calendar Settings" subtitle="Preferences" />
      <div className="md:hidden -mx-4">
        <CalendarTabNav />
      </div>
      <div className="hidden md:block">
        <CalendarTabNav />
      </div>

      <div className="px-4 md:px-6 py-4 md:py-6 max-w-[720px] space-y-6">
        <div className="hidden md:block">
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
              disabled={!icalUrl}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                copied
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
                !icalUrl && "opacity-50 cursor-not-allowed"
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
            {VIEW_OPTIONS.map(view => (
              <button
                key={view}
                onClick={() => chooseView(view)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-all",
                  defaultView === view
                    ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-300"
                )}
              >
                {view}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved." : saveState === "error" ? "Could not save — please retry." : "Preferences save to your workspace."}
          </p>
        </div>
      </div>
    </DashboardContainer>
  )
}
