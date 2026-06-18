import React from "react"
import Link from "next/link"
import { Megaphone, Radio, CalendarClock, FileEdit, Layers, PanelTop } from "lucide-react"
import { AdminPageHeader, AdminKpiStrip, AdminButtonLink, type AdminKpi } from "@/components/admin/ui"
import { adminListAnnouncements, adminListWorkspaceOptions } from "@/lib/comms/data"
import { getAnnouncementKpis } from "@/lib/admin/pages/batch4"
import AnnouncementsEditor from "./AnnouncementsEditor"

export const dynamic = "force-dynamic"
export const metadata = { title: "Announcements — Propvora admin" }

export default async function AdminAnnouncementsPage() {
  const [announcements, workspaces, kpis] = await Promise.all([
    adminListAnnouncements(200),
    adminListWorkspaceOptions(500),
    getAnnouncementKpis(),
  ])

  const cards: AdminKpi[] = [
    { label: "Live", value: kpis.live, icon: Radio, tone: "emerald" },
    { label: "Scheduled", value: kpis.scheduled, icon: CalendarClock, tone: "amber" },
    { label: "Drafts", value: kpis.draft, icon: FileEdit, tone: "blue" },
    { label: "Total", value: kpis.total, icon: Layers, tone: "violet" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Megaphone}
        title="Announcements"
        subtitle="Publish in-app banners — global (all workspaces) or targeted to a single workspace — with severity and scheduling."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Communications" }, { label: "Announcements" }]}
        actions={<AdminButtonLink href="/admin/announcement-bar" icon={PanelTop} variant="secondary">Announcement bar</AdminButtonLink>}
      />

      <AdminKpiStrip kpis={cards} cols={4} />

      <AnnouncementsEditor initialAnnouncements={announcements} workspaces={workspaces} />
    </div>
  )
}
