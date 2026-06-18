import BookingDetailPage from "@/features/customer/bookings/BookingDetailPage"
import { findBooking, bookings } from "@/features/customer/data/bookings"

export const metadata = { title: "Booking · Propvora" }

export default async function CustomerBookingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const booking = findBooking(id) ?? bookings[0]
  return <BookingDetailPage b={booking} />
}
