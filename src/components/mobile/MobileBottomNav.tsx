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

const MANAGER_BASE = "/property-manager"

interface NavDest {
  label: string
  href: string
  icon: LucideIcon
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
      { label: "Bookings", href: `${MANAGER_BASE}/bookings`, icon: Calendar },
      { label: "Marketplace", href: `${MANAGER_BASE}/marketplace`, icon: Globe },
      { label: "Planning", href: `${MANAGER_BASE}/planning`, icon: Map },
      { label: "Contacts", href: `${MANAGER_BASE}/contacts`, icon: Users },
      { label: "Portals", href: `${MANAGER_BASE}/portals`, icon: Globe },
      { label: "Messages", href: `${MANAGER_BASE}/messages`, icon: MessageSquare },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Money", href: `${MANAGER_BASE}/money`, icon: Wallet },
      { label: "Accounting", href: `${MANAGER_BASE}/accounting`, icon: Calculator },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Calendar", href: `${MANAGER_BASE}/calendar`, icon: Calendar },
      { label: "Compliance", href: `${MANAGER_BASE}/compliance`, icon: ShieldCheck },
      { label: "Legal", href: `${MANAGER_BASE}/legal`, icon: Scale },
      { label: "Automations", href: `${MANAGER_BASE}/automations`, icon: Workflow },
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
}

/** A single flat tab (route link). */
function NavTab({ dest, active }: { dest: NavDest; active: boolean }) {
  const Icon = dest.icon
  return (
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
}: MobileBottomNavProps) {
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
        <ul className="grid grid-cols-5 items-end">
          {PRIMARY_LEFT.map((dest) => (
            <li key={dest.href}>
              <NavTab dest={dest} active={isActiveHref(pathname, dest.href)} />
            </li>
          ))}

          {/* Centre — raised premium Copilot/Inbox button. Opens the panel. */}
          <li className="relative">
            <div className="flex flex-col items-center justify-end min-h-[56px]">
              <button
                onClick={onOpenChat}
                aria-haspopup="dialog"
                aria-expanded={chatOpen}
                aria-label="Open Propvora Copilot and Inbox"
                className={cn(
                  "relative -mt-7 w-14 h-14 rounded-full flex items-center justify-center bg-white",
                  "ring-1 ring-[#2563EB]/15",
                  "shadow-[0_8px_24px_rgba(37,99,235,0.32),0_2px_8px_rgba(37,99,235,0.16)]",
                  "active:scale-95 transition-transform motion-reduce:active:scale-100",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/50"
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
              <span
                className={cn(
                  "text-[10.5px] leading-none -mt-1 pb-1.5",
                  chatOpen ? "text-[#2563EB] font-bold" : "text-slate-500 font-semibold"
                )}
              >
                AI
              </span>
            </div>
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

          {/* Help & Guides — surfaced here on mobile/PWA (the floating help
              launcher is hidden below lg so it never blocks the bottom nav). */}
          <div>
            <p className="px-2 pb-1.5 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
              Support
            </p>
            <Link
              href="/help"
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 min-h-[56px] rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
                isActiveHref(pathname, "/help")
                  ? "bg-[#EFF6FF] border-[#BFD8FB] text-[#2563EB]"
                  : "bg-white border-[#E8EEF8] text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="w-9 h-9 rounded-xl bg-[#F5F3FF] flex items-center justify-center shrink-0">
                <HelpCircle className="w-[18px] h-[18px] text-[#7C3AED]" />
              </span>
              <span className="text-[13.5px] font-semibold">Help &amp; Guides</span>
            </Link>
          </div>
        </div>
      </MobileSheet>
    </>
  )
}
