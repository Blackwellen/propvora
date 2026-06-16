import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, CreditCard, Lock } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { CustomerStatusBadge } from "@/components/customer/ui"
import { moneyPence, shortDate, humanise, toneForStatus } from "@/components/customer/format"
import TripDetailTabs from "@/components/customer/TripDetailTabs"
import {
  requireCustomerContext,
  getCustomerBooking,
  listCustomerBookingIssues,
  getCustomerBookingReview,
  getCustomerListingDetail,
  listCustomerLegalDocs,
  listCustomerBookingMessages,
} from "@/lib/customer"
import { sendTripMessageAction } from "./actions"

export const metadata = { title: "Trip · Propvora" }
export const dynamic = "force-dynamic"

function daysUntil(dateIso: string | null): number {
  if (!dateIso) return Infinity
  return Math.round((Date.parse(dateIso) - Date.now()) / 86_400_000)
}

export default async function CustomerBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const booking = await getCustomerBooking(supabase, workspaceId, email, id)
  if (!booking) notFound()

  const [issues, review, listing, legalDocs, messages] = await Promise.all([
    listCustomerBookingIssues(supabase, booking.id),
    getCustomerBookingReview(supabase, booking.id),
    getCustomerListingDetail(supabase, booking.booking_listing_id),
    listCustomerLegalDocs(supabase, booking.id),
    listCustomerBookingMessages(supabase, workspaceId, booking.id),
  ])

  const title = booking.listing_title ?? listing?.title ?? (booking.nights ? `${booking.nights} night${booking.nights === 1 ? "" : "s"} stay` : "Your stay")
  const payStatus = booking.payment_status ?? "unpaid"
  const isPaid = ["paid", "deposit_paid"].includes(payStatus)
  const canPay = ["hold", "pending_payment"].includes(booking.status) && payStatus === "unpaid" && (booking.total_pence ?? 0) > 0
  const slug = booking.listing_slug ?? booking.booking_listing_id ?? ""
  const payHref = `/stay/${encodeURIComponent(slug)}/pay?ref=${encodeURIComponent(booking.id)}${booking.booking_ref ? `&hrid=${encodeURIComponent(booking.booking_ref)}` : ""}`
  const checkInReleased = ["confirmed", "checked_in"].includes(booking.status) && isPaid && daysUntil(booking.check_in) <= 2
  const reviewUnlocked = ["checked_out", "completed"].includes(booking.status)
  const reportIssueHref = `/user/bookings/${booking.id}/report-issue`
  const modifyHref = `/user/bookings/${booking.id}/modify`

  async function handleSend(body: string) {
    "use server"
    await sendTripMessageAction(id, body)
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Trip" subtitle={humanise(booking.status)} showBack backHref="/user/bookings" />

      <div className="hidden md:block">
        <Link
          href="/user/bookings"
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
          <CustomerStatusBadge tone={toneForStatus(booking.status)} className="text-[12px] px-2.5 py-1">
            {humanise(booking.status)}
          </CustomerStatusBadge>
        </div>
      </div>

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

      <TripDetailTabs
        booking={booking}
        listing={listing}
        legalDocs={legalDocs}
        issues={issues}
        review={review}
        messages={messages}
        payHref={payHref}
        canPay={canPay}
        checkInReleased={checkInReleased}
        reviewUnlocked={reviewUnlocked}
        reportIssueHref={reportIssueHref}
        modifyHref={modifyHref}
        sendMessageAction={handleSend}
      />
    </div>
  )
}
