"use client"

import SectionError from "@/components/system/SectionError"

export default function PortalSectionError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SectionError {...props} source="portal-section-error-boundary" />
}
