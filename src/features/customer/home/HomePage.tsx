"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar, ShoppingBag, Heart, MessageSquare, BadgePercent, MapPin, Users, Search,
  ChevronRight, Bookmark, Gift, Headphones, ShieldCheck, Settings2, CheckCircle2,
  CalendarCheck, CreditCard, FileText, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomerPropertyCard } from "../components/PropertyCard"
import { useCustomerToast } from "../components/toast"
import {
  homeStats, upcomingStays, recommended, recentActivity, account, type HomeStat, type ActivityItem,
} from "../data/mock"

const STAT_ICON: Record<HomeStat["icon"], typeof Calendar> = {
  calendar: Calendar, bag: ShoppingBag, heart: Heart, chat: MessageSquare, offer: BadgePercent,
}
const STAT_ICON_BG: Record<HomeStat["accent"], string> = {
  blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", red: "bg-rose-50 text-rose-500",
  violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600",
}
const SUB_ACCENT: Record<HomeStat["subAccent"], string> = {
  blue: "text-blue-600", amber: "text-amber-600", red: "text-rose-500",
  violet: "text-violet-600", emerald: "text-emerald-600", slate: "text-slate-500",
}
const ACTIVITY_ICON: Record<ActivityItem["icon"], typeof Calendar> = {
  booking: CalendarCheck, message: MessageSquare, payment: CreditCard, document: FileText, viewing: Calendar, offer: BadgePercent,
}
const ACTIVITY_BG: Record<ActivityItem["accent"], string> = {
  emerald: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600", blue: "bg-blue-50 text-blue-600",
}

const QUICK_ACTIONS = [
  { id: "search", icon: Search, title: "Search stays", sub: "Find your next stay", href: "/customer/stays" },
  { id: "collections", icon: Bookmark, title: "Browse collections", sub: "Curated places to stay", href: "/customer/favourites" },
  { id: "invite", icon: Gift, title: "Invite friends", sub: "Earn credit when they book", href: "/customer/account-settings?tab=referrals" },
  { id: "support", icon: Headphones, title: "Customer support", sub: "Get help when you need it", href: "/customer/help" },
]

