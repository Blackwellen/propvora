import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Booking Cancellation Policy | Propvora",
  description: "How cancellations work for a stay, the cancellation tiers a host may set, and your statutory cancellation rights.",
}

export default function BookingCancellationPolicyPage() {
  return <BookingPolicyPage slug="booking-cancellation-policy" />
}
