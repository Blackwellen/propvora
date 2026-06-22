import Link from "next/link"
import {
  CalendarCheck,
  ShoppingBag,
  Heart,
  ArrowUpRight,
  Sparkles,
  MessageSquare,
  MapPin,
  Bell,
  Search,
  ChevronRight,
  Clock,
  Home,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  CustomerCard,
  CustomerKpiStrip,
  CustomerEmptyState,
  CustomerViewLink,
  CustomerStatusBadge,
  type CustomerKpi,
} from "@/components/customer/ui"
import StaysSummaryChart from "@/components/customer/StaysSummaryChart"
import {
  moneyPence,
  moneyMajor,
  shortDate,
  dayMonth,
  humanise,
  toneForStatus,
  timeAgo,
  isUpcoming,
} from "@/components/customer/format"
import {
  requireCustomerContext,
  listCustomerBookings,
  listCustomerOrders,
  listSavedListings,
  getCustomerStaySummary,
  listCustomerNotifications,
} from "@/lib/customer"

export const metadata = { title: "Customer Workspace · Propvora" }
export const dynamic = "force-dynamic"

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

/** Days until a date string (0 = today, negative = past). */
function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const diff = d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.round(diff / 86400000)
}

function daysLabel(days: number | null): string {
  if (days === null) return ""
  if (days === 0) return "Today!"
  if (days === 1) return "Tomorrow"
  if (days > 0) return `In ${days} days`
  return "Check-in passed"
}

