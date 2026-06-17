"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import SkipLink from "@/components/a11y/SkipLink"
import {
  Search,
  Menu,
  LogOut,
  LifeBuoy,
  UserCircle,
  Heart,
  CreditCard,
  CalendarCheck,
  MapPin,
  Users,
  Globe,
  Bell,
  MessageSquare,
  Home,
  Palmtree,
  Building2,
  Waves,
  Trees,
  Mountain,
  Star,
  Flame,
} from "lucide-react"
import { isCustomerNavActive } from "@/components/customer/nav"
import CustomerMobileBottomNav from "@/components/customer/CustomerMobileNav"

/* ─── types ──────────────────────────────────────────────────────────────── */

type SearchSection = "where" | "checkin" | "checkout" | "guests" | null

interface SearchState {
  where: string
  checkin: string
  checkout: string
  adults: number
  children: number
  infants: number
}

const EMPTY: SearchState = { where: "", checkin: "", checkout: "", adults: 1, children: 0, infants: 0 }

function buildUrl(s: SearchState) {
  const p = new URLSearchParams()
  if (s.where) p.set("where", s.where)
  if (s.checkin) p.set("checkin", s.checkin)
  if (s.checkout) p.set("checkout", s.checkout)
  const g = s.adults + s.children
  if (g > 1 || s.infants > 0) {
    p.set("guests", String(g))
    if (s.infants) p.set("infants", String(s.infants))
  }
  return `/stay/search${p.toString() ? `?${p}` : ""}`
}

