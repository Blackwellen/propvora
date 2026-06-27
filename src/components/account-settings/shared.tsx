"use client"

import { cn } from "@/lib/utils"

// ── Toggle ──────────────────────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-11 h-6 rounded-full transition-all relative shrink-0",
        checked ? "bg-[var(--brand)]" : "bg-slate-200"
      )}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
          checked ? "left-5" : "left-0.5"
        )}
      />
    </button>
  )
}

// ── Constants shared across tabs ─────────────────────────────────────────────
export const NOTIFICATIONS = [
  { id: "email_notif",     label: "Email notifications",  desc: "Important alerts via email" },
  { id: "in_app_notif",    label: "In-app notifications", desc: "Alerts inside Propvora" },
  { id: "weekly_digest",   label: "Weekly digest",        desc: "Sunday summary email" },
  { id: "payment_alerts",  label: "Payment reminders",    desc: "Rent and invoice alerts" },
  { id: "task_alerts",     label: "Task reminders",       desc: "Due task notifications" },
  { id: "tenancy_alerts",  label: "Tenancy alerts",       desc: "Start/end date reminders" },
  { id: "planning_alerts", label: "Planning updates",     desc: "Planning application changes" },
]

export const SESSIONS_MOCK = [
  { id: "s1", device: "Chrome on macOS",      location: "Birmingham, UK", last: "Active now",      current: true },
  { id: "s2", device: "Safari on iPhone 14",  location: "Birmingham, UK", last: "2 hours ago",     current: false },
  { id: "s3", device: "Chrome on Windows 11", location: "London, UK",     last: "Yesterday 14:22", current: false },
]

export const PREF_FIELDS = [
  { key: "locale",           label: "Language",    options: ["en-GB", "en-US", "cy"],                    labels: { "en-GB": "English (GB)", "en-US": "English (US)", "cy": "Welsh" } },
  { key: "date_format",      label: "Date Format", options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],  labels: {} as Record<string, string> },
  { key: "currency_display", label: "Currency",    options: ["GBP", "EUR", "USD"],                       labels: { GBP: "GBP (£)", EUR: "EUR (€)", USD: "USD ($)" } },
  { key: "timezone",         label: "Timezone",    options: ["Europe/London", "UTC", "America/New_York"], labels: {} as Record<string, string> },
] as const
