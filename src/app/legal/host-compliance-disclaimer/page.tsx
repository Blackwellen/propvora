import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Local Compliance Disclaimer | Propvora",
  description: "You are responsible for local short-let licensing, registration, planning and safety rules. Propvora does not verify or guarantee compliance.",
}

export default function HostComplianceDisclaimerPage() {
  return <BookingPolicyPage slug="host-compliance-disclaimer" />
}
