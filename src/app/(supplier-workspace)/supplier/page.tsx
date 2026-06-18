"use client"

import { CalendarClock, Inbox, Wrench, Wallet, ShieldCheck } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { ToastProvider } from "@/features/supplier/overview/ui/primitives"
import { TodayTab } from "@/features/supplier/overview/tabs/TodayTab"
import { RequestsTab } from "@/features/supplier/overview/tabs/RequestsTab"
import { JobsTab } from "@/features/supplier/overview/tabs/JobsTab"
import { EarningsTab } from "@/features/supplier/overview/tabs/EarningsTab"
import { ComplianceTab } from "@/features/supplier/overview/tabs/ComplianceTab"
import { Suspense } from "react"
import { TeamCommandCentre } from "@/features/supplier/team/overview/TeamCommandCentre"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier Overview — the workspace ROOT (`/supplier`).

   • Team / Enterprise plans → the TeamCommandCentre (manifest images 1 & 2),
     a dispatch/approvals/risk dashboard (?section=capacity-risk for image 2).
   • Solo plan → the five route-aware, deep-linkable `?tab=` tabs via the shared
     SupplierTabHub. No team-only controls render on the Solo view.
─────────────────────────────────────────────────────────────────────────── */

export default function SupplierOverviewPage() {
  const { isTeam } = useSupplierPlan()

  if (isTeam) {
    return (
      <ToastProvider>
        <MobileTopBar title="Command Centre" subtitle="Team supplier workspace" />
        <Suspense fallback={<div className="h-40" />}>
          <TeamCommandCentre />
        </Suspense>
      </ToastProvider>
    )
  }

  const tabs: SupplierHubTab[] = [
    { key: "today", label: "Today", icon: CalendarClock, render: () => <TodayTab /> },
    { key: "requests", label: "Open Requests", icon: Inbox, render: () => <RequestsTab /> },
    { key: "jobs", label: "Active Jobs", icon: Wrench, render: () => <JobsTab /> },
    { key: "earnings", label: "Earnings", icon: Wallet, render: () => <EarningsTab /> },
    { key: "compliance", label: "Compliance Alerts", icon: ShieldCheck, render: () => <ComplianceTab /> },
  ]

  return (
    <ToastProvider>
      <MobileTopBar title="Overview" subtitle="Supplier workspace" />
      <SupplierTabHub
        title="Overview"
        subtitle="Your supplier command centre"
        tabs={tabs}
        isTeam={isTeam}
      />
    </ToastProvider>
  )
}
