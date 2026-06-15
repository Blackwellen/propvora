"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Wallet,
  Map,
  Users,
  Globe,
  MessageSquare,
  Calculator,
  Calendar,
  ShieldCheck,
  Scale,
  Workflow,
  Settings,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileSheet from "./MobileSheet"

interface NavDest {
  label: string
  href: string
  icon: LucideIcon
}

/* The 5 primary destinations on the bottom bar — chosen as the highest-traffic
   surfaces. Everything else lives in the "More" sheet, mirroring the desktop
   SideNavigation groups so nothing is lost. */
const PRIMARY: NavDest[] = [
  { label: "Home", href: "/app", icon: LayoutDashboard },
  { label: "Portfolio", href: "/app/portfolio", icon: Building2 },
  { label: "Work", href: "/app/work", icon: Briefcase },
  { label: "Money", href: "/app/money", icon: Wallet },
]

const MORE_GROUPS: { label: string; items: NavDest[] }[] = [
  {
    label: "Core",
    items: [
      { label: "Planning", href: "/app/planning", icon: Map },
      { label: "Contacts", href: "/app/contacts", icon: Users },
      { label: "Portals", href: "/app/portals", icon: Globe },
      { label: "Messages", href: "/app/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Finance",
    items: [{ label: "Accounting", href: "/app/accounting", icon: Calculator }],
  },
  {
    label: "Operations",
    items: [
      { label: "Calendar", href: "/app/calendar", icon: Calendar },
      { label: "Compliance", href: "/app/compliance", icon: ShieldCheck },
      { label: "Legal", href: "/app/legal", icon: Scale },
      { label: "Smart Rules", href: "/app/automations", icon: Workflow },
    ],
  },
  {
    label: "System",
    items: [{ label: "Workspace", href: "/app/workspace-settings", icon: Settings }],
  },
]

/** All hrefs reachable from the "More" sheet — used to light the More tab. */
const MORE_HREFS = MORE_GROUPS.flatMap((g) => g.items.map((i) => i.href))

function isActiveHref(pathname: string, href: string): boolean {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href)
}

/**
 * Fixed bottom tab bar — the mobile counterpart to the desktop SideNavigation.
 * 5 slots: 4 primary destinations + a "More" sheet holding the rest.
 *
 * a11y: nav landmark, aria-current="page" on the active tab, ≥44px targets,
 * safe-area-inset-bottom padding, reduced-motion respected. Rendered only below
 * `lg` (the desktop sidebar stays untouched).
 */
export default function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = MORE_HREFS.some((h) => isActiveHref(pathname, h))

  return (
    <>
      <nav
        aria-label="Primary"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2EAF6] shadow-[0_-6px_24px_rgba(15,23,42,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="flex items-stretch">
          {PRIMARY.map((dest) => {
            const active = isActiveHref(pathname, dest.href)
            const Icon = dest.icon
            return (
              <li key={dest.href} className="flex-1">
                <Link
                  href={dest.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]/40 motion-reduce:transition-none",
                    active ? "text-[#2563EB]" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "w-9 h-7 rounded-lg flex items-center justify-center transition-colors",
                      active ? "bg-[#EFF6FF]" : "bg-transparent"
                    )}
                  >
                    <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.4 : 2} />
                  </span>
                  <span className={cn("text-[10.5px] leading-none", active ? "font-bold" : "font-medium")}>
                    {dest.label}
                  </span>
                </Link>
              </li>
            )
          })}

          {/* More */}
          <li className="flex-1">
            <button
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-current={moreActive ? "page" : undefined}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]/40 motion-reduce:transition-none",
                moreActive ? "text-[#2563EB]" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <span
                className={cn(
                  "w-9 h-7 rounded-lg flex items-center justify-center transition-colors",
                  moreActive ? "bg-[#EFF6FF]" : "bg-transparent"
                )}
              >
                <MoreHorizontal className="w-[19px] h-[19px]" strokeWidth={moreActive ? 2.4 : 2} />
              </span>
              <span className={cn("text-[10.5px] leading-none", moreActive ? "font-bold" : "font-medium")}>
                More
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <MobileSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More" description="Jump to any section">
        <div className="pb-2 space-y-4">
          {MORE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1.5 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {group.items.map((item) => {
                  const active = isActiveHref(pathname, item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 min-h-[76px] rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
                        active
                          ? "bg-[#EFF6FF] border-[#BFD8FB] text-[#2563EB]"
                          : "bg-white border-[#E8EEF8] text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-[20px] h-[20px]" />
                      <span className="text-[11.5px] font-semibold text-center px-1 leading-tight">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </MobileSheet>
    </>
  )
}
