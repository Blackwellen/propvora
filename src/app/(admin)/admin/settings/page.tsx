import React from "react"
import { getPlatformFlags, getPlatformSetting } from "@/lib/admin/data"
import SettingsClient from "./SettingsClient"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  const [flagsResult, generalResult] = await Promise.all([
    getPlatformFlags(),
    getPlatformSetting("general"),
  ])

  const general = (generalResult.value ?? {}) as {
    platform_name?: string
    support_email?: string
    trial_length_days?: number
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-xs text-slate-500">Platform-wide configuration and feature flags · changes are audited</p>
      </div>

      <SettingsClient
        flagsAvailable={flagsResult.available}
        flags={flagsResult.flags}
        settingsAvailable={generalResult.available}
        general={general}
      />
    </div>
  )
}
