import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Booking Terms | Propvora",
  description: "Booking Terms for stays booked through a host's Propvora booking page. Propvora is a software facilitator; your contract for the stay is with the host.",
}

export default function BookingTermsPage() {
  return <BookingPolicyPage slug="booking-terms" />
}
