import type { Metadata } from "next"
import { Suspense } from "react"
import SuppliersHubTabs, { type HubTab } from "@/components/marketplace/SuppliersHubTabs"
import { SuppliersSection, ServicesSection } from "./sections"

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
 *
 * searchParams are forwarded to each section so they can filter/sort/paginate.
 */
export default async function SuppliersHubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const tab = typeof params.tab === "string" ? params.tab : undefined
  // Emergency folded into Services — ?tab=emergency resolves into the Services
  // tab with the emergency view active (handled inside ServicesSection).
  const active: HubTab =
    tab === "services" || tab === "emergency" ? "services" : "suppliers"

  return (
    <div>
      <Suspense fallback={<div className="mb-6 h-12 border-b border-slate-200" />}>
        <SuppliersHubTabs />
      </Suspense>
      {active === "suppliers" && <SuppliersSection searchParams={params} />}
      {active === "services"  && <ServicesSection  searchParams={params} />}
    </div>
  )
}
