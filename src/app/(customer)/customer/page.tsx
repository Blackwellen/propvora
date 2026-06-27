import Link from "next/link"
import Image from "next/image"
import {
  CalendarCheck,
  Heart,
  MessageSquare,
  Search,
  MapPin,
  Bell,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Users,
  Moon,
  Wallet,
  Sparkles,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  CustomerCard,
  CustomerEmptyState,
  CustomerViewLink,
  CustomerStatusBadge,
} from "@/components/customer/ui"
import StaysSummaryChart from "@/components/customer/StaysSummaryChart"
import {
  moneyPence,
  moneyMajor,
  shortDate,
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

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const diff = d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.round(diff / 86400000)
}

function daysLabel(days: number | null): string {
  if (days === null) return ""
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days > 0) return `In ${days} days`
  return "Checked in"
}

// Curated, deterministic property photography for the "next trip" hero so the
// same booking always shows the same (real) image. Unsplash is CSP-allowed.
const TRIP_PHOTOS = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
  "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858",
]
function pickPhoto(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return `${TRIP_PHOTOS[h % TRIP_PHOTOS.length]}?auto=format&fit=crop&w=1400&q=80`
}

const QUICK_ACTIONS = [
  { label: "Find a stay", description: "Search verified homes", href: "/stay/search", icon: Search, gradient: "from-[#2563EB] to-[#0EA5E9]" },
  { label: "My bookings", description: "Trips & stays", href: "/user/bookings", icon: CalendarCheck, gradient: "from-[#059669] to-[#10B981]" },
  { label: "Saved", description: "Your favourites", href: "/user/saved", icon: Heart, gradient: "from-[#e11d48] to-[#fb7185]" },
  { label: "Messages", description: "Hosts & support", href: "/user/messages", icon: MessageSquare, gradient: "from-[#7c3aed] to-[#a78bfa]" },
]

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default async function CustomerHomePage() {
  const { supabase, workspaceId, email, displayName } = await requireCustomerContext()

  const [bookings, , saved, summary, notifications] = await Promise.all([
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

  return (
    <div className="space-y-8 pb-10">
      <MobileTopBar title="Home" subtitle={`${getGreeting()}, ${firstName}`} />

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[14px] font-medium text-slate-500">{getGreeting()}</p>
        <h1 className="mt-0.5 text-[30px] sm:text-[38px] font-extrabold tracking-tight text-slate-900 leading-[1.05]">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-[15px] text-slate-500">
          {nextStay ? "Your next trip is just around the corner." : "Where would you like to go next?"}
        </p>
      </div>

      {/* ── Next trip — the showpiece (image-led) ────────────────────────── */}
      {nextStay ? (
        <section className="overflow-hidden rounded-[28px] border border-[#ECEFF4] bg-white shadow-[0_2px_4px_rgba(15,23,42,0.03),0_28px_56px_-28px_rgba(15,23,42,0.22)]">
          <div className="grid lg:grid-cols-2">
            {/* Photo */}
            <div className="relative min-h-[260px] lg:min-h-[360px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pickPhoto(nextStay.id)}
                alt={nextStay.listing_title ?? "Your next stay"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute left-5 top-5 flex items-center gap-2">
                <span className="rounded-full bg-white/95 px-3 py-1 text-[12px] font-bold text-slate-900 shadow-sm">
                  Your next trip
                </span>
                <CustomerStatusBadge tone={toneForStatus(nextStay.status)}>
                  {humanise(nextStay.status)}
                </CustomerStatusBadge>
              </div>
              <div className="absolute inset-x-5 bottom-5 text-white">
                <h2 className="text-[24px] font-bold leading-tight drop-shadow-sm">
                  {nextStay.listing_title ?? "Upcoming stay"}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-white/90">
                  <CalendarCheck className="h-4 w-4" />
                  {shortDate(nextStay.check_in)} → {shortDate(nextStay.check_out)}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center gap-6 p-6 sm:p-8">
              {nextStayDays !== null && (
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EFF5FF] px-3.5 py-1.5 text-[13px] font-bold text-[#1D4ED8]">
                  <Clock className="h-3.5 w-3.5" /> {daysLabel(nextStayDays)}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Stat icon={CalendarCheck} label="Check-in" value={shortDate(nextStay.check_in)} />
                <Stat icon={CalendarCheck} label="Check-out" value={shortDate(nextStay.check_out)} />
                <Stat icon={Moon} label="Nights" value={nextStay.nights ? String(nextStay.nights) : "—"} />
                <Stat icon={Users} label="Guests" value={nextStay.guests_count ? String(nextStay.guests_count) : "1"} />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <div>
                  <p className="text-[12px] text-slate-400">Total paid</p>
                  <p className="text-[22px] font-extrabold tracking-tight text-slate-900">
                    {moneyPence(nextStay.total_pence, nextStay.currency)}
                  </p>
                </div>
                <Link
                  href={`/user/bookings/${nextStay.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0B1B3F] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#15294f]"
                >
                  View booking <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-[28px] min-h-[300px] flex items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pickPhoto(workspaceId)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
          <div className="relative p-7 sm:p-9 text-white">
            <h2 className="text-[26px] sm:text-[30px] font-bold leading-tight">Find your next place to stay</h2>
            <p className="mt-1.5 text-[14.5px] text-white/85 max-w-md">
              Verified homes, serviced apartments and long-stay rentals across the UK.
            </p>
            <Link
              href="/stay/search"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-semibold text-slate-900 transition-transform hover:scale-[1.02]"
            >
              <Search className="h-4 w-4" /> Start searching
            </Link>
          </div>
        </section>
      )}

      {/* ── Quick actions ────────────────────────────────────────────────── */}
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

      {/* ── Travel snapshot (elegant inline figures) ─────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Figure icon={CalendarCheck} tint="bg-[var(--brand-soft)] text-[var(--brand)]" value={String(summary.total_stays)} label="Stays booked" />
        <Figure icon={Moon} tint="bg-violet-50 text-violet-600" value={String(summary.total_nights)} label="Nights away" />
        <Figure icon={Wallet} tint="bg-emerald-50 text-emerald-600" value={moneyPence(summary.total_spend_pence, summary.currency)} label="Total spend" />
      </div>

      {/* ── Two-column: upcoming + activity ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <CustomerCard className="p-5 sm:p-6">
          <SectionHead icon={CalendarCheck} iconBg="bg-[var(--brand-soft)]" iconColor="text-[var(--brand)]" title="Upcoming stays" href="/user/bookings" />
          {upcoming.length === 0 ? (
            <CustomerEmptyState
              icon={CalendarCheck}
              title="No upcoming stays"
              description="When you book a place, your confirmed and pending trips appear here with dates, guests and the price you paid."
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
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-2.5 transition-colors hover:border-[#CFE0F7] hover:bg-[#F7FAFF]"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pickPhoto(b.id)} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-slate-900">
                          {b.listing_title ?? (b.nights ? `${b.nights}-night stay` : "Stay")}
                        </p>
                        <p className="mt-0.5 truncate text-[12.5px] text-slate-500">
                          {shortDate(b.check_in)} → {shortDate(b.check_out)}
                          {b.guests_count ? ` · ${b.guests_count} guest${b.guests_count === 1 ? "" : "s"}` : ""}
                        </p>
                        {days !== null && days >= 0 && (
                          <p className="mt-0.5 text-[11.5px] font-semibold text-[#2563EB]">{daysLabel(days)}</p>
                        )}
                      </div>
                      <div className="shrink-0 space-y-1 text-right">
                        <p className="text-[14px] font-bold text-slate-900">{moneyPence(b.total_pence, b.currency)}</p>
                        <CustomerStatusBadge tone={toneForStatus(b.status)}>{humanise(b.status)}</CustomerStatusBadge>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CustomerCard>

        <CustomerCard className="p-5 sm:p-6">
          <SectionHead icon={Bell} iconBg="bg-violet-50" iconColor="text-violet-600" title="Recent activity" href="/user/notifications" />
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
                <Bell className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-[14px] font-semibold text-slate-700">All quiet</p>
              <p className="mt-1 max-w-[200px] text-[12.5px] text-slate-400">
                Bookings, payments and messages will show up here.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {notifications.map((n, i) => (
                <li key={n.id}>
                  <Link href={n.href ?? "/user/notifications"} className="group flex items-center gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-slate-50">
                    <div className="relative flex shrink-0 flex-col items-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${n.severity === "warning" ? "bg-amber-400" : (n.severity as string) === "error" || n.severity === "critical" ? "bg-red-400" : "bg-[var(--color-brand-400)]"}`} />
                      {i < notifications.length - 1 && <div className="absolute left-1/2 top-3 h-full w-px -translate-x-1/2 bg-slate-100" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-slate-800">{n.title}</p>
                      {n.body && <p className="mt-0.5 truncate text-[12px] text-slate-400">{n.body}</p>}
                      <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.created_at)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-200 transition-colors group-hover:text-[#2563EB]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CustomerCard>
      </div>

      {/* ── Saved stays ──────────────────────────────────────────────────── */}
      {saved.length > 0 ? (
        <CustomerCard className="p-5 sm:p-6">
          <SectionHead icon={Heart} iconBg="bg-rose-50" iconColor="text-rose-500" title="Your saved stays" href="/user/saved" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.slice(0, 3).map((s) => {
              const l = s.listing
              const img = Array.isArray(l?.images) && l.images.length > 0 ? l.images[0] : pickPhoto(s.id)
              return (
                <Link key={s.id} href={l?.id ? `/stays/${l.id}` : "/user/saved"} className="group block">
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={l?.title ?? "Saved listing"} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm">
                      <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <p className="truncate text-[14px] font-semibold text-slate-900">{l?.title ?? "Saved listing"}</p>
                    {(l?.location || l?.location_city) && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" /> {l.location_city ?? l.location}
                      </p>
                    )}
                    {(l?.base_price_pence != null || l?.price != null) && (
                      <p className="mt-1 text-[13px] text-slate-900">
                        <span className="font-semibold">
                          {l.base_price_pence != null ? moneyPence(l.base_price_pence, l.currency ?? "GBP") : moneyMajor(l.price!, l.currency ?? "GBP")}
                        </span>
                        <span className="text-slate-500"> /{l.price_unit ?? "night"}</span>
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </CustomerCard>
      ) : (
        <CustomerCard className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
              <Heart className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-slate-900">Save the places you love</p>
              <p className="mt-0.5 text-[13px] text-slate-500">Tap the heart on any stay to keep it here.</p>
            </div>
          </div>
          <Link href="/stays" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-slate-800">
            <Search className="h-4 w-4" /> Browse stays
          </Link>
        </CustomerCard>
      )}

      {/* ── Travel summary chart ─────────────────────────────────────────── */}
      <StaysSummaryChart summary={summary} />

      {/* ── Discover banner (branded, light) ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[28px] border border-[#E7EDF6] bg-white p-6 sm:p-9 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-24px_rgba(15,23,42,0.16)]">
        {/* faint brand accent in the corner */}
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#2563EB]/[0.06] blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Image
              src="/propvora-logo-dark.png"
              alt="Propvora"
              width={420}
              height={105}
              className="mb-4 h-7 w-auto"
            />
            <p className="text-[20px] sm:text-[22px] font-bold leading-tight text-slate-900">
              Everything you need, in one place
            </p>
            <p className="mt-1.5 max-w-md text-[14px] text-slate-500">
              Verified stays, long lets and trusted services across the UK — booked securely with escrow protection.
            </p>
          </div>
          <Link
            href="/stays"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#1d4ed8]"
          >
            <Sparkles className="h-4 w-4" /> Explore the marketplace <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── Small presentational helpers ──────────────────────────────────────────── */

function Stat({ icon: Icon, label, value }: { icon: typeof CalendarCheck; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="truncate text-[14px] font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function Figure({ icon: Icon, tint, value, label }: { icon: typeof CalendarCheck; tint: string; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E7EDF6] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.12)]">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <p className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-slate-900 leading-none">{value}</p>
      <p className="mt-1.5 text-[12.5px] font-medium text-slate-500">{label}</p>
    </div>
  )
}

function SectionHead({
  icon: Icon, iconBg, iconColor, title, href,
}: { icon: typeof CalendarCheck; iconBg: string; iconColor: string; title: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
      </div>
      <CustomerViewLink href={href} label="View all" />
    </div>
  )
}
