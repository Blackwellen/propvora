import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ChevronLeft,
  CalendarCheck,
  Users,
  Receipt,
  Info,
  MessageSquare,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  CustomerCard,
  CustomerStatusBadge,
} from "@/components/customer/ui"
import { moneyPence, shortDate, humanise, toneForStatus } from "@/components/customer/format"
import { requireCustomerContext, getCustomerBooking } from "@/lib/customer"

export const metadata = { title: "Booking · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const booking = await getCustomerBooking(supabase, workspaceId, email, id)
  if (!booking) notFound()

  const lines: { label: string; value: string }[] = [
    { label: "Subtotal", value: moneyPence(booking.subtotal_pence, booking.currency) },
  ]
  if (booking.fees_pence && booking.fees_pence > 0) {
    lines.push({ label: "Fees", value: moneyPence(booking.fees_pence, booking.currency) })
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Booking" subtitle={humanise(booking.status)} showBack backHref="/customer/bookings" />

      {/* Desktop back + header */}
      <div className="hidden md:block">
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to bookings
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              {booking.nights ? `${booking.nights} night${booking.nights === 1 ? "" : "s"} stay` : "Your stay"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {shortDate(booking.check_in)} → {shortDate(booking.check_out)}
            </p>
          </div>
          <CustomerStatusBadge tone={toneForStatus(booking.status)} className="text-[12px] px-2.5 py-1">
            {humanise(booking.status)}
          </CustomerStatusBadge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Stay details */}
        <CustomerCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Stay details</h2>
          </div>
          <dl className="space-y-3.5">
            <DetailRow label="Check-in" value={shortDate(booking.check_in)} />
            <DetailRow label="Check-out" value={shortDate(booking.check_out)} />
            <DetailRow
              label="Nights"
              value={booking.nights != null ? String(booking.nights) : "—"}
            />
            <DetailRow
              label="Guests"
              value={booking.guests_count != null ? String(booking.guests_count) : "—"}
            />
            <DetailRow label="Guest name" value={booking.guest_name ?? "—"} />
            {booking.source && <DetailRow label="Booked via" value={humanise(booking.source)} />}
          </dl>
          <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            The status above is the live booking state. We never show a stay as confirmed or paid unless it really is.
          </p>
        </CustomerCard>

        {/* Price + actions */}
        <div className="space-y-4">
          <CustomerCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Price breakdown</h2>
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
            </dl>
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
