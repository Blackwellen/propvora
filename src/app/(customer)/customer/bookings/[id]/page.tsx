import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ChevronLeft,
  CalendarCheck,
  Users,
  Receipt,
  Info,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  Star,
  Lock,
  CheckCircle2,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { CustomerCard, CustomerStatusBadge } from "@/components/customer/ui"
import { moneyPence, shortDate, humanise, toneForStatus } from "@/components/customer/format"
import {
  requireCustomerContext,
  getCustomerBooking,
  listCustomerBookingIssues,
  getCustomerBookingReview,
} from "@/lib/customer"

export const metadata = { title: "Booking · Propvora" }
export const dynamic = "force-dynamic"

const PAYMENT_LABEL: Record<string, { label: string; tone: "emerald" | "blue" | "amber" | "slate" }> = {
  paid: { label: "Paid", tone: "emerald" },
  deposit_paid: { label: "Deposit paid", tone: "emerald" },
  unpaid: { label: "Payment due", tone: "amber" },
  refunded: { label: "Refunded", tone: "slate" },
  partially_refunded: { label: "Partially refunded", tone: "slate" },
}

function daysUntil(dateIso: string | null): number {
  if (!dateIso) return Infinity
  return Math.round((Date.parse(dateIso) - Date.now()) / 86_400_000)
}

