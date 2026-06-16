import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Booking Refund Policy | Propvora",
  description: "When and how refunds are issued for a stay, who decides them, and how money is returned to your payment method.",
}

export default function BookingRefundPolicyPage() {
  return <BookingPolicyPage slug="booking-refund-policy" />
}
