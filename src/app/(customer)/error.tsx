"use client"

import SectionError from "@/components/system/SectionError"

export default function CustomerSectionError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SectionError {...props} source="customer-section-error-boundary" />
}
