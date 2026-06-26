"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { OPEN_COPILOT_EVENT, type OpenCopilotDetail } from "@/lib/copilot/open"
import SkipLink from "@/components/a11y/SkipLink"
import ChatBubble from "@/components/ai/ChatBubble"
import ChatPanel from "@/components/ai/ChatPanel"
import {
  LogOut,
  LifeBuoy,
  UserCircle,
  Heart,
  CreditCard,
  CalendarCheck,
  Bell,
  MessageSquare,
  Home,
  Hotel,
  Star,
  HandCoins,
} from "lucide-react"
import { isCustomerNavActive } from "@/components/customer/nav"
import CustomerMobileBottomNav from "@/components/customer/CustomerMobileNav"

/* ──────────────────────────────────────────────────────────────────────────
   CustomerShell — the buyer/guest workspace now wears the SAME floating top
   toolbar as the operator / supplier workspaces (rounded white pill, backdrop
   blur, soft shadow). It carries the customer's own primary nav, a
   notifications widget and a circle avatar account menu, plus the shared
   Copilot/Inbox chat bubble.
─────────────────────────────────────────────────────────────────────────── */

function initialsOf(name: string) {
  return (
    name.trim().split(/[\s@.]+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() ||
    "ME"
  )
}

interface NavLink {
  label: string
  href: string
  icon: typeof Home
  /** Optional unread badge (e.g. Messages). */
  badgeKey?: "messages"
}

const NAV: NavLink[] = [
  { label: "Home", href: "/user", icon: Home },
  { label: "Stays", href: "/user/stays", icon: Hotel },
  { label: "Favourites", href: "/user/saved", icon: Heart },
  { label: "Messages", href: "/user/messages", icon: MessageSquare, badgeKey: "messages" },
  { label: "Bookings", href: "/user/bookings", icon: CalendarCheck },
  { label: "Payments", href: "/user/payments", icon: CreditCard },
  { label: "Reviews", href: "/user/reviews", icon: Star },
  { label: "Help", href: "/help", icon: LifeBuoy },
]

export default function CustomerShell({
  children,
  customerName = "Guest",
  customerEmail,
  avatarUrl,
  unreadNotifications = 0,
  unreadMessages = 0,
}: {
  children: React.ReactNode
  customerName?: string
  customerEmail?: string | null
  avatarUrl?: string | null
  unreadNotifications?: number
  unreadMessages?: number
}) {
  const pathname = usePathname()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Copilot / Inbox chat — same entry point as the operator & supplier shells.
  const [chatOpen, setChatOpen] = useState(false)
  const [copilotSummaryData, setCopilotSummaryData] = useState<Record<string, unknown> | undefined>(undefined)
  useEffect(() => {
    const open = (e: Event) => {
      const detail = (e as CustomEvent<OpenCopilotDetail>).detail
      if (detail?.summaryData) setCopilotSummaryData(detail.summaryData)
      setChatOpen(true)
    }
    window.addEventListener(OPEN_COPILOT_EVENT, open)
    return () => window.removeEventListener(OPEN_COPILOT_EVENT, open)
  }, [])

  // Close the account menu on outside click / Escape / route change.
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
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  async function signOut() {
    const sb = createClient()
    await sb.auth.signOut()
    window.location.assign("/login")
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app-shell)" }}>
      <SkipLink />

      {/* ── FLOATING TOP TOOLBAR (desktop) ──────────────────────────────────
          Matches the operator/supplier TopNavigation: rounded white pill,
          backdrop blur, soft shadow. Sticky so it floats over content. */}
      <div className="hidden md:block sticky top-0 z-50 px-4 lg:px-6 pt-4">
        <header
          style={{
            borderRadius: 24,
            background: "rgba(255, 255, 255, 0.94)",
            border: "1px solid #E2EAF6",
            boxShadow: "0 14px 40px rgba(15, 23, 42, 0.06)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
          className="mx-auto max-w-[1680px] flex items-center gap-2 lg:gap-3 px-3 lg:px-5 h-[72px]"
          aria-label="Customer toolbar"
        >
          {/* Logo */}
          <Link href="/user" aria-label="Propvora home" className="shrink-0 mr-1">
            <span className="relative block h-11 w-[188px]">
              <Image src="/propvora-logo-dark.png" alt="Propvora" fill className="object-contain object-left" priority />
            </span>
          </Link>

          {/* Primary nav — centred, fills the bar */}
          <nav
            aria-label="Primary"
            className="flex-1 flex items-center justify-center gap-0.5 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          >
            {NAV.map(({ label, href, icon: Icon, badgeKey }) => {
              const active = isCustomerNavActive(pathname, href)
              const badge = badgeKey === "messages" ? unreadMessages : 0
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors",
                    active
                      ? "bg-[#EFF6FF] text-[#1d4ed8]"
                      : "text-[#334155] hover:bg-slate-100 hover:text-[#0D1B2A]"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", active ? "text-[#2563EB]" : "text-slate-400")} />
                  <span>{label}</span>
                  {badge > 0 && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right cluster: notifications widget + circle avatar */}
          <div className="shrink-0 flex items-center gap-1.5 lg:gap-2">
            {/* Notifications */}
            <Link
              href="/user/notifications"
              aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
              className="relative w-[44px] h-[44px] rounded-2xl bg-white border border-[#E2EAF6] flex items-center justify-center text-[#071B4D] hover:bg-[#F0F7FF] hover:border-[#B9D2F3] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white" />
              )}
            </Link>

            {/* Circle avatar account menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open account menu"
                className="flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 transition-transform hover:scale-[1.04]"
              >
                {avatarUrl ? (
                  <span className="w-[42px] h-[42px] rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm">
                    <Image src={avatarUrl} alt={customerName} width={42} height={42} className="object-cover w-full h-full" />
                  </span>
                ) : (
                  <span className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[13px] font-bold shrink-0 ring-2 ring-white shadow-sm">
                    {initialsOf(customerName)}
                  </span>
                )}
              </button>

              {/* Account dropdown */}
              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 mt-2 w-[248px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.16)] border border-slate-100 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[13px] font-bold text-[#0D1B2A] truncate">{customerName}</p>
                    {customerEmail && <p className="text-[11px] text-slate-500 truncate mt-0.5">{customerEmail}</p>}
                  </div>

                  <div className="py-1">
                    {[
                      { label: "Bookings", href: "/user/bookings", icon: CalendarCheck },
                      { label: "Messages", href: "/user/messages", icon: MessageSquare, badge: unreadMessages },
                      { label: "Favourites", href: "/user/saved", icon: Heart },
                      { label: "Payments", href: "/user/payments", icon: CreditCard },
                      { label: "Reviews", href: "/user/reviews", icon: Star },
                      { label: "Affiliate", href: "/user/affiliate", icon: HandCoins },
                      { label: "Profile", href: "/user/profile", icon: UserCircle },
                      { label: "Help & support", href: "/help", icon: LifeBuoy },
                    ].map((item) => {
                      const Icon = item.icon
                      const isActive = isCustomerNavActive(pathname, item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:bg-slate-50",
                            isActive ? "text-[#2563EB] bg-[#EFF6FF]" : "text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#2563EB]" : "text-slate-400")} />
                          <span className="flex-1">{item.label}</span>
                          {"badge" in item && (item.badge as number) > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                              {(item.badge as number) > 9 ? "9+" : item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={signOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400/50 focus-visible:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-w-0 w-full mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8 py-5 lg:py-7 pb-24 md:pb-7 focus:outline-none"
      >
        {children}
      </main>

      {/* Mobile bottom nav (below md) */}
      <CustomerMobileBottomNav />

      {/* Copilot / Inbox chat bubble + panel — same as the workspace shells. */}
      <ChatBubble unreadCount={unreadMessages} onClick={() => setChatOpen((o) => !o)} isOpen={chatOpen} />
      <AnimatePresence>
        {chatOpen && <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} aiCopilotEnabled summaryData={copilotSummaryData} />}
      </AnimatePresence>
    </div>
  )
}
