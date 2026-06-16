import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Insurance Disclaimer | Propvora",
  description: "Propvora does not provide insurance or any host guarantee. You are responsible for arranging your own appropriate cover.",
}

export default function HostInsuranceDisclaimerPage() {
  return <BookingPolicyPage slug="host-insurance-disclaimer" />
}
