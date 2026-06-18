"use client"

import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { ScheduleToastProvider } from "@/features/supplier/schedule/components/shared"
import { CalendarTab } from "@/features/supplier/schedule/components/CalendarTab"
import { AvailabilityTab } from "@/features/supplier/schedule/components/AvailabilityTab"
import { TimeOffTab } from "@/features/supplier/schedule/components/TimeOffTab"
import { TeamScheduleCapacity, TeamEmergencyRota } from "@/features/supplier/team/schedule/TeamScheduleViews"

/* Schedule hub — Calendar · Availability · Time Off (Solo). The Team plan adds
   Team Capacity (image 11) and Emergency Rota / Out-of-Hours (image 12) as
   real tabs. Tabs are URL-backed (?tab=, e.g. ?tab=emergency-rota). */
export default function SupplierScheduleHub() {
  const { isTeam } = useSupplierPlan()

  const tabs: SupplierHubTab[] = [
    { key: "calendar", label: "Calendar", render: () => <CalendarTab /> },
    { key: "availability", label: "Availability", render: () => <AvailabilityTab /> },
    { key: "time-off", label: "Time Off", render: () => <TimeOffTab /> },
    {
      key: "capacity",
      label: "Team Capacity",
      teamOnly: true,
      upgradeTitle: "Team Capacity planning",
      upgradeDescription:
        "See every worker's availability, out-of-hours cover and your emergency rota on one board.",
      upgradeFeatures: ["Per-worker availability", "Out-of-hours cover", "Emergency rota"],
      render: () => <TeamScheduleCapacity />,
    },
    {
      key: "emergency-rota",
      label: "Emergency Rota",
      teamOnly: true,
      upgradeTitle: "Emergency rota & out-of-hours",
      upgradeDescription: "On-call rota, backup cover, response SLAs and premium-pay rules for out-of-hours work.",
      upgradeFeatures: ["On-call + backup rota", "Coverage map & gaps", "Premium-pay rules"],
      render: () => <TeamEmergencyRota />,
    },
  ]

  return (
    <ScheduleToastProvider>
      <SupplierTabHub
        title="Schedule"
        subtitle="Your calendar, working hours and time off"
        tabs={tabs}
        isTeam={isTeam}
      />
    </ScheduleToastProvider>
  )
}
