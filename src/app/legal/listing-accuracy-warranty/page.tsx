import type { Metadata } from "next"
import { BookingPolicyPage } from "@/components/legal-marketplace/BookingPolicyPage"

export const metadata: Metadata = {
  title: "Listing Accuracy Warranty | Propvora",
  description: "You warrant your listing is accurate and not misleading. Propvora does not verify listings.",
}

export default function ListingAccuracyWarrantyPage() {
  return <BookingPolicyPage slug="listing-accuracy-warranty" />
}