export default function HomePage({ firstName = "Sarah" }: { firstName?: string }) {
  const router = useRouter()
  const { toast } = useCustomerToast()
  const [where, setWhere] = useState("")
  const [saved, setSaved] = useState<Record<string, boolean>>(
    () => Object.fromEntries(recommended.map((p) => [p.id, !!p.saved]))
  )

  function search() {
    const q = where.trim()
    router.push(q ? `/customer/stays?where=${encodeURIComponent(q)}` : "/customer/stays")
  }
  function toggleSave(id: string) {
    setSaved((s) => {
      const next = { ...s, [id]: !s[id] }
      toast(next[id] ? "Saved to favourites" : "Removed from favourites", next[id] ? "success" : "info")
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/property-types/holiday.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/55 to-slate-900/20" />
        <div className="relative px-6 sm:px-10 py-10 sm:py-12">
          <h1 className="text-white text-[28px] sm:text-[32px] font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
          <p className="text-white/85 text-[14.5px] mt-2 max-w-md">
            Discover incredible places to stay and unforgettable experiences, all in one place.
          </p>

          <div className="mt-6 bg-white rounded-2xl shadow-[0_18px_50px_rgba(15,23,42,0.18)] p-2 flex flex-col sm:flex-row items-stretch gap-1 max-w-3xl">
            <SearchSeg icon={MapPin} label="Where to?">
              <input
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Search destinations"
                className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 outline-none"
              />
            </SearchSeg>
            <Divider />
            <SearchSeg icon={Calendar} label="Check in">
              <button onClick={() => toast("Date picker — coming soon", "info")} className="text-[13px] text-slate-400 text-left w-full">Add dates</button>
            </SearchSeg>
            <Divider />
            <SearchSeg icon={Calendar} label="Check out">
              <button onClick={() => toast("Date picker — coming soon", "info")} className="text-[13px] text-slate-400 text-left w-full">Add dates</button>
            </SearchSeg>
            <Divider />
            <SearchSeg icon={Users} label="Guests">
              <button onClick={() => toast("Guest picker — coming soon", "info")} className="text-[13px] text-slate-600 text-left w-full">2 guests</button>
            </SearchSeg>
            <button
              onClick={search}
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#0D1B2A] hover:bg-[#0b1622] text-white rounded-xl px-5 py-3 text-[13.5px] font-semibold"
            >
              <Search className="w-4 h-4" /> Search stays
            </button>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {homeStats.map((s) => {
          const Icon = STAT_ICON[s.icon]
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", STAT_ICON_BG[s.accent])}>
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <p className="text-[22px] font-bold text-slate-900 mt-3 leading-none">{s.value}</p>
              <p className="text-[12.5px] font-medium text-slate-500 mt-1">{s.label}</p>
              <p className={cn("text-[11.5px] font-semibold mt-1.5", SUB_ACCENT[s.subAccent])}>{s.sub}</p>
            </div>
          )
        })}
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-6">
          {/* Upcoming stays */}
          <Card>
            <CardHead title="Upcoming stays" href="/customer/bookings" linkLabel="View all bookings" />
            <ul className="divide-y divide-slate-100">
              {upcomingStays.map((s) => (
                <li key={s.id} className="flex items-center gap-4 py-4 first:pt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "inline-block text-[10.5px] font-semibold rounded-full px-2 py-0.5 mb-1",
                      s.status === "Confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>{s.status}</span>
                    <p className="text-[14px] font-semibold text-slate-900 truncate">{s.title}</p>
                    <p className="text-[12.5px] text-slate-500 truncate">{s.location}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> {s.dateRange}
                      <Users className="w-3.5 h-3.5 ml-1" /> {s.guests} guests
                    </p>
                  </div>
                  <div className="text-center bg-slate-50 rounded-xl px-3 py-2 shrink-0">
                    <p className="text-[10px] text-slate-400 font-medium">Check-in</p>
                    <p className="text-[13px] font-bold text-slate-800">{s.checkInDay}</p>
                    <p className="text-[10.5px] text-slate-400">{s.checkInTime}</p>
                  </div>
                  <Link href={`/customer/bookings/${s.id}`} className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* Recommended */}
          <Card>
            <CardHead title="Recommended for you" href="/customer/stays" linkLabel="View all stays" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {recommended.map((p) => (
                <CustomerPropertyCard key={p.id} p={{ ...p, saved: saved[p.id] }} onToggleSave={toggleSave} />
              ))}
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHead title="Recent activity" href="/customer/account-settings?tab=activity" linkLabel="View all activity" />
            <ul className="space-y-1">
              {recentActivity.map((a) => {
                const Icon = ACTIVITY_ICON[a.icon]
                return (
                  <li key={a.id} className="flex items-center gap-3 py-2">
                    <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", ACTIVITY_BG[a.accent])}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-800">{a.title}</p>
                      <p className="text-[12px] text-slate-500 truncate">{a.subtitle}</p>
                    </div>
                    <span className="text-[12px] text-slate-400 shrink-0">{a.when}</span>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>

        {/* Right rail */}
        <aside className="space-y-6">
          {/* Quick actions */}
          <Card>
            <h3 className="text-[15px] font-bold text-slate-900 mb-3">Quick actions</h3>
            <ul className="space-y-1">
              {QUICK_ACTIONS.map((q) => {
                const Icon = q.icon
                return (
                  <li key={q.id}>
                    <Link href={q.href} className="flex items-center gap-3 py-2.5 group">
                      <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0">
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-slate-800">{q.title}</p>
                        <p className="text-[12px] text-slate-500 truncate">{q.sub}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* Account summary */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-slate-900">Account summary</h3>
              <Link href="/customer/account-settings" className="text-[12.5px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                View profile <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <dl className="space-y-2.5">
              <SummaryRow label="Full name" value={account.fullName} />
              <SummaryRow label="Email address" value={account.email} />
              <SummaryRow label="Phone number" value={account.phone} />
              <SummaryRow label="Member since" value={account.memberSince} />
              <div className="flex items-center justify-between">
                <dt className="text-[12.5px] text-slate-500">Verification</dt>
                <dd className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </dd>
              </div>
            </dl>
          </Card>

          {/* Invite promo */}
          <div className="relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/property-types/holiday.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#0D1B2A]/85" />
            <div className="relative p-5">
              <h3 className="text-white text-[15px] font-bold">Invite friends, earn credit</h3>
              <p className="text-white/80 text-[12.5px] mt-1">Give £25, get £25 when they book their first stay.</p>
              <button
                onClick={() => toast("Referral link copied to clipboard", "success")}
                className="mt-3 inline-flex items-center gap-2 bg-white text-[#0D1B2A] rounded-xl px-4 py-2 text-[13px] font-semibold hover:bg-slate-100"
              >
                Invite friends <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trust & safety */}
          <Card>
            <h3 className="text-[15px] font-bold text-slate-900 mb-3">Trust &amp; safety</h3>
            <ul className="space-y-3">
              <TrustRow icon={ShieldCheck} title="Secure payments" sub="Your payments are protected" />
              <TrustRow icon={Settings2} title="Verified hosts" sub="All hosts are checked and verified" />
            </ul>
            <Link href="/customer/help" className="mt-3 inline-block text-[12.5px] font-semibold text-blue-600 hover:text-blue-700">
              Learn more about safety →
            </Link>
          </Card>
        </aside>
      </section>
    </div>
  )
}

/* ── local helpers ─────────────────────────────────────────────────────── */
function SearchSeg({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 flex-1 min-w-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-700">{label}</p>
        {children}
      </div>
    </div>
  )
}
function Divider() {
  return <span className="hidden sm:block w-px self-stretch my-2 bg-slate-100" />
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">{children}</div>
}
function CardHead({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      <Link href={href} className="text-[12.5px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
        {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[12.5px] text-slate-500 shrink-0">{label}</dt>
      <dd className="text-[12.5px] font-semibold text-slate-800 truncate text-right">{value}</dd>
    </div>
  )
}
function TrustRow({ icon: Icon, title, sub }: { icon: typeof ShieldCheck; title: string; sub: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800">{title}</p>
        <p className="text-[12px] text-slate-500">{sub}</p>
      </div>
      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
    </li>
  )
}
