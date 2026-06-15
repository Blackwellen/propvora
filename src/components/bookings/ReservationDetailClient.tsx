"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Mail,
  User,
  CalendarRange,
  Moon,
  Users,
  Hash,
  Building2,
  Globe,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import {
  BookingStatusBadge,
  FeeBreakdownPanel,
  fmtDate,
  fmtMoney,
  statusMeta,
  STATUS_ORDER,
  type FeeLine,
} from "./primitives"
import { confirmReservation, cancelReservation } from "./actions"
import type { BookingRow, ReservationStatus } from "./server"

interface Props {
  booking: BookingRow
}

const TIMELINE_STAGES: { status: ReservationStatus; label: string }[] = [
  { status: "hold", label: "Hold placed" },
  { status: "pending", label: "Pending approval" },
  { status: "confirmed", label: "Confirmed" },
  { status: "checked_in", label: "Checked in" },
  { status: "checked_out", label: "Checked out" },
  { status: "completed", label: "Completed" },
]

export function ReservationDetailClient({ booking: initial }: Props) {
  const router = useRouter()
  const [booking, setBooking] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  function notify(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), 4500)
  }

  function doConfirm() {
    startTransition(async () => {
      const res = await confirmReservation(booking.id)
      if (res.ok) {
        setBooking((b) => ({ ...b, status: "confirmed" }))
        notify("ok", "Reservation confirmed.")
        router.refresh()
      } else {
        notify("err", res.error ?? "Could not confirm.")
      }
    })
  }

  function doCancel() {
    startTransition(async () => {
      const res = await cancelReservation(booking.id, cancelReason.trim() || undefined)
      if (res.ok) {
        setBooking((b) => ({ ...b, status: "cancelled" }))
        setConfirmingCancel(false)
        notify("ok", "Reservation cancelled. No payment action was taken.")
        router.refresh()
      } else {
        notify("err", res.error ?? "Could not cancel.")
      }
    })
  }

  const canConfirm = booking.status === "hold" || booking.status === "pending"
  const canCancel = booking.status !== "cancelled" && booking.status !== "completed"

  const feeLines: FeeLine[] = [
    { label: `${booking.nights} night${booking.nights === 1 ? "" : "s"}`, pence: booking.subtotalPence },
    { label: "Fees & taxes", pence: booking.feesPence },
  ]

  // Timeline: figure out which stages are done relative to current status.
  const currentIdx =
    booking.status === "cancelled"
      ? -1
      : TIMELINE_STAGES.findIndex((s) => s.status === booking.status)

  const c = statusMeta(booking.status)

  const detailItems = [
    { icon: CalendarRange, label: "Check-in", value: fmtDate(booking.checkIn) },
    { icon: CalendarRange, label: "Check-out", value: fmtDate(booking.checkOut) },
    { icon: Moon, label: "Nights", value: String(booking.nights) },
    { icon: Users, label: "Guests", value: String(booking.guests) },
    { icon: Hash, label: "Reference", value: booking.reference },
    { icon: Globe, label: "Source", value: booking.source },
  ]

  return (
    <DashboardContainer>
      <MobileTopBar title={booking.guestName} subtitle={booking.reference} showBack backHref="/app/bookings" />

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
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        {/* Breadcrumb / back — desktop */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <Link href="/app/bookings" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" />
            Bookings
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">{booking.reference}</span>
        </div>

        {/* Status hero */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 md:px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", c.bg)}>
                <c.icon className={cn("w-6 h-6", c.text)} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">{booking.guestName}</h1>
                <p className="text-sm text-slate-500 truncate">{booking.listingTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookingStatusBadge status={booking.status} />
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {fmtMoney(booking.totalPence, booking.currency)}
              </span>
            </div>
          </div>

          {/* Desktop action bar */}
          <div className="hidden md:flex items-center gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            {canConfirm && (
              <button
                onClick={doConfirm}
                disabled={pending}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                {pending ? "Working…" : "Confirm reservation"}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setConfirmingCancel(true)}
                disabled={pending}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            )}
            {booking.guestEmail && (
              <a
                href={`mailto:${booking.guestEmail}`}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Message guest
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          {/* Left: details + timeline */}
          <div className="space-y-5">
            {/* Trip details */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Reservation details</h3>
              </div>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 px-5 py-4">
                {detailItems.map((d) => (
                  <div key={d.label} className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      <d.icon className="w-3.5 h-3.5" />
                      {d.label}
                    </dt>
                    <dd className="text-sm font-medium text-slate-700 mt-1 truncate capitalize">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Guest */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Guest</h3>
              </div>
              <div className="px-5 py-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{booking.guestName}</p>
                  <p className="text-[13px] text-slate-500 truncate inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {booking.guestEmail ?? "No email on file"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Status timeline</h3>
              </div>
              <div className="px-5 py-4">
                {booking.status === "cancelled" ? (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Reservation cancelled</p>
                      <p className="text-[12px] text-slate-400">No payment or refund action was taken in this release.</p>
                    </div>
                  </div>
                ) : (
                  <ol className="relative ml-3">
                    {TIMELINE_STAGES.map((stage, i) => {
                      const done = i < currentIdx
                      const active = i === currentIdx
                      return (
                        <li key={stage.status} className="relative pl-6 pb-5 last:pb-0">
                          {i < TIMELINE_STAGES.length - 1 && (
                            <span
                              className={cn(
                                "absolute left-[5px] top-3 bottom-0 w-px",
                                done ? "bg-emerald-300" : "bg-slate-200"
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2",
                              done
                                ? "bg-emerald-500 border-emerald-500"
                                : active
                                  ? "bg-white border-[#2563EB]"
                                  : "bg-white border-slate-300"
                            )}
                          />
                          <p
                            className={cn(
                              "text-[13px] font-medium",
                              done ? "text-slate-500" : active ? "text-slate-900 font-semibold" : "text-slate-400"
                            )}
                          >
                            {stage.label}
                          </p>
                          {active && <p className="text-[11px] text-[#2563EB] mt-0.5">Current stage</p>}
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            </div>
          </div>

          {/* Right: price breakdown */}
          <div className="space-y-5">
            <FeeBreakdownPanel
              lines={feeLines}
              totalPence={booking.totalPence}
              currency={booking.currency}
              amountPaidPence={booking.amountPaidPence}
            />
            {booking.listingId && (
              <Link
                href="/app/bookings/listings"
                className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white shadow-sm px-5 py-4 hover:border-slate-200 transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-700 truncate">{booking.listingTitle}</p>
                  <p className="text-[11px] text-slate-400">Manage rates & availability</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      {(canConfirm || canCancel) && (
        <div
          className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 px-4 pt-3 flex items-center gap-2"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
        >
          {canCancel && (
            <button
              onClick={() => setConfirmingCancel(true)}
              disabled={pending}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold bg-white text-red-600 border border-red-200 disabled:opacity-60"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
          {canConfirm && (
            <button
              onClick={doConfirm}
              disabled={pending}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold bg-emerald-600 text-white disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {pending ? "Working…" : "Confirm"}
            </button>
          )}
        </div>
      )}

      {/* Cancel confirmation dialog */}
      {confirmingCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmingCancel(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Cancel reservation?</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-slate-600">
                This marks the reservation as cancelled. No payment, capture or refund is processed in this release —
                handle any monetary settlement separately.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Reason (optional)</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Guest requested cancellation"
                  className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={doCancel}
                disabled={pending}
                className="flex-1 h-9 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {pending ? "Cancelling…" : "Cancel reservation"}
              </button>
              <button
                onClick={() => setConfirmingCancel(false)}
                disabled={pending}
                className="h-9 px-4 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}

export default ReservationDetailClient
