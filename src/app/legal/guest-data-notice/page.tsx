import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Guest Data Processing Notice | Propvora",
  description: "What guest data is collected for a booking, who acts as controller, how it is shared with the host, and your data rights.",
}

export default function GuestDataNoticePage() {
  return <BookingPolicyPage slug="guest-data-notice" />
}