function initialsOf(name: string) {
  return name.trim().split(/[\s@.]+/).map(w => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "ME"
}

/* ─── category chips ─────────────────────────────────────────────────────── */

const CATEGORIES = [
  { label: "All", icon: Home },
  { label: "Trending", icon: Flame },
  { label: "Apartments", icon: Building2 },
  { label: "Countryside", icon: Trees },
  { label: "Beachfront", icon: Waves },
  { label: "Hillside", icon: Mountain },
  { label: "Luxury", icon: Star },
  { label: "Cabins", icon: Palmtree },
]

/* ─── guest counter row ──────────────────────────────────────────────────── */

function GuestRow({
  label, sub, value, min = 0, onChange,
}: { label: string; sub: string; value: number; min?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-[14px] font-semibold text-[#0D1B2A]">{label}</p>
        <p className="text-[12px] text-slate-500">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-[18px] leading-none text-slate-600 disabled:opacity-25 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
        >−</button>
        <span className="w-5 text-center text-[14px] font-semibold text-[#0D1B2A]">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-[18px] leading-none text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
        >+</button>
      </div>
    </div>
  )
}

/* ─── shell ──────────────────────────────────────────────────────────────── */

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
  const router = useRouter()

  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<SearchSection>(null)
  const [search, setSearch] = useState<SearchState>(EMPTY)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState("All")

  const searchBarRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // ── scroll detection ───────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  // ── close panels on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!activeSection && !menuOpen) return
    function down(e: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setActiveSection(null)
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") { setActiveSection(null); setMenuOpen(false) }
    }
    document.addEventListener("mousedown", down)
    document.addEventListener("keydown", key)
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key) }
  }, [activeSection, menuOpen])

  // ── close on route change ──────────────────────────────────────────────
  useEffect(() => { setActiveSection(null); setMenuOpen(false) }, [pathname])

  const set = useCallback(<K extends keyof SearchState>(k: K, v: SearchState[K]) => {
    setSearch(s => ({ ...s, [k]: v }))
  }, [])

  const handleSearch = useCallback(() => {
    setActiveSection(null)
    router.push(buildUrl(search))
  }, [router, search])

  async function signOut() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push("/login")
  }

  // ── pill labels ────────────────────────────────────────────────────────
  const guestCount = search.adults + search.children
  const guestLabel = guestCount === 1 && search.infants === 0
    ? "1 guest"
    : guestCount > 1 || search.infants > 0
    ? `${guestCount} guest${guestCount !== 1 ? "s" : ""}${search.infants ? `, ${search.infants} infant${search.infants !== 1 ? "s" : ""}` : ""}`
    : "Add guests"

  const compactLabel = [
    search.where || "Anywhere",
    search.checkin && search.checkout ? `${search.checkin} – ${search.checkout}` : "Any week",
    guestCount > 1 ? `${guestCount} guests` : "Add guests",
  ].join("  ·  ")

  // ── header height vars ─────────────────────────────────────────────────
  // Expanded: 80px bar + 56px category row = 136px total
  // Scrolled: 64px bar only
  const EXPANDED_H = 136
  const COMPACT_H = 64

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SkipLink />

      {/* ── FIXED HEADER ────────────────────────────────────────────────── */}
      <header
        className={cn(
          "hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_12px_rgba(0,0,0,0.08)]"
            : "bg-white border-b border-transparent"
        )}
      >
        {/* ── TOP BAR ─────────────────────────────────────────────────── */}
        <div className="max-w-[1760px] mx-auto w-full px-6 xl:px-10">
          <div
            className={cn(
              "flex items-center transition-all duration-300",
              scrolled ? "h-16 gap-4" : "h-20 gap-6"
            )}
          >

            {/* LOGO */}
            <Link href="/user" aria-label="Propvora home" className="shrink-0">
              <div className={cn("relative transition-all duration-300", scrolled ? "h-7 w-[120px]" : "h-8 w-[140px]")}>
                <Image src="/propvora-logo-dark.png" alt="Propvora" fill className="object-contain object-left" priority />
              </div>
            </Link>

            {/* ── SEARCH BAR (two states) ───────────────────────────── */}
            <div className="flex-1 flex justify-center" ref={searchBarRef}>
              {scrolled ? (
                /* COMPACT PILL — shown when scrolled */
                <button
                  type="button"
                  onClick={() => { setScrolled(false); setActiveSection("where") }}
                  className={cn(
                    "flex items-center gap-3 h-10 pl-4 pr-2 rounded-full border transition-all duration-200",
                    "border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
                    "hover:shadow-[0_3px_16px_rgba(0,0,0,0.16)] active:scale-[0.98]"
                  )}
                >
                  <span className="text-[13px] font-semibold text-[#0D1B2A] max-w-[340px] truncate">
                    {compactLabel}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
                    <Search className="w-3.5 h-3.5 text-white" />
                  </span>
                </button>
              ) : (
                /* EXPANDED 3-SECTION BAR — shown at top */
                <div
                  className={cn(
                    "relative flex rounded-full border bg-white transition-all duration-200 max-w-[820px] w-full",
                    activeSection
                      ? "shadow-[0_4px_24px_rgba(0,0,0,0.16)] border-transparent"
                      : "border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:shadow-[0_3px_16px_rgba(0,0,0,0.14)]"
                  )}
                >
                  {/* WHERE */}
                  <button
                    type="button"
                    onClick={() => setActiveSection(s => s === "where" ? null : "where")}
                    className={cn(
                      "flex flex-col items-start px-5 py-3 rounded-full flex-1 min-w-0 transition-colors text-left",
                      activeSection === "where" ? "bg-white rounded-full shadow-[0_2px_16px_rgba(0,0,0,0.12)]" : "hover:bg-slate-50"
                    )}
                  >
                    <span className="text-[11px] font-semibold text-[#0D1B2A] leading-none mb-0.5">Where</span>
                    {activeSection === "where" ? (
                      <input
                        autoFocus
                        type="text"
                        value={search.where}
                        onChange={e => set("where", e.target.value)}
                        placeholder="Search destinations"
                        className="w-full text-[13px] text-[#0D1B2A] placeholder:text-slate-400 bg-transparent border-0 outline-none leading-snug"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className={cn("text-[13px] leading-snug truncate", search.where ? "text-[#0D1B2A] font-medium" : "text-slate-400")}>
                        {search.where || "Search destinations"}
                      </span>
                    )}
                  </button>

                  <div className="w-px bg-slate-200 my-3 self-stretch shrink-0" />

                  {/* CHECK IN */}
                  <button
                    type="button"
                    onClick={() => setActiveSection(s => s === "checkin" ? null : "checkin")}
                    className={cn(
                      "flex flex-col items-start px-5 py-3 rounded-full transition-colors min-w-[130px]",
                      activeSection === "checkin" ? "bg-white rounded-full shadow-[0_2px_16px_rgba(0,0,0,0.12)]" : "hover:bg-slate-50"
                    )}
                  >
                    <span className="text-[11px] font-semibold text-[#0D1B2A] leading-none mb-0.5">Check in</span>
                    {activeSection === "checkin" ? (
                      <input
                        autoFocus
                        type="date"
                        value={search.checkin}
                        onChange={e => { set("checkin", e.target.value); setActiveSection("checkout") }}
                        className="text-[13px] text-[#0D1B2A] bg-transparent border-0 outline-none leading-snug w-full"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className={cn("text-[13px] leading-snug", search.checkin ? "text-[#0D1B2A] font-medium" : "text-slate-400")}>
                        {search.checkin || "Add dates"}
                      </span>
                    )}
                  </button>

                  <div className="w-px bg-slate-200 my-3 self-stretch shrink-0" />

                  {/* CHECK OUT */}
                  <button
                    type="button"
                    onClick={() => setActiveSection(s => s === "checkout" ? null : "checkout")}
                    className={cn(
                      "flex flex-col items-start px-5 py-3 rounded-full transition-colors min-w-[130px]",
                      activeSection === "checkout" ? "bg-white rounded-full shadow-[0_2px_16px_rgba(0,0,0,0.12)]" : "hover:bg-slate-50"
                    )}
                  >
                    <span className="text-[11px] font-semibold text-[#0D1B2A] leading-none mb-0.5">Check out</span>
                    {activeSection === "checkout" ? (
                      <input
                        autoFocus
                        type="date"
                        value={search.checkout}
                        onChange={e => set("checkout", e.target.value)}
                        min={search.checkin || undefined}
                        className="text-[13px] text-[#0D1B2A] bg-transparent border-0 outline-none leading-snug w-full"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className={cn("text-[13px] leading-snug", search.checkout ? "text-[#0D1B2A] font-medium" : "text-slate-400")}>
                        {search.checkout || "Add dates"}
                      </span>
                    )}
                  </button>

                  <div className="w-px bg-slate-200 my-3 self-stretch shrink-0" />

                  {/* GUESTS + SEARCH BTN */}
                  <button
                    type="button"
                    onClick={() => setActiveSection(s => s === "guests" ? null : "guests")}
                    className={cn(
                      "flex items-center gap-3 pl-5 pr-2 py-2 rounded-full transition-colors min-w-[160px]",
                      activeSection === "guests" ? "bg-white rounded-full shadow-[0_2px_16px_rgba(0,0,0,0.12)]" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-[#0D1B2A] leading-none mb-0.5">Who</span>
                      <span className={cn("text-[13px] leading-snug truncate", guestCount > 1 || search.infants > 0 ? "text-[#0D1B2A] font-medium" : "text-slate-400")}>
                        {guestLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleSearch() }}
                      aria-label="Search stays"
                      className={cn(
                        "shrink-0 h-10 rounded-full flex items-center gap-2 transition-all font-semibold text-white",
                        activeSection
                          ? "px-4 bg-[#2563EB] hover:bg-[#1d4ed8] shadow-[0_4px_12px_rgba(37,99,235,0.4)]"
                          : "w-10 bg-[#2563EB] hover:bg-[#1d4ed8] justify-center"
                      )}
                    >
                      <Search className="w-4 h-4 shrink-0" />
                      {activeSection && <span className="text-[13px]">Search</span>}
                    </button>
                  </button>

                  {/* ── SECTION DROP-DOWN PANELS ─────────────────────── */}

                  {/* WHERE panel */}
                  {activeSection === "where" && (
                    <div className="absolute top-[calc(100%+12px)] left-0 w-[360px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-50">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Suggested</p>
                      {[
                        { label: "London", sub: "United Kingdom", icon: "🇬🇧" },
                        { label: "Manchester", sub: "United Kingdom", icon: "🇬🇧" },
                        { label: "Edinburgh", sub: "Scotland", icon: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
                        { label: "Bristol", sub: "South West", icon: "🇬🇧" },
                        { label: "Birmingham", sub: "West Midlands", icon: "🇬🇧" },
                      ].map(loc => (
                        <button
                          key={loc.label}
                          type="button"
                          onClick={() => { set("where", loc.label); setActiveSection("checkin") }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                        >
                          <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                            <MapPin className="w-4 h-4 text-slate-500" />
                          </span>
                          <div>
                            <p className="text-[13px] font-semibold text-[#0D1B2A]">{loc.label}</p>
                            <p className="text-[12px] text-slate-500">{loc.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* GUESTS panel */}
                  {activeSection === "guests" && (
                    <div className="absolute top-[calc(100%+12px)] right-0 w-[340px] bg-white rounded-3xl shadow-2xl border border-slate-100 px-6 py-4 z-50">
                      <GuestRow label="Adults" sub="Ages 13 or above" value={search.adults} min={1} onChange={v => set("adults", v)} />
                      <GuestRow label="Children" sub="Ages 2–12" value={search.children} onChange={v => set("children", v)} />
                      <GuestRow label="Infants" sub="Under 2" value={search.infants} onChange={v => set("infants", v)} />
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="mt-4 w-full h-11 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-full font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.35)]"
                      >
                        <Search className="w-4 h-4" />
                        Search stays
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT CLUSTER ─────────────────────────────────────── */}
            <div className="shrink-0 flex items-center gap-1 ml-auto">
              {/* Primary nav links — visible on lg+ so common destinations don't need the account menu */}
              {[
                { label: "Home", href: "/user" },
                { label: "Stays", href: "/user/stays" },
                { label: "My Trips", href: "/user/bookings" },
                { label: "Saved", href: "/user/saved" },
              ].map(({ label, href }) => {
                const active = isCustomerNavActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "hidden lg:flex items-center px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap",
                      active
                        ? "bg-slate-100 text-[#0D1B2A]"
                        : "text-[#0D1B2A] hover:bg-slate-100"
                    )}
                  >
                    {label}
                  </Link>
                )
              })}

              {/* Divider */}
              <div className="hidden lg:block w-px h-5 bg-slate-200 mx-1" />

              {/* List your property CTA */}
              <Link
                href="/register?intent=operator"
                className="hidden xl:flex items-center px-4 py-2 rounded-full text-[13px] font-semibold text-[#0D1B2A] hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                List your property
              </Link>

              {/* Globe / language */}
              <button
                type="button"
                aria-label="Language & region"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* Notification bell */}
              <Link
                href="/user/notifications"
                aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2563EB]" />
                )}
              </Link>

              {/* Messages */}
              <Link
                href="/user/messages"
                aria-label={`Messages${unreadMessages > 0 ? `, ${unreadMessages} unread` : ""}`}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2563EB]" />
                )}
              </Link>

              {/* ── ACCOUNT PILL (hamburger + avatar) ─────────────── */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(o => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Open account menu"
                  className={cn(
                    "flex items-center gap-2 pl-3 pr-1.5 h-10 rounded-full border transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
                    menuOpen
                      ? "border-slate-300 shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                      : "border-slate-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
                  )}
                >
                  <Menu className="w-4 h-4 text-[#0D1B2A]" />
                  {avatarUrl ? (
                    <span className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-slate-200">
                      <Image src={avatarUrl} alt={customerName} width={32} height={32} className="object-cover w-full h-full" />
                    </span>
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                      {initialsOf(customerName)}
                    </span>
                  )}
                </button>

                {/* ACCOUNT DROPDOWN */}
                {menuOpen && (
                  <div
                    role="menu"
                    aria-label="Account menu"
                    className="absolute right-0 mt-2 w-[240px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.16)] border border-slate-100 py-2 z-50"
                  >
                    {/* Identity */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[13px] font-bold text-[#0D1B2A] truncate">{customerName}</p>
                      {customerEmail && <p className="text-[11px] text-slate-500 truncate mt-0.5">{customerEmail}</p>}
                    </div>

                    <div className="py-1">
                      {[
                        { label: "My Trips", href: "/user/bookings", icon: CalendarCheck },
                        { label: "Messages", href: "/user/messages", icon: MessageSquare, badge: unreadMessages },
                        { label: "Saved Places", href: "/user/saved", icon: Heart },
                        { label: "My Payments", href: "/user/payments", icon: CreditCard },
                        { label: "Profile", href: "/user/profile", icon: UserCircle },
                        { label: "Help & support", href: "/help", icon: LifeBuoy },
                      ].map(item => {
                        const Icon = item.icon
                        const isActive = isCustomerNavActive(pathname, item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors",
                              "focus-visible:outline-none focus-visible:bg-slate-50",
                              isActive ? "text-[#2563EB] bg-[#EFF6FF]" : "text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#2563EB]" : "text-slate-400")} />
                            <span className="flex-1">{item.label}</span>
                            {"badge" in item && (item.badge as number) > 0 && (
                              <span className="min-w-[18px] h-4.5 px-1.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
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
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none"
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

        {/* ── CATEGORY FILTER ROW (visible only when not scrolled) ─── */}
        <div
          className={cn(
            "border-t border-slate-100 overflow-hidden transition-all duration-300",
            scrolled ? "h-0 opacity-0" : "h-14 opacity-100"
          )}
        >
          <div className="max-w-[1760px] mx-auto px-6 xl:px-10 h-14 flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.label
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setActiveCategory(cat.label)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all shrink-0",
                    isActive
                      ? "bg-[#0D1B2A] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div
        className="hidden md:block shrink-0 transition-all duration-300"
        style={{ height: scrolled ? COMPACT_H : EXPANDED_H }}
        aria-hidden="true"
      />

      {/* ── MAIN ─────────────────────────────────────────────────────── */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 min-w-0 focus:outline-none"
      >
        {children}
      </main>

      {/* Mobile bottom nav */}
      <CustomerMobileBottomNav />
    </div>
  )
}
