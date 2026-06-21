"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  CalendarRange,
  LogIn,
  LogOut,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  AlertTriangle,
  Download,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import {
  BookingStatusBadge,
  BookingUpgradePrompt,
  BookingNotReady,
  BookingEmptyState,
  fmtDateShort,
  fmtMoney,
} from "./primitives"
import type { BookingRow, BookableListing, ReservationStatus } from "./server"

/* ──────────────────────────────────────────────────────────────────────────
   Reservations register — 10 saved views over the workspace's reservations,
   each with real columns, filters and row actions. Premium, mobile-aware.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  canManage: boolean
  ready: boolean
  planName: string
  upgradeReason: string | null
  bookings: BookingRow[]
  listings: BookableListing[]
}

type ViewKey =
  | "all"
  | "upcoming"
  | "arrivals"
  | "departures"
  | "in_house"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "needs_attention"

interface ViewDef {
  key: ViewKey
  label: string
  icon: React.ElementType
}

const VIEWS: ViewDef[] = [
  { key: "all", label: "All reservations", icon: CalendarRange },
  { key: "upcoming", label: "Upcoming", icon: Clock },
  { key: "arrivals", label: "Arrivals", icon: LogIn },
  { key: "departures", label: "Departures", icon: LogOut },
  { key: "in_house", label: "In-house", icon: Home },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "completed", label: "Completed", icon: Flag },
  { key: "cancelled", label: "Cancelled", icon: XCircle },
  { key: "needs_attention", label: "Needs attention", icon: AlertTriangle },
]

function todayYmd(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const ACTIVE: ReservationStatus[] = ["confirmed", "checked_in"]

function applyView(rows: BookingRow[], view: ViewKey): BookingRow[] {
  const today = todayYmd()
  switch (view) {
    case "upcoming":
      return rows.filter((r) => (r.checkIn ?? "") >= today && r.status !== "cancelled")
    case "arrivals":
      return rows.filter((r) => r.checkIn === today && r.status !== "cancelled")
    case "departures":
      return rows.filter((r) => r.checkOut === today && r.status !== "cancelled")
    case "in_house":
      return rows.filter(
        (r) => ACTIVE.includes(r.status) && (r.checkIn ?? "") <= today && (r.checkOut ?? "") > today
      )
    case "pending":
      return rows.filter((r) => r.status === "hold" || r.status === "pending")
    case "confirmed":
      return rows.filter((r) => r.status === "confirmed" || r.status === "checked_in")
    case "completed":
      return rows.filter((r) => r.status === "completed" || r.status === "checked_out")
    case "cancelled":
      return rows.filter((r) => r.status === "cancelled")
    case "needs_attention":
      return rows.filter(
        (r) =>
          r.status === "hold" ||
          r.status === "pending" ||
          (r.totalPence > 0 && r.amountPaidPence < r.totalPence && r.status !== "cancelled")
      )
    default:
      return rows
  }
}

export function ReservationsRegisterClient({
  canManage,
  ready,
  planName,
  upgradeReason,
  bookings,
  listings,
}: Props) {
  const router = useRouter()
  const [view, setView] = useState<ViewKey>("all")
  const [query, setQuery] = useState("")
  const [listingFilter, setListingFilter] = useState<string>("all")

  const counts = useMemo(() => {
    const c: Record<ViewKey, number> = {} as Record<ViewKey, number>
    for (const v of VIEWS) c[v.key] = applyView(bookings, v.key).length
    return c
  }, [bookings])

  const rows = useMemo(() => {
    let r = applyView(bookings, view)
    if (listingFilter !== "all") r = r.filter((b) => b.listingId === listingFilter)
    const q = query.trim().toLowerCase()
    if (q) {
      r = r.filter(
        (b) =>
          b.guestName.toLowerCase().includes(q) ||
          (b.guestEmail ?? "").toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q) ||
          b.listingTitle.toLowerCase().includes(q)
      )
    }
    return r
  }, [bookings, view, query, listingFilter])

  function exportCsv() {
    const header = ["Reference", "Guest", "Email", "Listing", "Check-in", "Check-out", "Nights", "Guests", "Status", "Total"]
    const lines = rows.map((b) =>
      [
        b.reference,
        b.guestName,
        b.guestEmail ?? "",
        b.listingTitle,
        b.checkIn ?? "",
        b.checkOut ?? "",
        b.nights,
        b.guests,
        b.status,
        (b.totalPence / 100).toFixed(2),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    const csv = [header.join(","), ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reservations-${view}-${todayYmd()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Reservations" subtitle="Booking management" showBack backHref="/property-manager/bookings" />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={planName} reason={upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <MobileTopBar title="Reservations" subtitle="Register" showBack backHref="/property-manager/bookings" />

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Reservations</h1>
            <p className="text-sm text-slate-500 mt-0.5">{bookings.length} total across your workspace</p>
          </div>
          <button
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 self-start"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* View chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {VIEWS.map((v) => {
            const Icon = v.icon
            const active = view === v.key
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors shrink-0",
                  active
                    ? "bg-[#2563EB] text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {v.label}
                <span
                  className={cn(
                    "ml-0.5 tabular-nums text-[11px] px-1.5 rounded-full",
                    active ? "bg-white/20" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {counts[v.key]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guest, reference, listing…"
              className="w-full h-10 pl-9 pr-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          {listings.length > 0 && (
            <select
              value={listingFilter}
              onChange={(e) => setListingFilter(e.target.value)}
              className="h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">All listings</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Body */}
        {!ready ? (
          <BookingNotReady />
        ) : rows.length === 0 ? (
          <BookingEmptyState
            icon={CalendarRange}
            title={bookings.length === 0 ? "No reservations yet" : "Nothing in this view"}
            description={
              bookings.length === 0
                ? "When guests book — directly or via a channel — reservations land here."
                : "Try a different view or clear the search."
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    <th className="px-5 py-3">Guest</th>
                    <th className="px-3 py-3">Listing</th>
                    <th className="px-3 py-3">Dates</th>
                    <th className="px-3 py-3 text-center">Nights</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => router.push(`/property-manager/bookings/${b.id}`)}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{b.guestName}</p>
                        <p className="text-[12px] text-slate-400">{b.reference}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-600 max-w-[180px] truncate">{b.listingTitle}</td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {fmtDateShort(b.checkIn)} → {fmtDateShort(b.checkOut)}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums text-slate-600">{b.nights}</td>
                      <td className="px-3 py-3">
                        <BookingStatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-800">
                        {fmtMoney(b.totalPence, b.currency)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2.5">
              {rows.map((b) => (
                <Link
                  key={b.id}
                  href={`/property-manager/bookings/${b.id}`}
                  className="block rounded-2xl border border-slate-100 bg-white shadow-sm p-4 active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{b.guestName}</p>
                      <p className="text-[12px] text-slate-400 truncate">{b.listingTitle}</p>
                    </div>
                    <BookingStatusBadge status={b.status} size="sm" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">
                      {fmtDateShort(b.checkIn)} → {fmtDateShort(b.checkOut)} · {b.nights}n
                    </span>
                    <span className="tabular-nums font-semibold text-slate-800">
                      {fmtMoney(b.totalPence, b.currency)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardContainer>
  )
}

export default ReservationsRegisterClient
