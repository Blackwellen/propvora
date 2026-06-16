"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import SkipLink from "@/components/a11y/SkipLink"
import {
  LogOut,
  LifeBuoy,
  Bell,
  MessageSquare,
  Search,
  ChevronDown,
  UserCircle,
  Heart,
  CreditCard,
} from "lucide-react"
import { CUSTOMER_NAV, isCustomerNavActive } from "@/components/customer/nav"
import CustomerMobileBottomNav from "@/components/customer/CustomerMobileNav"

/* ──────────────────────────────────────────────────────────────────────────
   CustomerShell — chrome for the first-class customer/guest-type workspace
   (route group `(customer)`).

   SHELL MODEL: TOP-NAV ONLY (Airbnb account-area style). There is NO operator
   sidebar and NO operator workspace switcher. The top bar holds the brand, a
   horizontal section nav, search / messages / notifications icons, and a
   personal ACCOUNT DROPDOWN (avatar → profile, saved, payments, notifications,
   sign out) — a personal-account menu, not a workspace switcher.

   Access is gated by real product membership (`customer_workspace_members`) in
   `(customer)/layout.tsx` — there are NO feature flags.

   Mobile (<lg): the horizontal nav collapses; each page renders its own
   MobileTopBar and a dedicated bottom tab bar (CustomerMobileBottomNav) owns
   primary navigation.
─────────────────────────────────────────────────────────────────────────── */

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/[\s@.]+/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CU"
  )
}

const ACCOUNT_LINKS: { label: string; href: string; icon: React.ElementType }[] = [
  { label: "Profile", href: "/user/profile", icon: UserCircle },
  { label: "Saved", href: "/user/saved", icon: Heart },
  { label: "Payments", href: "/user/payments", icon: CreditCard },
  { label: "Notifications", href: "/user/notifications", icon: Bell },
]

export default function CustomerShell({
  children,
  customerName = "Customer",
  unreadNotifications = 0,
  unreadMessages = 0,
}: {
  children: React.ReactNode
  customerName?: string
  unreadNotifications?: number
  unreadMessages?: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [accountOpen, setAccountOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the account dropdown on outside-click, Escape, or route change.
  useEffect(() => {
    if (!accountOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [accountOpen])

  useEffect(() => {
    setAccountOpen(false)
  }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#F6FAFF] flex flex-col">
      <SkipLink />

      {/* ── Top nav (lg+). On mobile each page owns a MobileTopBar + bottom nav. ── */}
      <header className="hidden lg:block sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto w-full px-6 xl:px-8">
          <div className="flex items-center gap-6 h-16">
            {/* Brand */}
            <Link href="/user" aria-label="Propvora customer home" className="flex items-center gap-2 shrink-0">
              <div className="relative h-7 w-[132px]">
                <Image src="/propvora-logo-dark.png" alt="Propvora" fill className="object-contain object-left" priority />
              </div>
              <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold rounded tracking-wide">
                ACCOUNT
              </span>
            </Link>

            {/* Horizontal section nav */}
            <nav aria-label="Customer account" className="flex items-center gap-0.5 min-w-0 overflow-x-auto">
              {CUSTOMER_NAV.map((item) => {
                const isActive = isCustomerNavActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "px-3 py-2 rounded-lg text-[13.5px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
                      isActive ? "text-[#2563EB] bg-[#EFF6FF]" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right cluster: search, messages, notifications, account dropdown */}
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <Link
                href="/user/search"
                aria-label="Search"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
              >
                <Search className="w-5 h-5" />
              </Link>
              <Link
                href="/user/messages"
                aria-label={`Messages${unreadMessages > 0 ? `, ${unreadMessages} unread` : ""}`}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                href="/user/notifications"
                aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* Account dropdown (personal-account menu, NOT a workspace switcher) */}
              <div ref={menuRef} className="relative ml-1">
                <button
                  type="button"
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  aria-label="Account menu"
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                >
                  <span className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {initialsOf(customerName)}
                  </span>
                  <ChevronDown
                    className={cn("w-4 h-4 text-slate-400 transition-transform", accountOpen && "rotate-180")}
                  />
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    aria-label="Account"
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/8 py-2 z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{customerName}</p>
                      <p className="text-[11px] text-slate-500">Personal account</p>
                    </div>
                    <div className="py-1.5">
                      {ACCOUNT_LINKS.map((l) => {
                        const Icon = l.icon
                        return (
                          <Link
                            key={l.href}
                            href={l.href}
                            role="menuitem"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-100"
                          >
                            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                            {l.label}
                          </Link>
                        )
                      })}
                      <Link
                        href="/help"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-100"
                      >
                        <LifeBuoy className="w-4 h-4 text-slate-400 shrink-0" />
                        Help &amp; Guides
                      </Link>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        role="menuitem"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        aria-label="Main content"
        className="flex-1 min-w-0 overflow-x-hidden px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 pb-24 lg:pb-10 max-w-[1400px] mx-auto w-full bg-[#F6FAFF] focus:outline-none"
      >
        {children}
      </main>

      {/* Dedicated mobile bottom nav (below lg only). */}
      <CustomerMobileBottomNav />
    </div>
  )
}
