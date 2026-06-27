"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  Loader2,
  CalendarDays,
  MapPin,
  KeyRound,
  AlertTriangle,
  Star,
  CreditCard,
  Lock,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoney, formatDateLabel } from "./format"
import type { GuestTrip } from "@/lib/booking/portal"

type Tab = "trip" | "pay" | "checkin" | "issue" | "review"

const STATUS_TONE: Record<string, { label: string; cls: string }> = {
  hold: { label: "On hold", cls: "bg-amber-50 text-amber-700" },
  pending_payment: { label: "Awaiting payment", cls: "bg-[var(--brand-soft)] text-[var(--brand)]" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-50 text-emerald-700" },
  checked_in: { label: "Checked in", cls: "bg-emerald-50 text-emerald-700" },
  checked_out: { label: "Checked out", cls: "bg-slate-100 text-slate-600" },
  completed: { label: "Completed", cls: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-600" },
  no_show: { label: "No show", cls: "bg-red-50 text-red-600" },
}

/**
 * Magic-link GUEST portal. Resolves a single trip via token (preferred) or
 * ref+email through the SECURITY DEFINER portal RPCs — the guest is anonymous
 * and never reads `bookings` directly. Tabs mirror the customer workspace:
 * trip / pay / check-in (safe-release gated) / report an issue / review
 * (post-checkout). Honest status throughout. Mobile-first.
 */
export default function GuestPortal({
  initialTrip,
  refParam,
  token,
}: {
  initialTrip: GuestTrip | null
  refParam: string | null
  token: string | null
}) {
  const [trip, setTrip] = useState<GuestTrip | null>(initialTrip)
  const [tab, setTab] = useState<Tab>("trip")
  const [email, setEmail] = useState("")
  const [ref, setRef] = useState(refParam ?? "")
  const [loading, setLoading] = useState(false)
  const [gateError, setGateError] = useState<string | null>(null)

  const creds = token ? { token } : { ref: trip?.bookingRef ?? ref, email }

  const refresh = useCallback(async () => {
    const res = await fetch("/api/booking-portal/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(token ? { token } : { ref: trip?.bookingRef ?? ref, email }),
    })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.trip) setTrip(data.trip as GuestTrip)
  }, [token, ref, email, trip?.bookingRef])

  async function handleGate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setGateError(null)
    try {
      const res = await fetch("/api/booking-portal/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: ref.trim(), email: email.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.trip) {
        setGateError(data?.error ?? "We couldn't find a booking with those details.")
        return
      }
      setTrip(data.trip as GuestTrip)
    } catch {
      setGateError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Gate (no trip resolved yet) ─────────────────────────────────────────────
  if (!trip) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-7">
          <div className="w-12 h-12 rounded-full bg-[var(--brand-soft)] flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-[var(--brand-strong)]" />
          </div>
          <h1 className="text-[19px] font-bold text-[#0B1B3F]">Manage your booking</h1>
          <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
            Enter the booking reference from your confirmation and the email you booked with.
          </p>
          <form onSubmit={handleGate} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1">Booking reference</label>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value.toUpperCase())}
                placeholder="PV-XXXXXXXX"
                className="w-full rounded-xl border border-[#D6E0F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--brand-strong)] focus:ring-2 focus:ring-[var(--brand)]/15"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#D6E0F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--brand-strong)] focus:ring-2 focus:ring-[var(--brand)]/15"
              />
            </div>
            {gateError && (
              <p className="text-[12.5px] text-red-600 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" /> {gateError}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || ref.trim().length < 3 || !email.trim()}
              className="w-full h-11 rounded-xl bg-[var(--brand-strong)] text-white text-[14px] font-semibold hover:bg-[#1A45BE] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find my booking"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const tone = STATUS_TONE[trip.status] ?? STATUS_TONE.pending_payment
  const place = [trip.city, trip.country].filter(Boolean).join(", ")
  const canPay = ["hold", "pending_payment"].includes(trip.status) && trip.paymentStatus === "unpaid"
  const reviewUnlocked = ["checked_out", "completed"].includes(trip.status)

  const TABS: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
    { key: "trip", label: "Trip", icon: CalendarDays },
    { key: "pay", label: "Payment", icon: CreditCard },
    { key: "checkin", label: "Check-in", icon: KeyRound },
    { key: "issue", label: "Report issue", icon: AlertTriangle },
    { key: "review", label: "Review", icon: Star },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
      {/* Trip header */}
      <div className="rounded-2xl border border-[#E2EAF6] bg-white overflow-hidden shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
        <div className="px-5 sm:px-6 py-5 border-b border-[#EEF3FB]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[18px] sm:text-[20px] font-bold text-[#0B1B3F] truncate">{trip.listingTitle}</h1>
              {place && (
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {place}
                </p>
              )}
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", tone.cls)}>
              {tone.label}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[13px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              {formatDateLabel(trip.checkIn)} → {formatDateLabel(trip.checkOut)}
            </span>
            <span className="text-slate-400">·</span>
            <span>
              {trip.nights} night{trip.nights === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-slate-400">Reference {trip.bookingRef}</p>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-[#EEF3FB] px-2">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "shrink-0 px-3.5 py-3 text-[13px] font-semibold inline-flex items-center gap-1.5 border-b-2 -mb-px transition-colors",
                  tab === t.key
                    ? "border-[var(--brand-strong)] text-[var(--brand-strong)]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            )
          })}
        </div>

        <div className="p-5 sm:p-6">
          {tab === "trip" && <TripTab trip={trip} onRefresh={refresh} />}
          {tab === "pay" && <PayTab trip={trip} canPay={canPay} />}
          {tab === "checkin" && <CheckinTab trip={trip} creds={creds} />}
          {tab === "issue" && <IssueTab creds={creds} />}
          {tab === "review" && <ReviewTab creds={creds} unlocked={reviewUnlocked} />}
        </div>
      </div>

      <p className="text-center text-[11.5px] text-slate-400 mt-5">
        Powered by <span className="font-semibold text-slate-500">Propvora</span> · Secure direct booking
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-[#F1F5FB] last:border-0">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13.5px] font-medium text-[#0B1B3F] text-right">{value}</span>
    </div>
  )
}

function TripTab({ trip, onRefresh }: { trip: GuestTrip; onRefresh: () => void }) {
  const [cancelling, setCancelling] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const canCancel = ["hold", "pending_payment"].includes(trip.status)

  async function cancel() {
    if (!confirm("Cancel this booking? This can't be undone.")) return
    setCancelling(true)
    setMsg(null)
    try {
      const res = await fetch("/api/booking-portal/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: trip.bookingRef, email: trip.guestEmail }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setMsg("Your booking has been cancelled.")
        onRefresh()
      } else {
        setMsg(data?.error ?? "We couldn't cancel this booking.")
      }
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      <Row label="Guest" value={trip.guestName} />
      <Row label="Guests" value={`${trip.guestsCount}`} />
      {trip.arrivalTime && <Row label="Arrival" value={trip.arrivalTime} />}
      {trip.checkInWindow && <Row label="Check-in window" value={trip.checkInWindow} />}
      {trip.checkoutTime && <Row label="Check-out by" value={trip.checkoutTime} />}
      <Row label="Total" value={formatMoney(trip.totalPence, trip.currency)} />
      {trip.depositPence > 0 && (
        <Row label="Refundable deposit" value={formatMoney(trip.depositPence, trip.currency)} />
      )}
      {msg && <p className="mt-3 text-[12.5px] text-slate-600">{msg}</p>}
      {canCancel && (
        <button
          onClick={cancel}
          disabled={cancelling}
          className="mt-4 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50 disabled:opacity-50"
        >
          {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Cancel
          booking
        </button>
      )}
    </div>
  )
}

function PayTab({ trip, canPay }: { trip: GuestTrip; canPay: boolean }) {
  const paid = ["paid", "deposit_paid"].includes(trip.paymentStatus)
  return (
    <div>
      <div className="rounded-xl bg-[#F7F9FC] border border-[#EEF3FB] px-4 py-3.5 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-slate-500">Amount due</span>
          <span className="text-[16px] font-bold text-[#0B1B3F]">{formatMoney(trip.totalPence, trip.currency)}</span>
        </div>
        {trip.depositPence > 0 && (
          <p className="text-[11.5px] text-slate-400 mt-1.5">
            Plus a refundable {formatMoney(trip.depositPence, trip.currency)} deposit, held and returned after check-out.
          </p>
        )}
      </div>
      {paid ? (
        <p className="text-[13px] text-emerald-700 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Payment received — held securely until your stay.
        </p>
      ) : canPay ? (
        <Link
          href={`/stay/${encodeURIComponent(trip.listingSlug ?? trip.listingId ?? "")}/pay?ref=${encodeURIComponent(trip.bookingId)}&hrid=${encodeURIComponent(trip.bookingRef)}`}
          className="w-full h-11 rounded-xl bg-[var(--brand-strong)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#1A45BE]"
        >
          <Lock className="w-4 h-4" /> Pay securely now
        </Link>
      ) : (
        <p className="text-[13px] text-slate-500">No payment is due on this booking right now.</p>
      )}
      <div className="mt-4 flex items-start gap-2 text-[11.5px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
        Funds are held in escrow and only released to the host after your stay.
      </div>
    </div>
  )
}

function CheckinTab({
  trip,
  creds,
}: {
  trip: GuestTrip
  creds: { token?: string } | { ref?: string; email?: string }
}) {
  const [revealing, setRevealing] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [codeInstructions, setCodeInstructions] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

  async function revealCode() {
    setRevealing(true)
    setCodeError(null)
    try {
      const res = await fetch("/api/booking/keyless/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        code?: string | null
        instructions?: string | null
        error?: string
      }
      if (!res.ok || !data.ok || !data.code) {
        setCodeError(data.error ?? "Your access code isn't available yet.")
        return
      }
      setCode(data.code)
      setCodeInstructions(data.instructions ?? null)
    } catch {
      setCodeError("We couldn't fetch your access code. Please try again.")
    } finally {
      setRevealing(false)
    }
  }

  if (!trip.canCheckIn) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-[15px] font-semibold text-[#0B1B3F]">Check-in details locked</h3>
        <p className="mt-1.5 text-[13px] text-slate-500 max-w-sm mx-auto">
          Your arrival instructions and access details are released once your booking is confirmed, paid, and
          your check-in date is near. Check back closer to {formatDateLabel(trip.checkIn)}.
        </p>
      </div>
    )
  }
  return (
    <div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
        <p className="text-[13px] font-medium text-emerald-800">You&apos;re cleared to check in.</p>
      </div>
      <Row label="Check-in window" value={trip.checkInWindow ?? "See host instructions"} />
      <Row label="Check-out by" value={trip.checkoutTime ?? "As agreed"} />
      <Row label="Arrival time" value={trip.arrivalTime ?? "Not specified"} />

      {/* Keyless access code — safe-release gated server-side */}
      <div className="mt-4 rounded-xl border border-[#EEF3FB] bg-[#F7F9FC] px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0B1B3F] mb-1.5">
          <KeyRound className="w-4 h-4 text-[var(--brand-strong)]" /> Door access code
        </p>
        {code ? (
          <div>
            <p className="text-[26px] font-bold tracking-[0.2em] text-[#0B1B3F]">{code}</p>
            {codeInstructions && (
              <p className="mt-1.5 text-[12.5px] text-slate-600 leading-relaxed whitespace-pre-line">
                {codeInstructions}
              </p>
            )}
            <p className="mt-1.5 text-[11.5px] text-slate-400">
              Keep this private. It only works during your stay window.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[12.5px] text-slate-500 leading-relaxed mb-2.5">
              Your code is released once your payment is confirmed and you&apos;re inside your stay window.
            </p>
            <button
              type="button"
              onClick={revealCode}
              disabled={revealing}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
            >
              {revealing ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {revealing ? "Checking…" : "Reveal my access code"}
            </button>
            {codeError && (
              <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-amber-700">
                <Info className="w-3.5 h-3.5 shrink-0" /> {codeError}
              </p>
            )}
          </>
        )}
      </div>

      <p className="mt-4 text-[12.5px] text-slate-500 leading-relaxed">
        The host will share the exact address directly. Keep your reference{" "}
        <span className="font-semibold text-slate-700">{trip.bookingRef}</span> to hand.
      </p>
    </div>
  )
}

const ISSUE_CATEGORIES = ["access", "cleanliness", "maintenance", "noise", "safety", "billing", "other"]

function IssueTab({ creds }: { creds: { token?: string } | { ref?: string; email?: string } }) {
  const [category, setCategory] = useState("maintenance")
  const [severity, setSeverity] = useState<"low" | "normal" | "urgent">("normal")
  const [subject, setSubject] = useState("")
  const [detail, setDetail] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/booking-portal/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, category, severity, subject: subject.trim(), detail: detail.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) setDone(true)
      else setError(data?.error ?? "Could not send your report.")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-[15px] font-semibold text-[#0B1B3F]">Report sent</h3>
        <p className="mt-1.5 text-[13px] text-slate-500">The host has been notified and will be in touch.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 rounded-xl border border-[#D6E0F0] px-3 text-[14px] outline-none focus:border-[var(--brand-strong)] focus:ring-2 focus:ring-[var(--brand)]/15 bg-white"
          >
            {ISSUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-500 mb-1">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as "low" | "normal" | "urgent")}
            className="w-full h-11 rounded-xl border border-[#D6E0F0] px-3 text-[14px] outline-none focus:border-[var(--brand-strong)] focus:ring-2 focus:ring-[var(--brand)]/15 bg-white"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[12px] font-semibold text-slate-500 mb-1">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary"
          className="w-full rounded-xl border border-[#D6E0F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--brand-strong)] focus:ring-2 focus:ring-[var(--brand)]/15"
        />
      </div>
      <div>
        <label className="block text-[12px] font-semibold text-slate-500 mb-1">Details</label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="What's happening?"
          className="w-full min-h-[90px] rounded-xl border border-[#D6E0F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--brand-strong)] focus:ring-2 focus:ring-[var(--brand)]/15 resize-y"
        />
      </div>
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || subject.trim().length < 2}
        className="w-full h-11 rounded-xl bg-[var(--brand-strong)] text-white text-[14px] font-semibold hover:bg-[#1A45BE] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send report"}
      </button>
    </form>
  )
}

function ReviewTab({
  creds,
  unlocked,
}: {
  creds: { token?: string } | { ref?: string; email?: string }
  unlocked: boolean
}) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!unlocked) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Star className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-[15px] font-semibold text-[#0B1B3F]">Reviews unlock after your stay</h3>
        <p className="mt-1.5 text-[13px] text-slate-500 max-w-sm mx-auto">
          Once you&apos;ve checked out, you&apos;ll be able to rate your stay and leave feedback for the host.
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-[15px] font-semibold text-[#0B1B3F]">Thanks for your review</h3>
        <p className="mt-1.5 text-[13px] text-slate-500">Your feedback helps future guests and the host.</p>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/booking-portal/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, rating, title: title.trim(), body: body.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) setDone(true)
      else setError(data?.error ?? "Could not submit your review.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div>
        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">Your rating</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              className="p-0.5"
            >
              <Star
                className={cn("w-7 h-7 transition-colors", n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300")}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[12px] font-semibold text-slate-500 mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your stay"
          className="w-full rounded-xl border border-[#D6E0F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--brand-strong)] focus:ring-2 focus:ring-[var(--brand)]/15"
        />
      </div>
      <div>
        <label className="block text-[12px] font-semibold text-slate-500 mb-1">Your review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What was great? What could be better?"
          className="w-full min-h-[90px] rounded-xl border border-[#D6E0F0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--brand-strong)] focus:ring-2 focus:ring-[var(--brand)]/15 resize-y"
        />
      </div>
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || rating < 1}
        className="w-full h-11 rounded-xl bg-[var(--brand-strong)] text-white text-[14px] font-semibold hover:bg-[#1A45BE] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit review"}
      </button>
    </form>
  )
}
