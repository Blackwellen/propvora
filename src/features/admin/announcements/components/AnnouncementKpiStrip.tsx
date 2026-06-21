import React from "react"
import { Radio, CalendarClock, FileEdit, Layers } from "lucide-react"
import { AdminKpiStrip, type AdminKpi } from "@/components/admin/ui"

interface KpiData {
  live: number
  scheduled: number
  draft: number
  total: number
}

interface Props {
  kpis: KpiData
}

export function AnnouncementKpiStrip({ kpis }: Props) {
  const cards: AdminKpi[] = [
    { label: "Live", value: kpis.live, icon: Radio, tone: "emerald" },
    { label: "Scheduled", value: kpis.scheduled, icon: CalendarClock, tone: "amber" },
    { label: "Drafts", value: kpis.draft, icon: FileEdit, tone: "blue" },
    { label: "Total", value: kpis.total, icon: Layers, tone: "violet" },
  ]

  return <AdminKpiStrip kpis={cards} cols={4} />
}
