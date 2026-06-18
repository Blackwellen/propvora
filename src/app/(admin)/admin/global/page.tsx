import React from "react"
import { Settings2, Languages, Globe2, CheckCircle2, Clock } from "lucide-react"
import { AdminPageHeader, AdminKpiStrip, AdminButtonLink, type AdminKpi } from "@/components/admin/ui"
import { getGlobalSettingsData } from "@/lib/admin/pages/batch4"
import GlobalSettingsClient from "./GlobalSettingsClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "Global settings — Propvora admin" }

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"
}

export default async function AdminGlobalPage() {
  const data = await getGlobalSettingsData()
  const s = data.settings

  const integrations = [s.stripeConfigured, s.resendConfigured, s.supabaseConfigured].filter(Boolean).length

  const kpis: AdminKpi[] = [
    { label: "Default locale", value: s.defaultLocale, icon: Globe2, tone: "blue", sub: s.defaultTimezone },
    { label: "Data region", value: s.dataRegion.toUpperCase(), icon: CheckCircle2, tone: "emerald", sub: `Retention ${s.retentionDays}d` },
    { label: "Integrations live", value: `${integrations}/3`, icon: Settings2, tone: "violet" },
    { label: "Last updated", value: fmt(data.updatedAt), icon: Clock, tone: "slate" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Settings2}
        title="Global settings"
        subtitle="Platform-wide defaults for locale, branding, notifications, security, compliance and integrations. Changes apply to new workspaces and the platform baseline."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Settings" }, { label: "Global" }]}
        actions={
          <div className="flex items-center gap-2">
            <AdminButtonLink href="/admin/global-translations" icon={Languages} variant="secondary">Translations</AdminButtonLink>
          </div>
        }
      />

      <AdminKpiStrip kpis={kpis} cols={4} />

      <GlobalSettingsClient initial={data.settings} notConfigured={data.notConfigured} />
    </div>
  )
}
