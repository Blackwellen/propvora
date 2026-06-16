"use client"

import { useMemo, useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListFilter,
  Lock,
  Unlock,
  Tag,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { BookingUpgradePrompt, BookingNotReady, BookingEmptyState, fmtMoney } from "./primitives"
import { blockRange, setDayPrice, openAvailabilityWindow } from "./actions-deep"
import type { BookableListing } from "./server"
import type { AvailabilityDay, DayStatus } from "@/lib/booking/availability"

/* ──────────────────────────────────────────────────────────────────────────
   Booking calendar — month + agenda views over the real availability grid.
   Click a day to block/unblock or set a price override; bulk-open a window.
   Mobile renders an agenda list. Premium, light-token only.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  canManage: boolean
  ready: boolean
  planName: string
  upgradeReason: string | null
  listings: BookableListing[]
  selectedListingId: string | null
  monthStart: string // yyyy-mm-01
  days: AvailabilityDay[]
  basePricePence: number | null
  currency: string
}

const STATUS_STYLE: Record<DayStatus, { dot: string; label: string; cell: string }> = {
  available: { dot: "bg-emerald-400", label: "Available", cell: "bg-white" },
  blocked_manual: { dot: "bg-slate-400", label: "Blocked", cell: "bg-slate-50" },
  blocked_owner: { dot: "bg-amber-400", label: "Owner block", cell: "bg-amber-50/40" },
  blocked_maintenance: { dot: "bg-orange-400", label: "Maintenance", cell: "bg-orange-50/40" },
  blocked_channel: { dot: "bg-violet-400", label: "Channel block", cell: "bg-violet-50/40" },
  booked_direct: { dot: "bg-blue-500", label: "Booked", cell: "bg-blue-50/60" },
  booked_channel: { dot: "bg-indigo-500", label: "Channel booking", cell: "bg-indigo-50/60" },
  pending: { dot: "bg-amber-500", label: "Pending", cell: "bg-amber-50/50" },
  hold: { dot: "bg-slate-300", label: "Hold", cell: "bg-slate-50" },
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function addMonths(monthStart: string, delta: number): string {
  const [y, m] = monthStart.split("-").map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return ymd(d)
}
function monthLabel(monthStart: string): string {
  const [y, m] = monthStart.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

export function BookingCalendarClient({
  canManage,
  ready,
  planName,
  upgradeReason,
  listings,
  selectedListingId,
  monthStart,
  days,
  basePricePence,
  currency,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)
  const [mobileView, setMobileView] = useState<"grid" | "agenda">("grid")
  const [selectedDay, setSelectedDay] = useState<AvailabilityDay | null>(null)
  const [priceInput, setPriceInput] = useState("")

  const dayByDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days])

  const notify = useCallback((kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), 3500)
  }, [])

  function navigate(delta: number) {
    const next = addMonths(monthStart, delta)
    const params = new URLSearchParams()
    if (selectedListingId) params.set("listing", selectedListingId)
    params.set("month", next)
    router.push(`/app/bookings/calendar?${params.toString()}`)
  }

  function selectListing(id: string) {
    const params = new URLSearchParams()
    params.set("listing", id)
    params.set("month", monthStart)
    router.push(`/app/bookings/calendar?${params.toString()}`)
  }

  function toggleBlock(day: AvailabilityDay) {
    if (!selectedListingId) return
    const next = ymd(new Date(new Date(`${day.date}T00:00:00`).getTime() + 86_400_000))
    const block = day.status === "available"
    startTransition(async () => {
      const res = await blockRange(selectedListingId, day.date, next, block)
      if (res.ok) {
        notify("ok", block ? "Date blocked." : "Date opened.")
        router.refresh()
        setSelectedDay(null)
      } else notify("err", res.error ?? "Could not update the date.")
    })
  }

  function applyPriceOverride() {
    if (!selectedListingId || !selectedDay) return
    const pounds = parseFloat(priceInput)
    const pence = priceInput.trim() === "" ? null : Math.round(pounds * 100)
    if (pence != null && (!Number.isFinite(pence) || pence < 0)) {
      notify("err", "Enter a valid price.")
      return
    }
    startTransition(async () => {
      const res = await setDayPrice(selectedListingId, selectedDay.date, pence)
      if (res.ok) {
        notify("ok", pence == null ? "Override cleared." : "Price override set.")
        router.refresh()
        setSelectedDay(null)
        setPriceInput("")
      } else notify("err", res.error ?? "Could not set the price.")
    })
  }

  function openWindow() {
    if (!selectedListingId) return
    startTransition(async () => {
      const res = await openAvailabilityWindow(selectedListingId, monthStart, 90)
      if (res.ok) {
        notify("ok", `Opened ${res.data?.count ?? 0} days.`)
        router.refresh()
      } else notify("err", res.error ?? "Could not open availability.")
    })
  }

  // Build the month grid (Mon-first).
  const grid = useMemo(() => {
    const [y, m] = monthStart.split("-").map(Number)
    const first = new Date(y, m - 1, 1)
    const startOffset = (first.getDay() + 6) % 7 // Mon=0
    const daysInMonth = new Date(y, m, 0).getDate()
    const cells: (AvailabilityDay | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      cells.push(dayByDate.get(date) ?? null)
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [monthStart, dayByDate])

  const today = ymd(new Date())

  if (!canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Calendar" subtitle="Booking management" showBack backHref="/app/bookings" />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={planName} reason={upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  const dayPrice = (d: AvailabilityDay) => d.priceOverridePence ?? basePricePence

  return (
    <DashboardContainer>
      <MobileTopBar title="Calendar" subtitle="Availability & pricing" showBack backHref="/app/bookings" />

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm shadow-xl max-w-sm",
            toast.kind === "ok" ? "bg-slate-900" : "bg-red-600"
          )}
        >
          {toast.kind === "ok" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-4">
        {/* Listing selector */}
        {listings.length === 0 ? (
          <BookingEmptyState
            icon={CalendarDays}
            title="No bookable listings yet"
            description="Create a booking listing to manage its availability and pricing calendar."
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <ListFilter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedListingId ?? ""}
                  onChange={(e) => selectListing(e.target.value)}
                  className="h-9 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 max-w-full"
                >
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openWindow}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Open 90 days
                </button>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl">
                  <button onClick={() => navigate(-1)} className="h-9 w-9 grid place-items-center text-slate-500 hover:text-slate-700">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-800 px-2 min-w-[130px] text-center">
                    {monthLabel(monthStart)}
                  </span>
                  <button onClick={() => navigate(1)} className="h-9 w-9 grid place-items-center text-slate-500 hover:text-slate-700">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile view toggle */}
            <div className="md:hidden flex gap-2">
              {(["grid", "agenda"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setMobileView(v)}
                  className={cn(
                    "flex-1 h-9 rounded-xl text-[13px] font-medium capitalize transition-colors",
                    mobileView === v ? "bg-[#2563EB] text-white" : "bg-white text-slate-600 border border-slate-200"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            {!ready ? (
              <BookingNotReady
                title="Availability not opened yet"
                description="Open a window of dates to start managing availability and pricing for this listing."
              />
            ) : (
              <>
                {/* Month grid (desktop + mobile-grid) */}
                <div className={cn(mobileView === "agenda" && "hidden md:block")}>
                  <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                    <div className="grid grid-cols-7 text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                        <div key={d} className="px-2 py-2.5 text-center">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {grid.map((cell, i) => {
                        if (!cell)
                          return <div key={i} className="aspect-square md:aspect-[4/3] border-b border-r border-slate-50 bg-slate-50/30" />
                        const style = STATUS_STYLE[cell.status]
                        const isToday = cell.date === today
                        const price = dayPrice(cell)
                        const dayNum = Number(cell.date.slice(8, 10))
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedDay(cell)
                              setPriceInput(cell.priceOverridePence != null ? String(cell.priceOverridePence / 100) : "")
                            }}
                            className={cn(
                              "relative aspect-square md:aspect-[4/3] border-b border-r border-slate-50 p-1.5 md:p-2 text-left hover:ring-2 hover:ring-inset hover:ring-blue-300 transition-shadow",
                              style.cell
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={cn(
                                  "text-[12px] font-semibold tabular-nums",
                                  isToday ? "text-[#2563EB]" : "text-slate-700"
                                )}
                              >
                                {dayNum}
                              </span>
                              <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
                            </div>
                            {price != null && cell.status === "available" && (
                              <span className="hidden md:block absolute bottom-1.5 left-2 text-[10.5px] tabular-nums text-slate-500">
                                {fmtMoney(price, currency)}
                                {cell.priceOverridePence != null && <span className="text-[#2563EB]">*</span>}
                              </span>
                            )}
                            {cell.status !== "available" && (
                              <span className="hidden md:block absolute bottom-1.5 left-2 text-[10px] text-slate-400">
                                {style.label}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 px-1">
                    {(["available", "blocked_manual", "booked_direct", "hold"] as DayStatus[]).map((s) => (
                      <span key={s} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className={cn("w-2 h-2 rounded-full", STATUS_STYLE[s].dot)} />
                        {STATUS_STYLE[s].label}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <span className="text-[#2563EB]">*</span> price override
                    </span>
                  </div>
                </div>

                {/* Agenda (mobile) */}
                <div className={cn("md:hidden space-y-2", mobileView === "grid" && "hidden")}>
                  {days.filter((d) => d.date >= today).slice(0, 40).map((d) => {
                    const style = STATUS_STYLE[d.status]
                    const price = dayPrice(d)
                    return (
                      <button
                        key={d.date}
                        onClick={() => {
                          setSelectedDay(d)
                          setPriceInput(d.priceOverridePence != null ? String(d.priceOverridePence / 100) : "")
                        }}
                        className="w-full flex items-center justify-between rounded-xl border border-slate-100 bg-white shadow-sm px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn("w-2 h-2 rounded-full", style.dot)} />
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {new Date(`${d.date}T00:00:00`).toLocaleDateString("en-GB", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                            <p className="text-[11px] text-slate-400">{style.label}</p>
                          </div>
                        </div>
                        {price != null && d.status === "available" && (
                          <span className="text-[13px] tabular-nums text-slate-600">{fmtMoney(price, currency)}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Day editor sheet */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />
          <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {new Date(`${selectedDay.date}T00:00:00`).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className={cn("w-2 h-2 rounded-full", STATUS_STYLE[selectedDay.status].dot)} />
                <span className="text-slate-600">Status: {STATUS_STYLE[selectedDay.status].label}</span>
              </div>

              {(selectedDay.status === "available" || selectedDay.status === "blocked_manual") && (
                <button
                  onClick={() => toggleBlock(selectedDay)}
                  disabled={pending}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {selectedDay.status === "available" ? (
                    <>
                      <Lock className="w-4 h-4" /> Block this date
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" /> Open this date
                    </>
                  )}
                </button>
              )}

              {selectedDay.bookingId && (
                <p className="text-[13px] text-slate-500">
                  This date is occupied by a reservation. Open the reservation to manage it.
                </p>
              )}

              {selectedDay.status === "available" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Price override ({currency})
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      type="number"
                      min="0"
                      step="1"
                      placeholder={basePricePence != null ? String(basePricePence / 100) : "Base price"}
                      className="flex-1 h-10 px-3 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button
                      onClick={applyPriceOverride}
                      disabled={pending}
                      className="h-10 px-4 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Leave blank and save to clear the override and use the base nightly price.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}

export default BookingCalendarClient
