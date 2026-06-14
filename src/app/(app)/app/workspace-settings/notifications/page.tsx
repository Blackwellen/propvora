"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Bell, Mail, Smartphone, Check, Loader2, Info } from "lucide-react"
import { getWorkspaceSettings, saveWorkspaceSettings } from "@/lib/actions/settings"

interface AlertToggles {
  workReminders: boolean
  supplierReplies: boolean
  invoiceDue: boolean
  arrears: boolean
  complianceExpiry: boolean
  planningOfferExpiry: boolean
  aiApproval: boolean
  teamInvite: boolean
  securityAlerts: boolean
  billingAlerts: boolean
}

interface ChannelSettings {
  inApp: boolean
  email: boolean
  push: boolean
}

type DigestFrequency = "instant" | "hourly" | "daily" | "weekly"

const ALERT_ROWS: { key: keyof AlertToggles; label: string; desc: string }[] = [
  { key: "workReminders",       label: "Work reminders",             desc: "Due dates and task reminders for maintenance and inspections"     },
  { key: "supplierReplies",     label: "Supplier reply notifications",desc: "When a supplier responds to a message or quote request"          },
  { key: "invoiceDue",          label: "Invoice due alerts",          desc: "Alerts when tenant or supplier invoices are approaching due date" },
  { key: "arrears",             label: "Arrears alerts",              desc: "When rent payments are overdue or a tenant falls into arrears"    },
  { key: "complianceExpiry",    label: "Compliance expiry alerts",    desc: "Gas safety, EPC, EICR and other certificates nearing expiry"     },
  { key: "planningOfferExpiry", label: "Planning offer expiry",       desc: "When planning or legal offer deadlines are approaching"          },
  { key: "aiApproval",          label: "AI approval notifications",   desc: "When AI actions are queued and awaiting your review"             },
  { key: "teamInvite",          label: "Team invite notifications",   desc: "When someone accepts or declines a workspace invite"             },
  { key: "securityAlerts",      label: "Security alerts",             desc: "Suspicious login attempts, MFA changes, and access events"       },
  { key: "billingAlerts",       label: "Billing alerts",              desc: "Payment failures, subscription changes and invoice notices"      },
]

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
      <div className="flex-1 pr-4">
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "w-10 h-6 rounded-full transition-colors shrink-0 relative",
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
  const [alerts, setAlerts] = useState<AlertToggles>({
    workReminders: true,
    supplierReplies: true,
    invoiceDue: true,
    arrears: true,
    complianceExpiry: true,
    planningOfferExpiry: true,
    aiApproval: true,
    teamInvite: true,
    securityAlerts: true,
    billingAlerts: true,
  })

  const [channels, setChannels] = useState<ChannelSettings>({
    inApp: true,
    email: true,
    push: false,
  })

  const [digest, setDigest] = useState<DigestFrequency>("daily")
  const [isDirty, setIsDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Hydrate workspace notification defaults from workspace_settings.
  useEffect(() => {
    getWorkspaceSettings().then(({ settings: s, unavailable }) => {
      if (unavailable) setUnavailable(true)
      if (s) {
        const na = s.notification_alerts as Partial<AlertToggles> | undefined
        if (na && typeof na === "object") setAlerts(prev => ({ ...prev, ...na }))
        const nc = s.notification_channels as Partial<ChannelSettings> | undefined
        if (nc && typeof nc === "object") setChannels(prev => ({ ...prev, ...nc }))
        if (typeof s.notification_digest === "string") {
          setDigest(s.notification_digest as DigestFrequency)
        }
      }
      setLoading(false)
    })
  }, [])

  const toggleAlert = (key: keyof AlertToggles) => {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }))
    setIsDirty(true)
    setSaved(false)
    setSaveError(null)
  }

  const toggleChannel = (key: keyof ChannelSettings) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }))
    setIsDirty(true)
    setSaved(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    const res = await saveWorkspaceSettings(
      {
        notification_alerts: alerts,
        notification_channels: channels,
        notification_digest: digest,
      },
      "chat"
    )
    setSaving(false)
    if (res.unavailable) {
      setUnavailable(true)
      setSaveError("Settings storage is not configured yet — changes can't be persisted.")
      return
    }
    if (!res.ok) {
      setSaveError(res.error ?? "Failed to save notification defaults.")
      return
    }
    setSaved(true)
    setIsDirty(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const enabledCount = Object.values(alerts).filter(Boolean).length

  return (
    <div className="pb-20">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-[22px] font-bold text-slate-900">Notifications</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Workspace-wide notification defaults</p>
      </div>

      {/* Info banner */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 mb-6 flex items-start gap-3">
        <div className="w-6 h-6 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
          <Bell className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-[12.5px] text-[#1e3a8a] font-medium">
          These are workspace defaults. Individual users can override these in their Account Settings.
        </p>
      </div>

      {unavailable && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          Settings storage is not provisioned in this environment yet. Toggles show defaults and can&apos;t be persisted until the <code className="font-mono">workspace_settings</code> table exists.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Alert types active", value: `${enabledCount} / ${ALERT_ROWS.length}` },
          { label: "Channels enabled",   value: Object.values(channels).filter(Boolean).length.toString() },
          { label: "Digest frequency",   value: digest.charAt(0).toUpperCase() + digest.slice(1) },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{stat.label}</p>
            <p className="text-[16px] font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Alert types */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Alert Types</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Choose which workspace events trigger notifications</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const all = Object.fromEntries(ALERT_ROWS.map(r => [r.key, true])) as unknown as AlertToggles
                setAlerts(all)
                setIsDirty(true)
              }}
              className="text-[11.5px] font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
            >
              All on
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => {
                const none = Object.fromEntries(ALERT_ROWS.map(r => [r.key, false])) as unknown as AlertToggles
                setAlerts(none)
                setIsDirty(true)
              }}
              className="text-[11.5px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              All off
            </button>
          </div>
        </div>
        {ALERT_ROWS.map(row => (
          <ToggleRow
            key={row.key}
            label={row.label}
            desc={row.desc}
            enabled={alerts[row.key]}
            onToggle={() => toggleAlert(row.key)}
          />
        ))}
      </div>

      {/* Channels */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Notification Channels</h3>
        <p className="text-[12px] text-slate-500 mb-4">Where workspace notifications are delivered</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { key: "inApp" as const, label: "In-app",          icon: Bell,        desc: "Toast notifications inside the app"    },
            { key: "email" as const, label: "Email",           icon: Mail,        desc: "Sent to billing & team email addresses" },
            { key: "push"  as const, label: "Push (mobile)",   icon: Smartphone,  desc: "Push to mobile app (coming soon)"       },
          ].map(ch => {
            const Icon = ch.icon
            const on = channels[ch.key]
            return (
              <button
                key={ch.key}
                onClick={() => toggleChannel(ch.key)}
                className={cn(
                  "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
                  on ? "border-[#2563EB] bg-[#EFF6FF]" : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", on ? "bg-[#2563EB]" : "bg-slate-100")}>
                    <Icon className={cn("w-4 h-4", on ? "text-white" : "text-slate-400")} />
                  </div>
                  {on && (
                    <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className={cn("text-[13px] font-semibold", on ? "text-[#1e3a8a]" : "text-slate-700")}>{ch.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{ch.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Digest frequency */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-[13px] font-semibold text-slate-800 mb-3">Email digest frequency</p>
          <div className="flex items-center gap-2 flex-wrap">
            {(["instant", "hourly", "daily", "weekly"] as DigestFrequency[]).map(f => (
              <button
                key={f}
                onClick={() => { setDigest(f); setIsDirty(true) }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[12.5px] font-semibold border transition-all",
                  digest === f
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {digest === "instant" ? "Notifications are sent immediately as events occur."
              : digest === "hourly" ? "Notifications are batched and sent every hour."
              : digest === "daily" ? "A single daily summary email is sent each morning."
              : "A weekly digest is sent every Monday morning."}
          </p>
        </div>
      </div>

      {/* Sticky save bar */}
      {isDirty && !unavailable && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[13px] text-slate-600">You have unsaved changes</p>
            {saveError && <p className="text-[12px] text-red-500 mt-0.5">{saveError}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIsDirty(false); setSaveError(null) }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
