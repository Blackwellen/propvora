"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Wallet,
  Map,
  Users,
  Globe,
  Store,
  MessageSquare,
  Calculator,
  Calendar,
  ShieldCheck,
  Scale,
  Workflow,
  Settings,
  MoreHorizontal,
  HelpCircle,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileSheet from "./MobileSheet"
import MobileWorkspaceSwitcher from "./MobileWorkspaceSwitcher"

const MANAGER_BASE = "/property-manager"

interface NavDest {
  label: string
  href: string
  icon: LucideIcon
  /** Hidden unless navFlags[flag] === true (V2/V1.5 gating). */
  flag?: string
}

/* The 4 primary route destinations flanking the raised centre Copilot button:
   Home · Portfolio · [Copilot] · Work · More. Money and everything else live in
   the "More" sheet, which mirrors the desktop SideNavigation groups so nothing
   is lost. */
const PRIMARY_LEFT: NavDest[] = [
  { label: "Home", href: MANAGER_BASE, icon: LayoutDashboard },
  { label: "Portfolio", href: `${MANAGER_BASE}/portfolio`, icon: Building2 },
]
const PRIMARY_RIGHT: NavDest[] = [
  { label: "Work", href: `${MANAGER_BASE}/work`, icon: Briefcase },
]

const MORE_GROUPS: { label: string; items: NavDest[] }[] = [
  {
    label: "Core",
    items: [
      { label: "Bookings",  href: `${MANAGER_BASE}/bookings`,  icon: Calendar, flag: "bookingManagement" },
      // Suppliers hub — canonical path matches SideNavigation (/suppliers not /marketplace/suppliers)
      { label: "Suppliers", href: `${MANAGER_BASE}/suppliers`, icon: Store,    flag: "marketplaceEnabled" },
      // Planning — flag-gated same as SideNavigation
      { label: "Planning",  href: `${MANAGER_BASE}/planning`,  icon: Map,      flag: "planningEnabled" },
      { label: "Contacts",  href: `${MANAGER_BASE}/contacts`,  icon: Users },
      { label: "Portals",   href: `${MANAGER_BASE}/portals`,   icon: Globe },
      { label: "Messages",  href: `${MANAGER_BASE}/messages`,  icon: MessageSquare },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Money",      href: `${MANAGER_BASE}/money`,      icon: Wallet },
      { label: "Accounting", href: `${MANAGER_BASE}/accounting`, icon: Calculator, flag: "accountingGl" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Calendar",    href: `${MANAGER_BASE}/calendar`,    icon: Calendar },
      { label: "Compliance",  href: `${MANAGER_BASE}/compliance`,  icon: ShieldCheck },
      { label: "Legal",       href: `${MANAGER_BASE}/legal`,       icon: Scale,    flag: "legalSection" },
      // Automations-lite (canvasLite) — flag-gated same as SideNavigation
      { label: "Automations", href: `${MANAGER_BASE}/automations`, icon: Workflow, flag: "canvasLite" },
    ],
  },
  {
    label: "System",
    items: [{ label: "Workspace", href: `${MANAGER_BASE}/workspace-settings`, icon: Settings }],
  },
]

/** All hrefs reachable from the "More" sheet — used to light the More tab. */
const MORE_HREFS = MORE_GROUPS.flatMap((g) => g.items.map((i) => i.href))

function isActiveHref(pathname: string, href: string): boolean {
  return href === MANAGER_BASE ? pathname === MANAGER_BASE : pathname.startsWith(href)
}

interface MobileBottomNavProps {
  /** Whether the Copilot panel is currently open (lights the centre button). */
  chatOpen?: boolean
  /** Opens the global Copilot/Inbox panel (centre button). Does NOT navigate. */
  onOpenChat?: () => void
  /** Unread Copilot/Inbox count shown as a badge on the centre button. */
  unreadCount?: number
  /** Server-resolved feature flags; tagged items hidden when off. */
  navFlags?: Record<string, boolean>
}

/** A single flat tab (route link). */
function NavTab({ dest, active }: { dest: NavDest; active: boolean }) {
  const Icon = dest.icon
  return (
    <Link
      href={dest.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]/40 motion-reduce:transition-none",
        active ? "text-[var(--brand)]" : "text-slate-500 hover:text-slate-700"
      )}
    >
      <span
        className={cn(
          "w-9 h-7 rounded-lg flex items-center justify-center transition-colors",
          active ? "bg-[var(--brand-soft)]" : "bg-transparent"
        )}
      >
        <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className={cn("text-[10.5px] leading-none", active ? "font-bold" : "font-medium")}>
        {dest.label}
      </span>
    </Link>
  )
}

