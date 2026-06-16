"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CalendarCheck,
  Users,
  ChevronRight,
  Search,
  List,
  CalendarDays,
  RotateCcw,
  ChevronLeft,
} from "lucide-react"
import {
  CustomerCard,
  CustomerEmptyState,
  CustomerStatusBadge,
  CustomerTabs,
  customerInputClass,
  type CustomerTab,
} from "./ui"
import { moneyPence, shortDate, dayMonth, humanise, toneForStatus, isUpcoming } from "./format"
import type { CustomerBooking } from "@/lib/customer/types"

type Filter = "upcoming" | "past" | "cancelled"
type ViewMode = "list" | "calendar"

function isCancelled(status: string): boolean {
  return /(cancelled|canceled|refunded|expired|declined)/i.test(status)
}

function BookingRow({ b }: { b: CustomerBooking }) {
  const rebook = b.listing_slug ? `/stay/${encodeURIComponent(b.listing_slug)}` : "/stay/search"
  return (
    <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors">
      <Link href={`/user/bookings/${b.id}`} className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className="w-14 shrink-0 rounded-lg bg-blue-50 py-2 text-center">
          <p className="text-[10px] font-bold text-blue-600 leading-none">{dayMonth(b.check_in)}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {b.listing_title ?? (b.nights ? `${b.nights} night${b.nights === 1 ? "" : "s"} stay` : "Stay")}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {shortDate(b.check_in)} → {shortDate(b.check_out)}
            {b.guests_count ? ` · ${b.guests_count} guest${b.guests_count === 1 ? "" : "s"}` : ""}
            {b.booking_ref ? ` · ${b.booking_ref}` : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-slate-800">{moneyPence(b.total_pence, b.currency)}</p>
          {["hold", "pending_payment"].includes(b.status) && (b.payment_status ?? "unpaid") === "unpaid" ? (
            <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Payment due</span>
          ) : (
            <CustomerStatusBadge tone={toneForStatus(b.status)}>{humanise(b.status)}</CustomerStatusBadge>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </Link>
      {isCancelled(b.status) && (
        <Link
          href={rebook}
          className="shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Re-book
        </Link>
      )}
    </div>
  )
}

function CalendarView({ bookings }: { bookings: CustomerBooking[] }) {
  const today = new Date()
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() })

  const byDay = useMemo(() => {
    const map = new Map<string, CustomerBooking[]>()
    for (const b of bookings) {
      if (!b.check_in) continue
      const start = new Date(b.check_in)
      const end = b.check_out ? new Date(b.check_out) : start
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        map.set(key, [...(map.get(key) ?? []), b])
      }
    }
    return map
  }, [bookings])

  const first = new Date(cursor.y, cursor.m, 1)
  const startOffset = (first.getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const monthLabel = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function shift(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  return (
    <CustomerCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => shift(-1)} aria-label="Previous month" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold text-slate-800">{monthLabel}</p>
        <button onClick={() => shift(1)} aria-label="Next month" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-slate-400 uppercase">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) return <div key={i} className="aspect-square" />
          const key = `${cursor.y}-${cursor.m}-${day}`
          const dayBookings = byDay.get(key) ?? []
          const isToday = cursor.y === today.getFullYear() && cursor.m === today.getMonth() && day === today.getDate()
          const has = dayBookings.length > 0
          const inner = (
            <div
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[12px] transition-colors ${
                has ? "bg-[#EFF6FF] text-[#2563EB] font-semibold hover:bg-[#DCEAFE]" : "text-slate-500"
              } ${isToday ? "ring-1 ring-[#2563EB]" : ""}`}
            >
              <span>{day}</span>
              {has && <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#2563EB]" />}
            </div>
          )
          return has ? (
            <Link key={i} href={`/user/bookings/${dayBookings[0].id}`} title={dayBookings[0].listing_title ?? "Stay"}>
              {inner}
            </Link>
          ) : (
            <div key={i}>{inner}</div>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">Dots mark nights you have a stay. Tap a highlighted day to open the trip.</p>
    </CustomerCard>
  )
}

export default function BookingsExplorer({ bookings }: { bookings: CustomerBooking[] }) {
  const [filter, setFilter] = useState<Filter>("upcoming")
  const [view, setView] = useState<ViewMode>("list")
  const [q, setQ] = useState("")

  const buckets = useMemo(() => {
    const upcoming: CustomerBooking[] = []
    const past: CustomerBooking[] = []
    const cancelled: CustomerBooking[] = []
    for (const b of bookings) {
      if (isCancelled(b.status)) cancelled.push(b)
      else if (isUpcoming(b.check_in, b.status)) upcoming.push(b)
      else past.push(b)
    }
    upcoming.sort((a, b) => (a.check_in ?? "").localeCompare(b.check_in ?? ""))
    past.sort((a, b) => (b.check_in ?? "").localeCompare(a.check_in ?? ""))
    cancelled.sort((a, b) => (b.check_in ?? "").localeCompare(a.check_in ?? ""))
    return { upcoming, past, cancelled }
  }, [bookings])

  const tabs: CustomerTab[] = [
    { key: "upcoming", label: "Upcoming", count: buckets.upcoming.length },
    { key: "past", label: "Past", count: buckets.past.length },
    { key: "cancelled", label: "Cancelled", count: buckets.cancelled.length },
  ]

  const list = buckets[filter]
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return list
    return list.filter((b) =>
      [b.listing_title, b.booking_ref, b.guest_name, b.status].some((v) => (v ?? "").toLowerCase().includes(term))
    )
  }, [list, q])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <CustomerTabs tabs={tabs} active={filter} onChange={(k) => setFilter(k as Filter)} />
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search bookings…"
              className={`${customerInputClass} pl-9`}
              aria-label="Search bookings"
            />
          </div>
          <div className="flex rounded-xl border border-slate-200 p-0.5 shrink-0">
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={`p-2 rounded-lg ${view === "list" ? "bg-[#0D1B2A] text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("calendar")}
              aria-label="Calendar view"
              aria-pressed={view === "calendar"}
              className={`p-2 rounded-lg ${view === "calendar" ? "bg-[#0D1B2A] text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {view === "calendar" ? (
        <CalendarView bookings={bookings.filter((b) => !isCancelled(b.status))} />
      ) : filtered.length === 0 ? (
        <CustomerCard>
          <CustomerEmptyState
            icon={filter === "cancelled" ? Users : CalendarCheck}
            title={q ? "No matching bookings" : filter === "upcoming" ? "No upcoming stays" : filter === "past" ? "No past stays" : "No cancelled stays"}
            description={
              q
                ? "Try a different search term, or clear the search to see everything in this tab."
                : "When you reserve a property, your stays appear here with dates, guests and the exact price you paid."
            }
            action={
              !q && filter === "upcoming" ? (
                <Link href="/stay/search" className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors">
                  <CalendarCheck className="w-4 h-4" /> Find a stay
                </Link>
              ) : undefined
            }
          />
        </CustomerCard>
      ) : (
        <CustomerCard className="p-3">
          <ul className="space-y-2">
            {filtered.map((b) => (
              <li key={b.id}><BookingRow b={b} /></li>
            ))}
          </ul>
        </CustomerCard>
      )}
    </div>
  )
}
