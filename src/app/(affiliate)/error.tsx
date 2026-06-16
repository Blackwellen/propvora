"use client"

import SectionError from "@/components/system/SectionError"

export default function AffiliateSectionError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SectionError {...props} source="affiliate-section-error-boundary" />
}
