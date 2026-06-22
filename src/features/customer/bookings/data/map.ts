// ============================================================================
// Map the REAL `CustomerBooking` (from @/lib/customer/data listCustomerBookings)
// into the customer Bookings UI `Booking` shape. Live data only — no mock.
// Money is integer pence; missing display context degrades to neutral values.
// ============================================================================
import type { CustomerBooking } from "@/lib/customer/types"
import type { Booking, BookingType, BookingStatus, PaymentStatus } from "@/features/customer/data/bookings"

const PLACEHOLDER = "/property-types/holiday.jpg"

function fmtDate(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return ""
  }
}

function mapStatus(s: string, hasDispute: boolean): BookingStatus {
  if (hasDispute) return "Open dispute"
  switch ((s ?? "").toLowerCase()) {
    case "confirmed": return "Confirmed"
    case "completed":
    case "checked_out": return "Completed"
    case "cancelled":
    case "canceled": return "Cancelled"
    case "pending":
    case "pending_payment":
    case "hold":
    case "upcoming": return "Upcoming"
    default: return "Confirmed"
  }
}

function mapPayment(p: string | null): PaymentStatus {
  switch ((p ?? "").toLowerCase()) {
    case "paid": return "Paid"
    case "partially_paid":
    case "partial": return "Partially paid"
    case "refunded": return "Refunded"
    default: return "Unpaid"
  }
}

function mapType(cb: CustomerBooking): BookingType {
  const lt = `${cb.listing_type ?? ""} ${cb.let_type ?? ""}`.toLowerCase()
  if (lt.includes("let") || lt.includes("long") || lt.includes("tenanc") || lt.includes("rent")) return "Let"
  return "Stay"
}

export function mapCustomerBookingToUi(cb: CustomerBooking, opts: { hasDispute?: boolean } = {}): Booking {
  const nights = cb.nights ?? undefined
  const total = cb.total_pence ?? 0
  const subtotal = cb.subtotal_pence ?? total
  const perNight = nights && nights > 0 ? Math.round(subtotal / nights) : undefined
  return {
    id: cb.id,
    ref: cb.booking_ref ?? `PV-${cb.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    property: cb.listing_title ?? "Your booking",
    location: "",
    image: PLACEHOLDER,
    type: mapType(cb),
    checkIn: fmtDate(cb.check_in),
    checkOut: fmtDate(cb.check_out),
    dateRange: cb.check_in && cb.check_out ? `${fmtDate(cb.check_in)} – ${fmtDate(cb.check_out)}` : fmtDate(cb.check_in),
    guests: cb.guests_count ?? 1,
    status: mapStatus(cb.status, Boolean(opts.hasDispute)),
    payment: mapPayment(cb.payment_status),
    totalPence: total,
    host: "",
    hasDispute: opts.hasDispute,
    perNightPence: perNight,
    nights: nights,
    cleaningPence: undefined,
    servicePence: cb.fees_pence ?? undefined,
  }
}
