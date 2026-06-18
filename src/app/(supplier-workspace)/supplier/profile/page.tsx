"use client"

import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import SupplierBusinessProfile from "./business"
import SupplierReviewsPage from "../reviews/page"
import MarketplacePage from "../marketplace/page"

/* Profile hub (Solo) ← profile + reviews + marketplace. Holds the Marketplace
   "Public Listing" controls (Marketplace is NOT a side-nav item). */
export default function SupplierProfileHub() {
  const { isTeam } = useSupplierPlan()

  const tabs: SupplierHubTab[] = [
    { key: "profile", label: "Business Profile", render: () => <SupplierBusinessProfile /> },
    { key: "listing", label: "Public Listing", render: () => <MarketplacePage /> },
    { key: "reviews", label: "Reviews", render: () => <SupplierReviewsPage /> },
    { key: "marketplace", label: "Marketplace Preview", render: () => <MarketplacePage /> },
  ]

  return (
    <SupplierTabHub
      title="Profile"
      subtitle="Your business profile, public listing and reviews"
      tabs={tabs}
      isTeam={isTeam}
    />
  )
}
