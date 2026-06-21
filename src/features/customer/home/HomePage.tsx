"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCustomerToast } from "../components/toast"
import { recommended } from "../data/mock"
import DashboardHero from "../dashboard/components/DashboardHero"
import DashboardKpiStrip from "../dashboard/components/DashboardKpiStrip"
import UpcomingStaysCard from "../dashboard/components/UpcomingStaysCard"
import RecommendedCard from "../dashboard/components/RecommendedCard"
import RecentActivityCard from "../dashboard/components/RecentActivityCard"
import QuickActionsRail from "../dashboard/components/QuickActionsRail"
import AccountSummaryRail from "../dashboard/components/AccountSummaryRail"
import InvitePromoRail from "../dashboard/components/InvitePromoRail"
import TrustSafetyRail from "../dashboard/components/TrustSafetyRail"

export default function HomePage({ firstName = "" }: { firstName?: string }) {
  const router = useRouter()
  const { toast } = useCustomerToast()
  const [where, setWhere] = useState("")
  const [saved, setSaved] = useState<Record<string, boolean>>(
    () => Object.fromEntries(recommended.map((p) => [p.id, !!p.saved]))
  )

  function search() {
    const q = where.trim()
    router.push(q ? `/customer/stays?where=${encodeURIComponent(q)}` : "/customer/stays")
  }
  function toggleSave(id: string) {
    setSaved((s) => {
      const next = { ...s, [id]: !s[id] }
      toast(next[id] ? "Saved to favourites" : "Removed from favourites", next[id] ? "success" : "info")
      return next
    })
  }

  return (
    <div className="space-y-6">
      <DashboardHero firstName={firstName} where={where} onWhereChange={setWhere} onSearch={search} />
      <DashboardKpiStrip />

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6">
          <UpcomingStaysCard />
          <RecommendedCard saved={saved} onToggleSave={toggleSave} />
          <RecentActivityCard />
        </div>

        <aside className="space-y-6">
          <QuickActionsRail />
          <AccountSummaryRail />
          <InvitePromoRail />
          <TrustSafetyRail />
        </aside>
      </section>
    </div>
  )
}