/**
 * Fixed bottom tab bar — the mobile counterpart to the desktop SideNavigation.
 * 5 slots: Home · Portfolio · raised Copilot/Inbox centre button · Work · More.
 *
 * The centre button OPENS the global ChatPanel (it never navigates), preserves
 * the unread count, and works in the installed PWA. Everything else not on the
 * bar lives in the "More" sheet, including Help & Guides.
 *
 * a11y: nav landmark, aria-current="page" on the active tab, descriptive
 * aria-label on the centre button, ≥44px targets, safe-area-inset-bottom
 * padding, reduced-motion respected. Rendered only below `lg`.
 */
export default function MobileBottomNav({
  chatOpen = false,
  onOpenChat,
  unreadCount = 0,
  navFlags,
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  // Flag gating: drop tagged V2/V1.5 items + any group left empty.
  const moreGroups = MORE_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.flag || navFlags?.[i.flag] === true) }))
    .filter((g) => g.items.length > 0)

  const moreActive = MORE_HREFS.some((h) => isActiveHref(pathname, h))

  return (
    <>
      <nav
        aria-label="Primary"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2EAF6] shadow-[0_-6px_24px_rgba(15,23,42,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="grid grid-cols-5 items-end">
          {PRIMARY_LEFT.map((dest) => (
            <li key={dest.href}>
              <NavTab dest={dest} active={isActiveHref(pathname, dest.href)} />
            </li>
          ))}

          {/* Centre — raised premium Copilot/Inbox button. Opens the panel. */}
          <li className="relative flex items-end justify-center min-h-[56px] pb-2">
            <button
              onClick={onOpenChat}
              aria-haspopup="dialog"
              aria-expanded={chatOpen}
              aria-label="Open Propvora Copilot and Inbox"
              className={cn(
                "relative -translate-y-3 w-[52px] h-[52px] rounded-full flex items-center justify-center bg-white",
                "ring-1 ring-[var(--brand)]/15",
                "shadow-[0_8px_24px_rgba(37,99,235,0.32),0_2px_8px_rgba(37,99,235,0.16)]",
                "active:scale-95 transition-transform motion-reduce:active:scale-100",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand)]/50"
              )}
            >
              {/* Top-gloss sheen */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 55%)",
                }}
              />
              <Image
                src="/propvora-favicon.png"
                alt=""
                width={30}
                height={30}
                className="w-[30px] h-[30px] object-contain relative"
                priority
              />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm pointer-events-none select-none"
                  aria-hidden
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </li>

          {PRIMARY_RIGHT.map((dest) => (
            <li key={dest.href}>
              <NavTab dest={dest} active={isActiveHref(pathname, dest.href)} />
            </li>
          ))}

          {/* More */}
          <li>
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="More navigation options"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-current={moreActive ? "page" : undefined}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]/40 motion-reduce:transition-none",
                moreActive ? "text-[var(--brand)]" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <span
                className={cn(
                  "w-9 h-7 rounded-lg flex items-center justify-center transition-colors",
                  moreActive ? "bg-[var(--brand-soft)]" : "bg-transparent"
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
        <div className="pb-2">
          {/* Workspace switcher — mobile counterpart of the desktop top-nav chip */}
          <MobileWorkspaceSwitcher onSwitch={() => setMoreOpen(false)} />
          {/* Flat icon-widget grid — no category labels on mobile */}
          <div className="grid grid-cols-4 gap-2">
            {moreGroups.flatMap((g) => g.items).map((item) => {
              const active = isActiveHref(pathname, item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40",
                    active
                      ? "bg-[var(--brand-soft)] border-[#BFD8FB] text-[var(--brand)]"
                      : "bg-white border-[#E8EEF8] text-slate-600 active:bg-slate-50"
                  )}
                >
                  <span className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    active ? "bg-[#DBEAFE]" : "bg-slate-50"
                  )}>
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[10.5px] font-semibold text-center leading-tight px-0.5">{item.label}</span>
                </Link>
              )
            })}
            {/* Help & Guides widget */}
            <Link
              href="/help"
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40",
                isActiveHref(pathname, "/help")
                  ? "bg-[var(--brand-soft)] border-[#BFD8FB] text-[var(--brand)]"
                  : "bg-white border-[#E8EEF8] text-slate-600 active:bg-slate-50"
              )}
            >
              <span className="w-9 h-9 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
                <HelpCircle className="w-[18px] h-[18px] text-[#7C3AED]" />
              </span>
              <span className="text-[10.5px] font-semibold text-center leading-tight px-0.5">Help</span>
            </Link>
          </div>
        </div>
      </MobileSheet>
    </>
  )
}
