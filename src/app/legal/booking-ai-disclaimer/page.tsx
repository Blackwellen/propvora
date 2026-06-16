import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "AI Use Disclaimer | Propvora",
  description: "How AI assistance is used in the booking product, its limits, and that a human remains responsible for decisions and guest communications.",
}

export default function BookingAiDisclaimerPage() {
  return <BookingPolicyPage slug="booking-ai-disclaimer" />
}
