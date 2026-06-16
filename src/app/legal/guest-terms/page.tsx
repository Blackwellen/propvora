import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Guest Terms | Propvora",
  description: "Guest Terms: your responsibilities when booking and staying at a property through Propvora, prohibited conduct, and your consumer rights.",
}

export default function GuestTermsPage() {
  return <BookingPolicyPage slug="guest-terms" />
}
