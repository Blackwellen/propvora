"use client"

import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { ScheduleToastProvider } from "@/features/supplier/schedule/components/shared"
import { CatalogueTab } from "@/features/supplier/services/components/CatalogueTab"
import { PackagesTab } from "@/features/supplier/services/components/PackagesTab"
import { TeamServiceSLAs } from "@/features/supplier/team/services/TeamServiceSLAs"

/* Services hub — Catalogue · Packages (Solo). The Team plan adds Service SLAs
   as a further tab (extension point reserved below; not built for Solo). Tabs
   are URL-backed (?tab=, default catalogue). */
export default function SupplierServicesHub() {
  const { isTeam } = useSupplierPlan()

  const tabs: SupplierHubTab[] = [
    { key: "catalogue", label: "Catalogue", render: () => <CatalogueTab /> },
    { key: "packages", label: "Packages", render: () => <PackagesTab /> },
    {
      key: "service-slas",
      label: "Service SLAs",
      teamOnly: true,
      upgradeTitle: "Service SLAs",
      upgradeDescription: "Set response and completion SLAs per service and track breaches.",
      upgradeFeatures: ["Per-service SLAs", "Breach alerts", "SLA reporting"],
      render: () => <TeamServiceSLAs />,
    },
  ]

  return (
    <ScheduleToastProvider>
      <SupplierTabHub
        title="Services"
        subtitle="Your catalogue, packages and pricing"
        tabs={tabs}
        isTeam={isTeam}
      />
    </ScheduleToastProvider>
  )
}
