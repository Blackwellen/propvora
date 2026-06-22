"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Store, Wrench } from "lucide-react"

const BASE = "/property-manager/marketplace/suppliers-hub"

export type HubTab = "suppliers" | "services" | "emergency"

// Emergency is no longer its own tab — it's an "Emergency" filter inside Services
// (one discovery surface). The `emergency` HubTab type is kept for back-compat
// with old ?tab=emergency links, which resolve into the Services tab.
const TABS: { key: HubTab; label: string; icon: typeof Store }[] = [
  { key: "suppliers", label: "Suppliers", icon: Store },
  { key: "services", label: "Services", icon: Wrench },
]

/**
 * Route-aware in-page tabs for the unified PM suppliers marketplace. Switches
 * between the Suppliers / Services / Emergency marketplaces via `?tab=` so the
 * active tab is shareable and back-button safe. Defaults to "suppliers".
 */
export default function SuppliersHubTabs() {
  const searchParams = useSearchParams()
  const raw = searchParams?.get("tab")
  // Emergency links fold into the Services tab.
  const current: HubTab = raw === "services" || raw === "emergency" ? "services" : "suppliers"

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
