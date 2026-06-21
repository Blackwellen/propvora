"use client"

import React from "react"
import { ToggleRow } from "./shared"

export interface NotificationChannelsProps {
  inAppEnabled: boolean
  emailEnabled: boolean
  pushEnabled: boolean
  onToggleEmail: (v: boolean) => void
}

export function NotificationChannels({
  inAppEnabled,
  emailEnabled,
  pushEnabled,
  onToggleEmail,
}: NotificationChannelsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Channels</h3>
      <p className="text-[12px] text-slate-400 mb-4">Where notifications are delivered</p>
      <div className="space-y-3">
        {/* In-app — always on */}
        <div className="flex items-center justify-between py-3 border-b border-slate-50">
          <div>
            <p className="text-[13px] font-medium text-slate-800">In-app</p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">Shown in the notification bell</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            Always on
          </span>
        </div>
        <ToggleRow
          label="Email"
          description="Send notification digests to your email address"
          checked={emailEnabled}
          onChange={onToggleEmail}
        />
        {/* Push — not yet available */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-[13px] font-medium text-slate-800">Push notifications</p>
            <p className="text-[11.5px] text-slate-400 mt-0.5">Browser and mobile push — coming soon</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            Not available
          </span>
        </div>
      </div>
    </div>
  )
}
