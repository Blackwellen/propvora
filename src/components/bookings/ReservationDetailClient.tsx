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
  LogIn,
  LogOut,
  CreditCard,
  MessageSquare,
  KeyRound,
  ListChecks,
  ClipboardCheck,
  LifeBuoy,
  FileText,
  Clock,
  Receipt,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import {
  BookingStatusBadge,
  FeeBreakdownPanel,
  BookingEmptyState,
  fmtDate,
  fmtMoney,
  statusMeta,
  type FeeLine,
} from "./primitives"
import { confirmReservation, cancelReservation, transitionReservation } from "./actions"
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

type TabKey =
  | "overview" | "guest" | "payments" | "messages" | "checkin" | "tasks"
  | "cleaning" | "issues" | "documents" | "timeline" | "accounting" | "audit"

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: CalendarRange },
  { key: "guest", label: "Guest", icon: User },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "checkin", label: "Check-in", icon: KeyRound },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "cleaning", label: "Cleaning", icon: ClipboardCheck },
  { key: "issues", label: "Issues", icon: LifeBuoy },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "accounting", label: "Accounting", icon: Receipt },
  { key: "audit", label: "Audit", icon: ShieldCheck },
]

export function ReservationDetailClient({ booking: initial }: Props) {
  const router = useRouter()
  const [booking, setBooking] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [tab, setTab] = useState<TabKey>("overview")

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
      } else notify("err", res.error ?? "Could not confirm.")
    })
  }

  function doTransition(target: ReservationStatus, okMsg: string) {
    startTransition(async () => {
      const res = await transitionReservation(booking.id, target)
      if (res.ok) {
        setBooking((b) => ({ ...b, status: target }))
        notify("ok", okMsg)
        router.refresh()
      } else notify("err", res.error ?? "Could not update.")
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
      } else notify("err", res.error ?? "Could not cancel.")
    })
  }

  const canConfirm = booking.status === "hold" || booking.status === "pending"
  const canCheckIn = booking.status === "confirmed"
  const canCheckOut = booking.status === "checked_in"
  const canCancel = booking.status !== "cancelled" && booking.status !== "completed"

  const feeLines: FeeLine[] = [
    { label: `${booking.nights} night${booking.nights === 1 ? "" : "s"}`, pence: booking.subtotalPence },
    { label: "Fees & taxes", pence: booking.feesPence },
  ]

  const currentIdx =
    booking.status === "cancelled" ? -1 : TIMELINE_STAGES.findIndex((s) => s.status === booking.status)
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
      <MobileTopBar title={booking.guestName} subtitle={booking.reference} showBack backHref="/property-manager/bookings" />

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
        <div className="hidden md:flex items-center gap-2 text-sm">
          <Link href="/property-manager/bookings" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
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

          <div className="hidden md:flex items-center gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            {canConfirm && (
              <ActionBtn onClick={doConfirm} pending={pending} icon={CheckCircle2} tone="emerald">
                {pending ? "Working…" : "Confirm reservation"}
              </ActionBtn>
            )}
            {canCheckIn && (
              <ActionBtn onClick={() => doTransition("checked_in", "Guest checked in.")} pending={pending} icon={LogIn} tone="blue">
                Check in
              </ActionBtn>
            )}
            {canCheckOut && (
              <ActionBtn onClick={() => doTransition("checked_out", "Guest checked out.")} pending={pending} icon={LogOut} tone="blue">
                Check out
              </ActionBtn>
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

        {/* Tab bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors shrink-0",
                  active ? "bg-[#2563EB] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
            <div className="space-y-5">
              <Card title="Reservation details">
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
              </Card>

              <Card title="Status timeline">
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
                              <span className={cn("absolute left-[5px] top-3 bottom-0 w-px", done ? "bg-emerald-300" : "bg-slate-200")} />
                            )}
                            <span
                              className={cn(
                                "absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2",
                                done ? "bg-emerald-500 border-emerald-500" : active ? "bg-white border-[#2563EB]" : "bg-white border-slate-300"
                              )}
                            />
                            <p className={cn("text-[13px] font-medium", done ? "text-slate-500" : active ? "text-slate-900 font-semibold" : "text-slate-400")}>
                              {stage.label}
                            </p>
                            {active && <p className="text-[11px] text-[#2563EB] mt-0.5">Current stage</p>}
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-5">
              <FeeBreakdownPanel lines={feeLines} totalPence={booking.totalPence} currency={booking.currency} amountPaidPence={booking.amountPaidPence} />
              {booking.listingId && (
                <Link
                  href={`/property-manager/bookings/listings/${booking.listingId}`}
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
        )}

        {tab === "guest" && (
          <Card title="Guest">
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
            <div className="px-5 pb-4 text-[12px] text-slate-400">
              Guest CRM, identity verification and stay history connect as the guest workspace lands.
            </div>
          </Card>
        )}

        {tab === "payments" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
            <Card title="Payment status">
              <div className="px-5 py-4 space-y-3 text-sm">
                <Row label="Total" value={fmtMoney(booking.totalPence, booking.currency)} />
                <Row label="Captured" value={fmtMoney(booking.amountPaidPence, booking.currency)} />
                <Row label="Balance (indicative)" value={fmtMoney(Math.max(0, booking.totalPence - booking.amountPaidPence), booking.currency)} />
                <p className="text-[12px] text-slate-400 pt-2 border-t border-slate-100">
                  Payment capture, deposits and refunds arrive in a later release. No charge has been taken.
                </p>
              </div>
            </Card>
            <FeeBreakdownPanel lines={feeLines} totalPence={booking.totalPence} currency={booking.currency} amountPaidPence={booking.amountPaidPence} />
          </div>
        )}

        {tab === "checkin" && (
          <Card title="Check-in & checkout">
            <div className="px-5 py-4 space-y-3">
              <Row label="Arrival" value={fmtDate(booking.checkIn)} />
              <Row label="Departure" value={fmtDate(booking.checkOut)} />
              <div className="flex gap-2 pt-2">
                {canCheckIn && (
                  <ActionBtn onClick={() => doTransition("checked_in", "Guest checked in.")} pending={pending} icon={LogIn} tone="blue">
                    Mark checked in
                  </ActionBtn>
                )}
                {canCheckOut && (
                  <ActionBtn onClick={() => doTransition("checked_out", "Guest checked out.")} pending={pending} icon={LogOut} tone="blue">
                    Mark checked out
                  </ActionBtn>
                )}
                {!canCheckIn && !canCheckOut && (
                  <p className="text-[13px] text-slate-400">Check-in actions become available once the reservation is confirmed.</p>
                )}
              </div>
              <p className="text-[12px] text-slate-400 pt-2 border-t border-slate-100">
                Access codes and release gates surface here once the check-in module is wired.
              </p>
            </div>
          </Card>
        )}

        {tab === "timeline" && (
          <Card title="Reservation timeline">
            <div className="px-5 py-4">
              <ol className="relative ml-3">
                <TimelineEvent label="Reservation created" detail={fmtDate(booking.createdAt?.slice(0, 10) ?? null)} done />
                <TimelineEvent label={`Status: ${booking.status}`} detail="Current state" done last />
              </ol>
            </div>
          </Card>
        )}

        {["messages", "tasks", "cleaning", "issues", "documents", "accounting", "audit"].includes(tab) && (
          <BookingEmptyState
            icon={TABS.find((t) => t.key === tab)?.icon ?? MessageSquare}
            title={`${TABS.find((t) => t.key === tab)?.label} — coming with the ops layer`}
            description="This tab is part of the reservation workspace. It will populate with real data as the messaging, tasks, cleaning, claims, documents and accounting modules connect. Nothing is faked here."
          />
        )}
      </div>

      {/* Mobile sticky action bar */}
      {(canConfirm || canCancel || canCheckIn || canCheckOut) && (
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
            <button onClick={doConfirm} disabled={pending} className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold bg-emerald-600 text-white disabled:opacity-60">
              <CheckCircle2 className="w-4 h-4" />
              {pending ? "Working…" : "Confirm"}
            </button>
          )}
          {canCheckIn && (
            <button onClick={() => doTransition("checked_in", "Guest checked in.")} disabled={pending} className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold bg-[#2563EB] text-white disabled:opacity-60">
              <LogIn className="w-4 h-4" />
              Check in
            </button>
          )}
          {canCheckOut && (
            <button onClick={() => doTransition("checked_out", "Guest checked out.")} disabled={pending} className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold bg-[#2563EB] text-white disabled:opacity-60">
              <LogOut className="w-4 h-4" />
              Check out
            </button>
          )}
        </div>
      )}

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
              <button onClick={doCancel} disabled={pending} className="flex-1 h-9 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                {pending ? "Cancelling…" : "Cancel reservation"}
              </button>
              <button onClick={() => setConfirmingCancel(false)} disabled={pending} className="h-9 px-4 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60">
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums font-medium text-slate-700">{value}</span>
    </div>
  )
}

function TimelineEvent({ label, detail, done, last }: { label: string; detail: string; done?: boolean; last?: boolean }) {
  return (
    <li className="relative pl-6 pb-5 last:pb-0">
      {!last && <span className="absolute left-[5px] top-3 bottom-0 w-px bg-emerald-300" />}
      <span className={cn("absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2", done ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300")} />
      <p className="text-[13px] font-medium text-slate-700">{label}</p>
      <p className="text-[11px] text-slate-400">{detail}</p>
    </li>
  )
}

function ActionBtn({
  onClick,
  pending,
  icon: Icon,
  tone,
  children,
}: {
  onClick: () => void
  pending: boolean
  icon: React.ElementType
  tone: "emerald" | "blue"
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60",
        tone === "emerald" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#2563EB] hover:bg-blue-700"
      )}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  )
}

export default ReservationDetailClient
