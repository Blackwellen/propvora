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
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  CustomerPageHeader,
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

const QUICK_ACTIONS = [
  { label: "Find a stay", href: "/stay/search", icon: MapPin, bg: "bg-blue-50", color: "text-blue-600" },
  { label: "My bookings", href: "/user/bookings", icon: CalendarCheck, bg: "bg-emerald-50", color: "text-emerald-600" },
  { label: "Saved", href: "/user/saved", icon: Heart, bg: "bg-rose-50", color: "text-rose-600" },
  { label: "Messages", href: "/user/messages", icon: MessageSquare, bg: "bg-violet-50", color: "text-violet-600" },
]

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

  const kpis: CustomerKpi[] = [
    {
      icon: CalendarCheck, iconBg: "bg-blue-50", iconColor: "text-blue-600",
      value: upcoming.length, label: "Upcoming stays",
      sub: upcoming.length > 0 ? `Next ${shortDate(upcoming[0].check_in)}` : "Nothing booked",
      subColor: upcoming.length > 0 ? "text-blue-600" : "text-slate-400",
      href: "/user/bookings",
    },
    {
      icon: ShoppingBag, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      value: orders.length, label: "Orders",
      sub: orders.length > 0 ? "Marketplace purchases" : "No purchases yet",
      subColor: "text-slate-500",
      href: "/user/orders",
    },
    {
      icon: Heart, iconBg: "bg-rose-50", iconColor: "text-rose-600",
      value: saved.length, label: "Saved listings",
      sub: saved.length > 0 ? "Your favourites" : "Save listings you like",
      subColor: "text-slate-500",
      href: "/user/saved",
    },
  ]

  return (
    <div className="space-y-5">
      <MobileTopBar title="Home" subtitle={`Welcome, ${firstName}`} />

      <CustomerPageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Your stays, orders and saved listings at a glance"
        actions={
          <Link
            href="/property-manager/marketplace"
            className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Browse marketplace
          </Link>
        }
      />

      <CustomerKpiStrip kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Upcoming stays */}
        <CustomerCard className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-slate-900">Upcoming stays</h2>
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
              {upcoming.slice(0, 5).map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/user/bookings/${b.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-12 shrink-0 rounded-lg bg-blue-50 px-1 py-1.5 text-center">
                      <p className="text-[9px] font-bold text-blue-600 leading-none">{dayMonth(b.check_in)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {b.listing_title ?? (b.nights ? `${b.nights} night${b.nights === 1 ? "" : "s"}` : "Stay")}
                        {b.guests_count ? ` · ${b.guests_count} guest${b.guests_count === 1 ? "" : "s"}` : ""}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {shortDate(b.check_in)} → {shortDate(b.check_out)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-800">{moneyPence(b.total_pence, b.currency)}</p>
                      <CustomerStatusBadge tone={toneForStatus(b.status)}>{humanise(b.status)}</CustomerStatusBadge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CustomerCard>

        {/* Quick actions + notifications */}
        <div className="space-y-4">
          <CustomerCard className="p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Quick actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.bg}`}>
                      <Icon className={`w-5 h-5 ${a.color}`} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 text-center leading-tight">{a.label}</span>
                  </Link>
                )
              })}
            </div>
          </CustomerCard>

          <CustomerCard className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
              <CustomerViewLink href="/user/notifications" label="View all" />
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">No recent notifications. We&apos;ll alert you about bookings, payments and messages.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={n.href ?? "/user/notifications"} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 truncate">{timeAgo(n.created_at)}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CustomerCard>
        </div>
      </div>

      <StaysSummaryChart summary={summary} />
    </div>
  )
}
