"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CalendarRange,
  CalendarDays,
  List as ListIcon,
  TrendingUp,
  BedDouble,
  Search,
  ChevronDown,
  Settings2,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { SectionHeader } from "@/components/layout/SectionHeader"
import { MobileTopBar, MobileTabs, MobilePageHeader, ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import {
  BookingKpiCard,
  BookingStatusBadge,
  BookingUpgradePrompt,
  BookingNotReady,
  BookingEmptyState,
  STATUS_ORDER,
  statusMeta,
  fmtMoney,
  fmtDate,
  type BookingKpi,
} from "./primitives"
import { BookingCalendar } from "./BookingCalendar"
import { BookingManagementCanvas } from "./BookingManagementCanvas"
import type { BookingRow, BookableListing, ReservationStatus } from "./server"

interface Props {
  canManage: boolean
  ready: boolean
  planName: string
  upgradeReason: string | null
  bookings: BookingRow[]
  listings: BookableListing[]
}

type ViewMode = "calendar" | "list"

const STATUS_LABEL: Record<ReservationStatus, string> = {
  hold: "Hold",
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  checked_out: "Checked out",
  completed: "Completed",
  cancelled: "Cancelled",
}

function todayYmd(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function BookingsOverviewClient({
  canManage,
  ready,
  planName,
  upgradeReason,
  bookings,
  listings,
}: Props) {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>("calendar")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all")
  const [listingFilter, setListingFilter] = useState<"all" | string>("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const open = (id: string) => router.push(`/property-manager/bookings/${id}`)

  // ── KPIs (indicative revenue; occupancy-ish from upcoming nights) ───────────
  const kpis = useMemo<BookingKpi[]>(() => {
    const today = todayYmd()
    const upcoming = bookings.filter(
      (b) => (b.checkIn ?? "") >= today && b.status !== "cancelled"
    )
    const active = bookings.filter((b) => b.status === "confirmed" || b.status === "checked_in")
    const revenuePence = bookings
      .filter((b) => b.status !== "cancelled" && b.status !== "hold")
      .reduce((sum, b) => sum + b.totalPence, 0)
    const nights = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.nights, 0)
    const currency = bookings[0]?.currency ?? "GBP"
    return [
      {
        label: "Upcoming",
        value: upcoming.length,
        sub: "Future arrivals",
        icon: CalendarDays,
        iconBg: "bg-[var(--brand-soft)]",
        iconColor: "text-[var(--brand)]",
      },
      {
        label: "Active stays",
        value: active.length,
        sub: "Confirmed & in-house",
        icon: BedDouble,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
      {
        label: "Nights booked",
        value: nights,
        sub: "All reservations",
        icon: CalendarRange,
        iconBg: "bg-violet-50",
        iconColor: "text-violet-600",
      },
      {
        label: "Revenue (indic.)",
        value: fmtMoney(revenuePence, currency),
        sub: "Gross, indicative",
        icon: TrendingUp,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
      },
    ]
  }, [bookings])

  // ── Filtering for list view ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false
      if (listingFilter !== "all" && b.listingId !== listingFilter) return false
      if (fromDate && (b.checkOut ?? b.checkIn ?? "") < fromDate) return false
      if (toDate && (b.checkIn ?? "") > toDate) return false
      if (q) {
        const hay = `${b.guestName} ${b.listingTitle} ${b.reference} ${b.guestEmail ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [bookings, search, statusFilter, listingFilter, fromDate, toDate])

  const mobileMapping: MobileCardMapping<BookingRow> = {
    getKey: (b) => b.id,
    title: (b) => b.guestName,
    subtitle: (b) => b.listingTitle,
    badge: (b) => <BookingStatusBadge status={b.status} size="sm" />,
    onRowClick: (b) => open(b.id),
    fields: [
      { label: "Dates", render: (b) => `${fmtDate(b.checkIn)} → ${fmtDate(b.checkOut)}` },
      { label: "Nights", render: (b) => b.nights },
      { label: "Guests", render: (b) => b.guests },
      { label: "Total", render: (b) => fmtMoney(b.totalPence, b.currency) },
      { label: "Ref", render: (b) => b.reference },
      { label: "Source", render: (b) => b.source },
    ],
  }

  const header = (
    <SectionHeader
      title="Bookings"
      subtitle="Direct booking management — reservations, calendar and bookable listings."
      actions={
        <Link
          href="/property-manager/bookings/listings"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
        >
          <Settings2 className="w-4 h-4" />
          Manage listings
        </Link>
      }
    />
  )

  // ── Gated: show shell + upgrade prompt, never hide ──────────────────────────
  if (!canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Bookings" subtitle="Direct booking management" />
        <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
          <div className="hidden md:block">{header}</div>
          <BookingUpgradePrompt planName={planName} reason={upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  const listView = (
    <>
      <div className="hidden md:flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest, listing or reference…"
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)]"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | ReservationStatus)}
            className="h-9 pl-3 pr-8 rounded-lg text-sm bg-white border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
          >
            <option value="all">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={listingFilter}
            onChange={(e) => setListingFilter(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg text-sm bg-white border border-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
          >
            <option value="all">All listings</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          aria-label="From date"
          className="h-9 px-3 rounded-lg text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
        <span className="text-slate-400 text-sm">→</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          aria-label="To date"
          className="h-9 px-3 rounded-lg text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>

      {filtered.length === 0 ? (
        <BookingEmptyState
          icon={CalendarRange}
          title={bookings.length === 0 ? "No reservations yet" : "No reservations match your filters"}
          description={
            bookings.length === 0
              ? "Reservations from your bookable listings will appear here. Set up rates and availability to start taking direct bookings."
              : "Try widening your date range or clearing a filter."
          }
          action={
            bookings.length === 0 ? (
              <Link
                href="/property-manager/bookings/listings"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] transition-colors shadow-sm"
              >
                <Settings2 className="w-4 h-4" />
                Manage listings
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ResponsiveTable
          rows={filtered}
          mobile={mobileMapping}
          emptyState={<BookingEmptyState icon={CalendarRange} title="No reservations match your filters" />}
        >
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  {["Guest", "Listing", "Dates", "Nights", "Status", "Total (indic.)", "Source"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((b) => {
                  const c = statusMeta(b.status)
                  return (
                    <tr
                      key={b.id}
                      onClick={() => open(b.id)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={cn("w-1.5 h-8 rounded-full shrink-0", c.dot)} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{b.guestName}</p>
                            <p className="text-[11px] text-slate-400 truncate">{b.reference}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">{b.listingTitle}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">{b.nights}</td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        {fmtMoney(b.totalPence, b.currency)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{b.source}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ResponsiveTable>
      )}
    </>
  )

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Bookings"
        subtitle="Direct booking management"
        primaryAction={{ label: "Listings", icon: Settings2, href: "/property-manager/bookings/listings" }}
      />
      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        <div className="hidden md:block">{header}</div>

        <MobilePageHeader hideTitle
          title="Bookings"
          count={`${bookings.length} reservation${bookings.length === 1 ? "" : "s"}`}
          search={view === "list" ? search : undefined}
          onSearchChange={view === "list" ? setSearch : undefined}
          searchPlaceholder="Search reservations…"
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpis.map((k) => (
            <BookingKpiCard key={k.label} kpi={k} />
          ))}
        </div>

        <BookingManagementCanvas bookings={bookings} listings={listings} activeSection="dashboard" />

        {/* View toggle — desktop segmented + mobile tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="hidden md:inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-[13px] font-semibold transition-colors",
                view === "calendar" ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <CalendarDays className="w-4 h-4" /> Calendar
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-[13px] font-semibold transition-colors",
                view === "list" ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <ListIcon className="w-4 h-4" /> List
            </button>
          </div>
          <div className="md:hidden w-full">
            <MobileTabs
              tabs={[
                { id: "calendar", label: "Calendar", icon: CalendarDays },
                { id: "list", label: "List", icon: ListIcon },
              ]}
              value={view}
              onChange={(id) => setView(id as ViewMode)}
              aria-label="Booking views"
            />
          </div>
        </div>

        {/* Not-ready banner sits above whichever view (schema still provisioning) */}
        {!ready && bookings.length === 0 && listings.length === 0 && (
          <BookingNotReady />
        )}

        {view === "calendar" ? <BookingCalendar bookings={bookings} onOpen={open} /> : listView}

        {/* Status legend (desktop, calendar view) */}
        {view === "calendar" && bookings.length > 0 && (
          <div className="hidden md:flex flex-wrap items-center gap-3 px-1">
            {STATUS_ORDER.map((s) => {
              const c = statusMeta(s)
              return (
                <span key={s} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className={cn("w-2.5 h-2.5 rounded-full", c.dot)} />
                  {STATUS_LABEL[s]}
                </span>
              )
            })}
          </div>
        )}

        <p className="text-[11px] text-slate-400 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Live workspace data
          {!ready && (
            <>
              <span className="mx-1">·</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Reservations engine provisioning
            </>
          )}
        </p>
      </div>
    </DashboardContainer>
  )
}

export default BookingsOverviewClient
