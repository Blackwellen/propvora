import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Host Tax Disclaimer | Propvora",
  description: "Propvora is not a tax adviser. You are responsible for your own tax, VAT, tourist taxes and reporting obligations on your letting income.",
}

export default function HostTaxDisclaimerPage() {
  return <BookingPolicyPage slug="host-tax-disclaimer" />
}
