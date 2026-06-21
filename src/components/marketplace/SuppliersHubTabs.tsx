"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Store, Wrench, AlertTriangle } from "lucide-react"

const BASE = "/property-manager/marketplace/suppliers-hub"

export type HubTab = "suppliers" | "services" | "emergency"

const TABS: { key: HubTab; label: string; icon: typeof Store }[] = [
  { key: "suppliers", label: "Suppliers", icon: Store },
  { key: "services", label: "Services", icon: Wrench },
  { key: "emergency", label: "Emergency", icon: AlertTriangle },
]

/**
 * Route-aware in-page tabs for the unified PM suppliers marketplace. Switches
 * between the Suppliers / Services / Emergency marketplaces via `?tab=` so the
 * active tab is shareable and back-button safe. Defaults to "suppliers".
 */
export default function SuppliersHubTabs() {
  const searchParams = useSearchParams()
  const current = (searchParams?.get("tab") as HubTab | null) ?? "suppliers"

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 mb-6 px-1">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = current === tab.key
        return (
          <Link
            key={tab.key}
            href={tab.key === "suppliers" ? BASE : `${BASE}?tab=${tab.key}`}
            scroll={false}
            className={[
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
              active
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
