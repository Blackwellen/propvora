"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface HmoTabStripProps {
  propertyId: string
}

export function HmoTabStrip({ propertyId }: HmoTabStripProps) {
  const pathname = usePathname()
  const base = `/property-manager/portfolio/properties/${propertyId}/hmo`

  const tabs = [
    { label: "Overview",  href: base },
    { label: "Rooms",     href: `${base}/rooms` },
    { label: "Utilities", href: `${base}/utilities` },
    { label: "Analytics", href: `${base}/analytics` },
  ]

  return (
    <div className="flex gap-1 px-4 md:px-6 border-b border-slate-200 bg-white overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
