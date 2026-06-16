import React from "react"
import { getPlatformFlags, getPlatformSetting } from "@/lib/admin/data"
import { getAiGatewayAdminData } from "../ai-models/data"
import SettingsClient from "./SettingsClient"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  const [flagsResult, generalResult, maintenanceResult, aiData] = await Promise.all([
    getPlatformFlags(),
    getPlatformSetting("general"),
    getPlatformSetting("maintenance"),
    getAiGatewayAdminData(30),
  ])

  const general = (generalResult.value ?? {}) as {
    platform_name?: string
    support_email?: string
    trial_length_days?: number
  }
  const maintenance = (maintenanceResult.value ?? {}) as {
    enabled?: boolean
    message?: string
    allow_admins?: boolean
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-xs text-slate-500">Platform-wide configuration, feature flags, AI models and maintenance · all changes are audited</p>
      </div>

      <SettingsClient
        flagsAvailable={flagsResult.available}
        flags={flagsResult.flags}
        settingsAvailable={generalResult.available}
        general={general}
        maintenance={maintenance}
        ai={{ available: aiData.available, providers: aiData.providers, models: aiData.models }}
      />
    </div>
  )
}
