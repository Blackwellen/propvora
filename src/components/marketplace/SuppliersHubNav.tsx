"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, Wrench, AlertTriangle } from "lucide-react"

const BASE = "/app/marketplace/suppliers-hub"

const TABS = [
  { label: "Suppliers", href: BASE, icon: Store },
  { label: "Services",  href: `${BASE}/services`, icon: Wrench },
  { label: "Emergency", href: `${BASE}/emergency`, icon: AlertTriangle },
]

export default function SuppliersHubNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 mb-6 px-1">
      {TABS.map((tab) => {
        const Icon = tab.icon
        // Suppliers tab is active when we're at the base or on a slug/map that
        // doesn't belong to services or emergency.
        const active =
          tab.href === BASE
            ? pathname === BASE ||
              (pathname.startsWith(BASE + "/") &&
                !pathname.startsWith(BASE + "/services") &&
                !pathname.startsWith(BASE + "/emergency"))
            : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
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
