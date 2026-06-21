"use client"

import SectionError from "@/components/system/SectionError"

export default function SupplierSectionError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SectionError {...props} source="supplier-section-error-boundary" />
}
