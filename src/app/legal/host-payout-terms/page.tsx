import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Host Payout Terms | Propvora",
  description: "How host payouts work where Propvora-processed payments are enabled: the payment provider, timing, fees, and that Propvora does not hold your funds as a bank.",
}

export default function HostPayoutTermsPage() {
  return <BookingPolicyPage slug="host-payout-terms" />
}
