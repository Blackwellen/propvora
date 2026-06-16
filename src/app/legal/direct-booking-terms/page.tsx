import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Direct Booking Terms | Propvora",
  description: "How direct bookings work when you book straight with a host through their own Propvora page rather than a third-party channel.",
}

export default function DirectBookingTermsPage() {
  return <BookingPolicyPage slug="direct-booking-terms" />
}
