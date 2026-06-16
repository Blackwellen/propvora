import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "House Rules Policy | Propvora",
  description: "How a host's House Rules work, the rules a host may set, and the limits on what House Rules can require.",
}

export default function HouseRulesPolicyPage() {
  return <BookingPolicyPage slug="house-rules-policy" />
}
