"use client"

import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import SupplierMessagesPage from "../messages/page"
import SupplierNotificationsPage from "../notifications/page"
import { TeamCustomerThreads, TeamInternalNotes } from "@/features/supplier/team/inbox/TeamInboxViews"

/* Inbox hub ← Messages + Notifications (+ Internal Notes for Team plan). */
export default function SupplierInboxHub() {
  const { isTeam } = useSupplierPlan()

  const tabs: SupplierHubTab[] = [
    { key: "messages", label: "Messages", render: () => <SupplierMessagesPage /> },
    {
      key: "customer-threads", label: "Customer Threads", teamOnly: true,
      upgradeTitle: "Team customer threads",
      upgradeDescription: "A shared inbox with thread ownership, internal toggle and SLA timers.",
      upgradeFeatures: ["Thread ownership", "Customer / internal toggle", "Reply SLA timers"],
      render: () => <TeamCustomerThreads />,
    },
    {
      key: "internal-notes", label: "Internal Notes", teamOnly: true,
      upgradeTitle: "Internal team notes",
      upgradeDescription: "Keep private notes on customer threads visible only to your team.",
      upgradeFeatures: ["Private thread notes", "@mention teammates", "Linked to jobs/quotes"],
      render: () => <TeamInternalNotes />,
    },
    { key: "notifications", label: "Notifications", render: () => <SupplierNotificationsPage /> },
  ]

  return (
    <SupplierTabHub
      title="Inbox"
      subtitle="Messages, notifications and job updates"
      tabs={tabs}
      isTeam={isTeam}
    />
  )
}