const QUICK_ACTIONS = [
  {
    label: "Find a stay",
    description: "Search verified homes",
    href: "/stay/search",
    icon: Search,
    gradient: "from-[#2563EB] to-[#0EA5E9]",
  },
  {
    label: "My bookings",
    description: "Trips & stays",
    href: "/user/bookings",
    icon: CalendarCheck,
    gradient: "from-[#059669] to-[#10B981]",
  },
  {
    label: "Saved",
    description: "Your favourites",
    href: "/user/saved",
    icon: Heart,
    gradient: "from-[#e11d48] to-[#fb7185]",
  },
  {
    label: "Messages",
    description: "Hosts & support",
    href: "/user/messages",
    icon: MessageSquare,
    gradient: "from-[#7c3aed] to-[#a78bfa]",
  },
]

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default async function CustomerHomePage() {
  const { supabase, workspaceId, email, displayName } = await requireCustomerContext()

  const [bookings, orders, saved, summary, notifications] = await Promise.all([
    listCustomerBookings(supabase, workspaceId, email),
    listCustomerOrders(supabase, workspaceId),
    listSavedListings(supabase, workspaceId),
    getCustomerStaySummary(supabase, workspaceId, email),
    listCustomerNotifications(supabase, workspaceId, 5),
  ])

  const upcoming = bookings
    .filter((b) => isUpcoming(b.check_in, b.status))
    .sort((a, b) => (a.check_in ?? "").localeCompare(b.check_in ?? ""))

  const firstName = displayName.split(/[\s@]/)[0]
  const nextStay = upcoming[0] ?? null
  const nextStayDays = nextStay ? daysUntil(nextStay.check_in) : null

  const kpis: CustomerKpi[] = [
    {
      icon: CalendarCheck,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      value: upcoming.length,
      label: "Upcoming stays",
      sub: upcoming.length > 0 ? `Next ${shortDate(upcoming[0].check_in)}` : "Nothing booked",
      subColor: upcoming.length > 0 ? "text-blue-600" : "text-slate-400",
      href: "/user/bookings",
    },
    {
      icon: Heart,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      value: saved.length,
      label: "Saved listings",
      sub: saved.length > 0 ? "Your favourites" : "Save listings you like",
      subColor: "text-slate-500",
      href: "/user/saved",
    },
    {
      icon: MessageSquare,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      value: notifications.length,
      label: "Notifications",
      sub: notifications.length > 0 ? "Recent activity" : "All clear",
      subColor: "text-slate-500",
      href: "/user/notifications",
    },
  ]

  return (
    <div className="space-y-5 pb-8">
      <MobileTopBar title="Home" subtitle={`${getGreeting()}, ${firstName}`} />

      {/* ── 1. Hero Greeting Banner ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-none sm:rounded-3xl mx-0 sm:mx-0"
        style={{ background: "radial-gradient(ellipse at 70% 50%, #1e3a5f 0%, #0D1B2A 60%)" }}
      >
        {/* Subtle decorative rings */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563EB 0%, transparent 70%)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-8 bottom-0 w-40 h-40 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative px-5 py-7 sm:px-8 sm:py-9 flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Left: greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-blue-300 text-sm font-medium tracking-wide mb-1">
              {getGreeting()}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
              {firstName} 👋
            </h1>
            <p className="mt-2 text-white/60 text-sm max-w-xs">
              {nextStay
                ? "Your next stay is coming up. Here's what's on."
                : "Your home base for stays, bookings, and saved properties."}
            </p>
            {!nextStay && (
              <Link
                href="/stay/search"
                className="mt-4 inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                <Search className="w-4 h-4" />
                Find your next stay
              </Link>
            )}
          </div>

          {/* Right: next stay card */}
          {nextStay && (
            <Link
              href={`/user/bookings/${nextStay.id}`}
              className="sm:w-64 shrink-0 bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5 text-blue-600" />
                </div>
                <CustomerStatusBadge tone={toneForStatus(nextStay.status)}>
                  {humanise(nextStay.status)}
                </CustomerStatusBadge>
              </div>
              <p className="text-sm font-semibold text-slate-900 truncate leading-snug">
                {nextStay.listing_title ?? "Upcoming Stay"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {shortDate(nextStay.check_in)} → {shortDate(nextStay.check_out)}
                {nextStay.nights ? ` · ${nextStay.nights} night${nextStay.nights === 1 ? "" : "s"}` : ""}
              </p>
              {nextStayDays !== null && (
                <div className="mt-3 flex items-center gap-1.5 text-[#2563EB]">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{daysLabel(nextStayDays)}</span>
                </div>
              )}
              <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-0.5 group-hover:text-[#2563EB] transition-colors">
                View booking <ChevronRight className="w-3 h-3" />
              </p>
            </Link>
          )}
        </div>
      </div>

      {/* ── 2. Quick action tiles ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.label}
              href={a.href}
              className="group relative flex items-center gap-3.5 p-4 rounded-2xl border border-[#E7EDF6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#CFE0F7] hover:shadow-[0_10px_28px_-12px_rgba(37,99,235,0.35)]"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${a.gradient} text-white shadow-sm`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-slate-900 leading-tight truncate">{a.label}</p>
                <p className="text-[12px] text-slate-500 truncate mt-0.5">{a.description}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#2563EB]" />
            </Link>
          )
        })}
      </div>

      {/* ── 3. KPI strip ──────────────────────────────────────────────────── */}
      <CustomerKpiStrip kpis={kpis} />

      {/* ── 4. Two-column layout: upcoming + activity ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Upcoming stays */}
        <CustomerCard className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Upcoming stays</h2>
            </div>
            <CustomerViewLink href="/user/bookings" label="View all" />
          </div>
          {upcoming.length === 0 ? (
            <CustomerEmptyState
              icon={CalendarCheck}
              title="No upcoming stays"
              description="When you book a property, your confirmed and pending stays appear here with dates, guests and the price you paid."
              action={<CustomerViewLink href="/stay/search" label="Find a place to stay" />}
            />
          ) : (
            <ul className="space-y-2.5">
              {upcoming.slice(0, 5).map((b) => {
                const days = daysUntil(b.check_in)
                return (
                  <li key={b.id}>
                    <Link
                      href={`/user/bookings/${b.id}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Date block */}
                      <div className="w-12 shrink-0 rounded-xl bg-blue-600 px-1 py-2 text-center">
                        <p className="text-[10px] font-bold text-blue-200 leading-none uppercase">
                          {dayMonth(b.check_in).split(" ")[1]}
                        </p>
                        <p className="text-lg font-bold text-white leading-none mt-0.5">
                          {dayMonth(b.check_in).split(" ")[0]}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {b.listing_title ?? (b.nights ? `${b.nights}-night stay` : "Stay")}
                          {b.guests_count ? ` · ${b.guests_count} guest${b.guests_count === 1 ? "" : "s"}` : ""}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {shortDate(b.check_in)} → {shortDate(b.check_out)}
                        </p>
                        {days !== null && days >= 0 && (
                          <p className="text-[11px] font-semibold text-blue-600 mt-0.5">{daysLabel(days)}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-sm font-bold text-slate-800">{moneyPence(b.total_pence, b.currency)}</p>
                        <CustomerStatusBadge tone={toneForStatus(b.status)}>{humanise(b.status)}</CustomerStatusBadge>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-blue-400 shrink-0 transition-colors" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CustomerCard>

        {/* Activity feed */}
        <CustomerCard className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
            </div>
            <CustomerViewLink href="/user/notifications" label="View all" />
          </div>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-700">All quiet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[180px]">
                Your activity will appear here — bookings, payments, messages.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {notifications.map((n, i) => (
                <li key={n.id}>
                  <Link
                    href={n.href ?? "/user/notifications"}
                    className="flex items-center gap-3 py-2.5 px-1 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    {/* Timeline dot */}
                    <div className="relative flex flex-col items-center shrink-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          n.severity === "warning"
                            ? "bg-amber-400"
                            : (n.severity as string) === "error" || n.severity === "critical"
                            ? "bg-red-400"
                            : "bg-blue-400"
                        }`}
                      />
                      {i < notifications.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-full bg-slate-100" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                      {n.body && <p className="text-xs text-slate-400 truncate mt-0.5">{n.body}</p>}
                      <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-[#2563EB] shrink-0 transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CustomerCard>
      </div>

      {/* ── 5. Saved listings strip ────────────────────────────────────────── */}
      {saved.length > 0 ? (
        <CustomerCard className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Your saved stays</h2>
            </div>
            <CustomerViewLink href="/user/saved" label="View all" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {saved.slice(0, 3).map((s) => {
              const l = s.listing
              const img = Array.isArray(l?.images) && l.images.length > 0 ? l.images[0] : null
              return (
                <Link
                  key={s.id}
                  href={l?.id ? `/stays/${l.id}` : "/user/saved"}
                  className="group flex flex-col rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-200 hover:shadow-sm transition-all"
                >
                  {/* Image */}
                  <div className="h-36 bg-slate-100 relative overflow-hidden">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={l?.title ?? "Saved listing"}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <Home className="w-8 h-8 text-slate-200" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center backdrop-blur-sm">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    </div>
                  </div>
                  {/* Details */}
                  <div className="p-3 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {l?.title ?? "Saved listing"}
                    </p>
                    {(l?.location || l?.location_city) && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {l.location_city ?? l.location}
                      </p>
                    )}
                    {(l?.price != null || l?.base_price_pence != null) && (
                      <p className="text-xs font-semibold text-slate-700 mt-1.5">
                        {l.base_price_pence != null
                          ? `${moneyPence(l.base_price_pence, l.currency ?? "GBP")} /night`
                          : l.price != null
                          ? `${moneyMajor(l.price, l.currency ?? "GBP")} /${l.price_unit ?? "night"}`
                          : ""}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </CustomerCard>
      ) : (
        <CustomerCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Saved stays</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            You haven&apos;t saved any stays yet. Browse the marketplace to find your favourites.
          </p>
          <Link
            href="/stay/search"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Browse stays
          </Link>
        </CustomerCard>
      )}

      {/* ── 6. Activity summary chart ──────────────────────────────────────── */}
      <StaysSummaryChart summary={summary} />

      {/* ── 7. Bottom CTA banner ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #0D1B2A 0%, #1e3a5f 100%)" }}
      >
        <div>
          <p className="text-white font-bold text-lg leading-tight">Discover properties on Propvora</p>
          <p className="text-white/60 text-sm mt-1">
            Browse verified stays and lets across the UK.
          </p>
        </div>
        <Link
          href="/stays"
          className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Explore the marketplace
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
