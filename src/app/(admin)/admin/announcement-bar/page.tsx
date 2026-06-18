import React from "react"
import { PanelTop } from "lucide-react"
import { AdminPageHeader, AdminStatusChip } from "@/components/admin/ui"
import { getAnnouncementBarData } from "@/lib/admin/pages/batch4"
import AnnouncementBarClient from "./AnnouncementBarClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "Announcement bar — Propvora admin" }

export default async function AdminAnnouncementBarPage() {
  const data = await getAnnouncementBarData()

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={PanelTop}
        title="Announcement bar"
        subtitle="Configure the persistent top-of-app bar shown across the platform. Set the message, severity, CTA, audience and schedule, then publish."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Communications" }, { label: "Announcement bar" }]}
        actions={<AdminStatusChip tone={data.config.enabled ? "emerald" : "slate"} dot>{data.config.enabled ? "Bar live" : "Bar off"}</AdminStatusChip>}
      />

      <AnnouncementBarClient initial={data.config} notConfigured={data.notConfigured} />
    </div>
  )
}