export default async function CustomerBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const booking = await getCustomerBooking(supabase, workspaceId, email, id)
  if (!booking) notFound()

  const [issues, review] = await Promise.all([
    listCustomerBookingIssues(supabase, booking.id),
    getCustomerBookingReview(supabase, booking.id),
  ])

  const title = booking.listing_title ?? (booking.nights ? `${booking.nights} night${booking.nights === 1 ? "" : "s"} stay` : "Your stay")
  const payStatus = booking.payment_status ?? "unpaid"
  const pay = PAYMENT_LABEL[payStatus] ?? PAYMENT_LABEL.unpaid
  const canPay = ["hold", "pending_payment"].includes(booking.status) && payStatus === "unpaid" && (booking.total_pence ?? 0) > 0
  const isPaid = ["paid", "deposit_paid"].includes(payStatus)
  const slug = booking.listing_slug ?? booking.booking_listing_id ?? ""
  const payHref = `/stay/${encodeURIComponent(slug)}/pay?ref=${encodeURIComponent(booking.id)}${booking.booking_ref ? `&hrid=${encodeURIComponent(booking.booking_ref)}` : ""}`
  const checkInReleased =
    ["confirmed", "checked_in"].includes(booking.status) && isPaid && daysUntil(booking.check_in) <= 2
  const reviewUnlocked = ["checked_out", "completed"].includes(booking.status)

  const lines: { label: string; value: string }[] = [
    { label: "Subtotal", value: moneyPence(booking.subtotal_pence, booking.currency) },
  ]
  if (booking.fees_pence && booking.fees_pence > 0) {
    lines.push({ label: "Fees", value: moneyPence(booking.fees_pence, booking.currency) })
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Booking" subtitle={humanise(booking.status)} showBack backHref="/customer/bookings" />

      <div className="hidden md:block">
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to bookings
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight truncate">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {shortDate(booking.check_in)} → {shortDate(booking.check_out)}
              {booking.booking_ref && <span className="text-slate-400"> · {booking.booking_ref}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CustomerStatusBadge tone={toneForStatus(booking.status)} className="text-[12px] px-2.5 py-1">
              {humanise(booking.status)}
            </CustomerStatusBadge>
          </div>
        </div>
      </div>

      {/* Pay balance banner */}
      {canPay && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CreditCard className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Payment outstanding</p>
              <p className="text-[12.5px] text-amber-700">
                Pay {moneyPence(booking.total_pence, booking.currency)} to secure your stay. Funds are held in escrow until check-in.
              </p>
            </div>
          </div>
          <Link
            href={payHref}
            className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#1D4ED8] text-white text-[13.5px] font-semibold hover:bg-[#1A45BE]"
          >
            <Lock className="w-4 h-4" /> Pay now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="space-y-4">
          {/* Stay details */}
          <CustomerCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarCheck className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Stay details</h2>
            </div>
            <dl className="space-y-3.5">
              <DetailRow label="Check-in" value={shortDate(booking.check_in)} />
              <DetailRow label="Check-out" value={shortDate(booking.check_out)} />
              <DetailRow label="Nights" value={booking.nights != null ? String(booking.nights) : "—"} />
              <DetailRow label="Guests" value={booking.guests_count != null ? String(booking.guests_count) : "—"} />
              <DetailRow label="Guest name" value={booking.guest_name ?? "—"} />
              {booking.arrival_time && <DetailRow label="Arrival time" value={booking.arrival_time} />}
              {booking.source && <DetailRow label="Booked via" value={humanise(booking.source)} />}
            </dl>
            <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-400">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              The status above is the live booking state. We never show a stay as confirmed or paid unless it really is.
            </p>
          </CustomerCard>

          {/* Check-in */}
          <CustomerCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Check-in</h2>
            </div>
            {checkInReleased ? (
              <div className="flex items-start gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <p>You&apos;re cleared to check in. The host will share the exact address and access instructions directly.</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-slate-500">
                <Lock className="w-4.5 h-4.5 shrink-0 mt-0.5 text-slate-400" />
                <p>Arrival instructions unlock once your stay is confirmed, paid and your check-in date is near.</p>
              </div>
            )}
          </CustomerCard>

          {/* Issues */}
          <CustomerCard className="p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">Issues</h2>
              </div>
              {booking.booking_ref && (
                <Link href={`/booking/${encodeURIComponent(booking.booking_ref)}`} className="text-[12.5px] font-medium text-[#1D4ED8] hover:underline">
                  Report an issue
                </Link>
              )}
            </div>
            {issues.length === 0 ? (
              <p className="text-sm text-slate-500">No issues reported for this stay.</p>
            ) : (
              <ul className="space-y-2">
                {issues.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-800 truncate">{it.subject}</span>
                      <span className="text-[12px] text-slate-400">{humanise(it.category)} · {shortDate(it.created_at)}</span>
                    </span>
                    <CustomerStatusBadge tone={toneForStatus(it.status)}>{humanise(it.status)}</CustomerStatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </CustomerCard>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <CustomerCard className="p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">Price & payment</h2>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  pay.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : pay.tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {pay.label}
              </span>
            </div>
            <dl className="space-y-2.5">
              {lines.map((l) => (
                <div key={l.label} className="flex items-center justify-between text-sm">
                  <dt className="text-slate-500">{l.label}</dt>
                  <dd className="font-medium text-slate-700">{l.value}</dd>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                <dt className="text-sm font-semibold text-slate-900">Total</dt>
                <dd className="text-base font-bold text-slate-900">{moneyPence(booking.total_pence, booking.currency)}</dd>
              </div>
              {booking.deposit_pence != null && booking.deposit_pence > 0 && (
                <div className="flex items-center justify-between text-[12.5px]">
                  <dt className="text-slate-400">Refundable deposit</dt>
                  <dd className="text-slate-500">{moneyPence(booking.deposit_pence, booking.currency)}</dd>
                </div>
              )}
            </dl>
            {isPaid && (
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" /> Held in escrow until your stay completes.
              </p>
            )}
            {canPay && (
              <Link
                href={payHref}
                className="mt-4 w-full h-10 rounded-xl bg-[#1D4ED8] text-white text-[13.5px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#1A45BE]"
              >
                <Lock className="w-4 h-4" /> Pay {moneyPence(booking.total_pence, booking.currency)}
              </Link>
            )}
          </CustomerCard>

          {/* Review */}
          <CustomerCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Review</h2>
            </div>
            {review ? (
              <div>
                <div className="flex gap-0.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-4 h-4 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                  ))}
                </div>
                {review.title && <p className="text-sm font-semibold text-slate-800">{review.title}</p>}
                {review.body && <p className="text-[12.5px] text-slate-500 mt-0.5">{review.body}</p>}
              </div>
            ) : reviewUnlocked ? (
              <>
                <p className="text-sm text-slate-500 mb-3">How was your stay? Leave a review for the host.</p>
                {booking.booking_ref && (
                  <Link
                    href={`/booking/${encodeURIComponent(booking.booking_ref)}`}
                    className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold"
                  >
                    <Star className="w-4 h-4" /> Write a review
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Reviews unlock once you&apos;ve checked out.</p>
            )}
          </CustomerCard>

          <CustomerCard className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Need help?</h2>
            </div>
            <p className="text-sm text-slate-500 mb-3">Message the host or property manager about this stay.</p>
            <Link
              href="/customer/messages"
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Open messages
            </Link>
          </CustomerCard>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 text-right">{value}</dd>
    </div>
  )
}
