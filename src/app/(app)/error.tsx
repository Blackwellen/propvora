"use client"

import SectionError from "@/components/system/SectionError"

export default function AppSectionError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SectionError {...props} source="app-section-error-boundary" />
}
