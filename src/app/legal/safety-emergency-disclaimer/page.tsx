import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Safety & Emergency Disclaimer | Propvora",
  description: "Important safety information: Propvora does not inspect properties, guests are responsible for their own safety, and what to do in an emergency.",
}

export default function SafetyEmergencyDisclaimerPage() {
  return <BookingPolicyPage slug="safety-emergency-disclaimer" />
}
