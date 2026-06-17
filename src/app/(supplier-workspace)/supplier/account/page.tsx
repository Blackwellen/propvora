"use client"

import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan, useSupplierPermissions } from "@/components/supplier-workspace/useSupplierPlan"
import { SupplierPermissionDenied } from "@/components/supplier-workspace/ui"
import SupplierBusinessProfile from "../profile/business"
import SupplierTeamPage from "../team/page"
import SupplierSettingsPage from "../settings/page"
import MarketplacePage from "../marketplace/page"

/* Account hub (Team) ← Account + Settings + Profile + Team. Holds the
   Marketplace "Public Listing" controls (Marketplace is NOT a side-nav item).
   Gated to owner/admin. */
export default function SupplierAccountHub() {
  const { isTeam } = useSupplierPlan()
  const perms = useSupplierPermissions()

  if (!perms.can("account")) {
    return (
      <div className="space-y-5">
        <SupplierPermissionDenied
          title="Account is restricted"
          description="Only owners and admins can manage the business profile, team, roles and billing."
        />
      </div>
    )
  }

  const tabs: SupplierHubTab[] = [
    { key: "profile", label: "Business Profile", render: () => <SupplierBusinessProfile /> },
    { key: "listing", label: "Public Listing", render: () => <MarketplacePage /> },
    { key: "team", label: "Team", render: () => <SupplierTeamPage /> },
    { key: "settings", label: "Settings", render: () => <SupplierSettingsPage /> },
    { key: "marketplace", label: "Marketplace Preview", render: () => <MarketplacePage /> },
  ]

  return (
    <SupplierTabHub
      title="Account"
      subtitle="Business profile, public listing, team, roles, billing and settings"
      tabs={tabs}
      isTeam={isTeam}
    />
  )
}
