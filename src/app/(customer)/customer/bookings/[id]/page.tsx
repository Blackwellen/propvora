import { notFound } from "next/navigation"
import BookingDetailPage from "@/features/customer/bookings/BookingDetailPage"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { getCustomerBooking, listCustomerBookings } from "@/lib/customer/data"
import { mapCustomerBookingToUi } from "@/features/customer/bookings/data/map"

export const metadata = { title: "Booking · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerBookingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, workspaceId, email } = await requireCustomerContext()

  // Accept either a booking id (uuid) or a booking_ref.
  let cb = await getCustomerBooking(supabase, workspaceId, email, id)
  if (!cb) {
    const all = await listCustomerBookings(supabase, workspaceId, email)
    cb = all.find((b) => (b.booking_ref ?? "").toLowerCase() === id.toLowerCase()) ?? null
  }
  if (!cb) notFound()

  return <BookingDetailPage b={mapCustomerBookingToUi(cb)} />
}
