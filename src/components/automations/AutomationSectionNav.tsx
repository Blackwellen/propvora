"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AUTOMATION_NAV_ITEMS } from "@/lib/automation/node-registry"

function isActive(pathname: string, itemMatch: string[]) {
  const normalized = pathname.replace(/^\/property-manager/, "/app")
  return itemMatch.some((match) => {
    const target = `/app${match}`
    if (target === "/app/automations") return normalized === target
    return normalized === target || normalized.startsWith(`${target}/`)
  })
}

export default function AutomationSectionNav() {
  const pathname = usePathname()

  return (
    <nav className="overflow-x-auto border-b border-slate-200 pb-2" aria-label="Automation sections">
      <div className="flex min-w-max gap-2">
        {AUTOMATION_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.match)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
