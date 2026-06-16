"use client"

import SectionError from "@/components/system/SectionError"

export default function LandlordSectionError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SectionError {...props} source="landlord-section-error-boundary" />
}
