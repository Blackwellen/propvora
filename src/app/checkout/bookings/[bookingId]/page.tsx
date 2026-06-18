import { BookingCheckout } from "@/features/checkout/screens/BookingCheckout"

export const dynamic = "force-dynamic"

export default async function PublicBookingCheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  return <BookingCheckout bookingId={bookingId} />
}
