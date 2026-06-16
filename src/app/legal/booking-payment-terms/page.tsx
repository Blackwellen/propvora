import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Booking Payment Terms | Propvora",
  description: "How and when you pay for a stay, what the price includes, fees, currency, and who processes the payment.",
}

export default function BookingPaymentTermsPage() {
  return <BookingPolicyPage slug="booking-payment-terms" />
}
