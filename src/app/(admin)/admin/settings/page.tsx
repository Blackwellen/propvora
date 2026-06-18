import React from "react"
import { Settings, ShieldCheck, Plug, Flag, Lock } from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminCard,
  AdminStatusChip,
  type AdminKpi,
} from "@/components/admin/ui"
import { getPlatformFlags, getPlatformSetting } from "@/lib/admin/data"
import { getConfigStatus } from "@/lib/admin/pages/batch5"
import PlatformSettingsClient from "./PlatformSettingsClient"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  const [flagsResult, generalResult, maintenanceResult] = await Promise.all([
    getPlatformFlags(),
    getPlatformSetting("general"),
    getPlatformSetting("maintenance"),
  ])

  const general = (generalResult.value ?? {}) as { platform_name?: string; support_email?: string; trial_length_days?: number }
  const maintenance = (maintenanceResult.value ?? {}) as { enabled?: boolean; message?: string; allow_admins?: boolean }

  const flagsEnabled = flagsResult.flags.filter((f) => f.enabled).length
  const config = await getConfigStatus({
    settingsAvailable: generalResult.available,
    flagsAvailable: flagsResult.available,
    flagCount: flagsResult.flags.length,
    flagsEnabled,
  })

  const kpis: AdminKpi[] = [
    { label: "Integrations live", value: `${config.configured}/${config.total}`, icon: Plug, tone: config.configured === config.total ? "emerald" : "amber" },
    { label: "Feature flags on", value: config.flagsAvailable ? `${flagsEnabled}/${config.flagCount}` : "—", icon: Flag, tone: "blue" },
    { label: "Settings store", value: config.settingsAvailable ? "Provisioned" : "Pending", icon: ShieldCheck, tone: config.settingsAvailable ? "emerald" : "amber" },
    { label: "Maintenance mode", value: maintenance.enabled ? "On" : "Off", icon: Lock, tone: maintenance.enabled ? "amber" : "slate" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Platform settings"
        subtitle="Platform-wide configuration, integrations, feature flags and compliance. All changes are audited; export the live config as JSON or YAML."
        icon={Settings}
        actions={<AdminStatusChip tone={config.settingsAvailable ? "emerald" : "amber"} dot>{config.settingsAvailable ? "Persistence active" : "Persistence pending"}</AdminStatusChip>}
      />

      <AdminKpiStrip kpis={kpis} cols={4} />

      {/* Configuration status overview */}
      <AdminCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-[#0B1B3F]">Configuration status</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {config.integrations.map((i) => (
            <div key={i.key} className={`rounded-xl border p-3 ${i.configured ? "border-emerald-100 bg-[#ECFDF5]/40" : "border-[#E2EAF6] bg-[#FAFCFF]"}`}>
              <p className="text-[12.5px] font-medium text-[#0B1B3F]">{i.label}</p>
              <div className="mt-2">{i.configured ? <AdminStatusChip tone="emerald" dot>Configured</AdminStatusChip> : <AdminStatusChip tone="slate" dot>Not set</AdminStatusChip>}</div>
            </div>
          ))}
        </div>
      </AdminCard>

      <PlatformSettingsClient
        settingsAvailable={generalResult.available}
        flagsAvailable={flagsResult.available}
        general={general}
        maintenance={maintenance}
        flags={flagsResult.flags}
      />
    </div>
  )
}
