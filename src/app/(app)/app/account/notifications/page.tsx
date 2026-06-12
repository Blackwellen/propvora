"use client"

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUserPreferences, saveUserPreferences } from "@/lib/actions/settings"

type PrefsState = {
  workReminders: boolean
  supplierReplies: boolean
  inboxMessages: boolean
  aiApprovalRequests: boolean
  calendarReminders: boolean
  invoiceAlerts: boolean
  arrearsAlerts: boolean
  complianceAlerts: boolean
  securityAlerts: boolean
  channelInApp: boolean
  channelEmail: boolean
  digest: string
}

function ToggleRow({
  label,
  desc,
  enabled,
  onToggle,
}: {
  label: string
  desc: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
        <p className="text-[11.5px] text-slate-400">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "w-10 h-6 rounded-full transition-colors relative shrink-0",
          enabled ? "bg-[#2563EB]" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "absolute top-1 block w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  )
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<PrefsState>({
    workReminders: true,
    supplierReplies: true,
    inboxMessages: true,
    aiApprovalRequests: true,
    calendarReminders: true,
    invoiceAlerts: true,
    arrearsAlerts: true,
    complianceAlerts: true,
    securityAlerts: true,
    channelInApp: true,
    channelEmail: true,
    digest: "instant",
  })
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quietStart, setQuietStart] = useState("22:00")
  const [quietEnd, setQuietEnd] = useState("08:00")
  const [unavailable, setUnavailable] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    getUserPreferences().then(({ prefs: p, unavailable }) => {
      if (unavailable) setUnavailable(true)
      const np = p?.notification_prefs as Partial<PrefsState> | undefined
      if (np && typeof np === "object") setPrefs(prev => ({ ...prev, ...np }))
      if (typeof p?.quiet_hours_start === "string") setQuietStart(p.quiet_hours_start as string)
      if (typeof p?.quiet_hours_end === "string") setQuietEnd(p.quiet_hours_end as string)
    })
  }, [])

  function toggle(key: keyof PrefsState) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
    setIsDirty(true)
    setSaveError(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const res = await saveUserPreferences({
      notification_prefs: prefs,
      quiet_hours_start: quietStart,
      quiet_hours_end: quietEnd,
    })
    setSaving(false)
    if (res.unavailable) { setUnavailable(true); setSaveError("Notification storage is not configured yet."); return }
    if (!res.ok) { setSaveError(res.error ?? "Failed to save."); return }
    setIsDirty(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Notifications</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Choose what alerts you receive and how</p>
      </div>

      {unavailable && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          Notification preferences storage is not provisioned yet — toggles show defaults and can&apos;t be saved until the <code className="font-mono">user_preferences</code> table exists.
        </div>
      )}

      {/* Channels */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Delivery Channels</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">Choose where notifications are delivered</p>
        <ToggleRow
          label="In-app notifications"
          desc="Show alerts inside the Propvora dashboard"
          enabled={prefs.channelInApp}
          onToggle={() => toggle("channelInApp")}
        />
        <ToggleRow
          label="Email notifications"
          desc="Send alerts to jamahlthomas1996@gmail.com"
          enabled={prefs.channelEmail}
          onToggle={() => toggle("channelEmail")}
        />
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Notification Categories</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">Enable or disable specific types of alerts</p>
        <ToggleRow
          label="Work & task reminders"
          desc="Due dates, overdue tasks, job updates"
          enabled={prefs.workReminders}
          onToggle={() => toggle("workReminders")}
        />
        <ToggleRow
          label="Supplier replies"
          desc="When a supplier responds to a job or quote"
          enabled={prefs.supplierReplies}
          onToggle={() => toggle("supplierReplies")}
        />
        <ToggleRow
          label="Inbox messages"
          desc="New messages from tenants or contacts"
          enabled={prefs.inboxMessages}
          onToggle={() => toggle("inboxMessages")}
        />
        <ToggleRow
          label="AI approval requests"
          desc="When an AI action needs your review"
          enabled={prefs.aiApprovalRequests}
          onToggle={() => toggle("aiApprovalRequests")}
        />
        <ToggleRow
          label="Calendar reminders"
          desc="Upcoming events and appointments"
          enabled={prefs.calendarReminders}
          onToggle={() => toggle("calendarReminders")}
        />
        <ToggleRow
          label="Invoice & payment alerts"
          desc="Invoices due, payments received"
          enabled={prefs.invoiceAlerts}
          onToggle={() => toggle("invoiceAlerts")}
        />
        <ToggleRow
          label="Arrears alerts"
          desc="Tenants falling into rent arrears"
          enabled={prefs.arrearsAlerts}
          onToggle={() => toggle("arrearsAlerts")}
        />
        <ToggleRow
          label="Compliance alerts"
          desc="Certificates expiring, safety checks due"
          enabled={prefs.complianceAlerts}
          onToggle={() => toggle("complianceAlerts")}
        />
        <ToggleRow
          label="Security alerts"
          desc="New logins, password changes, suspicious activity"
          enabled={prefs.securityAlerts}
          onToggle={() => toggle("securityAlerts")}
        />
      </div>

      {/* Digest */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Email Digest</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">
          How often to receive a summary email instead of individual alerts
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(["instant", "daily", "weekly", "off"] as const).map(opt => (
            <button
              key={opt}
              onClick={() => { setPrefs(p => ({ ...p, digest: opt })); setIsDirty(true) }}
              className={cn(
                "p-3.5 rounded-xl border-2 text-[12px] font-semibold capitalize transition-all",
                prefs.digest === opt
                  ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {opt === "off" ? "Off" : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quiet hours */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-24">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Quiet Hours</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">
          Pause notifications during these hours (in your local timezone)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Start time</label>
            <input
              type="time"
              value={quietStart}
              onChange={e => { setQuietStart(e.target.value); setIsDirty(true) }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">End time</label>
            <input
              type="time"
              value={quietEnd}
              onChange={e => { setQuietEnd(e.target.value); setIsDirty(true) }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      {isDirty && !unavailable && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div>
            <p className="text-[13px] text-slate-600">You have unsaved changes</p>
            {saveError && <p className="text-[12px] text-red-500 mt-0.5">{saveError}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDirty(false)}
              className="px-4 py-2 text-[13px] text-slate-600 hover:text-slate-900"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
