"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Bell, Mail, Smartphone, Check, Lock } from "lucide-react"

export interface ChannelSettings {
  inApp: boolean
  email: boolean
  push: boolean
}

export type DigestFrequency = "instant" | "hourly" | "daily" | "weekly"

export interface NotificationChannelsSectionProps {
  channels: ChannelSettings
  digest: DigestFrequency
  onToggleChannel: (key: keyof ChannelSettings) => void
  onSetDigest: (f: DigestFrequency) => void
}

export function NotificationChannelsSection({
  channels, digest, onToggleChannel, onSetDigest,
}: NotificationChannelsSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Notification Channels</h3>
      <p className="text-[12px] text-slate-500 mb-4">Where workspace notifications are delivered</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {[
          { key: "inApp" as const, label: "In-app", icon: Bell, desc: "Toast notifications inside the app" },
          { key: "email" as const, label: "Email",  icon: Mail, desc: "Sent to billing & team email addresses" },
        ].map((ch) => {
          const Icon = ch.icon
          const on = channels[ch.key]
          return (
            <button
              key={ch.key}
              onClick={() => onToggleChannel(ch.key)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
                on ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", on ? "bg-[var(--brand)]" : "bg-slate-100")}>
                  <Icon className={cn("w-4 h-4", on ? "text-white" : "text-slate-400")} />
                </div>
                {on && (
                  <div className="w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
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

        {/* Push: honest "setup required" state */}
        <div
          aria-disabled="true"
          title="Web push requires VAPID keys and a registered service worker — not configured in this environment."
          className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 cursor-not-allowed select-none"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100">
              <Smartphone className="w-4 h-4 text-slate-400" />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
              <Lock className="w-3 h-3" /> Setup required
            </span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-500">Push</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Requires browser push setup (VAPID keys + service worker) or the mobile app. Not available in this environment.
            </p>
          </div>
        </div>
      </div>

      {/* Digest frequency */}
      <div className="border-t border-slate-100 pt-4">
        <p className="text-[13px] font-semibold text-slate-800 mb-3">Email digest frequency</p>
        <div className="flex items-center gap-2 flex-wrap">
          {(["instant", "hourly", "daily", "weekly"] as DigestFrequency[]).map((f) => (
            <button
              key={f}
              onClick={() => onSetDigest(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-[12.5px] font-semibold border transition-all",
                digest === f
                  ? "bg-[var(--brand)] text-white border-[var(--brand)]"
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
  )
}

export default NotificationChannelsSection
