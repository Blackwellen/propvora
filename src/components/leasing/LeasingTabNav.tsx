"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Home,
  Users,
  CalendarCheck,
  FileSignature,
} from "lucide-react"

const LEASING_TABS = [
  { key: "overview",   label: "Overview",   href: "/app/portfolio/leasing",            icon: LayoutDashboard },
  { key: "vacancies",  label: "Vacancies",  href: "/app/portfolio/leasing/vacancies",  icon: Home },
  { key: "prospects",  label: "Prospects",  href: "/app/portfolio/leasing/prospects",  icon: Users },
  { key: "viewings",   label: "Viewings",   href: "/app/portfolio/leasing/viewings",   icon: CalendarCheck },
  { key: "agreements", label: "Agreements", href: "/app/portfolio/leasing/agreements", icon: FileSignature },
] as const

export function LeasingTabNav({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {LEASING_TABS.map((tab) => {
            const active =
              tab.key === "overview"
                ? pathname === "/app/portfolio/leasing" ||
                  pathname.startsWith("/app/portfolio/leasing/overview")
                : pathname.startsWith(tab.href)
            const Icon = tab.icon
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                  active
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </Link>
            )
          })}
        </div>
        {actions && <div className="px-4 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
