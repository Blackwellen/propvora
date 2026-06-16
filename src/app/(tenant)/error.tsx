"use client"

import SectionError from "@/components/system/SectionError"

export default function TenantSectionError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SectionError {...props} source="tenant-section-error-boundary" />
}
