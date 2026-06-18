"use client"

import { Gauge, Star, ShieldAlert } from "lucide-react"
import { SupplierTabHub, type SupplierHubTab } from "@/components/supplier-workspace/SupplierTabHub"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import SupplierReputationOverview from "./overview"
import SupplierReviewsPage from "../reviews/page"
import SupplierDisputesPage from "../disputes/page"
import { TeamReviews, TeamDisputes } from "@/features/supplier/team/reputation/TeamReputationViews"

/* Reputation hub ← Overview + Reviews + Disputes + Trust. Team plan gets the
   team Reviews (image 24) and Disputes + Trust (image 25) surfaces. */
export default function SupplierReputationHub() {
  const { isTeam } = useSupplierPlan()

  const tabs: SupplierHubTab[] = [
    { key: "overview", label: "Overview", icon: Gauge, render: () => <SupplierReputationOverview /> },
    { key: "reviews", label: "Reviews", icon: Star, render: () => (isTeam ? <TeamReviews /> : <SupplierReviewsPage />) },
    { key: "disputes", label: "Disputes", icon: ShieldAlert, render: () => (isTeam ? <TeamDisputes /> : <SupplierDisputesPage />) },
  ]

  return (
    <SupplierTabHub
      title="Reputation"
      subtitle="Reviews, ratings, response score and disputes"
      tabs={tabs}
      isTeam={isTeam}
    />
  )
}
