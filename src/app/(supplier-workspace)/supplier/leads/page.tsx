"use client"

import { Inbox, FileText, Mail, LayoutGrid, Columns3, CheckCircle2, XCircle, List } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { NewLeadsTab } from "@/features/supplier/leads/components/tabs/NewLeadsTab"
import { QuotedLeadsTab } from "@/features/supplier/leads/components/tabs/QuotedLeadsTab"
import { ActiveLeadsTab } from "@/features/supplier/leads/components/tabs/ActiveLeadsTab"
import { CompletedLeadsTab } from "@/features/supplier/leads/components/tabs/CompletedLeadsTab"
import { DeclinedLeadsTab } from "@/features/supplier/leads/components/tabs/DeclinedLeadsTab"
import { AllLeadsTab } from "@/features/supplier/leads/components/tabs/AllLeadsTab"

/* Supplier → Leads & requests — inbound opportunities.
   Tabs per status: New / Quoted / Active / Completed / Declined / All.
   Each tab renders LeadsListView filtered to that status bucket.
   useSupplierPlan is imported for future team-only tabs (e.g. lead assignment
   queue) — isTeam is available for gating when that surface ships. */
export default function SupplierLeadsPage() {
  const { isTeam } = useSupplierPlan()

  const tabs: SupplierHubTab[] = [
    {
      key: "new",
      label: "New",
      icon: Inbox,
      render: () => <NewLeadsTab />,
    },
    {
      key: "quoted",
      label: "Quoted",
      icon: FileText,
      render: () => <QuotedLeadsTab />,
    },
    {
      key: "active",
      label: "Active",
      icon: LayoutGrid,
      render: () => <ActiveLeadsTab />,
    },
    {
      key: "completed",
      label: "Completed",
      icon: CheckCircle2,
      render: () => <CompletedLeadsTab />,
    },
    {
      key: "declined",
      label: "Declined",
      icon: XCircle,
      render: () => <DeclinedLeadsTab />,
    },
    {
      key: "all",
      label: "All",
      icon: Columns3,
      render: () => <AllLeadsTab />,
    },
  ]

  return (
    <>
      <MobileTopBar title="Leads & requests" subtitle="Inbound opportunities" />
      <SupplierTabHub
        title="Leads & requests"
        subtitle="Quote requests from property managers and enquiries on your marketplace listings."
        tabs={tabs}
        isTeam={isTeam}
      />
    </>
  )
}
