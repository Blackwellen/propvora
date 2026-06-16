"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
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
  CalendarCheck,
  MapPin,
  Users,
  X,
} from "lucide-react"
import { CUSTOMER_NAV, isCustomerNavActive } from "@/components/customer/nav"
import CustomerMobileBottomNav from "@/components/customer/CustomerMobileNav"

/* ──────────────────────────────────────────────────────────────────────────
   CustomerShell — chrome for the first-class customer/guest-type workspace
   (route group `(customer)`).

   SHELL MODEL: TOP-NAV ONLY (Airbnb account-area style). There is NO operator
   sidebar and NO operator workspace switcher. The top bar holds the brand, a
   horizontal section nav, an Airbnb-style search pill, and a personal ACCOUNT
   DROPDOWN (avatar → profile, saved, payments, notifications, sign out) — a
   personal-account menu, not a workspace switcher.

   Access is gated by real product membership (`customer_workspace_members`) in
   `(customer)/layout.tsx` — there are NO feature flags.

   Mobile (<md): the horizontal nav collapses; each page renders its own
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
  { label: "My Payments", href: "/user/payments", icon: CreditCard },
  { label: "Saved Places", href: "/user/saved", icon: Heart },
  { label: "Help", href: "/help", icon: LifeBuoy },
]

/* ── Airbnb-style search pill state ──────────────────────────────────────── */

interface SearchState {
  where: string
  checkin: string
  checkout: string
  adults: number
  children: number
  infants: number
}

const EMPTY_SEARCH: SearchState = {
  where: "",
  checkin: "",
  checkout: "",
  adults: 1,
  children: 0,
  infants: 0,
}

function buildSearchUrl(s: SearchState): string {
  const p = new URLSearchParams()
  if (s.where) p.set("where", s.where)
  if (s.checkin) p.set("checkin", s.checkin)
  if (s.checkout) p.set("checkout", s.checkout)
  const guests = s.adults + s.children
  if (guests > 0) p.set("guests", String(guests))
  if (s.infants > 0) p.set("infants", String(s.infants))
  const qs = p.toString()
  return qs ? `/stay/search?${qs}` : "/stay/search"
}

function pillLabel(s: SearchState): string {
  const parts: string[] = []
  parts.push(s.where || "Where")
  if (s.checkin && s.checkout) {
    parts.push(`${s.checkin} – ${s.checkout}`)
  } else {
    parts.push("Dates")
  }
  const g = s.adults + s.children
  parts.push(g > 0 ? `${g} guest${g === 1 ? "" : "s"}` : "Guests")
  return parts.join("  ·  ")
}

/* ── Search panel (popover on desktop, sheet on mobile) ─────────────────── */

function SearchPanel({
  initial,
  onClose,
  onSearch,
}: {
  initial: SearchState
  onClose: () => void
  onSearch: (s: SearchState) => void
}) {
  const [state, setState] = useState<SearchState>(initial)
  const panelRef = useRef<HTMLDivElement>(null)

  function set<K extends keyof SearchState>(k: K, v: SearchState[K]) {
    setState((prev) => ({ ...prev, [k]: v }))
  }

  function counter(label: string, sub: string, key: "adults" | "children" | "infants", min = 0) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set(key, Math.max(min, state[key] - 1))}
            disabled={state[key] <= min}
            aria-label={`Decrease ${label}`}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 disabled:opacity-30 hover:border-slate-400 transition-colors"
          >
            −
          </button>
          <span className="w-5 text-center text-sm font-semibold text-slate-800">{state[key]}</span>
          <button
            type="button"
            onClick={() => set(key, state[key] + 1)}
            aria-label={`Increase ${label}`}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-slate-400 transition-colors"
          >
            +
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Search stays"
      className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4"
    >
      {/* Close */}
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-slate-900">Find your next stay</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Where */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Where
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={state.where}
            onChange={(e) => set("where", e.target.value)}
            placeholder="City, region or property name…"
            autoFocus
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Check-in
          </label>
          <input
            type="date"
            value={state.checkin}
            onChange={(e) => set("checkin", e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Check-out
          </label>
          <input
            type="date"
            value={state.checkout}
            onChange={(e) => set("checkout", e.target.value)}
            min={state.checkin || undefined}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Guests */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Guests</span>
        </div>
        <div className="rounded-xl border border-slate-200 px-4">
          {counter("Adults", "Ages 13 or above", "adults", 1)}
          {counter("Children", "Ages 2–12", "children")}
          {counter("Infants", "Under 2", "infants")}
        </div>
      </div>

      {/* Search CTA */}
      <button
        type="button"
        onClick={() => onSearch(state)}
        className="w-full h-12 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <Search className="w-4 h-4" />
        Search stays
      </button>
    </div>
  )
}

/* ── Shell ─────────────────────────────────────────────────────────────────── */

