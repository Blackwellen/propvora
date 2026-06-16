import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Host / Property Manager Terms | Propvora",
  description: "Terms for hosts and property managers taking direct bookings through Propvora: your responsibilities as the contracting party and your obligations to guests.",
}

export default function HostTermsPage() {
  return <BookingPolicyPage slug="host-terms" />
}
