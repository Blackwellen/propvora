import type { Metadata } from "next"
import { Suspense } from "react"
import SuppliersHubTabs, { type HubTab } from "@/components/marketplace/SuppliersHubTabs"
import { SuppliersSection, ServicesSection, EmergencySection } from "./sections"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Suppliers marketplace · Propvora",
  description: "Search and compare verified suppliers, service packages and emergency call-outs.",
}

/**
 * Unified PM suppliers marketplace. One page, three route-aware in-page tabs
 * (Suppliers | Services | Emergency) switching between the three marketplaces
 * via `?tab=`. The listing cards are the exact public-marketplace components,
 * so they stay 1:1 with the public marketplace. Defaults to "suppliers".
 */
export default async function SuppliersHubPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const active: HubTab =
    tab === "services" ? "services" : tab === "emergency" ? "emergency" : "suppliers"

  return (
    <div>
      <Suspense fallback={<div className="mb-6 h-12 border-b border-slate-200" />}>
        <SuppliersHubTabs />
      </Suspense>
      {active === "suppliers" && <SuppliersSection />}
      {active === "services" && <ServicesSection />}
      {active === "emergency" && <EmergencySection />}
    </div>
  )
}