export default function CustomerShell({
  children,
  customerName = "Customer",
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
  const router = useRouter()
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Scroll detection for sticky header style transition.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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

  // Close the search popover on outside-click or Escape.
  useEffect(() => {
    if (!searchOpen) return
    function onDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [searchOpen])

  // Close everything on route change.
  useEffect(() => {
    setAccountOpen(false)
    setSearchOpen(false)
  }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleSearch = useCallback(
    (s: SearchState) => {
      setSearchOpen(false)
      router.push(buildSearchUrl(s))
    },
    [router]
  )

  return (
    <div className="min-h-screen bg-[#F6FAFF] flex flex-col">
      <SkipLink />

      {/* ── Top nav: fixed, transparent at top, white+blur once scrolled. ── */}
      <header
        className={cn(
          "hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-200",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
            : "bg-white border-b border-slate-200"
        )}
      >
        <div className="max-w-[1440px] mx-auto w-full px-6 xl:px-8">
          <div className="flex items-center gap-4 h-16">

            {/* ── Brand (left) ── */}
            <Link
              href="/user"
              aria-label="Propvora customer home"
              className="flex items-center gap-2 shrink-0"
            >
              <div className="relative h-7 w-[132px]">
                <Image
                  src="/propvora-logo-dark.png"
                  alt="Propvora"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>

            {/* ── Primary nav links (left, after brand, hidden below lg) ── */}
            <nav
              aria-label="Customer account"
              className="hidden lg:flex items-center gap-0.5 min-w-0"
            >
              {CUSTOMER_NAV.map((item) => {
                const isActive = isCustomerNavActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative px-3 py-2 rounded-lg text-[13.5px] font-medium whitespace-nowrap transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
                      isActive
                        ? "text-[#2563EB]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#2563EB]" />
                    )}
                    {item.href === "/user/messages" && unreadMessages > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#2563EB] text-white text-[9px] font-bold">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* ── Airbnb-style search pill (centre) ── */}
            <div className="flex-1 flex justify-center px-4" ref={searchRef}>
              <button
                type="button"
                onClick={() => setSearchOpen((o) => !o)}
                aria-expanded={searchOpen}
                aria-haspopup="dialog"
                aria-label="Open search"
                className={cn(
                  "flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-medium transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
                  searchOpen
                    ? "border-[#2563EB] text-[#2563EB] bg-[#EFF6FF] shadow-md"
                    : "border-slate-300 text-slate-500 bg-white hover:border-slate-400 hover:shadow-sm"
                )}
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="max-w-[280px] truncate text-slate-600">{pillLabel(EMPTY_SEARCH)}</span>
              </button>

              {/* Search popover */}
              {searchOpen && (
                <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[520px] z-50">
                  <SearchPanel
                    initial={EMPTY_SEARCH}
                    onClose={() => setSearchOpen(false)}
                    onSearch={handleSearch}
                  />
                </div>
              )}
            </div>

            {/* ── Right cluster: messages, notifications, account ── */}
            <div className="ml-auto flex items-center gap-1 shrink-0">
              {/* Messages icon */}
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

              {/* Notifications icon */}
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

              {/* Account dropdown */}
              <div ref={menuRef} className="relative ml-1">
                <button
                  type="button"
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  aria-label="Account menu"
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                >
                  {/* Avatar: photo if available, else coloured initials */}
                  {avatarUrl ? (
                    <span className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200">
                      <Image
                        src={avatarUrl}
                        alt={customerName}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </span>
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {initialsOf(customerName)}
                    </span>
                  )}
                  <ChevronDown
                    className={cn("w-4 h-4 text-slate-400 transition-transform", accountOpen && "rotate-180")}
                  />
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    aria-label="Account"
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl py-2 z-50"
                  >
                    {/* User identity */}
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{customerName}</p>
                      {customerEmail && (
                        <p className="text-[11px] text-slate-500 truncate">{customerEmail}</p>
                      )}
                      {!customerEmail && (
                        <p className="text-[11px] text-slate-500">Personal account</p>
                      )}
                    </div>

                    {/* Links */}
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
                        href="/user/bookings"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:bg-slate-100"
                      >
                        <CalendarCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        My Trips
                      </Link>
                    </div>

                    {/* Sign out */}
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

      {/* Spacer for fixed header (md+) */}
      <div className="hidden md:block h-16 shrink-0" aria-hidden="true" />

      <main
        id="main-content"
        tabIndex={-1}
        aria-label="Main content"
        className="flex-1 min-w-0 overflow-x-hidden px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 pb-24 md:pb-10 max-w-[1440px] mx-auto w-full bg-[#F6FAFF] focus:outline-none"
      >
        {children}
      </main>

      {/* Dedicated mobile bottom nav (below md only). */}
      <CustomerMobileBottomNav />
    </div>
  )
}
