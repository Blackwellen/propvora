import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Review Policy | Propvora",
  description: "How guest and host reviews work, what reviews must and must not contain, and when a review may be removed.",
}

export default function BookingReviewPolicyPage() {
  return <BookingPolicyPage slug="booking-review-policy" />
}
