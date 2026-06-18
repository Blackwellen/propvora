import React from "react"
import { Rocket, CheckCircle2, FileEdit, CalendarDays, Tag } from "lucide-react"
import { AdminPageHeader, AdminKpiStrip, type AdminKpi } from "@/components/admin/ui"
import { adminListChangelog } from "@/lib/comms/data"
import { getChangelogKpis } from "@/lib/admin/pages/batch4"
import ChangelogEditor from "./ChangelogEditor"

export const dynamic = "force-dynamic"
export const metadata = { title: "Changelog — Propvora admin" }

export default async function AdminChangelogPage() {
  const [entries, kpis] = await Promise.all([adminListChangelog(200), getChangelogKpis()])

  const cards: AdminKpi[] = [
    { label: "Releases published", value: kpis.releasesPublished, icon: CheckCircle2, tone: "emerald" },
    { label: "Drafts", value: kpis.draftCount, icon: FileEdit, tone: "amber" },
    { label: "This month", value: kpis.thisMonth, icon: CalendarDays, tone: "blue" },
    { label: "Latest version", value: kpis.latestVersion ?? "—", icon: Tag, tone: "violet" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Rocket}
        title="Changelog"
        subtitle="Author and publish product release notes. Published entries appear on the public /changelog page."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Communications" }, { label: "Changelog" }]}
      />

      <AdminKpiStrip kpis={cards} cols={4} />

      <ChangelogEditor initialEntries={entries} />
    </div>
  )
}
