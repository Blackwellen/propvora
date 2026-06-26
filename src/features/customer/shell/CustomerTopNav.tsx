"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import PersonaLinks from "@/components/shell/PersonaLinks"
import {
  Home,
  Compass,
  BookOpen,
  Heart,
  MessageSquare,
  CalendarCheck,
  CreditCard,
  Star,
  HelpCircle,
  Bell,
  ChevronDown,
  UserCircle,
  Settings,
  Wallet,
  BellRing,
  ShieldCheck,
  Lock,
  LogOut,
  type LucideIcon,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   CustomerTopNav — the customer workspace chrome, 1:1 with the supplied design
   images: a flat full-width white header with the Propvora logo at far left, a
   centred icon+label primary nav (active item in Propvora blue with a blue
   underline), and a right cluster of a notification bell (numeric badge) and a
   circular avatar + name + chevron account menu.

   TOP NAVIGATION ONLY — there is deliberately NO sidebar in the customer
   workspace. Routes are the literal `/customer/*` paths from the build spec.
─────────────────────────────────────────────────────────────────────────── */

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Match these path prefixes for the active state (defaults to href). */
  match?: string[]
  badgeKey?: "messages"
}

const NAV: NavItem[] = [
  { label: "Home", href: "/customer", icon: Home, match: ["/customer", "/customer/home"] },
  { label: "Stays", href: "/customer/stays", icon: Compass },
  { label: "Lets", href: "/customer/lets", icon: BookOpen },
  { label: "Favourites", href: "/customer/favourites", icon: Heart },
  { label: "Messages", href: "/customer/messages", icon: MessageSquare, badgeKey: "messages" },
  { label: "Bookings", href: "/customer/bookings", icon: CalendarCheck },
  { label: "Payments", href: "/customer/payments", icon: CreditCard },
  { label: "Reviews", href: "/customer/reviews", icon: Star },
  { label: "Help", href: "/customer/help", icon: HelpCircle },
]

const ACCOUNT_MENU: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Profile settings", href: "/customer/account-settings?tab=profile", icon: UserCircle },
  { label: "Account settings", href: "/customer/account-settings", icon: Settings },
  { label: "Finance settings", href: "/customer/account-settings?tab=finance", icon: Wallet },
  { label: "Notifications", href: "/customer/account-settings?tab=notifications", icon: BellRing },
  { label: "Privacy", href: "/customer/account-settings?tab=privacy", icon: ShieldCheck },
  { label: "Security", href: "/customer/account-settings?tab=security", icon: Lock },
]

function initialsOf(name: string) {
  return (
    name.trim().split(/[\s@.]+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() ||
    "ME"
  )
}

function isActive(pathname: string, item: NavItem) {
  const matchers = item.match ?? [item.href]
  return matchers.some((m) => (m === "/customer" ? pathname === "/customer" : pathname === m || pathname.startsWith(m + "/") || pathname === m))
}

export default function CustomerTopNav({
  customerName = "Guest",
  customerEmail,
  avatarUrl,
  unreadNotifications = 0,
  unreadMessages = 0,
  brandLogoUrl,
}: {
  customerName?: string
  customerEmail?: string | null
  avatarUrl?: string | null
  unreadNotifications?: number
  unreadMessages?: number
  brandLogoUrl?: string | null
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function down(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", down)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("mousedown", down)
      document.removeEventListener("keydown", key)
    }
  }, [menuOpen])
  useEffect(() => setMenuOpen(false), [pathname])

  async function signOut() {
    const sb = createClient()
    await sb.auth.signOut()
    window.location.assign("/login")
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto max-w-[1480px] h-[68px] px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        {/* Logo — workspace brand logo when set, otherwise Propvora default. */}
        <Link href="/customer" aria-label="Propvora home" className="shrink-0 mr-2">
          <span className="relative block h-10 w-[180px]">
            <Image
              src={brandLogoUrl ?? "/propvora-logo-dark.png"}
              alt={brandLogoUrl ? "Workspace logo" : "Propvora"}
              fill
              className="object-contain object-left"
              priority
            />
          </span>
        </Link>

        {/* Primary nav — centred */}
        <nav
          aria-label="Primary"
          className="flex-1 hidden md:flex items-center justify-center gap-0.5 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          {NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item)
            const badge = item.badgeKey === "messages" ? unreadMessages : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 lg:px-3.5 h-[68px] text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                  active ? "text-[#2563EB]" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-[18px] h-[18px] shrink-0", active ? "text-[#2563EB]" : "text-slate-400")} />
                <span>{item.label}</span>
                {badge > 0 && (
                  <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
                {active && <span className="absolute left-2 right-2 bottom-0 h-[2.5px] rounded-full bg-[#2563EB]" />}
              </Link>
            )
          })}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto md:ml-0 shrink-0 flex items-center gap-2 lg:gap-3">
          {/* Notifications */}
          <Link
            href="/customer/account-settings?tab=notifications"
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          >
            <Bell className="w-[21px] h-[21px]" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>

          {/* Avatar + name + chevron */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Open account menu"
              className="flex items-center gap-2 rounded-full pl-0.5 pr-1.5 py-0.5 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              {avatarUrl ? (
                <span className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-slate-200">
                  <Image src={avatarUrl} alt={customerName} width={36} height={36} className="object-cover w-full h-full" />
                </span>
              ) : (
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[12px] font-bold shrink-0 ring-1 ring-slate-200">
                  {initialsOf(customerName)}
                </span>
              )}
              <span className="hidden sm:block text-[13.5px] font-semibold text-slate-800 max-w-[120px] truncate">{customerName}</span>
              <ChevronDown className={cn("hidden sm:block w-4 h-4 text-slate-400 transition-transform", menuOpen && "rotate-180")} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label="Account menu"
                className="absolute right-0 mt-2 w-[256px] bg-white rounded-2xl shadow-[0_12px_44px_rgba(15,23,42,0.16)] border border-slate-100 py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[13px] font-bold text-slate-900 truncate">{customerName}</p>
                  {customerEmail && <p className="text-[11px] text-slate-500 truncate mt-0.5">{customerEmail}</p>}
                </div>
                <div className="py-1">
                  {ACCOUNT_MENU.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-50"
                      >
                        <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
                {/* Cross-persona shortcuts — the customer shell has no
                    workspace switcher, so members who also run a property-
                    management or supplier workspace get explicit doors here.
                    Omitted entirely when there's no matching workspace. */}
                <PersonaLinks targets={["operator", "supplier"]} onNavigate={() => setMenuOpen(false)} />
                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400/50 focus-visible:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
