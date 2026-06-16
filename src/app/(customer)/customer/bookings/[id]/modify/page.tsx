import { notFound } from "next/navigation"
import ChangeRequestWizard from "@/components/customer/ChangeRequestWizard"
import { requireCustomerContext, getCustomerBooking } from "@/lib/customer"

export const metadata = { title: "Request a change · Propvora" }
export const dynamic = "force-dynamic"

export default async function ModifyBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const booking = await getCustomerBooking(supabase, workspaceId, email, id)
  if (!booking) notFound()

  const title = booking.listing_title ?? (booking.booking_ref ? booking.booking_ref : "Your stay")
  return (
    <ChangeRequestWizard
      bookingId={booking.id}
      bookingTitle={title}
      currentCheckIn={booking.check_in}
      currentCheckOut={booking.check_out}
      currentGuests={booking.guests_count}
    />
  )
}
