"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, Wrench, AlertTriangle } from "lucide-react"

const BASE = "/property-manager/marketplace/suppliers-hub"

// The hub is now a single tabbed page (?tab=…). These tabs point back at it so
// the nested detail/map pages keep a working tab bar. The "active" highlight is
// still derived from the pathname segment the nested page lives under.
const TABS = [
  { key: "suppliers", label: "Suppliers", href: BASE, icon: Store },
  { key: "services",  label: "Services",  href: `${BASE}?tab=services`, icon: Wrench },
  { key: "emergency", label: "Emergency", href: `${BASE}?tab=emergency`, icon: AlertTriangle },
]

export default function SuppliersHubNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 mb-6 px-1">
      {TABS.map((tab) => {
        const Icon = tab.icon
        // Active is derived from the nested pathname segment (the detail/map
        // pages live under /services/* and /emergency/*; everything else is a
        // supplier page).
        const active =
          tab.key === "suppliers"
            ? !pathname.startsWith(BASE + "/services") &&
              !pathname.startsWith(BASE + "/emergency")
            : pathname.startsWith(`${BASE}/${tab.key}`)
        return (
          <Link
            key={tab.key}
            href={tab.href}
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
